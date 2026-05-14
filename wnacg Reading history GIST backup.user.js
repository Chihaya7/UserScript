// ==UserScript==
// @name         wnacg Reading history GIST backup
// @name:zh-CN   绅士漫画已读记录-移动端
// @namespace    绅士漫画
// @version      2026-05-14 17:49:22
// @description  仅支持移动端，自动记录已读漫画 + IndexedDB + 实时变灰 + 页面新增统计 + Gist 每日同步 + 阅读日期显示 + 搜索页支持
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
    const STORE_NAME = 'read';
    const META_STORE = 'meta';
    const DB_VERSION = 2;

    let db = null;

    // 内存 Map，key 为漫画 id，value 为 { title, date }
    let readMap = new Map();

    // 当前页面本次新增已读数量
    let currentPageAdded = 0;

    // =========================
    // 打开数据库
    // 版本 2 起新增 meta store 用于存储同步日期等元数据
    // =========================

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = function (event) {
                db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(META_STORE)) {
                    db.createObjectStore(META_STORE, { keyPath: 'key' });
                }
            };
            request.onsuccess = function (event) {
                db = event.target.result;
                resolve(db);
            };
            request.onerror = reject;
        });
    }

    // =========================
    // 读取 meta store 中的值
    // =========================

    function getMetaValue(key) {
        return new Promise((resolve, reject) => {
            const store = db.transaction(META_STORE, 'readonly').objectStore(META_STORE);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result?.value ?? null);
            req.onerror = () => reject(req.error);
        });
    }

    // =========================
    // 写入 meta store 中的值
    // =========================

    function setMetaValue(key, value) {
        return new Promise((resolve, reject) => {
            const store = db.transaction(META_STORE, 'readwrite').objectStore(META_STORE);
            const req = store.put({ key, value });
            req.onsuccess = resolve;
            req.onerror = reject;
        });
    }

    // =========================
    // 获取全部漫画记录
    // 返回 [{id, title, date}, ...]
    // =========================

    function getAllRecords() {
        return new Promise((resolve, reject) => {
            const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    // =========================
    // 获取数据库漫画总数量
    // =========================

    function getTotalCount() {
        return new Promise((resolve, reject) => {
            const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
            const req = store.count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    // =========================
    // 写入单条漫画记录（含阅读日期）
    // put 语义：已存在则覆盖，不存在则插入
    // =========================

    function saveComic(id, title, date) {
        return new Promise((resolve, reject) => {
            const store = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME);
            const req = store.put({ id, title, date });
            req.onsuccess = resolve;
            req.onerror = reject;
        });
    }

    // =========================
    // 批量写入漫画记录（云端恢复用）
    // 使用 add 而非 put，已存在的 id 会被跳过，保留本地原有数据
    // =========================

    function saveComicsBatch(records) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            records.forEach(r => store.add({
                id: r.id,
                title: r.title || '',
                date: r.date || '',
            }));
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
    }

    // =========================
    // 从 URL 中提取漫画 id
    // 匹配 aid-{数字} 格式
    // =========================

    function extractId(url) {
        if (!url) return null;
        const match = url.match(/aid-(\d+)/);
        return match ? Number(match[1]) : null;
    }

    // =========================
    // 获取今天的日期字符串（本地时间）
    // 格式：YYYY-MM-DD
    // =========================

    function getTodayStr() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    // =========================
    // 注入已读相关样式
    // =========================

    function addReadStyle() {
        const style = document.createElement('style');
        style.innerHTML = /*css*/`
            /* 已读条目整体变灰 */
            .wn-read {
                opacity: 0.7 !important;
                filter: grayscale(30%) !important;
                transition: 0.2s;
            }
            .wn-read a { color: #888 !important; }
            .wn-read a:visited { color:#0000FF !important; }
            .wn-read-link { color: #777 !important; }
            .wn-read-link:visited { color: #555 !important; }

            /* 阅读日期标签 */
            .wn-read-date {
                display: block !important;
                float: none !important;
                width: auto !important;
                height: auto !important;
                margin: 4px 0 0 0 !important;
                background: none !important;
                background-size: unset !important;
                font-size: 15px;
                color: #aaa;
                font-weight: normal;
            }

            /* 顶部统计栏 */
            #wn-read-stats {
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
            #wn-read-stats span { display: inline-block; line-height: 1; }
        `;
        document.head.appendChild(style);
    }

    // =========================
    // 将指定元素标记为已读
    // 添加 wn-read class，并对内部所有 a 标签添加 wn-read-link
    // =========================

    function markAsRead(element) {
        if (!element) return;
        element.classList.add('wn-read');
        element.querySelectorAll('a').forEach(a => a.classList.add('wn-read-link'));
    }

    // =========================
    // 在指定元素附近插入阅读日期 span
    // inside=true  → appendChild 插入目标元素内部末尾（albums/搜索页标题内）
    // inside=false → insertAdjacentElement('afterend') 插入目标元素后面（ranking页）
    // 两种模式各自做重复插入检查
    // =========================

    function showReadDate(parent, selector, date, inside = true) {
        //showReadDate(li, '.ImgA', readMap.get(id).date, false);
        if (!date) return;
        const target = parent.querySelector(selector);
        if (!target) return;
        if (inside ? target.querySelector('.wn-read-date')
            : target.nextElementSibling?.classList.contains('wn-read-date')) return;
        const span = document.createElement('span');
        span.className = 'wn-read-date';
        span.textContent = date;
        inside ? target.appendChild(span) : target.insertAdjacentElement('afterend', span);
    }

    // =========================
    // 更新顶部统计栏显示
    // 格式：总已读数 | 本页新增数
    // =========================

    async function updateHeaderStats() {
        const total = await getTotalCount();
        const stats = document.getElementById('wn-read-stats');
        if (!stats) return;
        stats.innerHTML = `
            <span>${total}</span>
            <span>|</span>
            <span>${currentPageAdded}</span>
        `;
    }

    // =========================
    // 在页面 header 中插入统计栏
    // =========================

    async function createHeaderStats() {
        const header = document.querySelector('.header');
        if (!header) return;
        const stats = document.createElement('div');
        stats.id = 'wn-read-stats';
        header.appendChild(stats);
        await updateHeaderStats();
    }

    // =========================
    // 从 Gist 拉取云端数据
    // 返回 [{id, title, date}, ...]
    // 兼容三种历史格式：
    //   纯数组 [id, ...]
    //   旧对象 { id: title }
    //   新对象 { id: { title, date } }
    // =========================

    function fetchGist() {
        return fetch(`https://api.github.com/gists/${GIST_ID}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        })
            .then(r => r.json())
            .then(gist => {
                const content = gist.files?.[GIST_FILE]?.content;
                if (!content) return [];
                const data = JSON.parse(content);
                if (Array.isArray(data)) {
                    return data.map(id => ({ id: Number(id), title: '', date: '' }));
                }
                return Object.entries(data).map(([id, val]) => {
                    if (typeof val === 'string') {
                        return { id: Number(id), title: val, date: '' };
                    }
                    return { id: Number(id), title: val.title || '', date: val.date || '' };
                });
            });
    }

    // =========================
    // 将漫画记录上传到 Gist
    // 存储格式：{ id: { title, date } }
    // =========================

    function pushGist(records) {
        const data = {};
        records.forEach(r => {
            data[r.id] = { title: r.title || '', date: r.date || '' };
        });
        return fetch(`https://api.github.com/gists/${GIST_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                files: {
                    [GIST_FILE]: { content: JSON.stringify(data, null, 2) },
                },
            }),
        });
    }

    // =========================
    // 检查今天是否已经同步过
    // =========================

    async function hasSyncedToday() {
        const val = await getMetaValue('lastSyncDate');
        return val === getTodayStr();
    }

    // =========================
    // 将今天标记为已同步
    // =========================

    function markSyncedToday() {
        return setMetaValue('lastSyncDate', getTodayStr());
    }

    // =========================
    // 核心：每日同步逻辑
    // 每天第一次打开时执行，比较本地与云端差异：
    //   云端独有 → 写入本地并更新内存
    //   本地独有 → 上传并集到云端
    //   完全一致 → 不做操作
    // 同步失败不影响脚本正常运行
    // =========================

    async function syncWithGist() {
        if (await hasSyncedToday()) return;

        console.log('[wn-read] 开始每日同步...');

        try {
            const cloudRecords = await fetchGist();
            const cloudSet = new Set(cloudRecords.map(r => r.id));

            const localRecords = await getAllRecords();
            const localSet = new Set(localRecords.map(r => r.id));

            const onlyInCloud = cloudRecords.filter(r => !localSet.has(r.id));
            const onlyInLocal = localRecords.filter(r => !cloudSet.has(r.id));

            console.log(`[wn-read] 本地 ${localSet.size} 条，云端 ${cloudSet.size} 条，`
                + `云端独有 ${onlyInCloud.length} 条，本地独有 ${onlyInLocal.length} 条`);

            if (onlyInCloud.length > 0) {
                await saveComicsBatch(onlyInCloud);
                onlyInCloud.forEach(r => readMap.set(r.id, { title: r.title, date: r.date }));
                console.log(`[wn-read] 从云端恢复 ${onlyInCloud.length} 条`);
            }

            if (onlyInLocal.length > 0) {
                const merged = [...localRecords, ...onlyInCloud];
                await pushGist(merged);
                console.log(`[wn-read] 上传备份，共 ${merged.length} 条`);
            }

            if (onlyInCloud.length === 0 && onlyInLocal.length === 0) {
                console.log('[wn-read] 数据一致，无需操作');
            }

            await markSyncedToday();
            console.log('[wn-read] 同步完成');

        } catch (e) {
            console.warn('[wn-read] 同步失败', e);
        }
    }

    // =========================
    // 处理 albums 漫画列表页
    // 选取 li，标题在 .txtA
    // =========================

    function processAlbumsPage() {
        document.querySelectorAll('li').forEach(li => {
            const imgA = li.querySelector('.ImgA');
            if (!imgA) return;
            const id = extractId(imgA.href);
            const title = li.querySelector('.txtA')?.textContent.trim() || '';
            if (!id) return;

            if (readMap.has(id)) {
                markAsRead(li);
                showReadDate(li, '.txtA', readMap.get(id).date);
            }

            li.querySelectorAll('.ImgA, .txtA').forEach(a => {
                a.addEventListener('click', async () => {
                    if (readMap.has(id)) return;
                    const date = getTodayStr();
                    try {
                        await saveComic(id, title, date);
                        readMap.set(id, { title, date });
                        currentPageAdded++;
                        markAsRead(li);
                        showReadDate(li, '.txtA', date);
                        await updateHeaderStats();
                    } catch (e) {
                        console.warn('[wn-read] 保存失败', e);
                    }
                });
            });
        });
    }

    // =========================
    // 处理搜索结果页
    // 结构与 albums 不同，没有 .txtA，标题在 .ImgA 内部的 span
    // 日期插在 .ImgA span里
    // =========================

    function processSearchPage() {
        document.querySelectorAll('#classify_container li').forEach(li => {
            const imgA = li.querySelector('.ImgA');
            if (!imgA) return;
            const id = extractId(imgA.href);
            const title = imgA.querySelector('span')?.textContent.trim() || '';
            if (!id) return;

            if (readMap.has(id)) {
                markAsRead(li);
                showReadDate(li, '.ImgA span', readMap.get(id).date, true);
            }

            imgA.addEventListener('click', async () => {
                if (readMap.has(id)) return;
                const date = getTodayStr();
                try {
                    await saveComic(id, title, date);
                    readMap.set(id, { title, date });
                    currentPageAdded++;
                    markAsRead(li);
                    showReadDate(li, '.ImgA span', date, true);
                    await updateHeaderStats();
                } catch (e) {
                    console.warn('[wn-read] 保存失败', e);
                }
            });
        });
    }

    // =========================
    // 处理 ranking 排行页
    // 选取 #topImgCon .itemBox，标题在 .itemTxt .title
    // 日期插在 .title 后面（外部兄弟节点模式）
    // =========================

    function processRankingPage() {
        document.querySelectorAll('#topImgCon .itemBox').forEach(box => {
            const titleA = box.querySelector('.itemTxt .title');
            if (!titleA) return;
            const id = extractId(titleA.href);
            const title = titleA.textContent.trim();
            if (!id) return;

            if (readMap.has(id)) {
                markAsRead(box);
                showReadDate(box, '.title', readMap.get(id).date, false);
            }

            box.querySelectorAll('.itemImg a, .itemTxt .title').forEach(a => {
                a.addEventListener('click', async () => {
                    if (readMap.has(id)) return;
                    const date = getTodayStr();
                    try {
                        await saveComic(id, title, date);
                        readMap.set(id, { title, date });
                        currentPageAdded++;
                        markAsRead(box);
                        showReadDate(box, '.title', date, false);
                        await updateHeaderStats();
                    } catch (e) {
                        console.warn('[wn-read] 保存失败', e);
                    }
                });
            });
        });
    }

    // =========================
    // 初始化入口
    // 顺序：注入样式 → 开启DB → 每日同步 → 构建内存Map → 插入统计栏 → 分发页面处理
    // 同步放在构建 readMap 之前，确保云端恢复的数据当页也能生效
    // =========================

    async function init() {
        addReadStyle();
        await openDB();

        await syncWithGist();

        const records = await getAllRecords();
        readMap = new Map(records.map(r => [r.id, { title: r.title, date: r.date }]));

        await createHeaderStats();

        if (document.querySelector('#classify_container')) {
            if (location.href.includes('/search/') || location.href.includes('/q/')) {
                processSearchPage();
            } else {
                processAlbumsPage();
            }
        }

        if (location.href.includes('ranking') || document.querySelector('#topImgCon .itemBox')) {
            processRankingPage();
        }
    }

    init();

})();
