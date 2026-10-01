// ==UserScript==
// @name         PicaGridResizer
// @name:zh-CN   Pica 收藏页&分类页优化
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  自定义每行漫画数量，并隐藏广告网格；支持收藏页和/category/xxx分类页面，Observer仅路由进入页面时临时启动，DOM就绪后立即关闭
// @match        https://pica.fanjugou16.top/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-end
// ==/UserScript==
(function () {
    'use strict';
    const STORAGE_KEY = 'pica-favourite-grid-columns';
    const DEFAULT_COLUMNS = 8;
    let observer = null;
    let appliedColumns = null;

    // ========== 页面判断：收藏页 OR /category/xxx 分类页 ==========
    function isTargetPage() {
        const path = location.pathname;
        return path.includes('/favourite') || path.startsWith('/comics/category/');
    }

    function loadColumns() {
        return GM_getValue(STORAGE_KEY, DEFAULT_COLUMNS);
    }
    function saveColumns(columns) {
        GM_setValue(STORAGE_KEY, columns);
    }

    function setColumns(columns) {
        const grid = document.querySelector('.comic-grid');
        if (!grid) {
            appliedColumns = null;
            return;
        }
        columns = Math.max(1, Math.min(30, parseInt(columns, 10) || DEFAULT_COLUMNS));
        if (appliedColumns === columns) return;
        grid.style.setProperty('grid-template-columns', `repeat(${columns}, minmax(0, 1fr))`, 'important');
        appliedColumns = columns;
        console.log(`[PicaGrid] 设置网格列数: ${columns}`);
    }

    function createColumnControl(section) {
        if (!section) return;
        if (document.querySelector('#pica-grid-columns-control')) return;
        console.log('[PicaGrid] 创建列数控制器');
        const savedColumns = loadColumns();
        const control = document.createElement('div');
        control.id = 'pica-grid-columns-control';
        control.innerHTML = `每行 <input type="number" min="1" max="30" value="${savedColumns}"> 个`;
        const input = control.querySelector('input');
        input.addEventListener('input', function () {
            const columns = Math.max(1, Math.min(30, parseInt(this.value, 10) || 1));
            saveColumns(columns);
            setColumns(columns);
        });
        section.appendChild(control);
        setColumns(savedColumns);
    }

    function addStyle() {
        if (document.querySelector('#pica-grid-columns-style')) return;
        const style = document.createElement('style');
        style.id = 'pica-grid-columns-style';
        style.textContent = `
            .comic-list-ad-grid {
                display: none !important;
            }
            #pica-grid-columns-control {
                display: flex;
                align-items: center;
                margin-left: 12px;
                white-space: nowrap;
            }
            #pica-grid-columns-control input {
                width: 45px;
                margin: 0 4px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
        console.log('[PicaGrid] 注入样式表');
    }

    // 单次探测：启动Observer，找到目标DOM后立刻关闭
    function runOnceObserverTask() {
        // 如果已经存在旧observer，先清理
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        appliedColumns = null;
        console.log('[PicaGrid] 启动一次性Observer，等待DOM就绪');

        observer = new MutationObserver(() => {
            const section = document.body.querySelector('.comic-list-header-controls-section');
            const grid = document.body.querySelector('.comic-grid');
            // 两个关键DOM都存在，代表页面渲染完成
            if (section && grid) {
                createColumnControl(section);
                observer.disconnect();
                observer = null;
                console.log('[PicaGrid] DOM就绪，Observer已关闭');
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 路由切换回调
    function handleRouteChange() {
        if (isTargetPage()) {
            runOnceObserverTask();
        } else {
            // 离开目标页面，兜底清理
            if (observer) {
                observer.disconnect();
                observer = null;
                console.log('[PicaGrid] 离开目标页面，Observer已关闭');
            }
            console.log('[PicaGrid] 离开目标页面，已无打开Observer');
        }
    }

    // 劫持history路由
    const originalPush = history.pushState;
    history.pushState = function (...args) {
        originalPush.apply(this, args);
        handleRouteChange();
    };
    const originalReplace = history.replaceState;
    history.replaceState = function (...args) {
        originalReplace.apply(this, args);
        handleRouteChange();
    };
    window.addEventListener('popstate', handleRouteChange);

    function init() {
        addStyle();
        handleRouteChange();
    }

    if (document.body) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    }
})();
