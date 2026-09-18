// ==UserScript==
// @name         EH Viewer Rebuild
// @name:zh-CN   EH站阅读器重构版
// @namespace    https://github.com/local/ehviewer-rebuild
// @version      1.6.4
// @author       Rebuild from Comic Looms
// @description  在ExHentai/E-Hentai画廊页直接重构缩略图列表，支持大图阅读和下载
// @description:zh-CN  在ExHentai/E-Hentai画廊页直接重构缩略图列表，支持大图阅读和下载
// @match        https://exhentai.org/g/*
// @match        https://e-hentai.org/g/*
// @match        https://exhentai.org/s/*
// @match        https://e-hentai.org/s/*
// @require      https://cdn.jsdelivr.net/npm/@zip.js/zip.js@2.8.23/dist/zip.min.js
// @require      https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @grant        GM.xmlHttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-end
// ==/UserScript==
// refactor:EH Viewer缩略图显示重构 从拆分雪碧图到Css控制

(function () {
    "use strict";

    // ============================================================================
    // 第一部分：常量与正则表达式
    // ============================================================================

    /**
     * REGEX - 集中管理所有正则表达式
     * 仿照原脚本 regulars 对象的设计
     */
    const REGEX = {
        // 画廊页URL匹配：https://exhentai.org/g/{gid}/{token}/ （含 wn09.shop 镜像域名）
        workURL: /^https?:\/\/(exhentai\.org|e-hentai\.org)\/g\/\d+\/[\w-]+\/?/,
        // 图片详情页URL匹配：https://exhentai.org/s/{hash}/{gid}-{pagenum} （含 wn09.shop 镜像域名）
        pageURL: /^https?:\/\/(exhentai\.org|e-hentai\.org)\/s\/[\w-]+\/\d+-\d+/,
        // 从CSS background样式中提取雪碧图URL：url("...") 或 url('...') 或 url(...)
        // 注意：原脚本用 /url\((.*?)\)/ 不处理引号，提取后需手动去掉引号
        sprite: /url\(["']?(.*?)["']?\)/,
        // 从详情页HTML中提取原图下载链接（原脚本方式：匹配 /fullimg 路径）
        // 原脚本正则：/\<a href="((https?:\/\/[^\/]*)?\/fullimg[^"\\]*)"\>/
        original: /<a\s+href="((https?:\/\/[^"]*)?\/fullimg[^"\\]*)">/,
        // 备选：通过 id="i7" 匹配原图下载链接
        originalAlt: /<a[^>]*id="i7"[^>]*href="([^"]+)"/,
        // 从详情页HTML中提取压缩图链接（<img id="img" src="...">）
        // 原脚本正则要求 src 后紧跟空格+style，这里用更宽松的匹配
        normal: /<img[^>]*id="img"[^>]*src="([^"]+)"/,
        // 从详情页HTML中提取nl值（用于原图下载重试）
        // 原脚本方式：nl值在 id="loadfail" 的a标签的onclick中，格式为 nl('...')
        // 原脚本正则：/\<a\shref="#"\sid="loadfail"\sonclick="return\snl\('(.*)'\)"\>/
        nlValue: /<a\s+href="#"\s+id="loadfail"[^>]*onclick="return\s+nl\('([^']*)'\)"/,
        // 备选：从 nl() 函数调用中提取nl值
        nlValueAlt: /nl\('([^']+)'\)/,
        // 检测509错误图片（配额超限）
        error509: /509\.gif$/,
        // 从缩略图src中提取宽高信息（EH缩略图URL包含尺寸）
        rectFromSrc: /\/\w+-\d+-(\d+)-(\d+)-/,
        // 提取文件名扩展名
        extension: /\.(\w+)(?:\?|$)/,
    };

    /**
     * TRANSPARENT_1PX_GIF - 1px 透明 GIF（data URI）
     * 用于大图占位阶段给无 src 的 img 一个合法源，
     * 避免浏览器把空 img 渲染成"破图占位框 + alt 文字"显示在左上角
     */
    const TRANSPARENT_1PX_GIF = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

    /**
     * DEFAULT_CONFIG - 默认配置项
     * 仿照原脚本配置系统，支持全套配置面板
     */
    const DEFAULT_CONFIG = {
        // ===== 浏览相关 =====
        threads: 3,              // 大图浏览时最大并发下载数（同时下载的图片数量）
        maxPreloadDistance: 10,  // 最大预加载距离（页数），0为不限制（保留兼容）
        maxIdleThreads: 2,       // 空闲时同时加载的最大图片数
        preloadAhead: 3,         // 当前图后面预加载几张
        preloadBehind: 1,        // 当前图前面预加载几张
        autoLoad: true,          // 进入阅读界面后自动加载图片
        autoLoadInBackground: false, // 标签页失去焦点后保持自动加载
        autoOpen: false,         // 进入画廊页后自动展开阅读视图
        autoEnterBig: false,     // 点击入口后直接进入大图模式
        recordReadingProgress: true, // 记录阅读进度

        // ===== 阅读模式 =====
        readMode: "continuous",   // 阅读模式：continuous(连续垂直滚动) / pagination(翻页) / horizontal(横向滚动)
        reversePages: false,      // 反向翻页（日漫从右到左）
        imgScale: 100,            // 图片缩放百分比（兼容旧版，不再使用）
        imgScaleContinuous: 100,  // 连续模式图片缩放百分比
        imgScaleHorizontal: 100,  // 横向模式图片缩放百分比
        imgScalePagination: 100,  // 翻页模式图片缩放百分比
        paginationIMGCount: 1,    // 翻页模式下每页展示的图片数量
        autoPlay: false,          // 进入大图模式时自动播放
        autoPageSpeed: 5,         // 自动翻页速度（秒）
        preventScrollPageTime: 300, // 翻页模式最小翻页间隔（毫秒）
        scrollingDelta: 100,      // 自定义滚动每次滚动距离
        scrollingSpeed: 1,        // 自定义滚动速度
        smartScrolling: false,    // 智能滚动（需要时自动横向滚动）
        stickyMouse: false,       // 翻页模式下鼠标移动自动滚动单图
        magnifier: true,          // 放大镜功能（翻页模式下拖动放大）

        // ===== 缩略图 =====
        colCount: 5,              // 缩略图每行数量
        rowHeight: 200,           // 自适应布局每行参考高度
        enableFlowVision: false,  // 启用自适应视图布局
        hdThumbnails: false,      // 高清缩略图（从大图重采样）

        // ===== 下载相关 =====
        downloadThreads: 3,       // 下载时最大并发数
        fetchOriginal: false,     // 下载原图（消耗配额）
        filenameOrder: "auto",    // 文件名排序：auto/numbers/original/alphabetically

        // ===== E-Hentai 专属 =====
        ehentaiTitlePrefer: "english", // 标题语言偏好：english/japanese
        ehentaiMirrorHost: "",     // 镜像服务器地址（如 https://xxx.xx）

        // ===== UI相关 =====
        autoCollapsePanel: true,  // 鼠标移出控制面板时自动收起
        minifyPageHelper: "never", // 控制栏最小化时机：never/always/idle
        dragToMove: false,        // 允许拖动控制栏
        enableTooltips: true,     // 启用提示

        // ===== 站点独立配置 =====
        siteConfig: {},           // 按站点存储的独立配置
    };

    // ============================================================================
    // 第二部分：工具函数
    // ============================================================================

    /**
     * 简单的日志输出，带前缀标识
     * @param {string} level - 日志级别 info/warn/error
     * @param {...any} args - 日志内容
     */
    function log(level, ...args) {
        const prefix = "[EHViewer]";
        if (level === "error") console.error(prefix, ...args);
        else if (level === "warn") console.warn(prefix, ...args);
        else console.log(prefix, ...args);
    }

    /**
     * 延时函数
     * @param {number} ms - 毫秒数
     * @returns {Promise<void>}
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 从CSS样式对象中提取宽高
     * @param {CSSStyleDeclaration} style - 元素的style对象
     * @returns {{w:number, h:number}|undefined}
     */
    function extractRectFromStyle(style) {
        const w = parseInt(style.width);
        const h = parseInt(style.height);
        if (isNaN(w) || isNaN(h)) return undefined;
        return { w, h };
    }

    /**
     * 从缩略图src中提取宽高信息
     * @param {string} src - 图片URL
     * @returns {{w:number, h:number}|undefined}
     */
    function extractRectFromSrc(src) {
        if (!src) return undefined;
        const matches = src.match(REGEX.rectFromSrc);
        if (matches && matches.length === 3) {
            return { w: parseInt(matches[1]), h: parseInt(matches[2]) };
        }
        return undefined;
    }

    /**
     * 替换URL中的host为镜像host
     * @param {string} url - 原始URL
     * @param {string} mirrorHost - 镜像服务器地址
     * @returns {string}
     */
    function replaceHost(url, mirrorHost) {
        if (!mirrorHost) return url;
        try {
            const u = new URL(url);
            const mirror = new URL(mirrorHost);
            u.host = mirror.host;
            u.protocol = mirror.protocol;
            return u.href;
        } catch (e) {
            return url;
        }
    }

    /**
     * 雪碧图直显（路线A）：把裁剪区作为背景显示在元素上
     * 先用 px 定位 + auto 显示原始尺寸，待雪碧图真实尺寸加载后切换为百分比定位，
     * 使任意容器尺寸（colCount/流式布局/窗口缩放）下都精确显示对应裁剪区
     * 百分比公式：size = SW/cw×100% SH/ch×100%；position = x/(SW-cw)×100% y/(SH-ch)×100%
     * 缩略图网格与大图阅读占位共用此函数
     * @param {HTMLElement} el - 背景承载元素（网格imgwrap或大图img）
     * @param {{url:string, positions:Array<{x:number,y:number,w:number,h:number}>, groupIndex:number}} sprite - 雪碧图信息
     */
    function applySpriteBackground(el, sprite) {
        const rect = sprite.positions[sprite.groupIndex] || { x: 0, y: 0, w: 100, h: 100 };
        el.style.backgroundImage = `url("${sprite.url}")`;
        el.style.backgroundRepeat = "no-repeat";
        // 初始：原始尺寸 + px 定位（尺寸信息未加载时也能先显示裁剪区）
        el.style.backgroundPosition = `${-rect.x}px ${-rect.y}px`;
        SpriteSplitter.getSpriteSize(sprite.url).then(size => {
            if (!size || !el.isConnected) return;
            const { w: SW, h: SH } = size;
            const { x, y, w: cw, h: ch } = rect;
            if (!(SW > 0 && SH > 0 && cw > 0 && ch > 0)) return;
            // 百分比定位：相对容器，任何容器尺寸下裁剪区都精确填满
            el.style.backgroundSize = `${(SW / cw * 100).toFixed(4)}% ${(SH / ch * 100).toFixed(4)}%`;
            const px = (SW - cw > 0) ? `${(x / (SW - cw) * 100).toFixed(4)}%` : "0px";
            const py = (SH - ch > 0) ? `${(y / (SH - ch) * 100).toFixed(4)}%` : "0px";
            el.style.backgroundPosition = `${px} ${py}`;
        }).catch(e => {
            log("warn", `getSpriteSize failed for ${sprite.url}:`, e);
        });
    }

    /**
     * 清理文件名中的非法字符
     * @param {string} name - 原始文件名
     * @returns {string}
     */
    function sanitizeFilename(name) {
        return name.replace(/[\\/:*?"<>|\n\t]/g, "_").trim();
    }

    /**
     * GM.xmlHttpRequest 的 Promise 封装
     * @param {string} url - 请求URL
     * @param {string} responseType - 响应类型 text/blob/arraybuffer
     * @param {object} options - 额外选项 {headers, method, data, onprogress}
     * @returns {Promise<{response:any, status:number, readyState:number}>}
     */
    function gmXhr(url, responseType = "text", options = {}) {
        return new Promise((resolve, reject) => {
            const details = {
                method: options.method || "GET",
                url: url,
                responseType: responseType,
                headers: options.headers || {},
                onload: function (response) {
                    resolve({
                        response: response.response,
                        status: response.status,
                        readyState: response.readyState,
                    });
                },
                onerror: function (response) {
                    reject(new Error(
                        `XHR error: status=${response.status}, error=${response.error || "unknown"}`
                    ));
                },
                ontimeout: function () {
                    reject(new Error("XHR timeout"));
                },
                onprogress: options.onprogress,
            };
            if (options.data) details.data = options.data;
            if (options.timeout) details.timeout = options.timeout;
            GM.xmlHttpRequest(details);
        });
    }

    /**
     * DownloadSemaphore - 下载并发控制器（信号量）
     * 限制同时下载的图片数量，避免打开大图时所有图片同时下载导致网络拥塞
     * 配置项 threads 控制最大并发数，可在配置面板中修改
     */
    class DownloadSemaphore {
        /**
         * @param {number} maxConcurrent - 最大并发数
         */
        constructor(maxConcurrent) {
            /** @type {number} 最大并发数 */
            this.maxConcurrent = maxConcurrent;
            /** @type {number} 当前正在下载的数量 */
            this.current = 0;
            /** @type {Function[]} 等待队列 */
            this.queue = [];
        }

        /**
         * 获取一个下载许可（如果达到上限则等待）
         * @returns {Promise<void>}
         */
        async acquire() {
            if (this.current < this.maxConcurrent) {
                this.current++;
                return;
            }
            return new Promise(resolve => {
                this.queue.push(resolve);
            });
        }

        /**
         * 释放一个下载许可
         */
        release() {
            this.current--;
            this._pump();
        }

        /**
         * 尝试启动等待队列中的任务
         */
        _pump() {
            while (this.queue.length > 0 && this.current < this.maxConcurrent) {
                this.current++;
                const resolve = this.queue.shift();
                resolve();
            }
        }

        /**
         * 动态修改最大并发数（配置变化时调用）
         * @param {number} max - 新的最大并发数
         */
        setMax(max) {
            this.maxConcurrent = Math.max(1, max);
            this._pump();
        }
    }

    // ============================================================================
    // 第三部分：事件总线
    // ============================================================================

    /**
     * EventBus - 简单的发布订阅事件总线
     * 用于各模块之间的松耦合通信，仿照原脚本 EBUS 的设计
     *
     * 核心事件列表：
     * - "app-init"          : 应用初始化完成
     * - "page-appended"     : 新一页图片已追加到列表 (total, nodes, done)
     * - "image-loaded"      : 单张图片加载完成 (index, success)
     * - "image-progress"    : 单张图片下载进度 (index, loaded, total)
     * - "big-open"          : 打开大图阅读 (index)
     * - "big-close"         : 关闭大图阅读
     * - "big-step"          : 大图翻页 (index)
     * - "download-start"    : 开始下载
     * - "download-progress" : 下载进度 (current, total)
     * - "download-done"     : 下载完成
     * - "config-changed"    : 配置项变更 (key, value)
     * - "notify"            : 显示通知消息 (type, message, duration)
     */
    class EventBus {
        constructor() {
            /** @type {Map<string, Set<Function>>} 事件名 -> 回调函数集合 */
            this.listeners = new Map();
        }

        /**
         * 订阅事件
         * @param {string} event - 事件名
         * @param {Function} callback - 回调函数
         * @returns {Function} 取消订阅的函数
         */
        subscribe(event, callback) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, new Set());
            }
            this.listeners.get(event).add(callback);
            return () => this.unsubscribe(event, callback);
        }

        /**
         * 取消订阅
         * @param {string} event - 事件名
         * @param {Function} callback - 要移除的回调函数
         */
        unsubscribe(event, callback) {
            this.listeners.get(event)?.delete(callback);
        }

        /**
         * 发布事件
         * @param {string} event - 事件名
         * @param  {...any} args - 传递给回调的参数
         */
        emit(event, ...args) {
            const set = this.listeners.get(event);
            if (!set) return;
            for (const cb of set) {
                try {
                    cb(...args);
                } catch (e) {
                    log("error", `EventBus emit "${event}" error:`, e);
                }
            }
        }
    }

    // ============================================================================
    // 第四部分：配置管理
    // ============================================================================

    /**
     * Config - 配置管理器
     * 负责配置的读取、保存、默认值合并，支持站点独立配置
     * 存储使用 GM_getValue / GM_setValue（油猴脚本的持久化存储）
     */
    class Config {
        /**
         * @param {EventBus} bus - 事件总线实例
         */
        constructor(bus) {
            this.bus = bus;
            /** @type {object} 当前生效的配置（合并了默认值和用户保存值） */
            this.data = {};
            this.load();
        }

        /**
         * 从 GM 存储中加载配置，与默认值合并
         */
        load() {
            try {
                const saved = GM_getValue("ehviewer_config", null);
                if (saved && typeof saved === "object") {
                    this.data = { ...DEFAULT_CONFIG, ...saved };
                } else {
                    this.data = { ...DEFAULT_CONFIG };
                }
            } catch (e) {
                log("warn", "Config load failed, using defaults:", e);
                this.data = { ...DEFAULT_CONFIG };
            }
        }

        /**
         * 保存配置到 GM 存储
         */
        save() {
            try {
                GM_setValue("ehviewer_config", this.data);
            } catch (e) {
                log("error", "Config save failed:", e);
            }
        }

        /**
         * 获取配置项的值
         * @param {string} key - 配置项键名
         * @returns {any} 配置项的值
         */
        get(key) {
            return this.data[key];
        }

        /**
         * 设置配置项的值并保存
         * @param {string} key - 配置项键名
         * @param {any} value - 配置项的值
         */
        set(key, value) {
            this.data[key] = value;
            this.save();
            this.bus.emit("config-changed", key, value);
        }

        /**
         * 批量设置配置项
         * @param {object} obj - 键值对对象
         */
        setBatch(obj) {
            Object.assign(this.data, obj);
            this.save();
            for (const key of Object.keys(obj)) {
                this.bus.emit("config-changed", key, obj[key]);
            }
        }

        /**
         * 重置所有配置为默认值
         */
        reset() {
            this.data = { ...DEFAULT_CONFIG };
            this.save();
            this.bus.emit("config-changed", "*", null);
        }
    }

    // ============================================================================
    // 第五部分：数据模型
    // ============================================================================

    /**
     * FetchState - 图片获取状态枚举
     * 仿照原脚本 FetchState 的设计
     */
    const FetchState = {
        FAILED: 0,  // 获取失败
        URL: 1,     // 已获取原图URL（待下载数据）
        DATA: 2,    // 已下载图片数据
        DONE: 3,    // 全部完成（已渲染/已处理）
    };

    /**
     * ImageNode - 图片节点数据模型
     * 存储单张图片的所有信息：缩略图、详情页链接、原图URL、下载状态等
     * 仿照原脚本 ImageNode 类的设计
     */
    class ImageNode {
        /**
         * @param {string} thumb - 缩略图URL（或blob URL）
         * @param {string} href - 图片详情页URL
         * @param {string} title - 图片标题/文件名
         * @param {object} [wh] - 缩略图宽高 {w, h}
         * @param {object} [sprite] - 雪碧图信息 {url, positions, groupIndex}（路线A直显用）
         */
        constructor(thumb, href, title, wh, sprite) {
            /** @type {string} 缩略图URL */
            this.thumbnailImage = thumb;
            /** @type {string} 详情页URL */
            this.href = href;
            /** @type {string} 图片标题/文件名 */
            this.title = title;
            /** @type {{w:number, h:number}|undefined} 缩略图宽高 */
            this.wh = wh;
            /** @type {{url:string, positions:Array<{x:number,y:number,w:number,h:number}>, groupIndex:number}|undefined} 雪碧图信息（网格用CSS背景直显，独立URL按需懒拆分） */
            this.sprite = sprite;
            /** @type {string|undefined} 原图URL（获取详情页后填充） */
            this.originSrc = undefined;
            /** @type {string|undefined} 图片blob URL（下载完成后填充） */
            this.blobSrc = undefined;
            /** @type {Blob|undefined} 图片数据blob */
            this.blob = undefined;
            /** @type {string|undefined} 图片MIME类型 */
            this.contentType = undefined;
            /** @type {number} 在列表中的索引位置 */
            this.index = -1;
        }

        /**
         * 获取独立的缩略图URL（雪碧图懒拆分，整组共享一次拆分并缓存）
         * 仅当真正需要独立图片URL时调用（如大图阅读占位）；网格显示直接用CSS背景定位，不调用此方法
         * @returns {Promise<string|null>}
         */
        async getSplitThumbUrl() {
            if (!this.sprite) return null;
            try {
                return await SpriteSplitter.getGroupThumbUrl(this.sprite);
            } catch (e) {
                log("error", "getSplitThumbUrl failed:", e);
                return null;
            }
        }
    }

    /**
     * Chapter - 章节数据模型
     * E-Hentai 单画廊通常只有一个章节，但保留多章节支持
     * 仿照原脚本 Chapter 类的设计
     */
    class Chapter {
        /**
         * @param {number} id - 章节ID
         * @param {string} title - 章节标题
         * @param {string} source - 章节源URL
         */
        constructor(id, title, source) {
            /** @type {number} 章节ID */
            this.id = id;
            /** @type {string} 章节标题 */
            this.title = title;
            /** @type {string} 章节源URL（画廊页URL） */
            this.source = source;
            /** @type {ImageFetcher[]} 该章节的所有图片加载器 */
            this.queue = [];
            /** @type {boolean} 是否所有页都已加载完毕 */
            this.done = false;
            /** @type {AsyncGenerator|undefined} 分页URL迭代器 */
            this.sourceIter = undefined;
            /** @type {Document|undefined} 画廊页DOM文档（用于解析元数据） */
            this.doc = undefined;
            /** @type {object|undefined} 画廊元数据 */
            this.meta = undefined;
        }
    }

    // ============================================================================
    // 第六部分：雪碧图拆分器
    // ============================================================================

    /**
     * SpriteSplitter - 雪碧图拆分器
     * E-Hentai 的缩略图使用雪碧图技术：多张缩略图合并在一张 webp 图片上，
     * 通过 CSS background-position 偏移显示单张缩略图。
     * 本类负责将雪碧图加载后，按位置裁剪成单独的图片 blob。
     * 仿照原脚本 splitImagesFromUrl 函数的设计
     */
    class SpriteSplitter {
        /**
         * 从雪碧图URL和位置列表中拆分出单独的图片
         * @param {string} url - 雪碧图URL
         * @param {Array<{x:number, y:number, w:number, h:number}>} positions - 每张图片在雪碧图中的位置和尺寸
         * @returns {Promise<string[]>} 拆分后的图片blob URL数组
         */
        static async split(url, positions) {
            try {
                // 直接用 GM.xmlHttpRequest 加载为 arraybuffer，避免跨域 canvas 污染
                // 不用 <img crossOrigin> 尝试（hath.network 不返回 CORS 头，必失败）
                // 用 arraybuffer 而非 blob，避免 Chrome 跨上下文 Blob 复制行为
                const arrayBuffer = await new Promise((resolve, reject) => {
                    GM.xmlHttpRequest({
                        method: "GET",
                        url: url,
                        responseType: "arraybuffer",
                        onload: (r) => resolve(r.response),
                        onerror: (r) => reject(new Error("GM XHR failed: " + (r.error || r.status))),
                    });
                });

                // 在网页上下文中创建同源 Blob，避免 Chrome 跨上下文 Blob 复制
                // 雪碧图通常是 webp 格式，从 URL 推断 MIME type
                const mimeType = url.endsWith(".webp") ? "image/webp" : "image/png";
                const blob = new Blob([arrayBuffer], { type: mimeType });
                const blobUrl = URL.createObjectURL(blob);

                // 加载同源 blob URL 到 Image（canvas 不会被污染）
                const img = await SpriteSplitter.loadImage(blobUrl);

                const results = [];
                for (let i = 0; i < positions.length; i++) {
                    const pos = positions[i];
                    const canvas = document.createElement("canvas");
                    canvas.width = pos.w;
                    canvas.height = pos.h;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, pos.x, pos.y, pos.w, pos.h, 0, 0, pos.w, pos.h);
                    try {
                        const blob = await new Promise((resolve, reject) => {
                            canvas.toBlob((b) => b ? resolve(b) : reject(new Error("toBlob returned null")), "image/png");
                        });
                        results.push(URL.createObjectURL(blob));
                    } catch (e) {
                        // 回退：直接用雪碧图URL作为缩略图（不拆分）
                        results.push(url);
                    }
                }
                return results;
            } catch (e) {
                throw e;
            }
        }

        /**
         * 加载图片为 Image 对象
         * 仅用于加载同源 blob URL，不需要 crossOrigin
         * @param {string} url - 图片URL（同源 blob URL）
         * @returns {Promise<HTMLImageElement>}
         */
        static loadImage(url) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                // 同源 blob URL 不需要 crossOrigin，设置反而可能导致问题
                img.onload = () => {
                    resolve(img);
                };
                img.onerror = (e) => {
                    reject(new Error(`Failed to load sprite image: ${url}`));
                };
                img.src = url;
                // 15秒超时
                setTimeout(() => reject(new Error("Sprite image load timeout")), 15000);
            });
        }

        /**
         * 从CSS样式中解析雪碧图位置信息
         * 解析 background-position 和 width/height，得到在雪碧图中的裁剪矩形
         * @param {CSSStyleDeclaration} style - 元素的style对象
         * @returns {{x:number, y:number, w:number, h:number}}
         */
        static parsePosition(style) {
            const w = parseInt(style.width) || 100;
            const h = parseInt(style.height) || 100;
            // background-position 格式如 "-200px 0px" 或 "0px 0px"
            const bgPos = style.backgroundPosition || "0px 0px";
            const match = bgPos.match(/-?(\d+)px\s+-?(\d+)px/);
            const x = match ? parseInt(match[1]) : 0;
            const y = match ? parseInt(match[2]) : 0;
            return { x, y, w, h };
        }

        // ===== 路线A：懒拆分与尺寸缓存 =====
        /** @type {Map<string, Promise<string[]>>} 雪碧图URL -> 整组拆分结果的Promise（懒拆分缓存，同一URL只下载/编码一次） */
        static groupCache = new Map();
        /** @type {Map<string, Promise<{w:number,h:number}|null>>} 雪碧图URL -> 真实尺寸Promise（一次Image加载，浏览器缓存命中） */
        static sizeCache = new Map();

        /**
         * 懒拆分：获取某个裁剪区对应的独立缩略图URL
         * 整组共享一次拆分，结果按组内序号取用；失败时回退为雪碧图URL并移出缓存以便重试
         * @param {{url:string, positions:Array<{x:number,y:number,w:number,h:number}>, groupIndex:number}} sprite - 雪碧图信息
         * @returns {Promise<string>}
         */
        static getGroupThumbUrl(sprite) {
            let p = SpriteSplitter.groupCache.get(sprite.url);
            if (!p) {
                p = SpriteSplitter.split(sprite.url, sprite.positions).catch(err => {
                    SpriteSplitter.groupCache.delete(sprite.url);
                    log("warn", "SpriteSplitter lazy split failed, fallback to sprite url:", err);
                    return sprite.positions.map(() => sprite.url);
                });
                SpriteSplitter.groupCache.set(sprite.url, p);
            }
            return p.then(results => results[sprite.groupIndex] || sprite.url);
        }

        /**
         * 获取雪碧图真实尺寸（一次 Image 加载，浏览器缓存命中；不做 canvas、不编码）
         * @param {string} url - 雪碧图URL
         * @returns {Promise<{w:number,h:number}|null>} 失败或超时返回 null
         */
        static getSpriteSize(url) {
            if (!SpriteSplitter.sizeCache.has(url)) {
                const p = new Promise((resolve) => {
                    const img = new Image();
                    const timer = setTimeout(() => {
                        resolve(null);
                    }, 10000);
                    img.onload = () => {
                        clearTimeout(timer);
                        resolve({ w: img.naturalWidth, h: img.naturalHeight });
                    };
                    img.onerror = () => {
                        clearTimeout(timer);
                        resolve(null);
                    };
                    img.src = url;
                });
                SpriteSplitter.sizeCache.set(url, p);
            }
            return SpriteSplitter.sizeCache.get(url);
        }
    }

    // ============================================================================
    // 第七部分：站点适配器 - ExHentaiMatcher（核心）
    // ============================================================================

    /**
     * ExHentaiMatcher - ExHentai/E-Hentai 站点适配器
     * 核心类，负责：
     * 1. 从画廊页解析元数据（标题、标签等）
     * 2. 生成分页URL列表
     * 3. 解析每一页的缩略图（支持雪碧图拆分、MPV模式）
     * 4. 从详情页获取原图URL（支持原图/压缩图、nl重试）
     * 5. 下载图片数据
     *
     * 完全仿照原脚本 EHMatcher 类的设计和逻辑
     */
    class ExHentaiMatcher {
        /**
         * @param {Config} config - 配置管理器实例
         */
        constructor(config) {
            this.config = config;
            /** @type {Map<number, Document>} 章节ID -> 画廊页DOM文档缓存 */
            this.docMap = new Map();
        }

        /**
         * 获取当前站点的 origin
         * @returns {string}
         */
        get origin() {
            return window.location.origin;
        }

        /**
         * 从画廊页DOM中解析画廊元数据
         * @param {Chapter} chapter - 章节对象
         * @returns {object} 元数据 {url, title, originTitle, tags}
         */
        galleryMeta(chapter) {
            if (chapter.meta) return chapter.meta;

            const doc = chapter.doc || document;
            const meta = {
                url: window.location.href,
                title: "UNTITLE",
                originTitle: undefined,
                tags: {},
            };

            // 标题：#gd2 h1 第一个是英文/罗马音标题，第二个是日文标题
            const titleList = doc.querySelectorAll("#gd2 h1");
            if (titleList && titleList.length > 0) {
                meta.title = titleList[0].textContent?.trim() || "UNTITLE";
                if (titleList.length > 1) {
                    meta.originTitle = titleList[1].textContent?.trim() || undefined;
                }
            }

            // 根据配置选择标题语言偏好
            if (this.config.get("ehentaiTitlePrefer") === "japanese" && meta.originTitle) {
                [meta.title, meta.originTitle] = [meta.originTitle, meta.title];
            }

            // 分类：#gdc > div
            const category = doc.querySelector("#gdc > div")?.textContent?.trim();
            if (category) meta.tags["category"] = [category];

            // 上传者：#gdn > a
            const uploader = doc.querySelector("#gdn > a")?.textContent?.trim();
            if (uploader) meta.tags["uploader"] = [uploader];

            // 画廊详情：#gdd table tr
            const detailRows = doc.querySelectorAll("#gdd > table tr");
            detailRows.forEach(tr => {
                const cat = tr.querySelector(".gdt1")?.textContent?.replace(":", "").trim().toLowerCase();
                const value = tr.querySelector(".gdt2")?.textContent?.trim();
                if (cat && value && cat !== "language") {
                    meta.tags[cat] = [value];
                }
            });

            // 标签：#taglist tr
            const tagRows = doc.querySelectorAll("#taglist tr");
            tagRows.forEach(tr => {
                const tds = tr.children;
                if (tds.length < 2) return;
                const cat = tds[0].textContent?.replace(":", "").trim();
                if (!cat) return;
                const tags = [];
                tds[1].querySelectorAll("a, div").forEach(el => {
                    const text = el.textContent?.trim();
                    if (text) tags.push(text);
                });
                if (tags.length > 0) meta.tags[cat] = tags;
            });

            chapter.meta = meta;
            return meta;
        }

        /**
         * 获取章节列表（E-Hentai 单画廊通常只有一个章节）
         * @returns {Promise<Chapter[]>}
         */
        async fetchChapters() {
            const chapter = new Chapter(0, "Default", window.location.href);
            chapter.doc = document;
            this.docMap.set(0, document);
            this.galleryMeta(chapter);
            chapter.title = chapter.meta.title;
            return [chapter];
        }

        /**
         * 生成分页URL迭代器
         * 从画廊页的分页导航中提取最大页码，生成 ?p=0, ?p=1, ... ?p=N 的URL序列
         * @param {Chapter} chapter - 章节对象
         * @returns {AsyncGenerator<string>} 分页URL异步生成器
         */
        async *fetchPagesSource(chapter) {
            const doc = chapter.doc || document;

            // 检查是否是 MPV（Multi-Page Viewer）模式
            const firstImageHref = doc.querySelector("#gdt a")?.getAttribute("href");
            if (firstImageHref && /mpv/.test(firstImageHref)) {
                // MPV 模式下所有图片在一个页面中，直接 yield 当前URL
                yield window.location.href;
                return;
            }

            // 从分页导航 .gtb td a 提取所有分页链接
            const pageLinks = Array.from(doc.querySelectorAll(".gtb td a"))
                .filter(a => a.href)
                .map(a => a.href);

            if (pageLinks.length === 0) {
                // 没有分页导航，说明只有一页
                yield window.location.href;
                return;
            }

            // 找到最大页码
            let maxPage = 0;
            let baseUrl = null;
            for (const link of pageLinks) {
                try {
                    const u = new URL(link);
                    const p = parseInt(u.searchParams.get("p") || "0");
                    if (p >= maxPage) {
                        maxPage = p;
                        baseUrl = u;
                    }
                } catch (e) { /* ignore */ }
            }

            if (!baseUrl) {
                yield window.location.href;
                return;
            }

            // 生成所有分页URL：p=0, p=1, ..., p=maxPage
            baseUrl.searchParams.delete("p");
            yield baseUrl.href;  // 第一页（p=0 或无p参数）
            for (let p = 1; p <= maxPage; p++) {
                baseUrl.searchParams.set("p", p.toString());
                yield baseUrl.href;
            }
        }

        /**
         * 解析一页的缩略图列表
         * 支持三种缩略图布局：
         * 1. #gdt .gdtl     - 大缩略图模式（单图，非雪碧图）
         * 2. #gdt .gdtm > div - 小缩略图模式（雪碧图）
         * 3. #gdt > a       - 另一种雪碧图布局（用户上传的HTML就是这种）
         *
         * 同时支持 MPV 模式解析
         * 雪碧图会被拆分成单独的缩略图 blob URL
         *
         * @param {string} source - 画廊分页URL
         * @returns {Promise<ImageNode[]>} 图片节点数组
         */
        async parseImgNodes(source) {
            // 请求分页HTML并解析为DOM
            const doc = await this.fetchDocument(source);
            if (!doc) throw new Error("Failed to get document from source page");

            // 调试：检查 #gdt 的各种子元素数量
            const gdt = doc.querySelector('#gdt');
            if (gdt && gdt.children.length > 0) {
            }

            // 处理镜像host替换
            const getHref = (href) => {
                if (!href) return "";
                if (href.startsWith("/")) href = this.origin + href;
                const mirror = this.config.get("ehentaiMirrorHost");
                if (mirror) href = replaceHost(href, mirror);
                return href;
            };

            // ===== 尝试三种缩略图布局 =====
            let nodes = [];
            let isSprite = false;
            let getNodeInfo = null;

            // 布局1：#gdt .gdtl（大缩略图，非雪碧图）
            let query = doc.querySelectorAll("#gdt .gdtl");
            if (query && query.length > 0) {
                isSprite = false;
                getNodeInfo = (node) => {
                    const anchor = node.querySelector("a") || node.firstElementChild;
                    const image = node.querySelector("img") || anchor?.firstElementChild;
                    const title = image?.getAttribute("title")
                        ?.replace(/Page\s+\d+[:_]\s*/, "") || "untitled.jpg";
                    return {
                        thumbnailImage: image?.src || "",
                        title,
                        href: getHref(anchor?.href),
                        wh: extractRectFromSrc(image?.src) || extractRectFromStyle(node.style) || { w: 100, h: 100 },
                        style: node.style,
                        backgroundImage: null,
                    };
                };
                nodes = Array.from(query);
            }

            // 布局2：#gdt .gdtm > div（小缩略图，雪碧图）
            if (nodes.length === 0) {
                query = doc.querySelectorAll("#gdt .gdtm > div");
                if (query && query.length > 0) {
                    isSprite = true;
                    getNodeInfo = (node) => {
                        const anchor = node.querySelector("a") || node.firstElementChild;
                        const innerDiv = anchor?.firstElementChild;
                        const title = innerDiv?.getAttribute("title")
                            ?.replace(/Page\s+\d+[:_]\s*/, "") || "untitled.jpg";
                        return {
                            backgroundImage: this._extractSpriteUrl(node.style),
                            title,
                            href: getHref(anchor?.href),
                            wh: extractRectFromStyle(node.style) || { w: 100, h: 100 },
                            style: node.style,
                            thumbnailImage: "",
                        };
                    };
                    nodes = Array.from(query);
                }
            }

            // 布局3：#gdt > a（直接子元素是a标签，雪碧图）- 用户上传的HTML就是这种
            if (nodes.length === 0) {
                query = doc.querySelectorAll("#gdt > a");
                if (query && query.length > 0) {
                    isSprite = true;
                    getNodeInfo = (node) => {
                        const anchor = node;
                        let div = anchor.firstElementChild;
                        // 有些结构是 a > div > div（内层div才有background）
                        if (div && (!div.style.background || div.childElementCount > 0)) {
                            div = div.firstElementChild;
                        }
                        const title = div?.getAttribute("title")
                            ?.replace(/Page\s+\d+[:_]\s*/, "") || "untitled.jpg";
                        return {
                            backgroundImage: this._extractSpriteUrl(div?.style),
                            title,
                            href: getHref(anchor.href),
                            wh: extractRectFromStyle(div?.style) || { w: 100, h: 100 },
                            style: div?.style,
                            thumbnailImage: "",
                        };
                    };
                    nodes = Array.from(query);
                }
            }

            if (nodes.length === 0) {
                throw new Error("Failed to query image nodes from #gdt");
            }

            // ===== 解析所有节点信息 =====
            const nodeInfos = nodes.map(getNodeInfo);
            for (let i = 0; i < Math.min(3, nodeInfos.length); i++) {
                const ni = nodeInfos[i];
                if (ni.style) {
                }
            }

            // ===== MPV 模式检测与处理 =====
            // 如果第一个链接是 MPV 格式，从 MPV 页面提取所有图片
            if (nodeInfos.length > 0 && /mpv/.test(nodeInfos[0].href)) {
                isSprite = true;
                const mpvDoc = await this.fetchDocument(nodeInfos[0].href);
                const imageList = this.parseMPVImageList(mpvDoc);
                const gid = window.location.pathname.split("/")[2];
                const thumbDivs = Array.from(mpvDoc.querySelectorAll("#pane_thumbs > a > div"));

                nodeInfos.length = 0; // 清空原有节点
                for (let i = 0; i < imageList.length; i++) {
                    const info = imageList[i];
                    const backgroundImage = info.t?.match(/\((http.*?)\)/)?.[1] || null;
                    if (thumbDivs[i]) {
                        thumbDivs[i].style.background = "url" + info.t;
                    }
                    nodeInfos.push({
                        backgroundImage,
                        title: info.n || `page-${i + 1}.jpg`,
                        href: `${this.config.get("ehentaiMirrorHost") || this.origin}/s/${info.k}/${gid}-${i + 1}`,
                        wh: extractRectFromStyle(thumbDivs[i]?.style) || { w: 100, h: 100 },
                        style: thumbDivs[i]?.style,
                        thumbnailImage: "",
                    });
                }
            }

            // ===== 雪碧图拆分 =====
            if (isSprite) {
                // 按雪碧图URL分组，同一URL的图片一起拆分
                const spriteGroups = [];
                for (let i = 0; i < nodeInfos.length; i++) {
                    const info = nodeInfos[i];
                    if (!info.backgroundImage) {
                        log("warn", "Missing sprite background for node:", info);
                        continue;
                    }
                    const lastGroup = spriteGroups[spriteGroups.length - 1];
                    if (!lastGroup || lastGroup.url !== info.backgroundImage) {
                        spriteGroups.push({
                            url: info.backgroundImage,
                            range: [{ index: i, style: info.style }],
                        });
                    } else {
                        lastGroup.range.push({ index: i, style: info.style });
                    }
                }

                // ===== 雪碧图直显（路线A）：不再立即拆分 =====
                // 网格缩略图改用 CSS 背景定位直显雪碧图裁剪区，避免逐张 PNG 编码阻塞显示；
                // 独立缩略图URL（大图阅读占位等）按需懒拆分，见 SpriteSplitter.getGroupThumbUrl
                for (const group of spriteGroups) {
                    let url = group.url;
                    if (!url.startsWith("http")) url = this.origin + url;

                    if (group.range.length === 1) {
                        // 只有一张图，直接用雪碧图URL作为缩略图
                        nodeInfos[group.range[0].index].thumbnailImage = url;
                    } else {
                        // 多张图：记录雪碧图信息（URL + 整组裁剪位置 + 组内序号），供网格直显与懒拆分使用
                        const positions = group.range.map(r => SpriteSplitter.parsePosition(r.style));
                        for (let i = 0; i < group.range.length; i++) {
                            const idx = group.range[i].index;
                            nodeInfos[idx].sprite = {
                                url: url,
                                positions: positions,
                                groupIndex: i,
                            };
                        }
                    }
                }
            }

            // ===== 构建 ImageNode 数组 =====
            const result = [];
            for (const info of nodeInfos) {
                result.push(new ImageNode(
                    info.thumbnailImage,
                    info.href,
                    info.title,
                    info.wh,
                    info.sprite
                ));
            }
            return result;
        }

        /**
         * 从 MPV 页面的 script 中解析图片列表 JSON
         * @param {Document} doc - MPV页面DOM
         * @returns {Array<{k:string, t:string, n:string}>} 图片信息数组
         */
        parseMPVImageList(doc) {
            const scripts = doc.querySelectorAll("script");
            for (const script of scripts) {
                const text = script.textContent || "";
                // 匹配 var imagelist = [...]; 或类似的JSON数组
                const match = text.match(/imagelist\s*=\s*(\[[\s\S]*?\]);/);
                if (match) {
                    try {
                        return JSON.parse(match[1]);
                    } catch (e) {
                        log("warn", "Failed to parse MPV imagelist:", e);
                    }
                }
            }
            return [];
        }

        /**
         * 获取原图URL（从详情页解析）
         *
         * 流程：
         * 1. 请求详情页HTML
         * 2. 如果开启 fetchOriginal，尝试匹配原图下载链接（/fullimg 路径，备选 id="i7"）
         * 3. 否则匹配压缩图链接（#img 的 src）
         * 4. 如果获取失败且 retry=true，从 loadfail 链接的 onclick 中提取 nl 值后重试
         * 5. 检测 509 配额超限错误
         * 6. 修正文件扩展名
         *
         * @param {ImageNode} node - 图片节点
         * @param {boolean} [retry=false] - 是否是nl重试调用
         * @returns {Promise<{url:string, href:string, title:string}>} 原图信息
         */
        async fetchOriginMeta(node, retry = false) {
            // 规范化详情页URL
            if (node.href.startsWith("/")) node.href = this.origin + node.href;
            const mirror = this.config.get("ehentaiMirrorHost");
            let fetchUrl = node.href;
            if (mirror) fetchUrl = replaceHost(fetchUrl, mirror);

            // 请求详情页HTML
            const text = await gmXhr(fetchUrl, "text").then(r => r.response).catch(e => {
                throw new Error(`Fetch detail page error: ${e.message}`);
            });

            if (!text) throw new Error("Detail page returned empty content");

            let src = null;

            // 尝试获取原图（如果配置开启）
            // 原脚本方式：匹配 /fullimg 路径的下载链接
            if (this.config.get("fetchOriginal")) {
                let originalMatch = REGEX.original.exec(text);
                // 备选：通过 id="i7" 匹配
                if (!originalMatch) originalMatch = REGEX.originalAlt.exec(text);
                if (originalMatch) {
                    src = originalMatch[1].replace(/&amp;/g, "&");
                    // 保留 nl 参数
                    const nl = node.href.includes("?") ? node.href.split("?").pop() : "";
                    if (src && nl && nl.startsWith("nl=")) src += "?" + nl;
                }
            }

            // 原图未获取到，使用压缩图（#img 的 src）
            if (!src) {
                const normalMatch = REGEX.normal.exec(text);
                if (normalMatch) src = normalMatch[1];
            }

            // nl 重试机制：retry=true 时，从页面提取 nl 值后重新请求
            // 原脚本方式：nl值在 id="loadfail" 的a标签的onclick中，格式为 nl('...')
            if (retry) {
                let nlMatch = REGEX.nlValue.exec(text);
                // 备选：从任意 nl() 函数调用中提取
                if (!nlMatch) nlMatch = REGEX.nlValueAlt.exec(text);
                if (nlMatch) {
                    const nlValue = nlMatch[1];
                    node.href = node.href + (node.href.includes("?") ? "&" : "?") + "nl=" + nlValue;
                    log("info", `Retry with nl value: ${nlValue}`);
                    const retryResult = await this.fetchOriginMeta(node, false);
                    src = retryResult.url;
                } else {
                    log("error", "Cannot find nl value in detail page");
                }
            }

            if (!src) {
                log("error", "Cannot match image URL from detail page content");
                throw new Error("Cannot match image URL from detail page");
            }

            // 补全相对URL
            if (!src.startsWith("http")) {
                src = (mirror || this.origin) + src;
            }

            // 检测 509 错误（配额超限）
            if (REGEX.error509.test(src)) {
                throw new Error("509: Image limits exceeded, please reset your quota!");
            }

            // 修正文件扩展名（根据实际图片URL的扩展名更新标题）
            let title = node.title;
            const titleParts = title.split(".");
            const srcParts = src.split(".");
            if (titleParts.length > 1 && srcParts.length > 1) {
                titleParts[titleParts.length - 1] = srcParts.pop().split("?")[0];
                title = titleParts.join(".");
            }
            title = title.replace(/\?nl=.*$/, "");

            return { url: src, href: node.href, title };
        }

        /**
         * 下载图片数据为 Blob
         * 调用 GM.xmlHttpRequest 跨域下载，支持进度回调
         * @param {ImageFetcher} imf - 图片加载器实例
         * @returns {Promise<[Blob, number]>} [图片Blob, HTTP状态码]
         */
        async fetchImageData(imf) {
            const node = imf.node;
            if (!node.originSrc) throw new Error("originSrc is not set");

            // blob URL 直接 fetch
            if (node.originSrc.startsWith("blob:")) {
                const resp = await fetch(node.originSrc);
                const blob = await resp.blob();
                return [blob, resp.status];
            }

            return new Promise((resolve, reject) => {
                const details = {
                    method: "GET",
                    url: node.originSrc,
                    responseType: "blob",
                    onload: function (response) {
                        const data = response.response;
                        // 检测未登录原图下载错误（返回1329字节的text）
                        if (data.type && data.type.startsWith("text") && data.size === 1329) {
                            reject(new Error(
                                "Downloading original images requires login. " +
                                "Please login or disable 'Raw Image' option."
                            ));
                            return;
                        }
                        // 检测空数据+错误状态
                        if (data.size === 0 && (response.status < 200 || response.status >= 400)) {
                            const mirror = this.config?.get("ehentaiMirrorHost");
                            reject(new Error(
                                `Status ${response.status}` +
                                (mirror ? `, mirror site [${mirror}] may not support original image download.` : "")
                            ));
                            return;
                        }
                        imf.contentType = data.type;
                        resolve([data, response.status]);
                    }.bind(this),
                    onerror: function (response) {
                        if (response.status === 0) {
                            const domain = response.error?.match?.(/(https?:\/\/.*?)\//)?.[1] || "";
                            reject(new Error(`Connection refused to ${domain}. Check XHR security settings.`));
                        } else {
                            reject(new Error(`XHR error: status=${response.status}, error=${response.error}`));
                        }
                    },
                    onprogress: function (response) {
                        imf.setDownloadProgress(response.loaded, response.total);
                    },
                };
                GM.xmlHttpRequest(details);
            });
        }

        /**
         * 从元素的style中提取雪碧图URL
         * 先尝试 background 简写属性，如果为空则回退到 backgroundImage
         * 提取后去掉URL两端的引号（单引号或双引号）
         * @param {CSSStyleDeclaration} style - 元素的style对象
         * @returns {string|null} 雪碧图URL，提取失败返回null
         */
        _extractSpriteUrl(style) {
            // 先尝试 background 简写属性，再回退到 backgroundImage
            // 某些浏览器中 background 简写属性可能返回空字符串
            const bgStr = style.background || style.backgroundImage || "";
            const match = bgStr.match(REGEX.sprite);
            if (!match) return null;
            // 去掉URL两端的引号（单引号或双引号）
            const result = match[1].replace(/^["']|["']$/g, "");
            return result;
        }

        /**
         * 请求URL并解析为DOM文档
         * @param {string} url - 请求URL
         * @returns {Promise<Document>}
         */
        async fetchDocument(url) {
            // 如果是当前页面URL，直接返回 document
            const isCurrent = url === window.location.href || url === window.location.origin + window.location.pathname;
            if (isCurrent) {
                return document;
            }
            const text = await gmXhr(url, "text").then(r => r.response);
            const doc = new DOMParser().parseFromString(text, "text/html");
            return doc;
        }
    }

    // ============================================================================
    // 第八部分：图片加载器
    // ============================================================================

    /**
     * ImageFetcher - 单张图片加载器
     * 管理单张图片从"获取URL"到"下载完成"的完整生命周期
     * 状态流转：FAILED/URL/DATA/DONE
     * 支持并发控制、重试、进度回调
     * 仿照原脚本 IMGFetcher 类的设计
     */
    class ImageFetcher {
        /**
         * @param {number} index - 在列表中的索引
         * @param {ImageNode} node - 图片节点数据
         * @param {ExHentaiMatcher} matcher - 站点适配器
         * @param {number} chapterIndex - 所属章节索引
         * @param {EventBus} [bus] - 事件总线（用于广播下载进度）
         * @param {DownloadSemaphore} [semaphore] - 下载并发控制器（限制同时下载数量）
         */
        constructor(index, node, matcher, chapterIndex, bus, semaphore) {
            /** @type {number} 在列表中的索引 */
            this.index = index;
            /** @type {ImageNode} 图片节点数据 */
            this.node = node;
            node.index = index;
            /** @type {ExHentaiMatcher} 站点适配器 */
            this.matcher = matcher;
            /** @type {number} 所属章节索引 */
            this.chapterIndex = chapterIndex;
            /** @type {EventBus|null} 事件总线 */
            this.bus = bus || null;
            /** @type {DownloadSemaphore|null} 下载并发控制器 */
            this.semaphore = semaphore || null;
            /** @type {number} 获取状态 FetchState */
            this.state = FetchState.FAILED;
            /** @type {number} 已下载字节数 */
            this.loaded = 0;
            /** @type {number} 总字节数 */
            this.total = 0;
            /** @type {number} 重试次数 */
            this.retryCount = 0;
            /** @type {number} 最大重试次数 */
            this.maxRetries = 3;
            /** @type {boolean} 是否正在加载中 */
            this.loading = false;
            /** @type {string|undefined} 错误信息 */
            this.error = undefined;
            /** @type {Function[]} 加载完成回调 */
            this._onLoadCallbacks = [];
        }

        /**
         * 设置下载进度
         * @param {number} loaded - 已下载字节
         * @param {number} total - 总字节
         */
        setDownloadProgress(loaded, total) {
            this.loaded = loaded;
            this.total = total;
            // 广播下载进度事件
            if (this.bus) {
                this.bus.emit("image-progress", this.index, loaded, total);
            }
        }

        /**
         * 加载图片（完整流程：获取URL -> 下载数据 -> 创建blob）
         * 通过 DownloadSemaphore 控制并发，避免所有图片同时下载
         * @returns {Promise<boolean>} 是否成功
         */
        async load() {
            if (this.loading) return this._loadingPromise;
            if (this.state === FetchState.DONE) return true;

            this.loading = true;
            this.error = undefined;

            // 获取下载许可（并发控制：达到上限则等待）
            if (this.semaphore) {
                await this.semaphore.acquire();
            }

            try {
                this._loadingPromise = this._loadInternal();
                const result = await this._loadingPromise;
                return result;
            } finally {
                // 释放下载许可（无论成功失败都释放）
                if (this.semaphore) {
                    this.semaphore.release();
                }
                this.loading = false;
            }
        }

        /**
         * 内部加载逻辑
         * @returns {Promise<boolean>}
         */
        async _loadInternal() {
            try {
                // 步骤1：获取原图URL（如果还没获取）
                if (this.state < FetchState.URL || !this.node.originSrc) {
                    const meta = await this.matcher.fetchOriginMeta(this.node, false);
                    this.node.originSrc = meta.url;
                    this.node.title = meta.title;
                    this.state = FetchState.URL;
                }

                // 步骤2：下载图片数据
                if (this.state < FetchState.DATA || !this.node.blob) {
                    const [blob, status] = await this.matcher.fetchImageData(this);
                    this.node.blob = blob;
                    this.node.contentType = blob.type;
                    this.node.blobSrc = URL.createObjectURL(blob);
                    this.state = FetchState.DATA;
                }

                // 步骤3：标记完成
                this.state = FetchState.DONE;
                this._notifyLoaded(true);
                return true;
            } catch (e) {
                this.error = e.message;
                log("warn", `Image ${this.index} load failed: ${e.message}`);

                // 重试机制
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    log("info", `Retrying image ${this.index} (${this.retryCount}/${this.maxRetries})...`);
                    await sleep(1000 * this.retryCount); // 指数退避
                    // 重置状态以便重新获取
                    if (this.retryCount === 1) {
                        // 第一次重试尝试用 nl 机制
                        try {
                            const meta = await this.matcher.fetchOriginMeta(this.node, true);
                            this.node.originSrc = meta.url;
                            this.state = FetchState.URL;
                        } catch (e2) { /* ignore */ }
                    }
                    return this._loadInternal();
                }

                this.state = FetchState.FAILED;
                // 广播失败事件
                if (this.bus) {
                    this.bus.emit("image-failed", this.index, this.error);
                }
                this._notifyLoaded(false);
                return false;
            }
        }

        /**
         * 注册加载完成回调
         * @param {Function} cb - 回调函数 (success: boolean) => void
         */
        onLoaded(cb) {
            if (this.state === FetchState.DONE) {
                cb(true);
            } else if (this.state === FetchState.FAILED && this.retryCount >= this.maxRetries) {
                cb(false);
            } else {
                this._onLoadCallbacks.push(cb);
            }
        }

        /**
         * 通知所有回调加载完成
         * @param {boolean} success - 是否成功
         */
        _notifyLoaded(success) {
            for (const cb of this._onLoadCallbacks) {
                try { cb(success); } catch (e) { log("error", "onLoaded callback error:", e); }
            }
            this._onLoadCallbacks = [];
        }
    }

    // ============================================================================
    // 第九部分：分页加载器
    // ============================================================================

    /**
     * PageFetcher - 分页加载器
     * 管理画廊的分页加载流程：
     * 1. 初始化章节
     * 2. 从分页URL迭代器逐页获取URL
     * 3. 解析每页的缩略图，创建 ImageFetcher
     * 4. 懒加载：当已加载图片不足时自动加载下一页
     * 5. 通知 UI 层追加新图片
     *
     * 仿照原脚本 PageFetcher 类的设计
     */
    class PageFetcher {
        /**
         * @param {ExHentaiMatcher} matcher - 站点适配器
         * @param {EventBus} bus - 事件总线
         * @param {Config} config - 配置管理器
         */
        constructor(matcher, bus, config) {
            this.matcher = matcher;
            this.bus = bus;
            this.config = config;
            /** @type {Chapter[]} 章节列表 */
            this.chapters = [];
            /** @type {number} 当前章节索引 */
            this.chapterIndex = 0;
            /** @type {ImageFetcher[]} 当前章节的图片加载器队列 */
            this.queue = [];
            /** @type {boolean} 是否中止加载 */
            this.aborted = false;
            /** @type {Promise|null} 正在进行的分页加载Promise */
            this.appendPagePromise = null;
            /** @type {DownloadSemaphore} 下载并发控制器，限制同时下载的大图数量 */
            this.downloadSem = new DownloadSemaphore(config.get("threads") || 3);
        }

        /**
         * 更新下载并发数（配置变化时调用）
         * @param {number} count - 新的并发数
         */
        updateThreadCount(count) {
            this.downloadSem.setMax(count);
        }

        /**
         * 初始化：获取章节列表并加载第一页
         */
        async init() {
            // ===== 强制重置所有状态，防止残留数据导致跳过 parseImgNodes =====
            this.chapters = [];
            this.queue = [];
            this.chapterIndex = 0;
            this.appendPagePromise = null;
            this.aborted = false;
            try {
                const chapters = await this.matcher.fetchChapters();
                for (const chapter of chapters) {
                    // 强制重置每个章节的队列
                    chapter.queue = [];
                    chapter.filteredQueue = [];
                    chapter.done = false;
                    chapter.sourceIter = this.matcher.fetchPagesSource(chapter);
                    this.chapters.push(chapter);
                }
                if (this.chapters.length > 0) {
                    await this.changeToChapter(0);
                }
                this.bus.emit("app-init");
            } catch (e) {
                log("error", "PageFetcher init failed:", e);
                this.bus.emit("notify", "error", `初始化失败: ${e.message}`);
            }
        }

        /**
         * 切换到指定章节
         * @param {number} index - 章节索引
         */
        async changeToChapter(index) {
            if (index < 0 || index >= this.chapters.length) return;
            this.chapterIndex = index;
            this.queue = [];
            const chapter = this.chapters[index];
            this.bus.emit("chapter-changed", index, chapter);


            // ===== 关键修复：不管 chapter.queue 是否有残留，都强制重新加载第一页 =====
            // 残留的 ImageFetcher 可能来自重复初始化，其雪碧图拆分 Promise 可能未正确 resolve
            if (chapter.queue.length > 0) {
                chapter.queue = [];
                chapter.done = false;
                chapter.sourceIter = this.matcher.fetchPagesSource(chapter);
            }

            await this.appendNextPage();
        }

        /**
         * 追加下一页图片
         * 带并发锁，防止重复调用
         * @returns {Promise<boolean>} 是否成功追加了新页
         */
        async appendNextPage() {
            if (this.appendPagePromise) return this.appendPagePromise;
            this.appendPagePromise = this._appendNextPageLocked();
            const result = await this.appendPagePromise;
            this.appendPagePromise = null;
            return result;
        }

        /**
         * 内部：追加下一页（加锁版本）
         * @returns {Promise<boolean>}
         */
        async _appendNextPageLocked() {
            try {
                const chapter = this.chapters[this.chapterIndex];
                if (!chapter || chapter.done || this.aborted) return false;

                // 从分页迭代器获取下一页URL
                const next = await chapter.sourceIter.next();

                if (next.done) {
                    chapter.done = true;
                    this._notifyAppended();
                    return false;
                }

                const pageUrl = next.value;
                if (!pageUrl) return false;

                // 解析该页的缩略图
                const nodes = await this._parseWithRetry(pageUrl);
                if (nodes.length === 0) return false;

                // 创建 ImageFetcher 并加入队列（传入下载并发控制器）
                const baseIndex = chapter.queue.length;
                const fetchers = nodes.map((imgNode, i) =>
                    new ImageFetcher(baseIndex + i, imgNode, this.matcher, this.chapterIndex, this.bus, this.downloadSem)
                );

                chapter.queue.push(...fetchers);
                this.queue = chapter.queue;
                this._notifyAppended();
                return true;
            } catch (e) {
                log("error", "appendNextPage error:", e);
                this.bus.emit("notify", "error", `加载分页失败: ${e.message}`);
                return false;
            }
        }

        /**
         * 带重试的缩略图解析
         * @param {string} pageUrl - 分页URL
         * @returns {Promise<ImageNode[]>}
         */
        async _parseWithRetry(pageUrl) {
            let lastError = null;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    return await this.matcher.parseImgNodes(pageUrl);
                } catch (e) {
                    lastError = e;
                    log("warn", `parseImgNodes retry ${attempt + 1}/3: ${e.message}`);
                    await sleep(1000 * (attempt + 1));
                }
            }
            throw lastError;
        }

        /**
         * 持续加载直到队列中有足够多的图片
         * @param {number} minCount - 最少需要的图片数
         */
        async ensureLoaded(minCount) {
            while (this.queue.length < minCount) {
                const ok = await this.appendNextPage();
                if (!ok) break;
            }
        }

        /**
         * 通知 UI 层有新图片追加
         */
        _notifyAppended() {
            const chapter = this.chapters[this.chapterIndex];
            this.bus.emit("page-appended", this.queue.length, this.queue, chapter?.done || false);
        }
    }

    // ============================================================================
    // 第十部分：缩略图网格（在 #gdt 上重构）
    // ============================================================================

    /**
     * ThumbnailGrid - 缩略图网格
     * 直接在原页面的 #gdt div 上重构缩略图列表
     * 功能：
     * 1. 清空原 #gdt 内容，用自定义 DOM 替换
     * 2. 渲染缩略图网格（支持固定列数和自适应布局）
     * 3. 懒加载缩略图（延迟加载雪碧图拆分结果）
     * 4. 点击缩略图进入大图阅读
     * 5. 滚动到底部自动加载下一页
     * 6. 显示加载状态和页码
     */
    class ThumbnailGrid {
        /**
         * @param {EventBus} bus - 事件总线
         * @param {Config} config - 配置管理器
         * @param {PageFetcher} pageFetcher - 分页加载器
         */
        constructor(bus, config, pageFetcher) {
            this.bus = bus;
            this.config = config;
            this.pageFetcher = pageFetcher;
            /** @type {HTMLElement} 原页面的 #gdt 元素 */
            this.container = document.getElementById("gdt");
            /** @type {HTMLElement} 自定义网格容器 */
            this.gridEl = null;
            /** @type {Map<number, HTMLElement>} 索引 -> 缩略图DOM元素 */
            this.itemMap = new Map();
            /** @type {IntersectionObserver|null} 懒加载观察器 */
            this.observer = null;
            /** @type {boolean} 是否正在加载下一页 */
            this.loadingNext = false;
            /** @type {number} 当前已渲染的最大索引 */
            this.renderedCount = 0;
            /** @type {boolean} 是否已激活（已清空#gdt并创建UI） */
            this.activated = false;
            /** @type {ResizeObserver|null} 容器尺寸变化观察器 */
            this.resizeObserver = null;
            /** @type {number|null} 布局防抖定时器 */
            this._layoutTimer = null;
            /** @type {number} 上一次计算的行高（用于最后一行不足时参考） */
            this._lastRowHeight = 0;

            if (!this.container) {
                log("error", "#gdt element not found");
            }
            // 注意：构造函数中不清空 #gdt，必须等 PageFetcher 完成页面解析后
            // 再调用 activate() 方法，否则 parseImgNodes 无法从 document 读取缩略图
        }

        /**
         * 激活缩略图网格：清空原 #gdt，创建自定义UI，订阅事件
         * 必须在 PageFetcher.init() 之后调用，确保页面数据已解析完成
         */
        activate() {
            if (this.activated || !this.container) return;
            this.activated = true;
            this._init();
            // 如果 PageFetcher 已经加载了数据，立即渲染
            if (this.pageFetcher.queue && this.pageFetcher.queue.length > 0) {
                const chapter = this.pageFetcher.chapters[this.pageFetcher.chapterIndex];
                this._renderItems(this.pageFetcher.queue);
                this._updateLoadingState(chapter?.done || false);
            }
        }

        /**
         * 初始化：保存原内容、创建自定义容器、绑定事件
         * 由 activate() 调用，不在构造函数中直接调用
         */
        _init() {
            // 保存原 #gdt 的 innerHTML（用于恢复）
            this.originalHTML = this.container.innerHTML;
            this.originalClassName = this.container.className;

            // 清空并设置自定义样式
            this.container.innerHTML = "";
            this.container.className = "ehv-gdt-container";

            // 创建自定义网格
            this.gridEl = document.createElement("div");
            this.gridEl.className = "ehv-thumb-grid";
            this.container.appendChild(this.gridEl);

            // 创建加载提示
            this.loadingEl = document.createElement("div");
            this.loadingEl.className = "ehv-loading";
            this.loadingEl.textContent = "加载中...";
            this.container.appendChild(this.loadingEl);

            // 绑定事件
            this.bus.subscribe("page-appended", (total, queue, done) => {
                this._renderItems(queue);
                this._updateLoadingState(done);
            });

            // 滚动监听：接近底部时加载下一页
            this._setupScrollObserver();

            // 配置变更时重新布局
            this.bus.subscribe("config-changed", (key) => {
                if (key === "colCount" || key === "enableFlowVision" || key === "rowHeight") {
                    this._applyLayout();
                }
            });

            // 监听图片下载进度，更新缩略图边框
            this.bus.subscribe("image-progress", (index, loaded, total) => {
                this._updateThumbProgress(index, loaded, total);
            });

            // 监听图片加载完成，清除进度边框
            this.bus.subscribe("image-failed", (index) => {
                this._updateThumbProgress(index, 0, 0, true);
            });

            this._applyLayout();

            // 监听容器宽度变化，自动重新布局
            this.resizeObserver = new ResizeObserver(() => {
                this._scheduleLayout();
            });
            this.resizeObserver.observe(this.gridEl);
        }

        /**
         * 防抖调度布局计算
         */
        _scheduleLayout() {
            if (this._layoutTimer) clearTimeout(this._layoutTimer);
            this._layoutTimer = setTimeout(() => {
                this._layoutTimer = null;
                if (this.config.get("enableFlowVision")) {
                    this._layoutJustifiedRows();
                }
            }, 80);
        }

        /**
         * 设置滚动观察器，实现懒加载和无限滚动
         */
        _setupScrollObserver() {
            // 使用 IntersectionObserver 观察加载提示元素
            this.observer = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && !this.loadingNext) {
                        this._loadNextPage();
                    }
                }
            }, { rootMargin: "500px" });

            this.observer.observe(this.loadingEl);
        }

        /**
         * 加载下一页
         */
        async _loadNextPage() {
            if (this.loadingNext) return;
            this.loadingNext = true;
            this.loadingEl.style.display = "block";
            try {
                await this.pageFetcher.appendNextPage();
            } finally {
                this.loadingNext = false;
            }
        }

        /**
         * 渲染缩略图项（增量渲染，只渲染新增的）
         * @param {ImageFetcher[]} queue - 图片加载器队列
         */
        _renderItems(queue) {
            for (let i = this.renderedCount; i < queue.length; i++) {
                const fetcher = queue[i];
                const item = this._createThumbItem(fetcher);
                this.gridEl.appendChild(item);
                this.itemMap.set(i, item);
            }
            this.renderedCount = queue.length;
            // 渲染完成后重新计算布局（自适应视图模式下）
            if (this.config.get("enableFlowVision")) {
                this._scheduleLayout();
            }
        }

        /**
         * 创建单个缩略图元素
         * @param {ImageFetcher} fetcher - 图片加载器
         * @returns {HTMLElement}
         */
        _createThumbItem(fetcher) {
            const node = fetcher.node;
            const item = document.createElement("div");
            item.className = "ehv-thumb-item";
            item.dataset.index = fetcher.index;

            // 图片容器
            const imgWrap = document.createElement("div");
            imgWrap.className = "ehv-thumb-imgwrap";

            // 设置缩略图源
            if (node.thumbnailImage) {
                // 单图组：直接用缩略图 URL 作为 img 源
                const img = document.createElement("img");
                img.className = "ehv-thumb-img";
                img.alt = node.title;
                img.loading = "lazy";
                img.src = node.thumbnailImage;
                imgWrap.appendChild(img);
            } else if (node.sprite) {
                // 雪碧图直显（路线A）：CSS 背景定位显示对应裁剪区，不做 canvas 拆分
                // 百分比 background-size/position 相对容器，colCount/流式布局/窗口缩放自动正确
                // 注意：雪碧图节点不再创建 img 元素——无 src 的空 img 会被浏览器渲染成
                // "破图占位框 + alt 文字"显示在缩略图左上角；背景直接画在 imgWrap 上
                applySpriteBackground(imgWrap, node.sprite);
            } else {
            }

            // 保存宽高比数据到 dataset，供布局计算使用
            if (node.wh && node.wh.w > 0 && node.wh.h > 0) {
                item.dataset.ratio = `${node.wh.w / node.wh.h}`;
            } else {
                item.dataset.ratio = "0.75"; // 默认 3:4
            }
            // 注意：不在这里设置固定尺寸，由 _layoutJustifiedRows() 统一计算

            // 页码标签
            const pageLabel = document.createElement("div");
            pageLabel.className = "ehv-thumb-pagelabel";
            pageLabel.textContent = String(fetcher.index + 1);

            // 加载状态指示器
            const statusIndicator = document.createElement("div");
            statusIndicator.className = "ehv-thumb-status";

            // 监听加载状态变化
            fetcher.onLoaded((success) => {
                if (success) {
                    item.classList.add("ehv-loaded");
                    statusIndicator.textContent = "✓";
                } else {
                    item.classList.add("ehv-failed");
                    statusIndicator.textContent = "!";
                }
            });

            item.appendChild(imgWrap);
            item.appendChild(pageLabel);
            item.appendChild(statusIndicator);

            // 点击进入大图阅读
            item.addEventListener("click", () => {
                this.bus.emit("big-open", fetcher.index);
            });

            return item;
        }

        /**
         * 更新加载状态显示
         * @param {boolean} done - 是否全部加载完毕
         */
        _updateLoadingState(done) {
            if (done) {
                this.loadingEl.textContent = `共 ${this.renderedCount} 张图片`;
                this.loadingEl.style.display = "block";
                if (this.observer) this.observer.disconnect();
            } else {
                this.loadingEl.textContent = "加载更多...";
            }
        }

        /**
         * 应用布局样式（根据配置）
         */
        /**
         * 更新缩略图下载进度边框
         * @param {number} index - 图片索引
         * @param {number} loaded - 已下载字节
         * @param {number} total - 总字节
         * @param {boolean} [failed] - 是否失败
         */
        _updateThumbProgress(index, loaded, total, failed) {
            const item = this.itemMap.get(index);
            if (!item) return;

            if (failed) {
                item.classList.remove("ehv-thumb-downloading");
                item.style.setProperty("--download-progress", "0%");
                item.classList.add("ehv-thumb-downloadfailed");
                return;
            }

            if (total > 0 && loaded < total) {
                const percent = Math.round((loaded / total) * 100);
                item.classList.add("ehv-thumb-downloading");
                item.classList.remove("ehv-thumb-downloadfailed");
                item.style.setProperty("--download-progress", percent + "%");
            } else if (loaded >= total && total > 0) {
                // 下载完成，清除进度状态（延迟一下让用户看到100%）
                setTimeout(() => {
                    item.classList.remove("ehv-thumb-downloading");
                    item.style.removeProperty("--download-progress");
                }, 500);
            }
        }

        _applyLayout() {
            const colCount = this.config.get("colCount") || 5;
            if (this.config.get("enableFlowVision")) {
                // 等高自适应行布局：flex + JS 动态计算每张图尺寸
                this.gridEl.style.display = "flex";
                this.gridEl.style.flexWrap = "wrap";
                this.gridEl.style.gap = "4px";
                this.gridEl.style.alignItems = "flex-start";
                // 清除 grid 模式下可能残留的列模板
                this.gridEl.style.gridTemplateColumns = "";
                // 立即计算一次布局
                this._scheduleLayout();
            } else {
                // 固定列数网格
                this.gridEl.style.display = "grid";
                this.gridEl.style.gridTemplateColumns = `repeat(${colCount}, 1fr)`;
                this.gridEl.style.gap = "4px";
                // 清除自适应模式下设置的固定尺寸，恢复 item 默认行为
                const items = this.gridEl.querySelectorAll(".ehv-thumb-item");
                items.forEach(item => {
                    item.style.width = "";
                    item.style.height = "";
                    item.style.flex = "";
                    // 恢复固定宽高比
                    const ratio = parseFloat(item.dataset.ratio || "0.75");
                    item.style.aspectRatio = `${ratio}`;
                });
            }
        }

        /**
         * 等高自适应行布局计算（Justified Gallery 算法）
         *
         * 核心原理：
         * 1. 按每行 colCount 张图片分组
         * 2. 计算该行所有图片的宽高比之和 sumRatio = Σ(w_i/h_i)
         * 3. 行高 = (容器宽度 - (N-1)*gap) / sumRatio
         * 4. 每张图宽度 = 行高 × 该图宽高比
         * 5. 最后一张图宽度微调以占满整行（消除浮点误差）
         * 6. 最后一行不足 colCount 张时，不拉伸，参考上一行行高，左对齐
         */
        _layoutJustifiedRows() {
            if (!this.gridEl || !this.gridEl.children.length) return;
            if (!this.config.get("enableFlowVision")) return;

            const colCount = Math.max(1, this.config.get("colCount") || 5);
            const gap = 4; // 与 CSS gap 一致
            // 用 getBoundingClientRect 获取精确宽度（比 clientWidth 更可靠）
            const containerWidth = Math.round(this.gridEl.getBoundingClientRect().width);
            if (containerWidth <= 0) return;

            const items = Array.from(this.gridEl.children);
            const total = items.length;

            // 重置上一次行高记录
            this._lastRowHeight = 0;

            let debugRow = 0;

            // 按行分组处理
            for (let rowStart = 0; rowStart < total; rowStart += colCount) {
                const rowEnd = Math.min(rowStart + colCount, total);
                const rowItems = items.slice(rowStart, rowEnd);
                const n = rowItems.length;
                const isLastRow = (rowEnd >= total);
                debugRow++;

                // 收集该行每张图的宽高比
                const ratios = rowItems.map(item => {
                    const r = parseFloat(item.dataset.ratio || "0.75");
                    return (r > 0 && isFinite(r)) ? r : 0.75;
                });

                // 该行宽高比之和
                const sumRatio = ratios.reduce((a, b) => a + b, 0);
                if (sumRatio <= 0) continue;

                // 可用宽度 = 容器宽度 - gap*(N-1)
                const availableWidth = containerWidth - (n - 1) * gap;

                let rowHeight;
                let shouldFillRow = false; // 是否需要占满整行

                if (isLastRow && n < colCount) {
                    // 最后一行不足：先按上一行行高计算
                    rowHeight = this._lastRowHeight > 0
                        ? this._lastRowHeight
                        : (availableWidth / sumRatio);
                    // 检查按此行高计算的总宽度是否超过容器
                    const totalW = ratios.reduce((s, r) => s + rowHeight * r, 0);
                    if (totalW <= availableWidth) {
                        // 不超过，左对齐，不占满
                        shouldFillRow = false;
                    } else {
                        // 超过了，需要缩小行高以适应容器，并占满整行
                        rowHeight = availableWidth / sumRatio;
                        shouldFillRow = true;
                    }
                } else {
                    // 完整行：行高 = 可用宽度 / 宽高比之和，占满整行
                    rowHeight = availableWidth / sumRatio;
                    this._lastRowHeight = rowHeight;
                    shouldFillRow = true;
                }

                // ===== 精确计算每张图宽度，确保取整后总宽度正好等于目标值 =====
                const widths = new Array(n);
                let intTotal = 0;

                // 前 n-1 张先取整
                for (let i = 0; i < n - 1; i++) {
                    const w = Math.max(1, Math.round(rowHeight * ratios[i]));
                    widths[i] = w;
                    intTotal += w;
                }

                // 最后一张：占满剩余宽度（消除所有取整误差）
                if (shouldFillRow) {
                    widths[n - 1] = Math.max(1, availableWidth - intTotal);
                } else {
                    // 不占满的行，最后一张也按比例取整
                    widths[n - 1] = Math.max(1, Math.round(rowHeight * ratios[n - 1]));
                }

                const h = Math.max(1, Math.round(rowHeight));
                const finalTotal = widths.reduce((a, b) => a + b, 0);

                // 调试输出（只输出前3行和最后1行，避免刷屏）
                if (debugRow <= 3 || isLastRow) {
                    console.log(`[EHViewer-Layout] row${debugRow}: n=${n}, isLast=${isLastRow}, fill=${shouldFillRow}, containerW=${containerWidth}, availW=${availableWidth}, rowH=${rowHeight.toFixed(2)}, sumRatio=${sumRatio.toFixed(3)}, widths=[${widths.join(",")}], totalW=${finalTotal}, gapTotal=${(n - 1) * gap}, occupied=${finalTotal + (n - 1) * gap}`);
                }

                // 应用尺寸
                for (let i = 0; i < n; i++) {
                    const item = rowItems[i];
                    item.style.width = `${widths[i]}px`;
                    item.style.height = `${h}px`;
                    item.style.flex = "none";
                    item.style.aspectRatio = "auto";
                }
            }
        }

        /**
         * 恢复原 #gdt 内容
         */
        restore() {
            if (!this.container) return;
            this.container.innerHTML = this.originalHTML;
            this.container.className = this.originalClassName;
            if (this.observer) this.observer.disconnect();
            if (this.resizeObserver) this.resizeObserver.disconnect();
            if (this._layoutTimer) clearTimeout(this._layoutTimer);
        }
    }

    // ============================================================================
    // 第十一部分：大图阅读模式
    // ============================================================================

    /**
     * BigImageView - 大图阅读模式
     * 全屏遮罩式的大图阅读器
     * 功能：
     * 1. 全屏显示当前图片
     * 2. 支持连续滚动模式和翻页模式
     * 3. 图片缩放（滚轮/按钮/拖动）
     * 4. 键盘快捷键导航
     * 5. 预加载前后图片
     * 6. 自动播放/自动翻页
     * 7. 阅读进度记录
     */
    class BigImageView {
        /**
         * @param {EventBus} bus - 事件总线
         * @param {Config} config - 配置管理器
         * @param {PageFetcher} pageFetcher - 分页加载器
         */
        constructor(bus, config, pageFetcher) {
            this.bus = bus;
            this.config = config;
            this.pageFetcher = pageFetcher;
            /** @type {boolean} 是否打开 */
            this.isOpen = false;
            /** @type {number} 当前图片索引（翻页模式用） */
            this.currentIndex = 0;
            /** @type {HTMLElement} 遮罩层 */
            this.overlay = null;
            /** @type {HTMLElement} 滚动容器（连续/横向模式用） */
            this.scrollContainer = null;
            /** @type {Map<number, HTMLElement>} 索引 -> 图片包装元素 */
            this.itemMap = new Map();
            /** @type {number|null} 自动播放定时器 */
            this.autoPlayTimer = null;
            /** @type {Set<number>} 已预加载的索引 */
            this.preloaded = new Set();
            /** @type {boolean} 是否正在滚动 */
            this._isScrolling = false;
            /** @type {number|null} 滚动定时器 */
            this._scrollTimer = null;
            /** @type {number} 上一次的缩放值，用于计算缩放比例 */
            this._lastScale = 100;
            /** @type {boolean} 翻页模式自动翻页锁，防止重复触发 */
            this._paginationFlipping = false;
            /** @type {number} 翻页模式当前页的水平平移偏移量 */
            this._paginationOffsetX = 0;
            /** @type {number} 翻页模式当前页的垂直平移偏移量 */
            this._paginationOffsetY = 0;
            /** @type {number} 翻页模式水平平移目标偏移量（用于丝滑动画） */
            this._targetOffsetX = 0;
            /** @type {number} 翻页模式垂直平移目标偏移量（用于丝滑动画） */
            this._targetOffsetY = 0;
            /** @type {number|null} 翻页模式平移动画的requestAnimationFrame ID */
            this._panningAnimId = null;

            this._createUI();
            this._bindEvents();
        }

        /**
         * 创建大图阅读UI
         */
        _createUI() {
            // 遮罩层
            this.overlay = document.createElement("div");
            this.overlay.className = "ehv-big-overlay";
            this.overlay.style.display = "none";

            // 顶部工具栏
            const toolbar = document.createElement("div");
            toolbar.className = "ehv-big-toolbar";

            // 关闭按钮
            const closeBtn = document.createElement("button");
            closeBtn.className = "ehv-big-btn";
            closeBtn.textContent = "✕ 关闭";
            closeBtn.addEventListener("click", () => this.close());

            // 阅读模式切换（三个按钮，方便快速切换）
            this.modeButtons = {};
            const modeContainer = document.createElement("div");
            modeContainer.className = "ehv-big-modebuttons";
            [
                { value: "continuous", label: "连续" },
                { value: "pagination", label: "翻页" },
                { value: "horizontal", label: "横向" },
            ].forEach(opt => {
                const btn = document.createElement("button");
                btn.className = "ehv-big-btn ehv-big-modebtn";
                btn.textContent = opt.label;
                btn.dataset.mode = opt.value;
                btn.addEventListener("click", () => {
                    this.config.set("readMode", opt.value);
                    this._applyMode();
                });
                this.modeButtons[opt.value] = btn;
                modeContainer.appendChild(btn);
            });
            // 更新当前模式按钮高亮
            const currentMode = this.config.get("readMode") || "continuous";
            if (this.modeButtons[currentMode]) {
                this.modeButtons[currentMode].classList.add("active");
            }

            // 页码显示
            this.pageInfo = document.createElement("span");
            this.pageInfo.className = "ehv-big-pageinfo";

            // 缩放控制
            const zoomOut = document.createElement("button");
            zoomOut.className = "ehv-big-btn";
            zoomOut.textContent = "−";
            zoomOut.addEventListener("click", () => this._adjustScale(-10));

            this.zoomValue = document.createElement("span");
            this.zoomValue.className = "ehv-big-zoomvalue";
            this.zoomValue.textContent = this._getCurrentScale() + "%";

            const zoomIn = document.createElement("button");
            zoomIn.className = "ehv-big-btn";
            zoomIn.textContent = "+";
            zoomIn.addEventListener("click", () => this._adjustScale(10));

            // 自动播放按钮
            this.autoPlayBtn = document.createElement("button");
            this.autoPlayBtn.className = "ehv-big-btn";
            this.autoPlayBtn.textContent = "▶ 自动";
            this.autoPlayBtn.addEventListener("click", () => this._toggleAutoPlay());

            // 下载当前图按钮
            const downloadBtn = document.createElement("button");
            downloadBtn.className = "ehv-big-btn";
            downloadBtn.textContent = "⬇ 当前";
            downloadBtn.addEventListener("click", () => this._downloadCurrent());

            toolbar.appendChild(closeBtn);
            toolbar.appendChild(modeContainer);
            toolbar.appendChild(this.pageInfo);
            toolbar.appendChild(zoomOut);
            toolbar.appendChild(this.zoomValue);
            toolbar.appendChild(zoomIn);
            toolbar.appendChild(this.autoPlayBtn);
            toolbar.appendChild(downloadBtn);

            // 滚动容器
            this.scrollContainer = document.createElement("div");
            this.scrollContainer.className = "ehv-big-scrollcontainer";

            // 图片内容区
            this.imageContent = document.createElement("div");
            this.imageContent.className = "ehv-big-imagecontent";
            this.scrollContainer.appendChild(this.imageContent);

            // 左右导航按钮（翻页模式用）
            this.prevBtn = document.createElement("button");
            this.prevBtn.className = "ehv-big-nav ehv-big-nav-prev";
            this.prevBtn.textContent = "‹";
            this.prevBtn.addEventListener("click", () => this._step(-1));

            this.nextBtn = document.createElement("button");
            this.nextBtn.className = "ehv-big-nav ehv-big-nav-next";
            this.nextBtn.textContent = "›";
            this.nextBtn.addEventListener("click", () => this._step(1));

            this.overlay.appendChild(toolbar);
            this.overlay.appendChild(this.scrollContainer);
            this.overlay.appendChild(this.prevBtn);
            this.overlay.appendChild(this.nextBtn);

            document.body.appendChild(this.overlay);
        }

        /**
         * 绑定全局事件
         */
        _bindEvents() {
            // 键盘快捷键
            document.addEventListener("keydown", (e) => {
                if (!this.isOpen) return;
                const mode = this.config.get("readMode");
                switch (e.key) {
                    case "Escape":
                        this.close();
                        break;
                    case "ArrowLeft":
                    case "a":
                    case "A":
                        if (mode === "pagination") this._step(-1);
                        else this._scrollBy(-100);
                        break;
                    case "ArrowRight":
                    case "d":
                    case "D":
                        if (mode === "pagination") this._step(1);
                        else this._scrollBy(100);
                        break;
                    case "ArrowUp":
                    case "w":
                    case "W":
                        if (mode === "pagination") this._adjustScale(10);
                        else this._scrollBy(-100);
                        break;
                    case "ArrowDown":
                    case "s":
                    case "S":
                        if (mode === "pagination") this._adjustScale(-10);
                        else this._scrollBy(100);
                        break;
                    case " ":
                        e.preventDefault();
                        if (mode === "pagination") this._toggleAutoPlay();
                        else this._scrollBy(this.scrollContainer.clientHeight * 0.8);
                        break;
                    case "Home":
                        this._goTo(0);
                        break;
                    case "End":
                        this._goTo(this.pageFetcher.queue.length - 1);
                        break;
                }
            });

            // 滚动监听：连续模式下更新当前索引和预加载
            this.scrollContainer.addEventListener("scroll", () => {
                if (this._scrollTimer) clearTimeout(this._scrollTimer);
                this._scrollTimer = setTimeout(() => this._onScrollEnd(), 150);
            });

            // 鼠标滚轮事件：横向模式转横向滚动，翻页模式平移翻页
            this.scrollContainer.addEventListener("wheel", (e) => {
                const mode = this.config.get("readMode");
                if (!this.isOpen) return;

                if (mode === "horizontal") {
                    // 横向模式：鼠标滚轮转换成横向滚动
                    e.preventDefault();
                    this.scrollContainer.scrollBy({ left: e.deltaY * 3, behavior: "auto" });
                    return;
                }

                if (mode !== "pagination") return;
                e.preventDefault();

                const perPage = Math.max(1, this.config.get("paginationIMGCount") || 1);
                const currentPageStart = Math.floor(this.currentIndex / perPage) * perPage;

                // 计算当前页内容的最大偏移量
                const content = this.imageContent;
                const maxOffsetX = Math.max(0, content.scrollWidth - window.innerWidth);
                const maxOffsetY = Math.max(0, content.scrollHeight - window.innerHeight);

                // 平移步长（取滚轮增量的绝对值，最小30px）
                const step = Math.max(30, Math.abs(e.deltaY));

                if (e.deltaY > 0) {
                    // 向下滚动：先向下平移，再向右平移，最后翻下一页
                    if (this._targetOffsetY < maxOffsetY) {
                        this._targetOffsetY = Math.min(maxOffsetY, this._targetOffsetY + step);
                    } else if (this._targetOffsetX < maxOffsetX) {
                        this._targetOffsetX = Math.min(maxOffsetX, this._targetOffsetX + step);
                    } else {
                        const nextPageStart = currentPageStart + perPage;
                        if (nextPageStart < this.pageFetcher.queue.length) {
                            this._goTo(nextPageStart);
                            return;
                        }
                    }
                } else if (e.deltaY < 0) {
                    // 向上滚动：先向上平移，再向左平移，最后翻上一页
                    if (this._targetOffsetY > 0) {
                        this._targetOffsetY = Math.max(0, this._targetOffsetY - step);
                    } else if (this._targetOffsetX > 0) {
                        this._targetOffsetX = Math.max(0, this._targetOffsetX - step);
                    } else {
                        const prevPageStart = currentPageStart - perPage;
                        if (prevPageStart >= 0) {
                            this._goTo(prevPageStart);
                            return;
                        }
                    }
                }

                // 启动丝滑平移动画循环
                this._startPanningAnimation();
            }, { passive: false });

            // 点击遮罩空白区域关闭
            this.overlay.addEventListener("click", (e) => {
                if (e.target === this.overlay || e.target === this.scrollContainer) this.close();
            });

            // 监听图片下载进度
            this.bus.subscribe("image-progress", (index, loaded, total) => {
                this._updateItemProgress(index, loaded, total);
            });

            // 监听图片加载失败
            this.bus.subscribe("image-failed", (index, error) => {
                this._updateItemFailed(index, error);
            });

            // 监听打开事件
            this.bus.subscribe("big-open", (index) => this.open(index));

            // 配置变化时重新应用模式或更新并发数
            this.bus.subscribe("config-changed", (key) => {
                if (key === "readMode") {
                    // 阅读模式变化需要重建视图
                    if (this.isOpen) this._applyMode();
                }
                if (key === "imgScaleContinuous" || key === "imgScaleHorizontal" || key === "imgScalePagination" || key === "paginationIMGCount") {
                    // 缩放或每页图片数变化时重新应用缩放到所有图片
                    if (this.isOpen) {
                        this.zoomValue.textContent = this._getCurrentScale() + "%";
                        this._applyScalePreserveScroll();
                    }
                }
                if (key === "threads") {
                    // 动态更新下载并发数
                    const count = this.config.get("threads") || 3;
                    this.pageFetcher.updateThreadCount(count);
                }
            });
        }

        /**
         * 应用当前阅读模式
         */
        _applyMode() {
            const mode = this.config.get("readMode") || "continuous";
            // 更新模式按钮高亮状态
            if (this.modeButtons) {
                Object.values(this.modeButtons).forEach(btn => btn.classList.remove("active"));
                if (this.modeButtons[mode]) {
                    this.modeButtons[mode].classList.add("active");
                }
            }

            // 清空内容区
            this.imageContent.innerHTML = "";
            this.itemMap.clear();
            // 重置翻页模式的平移偏移（避免影响其他模式）
            this.imageContent.style.transform = "";
            this.imageContent.style.alignItems = "";
            this.imageContent.style.justifyContent = "";
            this._paginationOffsetX = 0;
            this._paginationOffsetY = 0;
            this._targetOffsetX = 0;
            this._targetOffsetY = 0;

            // 设置容器方向
            if (mode === "horizontal") {
                this.imageContent.style.flexDirection = "row";
                this.imageContent.style.flexWrap = "nowrap";
                this.scrollContainer.style.overflowX = "auto";
                this.scrollContainer.style.overflowY = "hidden";
            } else if (mode === "pagination") {
                // 翻页模式：横向排列不换行，一行显示不完时通过左右横移查看
                this.imageContent.style.flexDirection = "row";
                this.imageContent.style.flexWrap = "nowrap";
                this.scrollContainer.style.overflowX = "hidden";
                this.scrollContainer.style.overflowY = "hidden";
            } else {
                this.imageContent.style.flexDirection = "column";
                this.imageContent.style.flexWrap = "nowrap";
                this.scrollContainer.style.overflowX = "hidden";
                this.scrollContainer.style.overflowY = "auto";
            }

            // 翻页模式显示导航按钮
            this.prevBtn.style.display = mode === "pagination" ? "flex" : "none";
            this.nextBtn.style.display = mode === "pagination" ? "flex" : "none";

            // 翻页模式添加类名，用于CSS控制wrapper宽度自适应
            if (mode === "pagination") {
                this.imageContent.classList.add("ehv-pagination-mode");
            } else {
                this.imageContent.classList.remove("ehv-pagination-mode");
            }

            // 渲染所有图片
            const queue = this.pageFetcher.queue;
            for (let i = 0; i < queue.length; i++) {
                this._createImageItem(i);
            }

            // 跳转到当前索引
            if (mode === "pagination") {
                this._showPaginationPage(this.currentIndex);
            } else {
                // 切换到连续/横向模式时，重置滚动位置，然后立即滚动到当前索引
                // 临时禁用平滑滚动，避免从第一张滑动到当前图的动画
                const oldScrollBehavior = this.scrollContainer.style.scrollBehavior;
                this.scrollContainer.style.scrollBehavior = 'auto';
                this.scrollContainer.scrollLeft = 0;
                this.scrollContainer.scrollTop = 0;
                const wrapper = this.itemMap.get(this.currentIndex);
                if (wrapper) {
                    if (mode === "horizontal") {
                        this.scrollContainer.scrollLeft = wrapper.offsetLeft;
                    } else {
                        this.scrollContainer.scrollTop = wrapper.offsetTop;
                    }
                }
                // 恢复平滑滚动
                this.scrollContainer.style.scrollBehavior = oldScrollBehavior;
            }

            this._updatePageInfo();
            // 更新工具栏缩放显示
            this.zoomValue.textContent = this._getCurrentScale() + "%";
            // 重建视图后更新缩放基准
            this._lastScale = this._getCurrentScale();
        }

        /**
         * 创建单张图片的包装元素
         * @param {number} index - 图片索引
         * @returns {HTMLElement}
         */
        _createImageItem(index) {
            const fetcher = this.pageFetcher.queue[index];
            if (!fetcher) return null;

            const wrapper = document.createElement("div");
            wrapper.className = "ehv-big-imgwrapper";
            wrapper.dataset.index = index;

            // 图片元素
            const img = document.createElement("img");
            img.className = "ehv-big-img";
            img.alt = fetcher.node.title || `Page ${index + 1}`;
            img.loading = "lazy";

            // 图片加载完成后重新应用缩放（翻页模式下需要naturalWidth计算像素宽度）
            img.addEventListener("load", () => {
                // 占位用的 1px 透明 GIF 加载完成：只清标记，不按真实图片处理
                if (img.dataset.placeholder === "1") {
                    delete img.dataset.placeholder;
                    return;
                }
                // 清除占位阶段设置的宽高比约束，让 _applyItemScale 按真实图片比例计算盒子
                img.style.aspectRatio = "";
                this._applyItemScale(wrapper);
                // 图片加载后重新判断对齐方式（内容大小可能变化）
                if (this.config.get("readMode") === "pagination") {
                    requestAnimationFrame(() => this._updatePaginationAlignment());
                }
            });

            // 右上角进度百分比
            const progressEl = document.createElement("div");
            progressEl.className = "ehv-big-progressbadge";
            progressEl.textContent = "加载中...";
            progressEl.style.display = "none";

            // 错误覆盖层
            const errorOverlay = document.createElement("div");
            errorOverlay.className = "ehv-big-erroroverlay";
            errorOverlay.style.display = "none";
            errorOverlay.innerHTML = `
                <div class="ehv-big-errortext">加载失败</div>
                <button class="ehv-big-btn ehv-big-retrybtn">重新加载</button>
            `;
            errorOverlay.querySelector(".ehv-big-retrybtn").addEventListener("click", (e) => {
                e.stopPropagation();
                this._retryImage(index);
            });

            wrapper.appendChild(img);
            wrapper.appendChild(progressEl);
            wrapper.appendChild(errorOverlay);

            this.imageContent.appendChild(wrapper);
            this.itemMap.set(index, wrapper);

            // 应用 imgScale
            this._applyItemScale(wrapper);

            // 设置图片源
            this._setImageSource(index, wrapper, img, progressEl);

            return wrapper;
        }

        /**
         * 设置图片源（仅显示缩略图占位，不开始下载原图）
         * 下载原图由 _loadImage() 单独触发，实现懒加载
         */
        async _setImageSource(index, wrapper, img, progressEl) {
            const fetcher = this.pageFetcher.queue[index];
            if (!fetcher) { console.warn('[EHViewer-Big] no fetcher for index', index); return; }

            // 如果已完成，直接显示原图
            if (fetcher.state === FetchState.DONE && fetcher.node.blobSrc) {
                // 开始显示真实图片前清除占位标记（防止占位 GIF 的 load 事件抢在真实图片之前处理）
                delete img.dataset.placeholder;
                img.src = fetcher.node.blobSrc;
                if (progressEl) progressEl.style.display = "none";
                wrapper.classList.add("ehv-big-loaded");
                return;
            }

            // 只有真正失败（重试次数用完）才显示错误
            if (fetcher.state === FetchState.FAILED && fetcher.retryCount >= fetcher.maxRetries) {
                if (progressEl) progressEl.style.display = "none";
                const errOverlay = wrapper.querySelector(".ehv-big-erroroverlay");
                if (errOverlay) errOverlay.style.display = "flex";
                return;
            }

            // 未下载完：先显示缩略图作为占位（和大图一样大）
            if (fetcher.node.sprite) {
                // 路线A：雪碧图节点用 CSS 背景直显占位（即时显示，无需等待懒拆分）
                // 占位阶段 img 无 src、无内在尺寸，必须按裁剪区比例给盒子定型，
                // 否则连续模式（width% + height:auto）塌成横条、横向模式（height + width:auto）塌成竖条
                const rect = fetcher.node.sprite.positions?.[fetcher.node.sprite.groupIndex];
                if (rect && rect.w > 0 && rect.h > 0) {
                    const ratio = rect.w / rect.h;
                    img.style.aspectRatio = `${rect.w} / ${rect.h}`;
                    if (this.config.get("readMode") === "pagination") {
                        // 翻页模式占位阶段宽高为 auto，按视口比例给显式尺寸（口径与 _applyItemScale 一致）
                        const perPage = Math.max(1, this.config.get("paginationIMGCount") || 1);
                        const baseWidth = window.innerWidth / perPage;
                        const baseHeight = window.innerHeight;
                        const baseRatio = baseWidth / baseHeight;
                        const scaleRatio = this._getCurrentScale() / 100;
                        let w, h;
                        if (ratio > baseRatio) {
                            w = baseWidth;
                            h = baseWidth / ratio;
                        } else {
                            h = baseHeight;
                            w = baseHeight * ratio;
                        }
                        img.style.width = (w * scaleRatio) + "px";
                        img.style.height = (h * scaleRatio) + "px";
                    }
                }
                // 占位阶段给 img 一个合法源（1px 透明 GIF）：
                // 空 src 的 img 会被浏览器渲染成"破图占位框 + alt 文字"盖在背景上
                img.src = TRANSPARENT_1PX_GIF;
                img.dataset.placeholder = "1";
                applySpriteBackground(img, fetcher.node.sprite);
            } else {
                const thumbUrl = await this._getThumbUrl(fetcher);
                if (thumbUrl) {
                    img.src = thumbUrl;
                }
            }

            // 右上角显示"待加载"提示（还没开始下载）
            if (progressEl) {
                progressEl.style.display = "block";
                progressEl.textContent = "待加载";
            }
        }

        /**
         * 开始加载指定索引的大图（懒加载触发点）
         * 只有当前可见图和预加载范围内的图才会调用此方法
         * 通过 DownloadSemaphore 控制并发，避免所有图同时下载
         * @param {number} index - 图片索引
         */
        async _loadImage(index) {
            const wrapper = this.itemMap.get(index);
            if (!wrapper) return;
            const img = wrapper.querySelector(".ehv-big-img");
            const progressEl = wrapper.querySelector(".ehv-big-progressbadge");
            const fetcher = this.pageFetcher.queue[index];
            if (!fetcher || !img) return;

            // 已完成或正在加载，跳过
            if (fetcher.state === FetchState.DONE && fetcher.node.blobSrc) {
                // 开始显示真实图片前清除占位标记（防止占位 GIF 的 load 事件抢在真实图片之前处理）
                delete img.dataset.placeholder;
                img.src = fetcher.node.blobSrc;
                if (progressEl) progressEl.style.display = "none";
                wrapper.classList.add("ehv-big-loaded");
                return;
            }
            if (fetcher.loading) return;

            // 显示加载中提示
            if (progressEl) {
                progressEl.style.display = "block";
                progressEl.textContent = "加载中...";
            }

            // 开始加载原图（通过 DownloadSemaphore 控制并发）
            try {
                const success = await fetcher.load();
                if (success && fetcher.node.blobSrc) {
                    // 开始显示真实图片前清除占位标记（防止占位 GIF 的 load 事件抢在真实图片之前处理）
                    delete img.dataset.placeholder;
                    img.src = fetcher.node.blobSrc;
                    if (progressEl) progressEl.style.display = "none";
                    wrapper.classList.add("ehv-big-loaded");
                } else {
                    // 加载失败，显示错误覆盖层
                    if (progressEl) progressEl.style.display = "none";
                    const errOverlay = wrapper.querySelector(".ehv-big-erroroverlay");
                    if (errOverlay) errOverlay.style.display = "flex";
                }
            } catch (e) {
                console.error('[EHViewer-Big] _loadImage error:', e);
                if (progressEl) progressEl.style.display = "none";
                const errOverlay = wrapper.querySelector(".ehv-big-erroroverlay");
                if (errOverlay) errOverlay.style.display = "flex";
            }
        }

        /**
         * 获取缩略图URL
         */
        async _getThumbUrl(fetcher) {
            if (fetcher.node.thumbnailImage) {
                console.log('[EHViewer-Big] _getThumbUrl: thumbnailImage=', fetcher.node.thumbnailImage.substring(0, 60));
                return fetcher.node.thumbnailImage;
            }
            if (fetcher.node.sprite) {
                // 路线A：雪碧图节点按需懒拆分，整组共享一次拆分并缓存
                try {
                    const url = await fetcher.node.getSplitThumbUrl();
                    console.log('[EHViewer-Big] _getThumbUrl: lazy split resolved=', url?.substring?.(0, 60) || url);
                    return url;
                } catch (e) {
                    console.error('[EHViewer-Big] _getThumbUrl: lazy split FAILED:', e);
                    return null;
                }
            }
            console.warn('[EHViewer-Big] _getThumbUrl: NO thumbnailImage and NO sprite!');
            return null;
        }

        /**
         * 更新进度UI
         */
        _updateProgressUI(overlay, percent) {
            const text = overlay.querySelector(".ehv-big-progresstext");
            const fill = overlay.querySelector(".ehv-big-progressfill");
            if (text) text.textContent = percent + "%";
            if (fill) fill.style.width = percent + "%";
        }

        /**
         * 更新图片下载进度（由事件触发）
         */
        _updateItemProgress(index, loaded, total) {
            const wrapper = this.itemMap.get(index);
            if (!wrapper) return;
            const progressEl = wrapper.querySelector(".ehv-big-progressbadge");
            if (!progressEl || progressEl.style.display === "none") return;
            if (total > 0) {
                const pct = Math.round((loaded / total) * 100);
                progressEl.textContent = pct + "%";
            }
        }

        /**
         * 更新图片失败状态（由事件触发）
         */
        _updateItemFailed(index, error) {
            const wrapper = this.itemMap.get(index);
            if (!wrapper) return;
            const progressEl = wrapper.querySelector(".ehv-big-progressbadge");
            const errorOverlay = wrapper.querySelector(".ehv-big-erroroverlay");
            if (progressEl) progressEl.style.display = "none";
            if (errorOverlay) {
                errorOverlay.style.display = "flex";
                const errText = errorOverlay.querySelector(".ehv-big-errortext");
                if (errText && error) errText.textContent = "加载失败: " + error;
            }
        }

        /**
         * 重新加载图片
         */
        async _retryImage(index) {
            const fetcher = this.pageFetcher.queue[index];
            if (!fetcher) return;
            // 重置状态
            fetcher.state = FetchState.FAILED;
            fetcher.retryCount = 0;
            fetcher.error = undefined;
            fetcher.loading = false;
            fetcher.node.blob = undefined;
            fetcher.node.blobSrc = undefined;
            // 从预加载集合中移除，允许重新加载
            this.preloaded.delete(index);

            const wrapper = this.itemMap.get(index);
            if (wrapper) {
                wrapper.querySelector(".ehv-big-erroroverlay").style.display = "none";
                const progressEl = wrapper.querySelector(".ehv-big-progressbadge");
                progressEl.style.display = "block";
                progressEl.textContent = "0%";
            }

            // 重新加载（使用 _loadImage 统一加载逻辑）
            this._loadImage(index);
        }

        /**
         * 获取当前模式的图片缩放百分比（三种模式互相独立）
         * @returns {number} 缩放百分比
         */
        _getCurrentScale() {
            const mode = this.config.get("readMode");
            const key = "imgScale" + mode.charAt(0).toUpperCase() + mode.slice(1);
            const value = this.config.get(key);
            if (value !== undefined && value !== null) {
                return value;
            }
            // 配置迁移：如果新配置项不存在，使用旧的 imgScale 值
            const oldValue = this.config.get("imgScale");
            return oldValue || 100;
        }

        /**
         * 设置当前模式的图片缩放百分比（三种模式互相独立）
         * @param {number} value - 缩放百分比
         */
        _setCurrentScale(value) {
            const mode = this.config.get("readMode");
            const key = "imgScale" + mode.charAt(0).toUpperCase() + mode.slice(1);
            this.config.set(key, value);
        }

        /**
         * 应用图片缩放
         */
        _applyItemScale(wrapper) {
            const scale = this._getCurrentScale();
            const img = wrapper.querySelector(".ehv-big-img");
            if (!img) return;
            const mode = this.config.get("readMode");

            if (mode === "pagination") {
                // 翻页模式：100%时平铺浏览器，放大时按比例放大超出视口，不设置边界
                const perPage = Math.max(1, this.config.get("paginationIMGCount") || 1);
                const scaleRatio = scale / 100;
                // 100%时每张图的可用区域
                const baseWidth = window.innerWidth / perPage;
                const baseHeight = window.innerHeight;
                const baseRatio = baseWidth / baseHeight;

                // 不设置max-width/max-height边界
                img.style.maxWidth = "none";
                img.style.maxHeight = "none";

                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    const imgRatio = img.naturalWidth / img.naturalHeight;
                    let imgBaseWidth, imgBaseHeight;
                    if (imgRatio > baseRatio) {
                        // 横图：100%时宽度填满可用区域
                        imgBaseWidth = baseWidth;
                        imgBaseHeight = baseWidth / imgRatio;
                    } else {
                        // 竖图：100%时高度填满可用区域
                        imgBaseHeight = baseHeight;
                        imgBaseWidth = baseHeight * imgRatio;
                    }
                    // 放大时按比例放大（可能超出视口，通过平移查看）
                    img.style.width = (imgBaseWidth * scaleRatio) + "px";
                    img.style.height = (imgBaseHeight * scaleRatio) + "px";
                } else {
                    // 图片未加载，先用auto，等加载后重新应用
                    img.style.width = "auto";
                    img.style.height = "auto";
                    // 雪碧图占位阶段：img 有宽高比约束但无内在尺寸，给兜底高度避免盒子塌陷成条状
                    // （宽度由 aspect-ratio 自动推导，加载后由上面的分支重新计算）
                    if (img.style.aspectRatio) {
                        img.style.height = (baseHeight * scaleRatio) + "px";
                    }
                }

                // wrapper尺寸跟随图片（不固定宽高）
                wrapper.style.width = "auto";
                wrapper.style.height = "auto";
                img.style.objectFit = "fill";
            } else if (mode === "horizontal") {
                // 横向模式：用高度限制（视口高度百分比），宽度自动按比例
                // 因为横向滚动时，缩放应改变图片高度→宽度按比例变化→内容总宽度变化→scrollLeft调整
                img.style.height = scale + "vh";
                img.style.width = "auto";
                img.style.maxWidth = "none";
                img.style.maxHeight = "none";
                // 防止wrapper被flex压缩，导致图片溢出覆盖旁边图片
                wrapper.style.flexShrink = "0";
                wrapper.style.width = "auto";
            } else {
                // 连续模式：用百分比宽度（相对于视口宽度）
                img.style.width = scale + "%";
                img.style.maxWidth = "none";
                img.style.height = "auto";
                img.style.maxHeight = "none";
            }
        }

        /**
         * 应用缩放并保持当前滚动位置（连续/横向模式）
         * 改变图片大小时，所有图片高度会变化，导致内容总高度变化，
         * 当前可见图片会偏移。此方法记录当前可见图片及其在视口中的偏移，
         * 应用缩放后恢复到相同位置，让同一张图片保持在视口中的相同位置。
         */
        _applyScalePreserveScroll() {
            const mode = this.config.get("readMode");
            const container = this.scrollContainer;
            const isHorizontal = mode === "horizontal";

            // 翻页模式：应用缩放并重置平移偏移量
            if (mode === "pagination") {
                this.itemMap.forEach(wrapper => this._applyItemScale(wrapper));
                this._stopPanningAnimation();
                this._paginationOffsetX = 0;
                this._paginationOffsetY = 0;
                this._targetOffsetX = 0;
                this._targetOffsetY = 0;
                this.imageContent.style.transform = "translate(0, 0)";
                // 缩放后重新判断对齐方式（内容是否超出视窗）
                requestAnimationFrame(() => this._updatePaginationAlignment());
                this._lastScale = this._getCurrentScale();
                return;
            }

            // 记录缩放前的滚动位置
            const oldScrollPos = isHorizontal ? container.scrollLeft : container.scrollTop;
            const oldScale = this._lastScale;
            const newScale = this._getCurrentScale();

            // 临时禁用平滑滚动和滚动锚定，避免缩放时产生滚动动画或浏览器自动调整位置
            const oldScrollBehavior = container.style.scrollBehavior;
            const oldOverflowAnchor = container.style.overflowAnchor;
            container.style.scrollBehavior = 'auto';
            container.style.overflowAnchor = 'none';

            // 应用缩放到所有图片
            this.itemMap.forEach(wrapper => this._applyItemScale(wrapper));

            // 以视口左上角为固定点，按缩放比例同步调整滚动位置
            // 原理：所有图片 width 都是相同百分比，缩放时所有图片高度按相同比例变化，
            // 整个内容总高度也按相同比例变化，因此 scrollTop 也按相同比例变化，
            // 视口左上角的内容点保持不变。不需要等待布局完成，同步设置即可，不会晃动。
            if (oldScale > 0 && newScale !== oldScale) {
                const scaleRatio = newScale / oldScale;
                const newScrollPos = oldScrollPos * scaleRatio;
                if (isHorizontal) {
                    // 横向模式：图片宽度由高度决定(auto)，需要等待布局完成后再设置scrollLeft
                    requestAnimationFrame(() => {
                        container.scrollLeft = newScrollPos;
                        container.style.scrollBehavior = oldScrollBehavior;
                        container.style.overflowAnchor = oldOverflowAnchor;
                    });
                    this._lastScale = newScale;
                    return;
                } else {
                    container.scrollTop = newScrollPos;
                }
            }

            // 恢复平滑滚动和滚动锚定（下一帧）
            requestAnimationFrame(() => {
                container.style.scrollBehavior = oldScrollBehavior;
                container.style.overflowAnchor = oldOverflowAnchor;
            });

            this._lastScale = newScale;
        }

        /**
         * 打开大图阅读
         * @param {number} index - 图片索引
         */
        async open(index) {
            this.isOpen = true;
            this.currentIndex = index;
            this.overlay.style.display = "flex";
            document.body.style.overflow = "hidden";
            // 等待一帧让布局生效
            await new Promise(r => requestAnimationFrame(r));
            this._applyMode();
            const mode = this.config.get("readMode");
            if (mode === "pagination") {
                // 翻页模式：重置平移偏移量，加载当前页所有图
                this._stopPanningAnimation();
                this._paginationOffsetX = 0;
                this._paginationOffsetY = 0;
                this._targetOffsetX = 0;
                this._targetOffsetY = 0;
                this.imageContent.style.transform = "translate(0, 0)";
                // 延迟更新对齐方式（等待布局完成）
                requestAnimationFrame(() => this._updatePaginationAlignment());
                const perPage = Math.max(1, this.config.get("paginationIMGCount") || 1);
                const pageStart = Math.floor(index / perPage) * perPage;
                const pageEnd = Math.min(pageStart + perPage, this.pageFetcher.queue.length);
                for (let i = pageStart; i < pageEnd; i++) {
                    this._loadImage(i);
                }
            } else {
                // 懒加载：只加载当前图，然后预加载附近的图
                this._loadImage(index);
                this._preloadAround(index);
            }
            this.bus.emit("big-opened", index);
        }

        /**
         * 关闭大图阅读
         */
        close() {
            this.isOpen = false;
            this.overlay.style.display = "none";
            document.body.style.overflow = "";
            this._stopAutoPlay();
            if (this.config.get("recordReadingProgress")) {
                this._saveProgress(this.currentIndex);
            }
            this.bus.emit("big-closed", this.currentIndex);
        }

        /**
         * 跳转到指定图片
         * @param {number} index - 图片索引
         */
        _goTo(index) {
            const queue = this.pageFetcher.queue;
            if (index < 0 || index >= queue.length) return;
            this.currentIndex = index;
            const mode = this.config.get("readMode");
            if (mode === "pagination") {
                this._showPaginationPage(index);
                // 翻页模式：加载当前页所有图（不只是页首图）
                const perPage = Math.max(1, this.config.get("paginationIMGCount") || 1);
                const pageStart = Math.floor(index / perPage) * perPage;
                const pageEnd = Math.min(pageStart + perPage, queue.length);
                for (let i = pageStart; i < pageEnd; i++) {
                    this._loadImage(i);
                }
            } else {
                this._scrollToIndex(index);
                // 懒加载：加载当前图并预加载附近
                this._loadImage(index);
                this._preloadAround(index);
            }
            this._updatePageInfo();
            this.bus.emit("big-step", index);
        }

        /**
         * 翻页模式：显示指定页
         */
        _showPaginationPage(index) {
            const perPage = Math.max(1, this.config.get("paginationIMGCount") || 1);
            const pageStart = Math.floor(index / perPage) * perPage;
            const pageEnd = Math.min(pageStart + perPage, this.pageFetcher.queue.length);

            // 隐藏所有，显示当前页
            this.itemMap.forEach((wrapper, i) => {
                if (i >= pageStart && i < pageEnd) {
                    wrapper.style.display = "flex";
                } else {
                    wrapper.style.display = "none";
                }
            });

            // 翻页后重置平移偏移量
            this._stopPanningAnimation();
            this._paginationOffsetX = 0;
            this._paginationOffsetY = 0;
            this._targetOffsetX = 0;
            this._targetOffsetY = 0;
            this.imageContent.style.transform = "translate(0, 0)";
            // 延迟更新对齐方式（等待布局完成）
            requestAnimationFrame(() => this._updatePaginationAlignment());
        }

        /**
         * 启动丝滑平移动画循环
         * 通过requestAnimationFrame + 插值实现平滑移动
         */
        _startPanningAnimation() {
            if (this._panningAnimId !== null) return;
            const animate = () => {
                // 插值系数：值越大移动越快，越小越平滑
                const lerpFactor = 0.2;
                this._paginationOffsetX += (this._targetOffsetX - this._paginationOffsetX) * lerpFactor;
                this._paginationOffsetY += (this._targetOffsetY - this._paginationOffsetY) * lerpFactor;

                // 应用平移到内容容器
                this.imageContent.style.transform = `translate(${-this._paginationOffsetX}px, ${-this._paginationOffsetY}px)`;

                // 当当前偏移量接近目标偏移量时，停止动画
                const diffX = Math.abs(this._targetOffsetX - this._paginationOffsetX);
                const diffY = Math.abs(this._targetOffsetY - this._paginationOffsetY);
                if (diffX < 0.5 && diffY < 0.5) {
                    this._paginationOffsetX = this._targetOffsetX;
                    this._paginationOffsetY = this._targetOffsetY;
                    this.imageContent.style.transform = `translate(${-this._paginationOffsetX}px, ${-this._paginationOffsetY}px)`;
                    this._panningAnimId = null;
                    return;
                }

                this._panningAnimId = requestAnimationFrame(animate);
            };
            this._panningAnimId = requestAnimationFrame(animate);
        }

        /**
         * 停止平移动画
         */
        _stopPanningAnimation() {
            if (this._panningAnimId !== null) {
                cancelAnimationFrame(this._panningAnimId);
                this._panningAnimId = null;
            }
        }

        /**
         * 更新翻页模式的对齐方式
         * 如果内容没有超出视窗则居中，超出则左上对齐（方便平移查看）
         */
        _updatePaginationAlignment() {
            const mode = this.config.get("readMode");
            if (mode !== "pagination") return;
            const content = this.imageContent;
            const overflowX = content.scrollWidth > window.innerWidth + 1;
            const overflowY = content.scrollHeight > window.innerHeight + 1;
            // 水平和垂直独立判断对齐方式
            if (overflowX) {
                // 左右超出视窗：左对齐，方便左右平移
                content.style.justifyContent = "flex-start";
            } else {
                // 左右未超出：水平居中
                content.style.justifyContent = "center";
            }
            if (overflowY) {
                // 上下超出视窗：顶部对齐，方便上下平移
                content.style.alignItems = "flex-start";
            } else {
                // 上下未超出：垂直居中
                content.style.alignItems = "center";
            }
        }

        /**
         * 滚动到指定索引
         */
        _scrollToIndex(index) {
            const wrapper = this.itemMap.get(index);
            if (!wrapper) return;
            const mode = this.config.get("readMode");
            if (mode === "horizontal") {
                this.scrollContainer.scrollTo({ left: wrapper.offsetLeft, behavior: "smooth" });
            } else {
                this.scrollContainer.scrollTo({ top: wrapper.offsetTop, behavior: "smooth" });
            }
        }

        /**
         * 滚动结束处理：更新当前索引
         */
        _onScrollEnd() {
            const mode = this.config.get("readMode");
            if (mode === "pagination") return;

            const container = this.scrollContainer;
            const scrollPos = mode === "horizontal" ? container.scrollLeft : container.scrollTop;
            const viewSize = mode === "horizontal" ? container.clientWidth : container.clientHeight;

            // 找到视口中心对应的图片
            let closestIndex = this.currentIndex;
            let closestDist = Infinity;
            this.itemMap.forEach((wrapper, i) => {
                const itemPos = mode === "horizontal" ? wrapper.offsetLeft : wrapper.offsetTop;
                const itemSize = mode === "horizontal" ? wrapper.offsetWidth : wrapper.offsetHeight;
                const itemCenter = itemPos + itemSize / 2;
                const viewCenter = scrollPos + viewSize / 2;
                const dist = Math.abs(itemCenter - viewCenter);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestIndex = i;
                }
            });

            if (closestIndex !== this.currentIndex) {
                this.currentIndex = closestIndex;
                this._updatePageInfo();
                // 懒加载：加载当前可见图并预加载附近
                this._loadImage(closestIndex);
                this._preloadAround(closestIndex);
                this.bus.emit("big-step", closestIndex);
            }

            // 接近末尾时加载更多
            const maxScroll = mode === "horizontal"
                ? container.scrollWidth - container.clientWidth
                : container.scrollHeight - container.clientHeight;
            if (scrollPos >= maxScroll - 500) {
                this.pageFetcher.appendNextPage().then(() => {
                    // 新图片加载后重新渲染
                    this._renderNewItems();
                });
            }
        }

        /**
         * 渲染新加载的图片
         */
        _renderNewItems() {
            const queue = this.pageFetcher.queue;
            for (let i = 0; i < queue.length; i++) {
                if (!this.itemMap.has(i)) {
                    this._createImageItem(i);
                }
            }
        }

        /**
         * 滚动指定距离
         */
        _scrollBy(distance) {
            const mode = this.config.get("readMode");
            if (mode === "horizontal") {
                this.scrollContainer.scrollBy({ left: distance, behavior: "smooth" });
            } else {
                this.scrollContainer.scrollBy({ top: distance, behavior: "smooth" });
            }
        }

        /**
         * 翻页
         * @param {number} delta - 翻页步长
         */
        async _step(delta) {
            const mode = this.config.get("readMode");
            if (mode !== "pagination") {
                // 连续模式：滚动一屏
                const dir = delta > 0 ? 1 : -1;
                this._scrollBy(dir * this.scrollContainer.clientHeight * 0.8);
                return;
            }

            const perPage = Math.max(1, this.config.get("paginationIMGCount") || 1);
            const newIndex = this.currentIndex + delta * perPage;
            const queue = this.pageFetcher.queue;

            if (newIndex >= queue.length - 5) {
                this.pageFetcher.appendNextPage().then(() => this._renderNewItems());
            }

            if (newIndex < 0 || newIndex >= queue.length) return;
            this._goTo(newIndex);
        }

        /**
         * 预加载当前图片前后的图片
         */
        _preloadAround(index) {
            const queue = this.pageFetcher.queue;
            // 从配置读取预加载数量
            const ahead = this.config.get("preloadAhead") || 3;    // 后面预加载几张
            const behind = this.config.get("preloadBehind") || 1;   // 前面预加载几张
            const start = Math.max(0, index - behind);
            const end = Math.min(queue.length - 1, index + ahead);

            for (let i = start; i <= end; i++) {
                if (i === index) continue;
                if (this.preloaded.has(i)) continue;
                this.preloaded.add(i);
                // 使用 _loadImage 统一加载（含并发控制和UI更新）
                this._loadImage(i).catch(() => {
                    this.preloaded.delete(i);
                });
            }
        }

        /**
         * 调整图片缩放
         */
        _adjustScale(delta) {
            const current = this._getCurrentScale();
            const newScale = Math.max(10, Math.min(300, current + delta));
            // 设置配置会触发 config-changed 事件，由事件统一处理缩放（避免重复调用）
            this._setCurrentScale(newScale);
        }

        /**
         * 更新页码显示
         */
        _updatePageInfo() {
            const total = this.pageFetcher.queue.length;
            this.pageInfo.textContent = `${this.currentIndex + 1} / ${total}`;
        }

        /**
         * 切换自动播放
         */
        _toggleAutoPlay() {
            if (this.autoPlayTimer) {
                this._stopAutoPlay();
            } else {
                this._startAutoPlay();
            }
        }

        _startAutoPlay() {
            const speed = (this.config.get("autoPageSpeed") || 5) * 1000;
            this.autoPlayBtn.textContent = "⏸ 暂停";
            this.autoPlayTimer = setInterval(() => {
                const mode = this.config.get("readMode");
                if (mode === "pagination") {
                    const next = this.currentIndex + 1;
                    if (next >= this.pageFetcher.queue.length) {
                        this._stopAutoPlay();
                        return;
                    }
                    this._step(1);
                } else {
                    this._scrollBy(this.scrollContainer.clientHeight * 0.8);
                }
            }, speed);
        }

        _stopAutoPlay() {
            if (this.autoPlayTimer) {
                clearInterval(this.autoPlayTimer);
                this.autoPlayTimer = null;
            }
            this.autoPlayBtn.textContent = "▶ 自动";
        }

        /**
         * 下载当前图片
         */
        async _downloadCurrent() {
            const fetcher = this.pageFetcher.queue[this.currentIndex];
            if (!fetcher) return;
            if (fetcher.state < FetchState.DONE) {
                await fetcher.load();
            }
            if (fetcher.node.blob) {
                saveAs(fetcher.node.blob, fetcher.node.title);
            }
        }

        /**
         * 保存阅读进度
         */
        _saveProgress(index) {
            try {
                const key = `ehv_progress_${window.location.pathname}`;
                GM_setValue(key, { index, url: window.location.href, time: Date.now() });
            } catch (e) { log("warn", "Save progress failed:", e); }
        }

        static loadProgress() {
            try {
                const key = `ehv_progress_${window.location.pathname}`;
                const data = GM_getValue(key, null);
                if (data && typeof data.index === "number") return data.index;
            } catch (e) { /* ignore */ }
            return null;
        }
    }

    // ============================================================================
    // 第十二部分：下载器
    // ============================================================================

    /**
     * Downloader - 下载器
     * 批量下载画廊所有图片并打包为 ZIP
     * 功能：
     * 1. 遍历所有图片，获取原图URL并下载
     * 2. 并发控制（可配置下载线程数）
     * 3. 进度跟踪和状态显示
     * 4. ZIP 打包（使用 zip.js）
     * 5. 文件名排序规则
     * 6. 失败重试
     */
    class Downloader {
        /**
         * @param {EventBus} bus - 事件总线
         * @param {Config} config - 配置管理器
         * @param {PageFetcher} pageFetcher - 分页加载器
         * @param {ExHentaiMatcher} matcher - 站点适配器
         */
        constructor(bus, config, pageFetcher, matcher) {
            this.bus = bus;
            this.config = config;
            this.pageFetcher = pageFetcher;
            this.matcher = matcher;
            /** @type {boolean} 是否正在下载 */
            this.downloading = false;
            /** @type {number} 已完成数 */
            this.completed = 0;
            /** @type {number} 失败数 */
            this.failed = 0;
            /** @type {number} 总数 */
            this.total = 0;
        }

        /**
         * 开始下载整个画廊
         * @returns {Promise<void>}
         */
        async start() {
            if (this.downloading) {
                this.bus.emit("notify", "warn", "已有下载任务正在进行");
                return;
            }

            this.downloading = true;
            this.completed = 0;
            this.failed = 0;

            try {
                // 确保所有页都已加载
                this.bus.emit("notify", "info", "正在加载所有分页...");
                await this._ensureAllPages();

                const queue = this.pageFetcher.queue;
                this.total = queue.length;

                if (this.total === 0) {
                    this.bus.emit("notify", "error", "没有可下载的图片");
                    return;
                }

                this.bus.emit("download-start", this.total);
                this.bus.emit("notify", "info", `开始下载 ${this.total} 张图片...`);

                // 并发下载
                const threads = this.config.get("downloadThreads") || 3;
                const results = await this._downloadConcurrent(queue, threads);

                // 统计成功的
                const successItems = results.filter(r => r.success);
                this.failed = results.filter(r => !r.success).length;

                if (successItems.length === 0) {
                    this.bus.emit("notify", "error", "所有图片下载失败");
                    return;
                }

                // 打包 ZIP
                this.bus.emit("notify", "info", "正在打包 ZIP...");
                await this._packZip(successItems);

                this.bus.emit("download-done", this.completed, this.failed);
                this.bus.emit("notify", "success",
                    `下载完成：成功 ${this.completed} 张，失败 ${this.failed} 张`);

            } catch (e) {
                log("error", "Download failed:", e);
                this.bus.emit("notify", "error", `下载失败: ${e.message}`);
            } finally {
                this.downloading = false;
            }
        }

        /**
         * 确保所有分页都已加载
         */
        async _ensureAllPages() {
            let guard = 0;
            while (!this.pageFetcher.chapters[this.pageFetcher.chapterIndex]?.done && guard < 100) {
                const ok = await this.pageFetcher.appendNextPage();
                if (!ok) break;
                guard++;
            }
        }

        /**
         * 并发下载所有图片
         * @param {ImageFetcher[]} queue - 图片加载器队列
         * @param {number} threads - 并发线程数
         * @returns {Promise<Array<{success:boolean, index:number, blob?:Blob, title:string}>>}
         */
        async _downloadConcurrent(queue, threads) {
            const results = new Array(queue.length);
            let nextIndex = 0;

            const worker = async () => {
                while (nextIndex < queue.length) {
                    const idx = nextIndex++;
                    const fetcher = queue[idx];
                    try {
                        const success = await fetcher.load();
                        if (success && fetcher.node.blob) {
                            results[idx] = {
                                success: true,
                                index: idx,
                                blob: fetcher.node.blob,
                                title: this._generateFilename(fetcher.node.title, idx),
                            };
                            this.completed++;
                        } else {
                            results[idx] = { success: false, index: idx, title: fetcher.node.title };
                            this.failed++;
                        }
                    } catch (e) {
                        results[idx] = { success: false, index: idx, title: fetcher.node.title };
                        this.failed++;
                    }
                    this.bus.emit("download-progress", this.completed + this.failed, this.total);
                }
            };

            // 启动 threads 个 worker
            const workers = [];
            for (let i = 0; i < Math.min(threads, queue.length); i++) {
                workers.push(worker());
            }
            await Promise.all(workers);

            return results;
        }

        /**
         * 根据配置生成文件名
         * @param {string} originalTitle - 原始标题
         * @param {number} index - 索引
         * @returns {string}
         */
        _generateFilename(originalTitle, index) {
            const order = this.config.get("filenameOrder") || "auto";
            const sanitized = sanitizeFilename(originalTitle);

            switch (order) {
                case "numbers":
                    // 纯序号命名
                    return `${String(index + 1).padStart(4, "0")}.${this._getExt(sanitized)}`;
                case "original":
                    // 保留原文件名
                    return sanitized;
                case "alphabetically":
                case "auto":
                default:
                    // 序号前缀 + 原文件名
                    return `${String(index + 1).padStart(4, "0")}_${sanitized}`;
            }
        }

        /**
         * 从文件名提取扩展名
         * @param {string} filename
         * @returns {string}
         */
        _getExt(filename) {
            const match = filename.match(/\.(\w+)$/);
            return match ? match[1] : "jpg";
        }

        /**
         * 打包为 ZIP 文件并下载
         * @param {Array<{blob:Blob, title:string}>} items - 成功下载的图片项
         */
        async _packZip(items) {
            const writer = new zip.ZipWriter(new zip.BlobWriter("application/zip"));

            for (const item of items) {
                try {
                    await writer.add(item.title, new zip.BlobReader(item.blob));
                } catch (e) {
                    log("warn", `Add to zip failed for ${item.title}:`, e);
                }
            }

            const zipBlob = await writer.close();

            // 生成文件名（画廊标题）
            const chapter = this.pageFetcher.chapters[this.pageFetcher.chapterIndex];
            const galleryTitle = chapter?.meta?.title || "gallery";
            const zipFilename = `${sanitizeFilename(galleryTitle)}.zip`;

            saveAs(zipBlob, zipFilename);
        }
    }

    // ============================================================================
    // 第十三部分：配置面板
    // ============================================================================

    /**
     * ConfigPanel - 配置面板
     * 全套配置项的图形化配置界面
     * 分类：浏览设置、阅读设置、下载设置、E-Hentai专属、UI设置
     * 支持实时预览和保存
     */
    class ConfigPanel {
        /**
         * @param {EventBus} bus - 事件总线
         * @param {Config} config - 配置管理器
         */
        constructor(bus, config) {
            this.bus = bus;
            this.config = config;
            /** @type {boolean} 是否打开 */
            this.isOpen = false;
            /** @type {HTMLElement} 面板元素 */
            this.panel = null;

            this._createUI();
        }

        /**
         * 创建配置面板UI
         */
        _createUI() {
            this.panel = document.createElement("div");
            this.panel.className = "ehv-config-panel";
            this.panel.style.display = "none";

            // 面板头部
            const header = document.createElement("div");
            header.className = "ehv-config-header";
            header.innerHTML = "<span>⚙ 配置面板</span>";

            const closeBtn = document.createElement("button");
            closeBtn.className = "ehv-config-close";
            closeBtn.textContent = "✕";
            closeBtn.addEventListener("click", () => this.close());
            header.appendChild(closeBtn);

            // 配置内容区域（可滚动）
            this.content = document.createElement("div");
            this.content.className = "ehv-config-content";

            // 构建各分类配置
            this._buildBrowseSection();
            this._buildReadSection();
            this._buildDownloadSection();
            this._buildEHentaiSection();
            this._buildUISection();

            // 底部操作按钮
            const footer = document.createElement("div");
            footer.className = "ehv-config-footer";

            const resetBtn = document.createElement("button");
            resetBtn.className = "ehv-btn ehv-btn-danger";
            resetBtn.textContent = "重置所有配置";
            resetBtn.addEventListener("click", () => {
                if (confirm("确定要重置所有配置为默认值吗？")) {
                    this.config.reset();
                    this._refreshAllValues();
                    this.bus.emit("notify", "success", "配置已重置");
                }
            });

            footer.appendChild(resetBtn);

            this.panel.appendChild(header);
            this.panel.appendChild(this.content);
            this.panel.appendChild(footer);

            document.body.appendChild(this.panel);
        }

        /**
         * 创建一个配置项
         * @param {string} label - 标签文字
         * @param {string} key - 配置键名
         * @param {string} type - 类型：text/number/checkbox/select/range
         * @param {object} options - 额外选项 {min, max, step, choices, tooltip}
         * @returns {HTMLElement} 配置项元素
         */
        _createItem(label, key, type, options = {}) {
            const item = document.createElement("div");
            item.className = "ehv-config-item";

            const labelEl = document.createElement("label");
            labelEl.className = "ehv-config-label";
            labelEl.textContent = label;
            if (options.tooltip) {
                labelEl.title = options.tooltip;
            }

            let inputEl;
            const value = this.config.get(key);

            switch (type) {
                case "checkbox":
                    inputEl = document.createElement("input");
                    inputEl.type = "checkbox";
                    inputEl.checked = !!value;
                    inputEl.addEventListener("change", () => {
                        this.config.set(key, inputEl.checked);
                    });
                    break;
                case "number":
                    inputEl = document.createElement("input");
                    inputEl.type = "number";
                    inputEl.value = value;
                    if (options.min !== undefined) inputEl.min = options.min;
                    if (options.max !== undefined) inputEl.max = options.max;
                    if (options.step !== undefined) inputEl.step = options.step;
                    inputEl.addEventListener("change", () => {
                        this.config.set(key, parseFloat(inputEl.value) || 0);
                    });
                    break;
                case "range":
                    inputEl = document.createElement("input");
                    inputEl.type = "range";
                    inputEl.value = value;
                    inputEl.min = options.min || 0;
                    inputEl.max = options.max || 100;
                    inputEl.step = options.step || 1;
                    const rangeValue = document.createElement("span");
                    rangeValue.className = "ehv-config-rangevalue";
                    rangeValue.textContent = value;
                    inputEl.addEventListener("input", () => {
                        rangeValue.textContent = inputEl.value;
                        this.config.set(key, parseFloat(inputEl.value));
                    });
                    item.appendChild(labelEl);
                    item.appendChild(inputEl);
                    item.appendChild(rangeValue);
                    return item;
                case "select":
                    inputEl = document.createElement("select");
                    for (const choice of options.choices || []) {
                        const opt = document.createElement("option");
                        opt.value = choice.value;
                        opt.textContent = choice.label;
                        if (choice.value === value) opt.selected = true;
                        inputEl.appendChild(opt);
                    }
                    inputEl.addEventListener("change", () => {
                        this.config.set(key, inputEl.value);
                    });
                    break;
                case "text":
                default:
                    inputEl = document.createElement("input");
                    inputEl.type = "text";
                    inputEl.value = value || "";
                    inputEl.placeholder = options.placeholder || "";
                    inputEl.addEventListener("change", () => {
                        this.config.set(key, inputEl.value);
                    });
                    break;
            }

            item.appendChild(labelEl);
            item.appendChild(inputEl);
            return item;
        }

        /**
         * 创建设置分类标题
         * @param {string} title
         * @returns {HTMLElement}
         */
        _createSection(title) {
            const section = document.createElement("div");
            section.className = "ehv-config-section";
            const titleEl = document.createElement("h3");
            titleEl.className = "ehv-config-sectiontitle";
            titleEl.textContent = title;
            section.appendChild(titleEl);
            return section;
        }

        /**
         * 构建浏览设置分类
         */
        _buildBrowseSection() {
            const section = this._createSection("浏览设置");
            section.appendChild(this._createItem("每行缩略图数量", "colCount", "number",
                { min: 1, max: 20, tooltip: "缩略图列表每行显示的图片数量" }));
            section.appendChild(this._createItem("启用自适应视图", "enableFlowVision", "checkbox",
                { tooltip: "每行图片高度一致，数量自动调整，适合不规则宽高比的图片" }));
            section.appendChild(this._createItem("自适应行高", "rowHeight", "number",
                { min: 50, max: 500, tooltip: "自适应视图布局下每行的参考高度" }));
            section.appendChild(this._createItem("高清缩略图", "hdThumbnails", "checkbox",
                { tooltip: "从大图重采样更清晰的缩略图，会影响性能" }));
            section.appendChild(this._createItem("最大并发下载数", "threads", "number",
                { min: 1, max: 10, tooltip: "大图浏览时同时下载的图片数量，数值越大加载越快但占用带宽越多" }));
            section.appendChild(this._createItem("向后预加载张数", "preloadAhead", "number",
                { min: 0, max: 20, tooltip: "当前图后面自动预加载的图片数量" }));
            section.appendChild(this._createItem("向前预加载张数", "preloadBehind", "number",
                { min: 0, max: 10, tooltip: "当前图前面自动预加载的图片数量" }));
            section.appendChild(this._createItem("最大预加载距离", "maxPreloadDistance", "number",
                { min: 0, max: 100, tooltip: "不预加载超过此距离的图片，0为不限制（保留兼容）" }));
            section.appendChild(this._createItem("空闲加载线程", "maxIdleThreads", "number",
                { min: 1, max: 10, tooltip: "空闲时同时加载的最大图片数" }));
            section.appendChild(this._createItem("自动加载", "autoLoad", "checkbox",
                { tooltip: "进入阅读界面后自动加载所有图片" }));
            section.appendChild(this._createItem("后台保持加载", "autoLoadInBackground", "checkbox",
                { tooltip: "标签页失去焦点后保持自动加载" }));
            this.content.appendChild(section);
        }

        /**
         * 构建阅读设置分类
         */
        _buildReadSection() {
            const section = this._createSection("阅读设置");
            section.appendChild(this._createItem("阅读模式", "readMode", "select", {
                choices: [
                    { value: "continuous", label: "连续垂直滚动" },
                    { value: "pagination", label: "翻页模式" },
                    { value: "horizontal", label: "横向滚动" },
                ],
                tooltip: "连续垂直：图片上下排列滚动浏览；翻页：一次显示一张/多张；横向：从左到右滚动"
            }));
            section.appendChild(this._createItem("连续模式图片缩放(%)", "imgScaleContinuous", "number",
                { min: 10, max: 300, tooltip: "连续模式下图片宽度占容器的百分比，等比缩放" }));
            section.appendChild(this._createItem("横向模式图片缩放(%)", "imgScaleHorizontal", "number",
                { min: 10, max: 300, tooltip: "横向模式下图片高度占视口的百分比，等比缩放" }));
            section.appendChild(this._createItem("翻页模式图片缩放(%)", "imgScalePagination", "number",
                { min: 10, max: 300, tooltip: "翻页模式下图片缩放百分比，等比缩放" }));
            section.appendChild(this._createItem("翻页模式每页图片数", "paginationIMGCount", "number",
                { min: 1, max: 10, tooltip: "翻页模式下每页同时显示的图片数量" }));
            section.appendChild(this._createItem("反向翻页", "reversePages", "checkbox",
                { tooltip: "日漫风格从右到左阅读" }));
            section.appendChild(this._createItem("自动翻页速度(秒)", "autoPageSpeed", "number",
                { min: 1, max: 60, tooltip: "自动翻页模式下多少秒翻一页" }));
            section.appendChild(this._createItem("最小翻页间隔(ms)", "preventScrollPageTime", "number",
                { min: 0, max: 2000, tooltip: "翻页模式下防止滚动过快导致立即翻页" }));
            section.appendChild(this._createItem("放大镜", "magnifier", "checkbox",
                { tooltip: "翻页模式下拖动图片临时放大" }));
            section.appendChild(this._createItem("记录阅读进度", "recordReadingProgress", "checkbox",
                { tooltip: "记住每个画廊最后阅读的页面位置" }));
            section.appendChild(this._createItem("自动进入大图", "autoEnterBig", "checkbox",
                { tooltip: "点击入口后直接进入大图阅读模式" }));
            this.content.appendChild(section);
        }

        /**
         * 构建下载设置分类
         */
        _buildDownloadSection() {
            const section = this._createSection("下载设置");
            section.appendChild(this._createItem("下载并发数", "downloadThreads", "number",
                { min: 1, max: 10, tooltip: "下载时同时加载的图片数量，建议≤5" }));
            section.appendChild(this._createItem("下载原图", "fetchOriginal", "checkbox",
                { tooltip: "下载未压缩的原档文件，消耗更多流量和配额" }));
            section.appendChild(this._createItem("文件名排序", "filenameOrder", "select", {
                choices: [
                    { value: "auto", label: "自动检测" },
                    { value: "numbers", label: "纯序号" },
                    { value: "original", label: "保留原名" },
                    { value: "alphabetically", label: "字母序" },
                ],
                tooltip: "下载文件内的文件名排序规则"
            }));
            this.content.appendChild(section);
        }

        /**
         * 构建 E-Hentai 专属设置分类
         */
        _buildEHentaiSection() {
            const section = this._createSection("E-Hentai 专属");
            section.appendChild(this._createItem("标题语言偏好", "ehentaiTitlePrefer", "select", {
                choices: [
                    { value: "english", label: "英文/罗马音" },
                    { value: "japanese", label: "日文" },
                ],
                tooltip: "下载时使用哪个标题作为文件名"
            }));
            section.appendChild(this._createItem("镜像服务器", "ehentaiMirrorHost", "text",
                { placeholder: "https://xxx.xx", tooltip: "使用第三方镜像服务器绕过配额计算，镜像站可能不支持原图下载" }));
            this.content.appendChild(section);
        }

        /**
         * 构建 UI 设置分类
         */
        _buildUISection() {
            const section = this._createSection("界面设置");
            section.appendChild(this._createItem("自动打开", "autoOpen", "checkbox",
                { tooltip: "进入画廊页后自动展开阅读视图" }));
            section.appendChild(this._createItem("自动收起面板", "autoCollapsePanel", "checkbox",
                { tooltip: "鼠标移出控制面板时自动收起" }));
            section.appendChild(this._createItem("启用提示", "enableTooltips", "checkbox",
                { tooltip: "鼠标悬停显示配置项说明" }));
            this.content.appendChild(section);
        }

        /**
         * 刷新所有配置项的显示值
         */
        _refreshAllValues() {
            this.content.querySelectorAll("input, select").forEach(el => {
                // 简单实现：重新构建面板
            });
            // 实际应用中可以遍历所有配置项更新值
            // 这里为了简洁，直接提示刷新页面
            this.bus.emit("notify", "info", "配置已重置，刷新页面后生效");
        }

        /**
         * 打开配置面板
         */
        open() {
            this.isOpen = true;
            this.panel.style.display = "flex";
        }

        /**
         * 关闭配置面板
         */
        close() {
            this.isOpen = false;
            this.panel.style.display = "none";
        }

        /**
         * 切换显示/隐藏
         */
        toggle() {
            if (this.isOpen) this.close();
            else this.open();
        }
    }

    // ============================================================================
    // 第十四部分：控制栏
    // ============================================================================

    /**
     * ControlBar - 底部控制栏
     * 提供脚本的主要操作入口：打开/关闭阅读视图、下载、配置、帮助等
     */
    class ControlBar {
        /**
         * @param {EventBus} bus - 事件总线
         * @param {Config} config - 配置管理器
         * @param {ConfigPanel} configPanel - 配置面板实例
         * @param {Downloader} downloader - 下载器实例
         */
        constructor(bus, config, configPanel, downloader) {
            this.bus = bus;
            this.config = config;
            this.configPanel = configPanel;
            this.downloader = downloader;
            /** @type {HTMLElement} 控制栏元素 */
            this.bar = null;
            /** @type {boolean} 阅读视图是否激活 */
            this.viewActive = false;

            this._createUI();
            this._bindEvents();
        }

        /**
         * 创建控制栏UI
         */
        _createUI() {
            this.bar = document.createElement("div");
            this.bar.className = "ehv-controlbar";

            // 主入口按钮
            this.toggleBtn = document.createElement("button");
            this.toggleBtn.className = "ehv-bar-btn ehv-bar-main";
            this.toggleBtn.textContent = "🎑 阅读";
            this.toggleBtn.title = "打开/关闭重构的缩略图阅读视图";

            // 下载按钮
            this.downloadBtn = document.createElement("button");
            this.downloadBtn.className = "ehv-bar-btn";
            this.downloadBtn.textContent = "⬇ 下载";
            this.downloadBtn.title = "下载整个画廊为ZIP";

            // 配置按钮
            this.configBtn = document.createElement("button");
            this.configBtn.className = "ehv-bar-btn";
            this.configBtn.textContent = "⚙ 配置";

            // 进度显示
            this.progressEl = document.createElement("span");
            this.progressEl.className = "ehv-bar-progress";
            this.progressEl.textContent = "";

            this.bar.appendChild(this.toggleBtn);
            this.bar.appendChild(this.downloadBtn);
            this.bar.appendChild(this.configBtn);
            this.bar.appendChild(this.progressEl);

            document.body.appendChild(this.bar);
        }

        /**
         * 绑定事件
         */
        _bindEvents() {
            this.toggleBtn.addEventListener("click", () => {
                this.viewActive = !this.viewActive;
                this.bus.emit("view-toggle", this.viewActive);
                this.toggleBtn.textContent = this.viewActive ? "🎑 关闭" : "🎑 阅读";
            });

            this.downloadBtn.addEventListener("click", () => {
                this.downloader.start();
            });

            this.configBtn.addEventListener("click", () => {
                this.configPanel.toggle();
            });

            // 下载进度更新
            this.bus.subscribe("download-progress", (current, total) => {
                this.progressEl.textContent = `${current}/${total}`;
            });

            this.bus.subscribe("download-done", () => {
                this.progressEl.textContent = "";
            });

            this.bus.subscribe("download-start", () => {
                this.downloadBtn.disabled = true;
                this.downloadBtn.textContent = "下载中...";
            });

            this.bus.subscribe("download-done", () => {
                this.downloadBtn.disabled = false;
                this.downloadBtn.textContent = "⬇ 下载";
            });
        }
    }

    // ============================================================================
    // 第十五部分：通知消息
    // ============================================================================

    /**
     * Notifier - 通知消息组件
     * 在页面右上角显示临时通知消息
     */
    class Notifier {
        constructor(bus) {
            this.bus = bus;
            this.container = null;
            this._createUI();
            this._bindEvents();
        }

        _createUI() {
            this.container = document.createElement("div");
            this.container.className = "ehv-notifier-container";
            document.body.appendChild(this.container);
        }

        _bindEvents() {
            this.bus.subscribe("notify", (type, message, duration) => {
                this.show(type, message, duration);
            });
        }

        show(type, message, duration = 3000) {
            const item = document.createElement("div");
            item.className = `ehv-notifier ehv-notifier-${type}`;
            item.textContent = message;
            this.container.appendChild(item);

            setTimeout(() => {
                item.style.opacity = "0";
                item.style.transform = "translateX(100%)";
                setTimeout(() => item.remove(), 300);
            }, duration);
        }
    }

    // ============================================================================
    // 第十六部分：样式注入
    // ============================================================================

    /**
     * injectStyles - 注入脚本所需的CSS样式
     * 使用 Shadow DOM 或 style 标签注入，避免与原页面样式冲突
     */
    function injectStyles() {
        const css = `
/* ===== EH Viewer Rebuild Styles ===== */

/* 缩略图容器 */
.ehv-gdt-container {
    padding: 10px;
    min-height: 200px;
}

.ehv-thumb-grid {
    display: grid;
    gap: 4px;
}

.ehv-thumb-item {
    position: relative;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 4px;
    overflow: hidden;
    background: #1a1a1a;
    transition: border-color 0.2s;
    /* flex 布局下默认不自动伸缩，尺寸由 JS 计算设置 */
    flex: none;
    /* 关键：width 包含边框，否则 2px 边框会导致每张图多占 4px，最后一张被挤到下一行 */
    box-sizing: border-box;
}

.ehv-thumb-item:hover {
    border-color: #4a9eff;
}

.ehv-thumb-item.ehv-loaded {
    border-color: #2ecc71;
}

.ehv-thumb-item.ehv-failed {
    border-color: #e74c3c;
}

.ehv-thumb-imgwrap {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #222;
    overflow: hidden;
}

.ehv-thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.ehv-thumb-pagelabel {
    position: absolute;
    bottom: 2px;
    left: 2px;
    background: rgba(0,0,0,0.7);
    color: #fff;
    font-size: 11px;
    padding: 1px 4px;
    border-radius: 2px;
}

.ehv-thumb-status {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 12px;
    color: #2ecc71;
    text-shadow: 0 0 3px #000;
}

.ehv-loading {
    text-align: center;
    padding: 20px;
    color: #888;
    font-size: 14px;
}

/* ===== 大图阅读模式 ===== */
.ehv-big-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.92);
    z-index: 99999;
    display: flex;
    flex-direction: column;
}

.ehv-big-toolbar {
    position: absolute;
    top: 8px;
    left: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(30,30,30,0.9);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    z-index: 100;
}

.ehv-big-btn {
    background: #333;
    color: #fff;
    border: 1px solid #555;
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
}
.ehv-big-btn:hover { background: #444; }

.ehv-big-modebuttons {
    display: flex;
    gap: 2px;
}
.ehv-big-modebtn {
    padding: 4px 8px;
    border-radius: 3px;
}
.ehv-big-modebtn.active {
    background: #4a90d9;
    border-color: #4a90d9;
    color: #fff;
}
.ehv-big-modebtn.active:hover {
    background: #3a7bc8;
}

.ehv-big-pageinfo {
    color: #ccc;
    font-size: 14px;
    min-width: 60px;
    text-align: center;
}

.ehv-big-zoomvalue {
    color: #ccc;
    font-size: 13px;
    min-width: 45px;
    text-align: center;
}

.ehv-big-scrollcontainer {
    flex: 1;
    overflow: auto;
    position: relative;
    scroll-behavior: smooth;
    min-height: 0;
}

.ehv-big-imagecontent {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    padding: 0;
    min-height: 100%;
}

.ehv-big-imgwrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #111;
    border-radius: 4px;
    overflow: visible;
    min-height: 100px;
    width: 100%;
}

.ehv-big-img {
    width: 100%;
    height: auto;
    max-width: 100vw;
    object-fit: contain;
    display: block;
}

/* 占位缩略图和大图使用相同尺寸，无半透明模糊效果 */
.ehv-big-imgwrapper.ehv-big-loaded .ehv-big-img {
    opacity: 1;
}

/* 翻页模式：图片按宽高比自适应浏览器界面，不换行，左右横移查看 */
.ehv-pagination-mode {
    justify-content: flex-start;
    align-items: flex-start;
    min-height: 100%;
    gap: 0;
    padding: 0;
}

.ehv-pagination-mode .ehv-big-imgwrapper {
    flex: 0 0 auto;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    background: transparent;
    border-radius: 0;
}

.ehv-pagination-mode .ehv-big-img {
    display: block;
}

/* 右上角下载进度百分比 */
.ehv-big-progressbadge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0,0,0,0.75);
    color: #fff;
    font-size: 13px;
    font-weight: bold;
    padding: 4px 10px;
    border-radius: 4px;
    z-index: 5;
    pointer-events: none;
}

/* 错误覆盖层 */
.ehv-big-erroroverlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(40,0,0,0.85);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 6;
}

.ehv-big-errortext {
    color: #ff6b6b;
    font-size: 16px;
    text-align: center;
    padding: 0 20px;
}

.ehv-big-retrybtn {
    background: #e74c3c !important;
    border-color: #c0392b !important;
}
.ehv-big-retrybtn:hover { background: #c0392b !important; }

/* 导航按钮 */
.ehv-big-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0,0,0,0.5);
    color: #fff;
    border: none;
    width: 50px;
    height: 80px;
    font-size: 32px;
    cursor: pointer;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
}
.ehv-big-nav:hover { background: rgba(0,0,0,0.8); }
.ehv-big-nav-prev { left: 10px; }
.ehv-big-nav-next { right: 10px; }

/* ===== 缩略图下载进度边框 ===== */
.ehv-thumb-item.ehv-thumb-downloading {
    border-color: #4a9eff;
    border-style: solid;
    background: linear-gradient(
        90deg,
        rgba(74,158,255,0.15) 0%,
        rgba(74,158,255,0.15) var(--download-progress, 0%),
        transparent var(--download-progress, 0%)
    );
}

.ehv-thumb-item.ehv-thumb-downloadfailed {
    border-color: #e74c3c;
}

.ehv-controlbar {
    position: fixed;
    bottom: 16px;
    left: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: rgba(30,30,30,0.92);
    border-radius: 8px;
    z-index: 99998;
    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
    border: 1px solid #444;
}

.ehv-bar-btn {
    background: #333;
    color: #fff;
    border: 1px solid #555;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
}

.ehv-bar-btn:hover:not(:disabled) {
    background: #4a9eff;
    border-color: #4a9eff;
}

.ehv-bar-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.ehv-bar-main {
    background: #4a9eff;
    border-color: #4a9eff;
    font-weight: bold;
}

.ehv-bar-main:hover {
    background: #3a8eef !important;
}

.ehv-bar-progress {
    color: #aaa;
    font-size: 12px;
    margin-left: 4px;
}

/* ===== 配置面板 ===== */
.ehv-config-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 480px;
    max-height: 80vh;
    background: #1e1e1e;
    border: 1px solid #444;
    border-radius: 8px;
    z-index: 100000;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
}

.ehv-config-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #333;
    color: #fff;
    font-weight: bold;
}

.ehv-config-close {
    background: none;
    border: none;
    color: #888;
    font-size: 18px;
    cursor: pointer;
    padding: 0 4px;
}

.ehv-config-close:hover {
    color: #fff;
}

.ehv-config-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
}

.ehv-config-section {
    margin-bottom: 20px;
}

.ehv-config-sectiontitle {
    color: #4a9eff;
    font-size: 14px;
    margin: 0 0 10px 0;
    padding-bottom: 4px;
    border-bottom: 1px solid #333;
}

.ehv-config-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    gap: 10px;
}

.ehv-config-label {
    color: #ddd;
    font-size: 13px;
    flex: 1;
    cursor: help;
}

.ehv-config-item input[type="text"],
.ehv-config-item input[type="number"],
.ehv-config-item select {
    background: #2a2a2a;
    color: #fff;
    border: 1px solid #444;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 13px;
    width: 120px;
}

.ehv-config-item input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.ehv-config-item input[type="range"] {
    width: 100px;
}

.ehv-config-rangevalue {
    color: #aaa;
    font-size: 12px;
    min-width: 30px;
    text-align: right;
}

.ehv-config-footer {
    padding: 10px 16px;
    border-top: 1px solid #333;
    display: flex;
    justify-content: flex-end;
}

.ehv-btn {
    padding: 6px 14px;
    border-radius: 4px;
    border: 1px solid #555;
    cursor: pointer;
    font-size: 13px;
}

.ehv-btn-danger {
    background: #c0392b;
    color: #fff;
    border-color: #c0392b;
}

.ehv-btn-danger:hover {
    background: #e74c3c;
}

/* ===== 通知消息 ===== */
.ehv-notifier-container {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 100001;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.ehv-notifier {
    padding: 10px 16px;
    border-radius: 6px;
    color: #fff;
    font-size: 13px;
    max-width: 360px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    transition: opacity 0.3s, transform 0.3s;
}

.ehv-notifier-info { background: #2980b9; }
.ehv-notifier-success { background: #27ae60; }
.ehv-notifier-warn { background: #f39c12; }
.ehv-notifier-error { background: #c0392b; }
`;

        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ============================================================================
    // 第十七部分：主应用入口
    // ============================================================================

    /**
     * App - 主应用类
     * 协调所有模块的初始化和交互
     */
    class App {
        constructor() {
            /** @type {EventBus} */
            this.bus = new EventBus();
            /** @type {Config} */
            this.config = new Config(this.bus);
            /** @type {ExHentaiMatcher} */
            this.matcher = new ExHentaiMatcher(this.config);
            /** @type {PageFetcher} */
            this.pageFetcher = new PageFetcher(this.matcher, this.bus, this.config);
            /** @type {ThumbnailGrid|null} */
            this.thumbGrid = null;
            /** @type {BigImageView|null} */
            this.bigView = null;
            /** @type {Downloader|null} */
            this.downloader = null;
            /** @type {ConfigPanel|null} */
            this.configPanel = null;
            /** @type {ControlBar|null} */
            this.controlBar = null;
            /** @type {Notifier|null} */
            this.notifier = null;
        }

        /**
         * 初始化应用
         */
        async init() {
            // 只在画廊页运行
            if (!REGEX.workURL.test(window.location.href)) {
                log("info", "Not a gallery page, script will not run");
                return;
            }

            log("info", "EH Viewer Rebuild initializing...");

            // 注入样式
            injectStyles();

            // 初始化通知组件
            this.notifier = new Notifier(this.bus);

            // 初始化配置面板
            this.configPanel = new ConfigPanel(this.bus, this.config);

            // 初始化下载器
            this.downloader = new Downloader(this.bus, this.config, this.pageFetcher, this.matcher);

            // 初始化控制栏
            this.controlBar = new ControlBar(this.bus, this.config, this.configPanel, this.downloader);

            // 初始化大图阅读（不立即显示）
            this.bigView = new BigImageView(this.bus, this.config, this.pageFetcher);

            // 绑定视图切换事件
            this.bus.subscribe("view-toggle", (active) => {
                if (active) {
                    this._activateView();
                } else {
                    this._deactivateView();
                }
            });

            // 如果配置了自动打开，自动激活
            if (this.config.get("autoOpen")) {
                setTimeout(() => {
                    this.controlBar.toggleBtn.click();
                }, 500);
            }

            log("info", "EH Viewer Rebuild initialized successfully");
            this.bus.emit("notify", "success", "EH阅读器已加载，点击左下角🎑按钮开始");
        }

        /**
         * 激活阅读视图（重构 #gdt）
         */
        async _activateView() {
            if (this.thumbGrid) return;

            // 第一步：创建缩略图网格（构造函数只保存引用，不清空 #gdt）
            this.thumbGrid = new ThumbnailGrid(this.bus, this.config, this.pageFetcher);

            // 第二步：初始化分页加载器（此时 #gdt 仍在原页面中，
            // parseImgNodes 可以从 document 正常读取缩略图节点和分页信息）
            await this.pageFetcher.init();

            // 第三步：激活缩略图网格（清空 #gdt，创建自定义UI，渲染已加载的数据）
            this.thumbGrid.activate();

            // 检查并恢复阅读进度
            const savedIndex = BigImageView.loadProgress();
            if (savedIndex !== null && savedIndex > 0) {
                this.bus.emit("notify", "info",
                    `检测到上次阅读位置：第 ${savedIndex + 1} 页`, 4000);
            }

            // 如果配置了自动进入大图
            if (this.config.get("autoEnterBig")) {
                const startIndex = savedIndex || 0;
                this.bus.emit("big-open", startIndex);
            }
        }

        /**
         * 停用阅读视图（恢复 #gdt）
         */
        _deactivateView() {
            if (this.thumbGrid) {
                this.thumbGrid.restore();
                this.thumbGrid = null;
            }
            // 关闭大图阅读（如果打开着）
            if (this.bigView && this.bigView.isOpen) {
                this.bigView.close();
            }
        }
    }

    // ============================================================================
    // 启动应用
    // ============================================================================

    // 等待 DOM 就绪后启动
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            new App().init();
        });
    } else {
        new App().init();
    }

})();
