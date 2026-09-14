// ==UserScript==
// @name         wnacg AutoPager
// @name:zh-CN   榜单 / 列表 / 搜索 自动滚动加载下一页
// @namespace    绅士漫画
// @icon         https://wnacg.com/favicon.ico
// @version      2026-09-14 00:36:07
// @description  支持排行页、专辑列表页、搜索页，排除分类项，滚动到剩余10%自动加载下一页，模拟安卓UA
// @author       You
// @match        *://*.wn09.shop/*
// @match        https://www.wn10.cfd/*
// @match        https://www.wn10.shop/*
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// @time         2026-08-26 18:09:19
// ==/UserScript==

(function () {
    'use strict';

    // ========== 页面自动识别与配置 ==========
    let pageConfig = null;

    function detectPage() {
        // 1. 排行页 ranking
        if (location.href.includes('ranking')) {
            const list = document.querySelector('#topImgCon > .select');
            if (list) {
                return {
                    type: 'ranking',
                    listContainer: list,
                    itemSelector: '#topImgCon > .select > .itemBox'
                };
            }
        }

        // 2. 专辑列表页 / 搜索页（共用 #classify_container 容器）
        const classifyBox = document.getElementById('classify_container');
        if (classifyBox) {
            const isSearch = location.href.includes('/q/');
            return {
                type: isSearch ? 'search' : 'albums',
                listContainer: classifyBox,
                // 排除分类项 cate-0，只取漫画条目
                itemSelector: '#classify_container > li:not(.cate-0)'
            };
        }

        return null;
    }

    pageConfig = detectPage();
    if (!pageConfig) return;

    let nextPageUrl = getNextPageUrl();
    let isLoading = false;
    let noMore = false;

    /**
     * 获取下一页链接，按页面类型适配不同分页结构
     * @param {Document} doc - 目标文档（当前页/远端加载页）
     */
    function getNextPageUrl(doc = document) {
        if (pageConfig.type === 'search') {
            // 搜索页：数字分页，取当前页的下一个兄弟a标签
            const currentPage = doc.querySelector('.block-pagination .thispage');
            if (!currentPage) return null;
            const nextA = currentPage.nextElementSibling;
            return (nextA && nextA.tagName === 'A') ? nextA.href : null;
        } else {
            // 排行页/专辑列表页：标准 next 按钮
            const nextA = doc.querySelector('.block-pagination .next a');
            return nextA ? nextA.href : null;
        }
    }

    // 隐藏原生分页
    const paginationEl = document.querySelector('.block-pagination');
    if (paginationEl) paginationEl.style.display = 'none';

    /**
     * 请求下一页，提取对应条目追加到当前列表
     */
    async function loadNextPage() {
        if (isLoading || noMore || !nextPageUrl) return;
        isLoading = true;
        console.log('达到加载阈值，下一页地址:', nextPageUrl);

        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: nextPageUrl,
                // 安卓移动端请求头，标准ASCII减号
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "zh-CN,zh;q=0.9",
                    "Accept-Encoding": "gzip, deflate"
                },
                onload: function (res) {
                    try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(res.responseText, "text/html");

                        // 根据页面类型提取对应条目（自动排除分类项）
                        const remoteItems = doc.querySelectorAll(pageConfig.itemSelector);
                        if (remoteItems.length > 0) {
                            remoteItems.forEach(item => {
                                pageConfig.listContainer.appendChild(item);
                            });
                        }

                        // 按对应分页结构更新下一页地址
                        nextPageUrl = getNextPageUrl(doc);
                        if (!nextPageUrl) {
                            noMore = true;
                        }
                    } catch (e) {
                        console.error('解析下一页失败', e);
                    }
                    isLoading = false;
                    resolve();
                },
                onerror: function (err) {
                    console.error('请求下一页失败', err);
                    isLoading = false;
                    noMore = true;
                    resolve();
                }
            })
        })
    }

    /**
     * 滚动监听：剩余10%触发加载
     */
    function onScrollCheck() {
        if (isLoading || noMore) return;
        const scrollTop = window.scrollY;
        const viewHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;

        if ((scrollTop + viewHeight) >= docHeight * 0.9) {
            loadNextPage();
        }
    }

    window.addEventListener('scroll', onScrollCheck, { passive: true });

})();
