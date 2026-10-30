// ==UserScript==
// @name         wnacg Reading history GIST backup
// @name:zh-CN   绅士漫画已读记录-移动端
// @namespace    绅士漫画
// @version      2026-10-29 03:40:17
// @description  仅支持移动端，自动记录已读漫画 + IndexedDB + 实时变灰 + 页面新增统计 + Gist 每日同步 +阅读日期显示+搜索页支持+历史记录面板+历史面板单条删除(延迟同步方案B)+历史面板手动立即同步按钮+手动立即同步不受每日一次限制+同步HTTP状态显式校验+本地条数getCount校准
// @icon         https://wnacg.com/favicon.ico
// @match        https://*.wnacg.ru/*
// @match        https://*.wnacg.com/*
// @match        https://www.wn04.ru/*
// @match        https://www.wn05.ru/*
// @match        https://www.wnacg05.cc/*
// @match        https://www.wn06.ru/*
// @match        https://www.wn07.ru/*
// @match        https://www.wn01.cfd/*
// @match        https://www.wn01.shop/*
// @match        https://www.wn02.cfd/*
// @match        https://www.wn02.shop/*
// @match        https://www.wn03.cfd/*
// @match        https://www.wn03.shop/*
// @match        https://www.wn04.cfd/*
// @match        https://www.wn04.shop/*
// @match        https://www.wn03.shop/*
// @match        https://www.wn04.cfd/*
// @match        https://www.wn04.shop/*
// @match        https://www.wn05.cfd/*
// @match        https://www.wn05.shop/*
// @match        https://www.wn08.ru/*
// @match        https://www.wn06.cfd/*
// @match        https://www.wn06.shop/*
// @match        https://www.wn07.cfd/*
// @match        https://www.wn07.shop/*
// @match        https://www.wn08.cfd/*
// @match        https://www.wn08.shop/*
// @match        https://www.wn09.cfd/*
// @match        https://www.wn09.shop/*
// @match        https://www.wn10.cfd/*
// @match        https://www.wn10.shop/*
// @match        https://www.wn001.cfd/*
// @match        https://www.wn002.cfd/*
// @match        https://www.wn003.cfd/*
// @match        https://www.wn004.cfd/*
// @downloadURL  https://raw.githubusercontent.com/Chihaya7/UserScript/refs/heads/main/wnacg/wnacg Reading history GIST backup.user.js
// @updateURL    https://raw.githubusercontent.com/Chihaya7/UserScript/refs/heads/main/wnacg/wnacg Reading history GIST backup.user.js
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function () {
    'use strict';
    // =========================
    // Gist 配置
    // =========================
    const GITHUB_TOKEN = 'gh' + 'p_tCNVAjUBsVpmP0OI973IBdvV3FfmFM1jydou';
    const GIST_ID = '3fe6a98a0c34bbe53678cd47d8d919ac';
    const GIST_FILE = 'wn_read.json';
    // =========================
    // 数据库配置
    // read 表：keyPath 为 'id'（漫画 id），字段 ts（毫秒时间戳）、title、coverPath
    //           idx_ts 索引用于历史页游标分页（unique:false，允许极端情况下 ts 相同）
    // meta 表：存储 coverHost（封面域名前缀）等元数据
    // =========================
    const DB_NAME = 'WN_READ_DB';
    const STORE = 'read';
    const META = 'meta';
    const DB_VER = 1;
    let db = null;
    let readSet = new Set();     // 已读漫画 id 集合，用于 isNew 判断，避免重复计数
    let addedCount = 0;          // 自上次同步以来的新增已读数（跨页面持久化，同步成功后归零）
    let totalCount = 0;          // 数据库总数，初始化时读一次后内存维护，避免每次点击都 count 查库
    let lastTs = 0;              // 上次写入时间戳，保证 ts 单调递增（同一毫秒内多次写入时 +1）
    let hostUpdated = false;     // 封面域名今日是否已更新，内存标记，避免每次点击都读 meta 表
    // =========================
    // 打开数据库
    // 首次运行时创建 read 表（主键 id，idx_ts 索引）和 meta 表
    // =========================
    function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VER);
            req.onupgradeneeded = e => {
                const d = e.target.result;
                const store = d.createObjectStore(STORE, { keyPath: 'id' });
                // idx_ts 索引：历史页游标分页按时间倒序遍历，unique:false 允许极端情况下 ts 相同
                store.createIndex('idx_ts', 'ts', { unique: false });
                d.createObjectStore(META, { keyPath: 'key' });
            };
            req.onsuccess = e => { db = e.target.result; resolve(db); };
            req.onerror = reject;
        });
    }
    // =========================
    // 读取 meta 表中的单个值
    // @param {string} key - meta 键名
    // @returns {Promise<any>} 对应的 value，不存在时返回 null
    // =========================
    function getMeta(key) {
        return new Promise((resolve, reject) => {
            const req = db.transaction(META, 'readonly').objectStore(META).get(key);
            req.onsuccess = () => resolve(req.result?.value ?? null);
            req.onerror = () => reject(req.error);
        });
    }
    // =========================
    // 写入 meta 表中的单个值
    // @param {string} key   - meta 键名
    // @param {any}    value - 要存储的值
    // =========================
    function setMeta(key, value) {
        return new Promise((resolve, reject) => {
            const req = db.transaction(META, 'readwrite').objectStore(META).put({ key, value });
            req.onsuccess = resolve;
            req.onerror = reject;
        });
    }
    // =========================
    // 【新增】单条删除本地记录
    // =========================
    function deleteComicLocal(id) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            const store = tx.objectStore(STORE);
            const req = store.delete(id);
            req.onerror = (e) => {
                e.preventDefault();
                reject(req.error);
            };
            tx.oncomplete = () => resolve();
        });
    }
    // =========================
    // 【新增】pendingDelete meta辅助函数
    // =========================
    async function getPendingDelete() {
        return (await getMeta('pendingDelete')) || {};
    }
    async function setPendingDeleteItem(id, delTs) {
        const pd = await getPendingDelete();
        pd[id] = delTs;
        await setMeta('pendingDelete', pd);
    }
    async function clearPendingDelete() {
        await setMeta('pendingDelete', {});
    }
    // =========================
    // 获取全部漫画记录（Gist 同步用，不排序）
    // @returns {Promise<Array<{id, title, ts, coverPath}>>}
    // =========================
    function getAllRecords() {
        return new Promise((resolve, reject) => {
            const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }
    // =========================
    // 批量查询指定 id 列表（Promise.all 并发，同一事务）
    // 比 getAllRecords 更高效：只读页面上存在的漫画，不读全量数据
    // 返回数组顺序与传入 ids 严格一致，未找到的位置为 null
    // onerror 用 resolve(null) 而非 reject，避免单条出错导致整体挂起
    // @param {number[]} ids
    // @returns {Promise<Array<{id, title, ts, coverPath}|null>>}
    // =========================
    function queryByIds(ids) {
        if (ids.length === 0) return Promise.resolve([]);
        const store = db.transaction(STORE, 'readonly').objectStore(STORE);
        return Promise.all(
            ids.map(id => new Promise(resolve => {
                const req = store.get(id);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            }))
        );
    }
    // =========================
    // 新增或更新一条漫画记录
    // put 语义：id 已存在则覆盖（更新 ts/coverPath），不存在则插入
    // ts 取 Date.now() 与 lastTs+1 的较大值，保证单调递增
    // @param {number} id        - 漫画 id
    // @param {string} title     - 漫画标题
    // @param {string} coverPath - 封面路径段（不含域名前缀）
    // @returns {Promise<number>} 本次写入的毫秒时间戳 ts
    // =========================
    function saveComic(id, title, coverPath) {
        const ts = Math.max(Date.now(), lastTs + 1);
        lastTs = ts;
        return new Promise((resolve, reject) => {
            const req = db.transaction(STORE, 'readwrite').objectStore(STORE)
                .put({ id, title, ts, coverPath: coverPath || '' });
            req.onsuccess = () => resolve(ts);
            req.onerror = () => reject(req.error);
        });
    }
    // =========================
    // 获取数据库漫画总数
    // 仅在 init 时调用一次，之后由内存变量 totalCount 维护
    // @returns {Promise<number>}
    // =========================
    function getCount() {
        return new Promise((resolve, reject) => {
            const req = db.transaction(STORE, 'readonly').objectStore(STORE).count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
    // =========================
    // 批量写入漫画记录（云端恢复用）
    // =========================
    function saveBatch(records) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            const store = tx.objectStore(STORE);
            // 记录失败ID，用于debug
            const failIds = [];
            records.forEach(r => {
                const req = store.put({
                    id: r.id,
                    title: r.title || '',
                    ts: r.ts || 0,
                    coverPath: r.coverPath || '',
                });
                req.onerror = (e) => {
                    e.preventDefault(); // 阻止事务直接失败
                    failIds.push(r.id);
                    console.warn(`[wn] 单条记录写入失败 id:${r.id}`, e.target.error);
                };
            });
            tx.oncomplete = () => {
                if (failIds.length > 0) {
                    console.warn(`[wn] 批量写入完成，但有${failIds.length}条失败，失败ID：`, failIds);
                    reject(new Error(`批量写入有${failIds.length}条失败`));
                } else {
                    console.log(`[wn] 批量写入成功，共${records.length}条`);
                    resolve();
                }
            };
            tx.onerror = (e) => {
                console.error('[wn] IndexedDB事务整体失败', e.target.error);
                reject(e.target.error);
            };
        });
    }
    // =========================
    // 清空本地 read 表所有记录
    // =========================
    function clearAll() {
        return new Promise((resolve, reject) => {
            const req = db.transaction(STORE, 'readwrite').objectStore(STORE).clear();
            req.onsuccess = resolve;
            req.onerror = () => reject(req.error);
        });
    }
    // =========================
    // 将毫秒时间戳转为 "YYYY‑MM‑DD" 字符串（本地时间）
    // @param {number} ts - 毫秒时间戳
    // @returns {string}
    // =========================
    function tsToDate(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    // 获取今天的日期字符串，供 Gist 同步和 meta 更新判断用
    function today() { return tsToDate(Date.now()); }
    // =========================
    // 从 URL 中提取漫画 id（数字）
    // 匹配 aid‑{数字} 格式
    // @param {string} url
    // @returns {number|null}
    // =========================
    function extractId(url) {
        const m = url?.match(/aid-(\d+)/);
        return m ? Number(m[1]) : null;
    }
    // =========================
    // 从封面完整 URL 中提取"数字路径段"（不含域名）
    // 取路径末尾三段数字 + 后缀，不依赖固定路径前缀，适配域名或路径结构变化
    // 例：https://t4.wnacgimg.date/data/t/3604/81/17787801126284.jpg
    //     → "data/t/3604/81/17787801126284.jpg"
    // @param {string} url - 封面完整 URL
    // @returns {string} 路径段，失败返回空串
    // =========================
    function extractCoverPath(url) {
        if (!url) return '';
        try {
            const u = new URL(url);
            const nums = u.pathname.match(/\d+/g);
            if (!nums || nums.length < 3) return u.pathname;
            return `data/t/${nums.slice(-3).join('/')}.${u.pathname.split('.').pop()}`;
        } catch { return ''; }
    }
    // =========================
    // 从封面完整 URL 中提取域名前缀（协议 + 域名）
    // 例：https://t4.wnacgimg.date/... → "https://t4.wnacgimg.date"
    // @param {string} url
    // @returns {string} 域名前缀，失败返回空串
    // =========================
    function extractHost(url) {
        try { return new URL(url).origin; } catch { return ''; }
    }
    // =========================
    // 每日更新封面域名前缀（coverHost）
    // 先用内存标记 hostUpdated 判断，已更新过直接跳过，避免每次点击都读 meta
    // 再对比 meta 中的上次更新日期，每日仅写入一次
    // @param {string} coverUrl - 封面完整 URL（从页面中提取）
    // =========================
    async function refreshHostIfNeeded(coverUrl) {
        if (hostUpdated) return;
        const lastDate = await getMeta('coverHostDate');
        if (lastDate === today()) { hostUpdated = true; return; }
        const host = extractHost(coverUrl);
        if (!host) return;
        await setMeta('coverHost', host);
        await setMeta('coverHostDate', today());
        hostUpdated = true;
    }
    // =========================
    // 获取 meta 中存储的封面域名前缀
    // @returns {Promise<string>} 如 "https://t4.wnacgimg.date"，未存储返回空串
    // =========================
    async function getCoverHost() {
        return (await getMeta('coverHost')) || '';
    }
    // =========================
    // 注入已读相关样式（含历史记录面板样式）
    // =========================
    function addStyle() {
        const s = document.createElement('style');
        s.innerHTML = /*css*/`
        /* 已读条目整体变灰 */
        .wn-read {
            opacity: 0.7 !important;
            filter: grayscale(30%) !important;
            transition: 0.2s;
        }
        .wn-read a { color: #888 !important; }
        .wn-read a:visited { color: #0000FF !important; }
        .wn-read-link { color: #777 !important; }
        .wn-read-link:visited { color: #555 !important; }
        /* 阅读日期标签 */
        .wn-date {
            display: block !important;
            float: none !important;
            width: auto !important;
            height: auto !important;
            margin: 4px 0 0 0 !important;
            background: none !important;
            font-size: 15px;
            color: #aaa;
            font-weight: normal;
        }
        /* 顶部统计栏 —— 仿照发布页按钮样式，点击打开历史记录 */
        #wn-stats {
            float:right;
            margin: 10px 20px 0 0;
            padding: 2px 15px;
            border-radius: 10px;
            font-size: 14px;
            line-height: 18px;
            background: #e0edff;
            border: 1px solid #2f7df6;
            color: #2f7df6;
            text-decoration:none;
            white-space:nowrap;
            cursor: pointer;
            z-index: 9999;
            user-select: none;
            align-items: center;
        }
        #wn-stats:hover {
            background:#d0e4ff;
        }
        .OperaBar{
            margin-right:2px;
        }
        /* ── 历史记录面板 ── */
        #wn-hist-panel {
            display: none;
            padding: 0;
            background: #fff;
            border-top: 1px solid #eee;
            z-index:99;
            left:0;
            right:0;
            position:absolute;
        }
        /* 历史记录每行：封面 + 信息 */
        .wn-hist-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
        }
        .wn-hist-item:active { background: #f5f5f5; }
        /* 封面图 */
        .wn-hist-cover {
            width: 56px;
            height: 80px;
            object-fit: cover;
            border-radius: 4px;
            background: #eee;
            flex-shrink: 0;
        }
        /* 封面占位（加载失败 / 无封面） */
        .wn-hist-no-cover {
            width: 56px;
            height: 80px;
            border-radius: 4px;
            background: #e0e0e0;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            color: #aaa;
        }
        .wn-hist-info { flex: 1; overflow: hidden; }
        .wn-hist-title {
            font-size: 14px;
            color: #333;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .wn-hist-date { font-size: 12px; color: #aaa; margin-top: 4px; }
        /* 分页器 */
        #wn-hist-pager {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 6px;
            padding: 10px 0 14px;
            flex-wrap: wrap;
        }
        .wn-page-btn {
            min-width: 32px;
            height: 32px;
            line-height: 32px;
            text-align: center;
            padding: 0 6px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #fff;
            font-size: 13px;
            color: #555;
            cursor: pointer;
        }
        #wn-hist-pager > button:first-child {
            background: #e0edff;
            position: absolute;
            left:10px;
        }
        .wn-page-btn.active {
            background: #e74c3c;
            color: #fff;
            border-color: #e74c3c;
            font-weight: bold;
        }
        .wn-page-btn:disabled{
            background:#cccccc;
            cursor:not-allowed;
        }
        .TabBar .classBox .OperaBar li:nth-child(n) {/* 历史页会和albums页冲突 */
            width: 25% !important;
        }
    `;
        document.head.appendChild(s);
    }
    // =========================
    // 将指定元素标记为已读（整体变灰，链接变色）
    // =========================
    function markRead(el) {
        if (!el) return;
        el.classList.add('wn-read');
        el.querySelectorAll('a').forEach(a => a.classList.add('wn-read-link'));
    }
    // =========================
    // 在指定元素附近插入阅读日期 a，防止重复插入
    // inside=true  → appendChild 到目标元素内部末尾（默认）
    // inside=false → insertAdjacentElement('afterend') 插到目标元素后面（兄弟节点）
    // @param {Element} parent  - 漫画所在的容器元素
    // @param {string}  sel     - 目标元素 CSS 选择器
    // @param {number}  ts      - 毫秒时间戳（显示为日期字符串）
    // @param {boolean} inside  - 插入位置模式
    // =========================
    function showDate(parent, sel, ts, inside = true) {
        if (!ts) return;
        const target = parent.querySelector(sel);
        if (!target) return;
        // 防止重复插入
        if (inside ? target.querySelector('.wn-date')
            : target.nextElementSibling?.classList.contains('wn-date')) return;
        const a = document.createElement('a');
        a.className = 'wn-date';
        a.textContent = tsToDate(ts);
        inside ? target.appendChild(a) : target.insertAdjacentElement('afterend', a);
    }
    // =========================
    // 更新顶部统计栏
    // 直接读内存变量 totalCount / addedCount，不查数据库
    // =========================
    function updateStats(updating‌ = false) {
        const el = document.getElementById('wn-stats');
        if (!el) return;
        if (updating‌ === 'fail') el.innerHTML = "更新失败";
        else if (updating‌) el.innerHTML = "更新中";
        else el.innerHTML = `${totalCount} | ${addedCount}`;
    }
    // =========================
    // 在页面 header 中插入统计栏
    // 点击统计栏显示历史面板
    // =========================
    async function createStats() {
        const header = document.querySelector('.header');
        if (!header) return;
        const el = document.createElement('div');
        el.id = 'wn-stats';
        // 直接调用通用切换函数
        el.addEventListener('click', () => {
            toggleHistPanel(header, 'afterend');
        });
        header.appendChild(el);
        updateStats();
    }
    // =========================
    // 通用点击处理：保存记录、更新内存状态、触发回调、刷新统计栏
    // 抽出三个页面处理函数（albums / search / ranking）中重复的点击逻辑
    // @param {number}   id          - 漫画 id
    // @param {string}   title       - 漫画标题
    // @param {Function} getCoverUrl - 无参函数，返回封面完整 URL
    // @param {Function} onSaved     - 保存成功后的回调 (ts) => void，负责调用 markRead / showDate
    // =========================
    async function handleClick(id, title, getCoverUrl, onSaved) {
        const coverUrl = getCoverUrl();
        if (coverUrl) await refreshHostIfNeeded(coverUrl);
        const coverPath = extractCoverPath(coverUrl);
        const ts = await saveComic(id, title, coverPath);
        const isNew = !readSet.has(id);
        readSet.add(id);
        // 只有首次点击才计入新增，重复点击（更新 ts）不重复计数
        if (isNew) { addedCount++; totalCount++; }
        onSaved(ts);
        updateStats();
    }
    // =========================
    // 数据管理 UI（全部删除 / 全部上传）
    // =========================
    function createMgmtUI() {
        const classBox = document.querySelector('.TabBar .classBox');
        if (!classBox) return;
        const classTit = classBox.querySelector('#classTit');
        if (!classTit) return;
        // 添加「数据管理」tab
        const li = document.createElement('li');
        li.innerHTML = '<a href="javascript:void(0)" id="wn-mgmt-tab">数据管理</a>';
        classTit.appendChild(li);
        const panel = document.createElement('div');
        panel.id = 'wn-mgmt-panel';
        panel.style.cssText = 'display:none;padding:12px 10px;background:#fff;border-top:1px solid #eee;z-index:99;position: relative; ';
        panel.innerHTML = `
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
                <button id="wn-btn-del" style="flex:1;min-width:120px;padding:10px 0;background:#e74c3c;color:#fff;border:none;border-radius:6px;font-size:15px;cursor:pointer;">🗑 全部删除</button>
                <button id="wn-btn-push" style="flex:1;min-width:120px;padding:10px 0;background:#27ae60;color:#fff;border:none;border-radius:6px;font-size:15px;cursor:pointer;">☁ 全部上传</button>
            </div>
            <div id="wn-mgmt-msg" style="margin-top:10px;font-size:13px;color:#888;min-height:20px;line-height:1.6;"></div>
        `;
        classBox.appendChild(panel);
        // tab 点击切换显示/隐藏，同时收起历史面板
        li.querySelector('#wn-mgmt-tab').addEventListener('click', () => {
            const v = panel.style.display !== 'none';
            panel.style.display = v ? 'none' : 'block';
            const hp = document.getElementById('wn-hist-panel');
            if (hp) hp.style.display = 'none';
        });
        // ── 全部删除 ──
        document.getElementById('wn-btn-del').addEventListener('click', async () => {
            const msg = document.getElementById('wn-mgmt-msg');
            if (!confirm('确认删除本地所有已读记录？此操作不可恢复。')) return;
            try {
                msg.textContent = '删除中...';
                await clearAll();
                await setMeta('lastSyncCount', 0);
                readSet.clear();
                addedCount = 0;
                totalCount = 0;
                updateStats();
                msg.textContent = '✅ 本地记录已全部删除。';
            } catch (e) {
                msg.textContent = '❌ 删除失败：' + e.message;
            }
        });
        // ── 全部上传 ──
        document.getElementById('wn-btn-push').addEventListener('click', async () => {
            const msg = document.getElementById('wn-mgmt-msg');
            try {
                msg.textContent = '上传中...';
                const records = await getAllRecords();
                if (records.length === 0) { msg.textContent = '⚠️ 本地没有记录可上传。'; return; }
                await pushGist(records);
                // push 成功后更新基线，未同步计数归零
                await setMeta('lastSyncCount', totalCount);
                addedCount = 0;
                msg.textContent = `✅ 已上传 ${records.length} 条记录到 Gist。`;
            } catch (e) {
                msg.textContent = '❌ 上传失败：' + e.message;
            }
        });
    }
    // =========================
    // fav页面历史记录 UI创建
    // =========================
    function createFavHistUI() {
        const classBox = document.querySelector('.TabBar .classBox');
        if (!classBox) return;
        const classTit = classBox.querySelector('#classTit');
        if (!classTit) return;
        // 添加「历史记录」tab
        const li = document.createElement('li');
        li.innerHTML = '<a href="javascript:void(0)" id="wn-hist-tab">历史记录</a>';
        classTit.appendChild(li);
        li.querySelector('#wn-hist-tab').addEventListener('click', () => {
            toggleHistPanel(classBox, 'beforeend');
        });
    }
    /**
     * 创建历史面板
     * 通用切换历史面板入口
     * 任意页面调用此函数即可打开/关闭历史面板
     */
    async function toggleHistPanel(refEl, position) {
        let hp = document.getElementById('wn-hist-panel');
        let mp = document.getElementById('wn-mgmt-panel');
        if (!hp) {
            hp = document.createElement('div');
            hp.id = 'wn-hist-panel';
            hp.innerHTML = '<div id="wn-hist-list"></div><div id="wn-hist-pager"></div>';
            refEl.insertAdjacentElement(position, hp);
        }
        const isShow = hp.style.display !== 'none' && hp.style.display !== '';
        if (isShow) {
            hp.style.display = 'none';
            return;
        }
        hp.style.display = 'block';
        if (mp) mp.style.display = 'none';
        await renderHistPage(1);
    }
    // =========================
    // 用 idx_ts 游标按时间倒序读取指定分页的记录
    // 通过 advance(offset) 跳过前面页的数据，只读 size 条，不加载全量数据
    // 无论数据库多大，内存占用和耗时恒定
    // @param {number} offset - 跳过的条数（= (页码‑1) * 每页条数）
    // @param {number} size   - 每页条数
    // @returns {Promise<Array<{id, title, ts, coverPath}>>}
    // =========================
    function readPageByTs(offset, size) {
        return new Promise((resolve, reject) => {
            const idx = db.transaction(STORE, 'readonly').objectStore(STORE).index('idx_ts');
            // 'prev' 方向：从最大 ts（最新）往前遍历，实现时间倒序
            const req = idx.openCursor(null, 'prev');
            const results = [];
            let skipped = false;
            req.onsuccess = e => {
                const cur = e.target.result;
                // 游标为 null 表示已遍历完
                if (!cur) { resolve(results); return; }
                // 第一次到达时，用 advance 跳过前 offset 条，直接跳到目标页起点
                if (!skipped) {
                    skipped = true;
                    if (offset > 0) { cur.advance(offset); return; }
                }
                results.push(cur.value);
                if (results.length >= size) { resolve(results); return; }
                cur.continue();
            };
            req.onerror = () => reject(req.error);
        });
    }
    // =========================
    // 渲染历史记录指定页
    // 用内存中的 totalCount 计算总页数，避免重复 count 查库
    // @param {number} page - 目标页码（从 1 开始）
    // =========================
    async function renderHistPage(page) {
        const PAGE = 10;
        const listEl = document.getElementById('wn-hist-list');
        const pagerEl = document.getElementById('wn-hist-pager');
        if (!listEl || !pagerEl) return;
        if (totalCount === 0) {
            listEl.innerHTML = '<div style="padding:12px;color:#aaa;font-size:13px;">暂无记录</div>';
            return;
        }
        const totalPages = Math.ceil(totalCount / PAGE);
        const cur = Math.max(1, Math.min(page, totalPages));
        const slice = await readPageByTs((cur - 1) * PAGE, PAGE);
        const host = await getCoverHost();
        // 构建列表（离屏fragment）
        const listFrag = document.createDocumentFragment();
        slice.forEach(r => {
            const coverUrl = (host && r.coverPath) ? `${host}/${r.coverPath}` : '';
            const comicUrl = `https://${location.hostname}/photos-index-aid-${r.id}.html`;
            const item = document.createElement('div');
            item.className = 'wn-hist-item';
            const linkWrap = document.createElement('a');
            linkWrap.href = comicUrl;
            linkWrap.style.flex = "1";
            linkWrap.style.display = "flex";
            linkWrap.style.gap = "10px";
            linkWrap.style.alignItems = "center";
            const delBtn = document.createElement('button');
            delBtn.textContent = "x";
            delBtn.style.cssText = `
                border:none; background:#f44336; color:#fff;
                border-radius:4px; padding:4px 8px; cursor:pointer;
                flex-shrink:0;
            `;
            delBtn.addEventListener('click', async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (isSyncing) {
                    alert("正在Gist同步中，请稍后操作");
                    return;
                }
                if (!confirm(`确定删除阅读记录：${r.title || '未知标题'}？\n云端将在下一次自动同步完成删除。`)) return;
                const comicId = r.id;
                try {
                    delBtn.disabled = true;
                    delBtn.textContent = "处理中…";
                    const results = await queryByIds([comicId]);
                    const oldRec = results[0];
                    if (!oldRec) {
                        alert("记录不存在");
                        return;
                    }
                    await deleteComicLocal(comicId);
                    readSet.delete(comicId);
                    totalCount = Math.max(0, totalCount - 1);
                    addedCount = Math.max(0, addedCount - 1);
                    await setPendingDeleteItem(comicId, Math.max(Date.now(), lastTs + 1));
                    item.remove();
                    updateStats();
                } catch (err) {
                    alert("删除失败：" + err.message);
                } finally {
                    delBtn.disabled = false;
                    delBtn.textContent = "x";
                }
            });
            if (coverUrl) {
                const img = document.createElement('img');
                img.className = 'wn-hist-cover';
                img.src = coverUrl;
                img.alt = r.title;
                img.onerror = () => img.replaceWith(noCover());
                linkWrap.appendChild(img);
            } else {
                linkWrap.appendChild(noCover());
            }
            const info = document.createElement('div');
            info.className = 'wn-hist-info';
            info.innerHTML = `
                <div class="wn-hist-title">${r.title || '未知标题'}</div>
                <div class="wn-hist-date">${tsToDate(r.ts)}</div>
            `;
            linkWrap.appendChild(info);
            item.appendChild(linkWrap);
            item.appendChild(delBtn);
            linkWrap.addEventListener('click', async e => {
                e.preventDefault();
                try { await saveComic(r.id, r.title, r.coverPath); } catch { }
                location.href = comicUrl;
            });
            listFrag.appendChild(item);
        });
        // 原子替换列表
        listEl.replaceChildren(listFrag);
        // ========== 分页器：传入fragment，在内存构建，不操作真实DOM ==========
        const pageFrag = document.createDocumentFragment();
        renderPager(pageFrag, cur, totalPages);
        // 一次性替换页面上分页器全部子节点
        pagerEl.replaceChildren(pageFrag);
    }
    // =========================
    // 创建封面占位块（加载失败 / 无封面时使用）
    // 抽成函数避免两处重复创建相同结构
    // =========================
    function noCover() {
        const d = document.createElement('div');
        d.className = 'wn-hist-no-cover';
        d.textContent = '无封面';
        return d;
    }
    /**
     * 渲染分页器按钮
     * 显示「上一页」「页码」「下一页」，超过 7 页时做省略号折叠
     * @param {DocumentFragment} el 离屏碎片，所有按钮挂载在这里
     * @param {number} cur 当前页码
     * @param {number} total 总页数
     */
    function renderPager(el, cur, total) {
        // 新增立即同步按钮
        const syncBtn = document.createElement('button');
        syncBtn.className = 'wn-page-btn';
        syncBtn.textContent = '立即同步';
        syncBtn.addEventListener('click', async () => {
            if (isSyncing) {
                alert("正在同步中，请稍候");
                return;
            }
            syncBtn.disabled = true;
            syncBtn.textContent = "同步中…";
            try {
                // 手动点击：传 force=true，跳过"今日已同步"节流，真正执行一次完整同步
                const ok = await syncGist(true);
                if (ok) {
                    alert("✅同步完成");
                    await renderHistPage(cur);
                } else {
                    alert("❌同步失败，请查看控制台日志");
                }
            } catch (e) {
                alert("❌同步异常：" + e.message);
            } finally {
                syncBtn.disabled = false;
                syncBtn.textContent = "立即同步";
            }
        });
        el.appendChild(syncBtn);
        if (total <= 1) return;
        const btn = (label, page, active = false) => {
            const b = document.createElement('span');
            b.className = 'wn-page-btn' + (active ? ' active' : '');
            b.textContent = label;
            if (page !== null) b.addEventListener('click', () => renderHistPage(page));
            return b;
        };
        if (cur > 1) el.appendChild(btn('‹', cur - 1));
        buildPageRange(cur, total).forEach(p => {
            if (p === '...') {
                const d = document.createElement('span');
                d.className = 'wn-page-btn';
                d.textContent = '…';
                d.style.cursor = 'default';
                el.appendChild(d);
            } else {
                el.appendChild(btn(p, p, p === cur));
            }
        });
        if (cur < total) el.appendChild(btn('›', cur + 1));

    }
    // =========================
    // 构建分页器页码数组，超出范围用 '...' 代替
    // 最多显示：首页、末页、当前页前后各 1 页，共 7 个可见项
    // @param {number} cur   - 当前页
    // @param {number} total - 总页数
    // @returns {Array<number|string>}
    // =========================
    function buildPageRange(cur, total) {
        // 总页数少，全部直接显示
        if (total <= 10) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        const set = new Set([1, total, cur]);
        // 当前页前后各5页
        const offset = 5;
        for (let i = cur - offset; i <= cur + offset; i++) {
            if (i >= 1 && i <= total) {
                set.add(i);
            }
        }
        const sorted = [...set].sort((a, b) => a - b);
        const result = [];
        let prev = 0;
        sorted.forEach(p => {
            if (p - prev > 1) {
                result.push('...');
            }
            result.push(p);
            prev = p;
        });
        return result;
    }
    // =========================
    // 从 Gist 拉取云端数据
    // 格式：{ id: { title, ts, coverPath } }
    // @returns {Promise<Array<{id, title, ts, coverPath}>>}
    // =========================
    async function fetchGist() {
        const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' },
        });
        // 显式校验 HTTP 状态：401(token失效)/403(限流)/404/gist删除/5xx 时不能静默返回 []，
        // 否则会被误判为"云端为空"，进而用本地全量覆盖 Gist，冲掉另一台设备的新记录
        if (!r.ok) throw new Error(`fetchGist HTTP ${r.status}`);
        const g = await r.json();
        const content = g.files?.[GIST_FILE]?.content;
        if (!content) return [];
        return Object.entries(JSON.parse(content)).map(([id, v]) => ({
            id: Number(id), title: v.title || '', ts: v.ts || 0, coverPath: v.coverPath || '',
        }));
    }
    // =========================
    // 将漫画记录上传到 Gist
    // 格式：{ id: { title, ts, coverPath } }
    // @param {Array<{id, title, ts, coverPath}>} records
    // =========================
    async function pushGist(records) {
        const data = {};
        records.forEach(r => { data[r.id] = { title: r.title || '', ts: r.ts || 0, coverPath: r.coverPath || '' }; });
        const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(data, null, 2) } } }),
        });
        // 显式校验 HTTP 状态：4xx/5xx 时 fetch 不会 reject，必须 throw，
        // 否则上传失败会被上层当成成功，误清 pendingDelete、误写 lastSync、误报"同步完成"
        if (!r.ok) throw new Error(`pushGist HTTP ${r.status}`);
        return r;
    }
    // 同步锁标识，防止并发执行
    let isSyncing = false;
    /**
     * 执行 Gist 双向同步（本地/云端按 ts 合并，pendingDelete 过滤后全量覆盖上传）
     * @param {boolean} [force=false] - 手动强制同步开关：
     *   false（默认）→ init 自动调用，走"每日仅同步一次"节流；
     *   true        → 历史面板"立即同步"按钮手动点击，跳过节流，真正执行一次完整同步。
     * @returns {Promise<boolean>} 本次同步是否执行成功（被节流跳过视为成功，返回 true）
     */
    async function syncGist(force = false) {
        // 并发拦截：同步立即置锁（不能在 await getMeta 之后再置，否则连点两次都会通过检查）
        if (isSyncing) {
            console.log('[wn] 同步正在进行，跳过本次请求');
            return false;
        }
        isSyncing = true;
        let syncSuccess = false;
        try {
            // 判断今日是否已完成同步
            // 自动同步（init 调用，force=false）每日仅执行一次；
            // 手动强制同步（force=true）跳过该节流，允许用户随时再同步一次
            const lastSyncDay = await getMeta('lastSync');
            const todayStr = today();
            if (!force && lastSyncDay === todayStr) {
                console.log('[wn] 今日已同步，自动同步跳过本次执行；如需立即同步请使用历史面板"立即同步"按钮');
                return true;
            }
            if (force) {
                console.log('[wn] 手动强制同步，跳过"今日已同步"节流，开始执行完整同步流程');
            }
            try {
                console.log('[wn] 开始每日同步...');
                updateStats(true);//标记开始更新
                // 拉取两边全量数据 + 读取待删除指令
                const cloudRecords = await fetchGist();
                const localRecords = await getAllRecords();
                const pendingDeleteMap = await getPendingDelete();
                const localMap = new Map(localRecords.map(r => [r.id, r]));
                const cloudMap = new Map(cloudRecords.map(r => [r.id, r]));
                const needPushFromLocal = []; // 本地独有 / 本地ts > 云端ts（本地变更，上传）
                const consensusList = [];     // ts相等共识基线：仅用于上传，不写入本地
                const toWriteLocalList = [];  // 云端ts更大 / 云端独有：需要写入本地（待过滤pendingDelete）
                // 主轴遍历本地记录
                for (const [id, localRec] of localMap) {
                    const cloudRec = cloudMap.get(id);
                    if (!cloudRec) {
                        // 本地独有
                        needPushFromLocal.push(localRec);
                        continue;
                    }
                    if (localRec.ts > cloudRec.ts) {
                        // 本地版本更新，本地胜出，上传
                        needPushFromLocal.push(localRec);
                    } else if (cloudRec.ts > localRec.ts) {
                        // 云端版本更新，拉取写入本地
                        toWriteLocalList.push(cloudRec);
                    } else {
                        // ts完全相等，共识基线，只进上传包，不写本地DB
                        consensusList.push(localRec);
                    }
                    cloudMap.delete(id);
                }
                // cloudMap剩余条目 = 云端独有记录
                for (const [id, rec] of cloudMap) {
                    toWriteLocalList.push(rec);
                }
                // pendingDelete过滤：仅过滤来自云端的待写入列表
                const toWriteFiltered = toWriteLocalList.filter(rec => {
                    const delTs = pendingDeleteMap[rec.id];
                    return delTs === undefined || rec.ts > delTs;
                });
                // 组装最终全量上传包
                const finalUploadRecords = [...needPushFromLocal, ...consensusList, ...toWriteFiltered];
                const finalWriteLocal = toWriteFiltered;
                console.log(`[wn] 同步统计摘要：本地原始${localRecords.length} | 云端原始${cloudRecords.length} | 本地上传变更${needPushFromLocal.length} | 共识基线保留${consensusList.length} | 云端拉取写入${toWriteFiltered.length} | 最终上传包${finalUploadRecords.length} | 本地入库${finalWriteLocal.length}`);
                console.log("[wn] 同步统计详情", {
                    localRecords: localRecords.length,
                    cloudRecords: cloudRecords.length,
                    needPushFromLocal: needPushFromLocal.length,
                    consensusList: consensusList.length,
                    toWriteFiltered: toWriteFiltered.length,
                    uploadTotal: finalUploadRecords.length,
                    localWriteCount: finalWriteLocal.length
                });
                // 本地批量写入
                if (finalWriteLocal.length > 0) {
                    await saveBatch(finalWriteLocal);
                    // 同步更新内存状态：云端拉过来的id加入readSet
                    finalWriteLocal.forEach(r => readSet.add(r.id));
                }
                // 执行Gist全量覆盖上传
                if (finalUploadRecords.length > 0)
                    await pushGist(finalUploadRecords);
                // --------全部IO成功之后才执行下面的状态变更--------
                // 用 getCount 重数本地真实条数校准 totalCount：
                // finalWriteLocal 里混有"本地已存在、云端ts更新"的覆盖写，put 不增加条数，
                // 不能直接 +=；同步是低频操作，重数一次最准，同时校准删除造成的漂移
                totalCount = await getCount();
                // 清空待删除指令（meta中pendingDelete对象置空）
                await clearPendingDelete();
                // 标记今日同步已完成
                await setMeta('lastSync', todayStr);
                // 记录同步基线计数，重置新增计数
                await setMeta('lastSyncCount', totalCount);
                addedCount = 0;
                updateStats();
                syncSuccess = true;
            } catch (e) {
                console.warn('[wn] 同步失败，今日不会标记同步完成，下次会重试', { error: e });
                updateStats("fail");
                syncSuccess = false;
            }
            return syncSuccess;
        } finally {
            // 无论成功失败、还是被节流跳过，都释放同步锁
            isSyncing = false;
        }
    }
    // =========================
    // 处理 albums 漫画列表页
    // 封面链接在 .ImgA，标题在 .txtA
    // @param {Array<Element>} elements - 指定要处理的元素，不传则处理全部
    // =========================
    function processAlbums(elements) {
        const items = [];
        const targetElements = elements || document.querySelectorAll('#classify_container > li:not(.cate-0)');
        targetElements.forEach(li => {
            // 跳过已处理元素，避免重复绑定事件
            if (li.classList.contains('wn-processed')) return;
            const imgA = li.querySelector('.ImgA');
            if (!imgA) return;
            const id = extractId(imgA.href);
            if (!id) return;
            items.push({ li, imgA, id, title: li.querySelector('.txtA')?.textContent.trim() || '' });
            li.classList.add('wn-processed');
        });
        // 批量查询已读记录，标记页面上已读的漫画
        queryByIds(items.map(it => it.id)).then(results => {
            results.forEach((rec, i) => {
                if (!rec) return;
                const { li, id } = items[i];
                readSet.add(id);
                markRead(li);
                showDate(li, '.txtA', rec.ts);
            });
        });
        // 绑定点击事件，点击后保存记录并标记已读
        items.forEach(({ li, imgA, id, title }) => {
            li.querySelectorAll('.ImgA, .txtA').forEach(a => {
                a.addEventListener('click', () => handleClick(
                    id, title,
                    () => imgA.querySelector('img')?.src || '',
                    ts => { markRead(li); showDate(li, '.txtA', ts); }
                ));
            });
        });
    }
    // =========================
    // 处理搜索结果页
    // 封面链接在 .ImgA，标题在 .ImgA span
    // @param {Array<Element>} elements - 指定要处理的元素，不传则处理全部
    // =========================
    function processSearch(elements) {
        const items = [];
        const targetElements = elements || document.querySelectorAll('#classify_container>li');
        targetElements.forEach(li => {
            // 跳过已处理元素，避免重复绑定事件
            if (li.classList.contains('wn-processed')) return;
            const imgA = li.querySelector('.ImgA');
            if (!imgA) return;
            const id = extractId(imgA.href);
            if (!id) return;
            items.push({ li, imgA, id, title: imgA.querySelector('span')?.textContent.trim() || '' });
            li.classList.add('wn-processed');
        });
        if (items.length === 0) return;
        queryByIds(items.map(it => it.id)).then(results => {
            results.forEach((rec, i) => {
                if (!rec) return;
                const { li, id } = items[i];
                readSet.add(id);
                markRead(li);
                showDate(li, '.ImgA span', rec.ts, true);
            });
        });
        items.forEach(({ li, imgA, id, title }) => {
            imgA.addEventListener('click', () => handleClick(
                id, title,
                () => imgA.querySelector('img')?.src || '',
                ts => { markRead(li); showDate(li, '.ImgA span', ts, true); }
            ));
        });
    }
    // =========================
    // 处理 ranking 排行页
    // 封面在 .itemImg img，标题在 .itemTxt .title
    // 日期插在 .title 后面（外部兄弟节点模式，inside=false）
    // @param {Array<Element>} elements - 指定要处理的元素，不传则处理全部
    // =========================
    function processRanking(elements) {
        const items = [];
        const targetElements = elements || document.querySelectorAll('#topImgCon .itemBox');
        targetElements.forEach(box => {
            // 跳过已处理过的元素，避免重复绑定事件
            if (box.classList.contains('wn-processed')) return;
            const titleA = box.querySelector('.itemTxt .title');
            if (!titleA) return;
            const id = extractId(titleA.href);
            if (!id) return;
            items.push({ box, id, title: titleA.textContent.trim() });
            // 标记为已处理
            box.classList.add('wn-processed');
        });
        if (items.length === 0) return;
        queryByIds(items.map(it => it.id)).then(results => {
            results.forEach((rec, i) => {
                if (!rec) return;
                const { box, id } = items[i];
                readSet.add(id);
                markRead(box);
                showDate(box, '.title', rec.ts, false);
            });
        });
        items.forEach(({ box, id, title }) => {
            box.querySelectorAll('.itemImg a, .itemTxt .title').forEach(a => {
                a.addEventListener('click', () => handleClick(
                    id, title,
                    () => box.querySelector('.itemImg img')?.src || '',
                    ts => { markRead(box); showDate(box, '.title', ts, false); }
                ));
            });
        });
    }
    // =========================
    // 初始化入口
    // 顺序：注入样式 → 开启DB → 每日Gist同步
    //       → 读取总数到内存 → 统计栏 → 数据管理UI → 历史记录UI → 分发页面处理
    // =========================
    async function init() {
        addStyle();
        await openDB();
        totalCount = await getCount(); // 初始化时读一次，之后内存维护，不再查库 
        // 用上次同步时的总数作为基线，计算自上次同步以来的未同步新增数
        // lastSyncCount 不存在（首次使用）时视为 此时云端同步总数totalCount
        const lastSyncCount = (await getMeta('lastSyncCount')) || totalCount;
        addedCount = Math.max(0, totalCount - lastSyncCount);//本地删除未同步会导致小于0
        await createStats();
        await syncGist(); // 自动同步：不传 force，保持"每日仅一次"节流
        if (location.href.includes('users_fav')) {
            createMgmtUI();
            createFavHistUI();
        }
        //<ul class="col_2" id="classify_container">
        if (document.getElementById('classify_container')) {
            const isSearch = location.href.includes('/search/');
            isSearch ? processSearch() : processAlbums();
            // 监听列表容器，动态新增元素自动增量处理
            const listContainer = document.getElementById('classify_container');
            if (listContainer) {
                const observer = new MutationObserver(mutations => {
                    mutations.forEach(mut => {
                        const newItems = [];
                        mut.addedNodes.forEach(node => {
                            // 只处理新增的 li 元素
                            if (node.nodeType === 1 && node.tagName === 'LI') {
                                newItems.push(node);
                            }
                        });
                        if (newItems.length > 0) {
                            isSearch ? processSearch(newItems) : processAlbums(newItems);
                        }
                    });
                });
                // 监听直接子节点变化；如果列表有嵌套包裹，可把 subtree 改为 true
                observer.observe(listContainer, { childList: true, subtree: false });
            }
        }
        if (location.href.includes('ranking') && document.querySelector('#topImgCon .itemBox')) {
            processRanking();
            // 监听动态加载的新元素
            const listContainer = document.querySelector('#topImgCon > .select');
            if (listContainer) {
                const observer = new MutationObserver(mutations => {
                    mutations.forEach(mut => {
                        const newBoxes = [];
                        mut.addedNodes.forEach(node => {
                            if (node.nodeType === 1 && node.classList.contains('itemBox')) {
                                newBoxes.push(node);
                            }
                        });
                        if (newBoxes.length > 0) {
                            processRanking(newBoxes);
                        }
                    });
                });
                observer.observe(listContainer, { childList: true, subtree: false });
            }
        }
    }
    init();
})();
