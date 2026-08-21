// ==UserScript==
// @name        Ehentai Favorites Check
// @namespace   ehentai
// @description Check favorites validity with progress tracking
// @icon         https://e-hentai.org/favicon.ico
// @match       *://exhentai.org/favorites.php*
// @match       *://e-hentai.org/favorites.php*
// @version     0.7.0-2026-08-22 03:14:12
// @downloadURL  https://raw.githubusercontent.com/Chihaya7/UserScript/refs/heads/main/ehentai/ehentai Favorites Check.user.js
// @updateURL    https://raw.githubusercontent.com/Chihaya7/UserScript/refs/heads/main/ehentai/ehentai Favorites Check.user.js
// @grant       none
// ==/UserScript==

(function () {
    'use strict';

    const isExhentai = location.host.includes('exhentai');


    // ── 设置 ──────────────────────────────────────────────────────
    const SETTINGS_KEY = 'EXHFavChecker_settings';
    const defaultSettings = {
        minDelay: 2000,
        delayMult: 1.0,
        parallel: false,
        checkBatchSize: 5,
        checkBatchGap: 1000,
        maxPageRetry: 3,
        maxCheckRetry: 3,
        appendTbody: true,
        waitOnBan: true,
        saveLog: true,
    };
    function loadSettings() {
        try { return Object.assign({}, defaultSettings, JSON.parse(localStorage.getItem(SETTINGS_KEY))); }
        catch { return { ...defaultSettings }; }
    }
    function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

    // ── 数据层 ────────────────────────────────────────────────────
    let allEntries = [];
    let urlMap = new Map();

    // ── 视图状态 ──────────────────────────────────────────────────
    // [修改] 将 duplicate 合并进 VIEW_MODES，移除独立的 btn-dup 逻辑
    const VIEW_MODES = ['all', 'valid', 'invalid', 'classify', 'duplicate'];
    const VIEW_LABELS = {
        all: 'View: All',
        valid: 'View: Valid only',
        invalid: 'View: Invalid only',
        classify: 'View: By reason',
        duplicate: 'View: Duplicates',
    };
    let currentView = 'all';
    let drawerOpen = {};

    // ── 脏标记 ────────────────────────────────────────────────────
    // [新增] classify / duplicate 视图的重建标记，避免每次切换都重建
    let classifyDirty = true;
    let duplicateDirty = true;

    // ── 计时 ──────────────────────────────────────────────────────
    let crawlStartTime = null;

    function formatLocalTime(date) {
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }

    function formatElapsed(ms) {
        const totalSec = Math.floor(ms / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
    }

    // ── 样式 ──────────────────────────────────────────────────────
    const css = `
        .ido > h1 {
            width: fit-content; margin: 3px auto; cursor: pointer;
            border-radius: 9px; border: 1px solid transparent;
            padding: 1px 10px; transition: background 0.1s, border-color 0.1s;
            user-select: none;
        }
        .ido > h1:hover {
            background: ${isExhentai ? '#43464e' : '#e0e0e0'};
            border-color: ${isExhentai ? '#c2c1c1' : '#999'};
        }
        .ido > h1.checking {
            background: ${isExhentai ? '#43464e' : '#e0e0e0'};
            border-color: ${isExhentai ? '#c2c1c1' : '#999'};
            cursor: default; opacity: 0.85;
        }
        #fav-panel { width: 900px; margin: 6px auto; }
        #fav-panel h2 {
            font-size: 10pt; font-weight: bold;
            margin: 8px 3px 3px; text-align: center;
        }
        #fav-list-buttons {
            margin: 4px 0 2px; display: flex; gap: 6px;
        }
        #fav-list-buttons button {
            min-height: 22px; padding: 1px 10px; cursor: pointer;
        }
        #fav-panel-buttons {
            margin: 4px 0 2px; display: flex; gap: 6px; flex-wrap: wrap;
            align-items: center;
        }
        #fav-panel-buttons button {
            min-height: 22px; padding: 1px 10px; cursor: pointer;
        }
        #btn-start { box-shadow: 0 0 4px ${isExhentai ? '#00b9b9' : '#0077cc'}; }
        #btn-stop  { box-shadow: 0 0 4px #B7002B; }

        /* [修改] 外框容器，三个子容器共用此框的尺寸和滚动样式 */
        #fav-list-wrap {
            width: 100%; min-height: 80px; max-height: 400px; overflow-y: auto;
            box-sizing: border-box; resize: vertical;
            padding: 4px;
            background: ${isExhentai ? '#2a2a2a' : '#fafafa'};
            border: 1px solid ${isExhentai ? '#555' : '#bbb'};
            font-family: monospace; font-size: 12px;
        }
        /* [新增] 三个子容器，默认只显示 all */
        #fav-list-all, #fav-list-classify, #fav-list-duplicate {
            width: 100%;
        }
        #fav-list-classify, #fav-list-duplicate { display: none; }

        /* 进度条 */
        #fav-progress { width: 100%; margin: 3px 0; }
        #fav-progress-bar {
            width: 100%; height: 16px; position: relative;
            background: ${isExhentai ? '#1e1e1e' : '#e0e0e0'};
            border: 1px solid ${isExhentai ? '#444' : '#bbb'};
            border-radius: 3px; overflow: hidden;
        }
        .fav-prog-bar {
            position: absolute; top: 0; left: 0; height: 100%;
            transition: width 0.15s ease;
        }
        #prog-fetched { background: #c8a000cc; z-index: 1; }
        #prog-checked { background: #2a9a2acc; z-index: 2; }
        #prog-invalid { background: #c52323cc; z-index: 3; }
        #fav-progress-labels {
            display: flex; justify-content: space-between;
            font-size: 10px; margin-top: 2px;
        }
        #label-fetched { color: #c8a000; }
        #label-checked { color: #2a9a2a; }
        #label-invalid { color: #c52323; }

        /* 画廊行 */
        .fav-row {
            padding: 1px 2px; line-height: 1.5;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            text-align: left;
        }
        .fav-row a {
            color: ${isExhentai ? '#9ac' : '#0055cc'};
            text-decoration: none;
        }
        .fav-row a:hover { text-decoration: underline; }
        .fav-row.invalid { color: ${isExhentai ? '#ff6573' : '#cc0000'}; }
        .fav-row.invalid a { color: ${isExhentai ? '#ff6573' : '#cc0000'}; }
        .fav-row.pending { opacity: 0.5; }

        /* 重复画廊元信息行 */
        .fav-dup-meta {
            padding: 1px 8px; font-size: 11px; line-height: 1.4;
            color: ${isExhentai ? '#aaa' : '#666'};
        }
        .fav-dup-meta a {
            color: ${isExhentai ? '#9ac' : '#0055cc'};
            text-decoration: none;
        }
        .fav-dup-meta a:hover { text-decoration: underline; }

        /* 失效分类抽屉 header */
        .fav-drawer-header {
            padding: 2px 4px; margin-top: 4px;
            cursor: pointer; font-weight: bold; font-size: 12px;
            background: ${isExhentai ? '#3a3d45' : '#e8e8e8'};
            border: 1px solid ${isExhentai ? '#555' : '#bbb'};
            border-radius: 4px; user-select: none;
        }
        .fav-drawer-header:hover { background: ${isExhentai ? '#43464e' : '#ddd'}; }

        /* Status log */
        #exportStatus {
            width: 100%; height: 100px; box-sizing: border-box;
            overflow-y: auto; resize: vertical; padding: 4px;
            word-break: break-all;
            font-family: monospace; font-size: 12px;
            background: ${isExhentai ? '#1e1e1e' : '#f5f5f5'};
            color: ${isExhentai ? '#ccc' : '#333'};
            border: 1px solid ${isExhentai ? '#555' : '#bbb'};
        }
        .log-line { display: block; white-space: pre-wrap; }
        .log-error  { color: ${isExhentai ? '#ff6060' : '#cc0000'}; }
        .log-page   { color: ${isExhentai ? '#6ab0f5' : '#0055cc'}; }
        .log-warn   { color: ${isExhentai ? '#f5c842' : '#996600'}; }
        .log-line a {
            color: ${isExhentai ? '#9ac' : '#0055cc'};
            text-decoration: none;
        }
        .log-line a:hover { text-decoration: underline; }
        .log-divider {
            display: block; border: none;
            border-top: 1px solid ${isExhentai ? '#444' : '#ccc'};
            margin: 3px 0;
        }

        /* Options dialog */
        #fav-options-dialog {
            border: 1px solid ${isExhentai ? '#c2c1c1' : '#999'};
            border-radius: 8px; padding: 16px 20px;
            background: ${isExhentai ? '#33363d' : '#fff'};
            color: ${isExhentai ? '#ddd' : '#222'}; min-width: 320px;
        }
        #fav-options-dialog::backdrop { background: rgba(0,0,0,0.45); }
        #fav-options-dialog h3 { margin: 0 0 12px; font-size: 10pt; text-align: center; }
        .fav-opt-row {
            display: flex; align-items: center;
            justify-content: space-between;
            margin-bottom: 10px; gap: 12px; font-size: 9pt;
        }
        .fav-opt-row label { flex: 1; }
        .fav-opt-row input[type=number] {
            width: 80px; text-align: right;
            background: ${isExhentai ? '#222' : '#f5f5f5'};
            color: ${isExhentai ? '#ddd' : '#222'};
            border: 1px solid ${isExhentai ? '#555' : '#bbb'}; padding: 1px 4px;
        }
        .fav-opt-row input[type=checkbox] { width: 16px; height: 16px; }
        .opt-desc { font-size: 8pt; opacity: 0.65; margin-bottom: 14px; line-height: 1.4; }
        #fav-opt-save { display: block; margin: 4px auto 0; padding: 2px 20px; cursor: pointer; }
    `;
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // ── h1 交互 ───────────────────────────────────────────────────
    const h1 = document.querySelector('.ido > h1');
    if (!h1) return;
    h1.style.margin = '3px auto';
    const originalText = h1.textContent.trim();

    h1.addEventListener('mouseenter', () => {
        if (h1.classList.contains('checking')) return;
        h1.textContent = 'Check Favorites';
    });
    h1.addEventListener('mouseleave', () => {
        if (h1.classList.contains('checking')) return;
        h1.textContent = originalText;
    });
    h1.addEventListener('click', () => {
        if (h1.classList.contains('checking')) return;
        h1.classList.add('checking');
        h1.textContent = 'Checking...';
        initPanel();
    });

    // ── 初始化面板 ────────────────────────────────────────────────
    function initPanel() {
        if (document.getElementById('fav-panel')) return;
        const nb = document.getElementById('nb');
        if (!nb) return;

        const panel = document.createElement('div');
        panel.id = 'fav-panel';
        // [修改] fav-list 改为外框 #fav-list-wrap，内含三个独立子容器
        // [修改] 移除 btn-dup 按钮
        panel.innerHTML = `
            <h2>Text List of Favorites</h2>
            <div id="fav-list-wrap">
                <div id="fav-list-all"></div>
                <div id="fav-list-classify"></div>
                <div id="fav-list-duplicate"></div>
            </div>
            <div id="fav-progress">
                <div id="fav-progress-bar">
                    <div class="fav-prog-bar" id="prog-fetched" style="width:0%"></div>
                    <div class="fav-prog-bar" id="prog-checked" style="width:0%"></div>
                    <div class="fav-prog-bar" id="prog-invalid" style="width:0%"></div>
                </div>
                <div id="fav-progress-labels">
                    <span id="label-fetched">Fetched: 0/0 (0%)</span>
                    <span id="label-checked">Checked: 0/0 (0%)</span>
                    <span id="label-invalid">Invalid: 0/0 (0%)</span>
                </div>
            </div>
            <div id="fav-list-buttons">
                <button id="btn-view">${VIEW_LABELS.all}</button>
                <button id="btn-copy">Copy</button>
            </div>
            <h2>Status</h2>
            <div id="exportStatus"></div>
            <div id="fav-panel-buttons">
                <button id="btn-options">Options</button>
                <button id="btn-save-json">Save JSON</button>
                <button id="btn-load-json">Load JSON</button>
                <input type="file" id="input-load-json" accept=".json" style="display:none">
                <button id="btn-start">Start</button>
            </div>
        `;
        nb.insertAdjacentElement('afterend', panel);

        // Options dialog
        const dialog = document.createElement('dialog');
        dialog.id = 'fav-options-dialog';
        dialog.innerHTML = `
            <h3>Options</h3>
            <div class="fav-opt-row">
                <label for="opt-min-delay">Min page delay (ms)</label>
                <input type="number" id="opt-min-delay" min="500" step="100">
            </div>
            <div class="opt-desc">Minimum wait between pages regardless of response speed.</div>
            <div class="fav-opt-row">
                <label for="opt-delay-mult">Delay multiplier</label>
                <input type="number" id="opt-delay-mult" min="0" step="0.1">
            </div>
            <div class="opt-desc">Next wait = max(min delay, response time × multiplier).</div>
            <div class="fav-opt-row">
                <label for="opt-max-page-retry">Max page fetch retries</label>
                <input type="number" id="opt-max-page-retry" min="0" max="20" step="1">
            </div>
            <div class="opt-desc">Max retries when a page fetch fails. 0 = no retry.</div>
            <div class="fav-opt-row">
                <label for="opt-batch-size">Check batch size</label>
                <input type="number" id="opt-batch-size" min="1" max="20" step="1">
            </div>
            <div class="opt-desc">Concurrent validity checks per batch within each page.</div>
            <div class="fav-opt-row">
                <label for="opt-batch-gap">Check batch gap (ms)</label>
                <input type="number" id="opt-batch-gap" min="0" step="100">
            </div>
            <div class="opt-desc">Wait between check batches within a page.</div>
            <div class="fav-opt-row">
                <label for="opt-max-check-retry">Max check retries</label>
                <input type="number" id="opt-max-check-retry" min="0" max="20" step="1">
            </div>
            <div class="opt-desc">Max retries when a validity check fetch fails. 0 = no retry.</div>
            <div class="fav-opt-row">
                <label for="opt-parallel">Parallel mode (crawl while checking)</label>
                <input type="checkbox" id="opt-parallel">
            </div>
            <div class="opt-desc">Faster but higher server load.</div>
            <div class="fav-opt-row">
                <label for="opt-append-tbody">Append subsequent pages to table</label>
                <input type="checkbox" id="opt-append-tbody">
            </div>
            <div class="opt-desc">Append fetched gallery rows into the first page's table. Disable if the page slows down.</div>
            <div class="fav-opt-row">
                <label for="opt-wait-on-ban">Auto-wait when IP banned</label>
                <input type="checkbox" id="opt-wait-on-ban">
            </div>
            <div class="opt-desc">When banned, automatically wait until the ban expires then resume. If disabled, stops immediately.</div>
            <div class="fav-opt-row">
                <label for="opt-save-log">Include log when saving JSON</label>
                <input type="checkbox" id="opt-save-log">
            </div>
            <div class="opt-desc">Save Status log text inside the JSON file.</div>
            <button id="fav-opt-save">Save</button>
        `;
        document.body.appendChild(dialog);

        document.getElementById('btn-options').addEventListener('click', () => {
            const s = loadSettings();
            document.getElementById('opt-min-delay').value = s.minDelay;
            document.getElementById('opt-delay-mult').value = s.delayMult;
            document.getElementById('opt-max-page-retry').value = s.maxPageRetry;
            document.getElementById('opt-batch-size').value = s.checkBatchSize;
            document.getElementById('opt-batch-gap').value = s.checkBatchGap;
            document.getElementById('opt-max-check-retry').value = s.maxCheckRetry;
            document.getElementById('opt-parallel').checked = s.parallel;
            document.getElementById('opt-append-tbody').checked = s.appendTbody;
            document.getElementById('opt-wait-on-ban').checked = s.waitOnBan;
            document.getElementById('opt-save-log').checked = s.saveLog;
            dialog.showModal();
        });
        document.getElementById('fav-opt-save').addEventListener('click', () => {
            const s = {
                minDelay: parseFloat(document.getElementById('opt-min-delay').value) || defaultSettings.minDelay,
                delayMult: parseFloat(document.getElementById('opt-delay-mult').value) ?? defaultSettings.delayMult,
                maxPageRetry: parseInt(document.getElementById('opt-max-page-retry').value) ?? defaultSettings.maxPageRetry,
                checkBatchSize: parseInt(document.getElementById('opt-batch-size').value) || defaultSettings.checkBatchSize,
                checkBatchGap: parseInt(document.getElementById('opt-batch-gap').value) ?? defaultSettings.checkBatchGap,
                maxCheckRetry: parseInt(document.getElementById('opt-max-check-retry').value) ?? defaultSettings.maxCheckRetry,
                parallel: document.getElementById('opt-parallel').checked,
                appendTbody: document.getElementById('opt-append-tbody').checked,
                waitOnBan: document.getElementById('opt-wait-on-ban').checked,
                saveLog: document.getElementById('opt-save-log').checked,
            };
            saveSettings(s);
            dialog.close();
            appendStatus(`Options saved.`, 'normal');
        });
        dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

        // [修改] btn-view 循环切换所有五个视图，无需 viewBeforeDup
        document.getElementById('btn-view').addEventListener('click', () => {
            const idx = VIEW_MODES.indexOf(currentView);
            currentView = VIEW_MODES[(idx + 1) % VIEW_MODES.length];
            document.getElementById('btn-view').textContent = VIEW_LABELS[currentView];
            renderView();
        });

        document.getElementById('btn-copy').addEventListener('click', copyCurrentView);
        document.getElementById('btn-save-json').addEventListener('click', saveJSON);
        document.getElementById('btn-load-json').addEventListener('click', () => {
            document.getElementById('input-load-json').click();
        });
        document.getElementById('input-load-json').addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => loadJSON(ev.target.result);
            reader.readAsText(file);
            e.target.value = '';
        });
        document.getElementById('btn-start').addEventListener('click', onClickStart);
    }

    // ── 获取总数 ──────────────────────────────────────────────────
    function getTotalCount() {
        const fps = document.querySelector('.nosel .fp.fps');
        if (!fps) return 0;
        const isShowAll = fps.textContent.trim() === 'Show All Favorites';
        if (isShowAll) {
            let total = 0;
            document.querySelectorAll('.nosel .fp:not(.fps)').forEach(fp => {
                total += parseInt(fp.firstElementChild?.textContent?.trim() || '0', 10);
            });
            return total;
        }
        return parseInt(fps.firstElementChild?.textContent?.trim() || '0', 10);
    }

    // ── 进度计数 ──────────────────────────────────────────────────
    let progressTotal = 0;
    let progressFetched = 0;
    let progressChecked = 0;
    let progressInvalid = 0;

    function updateProgress() {
        const total = progressTotal || 1;
        const pFetched = Math.min(100, progressFetched / total * 100);
        const pChecked = Math.min(100, progressChecked / total * 100);
        const pInvalid = progressChecked > 0 ? Math.min(100, progressInvalid / progressChecked * 100) : 0;

        document.getElementById('prog-fetched').style.width = pFetched.toFixed(1) + '%';
        document.getElementById('prog-checked').style.width = pChecked.toFixed(1) + '%';
        document.getElementById('prog-invalid').style.width = pInvalid.toFixed(1) + '%';
        document.getElementById('label-fetched').textContent = `Fetched: ${progressFetched}/${progressTotal} (${pFetched.toFixed(0)}%)`;
        document.getElementById('label-checked').textContent = `Checked: ${progressChecked}/${progressTotal} (${pChecked.toFixed(0)}%)`;
        document.getElementById('label-invalid').textContent = `Invalid: ${progressInvalid}/${progressChecked} (${pInvalid.toFixed(0)}%)`;
    }

    // ── Start / Stop ──────────────────────────────────────────────
    let abortController = null;

    function onClickStart() {
        const btnStart = document.getElementById('btn-start');
        const btnStop = document.createElement('button');
        btnStop.id = 'btn-stop';
        btnStop.textContent = 'Stop';
        btnStart.replaceWith(btnStop);

        abortController = new AbortController();
        btnStop.addEventListener('click', () => {
            abortController.abort();
            appendStatus('Stop requested...', 'error');
            btnStop.disabled = true;
        });

        startCrawl(abortController.signal).then(() => {
            const stop = document.getElementById('btn-stop');
            if (stop) stop.disabled = true;
        });
    }

    // ── Status log ────────────────────────────────────────────────
    function appendStatus(text, type = 'normal', isHtml = false) {
        const el = document.getElementById('exportStatus');
        if (!el) return;
        const span = document.createElement('span');
        span.className = 'log-line' + (type !== 'normal' ? ` log-${type}` : '');
        if (isHtml) {
            span.innerHTML = text + '\n';
        } else {
            span.textContent = text + '\n';
        }
        el.appendChild(span);
        el.scrollTop = el.scrollHeight;
    }

    function appendStatusDivider() {
        const el = document.getElementById('exportStatus');
        if (!el) return;
        const hr = document.createElement('span');
        hr.className = 'log-divider';
        el.appendChild(hr);
        el.scrollTop = el.scrollHeight;
    }

    // ── DOM 行创建 ────────────────────────────────────────────────
    function createRow(entry) {
        const row = document.createElement('div');
        row.className = 'fav-row pending';
        row.dataset.url = entry.url;
        row.innerHTML = `<a href="${entry.url}" target="_blank">${entry.url}</a> - ${escapeHtml(entry.title)}`;
        return row;
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ── 追加条目 ──────────────────────────────────────────────────
    function appendEntries(entries, pageIdx) {
        // [修改] append 到 #fav-list-all，不再用 #fav-list
        const listAll = document.getElementById('fav-list-all');
        const globalBase = allEntries.length;
        entries.forEach((entry, i) => {
            entry.pageIndex = pageIdx;
            entry.indexInPage = i + 1;
            entry.globalIndex = globalBase + i + 1;
            const row = createRow(entry);
            entry.domRow = row;
            allEntries.push(entry);

            const pos = { pageIndex: entry.pageIndex, indexInPage: entry.indexInPage, globalIndex: entry.globalIndex };
            if (!urlMap.has(entry.url)) {
                urlMap.set(entry.url, { title: entry.title, positions: [pos] });
            } else {
                urlMap.get(entry.url).positions.push(pos);
            }

            listAll.appendChild(row);
        });
        progressFetched += entries.length;
        updateProgress();

        // [新增] 新条目进来，classify 和 duplicate 都需要重建
        classifyDirty = true;
        duplicateDirty = true;
    }

    // ── 更新单条记录状态 ──────────────────────────────────────────
    function updateEntryStatus(entry, status, reason) {
        entry.status = status;
        entry.reason = reason || null;
        progressChecked++;
        if (status === 'invalid') progressInvalid++;
        updateProgress();
        const row = entry.domRow;
        row.classList.remove('pending');
        if (status === 'invalid') {
            row.classList.add('invalid');
            const reasonSpan = document.createElement('span');
            reasonSpan.textContent = ` [${reason || '失效'}]`;
            row.appendChild(reasonSpan);
            if (entry.glinkEl) {
                const tr = entry.glinkEl.closest('tr');
                if (tr) tr.style.backgroundColor = '#c5232396';
                if (!entry.glinkEl.nextElementSibling?.classList.contains('fav-invalid-reason')) {
                    const reasonEl = document.createElement('div');
                    reasonEl.className = 'fav-invalid-reason';
                    reasonEl.textContent = reason || '失效';
                    reasonEl.style.cssText = 'font-size:11px;margin-top:2px;';
                    entry.glinkEl.insertAdjacentElement('afterend', reasonEl);
                }
            }
            // [新增] 有新的 invalid 条目，classify 需要重建
            classifyDirty = true;
        }
        // [修改] all/valid/invalid 视图：直接改 display，不重建
        if (currentView === 'all' || currentView === 'valid' || currentView === 'invalid') {
            applyRowVisibility(entry);
        }
    }

    // ── 单条可见性（仅用于 #fav-list-all） ───────────────────────
    // [修改] 只处理 all/valid/invalid，classify/duplicate 不走此函数
    function applyRowVisibility(entry) {
        const row = entry.domRow;
        if (!row) return;
        switch (currentView) {
            case 'all': row.style.display = ''; break;
            case 'valid': row.style.display = entry.status === 'invalid' ? 'none' : ''; break;
            case 'invalid': row.style.display = entry.status === 'invalid' ? '' : 'none'; break;
        }
    }

    // ── 切换子容器显隐 ────────────────────────────────────────────
    // [新增] 根据 currentView 决定显示哪个容器
    function switchContainer(view) {
        const isAll = view === 'all' || view === 'valid' || view === 'invalid';
        document.getElementById('fav-list-all').style.display = isAll ? 'block' : 'none';
        document.getElementById('fav-list-classify').style.display = view === 'classify' ? 'block' : 'none';
        document.getElementById('fav-list-duplicate').style.display = view === 'duplicate' ? 'block' : 'none';
    }

    // ── 视图渲染 ──────────────────────────────────────────────────
    // [修改] all/valid/invalid 只改 display；classify/duplicate 按脏标记决定是否重建
    function renderView() {
        switchContainer(currentView);

        if (currentView === 'all' || currentView === 'valid' || currentView === 'invalid') {
            allEntries.forEach(entry => applyRowVisibility(entry));
            return;
        }
        if (currentView === 'classify') {
            if (classifyDirty) {
                renderClassifyView(document.getElementById('fav-list-classify'));
                classifyDirty = false;
            }
            return;
        }
        if (currentView === 'duplicate') {
            if (duplicateDirty) {
                renderDuplicateView(document.getElementById('fav-list-duplicate'));
                duplicateDirty = false;
            }
            return;
        }
    }

    // ── 失效分类视图 ──────────────────────────────────────────────
    // [修改] 接收目标容器参数，不再读 #fav-list
    function renderClassifyView(container) {
        container.innerHTML = '';
        const groups = {};
        allEntries.forEach(entry => {
            if (entry.status !== 'invalid') return;
            const key = entry.reason || '失效';
            if (!groups[key]) groups[key] = [];
            groups[key].push(entry);
        });
        if (Object.keys(groups).length === 0) {
            container.appendChild(document.createTextNode('No invalid galleries.'));
            return;
        }
        Object.entries(groups).forEach(([reason, entries]) => {
            const header = document.createElement('div');
            header.className = 'fav-drawer-header';
            const isOpen = !!drawerOpen[reason];
            header.textContent = `${isOpen ? '▼' : '▶'} ${reason} (${entries.length})`;
            container.appendChild(header);

            // [修改] 用 body 子 div 包裹所有行，折叠只需改 body.style.display
            const body = document.createElement('div');
            body.style.display = isOpen ? 'block' : 'none';
            entries.forEach(entry => {
                const clone = entry.domRow.cloneNode(true);
                body.appendChild(clone);
            });
            container.appendChild(body);

            header.addEventListener('click', () => {
                drawerOpen[reason] = !drawerOpen[reason];
                const open = drawerOpen[reason];
                header.textContent = `${open ? '▼' : '▶'} ${reason} (${entries.length})`;
                body.style.display = open ? 'block' : 'none';
            });
        });
    }

    // ── 重复画廊视图 ──────────────────────────────────────────────
    // [修改] 接收目标容器参数
    function renderDuplicateView(container) {
        container.innerHTML = '';

        const dupEntries = [...urlMap.entries()].filter(([, val]) => val.positions.length > 1);

        if (dupEntries.length === 0) {
            container.appendChild(document.createTextNode('No duplicates found.'));
            return;
        }

        dupEntries.forEach(([url, { title, positions }]) => {
            const row = document.createElement('div');
            row.className = 'fav-row';
            row.innerHTML = `<a href="${url}" target="_blank">${url}</a> - ${escapeHtml(title)}`;
            container.appendChild(row);

            const meta = document.createElement('div');
            meta.className = 'fav-dup-meta';
            const occurrences = positions.map(p =>
                `<a href="?page=${p.pageIndex - 1}" target="_blank">P${p.pageIndex}</a>#${p.indexInPage}(#${p.globalIndex})`
            ).join(', ');
            meta.innerHTML = `↳ Appears ${positions.length} times: ${occurrences}`;
            container.appendChild(meta);
        });
    }

    // ── 重复数量统计 ──────────────────────────────────────────────
    function getDuplicateCount() {
        let count = 0;
        urlMap.forEach(val => { if (val.positions.length > 1) count++; });
        return count;
    }

    // ── 复制当前视图 ──────────────────────────────────────────────
    // [修改] classify 复制逻辑改为读数据层而非 DOM display 状态
    function copyCurrentView() {
        let lines = [];
        if (currentView === 'classify') {
            allEntries.forEach(entry => {
                if (entry.status !== 'invalid') return;
                const reason = entry.reason || '失效';
                if (drawerOpen[reason]) lines.push(`${entry.url} - ${entry.title} [${reason}]`);
            });
        } else if (currentView === 'duplicate') {
            urlMap.forEach(({ title, positions }, url) => {
                if (positions.length <= 1) return;
                lines.push(`${url} - ${title} (×${positions.length})`);
            });
        } else {
            allEntries.forEach(entry => {
                // valid: 跳过 invalid；invalid: 只取 invalid；all: 全取
                if (currentView === 'valid' && entry.status === 'invalid') return;
                if (currentView === 'invalid' && entry.status !== 'invalid') return;
                let line = `${entry.url} - ${entry.title}`;
                if (entry.status === 'invalid') line += ` [${entry.reason || '失效'}]`;
                lines.push(line);
            });
        }
        navigator.clipboard.writeText(lines.join('\n')).then(() => {
            const btn = document.getElementById('btn-copy');
            const orig = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = orig; }, 1500);
            appendStatus(`Copied: view=${currentView}, ${lines.length} lines.`);
        });
    }

    // ── 保存 JSON ─────────────────────────────────────────────────
    function saveJSON() {
        if (!allEntries.length) {
            appendStatus('Nothing to save.', 'warn');
            return;
        }
        const settings = loadSettings();
        const data = {
            savedAt: formatLocalTime(new Date()),
            entries: allEntries.map(e => ({
                url: e.url,
                title: e.title,
                status: e.status,
                reason: e.reason,
                pageIndex: e.pageIndex,
                indexInPage: e.indexInPage,
                globalIndex: e.globalIndex,
            })),
        };
        if (settings.saveLog) {
            const statusEl = document.getElementById('exportStatus');
            data.log = statusEl ? statusEl.innerText : '';
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `fav-checker-${formatLocalTime(new Date()).replace(/:/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        appendStatus(`Saved ${data.entries.length} entries to JSON.`);
    }

    // ── 读取 JSON ─────────────────────────────────────────────────
    function loadJSON(text) {
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            appendStatus('Failed to parse JSON file.', 'error');
            return;
        }
        if (!Array.isArray(data.entries)) {
            appendStatus('Invalid JSON format: missing entries array.', 'error');
            return;
        }
        if (allEntries.length > 0) {
            if (!confirm(`Current list has ${allEntries.length} entries. Overwrite with loaded data?`)) return;
        }
        rebuildFromData(data);
    }

    // ── 从 JSON 数据重建状态 ──────────────────────────────────────
    function rebuildFromData(data) {
        allEntries = [];
        urlMap = new Map();
        progressFetched = 0;
        progressChecked = 0;
        progressInvalid = 0;
        progressTotal = data.entries.length;

        // [修改] 清空三个子容器
        document.getElementById('fav-list-all').innerHTML = '';
        document.getElementById('fav-list-classify').innerHTML = '';
        document.getElementById('fav-list-duplicate').innerHTML = '';

        data.entries.forEach((e) => {
            const entry = {
                url: e.url,
                title: e.title,
                status: e.status || 'pending',
                reason: e.reason || null,
                pageIndex: e.pageIndex,
                indexInPage: e.indexInPage,
                globalIndex: e.globalIndex,
                domRow: null,
                glinkEl: null,
            };

            const row = createRow(entry);
            if (entry.status === 'invalid') {
                row.classList.remove('pending');
                row.classList.add('invalid');
                const reasonSpan = document.createElement('span');
                reasonSpan.textContent = ` [${entry.reason || '失效'}]`;
                row.appendChild(reasonSpan);
            } else if (entry.status === 'valid') {
                row.classList.remove('pending');
            }
            entry.domRow = row;

            allEntries.push(entry);

            const pos = { pageIndex: entry.pageIndex, indexInPage: entry.indexInPage, globalIndex: entry.globalIndex };
            if (!urlMap.has(entry.url)) {
                urlMap.set(entry.url, { title: entry.title, positions: [pos] });
            } else {
                urlMap.get(entry.url).positions.push(pos);
            }

            progressFetched++;
            if (entry.status !== 'pending') {
                progressChecked++;
                if (entry.status === 'invalid') progressInvalid++;
            }

            // [修改] append 到 #fav-list-all
            document.getElementById('fav-list-all').appendChild(row);
        });

        if (data.log) {
            const statusEl = document.getElementById('exportStatus');
            if (statusEl) {
                const span = document.createElement('span');
                span.className = 'log-line';
                span.textContent = data.log;
                statusEl.innerHTML = '';
                statusEl.appendChild(span);
            }
        }

        updateProgress();

        // [新增] 重建后两个视图都需要重新生成
        classifyDirty = true;
        duplicateDirty = true;

        currentView = 'all';
        switchContainer('all');
        allEntries.forEach(entry => applyRowVisibility(entry));
        document.getElementById('btn-view').textContent = VIEW_LABELS.all;
        appendStatus(`Loaded ${data.entries.length} entries from JSON. Saved at: ${data.savedAt || 'unknown'}`);
    }

    // ── 解析页面 ──────────────────────────────────────────────────
    function parsePage(doc) {
        const glinkEls = doc.querySelectorAll('.itg .gl4e .glink, .itg .glname .glink');
        const entries = [];
        glinkEls.forEach(glinkEl => {
            const anchor = glinkEl.closest('a');
            if (!anchor) return;
            entries.push({ url: anchor.href, title: glinkEl.textContent.trim(), status: 'pending', reason: null, domRow: null, glinkEl });
        });
        const tbody = doc.querySelector('.itg > tbody');
        const nextAnchor = doc.querySelector('.searchnav a[href*="next="]');
        return { entries, tbody, nextURL: nextAnchor ? nextAnchor.href : null };
    }

    // ── 提取失效原因 ──────────────────────────────────────────────
    function extractInvalidReason(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const contP = doc.querySelector('p#continue');
        if (!contP) return null;
        const divD = doc.querySelector('div.d');
        if (!divD) return '失效';
        let reason = '';
        for (const child of divD.childNodes) {
            if (child === contP) break;
            reason += child.textContent;
        }
        return reason.trim().replace(/\s+/g, ' ') || '失效';
    }

    // ── 检测一页条目 ──────────────────────────────────────────────
    async function checkPageEntries(entries, pageIndex, signal, batchSize, batchGap, maxRetry, waitOnBan) {
        appendStatus(`Checking page ${pageIndex} (${entries.length} galleries)...`);
        let invalidInPage = 0;

        let queue = [...entries];

        while (queue.length > 0 && !signal.aborted) {
            const batch = queue.splice(0, batchSize);
            let banHtml = null;

            await Promise.all(batch.map(async entry => {
                let retryCount = 0;
                while (true) {
                    try {
                        const res = await fetch(entry.url, { method: 'GET', credentials: 'include', signal });
                        const html = await res.text();

                        if (html.includes('This IP address has been temporarily banned')) {
                            if (!banHtml) {
                                banHtml = html;
                                appendStatus(`⛔ IP BANNED during check! URL: ${entry.url}`, 'error');
                                appendStatus(`   Checked so far: ${progressChecked}/${progressTotal}`, 'error');
                            }
                            return;
                        }

                        const reason = extractInvalidReason(html);
                        if (reason !== null) {
                            invalidInPage++;
                            updateEntryStatus(entry, 'invalid', reason);
                        } else {
                            updateEntryStatus(entry, 'valid', null);
                        }
                        return;

                    } catch (err) {
                        if (err.name === 'AbortError') return;
                        retryCount++;
                        if (retryCount > maxRetry) {
                            appendStatus(`Check failed after ${maxRetry} retries: ${entry.url}`, 'error');
                            invalidInPage++;
                            updateEntryStatus(entry, 'invalid', 'fetch error');
                            return;
                        }
                        appendStatus(`Check retry ${retryCount}/${maxRetry}: ${entry.url}`, 'warn');
                        await sleep(2000 * retryCount, signal);
                    }
                }
            }));

            if (banHtml && !signal.aborted) {
                const resume = await handleBan(banHtml, signal, waitOnBan);
                if (!resume || signal.aborted) {
                    abortController.abort();
                    break;
                }
                const pendingInBatch = batch.filter(e => e.status === 'pending');
                appendStatus(`Re-queuing ${pendingInBatch.length} pending entries after ban lift.`, 'warn');
                queue = [...pendingInBatch, ...queue];
                continue;
            }

            if (queue.length > 0 && batchGap > 0 && !signal.aborted) {
                await sleep(batchGap, signal);
            }
        }

        const elapsed = crawlStartTime ? formatElapsed(Date.now() - crawlStartTime) : '';
        appendStatus(
            `Page ${pageIndex} check done. ` +
            `<span style="color:#c8a000">Fetched: ${progressFetched}</span> ` +
            `<span style="color:#2a9a2a">Checked: ${progressChecked}</span> ` +
            `<span style="color:#c52323">Invalid: ${progressInvalid}</span> ` +
            `Duplicates: ${getDuplicateCount()} ` +
            `| Elapsed: ${elapsed}`,
            'page', true
        );
        appendStatusDivider();
        return invalidInPage;
    }

    // ── 主抓取流程 ────────────────────────────────────────────────
    async function startCrawl(signal) {
        const settings = loadSettings();
        const localTbody = document.querySelector('.itg > tbody');
        let totalInvalid = 0;
        let pageIndex = 1;
        let lastDelay = settings.minDelay;

        allEntries = [];
        urlMap = new Map();
        crawlStartTime = Date.now();
        progressTotal = getTotalCount();
        progressFetched = 0;
        progressChecked = 0;
        progressInvalid = 0;
        // [新增] 开始新爬取时重置脏标记
        classifyDirty = true;
        duplicateDirty = true;
        updateProgress();

        appendStatus(`Total galleries to fetch: ${progressTotal} | Started: ${formatLocalTime(new Date(crawlStartTime))}`);

        const firstPage = parsePage(document);
        appendEntries(firstPage.entries, 1);
        appendStatus(`Page 1: ${firstPage.entries.length} galleries parsed.`);
        appendStatus(`Next page URL: ${firstPage.nextURL || '(none - last page)'}`);

        const firstCheckPromise = checkPageEntries(firstPage.entries, 1, signal, settings.checkBatchSize, settings.checkBatchGap, settings.maxCheckRetry, settings.waitOnBan);
        if (!settings.parallel) totalInvalid += await firstCheckPromise;

        if (!firstPage.nextURL || signal.aborted) {
            if (settings.parallel) totalInvalid += await firstCheckPromise;
            onDone(totalInvalid, signal.aborted);
            return;
        }

        let nextURL = firstPage.nextURL;
        pageIndex = 2;
        const checkPromises = settings.parallel ? [firstCheckPromise] : [];

        outerLoop: while (nextURL && !signal.aborted) {
            appendStatus(`Waiting ${(lastDelay / 1000).toFixed(1)}s before loading page ${pageIndex}...`);
            await sleep(lastDelay, signal);
            if (signal.aborted) break;

            appendStatus(`Loading <a href="${nextURL}" target="_blank">page ${pageIndex}</a>...`, 'normal', true);
            const reqStart = Date.now();
            let html = null;
            let pageRetryCount = 0;

            while (true) {
                try {
                    const res = await fetch(nextURL, { method: 'GET', credentials: 'include', signal });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    html = await res.text();
                    break;
                } catch (err) {
                    if (err.name === 'AbortError') break;
                    pageRetryCount++;
                    if (pageRetryCount > settings.maxPageRetry) {
                        appendStatus(`Page ${pageIndex} failed after ${settings.maxPageRetry} retries. Skipping. URL: ${nextURL}`, 'error');
                        break;
                    }
                    appendStatus(`Page ${pageIndex} retry ${pageRetryCount}/${settings.maxPageRetry}: ${err.message}. URL: ${nextURL}`, 'warn');
                    await sleep(3000 * pageRetryCount, signal);
                }
            }

            if (!html || signal.aborted) break;

            if (html.includes('This IP address has been temporarily banned')) {
                const resume = await handleBan(html, signal, settings.waitOnBan);
                if (!resume || signal.aborted) { onDone(totalInvalid, true); return; }
                continue outerLoop;
            }

            const elapsed = Date.now() - reqStart;
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const parsed = parsePage(doc);

            appendEntries(parsed.entries, pageIndex);
            appendStatus(`Page ${pageIndex}: ${parsed.entries.length} galleries parsed. (response: ${(elapsed / 1000).toFixed(1)}s)`);
            appendStatus(`Next page URL: ${parsed.nextURL || '(none - last page)'}`);

            if (settings.appendTbody && parsed.tbody && localTbody) {
                const rows = [...parsed.tbody.querySelectorAll('tr')]
                    .filter(tr => tr.querySelector('.glname, .gl4e'));
                localTbody.append(...rows);
            }

            const checkPromise = checkPageEntries(parsed.entries, pageIndex, signal, settings.checkBatchSize, settings.checkBatchGap, settings.maxCheckRetry, settings.waitOnBan);
            if (settings.parallel) {
                checkPromises.push(checkPromise);
            } else {
                totalInvalid += await checkPromise;
            }

            lastDelay = Math.max(settings.minDelay, elapsed * settings.delayMult);
            nextURL = parsed.nextURL;
            pageIndex++;
        }

        if (settings.parallel && checkPromises.length) {
            appendStatus('All pages fetched. Waiting for remaining checks...', 'warn');
            const results = await Promise.all(checkPromises);
            totalInvalid = results.reduce((a, b) => a + b, 0);
        }

        onDone(totalInvalid, signal.aborted);
    }

    // ── 完成 ──────────────────────────────────────────────────────
    function onDone(totalInvalid, aborted) {
        const dupCount = getDuplicateCount();
        const elapsed = crawlStartTime ? formatElapsed(Date.now() - crawlStartTime) : '';
        const statsHtml =
            `<span style="color:#c8a000">Fetched: ${progressFetched}</span> ` +
            `<span style="color:#2a9a2a">Checked: ${progressChecked}</span> ` +
            `<span style="color:#c52323">Invalid: ${totalInvalid}</span> ` +
            `| Duplicates: ${dupCount} | Elapsed: ${elapsed}`;
        if (aborted) {
            appendStatus(`Stopped. ${statsHtml}`, 'page', true);
            h1.textContent = 'Favorites (stopped)';
        } else {
            appendStatus(`All done. ${statsHtml}`, 'page', true);
            h1.textContent = `Favorites ✓ (${totalInvalid} invalid)`;
        }
        h1.classList.remove('checking');
    }

    // ── sleep ─────────────────────────────────────────────────────
    function sleep(ms, signal) {
        return new Promise(resolve => {
            const tid = setTimeout(resolve, ms);
            signal?.addEventListener('abort', () => { clearTimeout(tid); resolve(); }, { once: true });
        });
    }

    // ── IP Ban 处理 ───────────────────────────────────────────────
    let isBanHandling = false;

    function parseBanDuration(html) {
        const match = html.match(/The ban expires in ([^<]+)/);
        if (!match) return 0;
        const text = match[1];
        let ms = 0;
        const h = text.match(/(\d+)\s*hour/);
        const m = text.match(/(\d+)\s*minute/);
        const s = text.match(/(\d+)\s*second/);
        if (h) ms += parseInt(h[1]) * 3600000;
        if (m) ms += parseInt(m[1]) * 60000;
        if (s) ms += parseInt(s[1]) * 1000;
        return ms;
    }

    async function waitForBanLift(banMs, signal) {
        const BUFFER_MS = 60000;
        const totalMs = banMs + BUFFER_MS;
        const endTime = Date.now() + totalMs;

        appendStatus(`⏳ Waiting ${formatElapsed(totalMs)} for ban to lift (+60s buffer)...`, 'warn');

        const statusEl = document.getElementById('exportStatus');
        const timerSpan = document.createElement('span');
        timerSpan.className = 'log-line log-warn';
        timerSpan.textContent = `   Remaining: ${formatElapsed(totalMs)}\n`;
        if (statusEl) {
            statusEl.appendChild(timerSpan);
            statusEl.scrollTop = statusEl.scrollHeight;
        }

        while (Date.now() < endTime && !signal.aborted) {
            await sleep(10000, signal);
            const remaining = Math.max(0, endTime - Date.now());
            timerSpan.textContent = `   Remaining: ${formatElapsed(remaining)}\n`;
            if (statusEl) statusEl.scrollTop = statusEl.scrollHeight;
        }

        timerSpan.textContent = `   Remaining: 0s\n`;
        updateProgress();

        if (signal.aborted) return false;
        appendStatus(`Ban wait complete. Resuming...`, 'warn');
        return true;
    }

    async function handleBan(html, signal, waitOnBan) {
        if (isBanHandling) return false;
        isBanHandling = true;

        const banMs = parseBanDuration(html);
        const banMatch = html.match(/The ban expires in ([^<]+)/);
        const banInfo = banMatch ? banMatch[1].trim() : 'unknown duration';

        appendStatus(`⛔ IP BANNED! Ban expires in: ${banInfo}.`, 'error');

        let shouldContinue = false;
        if (waitOnBan && banMs > 0) {
            shouldContinue = await waitForBanLift(banMs, signal);
        } else {
            appendStatus(`Auto-wait disabled. Stopping.`, 'error');
        }

        isBanHandling = false;
        return shouldContinue;
    }

})();