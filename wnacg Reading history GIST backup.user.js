// ==UserScript==
// @name         wnacg Reading history GIST backup
// @name:zh-CN   绅士漫画已读记录-移动端
// @namespace    绅士漫画
// @version      2026-05-20 03:59:52
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
// @match        https://www.wn05.cfd/*
// @match        https://www.wn05.shop/*
// @match        https://www.wn08.ru/*
// @downloadURL  https://raw.githubusercontent.com/Chihaya7/Database/refs/heads/master/wnacg Reading history GIST backup.user.js
// @updateURL    https://raw.githubusercontent.com/Chihaya7/Database/refs/heads/master/wnacg Reading history GIST backup.user.js
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
    // =========================

    const DB_NAME = 'WN_READ_DB';
    const STORE = 'read';
    const META = 'meta';
    const DB_VER = 1;

    let db = null;
    let readSet = new Set();     // 已读漫画 id 集合
    let addedCount = 0;          // 本页新增已读数（原 currentPageAdded）
    let totalCount = 0;          // 数据库总数，内存维护，避免重复 count 查询
    let lastTs = 0;              // 上次写入时间戳，保证单调递增
    let hostUpdated = false;     // 封面域名今日是否已更新，避免重复读 meta

    // =========================
    // 打开数据库
    // =========================

    function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VER);
            req.onupgradeneeded = e => {
                const d = e.target.result;
                const store = d.createObjectStore(STORE, { keyPath: 'id' });
                store.createIndex('idx_ts', 'ts', { unique: false });
                d.createObjectStore(META, { keyPath: 'key' });
            };
            req.onsuccess = e => { db = e.target.result; resolve(db); };
            req.onerror = reject;
        });
    }

    // =========================
    // meta 表读写
    // =========================

    function getMeta(key) {
        return new Promise((resolve, reject) => {
            const req = db.transaction(META, 'readonly').objectStore(META).get(key);
            req.onsuccess = () => resolve(req.result?.value ?? null);
            req.onerror = () => reject(req.error);
        });
    }

    function setMeta(key, value) {
        return new Promise((resolve, reject) => {
            const req = db.transaction(META, 'readwrite').objectStore(META).put({ key, value });
            req.onsuccess = resolve;
            req.onerror = reject;
        });
    }

    // =========================
    // 获取全部记录（Gist 同步用）
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
    // 返回数组顺序与传入 ids 一致，未找到为 null
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
    // 新增或更新一条记录（put 语义，ts 单调递增）
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
    // 获取数据库总数
    // =========================

    function getCount() {
        return new Promise((resolve, reject) => {
            const req = db.transaction(STORE, 'readonly').objectStore(STORE).count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    // =========================
    // 批量写入（云端恢复用，add 语义，id 冲突跳过）
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
                req.onerror = () => { };
            });
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
    }

    // =========================
    // 清空本地记录
    // =========================

    function clearAll() {
        return new Promise((resolve, reject) => {
            const req = db.transaction(STORE, 'readwrite').objectStore(STORE).clear();
            req.onsuccess = resolve;
            req.onerror = () => reject(req.error);
        });
    }

    // =========================
    // 时间戳 → "YYYY-MM-DD"
    // =========================

    function tsToDate(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function today() { return tsToDate(Date.now()); }

    // =========================
    // 从 URL 提取漫画 id
    // =========================

    function extractId(url) {
        const m = url?.match(/aid-(\d+)/);
        return m ? Number(m[1]) : null;
    }

    // =========================
    // 从封面 URL 提取数字路径段（不含域名）
    // 取末尾三段数字 + 后缀，不依赖固定路径前缀
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
    // 从封面 URL 提取域名前缀
    // =========================

    function extractHost(url) {
        try { return new URL(url).origin; } catch { return ''; }
    }

    // =========================
    // 每日更新封面域名前缀（内存标记避免重复读 meta）
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

    async function getCoverHost() {
        return (await getMeta('coverHost')) || '';
    }

    // =========================
    // 注入样式
    // =========================

    function addStyle() {
        const s = document.createElement('style');
        s.innerHTML = /*css*/`
            .wn-read {
                opacity: 0.7 !important;
                filter: grayscale(30%) !important;
                transition: 0.2s;
            }
            .wn-read a { color: #888 !important; }
            .wn-read a:visited { color: #0000FF !important; }
            .wn-read-link { color: #777 !important; }
            .wn-read-link:visited { color: #555 !important; }

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

            #wn-hist-panel {
                display: none;
                padding: 0;
                background: #fff;
                border-top: 1px solid #eee;
            }
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
            .wn-hist-cover {
                width: 56px;
                height: 80px;
                object-fit: cover;
                border-radius: 4px;
                background: #eee;
                flex-shrink: 0;
            }
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
        `;
        document.head.appendChild(s);
    }

    // =========================
    // 标记元素为已读
    // =========================

    function markRead(el) {
        if (!el) return;
        el.classList.add('wn-read');
        el.querySelectorAll('a').forEach(a => a.classList.add('wn-read-link'));
    }

    // =========================
    // 在指定元素附近插入阅读日期
    // inside=true  → 插入到目标元素内部末尾
    // inside=false → 插入到目标元素后面（兄弟节点）
    // =========================

    function showDate(parent, sel, ts, inside = true) {
        if (!ts) return;
        const target = parent.querySelector(sel);
        if (!target) return;
        if (inside ? target.querySelector('.wn-date')
            : target.nextElementSibling?.classList.contains('wn-date')) return;
        const span = document.createElement('span');
        span.className = 'wn-date';
        span.textContent = tsToDate(ts);
        inside ? target.appendChild(span) : target.insertAdjacentElement('afterend', span);
    }

    // =========================
    // 更新顶部统计栏（使用内存中的 totalCount，不查数据库）
    // =========================

    function updateStats() {
        const el = document.getElementById('wn-stats');
        if (!el) return;
        el.innerHTML = `<span>${totalCount}</span><span>|</span><span>${addedCount}</span>`;
    }

    async function createStats() {
        const header = document.querySelector('.header');
        if (!header) return;
        const el = document.createElement('div');
        el.id = 'wn-stats';
        header.appendChild(el);
        updateStats();
    }

    // =========================
    // 通用点击处理：保存记录、标记已读、更新统计
    // 抽出三个页面处理函数中重复的点击逻辑
    // @param {number}   id         - 漫画 id
    // @param {string}   title      - 漫画标题
    // @param {Function} getCoverUrl - 返回封面完整 URL 的函数
    // @param {Function} onSaved    - 保存成功后的回调 (ts) => void，负责调用 markRead/showDate
    // =========================

    async function handleClick(id, title, getCoverUrl, onSaved) {
        const coverUrl = getCoverUrl();
        if (coverUrl) await refreshHostIfNeeded(coverUrl);
        const coverPath = extractCoverPath(coverUrl);
        const ts = await saveComic(id, title, coverPath);
        const isNew = !readSet.has(id);
        readSet.add(id);
        if (isNew) { addedCount++; totalCount++; }
        onSaved(ts);
        updateStats();
    }

    // =========================
    // 数据管理 UI
    // =========================

    function createMgmtUI() {
        const classBox = document.querySelector('.TabBar .classBox');
        if (!classBox) return;
        const classTit = classBox.querySelector('#classTit');
        const classCon = classBox.querySelector('#classCon');
        if (!classTit || !classCon) return;

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

        li.querySelector('#wn-mgmt-tab').addEventListener('click', () => {
            const v = panel.style.display !== 'none';
            panel.style.display = v ? 'none' : 'block';
            const hp = document.getElementById('wn-hist-panel');
            if (hp) hp.style.display = 'none';
        });

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
    // =========================

    function createHistUI() {
        const classBox = document.querySelector('.TabBar .classBox');
        if (!classBox) return;
        const classTit = classBox.querySelector('#classTit');
        const classCon = classBox.querySelector('#classCon');
        if (!classTit || !classCon) return;

        const li = document.createElement('li');
        li.innerHTML = '<a href="javascript:void(0)" id="wn-hist-tab">历史记录</a>';
        classTit.appendChild(li);

        const panel = document.createElement('div');
        panel.id = 'wn-hist-panel';
        panel.innerHTML = '<div id="wn-hist-list"></div><div id="wn-hist-pager"></div>';
        classCon.appendChild(panel);

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
    // 用 idx_ts 游标倒序读取指定分页
    // =========================

    function readPageByTs(offset, size) {
        return new Promise((resolve, reject) => {
            const idx = db.transaction(STORE, 'readonly').objectStore(STORE).index('idx_ts');
            const req = idx.openCursor(null, 'prev');
            const results = [];
            let skipped = false;
            req.onsuccess = e => {
                const cur = e.target.result;
                if (!cur) { resolve(results); return; }
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

            const item = document.createElement('a');
            item.className = 'wn-hist-item';
            item.href = comicUrl;

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

            item.addEventListener('click', async e => {
                e.preventDefault();
                try { await saveComic(r.id, r.title, r.coverPath); } catch { }
                location.href = comicUrl;
            });

            listEl.appendChild(item);
        });

        renderPager(pagerEl, cur, totalPages);
    }

    function noCover() {
        const d = document.createElement('div');
        d.className = 'wn-hist-no-cover';
        d.textContent = '无封面';
        return d;
    }

    // =========================
    // 分页器
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
    // Gist 操作
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
    // 每日 Gist 同步
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
                totalCount += fromCloud.length;
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
    // 处理 albums 列表页
    // =========================

    function processAlbums() {
        const items = [];
        document.querySelectorAll('li').forEach(li => {
            const imgA = li.querySelector('.ImgA');
            if (!imgA) return;
            const id = extractId(imgA.href);
            if (!id) return;
            items.push({ li, imgA, id, title: li.querySelector('.txtA')?.textContent.trim() || '' });
        });

        queryByIds(items.map(it => it.id)).then(results => {
            results.forEach((rec, i) => {
                if (!rec) return;
                const { li, id } = items[i];
                readSet.add(id);
                markRead(li);
                showDate(li, '.txtA', rec.ts);
            });
        });

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
    // 处理排行页
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
    // 初始化
    // =========================

    async function init() {
        addStyle();
        await openDB();
        await syncGist();

        totalCount = await getCount(); // 初始化时读一次，之后内存维护

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