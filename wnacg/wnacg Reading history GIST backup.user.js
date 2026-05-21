// ==UserScript==
// @name         wnacg Reading history GIST backup
// @name:zh-CN   绅士漫画已读记录-移动端
// @namespace    绅士漫画
// @version      2026年5月21日 04:40:45
// @description  仅支持移动端，自动记录已读漫画 + IndexedDB + 实时变灰 + 页面新增统计 + Gist 每日同步 + 阅读日期显示 + 搜索页支持 + 历史记录页
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
// @downloadURL  https://raw.githubusercontent.com/Chihaya7/UserScript/refs/heads/main/wnacg/wnacg Reading history GIST backup.user.js
// @updateURL    https://raw.githubusercontent.com/Chihaya7/UserScript/refs/heads/main/wnacg/wnacg Reading history GIST backup.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // =========================
    // Gist 配置
    // =========================

    const GITHUB_TOKEN = 'ghp_9br0IC1a3PSuZUPmBpfh' + 'WUpwExfgvX4Jdn1X';
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
    let addedCount = 0;          // 本页新增已读数，显示在统计栏右侧
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
    // add 语义：id 已存在（主键冲突）时跳过，保留本地原有数据
    // @param {Array<{id, title, ts, coverPath}>} records
    // =========================

    function saveBatch(records) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            const store = tx.objectStore(STORE);
            records.forEach(r => {
                const req = store.add({
                    id: r.id, title: r.title || '',
                    ts: r.ts || 0, coverPath: r.coverPath || '',
                });
                // 忽略单条 add 失败（id 重复时主键冲突），不影响其余条目
                req.onerror = () => { };
            });
            tx.oncomplete = resolve;
            tx.onerror = reject;
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
    // 将毫秒时间戳转为 "YYYY-MM-DD" 字符串（本地时间）
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
    // 匹配 aid-{数字} 格式
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

            /* 顶部统计栏 */
            #wn-stats {
                display: flex;
                align-items: center;
                gap: 8px;
                position: absolute;
                left: 115px;
                top: 12px;
                font-size: 13px;
                color: #999;
                z-index: 9999;
                user-select: none;
            }
            #wn-stats span { display: inline-block; line-height: 1; }

            /* ── 历史记录面板 ── */
            #wn-hist-panel {
                display: none;
                padding: 0;
                background: #fff;
                border-top: 1px solid #eee;
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
            .wn-page-btn.active {
                background: #e74c3c;
                color: #fff;
                border-color: #e74c3c;
                font-weight: bold;
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
    // 在指定元素附近插入阅读日期 span，防止重复插入
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
        const span = document.createElement('span');
        span.className = 'wn-date';
        span.textContent = tsToDate(ts);
        inside ? target.appendChild(span) : target.insertAdjacentElement('afterend', span);
    }

    // =========================
    // 更新顶部统计栏
    // 直接读内存变量 totalCount / addedCount，不查数据库
    // =========================

    function updateStats() {
        const el = document.getElementById('wn-stats');
        if (!el) return;
        el.innerHTML = `<span>${totalCount}</span><span>|</span><span>${addedCount}</span>`;
    }

    // =========================
    // 在页面 header 中插入统计栏
    // =========================

    async function createStats() {
        const header = document.querySelector('.header');
        if (!header) return;
        const el = document.createElement('div');
        el.id = 'wn-stats';
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
        const classCon = classBox.querySelector('#classCon');
        if (!classTit || !classCon) return;

        // 添加「数据管理」tab
        const li = document.createElement('li');
        li.innerHTML = '<a href="javascript:void(0)" id="wn-mgmt-tab">数据管理</a>';
        classTit.appendChild(li);

        const panel = document.createElement('div');
        panel.id = 'wn-mgmt-panel';
        panel.style.cssText = 'display:none;padding:12px 10px;background:#fff;border-top:1px solid #eee;';
        panel.innerHTML = `
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
                <button id="wn-btn-del" style="flex:1;min-width:120px;padding:10px 0;background:#e74c3c;color:#fff;border:none;border-radius:6px;font-size:15px;cursor:pointer;">🗑 全部删除</button>
                <button id="wn-btn-push" style="flex:1;min-width:120px;padding:10px 0;background:#27ae60;color:#fff;border:none;border-radius:6px;font-size:15px;cursor:pointer;">☁ 全部上传</button>
            </div>
            <div id="wn-mgmt-msg" style="margin-top:10px;font-size:13px;color:#888;min-height:20px;line-height:1.6;"></div>
        `;
        classCon.appendChild(panel);

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
                msg.textContent = `✅ 已上传 ${records.length} 条记录到 Gist。`;
            } catch (e) {
                msg.textContent = '❌ 上传失败：' + e.message;
            }
        });
    }

    // =========================
    // 历史记录 UI
    // 点击 tab 展开面板，按时间戳倒序显示漫画列表，每页 10 条，含分页器
    // =========================

    function createHistUI() {
        const classBox = document.querySelector('.TabBar .classBox');
        if (!classBox) return;
        const classTit = classBox.querySelector('#classTit');
        const classCon = classBox.querySelector('#classCon');
        if (!classTit || !classCon) return;

        // 添加「历史记录」tab
        const li = document.createElement('li');
        li.innerHTML = '<a href="javascript:void(0)" id="wn-hist-tab">历史记录</a>';
        classTit.appendChild(li);

        // 创建历史面板容器（列表区 + 分页器）
        const panel = document.createElement('div');
        panel.id = 'wn-hist-panel';
        panel.innerHTML = '<div id="wn-hist-list"></div><div id="wn-hist-pager"></div>';
        classCon.appendChild(panel);

        // tab 点击：切换显示/隐藏，每次展开重新加载第 1 页，同时收起数据管理面板
        li.querySelector('#wn-hist-tab').addEventListener('click', () => {
            const v = panel.style.display !== 'none';
            if (v) { panel.style.display = 'none'; return; }
            panel.style.display = 'block';
            const mp = document.getElementById('wn-mgmt-panel');
            if (mp) mp.style.display = 'none';
            renderHistPage(1);
        });
    }

    // =========================
    // 用 idx_ts 游标按时间倒序读取指定分页的记录
    // 通过 advance(offset) 跳过前面页的数据，只读 size 条，不加载全量数据
    // 无论数据库多大，内存占用和耗时恒定
    // @param {number} offset - 跳过的条数（= (页码-1) * 每页条数）
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

        listEl.innerHTML = '<div style="padding:12px;color:#aaa;font-size:13px;">加载中...</div>';
        pagerEl.innerHTML = '';

        if (totalCount === 0) {
            listEl.innerHTML = '<div style="padding:12px;color:#aaa;font-size:13px;">暂无记录</div>';
            return;
        }

        const totalPages = Math.ceil(totalCount / PAGE);
        const cur = Math.max(1, Math.min(page, totalPages));
        const slice = await readPageByTs((cur - 1) * PAGE, PAGE);
        const host = await getCoverHost();

        listEl.innerHTML = '';
        slice.forEach(r => {
            const coverUrl = (host && r.coverPath) ? `${host}/${r.coverPath}` : '';
            const comicUrl = `https://${location.hostname}/photos-index-aid-${r.id}.html`;

            // 行容器：<a> 标签，点击先更新 ts 再跳转
            const item = document.createElement('a');
            item.className = 'wn-hist-item';
            item.href = comicUrl;

            // 封面图或占位块（两处复用 noCover()）
            if (coverUrl) {
                const img = document.createElement('img');
                img.className = 'wn-hist-cover';
                img.src = coverUrl;
                img.alt = r.title;
                img.onerror = () => img.replaceWith(noCover());
                item.appendChild(img);
            } else {
                item.appendChild(noCover());
            }

            const info = document.createElement('div');
            info.className = 'wn-hist-info';
            info.innerHTML = `
                <div class="wn-hist-title">${r.title || '未知标题'}</div>
                <div class="wn-hist-date">${tsToDate(r.ts)}</div>
            `;
            item.appendChild(info);

            // 点击历史条目：更新 ts（使其排到历史最前），然后跳转
            item.addEventListener('click', async e => {
                e.preventDefault();
                try { await saveComic(r.id, r.title, r.coverPath); } catch { }
                location.href = comicUrl;
            });

            listEl.appendChild(item);
        });

        renderPager(pagerEl, cur, totalPages);
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

    // =========================
    // 渲染分页器按钮
    // 显示「上一页」「页码」「下一页」，超过 7 页时做省略号折叠
    // @param {Element} el    - 分页器容器
    // @param {number}  cur   - 当前页码
    // @param {number}  total - 总页数
    // =========================

    function renderPager(el, cur, total) {
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
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        const set = new Set([1, total]);
        for (let i = cur - 1; i <= cur + 1; i++) if (i >= 1 && i <= total) set.add(i);
        const sorted = [...set].sort((a, b) => a - b);
        const result = [];
        let prev = 0;
        sorted.forEach(p => { if (p - prev > 1) result.push('...'); result.push(p); prev = p; });
        return result;
    }

    // =========================
    // 从 Gist 拉取云端数据
    // 格式：{ id: { title, ts, coverPath } }
    // @returns {Promise<Array<{id, title, ts, coverPath}>>}
    // =========================

    function fetchGist() {
        return fetch(`https://api.github.com/gists/${GIST_ID}`, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' },
        })
            .then(r => r.json())
            .then(g => {
                const content = g.files?.[GIST_FILE]?.content;
                if (!content) return [];
                return Object.entries(JSON.parse(content)).map(([id, v]) => ({
                    id: Number(id), title: v.title || '', ts: v.ts || 0, coverPath: v.coverPath || '',
                }));
            });
    }

    // =========================
    // 将漫画记录上传到 Gist
    // 格式：{ id: { title, ts, coverPath } }
    // @param {Array<{id, title, ts, coverPath}>} records
    // =========================

    function pushGist(records) {
        const data = {};
        records.forEach(r => { data[r.id] = { title: r.title || '', ts: r.ts || 0, coverPath: r.coverPath || '' }; });
        return fetch(`https://api.github.com/gists/${GIST_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(data, null, 2) } } }),
        });
    }

    // =========================
    // 每日同步逻辑（Gist ↔ 本地 IndexedDB）
    // 每天第一次打开时执行：
    //   云端独有 → 写入本地，更新 readSet 和 totalCount
    //   本地独有 → 推送合并到云端
    //   一致     → 无操作
    // =========================

    async function syncGist() {
        if (await getMeta('lastSync') === today()) return;
        console.log('[wn] 开始每日同步...');
        try {
            const cloud = await fetchGist();
            const cloudIds = new Set(cloud.map(r => r.id));
            const local = await getAllRecords();
            const localIds = new Set(local.map(r => r.id));

            const fromCloud = cloud.filter(r => !localIds.has(r.id));
            const toCloud = local.filter(r => !cloudIds.has(r.id));

            if (fromCloud.length > 0) {
                await saveBatch(fromCloud);
                fromCloud.forEach(r => readSet.add(r.id));
                totalCount += fromCloud.length; // 同步恢复的条数计入内存总数
            }
            if (toCloud.length > 0) {
                await pushGist([...local, ...fromCloud]);
            }

            await setMeta('lastSync', today());
            console.log(`[wn] 同步完成，本地${localIds.size}，云端${cloudIds.size}`);
        } catch (e) {
            console.warn('[wn] 同步失败', e);
        }
    }

    // =========================
    // 处理 albums 漫画列表页
    // 封面链接在 .ImgA，标题在 .txtA
    // =========================

    function processAlbums() {
        // 收集页面所有漫画条目
        const items = [];
        document.querySelectorAll('li').forEach(li => {
            const imgA = li.querySelector('.ImgA');
            if (!imgA) return;
            const id = extractId(imgA.href);
            if (!id) return;
            items.push({ li, imgA, id, title: li.querySelector('.txtA')?.textContent.trim() || '' });
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
    // =========================

    function processSearch() {
        const items = [];
        document.querySelectorAll('#classify_container li').forEach(li => {
            const imgA = li.querySelector('.ImgA');
            if (!imgA) return;
            const id = extractId(imgA.href);
            if (!id) return;
            items.push({ li, imgA, id, title: imgA.querySelector('span')?.textContent.trim() || '' });
        });

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
    // =========================

    function processRanking() {
        const items = [];
        document.querySelectorAll('#topImgCon .itemBox').forEach(box => {
            const titleA = box.querySelector('.itemTxt .title');
            if (!titleA) return;
            const id = extractId(titleA.href);
            if (!id) return;
            items.push({ box, id, title: titleA.textContent.trim() });
        });

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
        await syncGist();

        totalCount = await getCount(); // 初始化时读一次，之后内存维护，不再查库

        await createStats();
        createMgmtUI();
        createHistUI();

        if (document.querySelector('#classify_container')) {
            (location.href.includes('/search/') || location.href.includes('/q/'))
                ? processSearch()
                : processAlbums();
        }

        if (location.href.includes('ranking') || document.querySelector('#topImgCon .itemBox')) {
            processRanking();
        }
    }
    init();

})();