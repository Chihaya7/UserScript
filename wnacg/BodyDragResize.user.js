// ==UserScript==
// @name:zh-CN   Body双向拖拽缩放
// @name         BodyDragResize
// @namespace    绅士漫画
// @icon         https://wnacg.com/favicon.ico
// @version      1.0.15
// @description  网页body拖拽缩放,用于快速调整绅士漫画移动版网页大小，从而控制漫画显示列数
// @author       You
// @match        *://*.wn09.shop/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @time         2026-08-26 11:36:13
// ==/UserScript==

(function () {
    'use strict';

    GM_addStyle(`
        body{
            visibility:hidden !important;
            box-sizing: border-box !important;
            position: relative !important;
        }
        body.tm-viewport-ready{
            visibility:visible !important;
        }
        .tm-body-resize-handle{
            position: fixed !important;
            top: 0 !important;
            width: 12px !important;
            height: 100vh !important;
            cursor: ew-resize !important;
            background: transparent !important;
            z-index: 999999 !important;
        }
        .tm-body-resize-handle:hover{
            background: rgba(128,128,128,0.25) !important;
        }
        .tm-reset-btn{
            position: fixed !important;
            top:12px !important;
            right:16px !important;
            z-index:9999999 !important;
            padding:4px 10px !important;
            background:#444 !important;
            color:#fff !important;
            border:none !important;
            border-radius:4px !important;
            cursor:pointer !important;
            font-size:12px !important;
        }
        .tm-reset-btn:hover{
            background:#222 !important;
        }
    `);

    let isDragging = false;
    let dragStartPercent = 0; // 拖拽开始瞬间保存的滚动百分比
    const MIN_WIDTH = 120;
    const MAX_WIDTH = window.innerWidth;
    let observer = null;
    let inited = false;
    let handle = null;

    let rafId = null;
    function syncHandlePosition() {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            rafId = null;
            if (!handle || !document.body.style.width) return;
            const bodyRect = document.body.getBoundingClientRect();
            handle.style.left = (bodyRect.right - 6) + 'px';
        });
    }

    /** 获取当前滚动百分比 0 ~ 1 */
    function getScrollPercent() {
        const docEl = document.documentElement;
        const totalScroll = docEl.scrollHeight - docEl.clientHeight;
        if (totalScroll <= 0) return 0;
        return window.scrollY / totalScroll;
    }

    /** 根据百分比设置滚动位置 */
    function setScrollByPercent(percent) {
        const docEl = document.documentElement;
        const totalScroll = docEl.scrollHeight - docEl.clientHeight;
        const targetY = totalScroll * percent;
        window.scrollTo(0, targetY);
    }

    /** 直接设置宽度，拖拽过程使用，不做滚动校正 */
    function setBodyWidthRaw(targetW) {
        const marginHorizontal = (window.innerWidth - targetW) / 2;
        document.body.style.width = targetW + 'px';
        document.body.style.marginLeft = marginHorizontal + 'px';
        document.body.style.marginRight = marginHorizontal + 'px';
        GM_setValue('resize_body_width', targetW);
        syncHandlePosition();
    }

    /** 设置宽度并立刻按百分比校正，用于初始化、还原按钮 */
    function setBodyWidthWithScrollFix(targetW, percent) {
        const marginHorizontal = (window.innerWidth - targetW) / 2;
        document.body.style.width = targetW + 'px';
        document.body.style.marginLeft = marginHorizontal + 'px';
        document.body.style.marginRight = marginHorizontal + 'px';
        GM_setValue('resize_body_width', targetW);

        requestAnimationFrame(() => {
            setScrollByPercent(percent);
            syncHandlePosition();
        });
    }

    function initScript() {
        if (inited) return;
        inited = true;
        if (observer) {
            observer.disconnect();
            observer = null;
        }

        handle = document.createElement('div');
        handle.className = 'tm-body-resize-handle';
        document.body.appendChild(handle);

        const resetBtn = document.createElement('button');
        resetBtn.className = 'tm-reset-btn';
        resetBtn.textContent = '还原缩放';
        document.body.appendChild(resetBtn);

        const savedW = GM_getValue('resize_body_width', null);
        if (savedW && typeof savedW === 'number') {
            const w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, savedW));
            const pct = getScrollPercent();
            setBodyWidthWithScrollFix(w, pct);
        }

        syncHandlePosition();
        window.addEventListener('scroll', syncHandlePosition);
        window.addEventListener('resize', syncHandlePosition);

        document.body.classList.add('tm-viewport-ready');

        resetBtn.addEventListener('click', () => {
            const percent = getScrollPercent();
            document.body.style.width = '';
            document.body.style.marginLeft = '';
            document.body.style.marginRight = '';
            document.body.style.position = '';
            GM_setValue('resize_body_width', null);
            handle.style.left = '';
            requestAnimationFrame(() => {
                setScrollByPercent(percent);
            });
        });

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            document.body.style.userSelect = 'none';
            // ✅拖拽开始瞬间，仅采集一次百分比
            dragStartPercent = getScrollPercent();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const mouseScreenX = e.clientX;
            const newWidth = mouseScreenX * 2 - window.innerWidth;
            const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
            // ✅拖拽过程只改宽度，**不做滚动校正**，允许页面临时跳动
            setBodyWidthRaw(clampedWidth);
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                // ✅拖拽结束松开鼠标，执行一次滚动归位
                requestAnimationFrame(() => {
                    setScrollByPercent(dragStartPercent);
                });
            }
        });
    }

    observer = new MutationObserver(() => {
        if (document.body) {
            initScript();
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: false });

    if (document.body) {
        initScript();
    }

})();
