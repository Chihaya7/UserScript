// ==UserScript==
// @name               wnacg Viewer
// @name:zh-CN         wnacg Viewer
// @namespace          绅士漫画
// @version            4.17.3
// @author
// @description        更改缩略图列数，图片分辨率重新采样，未优化，卡顿明显
// @description:en     Manga Viewer + Downloader, Focus on experience and low load on the site. Support you in finding the site you are searching for.
// @description:zh-CN  漫画阅读 + 下载器，注重体验和对站点的负载控制。支持你正在搜索的站点。
// @license            MIT
// @supportURL
// @match              *://*/*
// @require            https://cdn.jsdelivr.net/npm/@zip.js/zip.js@2.8.23/dist/zip.min.js
// @require            https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @require            https://cdn.jsdelivr.net/npm/pica@9.0.1/dist/pica.min.js
// @connect            *
// @grant              GM.xmlHttpRequest
// @grant              GM_getValue
// @grant              GM_setValue
// ==/UserScript==


(function (pica, _zip_js_zip_js, file_saver) {
    "use strict";
    var __create = Object.create;
    var __defProp$1 = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __copyProps = (to, from, except, desc) => {
        if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
            key = keys[i];
            if (!__hasOwnProp.call(to, key) && key !== except) __defProp$1(to, key, {
                get: ((k) => from[k]).bind(null, key),
                enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
            });
        }
        return to;
    };
    var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp$1(target, "default", {
        value: mod,
        enumerable: true
    }) : target, mod));
    pica = __toESM(pica);
    _zip_js_zip_js = __toESM(_zip_js_zip_js);
    var __defProp = Object.defineProperty;
    var __exportAll = (all, no_symbols) => {
        let target = {};
        for (var name in all) __defProp(target, name, {
            get: all[name],
            enumerable: true
        });
        if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
        return target;
    };
    var GalleryMeta = class {
        url;
        title;
        originTitle;
        downloader;
        tags;
        constructor(url, title) {
            this.url = url;
            this.title = title;
            this.tags = {};
            this.downloader = "https://github.com/MapoMagpie/comic-looms";
        }
    };
    var _GM = (() => typeof GM != "undefined" ? GM : void 0)();
    var _GM_getValue = (() => typeof GM_getValue != "undefined" ? GM_getValue : void 0)();
    var _GM_setValue = (() => typeof GM_setValue != "undefined" ? GM_setValue : void 0)();
    var i18nIndex = 0;
    var I18nValue = class extends Array {
        constructor(langs) {
            super(...langs);
        }
        get() {
            return this[i18nIndex];
        }
    };
    var i18nData = {
        imageScale: ["缩放"],
        config: ["配置"],
        chapters: ["章节"],
        filter: ["过滤"],
        autoPagePlay: ["播放"],
        autoPagePause: ["暂停"],
        collapse: ["收起"],
        colCount: ["每行数量"],
        colCountTooltip: ["缩略图列表的每行图片数量。如果布局为自适应视图，最终每行图片数量受图片的具体宽高比影响。"],
        rowHeight: ["每行高度"],
        rowHeightTooltip: ["此项仅在缩略图列表的布局为自适应视图时有效。每行的参考高度，和每行数量共同影响最终的展示效果。"],
        threads: ["最大浏览时加载"],
        threadsTooltip: ["大图浏览时，每次滚动到下一张时，预加载的图片数量，大于1时体现为越看加载的图片越多，将提升浏览体验。"],
        maxPreloadDistance: ["最大预加载距离"],
        maxPreloadDistanceTooltip: ["不预加载距离当前图片超过此页数的图片。设为 0 可关闭距离限制。"],
        maxIdleThreads: ["最大空闲时加载"],
        maxIdleThreadsTooltip: ["空闲时同时加载的最大图片数量。"],
        downloadThreads: ["最大同时下载"],
        downloadThreadsTooltip: ["下载模式下，同时加载的图片数量，建议小于等于5"],
        paginationIMGCount: ["每页图片数量"],
        paginationIMGCountTooltip: ["当阅读模式为翻页模式时，每页展示的图片数量"],
        timeout: ["超时时间(秒)"],
        preventScrollPageTime: ["最小翻页时间"],
        preventScrollPageTimeTooltip: ["当阅读模式为翻页模式时，滚动浏览时，阻止滚动到底部时立即翻页，提升阅读体验。<br>设置为0时则禁用此功能，单位为毫秒。<br>设置小于0时则永远禁止通过滚动的方式翻页。空格键除外。"],
        autoPageSpeed: ["自动翻页速度"],
        autoPageSpeedTooltip: ["当阅读模式为翻页模式时，自动翻页速度表示为多少秒后翻页。<br>当阅读模式为连续模式时，自动翻页速度表示为滚动速度。"],
        scrollingDelta: ["滚动距离"],
        scrollingDeltaTooltip: ["非浏览器原生的滚动时（按键滚动、横向滚动），每次滚动的距离。"],
        smartScrolling: ["智能滚动"],
        smartScrollingTooltip: ["启用此项后，会在需要时进行横向滚动，而无需按下shift键。(这不是浏览器原生的滚动，因此在某些情况下体验不佳。)"],
        scrollingSpeed: ["滚动速度"],
        scrollingSpeedTooltip: ["非浏览器原生的滚动时（按键滚动、横向滚动），滚动的速度。"],
        fetchOriginal: ["最佳质量"],
        fetchOriginalTooltip: ["启用后，将加载未经过压缩的原档文件，下载打包后的体积也与画廊所标体积一致。<br>注意：这将消耗更多的流量与配额，请酌情启用。"],
        autoLoad: ["自动加载"],
        autoLoadTooltip: ["进入本脚本的浏览模式后，即使不浏览也会一张接一张的加载图片。直至所有图片加载完毕。"],
        reversePages: ["反向翻页"],
        reversePagesTooltip: ["点击侧边导航时，是否反向翻页，反向翻页类似日本漫画那样的从右到左的阅读方式。"],
        autoPlay: ["自动翻页"],
        autoPlayTooltip: ["当阅读大图时，开启自动播放模式。"],
        autoLoadInBackground: ["后台加载"],
        autoLoadInBackgroundTooltip: ["当标签页失去焦点后保持自动加载。"],
        autoOpen: ["自动展开"],
        autoOpenTooltip: ["进入画廊页面后，自动展开阅读视图。"],
        autoCollapsePanel: ["自动收起控制面板"],
        autoCollapsePanelTooltip: ["当鼠标移出控制面板时，自动收起控制面板。禁用此选项后，只能通过控制栏上的按钮切换控制面板的显示。"],
        magnifier: ["放大镜"],
        magnifierTooltip: ["在翻页阅读模式下，你可以通过鼠标左键拖动图片临时放大图片以及图片跟随指针移动。"],
        autoEnterBig: ["自动大图"],
        dragImageOut: ["拖拽图片到外部"],
        dragImageOutTooltip: [`启用此项将恢复浏览器默认对图片的拖拽行为(保存图片到所拖拽到的目录)，但会禁用放大镜功能以及拖拽移动图片位置的功能。`],
        autoEnterBigTooltip: ["点击脚本入口或自动打开脚本后直接进入大图阅读视图。"],
        recordReadingProgress: ["记录阅读进度"],
        recordReadingProgressTooltip: ["记住每个章节最后打开的页面，并在再次打开阅读器时恢复。如果页面发生变化，会优先匹配已保存的图片地址，再使用最近的可用页。"],
        hdThumbnails: ["高清缩略图"],
        hdThumbnailsTooltip: ["当图片加载完毕后，是否从源图重新采样更加清晰的图片作为缩略图，此项会影响性能。"],
        pixivJustCurrPage: ["Pixiv 仅加载当前作品页"],
        pixivJustCurrPageTooltip: ["在Pixiv中，如果当前页是作品页则只加载当前页中的图片，如果该选项禁用或者当前页是作者主页，则加载该作者所有的作品。<br>注：你可以禁用该选项后，然后通过页面滚动或按下Shift+n来继续加载该作者所有的图片。"],
        pixivRecordReading: ["Pixiv 记录阅读位置"],
        pixivRecordReadingTooltip: ["记录阅读位置，再次阅读时，将出现一个新的章节表示从该位置继续阅读。"],
        pixivAscendWorks: ["Pixiv 升序排列作品"],
        pixivAscendWorksTooltip: ["将画师的作品以升序方式排序，从旧到新。(需要刷新)"],
        pixivMirrorHost: ["Pixiv 图片服务器"],
        pixivMirrorHostTooltip: ["将Pixiv默认的图片服务器 i.pximg.net 替换为你所指定的代理服务器，如： i.pixiv.re，以获得更佳的加载速度。"],
        pixivUgoiraMode: ["Pixiv 动图模式"],
        pixivUgoiraModeTooltip: ["如何处理Pixiv的Ugoira<br>  模式Ugoira: 处理速度快且占用低，可快速开始播放，但下载后将保存每一帧图片到文件夹，同时提供一个一键转换脚本，将图片序列转换为GIF。<br>  模式GIF和MP4：将使用ffmpeg.wasm直接将ugoira转换为可直接播放的格式，但转换速度慢占用高。"],
        readMode: ["阅读模式"],
        gridMode: ["缩略图模式"],
        wnSwitchMode: ["切换线路时换源范围"],
        wnSwitchModeTooltip: ["全部图片：切换线路后所有图片都按新线路重新下载。<br>仅未加载图片：已加载完成的图片保留旧线路数据，仅尚未下载的图片按新线路加载。"],
        readModeTooltip: ["滚动时切换到下一张图片，否则连续阅读"],
        stickyMouse: ["黏糊糊鼠标"],
        stickyMouseTooltip: ["非连续阅读模式下，通过鼠标移动来自动滚动单张图片。"],
        minifyPageHelper: ["最小化控制栏"],
        minifyPageHelperTooltip: ["最小化控制栏"],
        hitomiFormat: ["Hitomi 图片格式"],
        hitomiFormatTooltip: ["在Hitomi中的源图格式。<br>如果是Auto，则优先获取Avif > Jxl > Webp，修改后需要刷新生效。"],
        ehentaiTitlePrefer: ["标题语言偏好"],
        ehentaiTitlePreferTooltip: ["许多图库都同时拥有英文/罗马音标题和日文标题，<br>您希望下载时哪个作为文件名？"],
        ehentaiMirrorHost: ["E-hentai 镜像服务器"],
        ehentaiMirrorHostTooltip: ["使用第三方的镜像服务器，格式为 https://xxx.xx，这会绕过e-hentai.org本站的额度计算，为你节省额度的使用。但镜像站可能不支持原图下载，请酌情使用。"],
        reverseMultipleImagesPost: ["反转推文图片顺序"],
        reverseMultipleImagesPostTooltip: ["反转推文图片顺序"],
        excludeVideo: ["排除视频"],
        excludeVideoTooltip: ["排除视频，现在仅作用于x.com和kemono.su"],
        filenameOrder: ["文件名排序"],
        filenameOrderTooltip: [`下载文件内的文件名排序规则：
<br>  Auto: 检测原文件名在自然排序(Windows)下是否与阅读顺序一致，如果一致保留原文件名，否则将在原文件名前添加序号以保证顺序。
<br>  Numbers: 忽略原文件名，直接以阅读顺序为文件命名。
<br>  Original: 只保留原文件名，不能保证阅读顺序以及同名文件覆盖。
<br>  Alphabetically: 检测原文件名在字母排序下(Linux)是否与阅读顺序一致，如果一致保留原文件名，否则将在原文件名前添加序号以保证顺序。`],
        dragToMove: ["拖动移动"],
        resetDownloaded: ["重置已下载的图片"],
        resetDownloadedConfirm: ["已下载的图片将会被重置为未下载！"],
        resetFailed: ["重置下载错误的图片"],
        showHelp: ["帮助"],
        showKeyboard: ["快捷键"],
        showSiteProfiles: ["站点配置"],
        showStyleCustom: ["样式"],
        showActionCustom: ["图片操作"],
        example: ["示例"],
        description: ["描述"],
        function: ["函数"],
        parameters: ["参数"],
        body: ["体"],
        icon: ["图标"],
        optional: ["可选"],
        regexp: ["正则"],
        workon: ["生效站点"],
        global: ["全局"],
        controlBarStyleTooltip: ["点击某项后修改其显示文本，比如emoji或个性文字，也许svg，重启后生效。"],
        resetConfig: ["重置配置"],
        letUsStar: ["点星"],
        download: ["下载"],
        forceDownload: ["获取已下载的"],
        downloadStart: ["开始下载"],
        downloading: ["下载中..."],
        downloadFailed: ["下载失败(重试)"],
        downloaded: ["下载完成"],
        packaging: ["打包中..."],
        status: ["状态"],
        selectChapters: ["章节"],
        cherryPick: ["范围选择"],
        enable: ["启用"],
        enableTooltips: ["在此站点上启用本脚本的功能。"],
        enableAutoOpen: ["自动打开"],
        enableAutoOpenTooltips: ["当进入对应的生效页面后，自动打开本脚本界面。"],
        enableFlowVision: ["自适应视图"],
        enableFlowVisionTooltips: [`启用一种新的缩略图列表布局，使每行的图片高度一致，但自动分配每行的图片数量。
    <br>整体看起来更紧凑舒适，适合图片宽高比不规则的插画类站点。
    <br>注意：由于一些站点无法提取得知图片的宽高比，因此效果可能会受到影响。`],
        addRegexp: ["添加生效地址规则"],
        failFetchReason1: ["被拒绝连接{{domain}}(大图地址)，请检查域名黑名单: Tampermonkey(篡改猴) > 漫画织机 > 设置 > XHR Security >  User domain blacklist"],
        latestArtWorks: ["最新作品"],
        afterLastReading: ["上次阅读之后"],
        beforeLastReading: ["上次阅读之前"],
        allArtWorks: ["全部作品"],
        currentArtWorks: ["当前页的作品"],
        contextMenuTooltip: ["你仍能通过Shift+右键打开原始菜单"],
        help: [`
<h2>[如何使用？入口在哪里？]</h2>
<p>脚本一般生效于画廊详情页或画家的主页或作品页。比如在E-Hentai上，生效于画廊详情页，或者在Twitter上，生效于推主的主页或推文。</p>
<p>生效时，在页面的左下方会有一个<strong>&lt;??&gt;</strong>图标，点击后即可进入脚本的阅读界面。</p>
<h2 style="color:red;">[一些现存的问题，以及解决方式。]</h2>
<ul>
<li>使用Firefox浏览Twitter|X时，跳转到其他页面后，需要刷新才可以使此脚本在该页面生效。</li>
<li>使用Firefox浏览Twitter|X时，此脚本的下载功能可能无法使用。</li>
</ul>
<h4>解决方式:</h4>
<p>这些问题是由于Twitter|X的内容安全策略(CSP)导致，它使URL的变动检测和创建Zip功能失效。</p>
<p>可以通过其他拓展修改Twitter|X的响应头<strong>Content-Security-Policy</strong>为<strong>Content-Security-Policy: object-src '*'</strong></p>
<p>例如在拓展<strong>Header Editor</strong>中，点击添加按钮:</p>
<ul>
<li>Name: csp-remove(随意)</li>
<li>Rule type: Modify response header</li>
<li>Match type: domain</li>
<li>Match rules: x.com</li>
<li>Execute type: normal</li>
<li>Header name: content-security-policy</li>
<li>Header value: object-src '*'</li>
</ul>
<h2>[脚本的入口或控制栏可以更改位置吗？]</h2>
<p>可以！在配置面板的下方，有一个<strong>拖拽移动</strong>的选项，对着图标进行拖动，你可以将控制栏移动到页面上的任意位置。</p>
<h2>[进入对应的页面的，可以自动打开脚本吗？]</h2>
<p>可以！在配置面板中，有一个<strong>自动打开</strong>的选项，启用即可。</p>
<h2>[如何缩放图片？]</h2>
<p>有几种方式可以在大图阅读模式中缩放图片：</p>
<ul>
<li>鼠标右键+滚轮</li>
<li>键盘快捷键</li>
<li>控制栏上的缩放控制，点击-/+按钮，或者在数字上滚动滚轮，或者左右拖动数字。</li>
</ul>
<h2>[如何让大图之间保持间隔？]</h2>
<p>在CONF > Style中，修改或添加 .ehvp-root { --ehvp-big-images-gap: 2px; }</p>
<h2>[如何打开指定页数的图片？]</h2>
<p>在缩略图列表界面中，直接在键盘上输入数字(没有提示)，然后按下回车或自定义的快捷键。</p>
<h2>[关于缩略图列表。]</h2>
<p>缩略图列表是脚本最重要的特性，可以让你快速地了解整个画廊的情况。</p>
<p>并且缩略图也是延迟加载的，通常会加载20张左右，与正常浏览所发出的请求相当，甚至更低。</p>
<p>并且分页也是延迟加载的，并不会一次性加载画廊的所有分页，只有滚动到接近底部时，才会加载下一页。</p>
<p>不用担心因为在缩略图列表中快速滚动而导致发出大量的请求，脚本充分考虑到了这一点。</p>
<h2>[关于自动加载和预加载。]</h2>
<p>默认配置下，脚本会自动且缓慢地一张接一张地加载大图。</p>
<p>你仍然可以点击任意位置的缩略图，并从该处开始加载并阅读，此时会自动加载会停止并从阅读的位置预加载3张图片。</p>
<p>同缩略图列表一样，无需担心因为快速滚动而导致发出大量的加载请求。</p>
<h2>[关于下载。]</h2>
<p>下载与大图加载是一体的，当你浏览完画廊时，突然想起来要保存下载，此时你可以在下载面板中点击<strong>开始下载</strong>，不必担心会重复下载已经加载过的图片。</p>
<p>当然你也可以不浏览，直接在下载面板中点击<strong>开始下载</strong>。</p>
<p>或者点击下载面板中的<strong>获取已下载的</strong>按钮，当一些图片总是加载失败的时候，你可以使用此功能来保存已经加载过的图片。</p>
<p>通过下载面板中的状态可以直观地看到图片加载的情况。</p>
<p><strong>注意：</strong>当下载文件大小超过1.2G后，会自动启用分卷压缩。当使用解压软件解压出错时，请更新解压软件或使用7-Zip。</p>
<h2>[可以选择下载范围吗？]</h2>
<p>可以，在下载面板中有选择下载范围的功能，该功能对下载、自动加载、预加载都生效。</p>
<p>另外，如果一张图片被排除在下载范围之外，你仍然可以点击该图片的缩略图进行浏览，这会加载对应的大图。</p>
<h2>[如何在一些插画网站上挑选图片？]</h2>
<p>在缩略图列表中使用一些快捷键可以进行图片的挑选。</p>
<ul>
<li><strong>Ctrl+鼠标左键：</strong> 选中该图片，当第一次选中时，其他的图片都会被排除。</li>
<li><strong>Ctrl+Shift+鼠标左键：</strong> 选中该图片与上一张选中的图片之间的范围。</li>
<li><strong>Alt+鼠标左键：</strong> 排除该图片，当第一次排除时，其他的图片都会被选中。</li>
<li><strong>Alt+Shift+鼠标左键：</strong> 排除该图片与上一张排除的图片之间的范围。</li>
</ul>
<p>除此之外还有几种方式：</p>
<ul>
<li>在缩略图上按下鼠标中键，即可打开图片的原始地址，之后你可以右键保存图片。</li>
<li>在下载面板中设置下载范围为1，这样会排除第一张图片以外的所有图片，之后在缩略图列表上点击你感兴趣的图片，对应的大图会被加载，最终挑选完毕后，删除掉下载范围并点击<strong>获取已下载的</strong>，这样你挑选的图片会被打包下载。</li>
<li>在配置面板中关闭自动加载，并设置预加载数量为1，之后与上面的方法类似。</li>
</ul>
<h2>[可以通过键盘来操作吗？]</h2>
<p>可以！在配置面板的下方，有一个<strong>快捷键</strong>按钮，点击后可以查看键盘操作，或进行配置。</p>
<p>甚至可以配置为单手全键盘操作，解放另一只手！</p>
<h2>[如何Feed作者。]</h2>
<p>给我<a target="_blank" href="https://github.com/MapoMagpie/comic-looms">Github</a>星星，或者<a target="_blank" href="https://greasyfork.org/scripts/397848-comic-looms">Greasyfork</a>上好评。</p>
<p>请勿在Greasyfork上反馈问题，因为该站点的通知系统无法跟踪后续的反馈。很多人只是留下一个问题，再也没有回来过。
请在此反馈问题: <a target="_blank" href="https://github.com/MapoMagpie/comic-looms/issues">issue</a></p>
<h2>[如何再次打开指南？]</h2>
<p>在配置面板的下方，点击<strong>帮助</strong>按钮。</p>
`]
    };
    var kbInFullViewGridData = {
        "open-full-view-grid": ["进入阅读模式"],
        "open-in-new-tab": ["在新标签页打开"],
        "start-download": ["开始下载"],
        "step-image-prev": ["切换到上一张图片"],
        "step-image-next": ["切换到下一张图片"],
        "exit-big-image-mode": ["退出大图模式"],
        "step-to-first-image": ["跳转到第一张图片"],
        "step-to-last-image": ["跳转到最后一张图片"],
        "scale-image-increase": ["放大图片"],
        "scale-image-decrease": ["缩小图片"],
        "scroll-image-up": ["向上滚动图片 (请保留默认按键)"],
        "scroll-image-down": ["向下滚动图片 (请保留默认按键)"],
        "toggle-auto-play": ["切换自动播放"],
        "round-read-mode": ["切换阅读模式(循环)"],
        "toggle-reverse-pages": ["切换阅读方向"],
        "rotate-image": ["旋转图片"],
        "cherry-pick-current": ["选择当前图片"],
        "exclude-current": ["排除当前图片"],
        "open-big-image-mode": ["进入大图阅读模式"],
        "pause-auto-load-temporarily": ["临时停止自动加载"],
        "exit-full-view-grid": ["退出阅读模式"],
        "columns-increase": ["增加每行数量"],
        "columns-decrease": ["减少每行数量"],
        "retry-fetch-next-page": ["重新加载下一分页"],
        "go-prev-chapter": ["切换到上一章节"],
        "go-next-chapter": ["切换到下一章节"],
        "resize-flow-vision": ["重新排布缩略图网格"],
        "cherry-pick-select": ["选择此图片"],
        "cherry-pick-select-range": ["选择图片们"],
        "cherry-pick-exclude": ["排除此图片"],
        "cherry-pick-exclude-range": ["排除图片们"],
        "reload-image": ["加载图片或重新加载"]
    };
    function convert(data) {
        return Object.entries(data).reduce((prev, [k, v]) => {
            prev[k] = new I18nValue(v);
            return prev;
        }, {});
    }
    var i18n = {
        ...convert(i18nData),
        keyboard: convert(kbInFullViewGridData)
    };
    function uuid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            return (c == "x" ? r : r & 3 | 8).toString(16);
        });
    }
    function transactionId() {
        return window.btoa(uuid());
    }
    function b64EncodeUnicode(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (_match, p1) {
            return String.fromCharCode(parseInt(p1, 16));
        }));
    }
    function b64DecodeUnicode(str) {
        return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(""));
    }
    var IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent);
    function defaultColumns() {
        const screenWidth = window.screen.width;
        return screenWidth > 2500 ? 7 : screenWidth > 1900 ? 6 : screenWidth > 700 ? 5 : 3;
    }
    function defaultRowHeight() {
        const vh = window.screen.availHeight;
        return Math.floor(vh / 3.4);
    }
    function defaultConf() {
        return {
            colCount: defaultColumns(),
            rowHeight: defaultRowHeight(),
            readMode: "pagination",
            gridMode: "flow",
            autoLoad: true,
            fetchOriginal: false,
            restartIdleLoader: 2e3,
            maxIdleThreads: 1,
            threads: 3,
            maxPreloadDistance: 0,
            downloadThreads: 4,
            timeout: 10,
            version: CONF_VERSION,
            debug: true,
            first: true,
            reversePages: false,
            pageHelperAbTop: "unset",
            pageHelperAbLeft: "20px",
            pageHelperAbBottom: "20px",
            pageHelperAbRight: "unset",
            imgScale: 100,
            defaultImgScaleModeC: 60,
            autoPageSpeed: 5,
            autoPlay: false,
            hdThumbnails: false,
            filenameTemplate: "{number}-{title}",
            preventScrollPageTime: 100,
            archiveVolumeSize: 1200,
            autoCollapsePanel: true,
            minifyPageHelper: IS_MOBILE ? "never" : "inBigMode",
            keyboards: {
                inBigImageMode: {},
                inFullViewGrid: {},
                inMain: {}
            },
            muted: false,
            volume: 50,
            paginationIMGCount: 1,
            hitomiFormat: "auto",
            autoOpen: false,
            autoLoadInBackground: true,
            reverseMultipleImagesPost: true,
            ehentaiTitlePrefer: "japanese",
            ehentaiMirrorHost: "",
            scrollingDelta: 300,
            scrollingSpeed: 20,
            smartScrolling: true,
            id: uuid(),
            configPatchVersion: 0,
            displayText: {},
            customStyle: "",
            magnifier: false,
            autoEnterBig: false,
            recordReadingProgress: false,
            pixivRecordReading: false,
            pixivAscendWorks: false,
            pixivUgoiraMode: "ugoira",
            pixivMirrorHost: "",
            filenameOrder: "auto",
            dragImageOut: false,
            excludeVideo: false,
            wnSwitchMode: "all",
            enableFilter: false,
            filterTags: [],
            imgNodeActions: [],
            minRatio: .5
        };
    }
    var CONF_VERSION = "4.4.0";
    var CONFIG_KEY = "ehvh_cfg_";
    function getStorageMethod() {
        if (typeof _GM_getValue === "function" && typeof _GM_setValue === "function") return {
            setItem: (key, value) => _GM_setValue(key, value),
            getItem: (key) => _GM_getValue(key)
        };
        else if (typeof localStorage !== "undefined") return {
            setItem: (key, value) => localStorage.setItem(key, value),
            getItem: (key) => localStorage.getItem(key)
        };
        else throw new Error("No supported storage method found");
    }
    var storage = getStorageMethod();
    function getConf() {
        const cfgStr = storage.getItem(CONFIG_KEY);
        if (cfgStr) {
            let cfg = JSON.parse(cfgStr);
            if (cfg.version === CONF_VERSION) return confHealthCheck(cfg);
        }
        const cfg = defaultConf();
        saveConf(cfg);
        return cfg;
    }
    function getSiteConfig(name) {
        const cfgStr = storage.getItem(getConfigKey(name));
        if (!cfgStr) return {};
        return JSON.parse(cfgStr);
    }
    function confHealthCheck(cf) {
        let changed = false;
        const defa = defaultConf();
        const defaKeys = Object.keys(defa);
        defaKeys.forEach((key) => {
            if (cf[key] === void 0) {
                cf[key] = defa[key];
                changed = true;
            }
        });
        const cfKeys = Object.keys(cf);
        for (const k of cfKeys) if (!defaKeys.includes(k)) {
            delete cf[k];
            changed = true;
        }
        [
            "pageHelperAbTop",
            "pageHelperAbLeft",
            "pageHelperAbBottom",
            "pageHelperAbRight"
        ].forEach((key) => {
            if (cf[key] !== "unset") {
                const pos = parseInt(cf[key]);
                const screenLimit = key.endsWith("Right") || key.endsWith("Left") ? window.screen.width : window.screen.height;
                if (isNaN(pos) || pos < 5 || pos > screenLimit) {
                    cf[key] = "5px";
                    changed = true;
                }
            }
        });
        if (![
            "pagination",
            "continuous",
            "horizontal"
        ].includes(cf.readMode)) {
            cf.readMode = "pagination";
            changed = true;
        }
        if (cf.imgScale === void 0 || isNaN(cf.imgScale) || cf.imgScale === 0) {
            cf.imgScale = cf.readMode === "continuous" ? cf.defaultImgScaleModeC : 100;
            changed = true;
        }
        if (cf.imgNodeActions && !(cf.imgNodeActions instanceof Array)) {
            cf.imgNodeActions = [];
            changed = true;
        }
        if (cf.filterTags && !(cf.filterTags instanceof Array)) {
            cf.filterTags = [];
            changed = true;
        }
        const newCf = patchConfig(cf);
        if (newCf) {
            cf = newCf;
            changed = true;
        }
        if (changed) {
            storage.setItem(getConfigKey(), "");
            saveConf(cf);
        }
        return cf;
    }
    function patchConfig(cf) {
        let changed = false;
        if (cf.configPatchVersion < 8) {
            cf.configPatchVersion = 8;
            cf.colCount = defaultColumns();
            cf.keyboards = {
                inBigImageMode: {},
                inFullViewGrid: {},
                inMain: {}
            };
            changed = true;
        }
        if (cf.configPatchVersion < 10) {
            cf.configPatchVersion = 10;
            cf.customStyle = "";
            changed = true;
        }
        return changed ? cf : null;
    }
    function resetConf(name) {
        const ok = confirm(`${i18n.resetConfig.get()}${name ? " On " + name : " On " + i18n.global.get()} ?`);
        if (ok) if (name) storage.setItem(getConfigKey(name), "");
        else {
            storage.setItem(getConfigKey(), "");
            saveConf(defaultConf());
        }
        return ok;
    }
    function saveConf(c, name) {
        const configKey = getConfigKey(name);
        const raw = storage.getItem(configKey);
        const config = raw ? JSON.parse(raw) : {};
        ["selectedSiteNameConfig"].forEach((key) => delete config[key]);
        if (name) ["keyboards", "siteProfiles"].forEach((key) => delete config[key]);
        storage.setItem(configKey, JSON.stringify({
            ...config,
            ...c
        }));
    }
    function getConfigKey(name) {
        if (name) return CONFIG_KEY + b64EncodeUnicode(name).replaceAll(/[+=\/]/g, "-");
        else return CONFIG_KEY;
    }
    var transient = {
        imgSrcCSP: false,
        originalPolicy: ""
    };
    var ConfigItems = [
        {
            key: "colCount",
            typ: "number"
        },
        {
            key: "rowHeight",
            typ: "number"
        },
        {
            key: "maxIdleThreads",
            typ: "number"
        },
        {
            key: "threads",
            typ: "number"
        },
        {
            key: "maxPreloadDistance",
            typ: "number"
        },
        {
            key: "downloadThreads",
            typ: "number"
        },
        {
            key: "paginationIMGCount",
            typ: "number"
        },
        {
            key: "timeout",
            typ: "number"
        },
        {
            key: "preventScrollPageTime",
            typ: "number"
        },
        {
            key: "autoPageSpeed",
            typ: "number"
        },
        {
            key: "scrollingDelta",
            typ: "number"
        },
        {
            key: "scrollingSpeed",
            typ: "number"
        },
        {
            key: "fetchOriginal",
            typ: "boolean",
            gridColumnRange: [1, 6]
        },
        {
            key: "autoLoad",
            typ: "boolean",
            gridColumnRange: [6, 11]
        },
        {
            key: "reversePages",
            typ: "boolean",
            gridColumnRange: [1, 6]
        },
        {
            key: "autoPlay",
            typ: "boolean",
            gridColumnRange: [6, 11]
        },
        {
            key: "autoLoadInBackground",
            typ: "boolean",
            gridColumnRange: [1, 6]
        },
        {
            key: "autoOpen",
            typ: "boolean",
            gridColumnRange: [6, 11]
        },
        {
            key: "magnifier",
            typ: "boolean",
            gridColumnRange: [1, 6]
        },
        {
            key: "autoEnterBig",
            typ: "boolean",
            gridColumnRange: [6, 11]
        },
        {
            key: "recordReadingProgress",
            typ: "boolean",
            gridColumnRange: [1, 11]
        },
        {
            key: "dragImageOut",
            typ: "boolean",
            gridColumnRange: [1, 6]
        },
        {
            key: "hdThumbnails",
            typ: "boolean",
            gridColumnRange: [6, 11]
        },
        {
            key: "smartScrolling",
            typ: "boolean",
            gridColumnRange: [1, 11]
        },
        {
            key: "autoCollapsePanel",
            typ: "boolean",
            gridColumnRange: [1, 11]
        },
        {
            key: "pixivRecordReading",
            typ: "boolean",
            gridColumnRange: [1, 11],
            displayInSite: /pixiv.net/
        },
        {
            key: "pixivAscendWorks",
            typ: "boolean",
            gridColumnRange: [1, 11],
            displayInSite: /pixiv.net/
        },
        {
            key: "pixivMirrorHost",
            typ: "input",
            gridColumnRange: [1, 11],
            placeholder: "https://i.pixiv.re",
            displayInSite: /pixiv.net/
        },
        {
            key: "ehentaiMirrorHost",
            typ: "input",
            gridColumnRange: [1, 11],
            placeholder: "https://e-hentai.org",
            displayInSite: /e[\-x]hentai.org/
        },
        {
            key: "reverseMultipleImagesPost",
            typ: "boolean",
            gridColumnRange: [1, 11],
            displayInSite: /(x.com|twitter.com)\//
        },
        {
            key: "excludeVideo",
            typ: "boolean",
            gridColumnRange: [1, 11],
            displayInSite: /(x.com|twitter.com|kemono.cr)\//
        },
        {
            key: "readMode",
            typ: "select",
            options: [
                {
                    value: "pagination",
                    display: "Pagination"
                },
                {
                    value: "continuous",
                    display: "Continuous"
                },
                {
                    value: "horizontal",
                    display: "Horizontal"
                }
            ]
        },
        {
            key: "gridMode",
            typ: "select",
            options: [{
                value: "grid",
                display: "Grid"
            }, {
                value: "flow",
                display: "Flow"
            }]
        },
        {
            key: "minifyPageHelper",
            typ: "select",
            options: [
                {
                    value: "always",
                    display: "Always"
                },
                {
                    value: "inBigMode",
                    display: "InBigMode"
                },
                {
                    value: "never",
                    display: "Never"
                }
            ]
        },
        {
            key: "hitomiFormat",
            typ: "select",
            options: [
                {
                    value: "auto",
                    display: "Auto"
                },
                {
                    value: "avif",
                    display: "Avif"
                },
                {
                    value: "webp",
                    display: "Webp"
                },
                {
                    value: "jxl",
                    display: "Jxl"
                }
            ],
            displayInSite: /hitomi.la\//
        },
        {
            key: "pixivUgoiraMode",
            typ: "select",
            options: [
                {
                    value: "ugoira",
                    display: "Ugoira"
                },
                {
                    value: "gif",
                    display: "GIF"
                },
                {
                    value: "mp4",
                    display: "MP4"
                }
            ],
            displayInSite: /pixiv.net/
        },
        {
            key: "ehentaiTitlePrefer",
            typ: "select",
            options: [{
                value: "english",
                display: "English"
            }, {
                value: "japanese",
                display: "Japanese"
            }],
            displayInSite: /e[-x]hentai(.*)?.(org|onion)\/|imhentai.xxx/
        },
        {
            key: "filenameOrder",
            typ: "select",
            options: [
                {
                    value: "auto",
                    display: "Auto"
                },
                {
                    value: "numbers",
                    display: "Numbers"
                },
                {
                    value: "original",
                    display: "Original"
                },
                {
                    value: "alphabetically",
                    display: "Alphabetically"
                }
            ]
        },
        {
            key: "wnSwitchMode",
            typ: "select",
            gridColumnRange: [1, 11],
            options: [
                {
                    value: "all",
                    display: "全部图片"
                },
                {
                    value: "pending",
                    display: "仅未加载图片"
                }
            ],
            displayInSite: /wn\d{2}\.(cc|ru|shop)|wnacg\.com/
        }
    ];
    var Adapter = class {
        ready;
        resolve;
        matchers;
        matcher;
        conf;
        globalConf;
        siteConf;
        constructor() {
            this.ready = new Promise((resolve, _reject) => this.resolve = resolve);
            this.matchers = [];
            this.globalConf = this.conf = getConf();
        }
        addSetup(setup) {
            this.matchers.push(setup);
            this.handleMatcher(setup);
        }
        handleMatcher(setup) {
            const siteConf = getSiteConfig(setup.name);
            let workURLs = siteConf.workURLs?.map((regex) => new RegExp(regex)) ?? [];
            if (workURLs.length === 0) workURLs = setup.workURLs;
            if (workURLs.find((regex) => regex.test(window.location.href))) {
                this.conf = {
                    ...this.conf,
                    ...siteConf
                };
                this.siteConf = siteConf;
                this.matcher = setup;
                this.resolve?.(setup);
                return true;
            } else return false;
        }
        reset() {
            this.ready = new Promise((resolve, _reject) => this.resolve = resolve);
            for (const setup of this.matchers) if (this.handleMatcher(setup)) break;
        }
    };
    var ADAPTER = new Adapter();
    function evLog(level, msg, ...info) {
        if (level === "debug" && !ADAPTER.conf.debug) return;
        if (level === "error") console.warn(new Date().toLocaleString(), "EHVP:" + msg, ...info);
        else console.info(new Date().toLocaleString(), "EHVP:" + msg, ...info);
    }
    var EventManager = class {
        events;
        constructor() {
            this.events = new Map();
        }
        emit(id, ...args) {
            if (!["imf-download-state-change", "imf-check-picked"].includes(id)) evLog("debug", "event bus emitted: ", id);
            const cbs = this.events.get(id);
            let ret;
            if (cbs) cbs.forEach((cb) => ret = cb(...args));
            return ret;
        }
        subscribe(id, cb) {
            const cbs = this.events.get(id);
            if (cbs) cbs.push(cb);
            else this.events.set(id, [cb]);
        }
        reset() {
            this.events = new Map();
        }
    };
    var EBUS = new EventManager();
    var Debouncer = class {
        tids;
        mode;
        lastExecTime;
        constructor(mode) {
            this.tids = {};
            this.lastExecTime = Date.now();
            this.mode = mode || "debounce";
        }
        addEvent(id, event, timeout) {
            if (this.mode === "throttle") {
                const now = Date.now();
                if (now - this.lastExecTime >= timeout) {
                    this.lastExecTime = now;
                    event();
                }
            } else if (this.mode === "debounce") {
                window.clearTimeout(this.tids[id]);
                this.tids[id] = window.setTimeout(event, timeout);
            }
        }
    };
    var PICA = new pica.default({ features: ["wasm"] });
    var PICA_OPTION = { filter: "box" };
    async function resizing(from, to) {
        return PICA.resize(from, to, PICA_OPTION).then();
    }
    var DEFAULT_THUMBNAIL = "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";
    var DEFAULT_NODE_TEMPLATE = document.createElement("div");
    DEFAULT_NODE_TEMPLATE.classList.add("img-node");
    DEFAULT_NODE_TEMPLATE.innerHTML = `
<a>
  <img decoding="async" loading="eager" title="untitle.jpg" src="" style="display: none;" />
  <canvas id="sample-canvas" width="100" height="100"></canvas>
</a>`;
    var OVERLAY_TIP = document.createElement("div");
    OVERLAY_TIP.classList.add("overlay-tip");
    OVERLAY_TIP.innerHTML = `<span>GIF</span>`;
    var EXTENSION_REGEXP = /\.(\w+)[^\/]*$|twimg.*format=(\w+)/;
    var NodeAction = class {
        icon;
        description;
        func;
        reueable = false;
        done = false;
        processing = false;
        constructor(icon, description, func, reueable) {
            this.icon = icon;
            this.description = description;
            this.func = func;
            this.reueable = reueable ?? false;
        }
    };
    var ImageNode = class {
        root;
        thumbnailSrc;
        href;
        title;
        onclick;
        imgElement;
        canvasElement;
        canvasCtx;
        delaySRC;
        _originSrc;
        blobSrc;
        mimeType;
        downloadBar;
        picked = true;
        debouncer = new Debouncer();
        rect;
        tags;
        actions = [];
        get originSrc() {
            return this._originSrc;
        }
        set originSrc(v) {
            this._originSrc = v;
            this.updateTagByExtension();
        }
        constructor(thumbnailSrc, href, title, delaySRC, originSrc, wh) {
            this.href = href;
            this.title = title;
            this.delaySRC = delaySRC;
            this.rect = wh;
            this.tags = new Set();
            this.thumbnailSrc = thumbnailSrc;
            this.originSrc = originSrc;
        }
        setTags(...tags) {
            tags.forEach((t) => this.tags.add(t));
        }
        updateTagByExtension() {
            let src = this.originSrc || this.thumbnailSrc;
            if (!src) return;
            const ext = src.match(EXTENSION_REGEXP)?.find((match, i) => i > 0 && match);
            if (ext) this.updateTagByPrefix("ext:" + ext);
        }
        updateTagByPrefix(tag) {
            if (this.tags.has(tag)) return;
            const prefix = tag.split(":").shift();
            if (!prefix) return;
            const found = Array.from(this.tags.entries()).find(([t]) => t.startsWith(prefix));
            if (found?.[0]) this.tags.delete(found?.[0]);
            this.tags.add(tag);
        }
        create() {
            this.root = DEFAULT_NODE_TEMPLATE.cloneNode(true);
            const anchor = this.root.firstElementChild;
            anchor.href = this._wnOrigUrl ? wnApplyImageLine(this._wnOrigUrl) : this.href;
            anchor.target = "_blank";
            this.imgElement = anchor.firstElementChild;
            this.canvasElement = anchor.lastElementChild;
            this.imgElement.setAttribute("title", this.title);
            this.canvasElement.id = "canvas-" + this.title.replaceAll(/[^\w]/g, "_");
            const ratio = Math.max(ADAPTER.conf.minRatio, this.ratio());
            this.root.style.aspectRatio = ratio.toString();
            this.root.setAttribute("data-ratio", ratio.toString());
            this.canvasElement.width = 512;
            this.canvasElement.height = Math.floor(512 / ratio);
            this.canvasCtx = this.canvasElement.getContext("2d");
            this.canvasCtx.fillStyle = "#aaa";
            this.canvasCtx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
            if (this.onclick) anchor.addEventListener("click", (event) => {
                event.preventDefault();
                this.onclick(event);
            }, {
                passive: false,
                capture: false
            });
            this.root.addEventListener("mouseenter", () => {
                if (this.actions.length === 0) return;
                this.root.addEventListener("mouseleave", () => {
                    if (!this.root.querySelector(".img-node-actions > .img-node-action-btn-processing")) this.root.querySelector(".img-node-actions")?.remove();
                });
                if (this.root.querySelector(".img-node-actions")) return;
                const actionContainer = document.createElement("div");
                actionContainer.classList.add("img-node-actions");
                for (const action of this.actions) {
                    const actionElem = document.createElement("button");
                    actionElem.classList.add("img-node-action-btn");
                    if (action.done) actionElem.classList.add("img-node-action-btn-done");
                    actionElem.textContent = action.icon;
                    actionElem.addEventListener("click", (ev) => {
                        const target = ev.target;
                        target.disabled = true;
                        target.classList.add("img-node-action-btn-processing");
                        action.processing = true;
                        action.func(this).then(() => {
                            target.classList.remove("img-node-action-btn-processing");
                            target.classList.add("img-node-action-btn-done");
                            target.disabled = false;
                            action.done = true;
                        }).catch((reason) => {
                            target.classList.remove("img-node-action-btn-processing");
                            target.classList.add("img-node-action-btn-error");
                            target.disabled = false;
                            EBUS.emit("notify-message", "error", `execute action [${action.icon}] failed, reason: ${reason}`);
                            console.error(reason);
                        }).finally(() => action.processing = false);
                    }, {
                        passive: false,
                        capture: true
                    });
                    actionContainer.appendChild(actionElem);
                }
                this.root.appendChild(actionContainer);
            });
            return this.root;
        }
        resize(onfailed, onResize) {
            if (!this.root || !this.imgElement || !this.canvasElement) return onfailed("undefined elements");
            if (!this.imgElement.src || this.imgElement.src === "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==") return onfailed("empty or default src");
            if (this.root.offsetWidth <= 1) return onfailed("element too small");
            this.imgElement.onload = null;
            this.imgElement.onerror = null;
            const oldRatio = Math.max(ADAPTER.conf.minRatio, this.ratio());
            this.rect = {
                w: this.imgElement.naturalWidth,
                h: this.imgElement.naturalHeight
            };
            const newRatio = Math.max(ADAPTER.conf.minRatio, this.ratio());
            if (Math.abs(newRatio - oldRatio) > .07) {
                this.root.style.aspectRatio = newRatio.toString();
                this.root.setAttribute("data-ratio", newRatio.toString());
                onResize();
            }
            // 画布内部分辨率必须等于画布实际显示尺寸（布局稳定后的 clientWidth/clientHeight），
            // 否则画布会被 CSS 拉伸放大：列数减少、格子变大时，若画布内部分辨率不随之增长，
            // 就会被拉伸到更大尺寸显示，缩略图变大却仍然模糊。
            // 在 aspectRatio 更新之后再读取，保证高度与格子的真实显示尺寸一致；列数变化后
            // clientWidth/clientHeight 变化 → 触发重采样 → 清晰。
            const targetWidth = Math.max(1, Math.floor(this.canvasElement.clientWidth || this.root.offsetWidth));
            const targetHeight = Math.max(1, Math.floor(this.canvasElement.clientHeight || this.root.offsetHeight));
            if (this.imgElement.src === this.imgElement.getAttribute("data-rendered") && this.canvasElement.width === targetWidth && this.canvasElement.height === targetHeight) return;
            this.canvasElement.width = targetWidth;
            this.canvasElement.height = targetHeight;
            const resized = (src) => {
                this.imgElement.src = "";
                this.imgElement.setAttribute("data-rendered", src);
            };
            const cropHeight = this.imgElement.naturalWidth / newRatio;
            const cropY = (this.imgElement.naturalHeight - cropHeight) / 2;
            if (this.imgElement.src === this.thumbnailSrc) {
                this.canvasCtx?.drawImage(this.imgElement, 0, cropY, this.imgElement.naturalWidth, cropHeight, 0, 0, this.canvasElement.width, this.canvasElement.height);
                resized(this.imgElement.src);
            } else {
                const re = (from) => {
                    resizing(from, this.canvasElement).then(() => window.setTimeout(() => resized(this.imgElement.src), 100)).catch(() => resized(this.canvasCtx?.drawImage(this.imgElement, 0, cropY, this.imgElement.naturalWidth, cropHeight, 0, 0, this.canvasElement.width, this.canvasElement.height) || ""));
                };
                if (this.ratio() < ADAPTER.conf.minRatio) createImageBitmap(this.imgElement, 0, cropY, this.imgElement.naturalWidth, cropHeight).then(re);
                else re(this.imgElement);
            }
        }
        ratio() {
            if (this.rect) return Math.floor(this.rect.w / this.rect.h * 1e3) / 1e3;
            return 1;
        }
        render(onfailed, onResize, force) {
            this.debouncer.addEvent("IMG-RENDER", () => {
                if (!this.imgElement) return onfailed("element undefined");
                let justThumbnail = !force && (!ADAPTER.conf.hdThumbnails || !this.blobSrc);
                if (this.mimeType === "image/gif" || this.mimeType?.startsWith("ugoira") || this.mimeType?.startsWith("video")) {
                    const tip = OVERLAY_TIP.cloneNode(true);
                    tip.firstChild.textContent = this.mimeType.split("/")[1].toUpperCase();
                    this.root?.appendChild(tip);
                    justThumbnail = true;
                }
                this.imgElement.onload = () => this.resize(onfailed, onResize);
                this.imgElement.onerror = () => onfailed("img load error");
                if (justThumbnail) {
                    const delaySRC = this.delaySRC;
                    this.delaySRC = void 0;
                    if (delaySRC) delaySRC.then((src) => (this.thumbnailSrc = src) && this.render(onfailed, onResize)).catch(onfailed);
                    else this.imgElement.src = this.thumbnailSrc || this.blobSrc || "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";
                } else this.imgElement.src = this.blobSrc || this.thumbnailSrc || "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";
            }, 30);
        }
        unrender() {
            if (!this.imgElement) return;
            this.imgElement.src = "";
        }
        progress(state) {
            if (!this.root) return;
            if (state.readyState === 4) {
                if (this.downloadBar && this.downloadBar.parentNode) this.downloadBar.parentNode.removeChild(this.downloadBar);
                return;
            }
            if (!this.downloadBar) {
                const downloadBar = document.createElement("div");
                downloadBar.classList.add("download-bar");
                downloadBar.innerHTML = `<div style="width: 0%"></div>`;
                this.downloadBar = downloadBar;
                this.root.firstElementChild.appendChild(this.downloadBar);
            }
            if (this.downloadBar) this.downloadBar.firstElementChild.style.width = state.loaded / state.total * 100 + "%";
        }
        changeStyle(fetchStatus, failedReason) {
            if (!this.root) return;
            const clearClass = () => this.root.classList.forEach((cls) => [
                "img-excluded",
                "img-fetching",
                "img-fetched",
                "img-fetch-failed"
            ].includes(cls) && this.root?.classList.remove(cls));
            if (!this.picked) {
                clearClass();
                this.root.classList.add("img-excluded");
            } else switch (fetchStatus) {
                case "fetching":
                    clearClass();
                    this.root.classList.add("img-fetching");
                    break;
                case "fetched":
                    clearClass();
                    this.root.classList.add("img-fetched");
                    break;
                case "failed":
                    clearClass();
                    this.root.classList.add("img-fetch-failed");
                    break;
                case "init":
                    clearClass();
                    break;
                default: break;
            }
            this.root.querySelector(".img-node-error-hint")?.remove();
            if (failedReason) {
                const errorHintElement = document.createElement("div");
                errorHintElement.classList.add("img-node-error-hint");
                errorHintElement.innerHTML = `<span>${failedReason}</span><br><span style="color: white;">You can click here retry again,<br>Or press mouse middle button to open origin image url</span>`;
                this.root.firstElementChild.appendChild(errorHintElement);
            }
        }
        equal(ele) {
            if (ele === this.root) return true;
            if (ele === this.root?.firstElementChild) return true;
            if (ele === this.canvasElement || ele === this.imgElement) return true;
            return false;
        }
    };
    var GM_XHR = _GM.xmlHttpRequest;
    function xhrWapper(url, respType, cb, headers, timeout) {
        if (GM_XHR === void 0) throw new Error("your userscript manager does not support Gm_xmlhttpRequest or GM.xmlhttpRequest api");
        return GM_XHR({
            method: "GET",
            url,
            timeout: timeout || 6e5,
            responseType: respType,
            nocache: false,
            revalidate: false,
            headers: {
                "Referer": window.location.href,
                "Cache-Control": "public, max-age=2592000, immutable",
                ...headers
            },
            ...cb
        })?.abort;
    }
    function simpleFetch(url, respType, headers) {
        return new Promise((resolve, reject) => {
            try {
                xhrWapper(url, respType, {
                    onload: (response) => resolve(response.response),
                    onerror: (error) => reject(error)
                }, headers ?? {}, 10 * 1e3);
            } catch (error) {
                reject(error);
            }
        });
    }
    async function batchFetch(requests, concurrency, respType = "text") {
        const results = new Array(requests.length);
        let i = 0;
        while (i < requests.length) {
            const batchPromises = requests.slice(i, i + concurrency).map((request, index) => window.fetch(request).then((resp) => {
                if (resp.ok) try {
                    switch (respType) {
                        case "text": return resp.text();
                        case "json": return resp.json();
                        case "arraybuffer": return resp.arrayBuffer();
                    }
                } catch (error) {
                    throw new Error(`failed to fetch ${request}: ${resp.status} ${error}`);
                }
                throw new Error(`failed to fetch ${request}: ${resp.status} ${resp.statusText}`);
            }).then((raw) => results[index + i] = raw).catch((reason) => results[index + i] = new Error(reason)));
            await Promise.all(batchPromises);
            i += concurrency;
        }
        return results;
    }
    var Result = class {
        value;
        error;
        static ok(value) {
            return { value };
        }
        static err(error) {
            return { error };
        }
    };
    var SubData = class {
        directory;
        list;
        extra;
        constructor(directory, list, extra) {
            this.directory = directory;
            this.list = list;
            this.extra = extra;
        }
        get byteLength() {
            return this.list.map((sd) => sd.data.byteLength).reduce((prev, curr) => prev + curr, 0);
        }
    };
    var BaseMatcher = class {
        async *fetchChapters() {
            return [new Chapter(0, "Default", window.location.href)];
        }
        async fetchImageData(imf) {
            if (imf.node.originSrc?.startsWith("blob:")) return await fetch(imf.node.originSrc).then((resp) => resp.blob().then((b) => [b, 200]));
            return new Promise(async (resolve, reject) => {
                const debouncer = new Debouncer();
                const timeout = () => {
                    debouncer.addEvent("XHR_TIMEOUT", () => {
                        imf.abort();
                        reject(new Error("timeout"));
                    }, ADAPTER.conf.timeout * 1e3);
                };
                try {
                    imf.abortSignal = xhrWapper(imf.node.originSrc, "blob", {
                        onload: function (response) {
                            const data = response.response;
                            try {
                                imf.setDownloadState({ readyState: response.readyState });
                            } catch (error) {
                                evLog("error", "warn: fetch big image data onload setDownloadState error:", error);
                            }
                            imf.abortSignal = void 0;
                            resolve([data, response.status]);
                        },
                        onerror: function (response) {
                            imf.abortSignal = void 0;
                            if (response.status === 0) {
                                const domain = response.error.match(/(https?:\/\/.*?)\/.*/)?.[1] ?? "";
                                reject(new Error(i18n.failFetchReason1.get().replace("{{domain}}", domain)));
                            } else reject(new Error(`response status:${response.status}, error:${response.error}, response:${response.response}`));
                        },
                        onprogress: function (response) {
                            imf.setDownloadState({
                                total: response.total,
                                loaded: response.loaded,
                                readyState: response.readyState
                            });
                            timeout();
                        },
                        onloadstart: function () {
                            imf.setDownloadState(imf.downloadState);
                        }
                    }, imf.matcher.headers(imf.node));
                    timeout();
                } catch (error) {
                    reject(error);
                }
            });
        }
        title(chapter) {
            const meta = this.galleryMeta(chapter[0]);
            return meta.originTitle || meta.title || "unknown";
        }
        galleryMeta(_chapter) {
            return new GalleryMeta(window.location.href, document.title || "unknown");
        }
        async processData(data, contentType, _node) {
            return [data, contentType];
        }
        headers(_node) {
            return {};
        }
        appendNewChapters(_url, _old) {
            throw new Error("this site does not support add new chapters yet");
        }
    };
    var FetchState = function (FetchState) {
        FetchState[FetchState["FAILED"] = 0] = "FAILED";
        FetchState[FetchState["URL"] = 1] = "URL";
        FetchState[FetchState["DATA"] = 2] = "DATA";
        FetchState[FetchState["DONE"] = 3] = "DONE";
        return FetchState;
    }({});
    var IMGFetcher = class {
        index;
        node;
        stage = 1;
        tryTimes = 0;
        lock = false;
        rendered = false;
        data;
        contentType;
        downloadState;
        timeoutId;
        matcher;
        chapterIndex;
        chapterID;
        randomID;
        failedReason;
        abortSignal = void 0;
        constructor(index, root, matcher, chapterIndex, chapterID) {
            this.index = index;
            this.node = root;
            this.node.onclick = (event) => {
                if (event.ctrlKey || event.metaKey) EBUS.emit("add-cherry-pick-range", this.chapterIndex, this.index, true, event.shiftKey);
                else if (event.altKey) EBUS.emit("add-cherry-pick-range", this.chapterIndex, this.index, false, event.shiftKey);
                else EBUS.emit("imf-on-click", this);
            };
            this.downloadState = {
                total: 100,
                loaded: 0,
                readyState: 0
            };
            this.matcher = matcher;
            this.chapterIndex = chapterIndex;
            this.chapterID = chapterID;
            this.randomID = chapterIndex + Math.random().toString(16).slice(2) + this.node.href;
        }
        create() {
            const element = this.node.create();
            const noEle = document.createElement("div");
            noEle.classList.add("img-node-numtip");
            noEle.innerHTML = `<span>${this.index + 1}</span>`;
            element.firstElementChild.appendChild(noEle);
            return element;
        }
        setDownloadState(newState) {
            this.downloadState = {
                ...this.downloadState,
                ...newState
            };
            this.node.progress(this.downloadState);
            EBUS.emit("imf-download-state-change", this);
        }
        async start() {
            if (this.lock) return;
            this.lock = true;
            try {
                this.node.changeStyle("fetching");
                await this.fetchImage();
                this.node.changeStyle("fetched");
                EBUS.emit("imf-on-finished", this.index, true, this);
                this.failedReason = void 0;
            } catch (error) {
                this.failedReason = error.toString();
                this.node.changeStyle("failed", this.failedReason);
                evLog("error", `IMG-FETCHER ERROR:`, error);
                this.stage = 0;
                EBUS.emit("imf-on-finished", this.index, false, this);
            } finally {
                this.lock = false;
            }
        }
        resetStage() {
            this.node.changeStyle("init");
            this.stage = 1;
        }
        async fetchImage() {
            const fetchMachine = async () => {
                try {
                    switch (this.stage) {
                        case 0:
                        case 1:
                            const meta = await this.fetchOriginMeta();
                            this.node.originSrc = meta.url;
                            this.node.updateTagByExtension();
                            if (meta.title) {
                                this.node.title = meta.title;
                                if (this.node.imgElement) this.node.imgElement.title = meta.title;
                            }
                            this.node.href = meta.href || this.node.href;
                            this.stage = 2;
                            return fetchMachine();
                        case 2:
                            [this.data, this.contentType] = await this.fetchImageData();
                            [this.data, this.contentType] = await this.matcher.processData(this.data, this.contentType, this.node);
                            this.node.updateTagByPrefix("mime:" + (this.contentType ?? "unknown"));
                            if (this.contentType.startsWith("text") && !(this.data instanceof SubData)) {
                                evLog("error", "unexpect content:\n", new TextDecoder().decode(this.data.buffer));
                                throw new Error(`expect image data, fetched wrong type: ${this.contentType}, the content is showing up in console(F12 open it).`);
                            }
                            if (!(this.data instanceof SubData)) this.node.blobSrc = transient.imgSrcCSP ? this.node.originSrc : URL.createObjectURL(new Blob([this.data], { type: this.contentType }));
                            this.node.mimeType = this.contentType;
                            this.node.render((reason) => {
                                evLog("error", "render image failed, " + reason);
                                this.rendered = false;
                            }, () => EBUS.emit("imf-resize", this));
                            this.stage = 3;
                        case 3: return null;
                    }
                } catch (error) {
                    this.stage = 0;
                    return error;
                }
            };
            this.tryTimes = 0;
            let err;
            while (this.tryTimes < 3) {
                err = await fetchMachine();
                if (err === null) return;
                this.tryTimes++;
                evLog("error", `fetch image error, try times: ${this.tryTimes}, error:`, err);
            }
            throw err;
        }
        async fetchOriginMeta() {
            return await this.matcher.fetchOriginMeta(this.node, this.tryTimes > 0 || this.stage === 0, this.chapterID);
        }
        async fetchImageData() {
            const data = await this.matcher.fetchImageData(this);
            if (data == null) throw new Error(`fetch image data is empty, image url:${this.node.originSrc}`);
            return [new Uint8Array(await data[0].arrayBuffer()), data[0].type];
        }
        render(force) {
            const picked = EBUS.emit("imf-check-picked", this.chapterIndex, this.index) ?? this.node.picked;
            const shouldChangeStyle = picked !== this.node.picked;
            this.node.picked = picked;
            if (force) this.rendered = false;
            if (!this.rendered) {
                this.rendered = true;
                this.node.render((reason) => {
                    evLog("error", "render image failed, " + reason);
                    this.rendered = false;
                }, () => EBUS.emit("imf-resize", this), force);
                this.node.changeStyle(this.stage === 3 ? "fetched" : void 0, this.failedReason);
            } else if (shouldChangeStyle) {
                let status;
                switch (this.stage) {
                    case 0:
                        status = "failed";
                        break;
                    case 1:
                        status = "init";
                        break;
                    case 2:
                        status = "fetching";
                        break;
                    case 3:
                        status = "fetched";
                        break;
                }
                this.node.changeStyle(status, this.failedReason);
            }
        }
        isRender() {
            return this.rendered;
        }
        unrender() {
            if (!this.rendered) return;
            this.rendered = false;
            this.node.unrender();
            this.node.changeStyle("init");
        }
        ratio() {
            return this.node.ratio();
        }
        abort() {
            this.abortSignal?.();
            this.abortSignal = void 0;
        }
    };
    var Chapter = class {
        id;
        title;
        source;
        queue;
        filteredQueue;
        thumbimg;
        sourceIter;
        done;
        onclick;
        meta;
        constructor(id, title, source, thumbimg) {
            this.id = id;
            this.title = title;
            this.source = source;
            this.queue = [];
            this.thumbimg = thumbimg;
            this.filteredQueue = [];
        }
    };
    var PageFetcher = class {
        chapters = [];
        chapterIndex = 0;
        queue;
        matcher;
        filter;
        beforeInit;
        afterInit;
        nodeActionDesc = [];
        appendPagePromise;
        abortb = false;
        constructor(queue, matcher, filter) {
            this.queue = queue;
            this.matcher = matcher;
            this.filter = filter;
            this.filter.onChange = () => this.changeToChapter(this.chapterIndex);
            const debouncer = new Debouncer();
            EBUS.subscribe("ifq-on-finished-report", (index) => debouncer.addEvent("APPEND-NEXT-PAGES", () => this.appendPages(index), 5));
            EBUS.subscribe("imf-on-finished", (index, success, imf) => {
                if (index === 0 && success) this.chapters[imf.chapterIndex].thumbimg = imf.node.blobSrc;
            });
            EBUS.subscribe("pf-try-extend", () => debouncer.addEvent("APPEND-NEXT-PAGES", () => !this.queue.downloading?.() && this.appendNextPage(), 5));
            EBUS.subscribe("pf-retry-extend", () => !this.queue.downloading?.() && this.appendNextPage(true));
            EBUS.subscribe("pf-load-until", (chapterIndex, index, displayIndex) => this.loadUntil(chapterIndex, index, displayIndex));
            EBUS.subscribe("pf-init", (cb) => this.init().then(cb));
            EBUS.subscribe("pf-append-chapters", (url) => this.appendNewChapters(url).then(() => this.chapters));
            EBUS.subscribe("pf-step-chapters", (oriented) => {
                if (oriented === "prev") {
                    const newChapterIndex = this.chapterIndex - 1;
                    if (newChapterIndex < 0) return;
                    this.changeToChapter(newChapterIndex);
                    EBUS.emit("notify-message", "info", "switch to chapter: " + this.chapters[newChapterIndex].title, 2e3);
                } else if (oriented === "next") {
                    const newChapterIndex = this.chapterIndex + 1;
                    if (newChapterIndex >= this.chapters.length) return;
                    this.changeToChapter(newChapterIndex);
                    EBUS.emit("notify-message", "info", "switch to chapter: " + this.chapters[newChapterIndex].title, 2e3);
                }
            });
            EBUS.subscribe("filter-update-all-tags", async () => {
                const chapter = this.chapters[this.chapterIndex];
                const set = new Set();
                chapter.filteredQueue.forEach((imf) => imf.node.tags.forEach((t) => set.add(t.toString())));
                this.filter.allTags = set;
            });
        }
        appendToView(total, nodes, chapterIndex, done) {
            EBUS.emit("pf-on-appended", total, nodes, chapterIndex, done);
        }
        abort() {
            this.abortb = true;
        }
        appendNewChapters_(chapters, first) {
            chapters.forEach((c) => {
                c.sourceIter = this.matcher.fetchPagesSource(c);
                c.onclick = (index) => this.changeToChapter(index);
            });
            this.chapters.push(...chapters);
            EBUS.emit("pf-update-chapters", this.chapters, !first);
        }
        async appendNewChapters(url) {
            try {
                const chapters = await this.matcher.appendNewChapters(url, this.chapters);
                if (chapters && chapters.length > 0) this.appendNewChapters_(chapters, false);
            } catch (error) {
                EBUS.emit("notify-message", "error", `${error}`);
            }
        }
        async init() {
            this.beforeInit?.();
            try {
                if (ADAPTER.conf.imgNodeActions.length > 0) {
                    const AsyncFunction = async function () { }.constructor;
                    this.nodeActionDesc = ADAPTER.conf.imgNodeActions.filter((a) => {
                        if (!a.workon) return true;
                        return new RegExp(a.workon).test(window.location.href);
                    }).map((ina) => {
                        return {
                            icon: ina.icon,
                            description: ina.description,
                            fun: AsyncFunction("imf", "imn", "gm_xhr", "EBUS", ina.funcBody)
                        };
                    });
                }
            } catch (err) {
                console.error(err);
                EBUS.emit("notify-message", "error", "cannot create your node actions, " + err);
            }
            const chaptersIter = this.matcher.fetchChapters();
            let first = true;
            while (true) try {
                const chapters = await chaptersIter.next();
                if (chapters.value) {
                    this.appendNewChapters_(chapters.value, first);
                    if (first) {
                        if (this.chapters.length === 1) this.changeToChapter(0);
                        first = false;
                    }
                }
                if (chapters.done) break;
            } catch (error) {
                EBUS.emit("notify-message", "error", error + "");
            }
        }
        changeToChapter(index) {
            this.chapterIndex = index;
            EBUS.emit("pf-change-chapter", index, this.chapters[index]);
            const chapter = this.chapters[index];
            chapter.filteredQueue = [...this.filter.filterNodes(chapter.queue, true)];
            chapter.filteredQueue.forEach((node, i) => node.index = i);
            if (chapter.filteredQueue.length > 0) this.appendToView(chapter.filteredQueue.length, chapter.filteredQueue, index, this.chapters[index].done);
            if (!this.queue.downloading?.()) {
                this.beforeInit?.();
                this.restoreChapter(index).catch(this.onFailed).finally(this.afterInit);
            }
        }
        async restoreChapter(index) {
            this.chapterIndex = index;
            const chapter = this.chapters[this.chapterIndex];
            this.queue.restore(index, chapter.filteredQueue);
            if (!chapter.sourceIter) {
                evLog("error", "chapter sourceIter is not set!");
                return;
            }
            if (chapter.queue.length === 0) {
                await this.appendNextPage();
                this.appendPages(this.queue.length);
            }
        }
        async appendPages(appendedCount) {
            while (true) {
                if (appendedCount + 60 < this.queue.length) break;
                if (!await this.appendNextPage()) break;
            }
        }
        async loadUntil(chapterIndex, index, displayIndex = index) {
            if (chapterIndex !== this.chapterIndex || this.queue.downloading?.()) return;
            const chapter = this.chapters[chapterIndex];
            let lastNotifiedAt = Date.now();
            EBUS.emit("notify-message", "info", `Looking for saved page ${displayIndex + 1}...`, 2e3);
            while (!chapter.done && chapter.filteredQueue.length <= index) {
                if (chapterIndex !== this.chapterIndex || this.abortb) break;
                if (Date.now() - lastNotifiedAt > 3e3) {
                    lastNotifiedAt = Date.now();
                    EBUS.emit("notify-message", "info", `Loaded ${chapter.filteredQueue.length} pages while looking for saved page ${displayIndex + 1}...`, 2e3);
                }
                if (!await this.appendNextPage()) break;
            }
        }
        async appendNextPage(force) {
            if (this.appendPagePromise) return this.appendPagePromise;
            this.appendPagePromise = this.appendNextPageLocked(force).finally(() => {
                this.appendPagePromise = void 0;
            });
            return this.appendPagePromise;
        }
        async appendNextPageLocked(force) {
            try {
                const chapterIndex = this.chapterIndex;
                const chapter = this.chapters[chapterIndex];
                if (force) chapter.done = false;
                if (chapter.done || this.abortb) return false;
                const next = await chapter.sourceIter.next();
                if (next.value?.error) {
                    chapter.done = true;
                    throw next.value.error;
                }
                if (next.value?.value) return await this.appendImages(next.value.value, chapterIndex);
                if (next.done) {
                    chapter.done = true;
                    if (next.value?.value) return await this.appendImages(next.value.value, chapterIndex);
                    else {
                        this.appendToView(this.queue.length, [], chapterIndex, true);
                        return false;
                    }
                } else return false;
            } catch (error) {
                evLog("error", "PageFetcher:appendNextPage error: ", error);
                this.onFailed?.(error);
                return false;
            }
        }
        async appendImages(pageSource, chapterIndex) {
            try {
                const nodes = await this.obtainImageNodeList(pageSource, chapterIndex);
                if (this.abortb) return false;
                if (nodes.length === 0) return false;
                const chapter = this.chapters[chapterIndex];
                const len = chapter.filteredQueue.length;
                const IFs = nodes.map((imgNode, index) => {
                    const imf = new IMGFetcher(index + len, imgNode, this.matcher, chapterIndex, this.chapters[chapterIndex].id);
                    this.nodeActionDesc.forEach((nad) => {
                        const f = async (node) => {
                            const result = await nad.fun(imf, node, GM_XHR, EBUS);
                            if (result?.data) {
                                imf.contentType = result.data.type;
                                imf.data = new Uint8Array(await result.data.arrayBuffer());
                                imf.node.blobSrc = URL.createObjectURL(new Blob([imf.data], { type: imf.contentType }));
                                imf.render(true);
                                EBUS.emit("imf-on-finished", imf.index, true, imf);
                            }
                        };
                        imgNode.actions.push(new NodeAction(nad.icon, nad.description, f));
                    });
                    return imf;
                });
                chapter.queue.push(...IFs);
                const filteredIFs = this.filter.filterNodes(IFs, false);
                filteredIFs.forEach((node, i) => node.index = len + i);
                chapter.filteredQueue.push(...filteredIFs);
                this.queue.push(...filteredIFs);
                this.appendToView(this.queue.length, filteredIFs, chapterIndex);
                return true;
            } catch (error) {
                evLog("error", `page fetcher append images error: `, error);
                this.onFailed?.(error);
                return false;
            }
        }
        async obtainImageNodeList(pageSource, chapterIndex) {
            let tryTimes = 0;
            let err;
            while (tryTimes < 3) try {
                return await this.matcher.parseImgNodes(pageSource, this.chapters[chapterIndex].id);
            } catch (error) {
                evLog("error", "warn: parse image nodes failed, retrying: ", error);
                tryTimes++;
                err = error;
            }
            evLog("error", "warn: parse image nodes failed: reached max try times!");
            throw err;
        }
        onFailed(reason) {
            EBUS.emit("notify-message", "error", reason.toString());
        }
    };
    var wnacg_exports = __exportAll({});
    // ===== WNACG 图片线路（换源） v4.16.0 =====
    var WN_LINE_OPTS = ["默认", "高速1", "高速2"];
    var WN_LINE_TARGET = ["", "img5.wnimg1.ru", "img5.qy0.ru"];
    var wnImageLine = parseInt((typeof _GM_getValue === "function" ? _GM_getValue("wnacg_image_line", "0") : "0") ?? "0", 10);
    if (!(wnImageLine >= 0 && wnImageLine < WN_LINE_OPTS.length)) wnImageLine = 0;
    function wnApplyImageLine(url) {
        if (!url || !wnImageLine) return url;
        var target = WN_LINE_TARGET[wnImageLine];
        if (!target) return url;
        // 任意 imgN.wnimg2.cfd 统一替换为目标线路域名，协议与路径/参数原样保留
        return url.replace(/(https?:\/\/|\/\/)img\d+\.wnimg2\.cfd(?=\/)/, function (m, p1) {
            return p1 + target;
        });
    }
    var WnacgMatcher = class extends BaseMatcher {
        meta;
        baseURL;
        galleryURL;
        async *fetchPagesSource() {
            const id = this.extractIDFromHref(window.location.href);
            if (!id) throw new Error("Cannot find gallery ID");
            this.baseURL = `${window.location.origin}/photos-index-page-1-aid-${id}.html`;
            this.galleryURL = `${window.location.origin}/photos-gallery-aid-${id}.html`;
            console.log('this.galleryURL ' + this.galleryURL);
            let doc = await window.fetch(this.baseURL).then((res) => res.text()).then((text) => new DOMParser().parseFromString(text, "text/html"));
            this.meta = this.pasrseGalleryMeta(doc);
            let galleryImageList = await this.requestGalleryImages(this.galleryURL);
            yield Result.ok(galleryImageList);
        }
        async parseImgNodes(list) {
            const result = [];
            for (let index = 0; index < list.length; index++) {
                const img = list[index];
                let imgNode = new ImageNode("", img.url, img.caption, void 0, img.url);
                imgNode._wnOrigUrl = img.url; // 记住原始图床地址，换源时始终以此为准
                result.push(imgNode);
            }
            return result;
        }
        async fetchOriginMeta(node) {
            const origUrl = node._wnOrigUrl || node.originSrc || node.thumbnailSrc;
            const url = wnApplyImageLine(origUrl);
            console.log("[WNACG] 实际请求下载: " + url);
            const ext = url.includes(".") ? url.split(".").pop() : "jpg";
            return {
                url,
                title: node.title.replace("[", "").replace("]", "") + "." + ext
            };
        }
        galleryMeta(chapter) {
            return this.meta || super.galleryMeta(chapter);
        }
        extractIDFromHref(href) {
            const match = href.match(/-(\d+).html$/);
            if (!match) return void 0;
            return match[1];
        }
        pasrseGalleryMeta(doc) {
            const title = doc.querySelector("#bodywrap > h2")?.textContent || "unknown";
            const meta = new GalleryMeta(this.baseURL || window.location.href, title);
            meta.tags = {
                "tags": Array.from(doc.querySelectorAll(".asTB .tagshow")).map((ele) => ele.textContent).filter(Boolean),
                "description": Array.from(doc.querySelector(".asTB > .asTBcell.uwconn > p")?.childNodes || []).map((e) => e.textContent).filter(Boolean)
            };
            return meta;
        }
        async requestGalleryImages(galleryURL) {
            const text = await window.fetch(galleryURL).then((res) => res.text());
            let js = "";
            for (let line of text.split("\n")) {
                line = line.replace("document.writeln(\"", "");
                line = line.replace("\");", "");
                if (line.includes("var imglist")) {
                    line = line.replace("var imglist = ", "");
                    line = line.replaceAll("fast_img_host+\\", "");
                    line = line.replaceAll("\\", "");
                    js += line;
                }
            }
            const list = this.extractUrlsAndCaptions(js);
            console.log("[WNACG] img list 原始网址（共 " + list.length + " 张）", list);
            return list;
        }
        extractUrlsAndCaptions(inputStr) {
            const regex = /url:\s*"(.*?)",\s*caption:\s*"(.*?)"/gs;
            let match;
            const results = [];
            while ((match = regex.exec(inputStr)) !== null) results.push({
                url: match[1],
                caption: match[2]
            });
            if (results.length > 0) {
                if (results[results.length - 1].caption.includes("加入收藏")) results.pop();
            }
            console.log('results ' + results);
            return results;
        }
    };
    ADAPTER.addSetup({
        name: "绅士漫画",
        workURLs: [/(wnacg.com|wn\d{2}.(cc|ru|shop))\/photos-index/],
        match: ["https://www.wnacg.com/*"],
        constructor: () => new WnacgMatcher()
    });
    var Crc32 = class {
        crc = -1;
        table = this.makeTable();
        makeTable() {
            let i;
            let j;
            let t;
            const table = [];
            for (i = 0; i < 256; i++) {
                t = i;
                for (j = 0; j < 8; j++) t = t & 1 ? t >>> 1 ^ 3988292384 : t >>> 1;
                table[i] = t;
            }
            return table;
        }
        append(data) {
            let crc = this.crc | 0;
            const table = this.table;
            for (let offset = 0, len = data.length | 0; offset < len; offset++) crc = crc >>> 8 ^ table[(crc ^ data[offset]) & 255];
            this.crc = crc;
        }
        get() {
            return ~this.crc;
        }
    };
    var ZipObject = class {
        level;
        nameBuf;
        comment;
        header;
        offset;
        directory;
        file;
        crc;
        compressedLength;
        uncompressedLength;
        volumeNo;
        unixPermissions;
        constructor(file, volumeNo) {
            this.level = 0;
            const encoder = new TextEncoder();
            this.nameBuf = encoder.encode(file.name.trim());
            this.comment = encoder.encode("");
            this.header = new DataHelper(26);
            this.offset = 0;
            this.directory = false;
            this.file = file;
            this.crc = new Crc32();
            this.compressedLength = 0;
            this.uncompressedLength = 0;
            this.volumeNo = volumeNo;
            if (file.unixPermissions) {
                const perms = parseInt(file.unixPermissions, 8);
                this.unixPermissions = (32768 | perms) << 16;
            }
        }
    };
    var DataHelper = class {
        array;
        view;
        constructor(byteLength) {
            const uint8 = new Uint8Array(byteLength);
            this.array = uint8;
            this.view = new DataView(uint8.buffer);
        }
    };
    var Zip = class {
        volumeSize = 1610612736;
        accumulatedSize = 0;
        volumes = 1;
        currVolumeNo = -1;
        files = [];
        currIndex = -1;
        offset = 0;
        offsetInVolume = 0;
        curr;
        date;
        writer;
        close = false;
        constructor(settings) {
            if (settings?.volumeSize) this.volumeSize = settings.volumeSize;
            this.date = new Date(Date.now());
            this.writer = async () => { };
        }
        setWriter(writer) {
            this.writer = writer;
        }
        add(file) {
            const fileSize = file.size();
            this.accumulatedSize += fileSize;
            if (this.accumulatedSize > this.volumeSize) {
                this.volumes++;
                this.accumulatedSize = fileSize;
            }
            this.files.push(new ZipObject(file, this.volumes - 1));
        }
        async next() {
            this.currIndex++;
            this.curr = this.files[this.currIndex];
            if (this.curr) {
                if (this.curr.volumeNo > this.currVolumeNo) {
                    this.currIndex--;
                    this.offsetInVolume = 0;
                    return true;
                }
                this.curr.offset = this.offsetInVolume;
                await this.writeHeader();
                await this.writeContent();
                await this.writeFooter();
                this.offset += this.offsetInVolume - this.curr.offset;
            } else if (!this.close) {
                this.close = true;
                await this.closeZip();
            } else return true;
            return false;
        }
        async writeHeader() {
            if (!this.curr) return;
            const curr = this.curr;
            const data = new DataHelper(30 + curr.nameBuf.length);
            const header = curr.header;
            if (curr.level !== 0 && !curr.directory) header.view.setUint16(4, 2048);
            header.view.setUint32(0, 335546376);
            header.view.setUint16(6, (this.date.getHours() << 6 | this.date.getMinutes()) << 5 | this.date.getSeconds() / 2, true);
            header.view.setUint16(8, (this.date.getFullYear() - 1980 << 4 | this.date.getMonth() + 1) << 5 | this.date.getDate(), true);
            header.view.setUint16(22, curr.nameBuf.length, true);
            data.view.setUint32(0, 1347093252);
            data.array.set(header.array, 4);
            data.array.set(curr.nameBuf, 30);
            this.offsetInVolume += data.array.length;
            await this.writer(data.array);
        }
        async writeContent() {
            const curr = this.curr;
            const reader = (await curr.file.stream()).getReader();
            const writer = this.writer;
            async function pump() {
                const chunk = await reader.read();
                if (chunk.done) return;
                const data = chunk.value;
                curr.crc.append(data);
                curr.uncompressedLength += data.length;
                curr.compressedLength += data.length;
                writer(data);
                return await pump();
            }
            await pump();
        }
        async writeFooter() {
            if (!this.curr) return;
            const curr = this.curr;
            const footer = new DataHelper(16);
            footer.view.setUint32(0, 1347094280);
            if (curr.crc) {
                curr.header.view.setUint32(10, curr.crc.get(), true);
                curr.header.view.setUint32(14, curr.compressedLength, true);
                curr.header.view.setUint32(18, curr.uncompressedLength, true);
                footer.view.setUint32(4, curr.crc.get(), true);
                footer.view.setUint32(8, curr.compressedLength, true);
                footer.view.setUint32(12, curr.uncompressedLength, true);
            }
            await this.writer(footer.array);
            this.offsetInVolume += curr.compressedLength + 16;
            if (curr.compressedLength !== curr.file.size()) evLog("error", "WRAN: read length:", curr.compressedLength, " origin size:", curr.file.size(), ", title: ", curr.file.name);
        }
        async closeZip() {
            const fileCount = this.files.length;
            let centralDirLength = 0;
            let idx = 0;
            for (idx = 0; idx < fileCount; idx++) {
                const file = this.files[idx];
                centralDirLength += 46 + file.nameBuf.length + file.comment.length;
            }
            const data = new DataHelper(centralDirLength + 22);
            let dataOffset = 0;
            for (idx = 0; idx < fileCount; idx++) {
                const file = this.files[idx];
                data.view.setUint32(dataOffset, 1347092738);
                data.view.setUint16(dataOffset + 4, 788, true);
                data.array.set(file.header.array, dataOffset + 6);
                data.view.setUint16(dataOffset + 32, file.comment.length, true);
                data.view.setUint16(dataOffset + 34, file.volumeNo, true);
                const internalAttributes = file.directory ? 16 : 0;
                data.view.setUint16(dataOffset + 36, internalAttributes, true);
                data.view.setUint32(dataOffset + 38, file.unixPermissions || 0, true);
                data.view.setUint32(dataOffset + 42, file.offset, true);
                data.array.set(file.nameBuf, dataOffset + 46);
                data.array.set(file.comment, dataOffset + 46 + file.nameBuf.length);
                dataOffset += 46 + file.nameBuf.length + file.comment.length;
            }
            data.view.setUint32(dataOffset, 1347093766);
            data.view.setUint16(dataOffset + 4, this.currVolumeNo, true);
            data.view.setUint16(dataOffset + 6, this.currVolumeNo, true);
            data.view.setUint16(dataOffset + 8, fileCount, true);
            data.view.setUint16(dataOffset + 10, fileCount, true);
            data.view.setUint32(dataOffset + 12, centralDirLength, true);
            data.view.setUint32(dataOffset + 16, this.offsetInVolume, true);
            await this.writer(data.array);
        }
        nextReadableStream() {
            this.currVolumeNo++;
            if (this.currVolumeNo >= this.volumes) return;
            const zip = this;
            return new ReadableStream({
                start(controller) {
                    zip.setWriter(async (chunk) => controller.enqueue(chunk));
                },
                async pull(controller) {
                    await zip.next().then((done) => done && controller.close());
                }
            });
        }
    };
    var DownloaderCanvas = class {
        canvas;
        mousemoveState;
        ctx;
        queue;
        rectSize;
        rectGap;
        columns;
        padding;
        scrollTop;
        scrollSize;
        debouncer;
        onClick;
        cherryPick;
        constructor(canvas, queue, cherryPick) {
            this.queue = queue;
            this.cherryPick = cherryPick;
            if (!canvas) throw new Error("canvas not found");
            this.canvas = canvas;
            this.canvas.addEventListener("wheel", (event) => this.onwheel(event.deltaY));
            this.mousemoveState = {
                x: 0,
                y: 0
            };
            this.canvas.addEventListener("mousemove", (event) => {
                this.mousemoveState = {
                    x: event.offsetX,
                    y: event.offsetY
                };
                this.drawDebouce();
            });
            this.canvas.addEventListener("click", (event) => {
                this.mousemoveState = {
                    x: event.offsetX,
                    y: event.offsetY
                };
                const index = this.computeDrawList()?.find((state) => state.selected)?.index;
                if (index !== void 0) EBUS.emit("downloader-canvas-on-click", index);
            });
            this.ctx = this.canvas.getContext("2d");
            this.rectSize = 12;
            this.rectGap = 6;
            this.columns = 15;
            this.padding = 7;
            this.scrollTop = 0;
            this.scrollSize = 10;
            this.debouncer = new Debouncer();
            EBUS.subscribe("imf-download-state-change", () => this.drawDebouce());
            EBUS.subscribe("downloader-canvas-resize", () => this.resize());
        }
        resize(parent) {
            parent = parent || this.canvas.parentElement;
            this.canvas.width = Math.floor(parent.offsetWidth);
            this.canvas.height = Math.floor(parent.offsetHeight);
            this.columns = Math.ceil((this.canvas.width - this.padding * 2 - this.rectGap) / (this.rectSize + this.rectGap));
            this.draw();
        }
        onwheel(deltaY) {
            const [_, h] = this.getWH();
            const clientHeight = this.computeClientHeight();
            if (clientHeight > h) {
                deltaY = deltaY >> 1;
                this.scrollTop += deltaY;
                if (this.scrollTop < 0) this.scrollTop = 0;
                if (this.scrollTop + h > clientHeight + 20) this.scrollTop = clientHeight - h + 20;
                this.draw();
            }
        }
        drawDebouce() {
            this.debouncer.addEvent("DOWNLOADER-DRAW", () => this.draw(), 20);
        }
        computeDrawList() {
            const list = [];
            const picked = this.cherryPick();
            const [_, h] = this.getWH();
            const startX = this.computeStartX();
            const startY = -this.scrollTop + this.padding;
            for (let i = 0, row = -1; i < this.queue.length; i++) {
                const currCol = i % this.columns;
                if (currCol == 0) row++;
                const atX = startX + (this.rectSize + this.rectGap) * currCol;
                const atY = startY + (this.rectSize + this.rectGap) * row;
                if (atY + this.rectSize < 0) continue;
                if (atY > h) break;
                list.push({
                    index: i,
                    x: atX,
                    y: atY,
                    selected: this.isSelected(atX, atY),
                    disabled: !picked.picked(i)
                });
            }
            return list;
        }
        draw() {
            const [w, h] = this.getWH();
            this.ctx.clearRect(0, 0, w, h);
            const drawList = this.computeDrawList();
            for (const node of drawList) this.drawSmallRect(node.x, node.y, this.queue[node.index], node.index === this.queue.currIndex, node.selected, node.disabled);
        }
        computeClientHeight() {
            return Math.ceil(this.queue.length / this.columns) * (this.rectSize + this.rectGap) - this.rectGap;
        }
        scrollTo(index) {
            const clientHeight = this.computeClientHeight();
            const [_, h] = this.getWH();
            if (clientHeight <= h) return;
            const offsetY = (Math.ceil((index + 1) / this.columns) - 1) * (this.rectSize + this.rectGap);
            if (offsetY > h) {
                this.scrollTop = offsetY + this.rectSize - h;
                const maxScrollTop = clientHeight - h + 20;
                if (this.scrollTop + 20 <= maxScrollTop) this.scrollTop += 20;
            }
        }
        isSelected(atX, atY) {
            return this.mousemoveState.x - atX >= 0 && this.mousemoveState.x - atX <= this.rectSize && this.mousemoveState.y - atY >= 0 && this.mousemoveState.y - atY <= this.rectSize;
        }
        computeStartX() {
            const [w, _] = this.getWH();
            return w - ((this.rectSize + this.rectGap) * this.columns - this.rectGap) >> 1;
        }
        drawSmallRect(x, y, imgFetcher, isCurr, isSelected, disabled) {
            if (disabled) this.ctx.fillStyle = "rgba(20, 20, 20, 1)";
            else switch (imgFetcher.stage) {
                case FetchState.FAILED:
                    this.ctx.fillStyle = "rgba(250, 50, 20, 0.9)";
                    break;
                case FetchState.URL:
                    this.ctx.fillStyle = "rgba(200, 200, 200, 0.6)";
                    break;
                case FetchState.DATA:
                    const percent = imgFetcher.downloadState.loaded / imgFetcher.downloadState.total;
                    this.ctx.fillStyle = `rgba(${200 + Math.ceil(-90 * percent)}, ${200 + Math.ceil(0 * percent)}, ${200 + Math.ceil(-80 * percent)}, ${.6 + Math.ceil(.4 * percent)})`;
                    break;
                case FetchState.DONE:
                    this.ctx.fillStyle = "rgb(110, 200, 120)";
                    break;
            }
            this.ctx.fillRect(x, y, this.rectSize, this.rectSize);
            this.ctx.shadowColor = "#d53";
            if (isSelected) {
                this.ctx.strokeStyle = "rgb(60, 20, 200)";
                this.ctx.lineWidth = 2;
            } else if (isCurr) {
                this.ctx.strokeStyle = "rgb(255, 60, 20)";
                this.ctx.lineWidth = 2;
            } else {
                this.ctx.strokeStyle = "rgb(90, 90, 90)";
                this.ctx.lineWidth = 1;
            }
            this.ctx.strokeRect(x, y, this.rectSize, this.rectSize);
        }
        getWH() {
            return [this.canvas.width, this.canvas.height];
        }
    };
    var FILENAME_INVALIDCHAR = /[\\/:*?"<>|\n\t]/g;
    var Downloader = class {
        meta;
        title;
        downloading;
        queue;
        idleLoader;
        pageFetcher;
        done = false;
        selectedChapters = [];
        filenames = new Set();
        panel;
        canvas;
        cherryPicks = [new CherryPick()];
        constructor(HTML, queue, idleLoader, pageFetcher, matcher) {
            this.panel = HTML.downloader;
            this.panel.initTabs();
            this.initEvents(this.panel);
            this.panel.initCherryPick((chapterIndex, range) => {
                if (this.cherryPicks[chapterIndex] === void 0) this.cherryPicks[chapterIndex] = new CherryPick();
                const ret = this.cherryPicks[chapterIndex].add(range);
                EBUS.emit("cherry-pick-changed", chapterIndex, this.cherryPicks[chapterIndex]);
                return ret;
            }, (chapterIndex, id) => {
                if (this.cherryPicks[chapterIndex] === void 0) this.cherryPicks[chapterIndex] = new CherryPick();
                const ret = this.cherryPicks[chapterIndex].remove(id);
                EBUS.emit("cherry-pick-changed", chapterIndex, this.cherryPicks[chapterIndex]);
                return ret;
            }, (chapterIndex) => {
                if (this.cherryPicks[chapterIndex] === void 0) this.cherryPicks[chapterIndex] = new CherryPick();
                this.cherryPicks[chapterIndex].reset();
                EBUS.emit("cherry-pick-changed", chapterIndex, this.cherryPicks[chapterIndex]);
            }, (chapterIndex) => {
                if (this.cherryPicks[chapterIndex] === void 0) this.cherryPicks[chapterIndex] = new CherryPick();
                return this.cherryPicks[chapterIndex].values;
            });
            this.panel.initNotice([{
                btn: i18n.resetDownloaded.get(),
                cb: () => {
                    if (confirm(i18n.resetDownloadedConfirm.get())) this.queue.forEach((imf) => imf.stage === FetchState.DONE && imf.resetStage());
                }
            }, {
                btn: i18n.resetFailed.get(),
                cb: () => {
                    this.queue.forEach((imf) => imf.stage === FetchState.FAILED && imf.resetStage());
                    if (!this.downloading) this.idleLoader.abort(0, 100);
                }
            }]);
            this.queue = queue;
            this.queue.cherryPick = () => this.cherryPicks[this.queue.chapterIndex] || new CherryPick();
            this.idleLoader = idleLoader;
            this.idleLoader.cherryPick = () => this.cherryPicks[this.queue.chapterIndex] || new CherryPick();
            this.canvas = new DownloaderCanvas(this.panel.canvas, queue, () => this.cherryPicks[this.queue.chapterIndex] || new CherryPick());
            this.pageFetcher = pageFetcher;
            this.meta = (chapter) => matcher.galleryMeta(chapter);
            this.title = (chapters) => matcher.title(chapters);
            this.downloading = false;
            this.queue.downloading = () => this.downloading;
            EBUS.subscribe("ifq-on-finished-report", (_, queue) => {
                if (queue.isFinished()) {
                    const sel = this.selectedChapters.find((sel) => sel.index === queue.chapterIndex);
                    if (sel) {
                        sel.done = true;
                        sel.resolve(true);
                    }
                    if (!this.downloading && !this.done) this.panel.noticeableBTN();
                }
            });
            EBUS.subscribe("imf-check-picked", (chapterIndex, index) => this.cherryPicks[chapterIndex]?.picked(index));
        }
        initEvents(panel) {
            panel.forceBTN.addEventListener("click", () => this.download(this.pageFetcher.chapters));
            panel.startBTN.addEventListener("click", () => {
                if (this.downloading) this.abort("downloadStart");
                else this.start();
            });
        }
        needNumberTitle(queue) {
            if (ADAPTER.conf.filenameOrder === "numbers") return true;
            if (ADAPTER.conf.filenameOrder === "original") return false;
            let comparer;
            if (ADAPTER.conf.filenameOrder === "alphabetically") comparer = (a, before) => a < before;
            else comparer = (a, before) => a.localeCompare(before, void 0, {
                numeric: true,
                sensitivity: "base"
            }) < 0;
            let lastTitle = "";
            for (const fetcher of queue) {
                if (lastTitle && comparer(fetcher.node.title, lastTitle)) return true;
                lastTitle = fetcher.node.title;
            }
            return false;
        }
        check() {
            if (this.downloading) return;
            setTimeout(() => EBUS.emit("downloader-canvas-resize"), 110);
            this.panel.createChapterSelectList(this.pageFetcher.chapters, this.selectedChapters);
            if (this.queue.length > 0) this.panel.switchTab("status");
            else if (this.pageFetcher.chapters.length > 1) this.panel.switchTab("chapters");
        }
        checkSelectedChapters() {
            this.selectedChapters.length = 0;
            const idSet = this.panel.selectedChapters();
            if (idSet.size === 0) this.selectedChapters.push({
                index: this.pageFetcher.chapterIndex,
                done: false,
                ...promiseWithResolveAndReject()
            });
            else this.pageFetcher.chapters.forEach((c, i) => idSet.has(c.id) && this.selectedChapters.push({
                index: i,
                done: false,
                ...promiseWithResolveAndReject()
            }));
            return this.selectedChapters;
        }
        async start() {
            if (this.downloading) return;
            this.panel.flushUI("downloading");
            this.downloading = true;
            this.idleLoader.autoLoad = true;
            this.checkSelectedChapters();
            try {
                for (const sel of this.selectedChapters) {
                    if (!this.downloading) return;
                    await this.pageFetcher.restoreChapter(sel.index);
                    this.queue.forEach((imf) => imf.stage === FetchState.FAILED && imf.resetStage());
                    if (this.queue.isFinished()) {
                        sel.done = true;
                        sel.resolve(true);
                    } else {
                        this.idleLoader.processingIndexList = this.queue.map((imgFetcher, index) => !imgFetcher.lock && imgFetcher.stage === FetchState.URL ? index : -1).filter((index) => index >= 0).splice(0, ADAPTER.conf.downloadThreads);
                        this.idleLoader.onFailed(() => sel.reject("download failed or canceled"));
                        this.idleLoader.checkProcessingIndex();
                        this.idleLoader.start();
                    }
                    await sel.promise;
                }
                if (this.downloading) await this.download(this.selectedChapters.filter((sel) => sel.done).map((sel) => this.pageFetcher.chapters[sel.index]));
            } catch (error) {
                if ("abort" === error) return;
                this.abort("downloadFailed");
                evLog("error", "download failed: ", error);
            } finally {
                this.downloading = false;
            }
        }
        mapToFileLikes(chapter, picked, directory) {
            if (!chapter || chapter.filteredQueue.length === 0) return [];
            const SEP = "/";
            let checkTitle;
            if (this.needNumberTitle(chapter.filteredQueue)) {
                const digits = chapter.filteredQueue.length.toString().length;
                if (ADAPTER.conf.filenameOrder === "numbers") checkTitle = (title, index) => `${index + 1}`.padStart(digits, "0") + "." + title.split(".").pop();
                else checkTitle = (title, index) => `${index + 1}`.padStart(digits, "0") + "_" + title.replaceAll(FILENAME_INVALIDCHAR, "_");
            } else {
                this.filenames.clear();
                checkTitle = (title) => deduplicate(this.filenames, title.replaceAll(FILENAME_INVALIDCHAR, "_"));
            }
            const fQueue = chapter.filteredQueue.filter((imf, i) => picked.picked(i) && imf.stage === FetchState.DONE && imf.data);
            const ret = [];
            let needConvertScript = false;
            for (let i = 0; i < fQueue.length; i++) {
                const imf = fQueue[i];
                if (imf.data instanceof SubData) {
                    const subDirectory = checkTitle(imf.node.title, i);
                    if (subDirectory.includes("ugoira0")) needConvertScript = true;
                    for (const sd of imf.data.list) {
                        const data = sd.data;
                        const size = data.byteLength;
                        const name = sd.name.replaceAll(FILENAME_INVALIDCHAR, "_");
                        const file = {
                            stream: () => Promise.resolve(uint8ArrayToReadableStream(data)),
                            size: () => size,
                            name: directory + (directory === "" ? "" : SEP) + subDirectory + SEP + name
                        };
                        ret.push(file);
                    }
                } else if (imf.data instanceof Uint8Array) {
                    const data = imf.data;
                    const size = imf.data.byteLength;
                    const file = {
                        stream: () => Promise.resolve(uint8ArrayToReadableStream(data)),
                        size: () => size,
                        name: directory + (directory === "" ? "" : SEP) + checkTitle(imf.node.title, i)
                    };
                    ret.push(file);
                }
            }
            const meta = new TextEncoder().encode(JSON.stringify(this.meta(chapter), null, 2));
            ret.push({
                stream: () => Promise.resolve(uint8ArrayToReadableStream(meta)),
                size: () => meta.byteLength,
                name: directory + (directory === "" ? "" : SEP) + "meta.json"
            });
            if (needConvertScript) generateConvertScript().forEach((sc, i) => {
                const r = new TextEncoder().encode(sc);
                ret.push({
                    stream: () => Promise.resolve(uint8ArrayToReadableStream(r)),
                    size: () => r.byteLength,
                    name: directory + (directory === "" ? "" : SEP) + "convert_to_gif." + (i === 0 ? "sh" : "bat"),
                    unixPermissions: "755"
                });
            });
            return ret;
        }
        async download(chapters) {
            try {
                const archiveName = this.title(chapters).replaceAll(FILENAME_INVALIDCHAR, "_");
                const singleChapter = chapters.length === 1;
                this.panel.flushUI("packaging");
                const dirnameSet = new Set();
                const files = [];
                for (let i = 0; i < chapters.length; i++) {
                    const chapter = chapters[i];
                    const picked = this.cherryPicks[i] || new CherryPick();
                    let directory = (() => {
                        if (singleChapter) return "";
                        if (chapter.title instanceof Array) return chapter.title.join("_").replaceAll(FILENAME_INVALIDCHAR, "_").replaceAll(/\s+/g, " ");
                        else return chapter.title.replaceAll(FILENAME_INVALIDCHAR, "_").replaceAll(/\s+/g, " ");
                    })();
                    directory = shrinkFilename(directory, 200);
                    directory = deduplicate(dirnameSet, directory);
                    const ret = this.mapToFileLikes(chapter, picked, directory);
                    files.push(...ret);
                }
                const zip = new Zip({ volumeSize: 1024 * 1024 * (ADAPTER.conf.archiveVolumeSize || 1500) });
                files.forEach((file) => zip.add(file));
                const save = async () => {
                    let readable;
                    while (readable = zip.nextReadableStream()) (0, file_saver.saveAs)(await new Response(readable).blob(), `${archiveName}.${zip.currVolumeNo === zip.volumes - 1 ? "zip" : "z" + (zip.currVolumeNo + 1).toString().padStart(2, "0")}`);
                };
                await save();
                this.done = true;
            } catch (error) {
                let reason = error.toString();
                if (reason.includes(`autoAllocateChunkSize`)) reason = "Create Zip archive prevented by The content security policy of this page. Please refer to the CONF > Help for a solution.";
                EBUS.emit("notify-message", "error", `packaging failed, ${reason}`);
                throw error;
            } finally {
                this.abort(this.done ? "downloaded" : "downloadFailed");
            }
        }
        abort(stage) {
            this.downloading = false;
            this.panel.abort(stage);
            this.idleLoader.abort();
            this.selectedChapters.forEach((sel) => sel.reject("abort"));
        }
    };
    function shrinkFilename(str, limit) {
        const encoder = new TextEncoder();
        const byteLen = (s) => encoder.encode(s).byteLength;
        const bLen = byteLen(str);
        if (bLen <= limit) return str;
        const sliceRange = [str.length >> 1, (str.length >> 1) + 1];
        let left = true;
        while (true) {
            if (bLen - byteLen(str.slice(...sliceRange)) <= limit) return str.slice(0, sliceRange[0]) + ",,," + str.slice(sliceRange[1]);
            if (left && sliceRange[0] > 3) {
                sliceRange[0] -= 1;
                left = false;
                continue;
            }
            if (sliceRange[1] < str.length - 3) {
                sliceRange[1] += 1;
                left = true;
                continue;
            }
            break;
        }
        return str.slice(0, limit);
    }
    function deduplicate(set, title) {
        let newTitle = title;
        if (set.has(newTitle)) {
            const splits = newTitle.split(".");
            const ext = splits.pop();
            const prefix = splits.join(".");
            const num = parseInt(prefix.match(/_(\d+)$/)?.[1] || "");
            if (isNaN(num)) newTitle = `${prefix}_1.${ext}`;
            else newTitle = `${prefix.replace(/\d+$/, (num + 1).toString())}.${ext}`;
            return deduplicate(set, newTitle);
        } else {
            set.add(newTitle);
            return newTitle;
        }
    }
    function uint8ArrayToReadableStream(arr) {
        return new ReadableStream({
            pull(controller) {
                controller.enqueue(arr);
                controller.close();
            }
        });
    }
    function promiseWithResolveAndReject() {
        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return {
            resolve,
            reject,
            promise
        };
    }
    var CherryPick = class {
        values = [];
        positive = false;
        sieve = [];
        reset() {
            this.values = [];
            this.positive = false;
            this.sieve = [];
        }
        add(range) {
            if (this.values.length === 0) {
                this.positive = range.positive;
                this.values.push(range);
                this.setSieve(range);
                return this.values;
            }
            if (this.values.find((v) => v.id === range.id)) return null;
            const newR = range.range();
            const remIdSet = new Set();
            const addIdSet = new Set();
            const addList = [];
            let equalsOld = false;
            for (let i = 0; i < this.values.length; i++) {
                const old = this.values[i];
                const oldR = old.range();
                if (newR[0] >= oldR[0] && newR[1] <= oldR[1]) {
                    if (range.positive !== this.positive) {
                        remIdSet.add(old.id);
                        if (oldR[0] < newR[0]) addList.push(new CherryPickRange([oldR[0], newR[0] - 1], old.positive));
                        if (oldR[1] > newR[1]) addList.push(new CherryPickRange([newR[1] + 1, oldR[1]], old.positive));
                        equalsOld = newR[0] === newR[1] && newR[0] === oldR[0] && newR[1] === oldR[1];
                    }
                    break;
                }
                if (newR[0] <= oldR[0] && newR[1] >= oldR[1]) remIdSet.add(old.id);
                else if (newR[0] <= oldR[0] && newR[1] >= oldR[0] && newR[1] <= oldR[1]) old.reset([newR[1] + 1, oldR[1]]);
                else if (newR[0] >= oldR[0] && newR[0] <= oldR[1] && newR[1] >= oldR[1]) old.reset([oldR[0], newR[0] - 1]);
                if (range.positive === this.positive) {
                    if (!addIdSet.has(range.id)) {
                        addIdSet.add(range.id);
                        addList.push(range);
                    }
                }
            }
            if (remIdSet.size > 0) this.values = this.values.filter((v) => !remIdSet.has(v.id));
            if (addList.length > 0) this.values.push(...addList);
            if (this.values.length === 0) {
                this.reset();
                if (equalsOld) return this.values;
                this.positive = range.positive;
                this.values.push(range);
            } else this.concat();
            this.setSieve(range);
            return this.values;
        }
        setSieve(range) {
            const newR = range.range();
            for (let i = newR[0] - 1; i < newR[1]; i++) this.sieve[i] = range.positive === this.positive;
        }
        concat() {
            if (this.values.length < 2) return;
            this.values.sort((v1, v2) => v1.range()[0] - v2.range()[0]);
            let i = 0, j = 1;
            const skip = [];
            while (i < this.values.length && j < this.values.length) {
                const r1 = this.values[i];
                const r2 = this.values[j];
                const r1v = r1.range();
                const r2v = r2.range();
                if (r1v[1] + 1 === r2v[0]) {
                    r1.reset([r1v[0], r2v[1]]);
                    skip.push(j);
                    j++;
                } else {
                    do
                        i++;
                    while (skip.includes(i));
                    j = i + 1;
                }
            }
            this.values = this.values.filter((_, i) => !skip.includes(i));
        }
        remove(id) {
            const index = this.values.findIndex((v) => v.id === id);
            if (index === -1) return;
            const r = this.values.splice(index, 1)[0].range();
            for (let i = r[0] - 1; i < r[1]; i++) this.sieve[i] = false;
            if (this.values.length === 0) {
                this.sieve = [];
                this.positive = false;
            }
        }
        picked(index) {
            return Boolean(this.positive ? this.sieve[index] : !this.sieve[index]);
        }
    };
    var CherryPickRange = class CherryPickRange {
        value;
        positive;
        id;
        constructor(value, positive) {
            this.positive = positive;
            this.value = value.sort((a, b) => a - b);
            this.id = CherryPickRange.rangeToString(this.value, this.positive);
        }
        toString() {
            return CherryPickRange.rangeToString(this.value, this.positive);
        }
        reset(newRange) {
            this.value = newRange.sort((a, b) => a - b);
            this.id = CherryPickRange.rangeToString(this.value, this.positive);
        }
        range() {
            return this.value;
        }
        static rangeToString(value, positive) {
            let str = "";
            if (value[0] === value[1]) str = value[0].toString();
            else str = value.map((v) => v.toString()).join("-");
            return positive ? str : "!" + str;
        }
        static from(value) {
            value = value?.trim();
            if (!value) return null;
            value = value.replace(/!+/, "!");
            const exclude = value.startsWith("!");
            if (/^!?\d+$/.test(value)) {
                const index = parseInt(value.replace("!", ""));
                return new CherryPickRange([index, index], !exclude);
            }
            if (/^!?\d+-\d+$/.test(value)) {
                const splits = value.replace("!", "").split("-").map((v) => parseInt(v));
                return new CherryPickRange([splits[0], splits[1]], !exclude);
            }
            return null;
        }
    };
    var IMGFetcherQueue = class IMGFetcherQueue extends Array {
        executableQueue;
        currIndex;
        finishedIndex = new Set();
        debouncer;
        downloading;
        dataSize = 0;
        chapterIndex = 0;
        cherryPick;
        clear() {
            this.length = 0;
            this.executableQueue = [];
            this.currIndex = 0;
            this.finishedIndex.clear();
        }
        restore(chapterIndex, imfs) {
            this.clear();
            this.chapterIndex = chapterIndex;
            imfs.forEach((imf, i) => imf.stage === FetchState.DONE && this.finishedIndex.add(i));
            this.push(...imfs);
        }
        static newQueue() {
            const queue = new IMGFetcherQueue();
            EBUS.subscribe("imf-on-finished", (index, success, imf) => queue.chapterIndex === imf.chapterIndex && queue.finishedReport(index, success, imf));
            EBUS.subscribe("ifq-do", (index, imf, oriented) => {
                if (imf.chapterIndex !== queue.chapterIndex) return;
                queue.do(index, oriented);
            });
            EBUS.subscribe("pf-change-chapter", () => queue.forEach((imf) => imf.unrender()));
            EBUS.subscribe("add-cherry-pick-range", (chIndex, index, positive, _shiftKey) => {
                if (chIndex !== queue.chapterIndex) return;
                if (positive) return;
                if (queue[index]?.stage === FetchState.DATA) {
                    queue[index].abort();
                    queue[index].stage = FetchState.URL;
                }
            });
            return queue;
        }
        constructor() {
            super();
            this.executableQueue = [];
            this.currIndex = 0;
            this.debouncer = new Debouncer();
        }
        isFinished() {
            const picked = this.cherryPick?.(this.chapterIndex);
            if (picked && picked.values.length > 0) {
                for (let index = 0; index < this.length; index++) if (picked.picked(index) && !this.finishedIndex.has(index)) return false;
                return true;
            } else return this.finishedIndex.size === this.length;
        }
        do(start, oriented) {
            oriented = oriented || "next";
            this.currIndex = this.fixIndex(start);
            EBUS.emit("ifq-on-do", this.currIndex, this, this.downloading?.() || false);
            if (this.downloading?.()) return;
            if (!this.pushInExecutableQueue(oriented)) return;
            this.debouncer.addEvent("IFQ-EXECUTABLE", () => {
                const executableQueue = [...this.executableQueue];
                console.log("IFQ-EXECUTABLE: ", executableQueue);
                Promise.all(executableQueue.splice(0, ADAPTER.conf.paginationIMGCount).map((imfIndex) => this[imfIndex].start())).then(() => {
                    const picked = this.cherryPick?.(this.chapterIndex);
                    executableQueue.filter((i) => !picked || picked.picked(i)).forEach((imfIndex) => this[imfIndex].start());
                });
            }, 300);
        }
        finishedReport(index, success, imf) {
            if (this.length === 0) return;
            if (!success || imf.stage !== FetchState.DONE) return;
            this.finishedIndex.add(index);
            if (this.dataSize < 1e9) this.dataSize += imf.data?.byteLength || 0;
            EBUS.emit("ifq-on-finished-report", index, this);
        }
        fixIndex(start) {
            return start < 0 ? 0 : start > this.length - 1 ? this.length - 1 : start;
        }
        pushInExecutableQueue(oriented) {
            this.executableQueue = [];
            for (let count = 0, index = this.currIndex; this.checkOutbounds(index, oriented, count); oriented === "next" ? ++index : --index) {
                if (this[index].stage === FetchState.DONE) continue;
                this.executableQueue.push(index);
                count++;
            }
            return this.executableQueue.length > 0;
        }
        checkOutbounds(index, oriented, count) {
            let ret = false;
            if (oriented === "next") ret = index < this.length;
            if (oriented === "prev") ret = index > -1;
            if (!ret) return false;
            const threads = ADAPTER.conf.threads + ADAPTER.conf.paginationIMGCount - 1;
            const distance = Math.abs(index - this.currIndex);
            if (ADAPTER.conf.maxPreloadDistance > 0 && distance > ADAPTER.conf.maxPreloadDistance) return false;
            if (threads >= distance || ADAPTER.conf.threads > 0 && count < threads) return true;
            return false;
        }
        findImgIndex(ele) {
            for (let index = 0; index < this.length; index++) if (this[index].node.equal(ele)) return index;
            return 0;
        }
    };
    var IdleLoader = class {
        queue;
        processingIndexList;
        restartId;
        maxWaitMS;
        minWaitMS;
        onFailedCallback;
        autoLoad = false;
        debouncer;
        cherryPick;
        constructor(queue) {
            this.queue = queue;
            this.processingIndexList = [0];
            this.maxWaitMS = 1e3;
            this.minWaitMS = 300;
            this.autoLoad = ADAPTER.conf.autoLoad;
            this.debouncer = new Debouncer();
            EBUS.subscribe("ifq-on-do", (currIndex, _, downloading) => !downloading && this.abort(currIndex));
            EBUS.subscribe("imf-on-finished", (index) => {
                if (!this.processingIndexList.includes(index)) return;
                this.wait().then(() => {
                    this.checkProcessingIndex();
                    this.start();
                });
            });
            EBUS.subscribe("pf-change-chapter", (index) => !this.queue.downloading?.() && this.abort(index > 0 ? 0 : void 0));
            window.addEventListener("focus", () => {
                if (ADAPTER.conf.autoLoadInBackground) return;
                this.debouncer.addEvent("Idle-Load-on-focus", () => {
                    console.log("[ IdleLoader ] window focus, document.hidden:", document.hidden);
                    if (document.hidden) return;
                    this.abort(0, 10);
                }, 100);
            });
            EBUS.subscribe("pf-on-appended", (_total, _nodes, _chapterIndex, done) => {
                if (done || this.processingIndexList.length > 0) return;
                this.abort(this.queue.currIndex, 100);
            });
        }
        onFailed(cb) {
            this.onFailedCallback = cb;
        }
        start() {
            if (!this.autoLoad) return;
            if (document.hidden && !ADAPTER.conf.autoLoadInBackground) return;
            if (this.processingIndexList.length === 0) return;
            if (this.queue.length === 0) return;
            evLog("info", "Idle Loader start at: " + this.processingIndexList.toString());
            for (const processingIndex of this.processingIndexList) this.queue[processingIndex].start();
        }
        checkProcessingIndex() {
            if (this.queue.length === 0) return;
            const picked = this.cherryPick?.() || new CherryPick();
            const foundFetcherIndex = new Set();
            let hasFailed = false;
            for (let i = 0; i < this.processingIndexList.length; i++) {
                const processingIndex = this.processingIndexList[i];
                const imf = this.queue[processingIndex];
                if (imf.stage === FetchState.FAILED) hasFailed = true;
                if (imf.lock || imf.stage === FetchState.URL) continue;
                for (let j = Math.min(processingIndex + 1, this.queue.length - 1), limit = this.queue.length; j < limit; j++) {
                    if (picked.picked(j)) {
                        const imf = this.queue[j];
                        if (!imf.lock && imf.stage === FetchState.URL && !foundFetcherIndex.has(j)) {
                            foundFetcherIndex.add(j);
                            this.processingIndexList[i] = j;
                            break;
                        }
                        if (imf.stage === FetchState.FAILED) hasFailed = true;
                    }
                    if (j >= this.queue.length - 1) {
                        limit = processingIndex;
                        j = 0;
                    }
                }
                if (foundFetcherIndex.size === 0) {
                    this.processingIndexList.length = 0;
                    if (hasFailed && this.onFailedCallback) {
                        this.onFailedCallback();
                        this.onFailedCallback = void 0;
                    }
                    return;
                }
            }
        }
        async wait() {
            const { maxWaitMS, minWaitMS } = this;
            return new Promise(function (resolve) {
                const time = Math.floor(Math.random() * maxWaitMS + minWaitMS);
                window.setTimeout(() => resolve(true), time);
            });
        }
        abort(newIndex, delayRestart) {
            this.processingIndexList = [];
            this.debouncer.addEvent("IDLE-LOAD-ABORT", () => {
                if (!this.autoLoad) return;
                if (newIndex === void 0) return;
                if (this.queue.downloading?.()) return;
                const idleThreads = ADAPTER.conf.maxIdleThreads;
                this.processingIndexList = [];
                for (let i = 0; i < idleThreads; i++) {
                    if (newIndex + i >= this.queue.length) break;
                    this.processingIndexList.push(newIndex + i);
                }
                this.checkProcessingIndex();
                this.start();
            }, delayRestart || ADAPTER.conf.restartIdleLoader);
        }
    };
    function parseKey(event) {
        const keys = [];
        if (event.ctrlKey) keys.push("ctrl");
        if (event.shiftKey) keys.push("shift");
        if (event.altKey) keys.push("alt");
        if (event.metaKey) keys.push("meta");
        if (event instanceof KeyboardEvent) {
            let key = event.key;
            if (key === " ") key = "space";
            keys.push(key);
        }
        if (event instanceof MouseEvent) {
            let key = "m" + event.button;
            keys.push(key);
        }
        return keys.join("+").toLowerCase();
    }
    function relocateElement(element, anchor, vw, vh) {
        const rect = anchor.getBoundingClientRect();
        let left = rect.left + rect.width / 2 - element.offsetWidth / 2;
        left = Math.min(left, vw - element.offsetWidth);
        left = Math.max(left, 0);
        element.style.left = left + "px";
        if (rect.top > vh / 2) {
            element.style.bottom = vh - rect.top + "px";
            element.style.top = "unset";
        } else {
            element.style.top = rect.bottom + "px";
            element.style.bottom = "unset";
        }
    }
    function createInputElement(root, anchor, callback) {
        const element = document.createElement("div");
        element.style.position = "fixed";
        element.style.lineHeight = "2em";
        element.id = "input-element";
        element.innerHTML = `<input type="text" style="width:20em;height:2em;"><button class="ehvp-custom-btn ehvp-custom-btn-plain">&nbsp√&nbsp</button>`;
        root.appendChild(element);
        const input = element.querySelector("input");
        element.querySelector("button").addEventListener("click", () => {
            callback(input.value);
            element.remove();
        });
        relocateElement(element, anchor, root.offsetWidth, root.offsetHeight);
    }
    function createWorkURLs(workURLs, container, onRemove) {
        container.innerHTML = workURLs.map((regex) => `<div><span style="user-select: text;">${regex}</span><span class="ehvp-custom-btn ehvp-custom-btn-plain" data-value="${regex}">&nbspx&nbsp</span></div>`).join("");
        Array.from(container.querySelectorAll("div > span + span")).forEach((element) => {
            element.addEventListener("click", () => {
                onRemove(element.getAttribute("data-value"));
                element.parentElement.remove();
            });
        });
    }
    function createSiteProfilePanel(root, onclose) {
        const matchers = ADAPTER.matchers;
        const listItems = matchers.map((matcher) => {
            const name = matcher.name;
            const id = "id-" + b64EncodeUnicode(name).replaceAll(/[+=\/]/g, "-");
            return `<li data-index="${id}" class="ehvp-custom-panel-list-item">
             <div class="ehvp-custom-panel-list-item-title">
               <div style="font-size: 1.2em;font-weight: 800;">${name}</div>
               <div>
                 <label class="ehvp-custom-panel-checkbox"><span>${i18n.addRegexp.get()}: </span><span id="${id}-add-workurl" class="ehvp-custom-btn ehvp-custom-btn-green">&nbsp+&nbsp</span></label>
               </div>
             </div>
             <div id="${id}-workurls"></div>
           </li>`;
        });
        const HTML_STR = `
<div class="ehvp-custom-panel">
  <div class="ehvp-custom-panel-title">
    <span>
      <span>${i18n.showSiteProfiles.get()}</span>
    </span>
    <span id="ehvp-custom-panel-close" class="ehvp-custom-panel-close">?</span>
  </div>
  <div class="ehvp-custom-panel-container">
    <div class="ehvp-custom-panel-content">
      <ul class="ehvp-custom-panel-list">
      ${listItems.join("")}
      </ul>
    </div>
  </div>
</div>
`;
        const fullPanel = document.createElement("div");
        fullPanel.classList.add("ehvp-full-panel");
        fullPanel.innerHTML = HTML_STR;
        const close = () => {
            fullPanel.remove();
            onclose?.();
        };
        fullPanel.addEventListener("click", (event) => {
            if (event.target.classList.contains("ehvp-full-panel")) close();
        });
        root.appendChild(fullPanel);
        fullPanel.querySelector(".ehvp-custom-panel-close").addEventListener("click", close);
        matchers.forEach((matcher) => {
            const name = matcher.name;
            const id = "id-" + b64EncodeUnicode(name).replaceAll(/[+=\/]/g, "-");
            const defaultWorkURLs = matcher.workURLs.map((u) => u.source);
            const getProfile = () => {
                return getSiteConfig(name);
            };
            const addWorkURL = q(`#${id}-add-workurl`, fullPanel);
            const workURLContainer = q(`#${id}-workurls`, fullPanel);
            const removeWorkURL = (value, profile) => {
                const index = profile.workURLs?.indexOf(value) ?? -1;
                let changed = false;
                if (index > -1) {
                    profile.workURLs.splice(index, 1);
                    changed = true;
                }
                if ((profile.workURLs?.length ?? 0) === 0) {
                    profile.workURLs = void 0;
                    changed = true;
                    createWorkURLs(defaultWorkURLs, workURLContainer, (value) => {
                        removeWorkURL(value, getProfile());
                    });
                }
                if (changed) saveConf({ workURLs: profile.workURLs }, matcher.name);
            };
            addWorkURL.addEventListener("click", () => {
                const background = document.createElement("div");
                background.addEventListener("click", (event) => event.target === background && background.remove());
                background.setAttribute("style", "position:absolute;width:100%;height:100%;");
                fullPanel.appendChild(background);
                createInputElement(background, addWorkURL, (value) => {
                    if (!value) return;
                    try {
                        new RegExp(value);
                    } catch (_) {
                        return;
                    }
                    background.remove();
                    const profile = getProfile();
                    if (!profile.workURLs) profile.workURLs = [...defaultWorkURLs];
                    profile.workURLs.push(value);
                    saveConf({ workURLs: profile.workURLs }, matcher.name);
                    createWorkURLs(profile.workURLs, workURLContainer, (value) => {
                        removeWorkURL(value, getProfile());
                    });
                });
            });
            createWorkURLs(getProfile().workURLs ?? defaultWorkURLs, workURLContainer, (value) => {
                removeWorkURL(value, getProfile());
            });
        });
        fullPanel.querySelectorAll(".p-tooltip").forEach((element) => {
            const child = element.querySelector(".p-tooltiptext");
            if (!child) return;
            element.addEventListener("mouseenter", () => {
                child.style.display = "block";
                relocateElement(child, element, root.offsetWidth, root.offsetHeight);
            });
            element.addEventListener("mouseleave", () => child.style.display = "none");
        });
    }
    function createHelpPanel(root, onclose) {
        const HTML_STR = `
<div class="ehvp-custom-panel">
  <div class="ehvp-custom-panel-title">
    <span>${i18n.showHelp.get()}</span>
    <span id="ehvp-custom-panel-close" class="ehvp-custom-panel-close">?</span>
  </div>
  <div class="ehvp-custom-panel-container ehvp-help-panel">
    <div class="ehvp-custom-panel-content">${i18n.help.get()}</div>
  </div>
</div>
`;
        const fullPanel = document.createElement("div");
        fullPanel.classList.add("ehvp-full-panel");
        fullPanel.innerHTML = HTML_STR;
        const close = () => {
            fullPanel.remove();
            onclose?.();
        };
        fullPanel.addEventListener("click", (event) => {
            if (event.target.classList.contains("ehvp-full-panel")) close();
        });
        root.appendChild(fullPanel);
        fullPanel.querySelector(".ehvp-custom-panel-close").addEventListener("click", close);
    }
    function createKeyboardCustomPanel(keyboardEvents, root, onclose) {
        function addKeyboardDescElement(button, category, id, key) {
            const str = `<span data-id="${id}" data-key="${key}" class="ehvp-custom-panel-item-value"><span>${key}</span><span class="ehvp-custom-btn ehvp-custom-btn-plain" style="padding:0;border:none;">&nbspx&nbsp</span></span>`;
            const tamplate = document.createElement("div");
            tamplate.innerHTML = str;
            const element = tamplate.firstElementChild;
            button.before(element);
            element.querySelector(".ehvp-custom-btn").addEventListener("click", (event) => {
                const keys = ADAPTER.conf.keyboards[category][id];
                if (keys && keys.length > 0) {
                    const index = keys.indexOf(key);
                    if (index !== -1) keys.splice(index, 1);
                    if (keys.length === 0) delete ADAPTER.conf.keyboards[category][id];
                    saveConf({ keyboards: ADAPTER.conf.keyboards });
                }
                event.target.parentElement.remove();
                if (Array.from(button.parentElement.querySelectorAll(".ehvp-custom-panel-item-value")).length === 0) keyboardEvents[category][id].defaultKeys.forEach((key) => addKeyboardDescElement(button, category, id, key));
            });
            tamplate.remove();
        }
        const HTML_STR = `
<div class="ehvp-custom-panel">
  <div class="ehvp-custom-panel-title">
    <span>${i18n.showKeyboard.get()}</span>
    <span id="ehvp-custom-panel-close" class="ehvp-custom-panel-close">?</span>
  </div>
  <div class="ehvp-custom-panel-container">
    <div class="ehvp-custom-panel-content">
      ${Object.entries(keyboardEvents.inMain).filter((entry) => !entry[1].noKeyboard).map(([id]) => `
        <div class="ehvp-custom-panel-item">
         <div class="ehvp-custom-panel-item-title">
           <span>${i18n.keyboard[id].get()}</span>
         </div>
         <div class="ehvp-custom-panel-item-values">
           <!-- wait element created from button event -->
           <button class="ehvp-add-keyboard-btn ehvp-custom-btn ehvp-custom-btn-green" style="margin-left: 0.2em;" data-cate="inMain" data-id="${id}">+</button>
         </div>
        </div>
      `).join("")}
    </div>
    <div class="ehvp-custom-panel-content">
      ${Object.entries(keyboardEvents.inFullViewGrid).filter((entry) => !entry[1].noKeyboard).map(([id]) => `
        <div class="ehvp-custom-panel-item">
         <div class="ehvp-custom-panel-item-title">
           <span>${i18n.keyboard[id].get()}</span>
         </div>
         <div class="ehvp-custom-panel-item-values">
           <!-- wait element created from button event -->
           <button class="ehvp-add-keyboard-btn ehvp-custom-btn ehvp-custom-btn-green" style="margin-left: 0.2em;" data-cate="inFullViewGrid" data-id="${id}">+</button>
         </div>
        </div>
      `).join("")}
    </div>
    <div class="ehvp-custom-panel-content">
      ${Object.entries(keyboardEvents.inBigImageMode).filter((entry) => !entry[1].noKeyboard).map(([id]) => `
        <div class="ehvp-custom-panel-item">
         <div class="ehvp-custom-panel-item-title">
           <span>${i18n.keyboard[id].get()}</span>
         </div>
         <div class="ehvp-custom-panel-item-values">
           <!-- wait element created from button event -->
           <button class="ehvp-add-keyboard-btn ehvp-custom-btn ehvp-custom-btn-green" style="margin-left: 0.2em;display:inline-block;" data-cate="inBigImageMode" data-id="${id}">+</button>
         </div>
        </div>
      `).join("")}
    </div>
  </div>
</div>
`;
        const fullPanel = document.createElement("div");
        fullPanel.classList.add("ehvp-full-panel");
        fullPanel.innerHTML = HTML_STR;
        const close = () => {
            fullPanel.remove();
            onclose?.();
        };
        fullPanel.addEventListener("click", (event) => {
            if (event.target.classList.contains("ehvp-full-panel")) close();
        });
        root.appendChild(fullPanel);
        fullPanel.querySelector(".ehvp-custom-panel-close").addEventListener("click", close);
        fullPanel.querySelectorAll(".ehvp-add-keyboard-btn").forEach((button) => {
            const category = button.getAttribute("data-cate");
            const id = button.getAttribute("data-id");
            let keys = ADAPTER.conf.keyboards[category][id];
            if (keys === void 0 || keys.length === 0) keys = keyboardEvents[category][id].defaultKeys;
            keys.forEach((key) => addKeyboardDescElement(button, category, id, key));
            const addKeyBoardDesc = (event) => {
                event.preventDefault();
                if (event instanceof KeyboardEvent) {
                    const checkKey = event.key.toLowerCase();
                    if (checkKey === "alt" || checkKey === "shift" || checkKey === "control" || checkKey === "meta") return;
                }
                const key = parseKey(event);
                if (ADAPTER.conf.keyboards[category][id] !== void 0) ADAPTER.conf.keyboards[category][id].push(key);
                else ADAPTER.conf.keyboards[category][id] = keys.concat(key);
                saveConf({ keyboards: ADAPTER.conf.keyboards });
                addKeyboardDescElement(button, category, id, key);
                button.textContent = "+";
                button.removeAttribute("d-pressing");
                button.removeEventListener("keyup", addKeyBoardDesc);
                button.removeEventListener("mouseup", addKeyBoardDesc);
            };
            button.addEventListener("click", (event) => {
                event.preventDefault();
                button.textContent = "Press Key";
                button.setAttribute("d-pressing", "");
                button.addEventListener("keyup", addKeyBoardDesc, { once: false });
                button.addEventListener("mouseup", addKeyBoardDesc, { once: false });
            });
            button.addEventListener("mouseleave", () => {
                button.textContent = "+";
                button.removeAttribute("d-pressing");
                button.removeEventListener("keyup", addKeyBoardDesc);
                button.removeEventListener("mouseup", addKeyBoardDesc);
            });
        });
    }
    var icons = {
        zoomIcon: `??`,
        exitIcon: `<svg
  width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" >
  <path d="M4 4V20C4 21.1 4.9 22 6 22H12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M10 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  <path d="M16 8L20 12L16 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>`,
        prevIcon: `<svg
  width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" >
  <path d="M19 12H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  <path d="M11 6L5 12L11 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>`,
        nextIcon: `<svg
  width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" >
  <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  <path d="M13 6L19 12L13 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>`,
        zoomInIcon: `<svg
  width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" >
  <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
  <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
</svg>`,
        zoomOutIcon: `<svg
  width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" >
  <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
  <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  <line x1="11" y1="8" x2="11" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
</svg>`,
        prevChapterIcon: `<svg
  width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" >
  <path d="M4 6C4 4.9 4.9 4 6 4H11V20H6C4.9 20 4 19.1 4 18V6Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
  <path d="M11 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H11V4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
  <path d="M7.5 13V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  <path d="M5.5 11L7.5 9L9.5 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>`,
        nextChapterIcon: `<svg
  width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" >
  <path d="M4 6C4 4.9 4.9 4 6 4H11V20H6C4.9 20 4 19.1 4 18V6Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
  <path d="M11 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H11V4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
  <path d="M7.5 9V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  <path d="M5.5 11L7.5 13L9.5 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>`,
        rotateIcon: `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.5 20.5C6.80558 20.5 3 16.6944 3 12C3 7.30558 6.80558 3.5 11.5 3.5C16.1944 3.5 20 7.30558 20 12C20 13.5433 19.5887 14.9905 18.8698 16.238M22.5 15L18.8698 16.238M17.1747 12.3832L18.5289 16.3542L18.8698 16.238" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
        switchReadModeIcon: `<svg width="24px" height="24px" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="48" height="48" fill="white" fill-opacity="0.01"/>
<path d="M30 10H40C41.8856 10 42.8284 10 43.4142 10.5858C44 11.1716 44 12.1144 44 14V34C44 35.8856 44 36.8284 43.4142 37.4142C42.8284 38 41.8856 38 40 38H30" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18 10H8C6.11438 10 5.17157 10 4.58579 10.5858C4 11.1716 4 12.1144 4 14V34C4 35.8856 4 36.8284 4.58579 37.4142C5.17157 38 6.11438 38 8 38H18" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M24 6V42" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
        playIcon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 6 L18 12 L8 18 Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
        reverseIcon: `<svg width="24px" height="24px" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
<g fill="none" fill-rule="evenodd" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" transform="translate(3 3)">
<path d="m6.5 6.5-4 4 4 4"/> <path d="m14.5 10.5h-12"/> <path d="m8.5.5 4 4-4 4"/> <path d="m12.5 4.5h-12"/> </g>
</svg>`,
        downloadIcon: `<svg width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
<g id="Complete"> <g id="download"> <g>
<path d="M3,12.3v7a2,2,0,0,0,2,2H19a2,2,0,0,0,2-2v-7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
<g>
<polyline data-name="Right" fill="none" id="Right-2" points="7.9 12.3 12 16.3 16.1 12.3" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
<line fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="2.7" y2="14.2"/>
</g> </g> </g>
</g>
</svg>`,
        resizeGridIcon: `<svg fill="currentColor" width="24px" height="24px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="resize"  enable-background="new 0 0 32 32" xml:space="preserve">
  <path d="M28 10V4h-6v2H10V4H4v6h2v12H4v6h6v-2h12v2h6v-6h-2V10H28zM24 6h2v2h-2V6zM6 6h2v2H6V6zM8 26H6v-2h2V26zM26 26h-2v-2h2V26zM24 22h-2v2H10v-2H8V10h2V8h12v2h2V22z"/>
  <polygon points="17,12 15,12 15,15 12,15 12,17 15,17 15,20 17,20 17,17 20,17 20,15 17,15 "/>
</svg>`,
        refetchNextIcon: `<svg width="24px" height="24px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M7.293 9.006l-.88.88A2.484 2.484 0 0 0 4 8a2.488 2.488 0 0 0-2.413 1.886l-.88-.88L0 9.712l1.147 1.146-.147.146v1H0v.999h1v.053c.051.326.143.643.273.946L0 15.294.707 16l1.1-1.099A2.873 2.873 0 0 0 4 16a2.875 2.875 0 0 0 2.193-1.099L7.293 16 8 15.294l-1.273-1.292A3.92 3.92 0 0 0 7 13.036v-.067h1v-.965H7v-1l-.147-.146L8 9.712l-.707-.706zM4 9.006a1.5 1.5 0 0 1 1.5 1.499h-3A1.498 1.498 0 0 1 4 9.006zm2 3.997A2.217 2.217 0 0 1 4 15a2.22 2.22 0 0 1-2-1.998v-1.499h4v1.499z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5 2.41L5.78 2l9 6v.83L9 12.683v-1.2l4.6-3.063L6 3.35V7H5V2.41z"/></svg>`,
        openInNewTabIcon: `<svg height="24px" width="24px" version="1.1" fill="currentColor" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"  xml:space="preserve">
<g>
	<path class="st0" d="M96,0v416h416V0H96z M472,376H136V40h336V376z"/>
	<polygon class="st0" points="40,472 40,296 40,136 40,96 0,96 0,512 416,512 416,472 376,472 	"/>
	<polygon class="st0" points="232.812,312.829 350.671,194.969 350.671,279.766 390.671,279.766 390.671,126.688 237.594,126.688
		237.594,166.688 322.39,166.688 204.531,284.547 	"/>
</g>
</svg>`,
        readIcon: `<svg width="24px" height="24px" viewBox="0 0 1024 1024" class="icon"  version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M430.602 443.728H172.941v409.721h257.661l9.723 22.763h123.159l12.965-22.763h251.179V437.225z" fill="currentColor" /><path d="M563.484 888.712H440.325l-11.495-7.59-6.48-15.173H172.94l-12.5-12.5v-409.72l12.5-12.5H430.5l396.923-6.502 12.705 12.498V853.45l-12.5 12.5H583.714l-9.367 16.449-10.863 6.313z m-114.906-25h107.641l9.367-16.449 10.862-6.313h238.68V449.931l-384.525 6.298H185.44V840.95h245.162l11.495 7.59 6.481 15.172z" fill="currentColor" /><path d="M772.531 386.823s-221.458-42.273-266.298 50.402l-22.982 384.568h52.685l4.862-31.937h231.733V386.823z" fill="currentColor" /><path d="M535.936 831.793h-52.685l-9.982-10.597 22.981-384.568 0.98-3.759c11.444-23.653 33.769-41.182 66.351-52.099 24.92-8.351 56.024-12.892 92.449-13.499 61.296-1.015 116.074 9.29 118.376 9.729l8.125 9.822v403.034l-10 10H549.39l-3.568 23.441-9.886 8.496z m-42.07-20h33.477l3.568-23.441 9.886-8.495h221.734V395.259c-17.44-2.796-60.6-8.781-106.461-7.984-93.223 1.611-127.655 29.096-139.979 52.604l-22.225 371.914z" fill="currentColor" /><path d="M224.797 386.823H469.99v403.034H224.797z" fill="currentColor" /><path d="M469.99 799.856H224.797l-10-10V386.822l10-10H469.99l10 10v403.034l-10 10z m-235.193-20H459.99V396.822H234.797v383.034z" fill="currentColor" /><path d="M292.542 310.406s139.34 22.474 190.709 81.026c27.337 31.16 26.78 73.506 26.78 73.506v317.628c0 12.645-6.106 24.506-16.384 31.825l-10.396 7.403s0.118-26.71-27.886-44.677-162.823-66.744-162.823-66.744V310.406z" fill="currentColor" /><path d="M489.052 829.938l-15.801-8.189c-0.013-0.789-0.575-21.645-23.286-36.216-21.401-13.731-114.557-49.018-160.825-65.758l-6.598-9.403V310.406l11.593-9.872c5.834 0.94 143.502 23.743 196.634 84.304 29.188 33.269 29.287 77.311 29.262 80.148v317.579c0 15.851-7.694 30.793-20.583 39.971l-10.396 7.402z m-186.51-126.567c27.82 10.177 132.917 49.092 158.224 65.328 17.225 11.052 25.318 25.077 29.12 35.95a29.13 29.13 0 0 0 10.145-22.084l0.001-317.76c0.003-0.365 0.059-39.017-24.297-66.778-40.047-45.646-139.256-68.81-173.192-75.589v380.933zM610.066 444.946h123.76v27.902h-123.76zM610.066 510.959h123.76v27.902h-123.76zM665.936 689.082h62.532v27.902h-62.532zM633.087 194.47l16.4 11.448-80.858 115.834-16.4-11.448zM725.26 204.73l13.734 14.54L634.785 317.7l-13.733-14.539zM800.489 240.542l13.142 15.076-52.696 45.935-13.142-15.076zM468.638 187.397l27.52 56.292-17.968 8.784-27.52-56.292zM331.501 204.24l120.28 98.428-12.666 15.478-120.28-98.427zM243.412 238.813l42.402 17.49-7.626 18.488-42.402-17.49z" fill="currentColor" /></svg>`,
        optionsIcon: `<svg height="24px" width="24px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 52.93 52.93" xml:space="preserve">
<g>
	<circle style="fill:#010002;" cx="26.465" cy="25.59" r="4.462"/>
	<path style="fill:#010002;" d="M52.791,32.256c-0.187-1.034-1.345-2.119-2.327-2.492l-2.645-1.004 c-0.982-0.373-1.699-1.237-1.651-1.935c0.029-0.417,0.046-0.838,0.046-1.263c0-0.284-0.008-0.566-0.021-0.846 c-0.023-0.467,0.719-1.193,1.677-1.624l2.39-1.074c0.958-0.432,2.121-1.565,2.194-2.613c0.064-0.929-0.047-2.196-0.648-3.765 c-0.699-1.831-1.834-3.005-2.779-3.718c-0.839-0.633-2.423-0.595-3.381-0.163l-2.08,0.936c-0.958,0.431-2.274,0.119-3.025-0.616 c-0.177-0.174-0.356-0.343-0.54-0.509c-0.778-0.705-1.17-2-0.796-2.983l0.819-2.162c0.373-0.982,0.368-2.594-0.322-3.385 c-0.635-0.728-1.643-1.579-3.215-2.281c-1.764-0.788-3.346-0.811-4.483-0.639c-1.039,0.158-2.121,1.331-2.494,2.312l-0.946,2.491 c-0.373,0.982-0.798,1.775-0.949,1.771c-0.092-0.004-0.183-0.005-0.274-0.005c-0.622,0-1.238,0.03-1.846,0.09 c-1.016,0.1-2.176-0.507-2.607-1.465l-1.124-2.5c-0.431-0.959-1.538-2.21-2.589-2.227c-0.916-0.016-2.207,0.209-3.936,1.028 c-1.874,0.889-2.971,1.742-3.611,2.437c-0.712,0.771-0.554,2.416-0.122,3.374l1.481,3.296c0.431,0.958,0.256,2.266-0.324,2.979 c-0.579,0.714-1.786,1.033-2.768,0.661l-3.598-1.365c-0.982-0.373-2.65-0.476-3.406,0.256c-0.658,0.637-1.412,1.709-2.056,3.51 c-0.696,1.954-0.867,3.332-0.83,4.276c0.042,1.05,1.317,2.101,2.3,2.474l4.392,1.667c0.982,0.373,1.782,1.244,1.839,1.941 c0.055,0.699-0.635,1.61-1.593,2.042l-4.382,1.97c-0.958,0.431-2.211,1.539-2.227,2.589c-0.015,0.916,0.21,2.208,1.028,3.935 c0.89,1.874,1.742,2.971,2.437,3.611c0.773,0.713,2.417,0.554,3.375,0.123l4.698-2.112c0.958-0.432,2.076-0.412,2.525,0.013 s0.535,1.541,0.162,2.524L12.743,46.6c-0.373,0.982-0.476,2.65,0.256,3.404c0.638,0.659,1.709,1.414,3.51,2.057 c1.954,0.697,3.333,0.868,4.277,0.831c1.05-0.042,2.1-1.318,2.473-2.3l1.693-4.46c0.373-0.982,1.058-1.742,1.531-1.719 c0.284,0.014,0.57,0.021,0.857,0.021c0.134,0,0.266-0.001,0.398-0.005c0.219-0.007,0.747,0.762,1.178,1.721l1.963,4.364 c0.431,0.958,1.605,1.986,2.653,2.038c1.121,0.056,2.669-0.062,4.43-0.734c1.685-0.645,2.659-1.604,3.219-2.442 c0.584-0.873,0.388-2.517-0.044-3.475l-1.606-3.573c-0.431-0.958-0.169-2.191,0.527-2.824c0.693-0.633,2-0.9,2.981-0.526 l3.432,1.303c0.982,0.373,2.64,0.489,3.478-0.145c0.738-0.56,1.591-1.49,2.281-3.034C53.057,35.248,53.015,33.497,52.791,32.256z M26.465,39.79c-7.844,0-14.201-6.357-14.201-14.2s6.357-14.2,14.201-14.2c7.842,0,14.2,6.357,14.2,14.2 C40.666,33.433,34.307,39.79,26.465,39.79z"/>
</g>
</svg>`,
        imageIcon: `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M23 4C23 2.34315 21.6569 1 20 1H4C2.34315 1 1 2.34315 1 4V20C1 21.6569 2.34315 23 4 23H20C21.6569 23 23 21.6569 23 20V4ZM21 4C21 3.44772 20.5523 3 20 3H4C3.44772 3 3 3.44772 3 4V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V4Z" fill="currentColor"/>
<path d="M4.80665 17.5211L9.1221 9.60947C9.50112 8.91461 10.4989 8.91461 10.8779 9.60947L14.0465 15.4186L15.1318 13.5194C15.5157 12.8476 16.4843 12.8476 16.8682 13.5194L19.1451 17.5039C19.526 18.1705 19.0446 19 18.2768 19H5.68454C4.92548 19 4.44317 18.1875 4.80665 17.5211Z" fill="currentColor"/>
<path d="M18 8C18 9.10457 17.1046 10 16 10C14.8954 10 14 9.10457 14 8C14 6.89543 14.8954 6 16 6C17.1046 6 18 6.89543 18 8Z" fill="currentColor"/>
</svg>`,
        pauseAutoLoadIcon: `<svg fill="currentColor" width="24px" height="24px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
<path d="M0 26.016v-20q0-2.496 1.76-4.256t4.256-1.76h20q2.464 0 4.224 1.76t1.76 4.256v20q0 2.496-1.76 4.224t-4.224 1.76h-20q-2.496 0-4.256-1.76t-1.76-4.224zM4 26.016q0 0.832 0.576 1.408t1.44 0.576h20q0.8 0 1.408-0.576t0.576-1.408v-14.016h-24v14.016zM4 10.016h24v-4q0-0.832-0.576-1.408t-1.408-0.608h-20q-0.832 0-1.44 0.608t-0.576 1.408v4zM6.016 8v-1.984h1.984v1.984h-1.984zM10.016 8v-1.984h1.984v1.984h-1.984zM10.336 22.848l2.848-2.848-2.848-2.816 2.848-2.816 2.816 2.816 2.816-2.816 2.848 2.816-2.848 2.816 2.848 2.848-2.848 2.816-2.816-2.816-2.816 2.816zM14.016 8v-1.984h12v1.984h-12z"></path>
</svg>`,
        cherryPickIcon: `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 12.5L10.5 15L16 9M7.2 20H16.8C17.9201 20 18.4802 20 18.908 19.782C19.2843 19.5903 19.5903 19.2843 19.782 18.908C20 18.4802 20 17.9201 20 16.8V7.2C20 6.0799 20 5.51984 19.782 5.09202C19.5903 4.71569 19.2843 4.40973 18.908 4.21799C18.4802 4 17.9201 4 16.8 4H7.2C6.0799 4 5.51984 4 5.09202 4.21799C4.71569 4.40973 4.40973 4.71569 4.21799 5.09202C4 5.51984 4 6.07989 4 7.2V16.8C4 17.9201 4 18.4802 4.21799 18.908C4.40973 19.2843 4.71569 19.5903 5.09202 19.782C5.51984 20 6.07989 20 7.2 20Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
        excludeIcon: `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9 9L15 15M15 9L9 15M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
        arrowRightIcon: `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 7L15 12L10 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
        reloadImageIcon: `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 18V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M4.93 4.93L7.76 7.76" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16.24 16.24L19.07 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M2 12H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M4.93 19.07L7.76 16.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
    };
    function createControlBar() {
        const displayText = getDisplayText();
        return `
<div class="b-main" style="flex-direction:row;">
  <a class="b-main-item s-pickable" data-key="entry">${displayText.entry}</a>
  <a class="b-main-item s-pickable" data-key="collapse">${displayText.collapse}</a>
  <div class="b-main-item">
      <a class="" style="color:#ffc005;">1</a><span id="p-slash-1">/</span><span id="p-total">0</span>
  </div>
  <div class="b-main-item s-pickable" data-key="fin">
      <span>${displayText.fin}:</span><span id="p-finished">0</span>
  </div>
  <a class="b-main-item s-pickable" data-key="autoPagePlay" data-status="play">
     <span>${displayText.autoPagePlay}</span>
  </a>
  <a class="b-main-item s-pickable" data-key="autoPagePause" data-status="paused">
     <span>${displayText.autoPagePause}</span>
  </a>
  <a class="b-main-item s-pickable" data-key="config">${displayText.config}</a>
  <a class="b-main-item s-pickable" data-key="download">${displayText.download}</a>
  <a class="b-main-item s-pickable" data-key="chapters">${displayText.chapters}</a>
  <a class="b-main-item s-pickable" data-key="filter">${displayText.filter}</a>
  <div class="b-main-item">
      <div id="read-mode-select"
      ><a class="b-main-option b-main-option-selected s-pickable" data-key="pagination" data-value="pagination">${displayText.pagination}</a
      ><a class="b-main-option s-pickable" data-key="continuous" data-value="continuous">${displayText.continuous}</a
      ><a class="b-main-option s-pickable" data-key="horizontal" data-value="horizontal">${displayText.horizontal}</a></div>
  </div>
  <div class="b-main-item">
      <span>
        <a class="b-main-btn" type="button">&lt;</a>
        <a class="b-main-btn" type="button">-</a>
        <span class="b-main-input">1</span>
        <a class="b-main-btn" type="button">+</a>
        <a class="b-main-btn" type="button">&gt;</a>
      </span>
  </div>
  <div class="b-main-item">
      <span>
        <span>${icons.zoomIcon}</span>
        <a class="b-main-btn" type="button">-</a>
        <span class="b-main-input" style="width: 3rem; cursor: move;">100</span>
        <a class="b-main-btn" type="button">+</a>
      </span>
  </div>
</div>`;
    }
    function createStyleCustomPanel(root, onclose) {
        const HTML_STR = `
<div class="ehvp-custom-panel" style="min-width:30vw;">
  <div class="ehvp-custom-panel-title">
    <span>${i18n.showStyleCustom.get()}</span>
    <span id="ehvp-custom-panel-close" class="ehvp-custom-panel-close">?</span>
  </div>
  <div class="ehvp-custom-panel-container">
    <div class="ehvp-custom-panel-content">
      <div id="control-bar-example-container"></div>
      <div style="margin-top:1em;line-height:2em;">
        <input id="b-main-btn-custom-input" style="width: 30%;" type="text">
        <span id="b-main-btn-custom-confirm" class="ehvp-custom-btn ehvp-custom-btn-green">&nbspOk&nbsp</span>
        <span id="b-main-btn-custom-reset" class="ehvp-custom-btn ehvp-custom-btn-plain">&nbspReset&nbsp</span>
        <span id="b-main-btn-custom-preset1" class="ehvp-custom-btn ehvp-custom-btn-plain">&nbspPreset1&nbsp</span>
        <span id="b-main-btn-custom-preset2" class="ehvp-custom-btn ehvp-custom-btn-plain">&nbspPreset2&nbsp</span>
      </div>
      <div><span style="font-size:0.6em;color:#888;">${i18n.controlBarStyleTooltip.get()}</span></div>
    </div>
    <div class="ehvp-custom-panel-content" style="position:relative;">
      <div>
        <span class="ehvp-style-preset-btn ehvp-custom-btn ehvp-custom-btn-green" data-index="0">Preset 1</span>
        <span class="ehvp-style-preset-btn ehvp-custom-btn ehvp-custom-btn-green" data-index="1">Preset 2</span>
        <span class="ehvp-style-preset-btn ehvp-custom-btn ehvp-custom-btn-green" data-index="2">Preset 3</span>
        <span class="ehvp-style-preset-btn ehvp-custom-btn ehvp-custom-btn-green" data-index="3">Preset 4</span>
        <span class="ehvp-style-preset-btn ehvp-custom-btn ehvp-custom-btn-plain" data-index="99">Reset</span>
      </div>
      <textarea id="style-custom-input" style="width: 100%; height: 50vh;border:none;background-color:#00000090;color:#97ff97;text-align:left;vertical-align:top;font-size:1.2em;font-weight:600;">${ADAPTER.conf.customStyle ?? ""}</textarea>
      <span style="position:absolute;bottom:2em;right:1em;" class="ehvp-custom-btn ehvp-custom-btn-green" id="style-custom-confirm">&nbspApply&nbsp</span>
    </div>
  </div>
</div>
`;
        const fullPanel = document.createElement("div");
        fullPanel.classList.add("ehvp-full-panel");
        fullPanel.innerHTML = HTML_STR;
        const close = () => {
            fullPanel.remove();
            onclose?.();
        };
        fullPanel.addEventListener("click", (event) => {
            if (event.target.classList.contains("ehvp-full-panel")) close();
        });
        root.appendChild(fullPanel);
        fullPanel.querySelector(".ehvp-custom-panel-close").addEventListener("click", close);
        const controlBarContainer = fullPanel.querySelector("#control-bar-example-container");
        let pickedKey = void 0;
        controlBarContainer.innerHTML = createControlBar();
        const initPickable = () => {
            Array.from(fullPanel.querySelectorAll(".s-pickable[data-key]")).forEach((element) => {
                element.addEventListener("click", () => {
                    pickedKey = element.getAttribute("data-key") || void 0;
                    btnCustomInput.value = "";
                    if (pickedKey) btnCustomInput.focus();
                });
            });
        };
        initPickable();
        const btnCustomInput = fullPanel.querySelector("#b-main-btn-custom-input");
        const btnCustomConfirm = fullPanel.querySelector("#b-main-btn-custom-confirm");
        const btnCustomReset = fullPanel.querySelector("#b-main-btn-custom-reset");
        const confirm = () => {
            const value = btnCustomInput.value;
            btnCustomInput.value = "";
            if (!value || !pickedKey) return;
            ADAPTER.conf.displayText[pickedKey] = value;
            saveConf({ displayText: ADAPTER.conf.displayText });
            controlBarContainer.innerHTML = createControlBar();
            initPickable();
        };
        btnCustomConfirm.addEventListener("click", confirm);
        btnCustomInput.addEventListener("keypress", (ev) => ev.key === "Enter" && confirm());
        btnCustomReset.addEventListener("click", () => {
            btnCustomInput.value = "";
            ADAPTER.conf.displayText = {};
            saveConf({ displayText: ADAPTER.conf.displayText });
            controlBarContainer.innerHTML = createControlBar();
            initPickable();
        });
        for (let i = 0; i < 2; i++) fullPanel.querySelector(`#b-main-btn-custom-preset${i + 1}`).addEventListener("click", () => {
            ADAPTER.conf.displayText = displayTextPreset(i);
            saveConf({ displayText: ADAPTER.conf.displayText });
            controlBarContainer.innerHTML = createControlBar();
            initPickable();
        });
        const styleCustomInput = fullPanel.querySelector("#style-custom-input");
        const styleCustomConfirm = fullPanel.querySelector("#style-custom-confirm");
        styleCustomInput.addEventListener("keydown", (ev) => {
            if (ev.key === "Tab") {
                ev.preventDefault();
                const cursor = styleCustomInput.selectionStart;
                const left = styleCustomInput.value.slice(0, cursor);
                const right = styleCustomInput.value.slice(cursor);
                styleCustomInput.value = left + "  " + right;
                styleCustomInput.selectionStart = cursor + 2;
                styleCustomInput.selectionEnd = cursor + 2;
            }
        });
        const applyStyleCustom = (css) => {
            root.querySelector("#ehvp-style-custom")?.remove();
            const styleElement = document.createElement("style");
            styleElement.id = "ehvp-style-custom";
            ADAPTER.conf.customStyle = css;
            saveConf({ customStyle: css });
            styleElement.innerHTML = css;
            root.appendChild(styleElement);
        };
        styleCustomConfirm.addEventListener("click", () => applyStyleCustom(styleCustomInput.value));
        fullPanel.querySelectorAll(".ehvp-style-preset-btn").forEach((element) => {
            element.addEventListener("click", () => {
                const css = stylePreset(parseInt(element.getAttribute("data-index") ?? "0"));
                styleCustomInput.value = css;
                applyStyleCustom(css);
            });
        });
    }
    function stylePreset(index) {
        return [
            `.ehvp-root {
  --ehvp-theme-bg-color: #393939db;
  --ehvp-theme-font-color: #fff;
  --ehvp-thumbnail-list-bg: #000000;
  --ehvp-thumbnail-border-size: 2px;
  --ehvp-thumbnail-border-radius: 0px;
  --ehvp-thumbnail-box-shadow: none;
  --ehvp-img-fetched: #95ff97;
  --ehvp-img-failed: red;
  --ehvp-img-init: #ffffff;
  --ehvp-img-fetching: #00000000;
  --ehvp-controlbar-border: none;
  --ehvp-panel-border: none;
  --ehvp-panel-box-shadow: none;
  --ehvp-big-images-gap: 0px;
  --ehvp-big-images-bg: #000000c4;
  --ehvp-clickable-color-hover: #90ea90;
  --ehvp-playing-progress-bar-color: #ffffffd0;
  ${IS_MOBILE ? "" : "font-size: 16px;"}
  font-family: Poppins,sans-serif;
}
/** override any style here, make the big image have a green border */
/**
.bifm-container > div {
  border: 2px solid green;
}
*/`,
            `.ehvp-root {
  --ehvp-theme-bg-color: #ffffff;
  --ehvp-theme-font-color: #760098;
  --ehvp-thumbnail-list-bg: #ffffff;
  --ehvp-thumbnail-border-size: 2px;
  --ehvp-thumbnail-border-radius: 4px;
  --ehvp-thumbnail-box-shadow: 0px 2px 2px 0px #785174;
  --ehvp-img-fetched: #d96cff;
  --ehvp-img-failed: red;
  --ehvp-img-init: #000000;
  --ehvp-img-fetching: #ffffff70;
  --ehvp-controlbar-border: 2px solid #760098;
  --ehvp-panel-border: 2px solid #760098;
  --ehvp-panel-box-shadow: none;
  --ehvp-big-images-gap: 0px;
  --ehvp-big-images-bg: #919191b0;
  --ehvp-clickable-color-hover: #ff87ba;
  --ehvp-playing-progress-bar-color: #760098d0;
  ${IS_MOBILE ? "" : "font-size: 16px;"}
  font-family: Poppins, sans-serif;
}`,
            `.ehvp-root {
  --ehvp-theme-bg-color: #000000c9;
  --ehvp-theme-font-color: #ffe637;
  --ehvp-thumbnail-list-bg: #000000;
  --ehvp-thumbnail-border-size: 2px;
  --ehvp-thumbnail-border-radius: 0px;
  --ehvp-thumbnail-box-shadow: none;
  --ehvp-img-fetched: #ffe637;
  --ehvp-img-failed: red;
  --ehvp-img-init: #fff;
  --ehvp-img-fetching: #00000000;
  --ehvp-controlbar-border: 2px solid #ffe637;
  --ehvp-panel-border: 2px solid #ffe637;
  --ehvp-panel-box-shadow: none;
  --ehvp-big-images-gap: 0px;
  --ehvp-big-images-bg: #000000d6;
  --ehvp-clickable-color-hover: #90ea90;
  --ehvp-playing-progress-bar-color: #ffe637d0;
  ${IS_MOBILE ? "" : "font-size: 16px;"}
  font-family: Poppins, sans-serif;
}`,
            `.ehvp-root {
  --ehvp-theme-bg-color: #ffffff;
  --ehvp-theme-font-color: #000000;
  --ehvp-thumbnail-list-bg: #ffffff;
  --ehvp-thumbnail-border-size: 2px;
  --ehvp-thumbnail-border-radius: 4px;
  --ehvp-thumbnail-box-shadow: 0px 2px 2px 0px #000000;
  --ehvp-img-fetched: #000000;
  --ehvp-img-failed: red;
  --ehvp-img-init: #ffffff;
  --ehvp-img-fetching: #ffffff70;
  --ehvp-controlbar-border: 2px solid #000000;
  --ehvp-panel-border: 2px solid #000000;
  --ehvp-panel-box-shadow: none;
  --ehvp-big-images-gap: 0px;
  --ehvp-big-images-bg: #919191b0;
  --ehvp-clickable-color-hover: #ff0000;
  --ehvp-playing-progress-bar-color: #000000d0;
  ${IS_MOBILE ? "" : "font-size: 16px;"}
  font-family: Poppins, sans-serif;
}`
        ][index] ?? "";
    }
    function displayTextPreset(index) {
        return [{
            entry: "ENTER",
            collapse: "X",
            config: "C",
            download: "D",
            chapters: "CH.",
            filter: "FL.",
            fin: "F",
            pagination: "P",
            continuous: "C",
            horizontal: "H",
            autoPagePlay: "PLAY",
            autoPagePause: "PAUSE"
        }, {
            entry: "<?>",
            collapse: ">?<",
            config: "?",
            download: "?",
            chapters: "CH.",
            filter: "?",
            fin: "?",
            pagination: "?",
            continuous: "?",
            horizontal: "?",
            autoPagePlay: "?",
            autoPagePause: "???"
        }][index] ?? {};
    }
    var DEFAULT_DISPLAY_TEXT = {
        entry: "<?>",
        collapse: i18n.collapse.get(),
        fin: "FIN",
        autoPagePlay: i18n.autoPagePlay.get(),
        autoPagePause: i18n.autoPagePause.get(),
        config: i18n.config.get(),
        download: i18n.download.get(),
        chapters: i18n.chapters.get(),
        filter: i18n.filter.get(),
        pagination: "PAGE",
        continuous: "CONT",
        horizontal: "HORI"
    };
    function getDisplayText() {
        return {
            ...DEFAULT_DISPLAY_TEXT,
            ...ADAPTER.conf.displayText
        };
    }
    function queryRule(root, selector) {
        return Array.from(root.cssRules).find((rule) => rule.selectorText === selector);
    }
    function createActionCustomPanel(root, onclose) {
        const HTML_STR = `
<div class="ehvp-custom-panel" style="min-width:30vw;">
  <div class="ehvp-custom-panel-title">
    <span>${i18n.showActionCustom.get()}</span>
    <span id="ehvp-custom-panel-close" class="ehvp-custom-panel-close">?</span>
  </div>

  <div class="ehvp-custom-panel-container">

    <div class="ehvp-custom-panel-content">
      <div class="ehvp-custom-panel-item">
       <div class="ehvp-custom-panel-item-title">
         <span>${i18n.showActionCustom.get()}</span>
       </div>
       <div id="ehvp-image-action-values" class="ehvp-custom-panel-item-values">
         <!-- wait element created from button event -->
       </div>
      </div>
    </div>

    <div class="ehvp-custom-panel-content">
      <div class="ehvp-custom-panel-item">
        <div class="ehvp-custom-panel-item-title">
         <span>${i18n.example.get()}</span>
        </div>
        <div>
          <span class="ehvp-action-preset-btn ehvp-custom-btn ehvp-custom-btn-green" data-index="0">Example 1</span>
          <span class="ehvp-action-preset-btn ehvp-custom-btn ehvp-custom-btn-green" data-index="1">Example 2</span>
          <span class="ehvp-action-preset-btn ehvp-custom-btn ehvp-custom-btn-green" data-index="2">Example 3</span>
          <span class="ehvp-action-preset-btn ehvp-custom-btn ehvp-custom-btn-green" data-index="3">Example 4</span>
        </div>
      </div>
    </div>

    <div class="ehvp-custom-panel-content" style="position:relative;">
      <div><span style="font-size:1.6em;color:#888;">${i18n.description.get()}</span></div>
      <div>
        <div>
          <label>
            <span>${i18n.icon.get()}</span>
            <input id="ehvp-action-input-icon" style="width: 2em;" type="text">
          </label>
        </div>
        <div>
          <label>
            <span>${i18n.description.get()} (${i18n.optional.get()})</span>
            <input id="ehvp-action-input-desc" style="width: 98%;" type="text">
          </label>
        </div>
        <div>
          <label>
            <span>${i18n.workon.get()} (${i18n.optional.get()},${i18n.regexp.get()})</span>
            <input id="ehvp-action-input-workon" style="width: 98%;" type="text">
          </label>
        </div>
      </div>
      <div><span style="font-size:1.6em;color:#888;">${i18n.function.get()} ${i18n.parameters.get()}</span></div>
      <div>
        <a class="ehvp-custom-btn-green" target="_blank" href="https://github.com/MapoMagpie/comic-looms/blob/9ec4f7970983501ca3c5d8165c455a2654b52bf6/src/img-fetcher.ts#L30">imf</a>
        <a class="ehvp-custom-btn-green" target="_blank" href="https://github.com/MapoMagpie/comic-looms/blob/9ec4f7970983501ca3c5d8165c455a2654b52bf6/src/img-node.ts#L47">imn</a>
        <a class="ehvp-custom-btn-green" target="_blank" href="https://www.tampermonkey.net/documentation.php?locale=en#api:GM_xmlhttpRequest">gm_xhr</a>
        <a class="ehvp-custom-btn-green" target="_blank" href="https://github.com/MapoMagpie/comic-looms/blob/9ec4f7970983501ca3c5d8165c455a2654b52bf6/src/event-bus.ts#L8">EBUS</a>
      </div>
      <div><span style="font-size:1.6em;color:#888;">${i18n.function.get()} ${i18n.body.get()}</span></div>
      <textarea id="ehvp-action-input-funcbody" style="min-width: 60vw; height: 50vh;border:none;background-color:#00000090;color:#97ff97;text-align:left;vertical-align:top;font-size:1.2em;font-weight:600;"></textarea>
      <span id="ehvp-action-add-confirm" style="position:absolute;bottom:2em;right:1em;" class="ehvp-custom-btn ehvp-custom-btn-green">&nbspAdd&nbsp</span>
    </div>

  </div>
</div>
`;
        const fullPanel = document.createElement("div");
        fullPanel.classList.add("ehvp-full-panel");
        fullPanel.innerHTML = HTML_STR;
        const close = () => {
            fullPanel.remove();
            onclose?.();
        };
        fullPanel.addEventListener("click", (event) => {
            if (event.target.classList.contains("ehvp-full-panel")) close();
        });
        root.appendChild(fullPanel);
        fullPanel.querySelector(".ehvp-custom-panel-close").addEventListener("click", close);
        const actionsContainer = fullPanel.querySelector("#ehvp-image-action-values");
        const iconInput = fullPanel.querySelector("#ehvp-action-input-icon");
        const descInput = fullPanel.querySelector("#ehvp-action-input-desc");
        const workonInput = fullPanel.querySelector("#ehvp-action-input-workon");
        const funcbodyInput = fullPanel.querySelector("#ehvp-action-input-funcbody");
        const actionCustomComfirm = fullPanel.querySelector("#ehvp-action-add-confirm");
        function createActionValues() {
            actionsContainer.innerHTML = "";
            const tamplate = document.createElement("div");
            ADAPTER.conf.imgNodeActions.map((action) => {
                tamplate.innerHTML = `<span class="ehvp-custom-panel-item-value"><span class="ehvp-span-action-icon">${action.icon}</span><span class="ehvp-custom-btn ehvp-custom-btn-plain" style="padding:0;border:none;">&nbspx&nbsp</span></span>`;
                const element = tamplate.firstElementChild;
                actionsContainer.append(element);
                element.querySelector(".ehvp-custom-btn").addEventListener("click", () => {
                    const index = ADAPTER.conf.imgNodeActions.findIndex((a) => a.icon === action.icon && a.funcBody === action.funcBody);
                    if (index === -1) return;
                    setActionValue(action);
                    ADAPTER.conf.imgNodeActions.splice(index, 1);
                    saveConf({ imgNodeActions: ADAPTER.conf.imgNodeActions });
                    createActionValues();
                });
                element.querySelector(".ehvp-span-action-icon").addEventListener("click", () => setActionValue(action));
            });
            tamplate.remove();
        }
        createActionValues();
        function addActionCustom() {
            const icon = iconInput.value;
            const desc = descInput.value;
            const workon = workonInput.value;
            const funcBody = funcbodyInput.value;
            if (!icon) {
                confirm("icon cannot be empty!");
                return;
            }
            if (!funcBody) {
                confirm("func body cannot be empty!");
                return;
            }
            try {
                const AsyncFunction = async function () { }.constructor;
                AsyncFunction("imf", "imn", "gm_xhr", "EBUS", funcBody);
            } catch (err) {
                confirm("cannot create function (this site limit), " + err);
                return;
            }
            if (workon) try {
                new RegExp(workon);
            } catch (err) {
                confirm("invalid regexp: " + err);
                return;
            }
            ADAPTER.conf.imgNodeActions.push({
                icon,
                description: desc,
                workon,
                funcBody
            });
            saveConf({ imgNodeActions: ADAPTER.conf.imgNodeActions });
            createActionValues();
            fullPanel.querySelector(".ehvp-custom-panel-container")?.scrollTo({ top: 0 });
        }
        function setActionValue(action) {
            iconInput.value = action.icon;
            descInput.value = action.description;
            workonInput.value = action.workon ?? "";
            funcbodyInput.value = action.funcBody;
        }
        fullPanel.querySelectorAll(".ehvp-action-preset-btn").forEach((element) => {
            element.addEventListener("click", () => {
                const action = actionExample(parseInt(element.getAttribute("data-index") ?? "0"));
                if (!action) return;
                setActionValue(action);
            });
        });
        funcbodyInput.addEventListener("keydown", (ev) => {
            if (ev.key === "Tab") {
                ev.preventDefault();
                const cursor = funcbodyInput.selectionStart;
                const left = funcbodyInput.value.slice(0, cursor);
                const right = funcbodyInput.value.slice(cursor);
                funcbodyInput.value = left + "  " + right;
                funcbodyInput.selectionStart = cursor + 2;
                funcbodyInput.selectionEnd = cursor + 2;
            }
        });
        actionCustomComfirm.addEventListener("click", () => addActionCustom());
    }
    function actionExample(index) {
        return [
            {
                icon: "S",
                description: "Upload this image to local (miniserve --port 14001 --upload-files . .)",
                workon: `e[-x]hentai.org|x.com|pixiv.com`,
                funcBody: `
if (imf.stage === 3 && imf.data) {
  const formData = new FormData();
  formData.append("file", new Blob([imf.data]), imn.title);
  formData.append("path", "/");
  const p = new Promise((resolve, reject) => {
    gm_xhr({
      url: "http://localhost:14001/upload?path=/",
      method: "POST",
      timeout: 10 * 1000,
      data: formData,
      onload: () => resolve(true),
      onabort: () => reject("abort"),
      onerror: (ev) => reject(ev.error),
      ontimeout: () => reject("timeout"),
    });
  });
  await p;
}
  `
            },
            {
                icon: "换",
                description: "Download and Replace this image",
                workon: ".*",
                funcBody: `
const p = new Promise((resolve, reject) => {
  gm_xhr({
    url: "https://media.senscritique.com/media/000022161329/0/les_miserables_shoujo_cosette.jpg",
    method: "GET",
    responseType: "blob",
    timeout: 10 * 1000,
    onload: (ev) => resolve(ev.response),
    onabort: () => reject("abort"),
    onerror: (ev) => reject(ev.error),
    ontimeout: () => reject("timeout"),
  });
});
const data = await p;
return {data};
  `
            },
            {
                icon: "?",
                description: "Cherry pick this image",
                funcBody: `EBUS.emit("add-cherry-pick-range", imf.chapterIndex, imf.index, true, false);`
            },
            {
                icon: "?",
                description: "Cherry pick but exclude this image",
                funcBody: `EBUS.emit("add-cherry-pick-range", imf.chapterIndex, imf.index, false, false);`
            }
        ][index];
    }
    var AppEventDesc = class {
        defaultKeys;
        icon;
        cb;
        noPreventDefault = false;
        noKeyboard = false;
        constructor(defaultKeys, icon, cb, noPreventDefault, noKeyboard) {
            this.defaultKeys = defaultKeys;
            this.icon = icon;
            this.cb = cb;
            this.noPreventDefault = noPreventDefault ?? false;
            this.noKeyboard = noKeyboard ?? false;
        }
    };
    function initEvents(HTML, BIFM, FVGM, IFQ, IL, PH) {
        function modNumberConfigEvent(key, data, value, siteName) {
            if (!value) {
                const range = {
                    colCount: [1, 12],
                    rowHeight: [50, 4096],
                    threads: [0, 10],
                    maxPreloadDistance: [0, 200],
                    maxIdleThreads: [0, 10],
                    downloadThreads: [1, 10],
                    timeout: [2, 40],
                    autoPageSpeed: [1, 100],
                    preventScrollPageTime: [-1, 9e4],
                    paginationIMGCount: [1, 10],
                    scrollingDelta: [1, 5e3],
                    scrollingSpeed: [1, 100]
                };
                let mod = 1;
                if (key === "preventScrollPageTime" || key === "rowHeight" || key === "scrollingDelta") mod = ADAPTER.conf[key] < 1 ? 1 : ADAPTER.conf[key] === 1 ? 9 : 10;
                if (data === "add") value = Math.min(ADAPTER.conf[key] + mod, range[key][1]);
                else if (data === "minus") value = Math.max(ADAPTER.conf[key] - mod, range[key][0]);
            }
            if (value === void 0) return;
            ADAPTER.conf[key] = value;
            const inputElement = q(`#${key}Input`, HTML.config.panel);
            inputElement.value = ADAPTER.conf[key].toString();
            if (key === "colCount" || key === "rowHeight") EBUS.emit("fvg-layout-resize");
            if (key === "paginationIMGCount") {
                q("#paginationInput", HTML.paginationAdjustBar).textContent = ADAPTER.conf.paginationIMGCount.toString();
                const imgRule = queryRule(HTML.styleSheet, ".bifm-container-page .bifm-img");
                if (imgRule) imgRule.style.maxWidth = ADAPTER.conf.imgScale === 100 && ADAPTER.conf.paginationIMGCount === 1 ? "100%" : "";
                BIFM.setNow(IFQ[IFQ.currIndex]);
            }
            saveConf({ [key]: value }, siteName ?? ADAPTER.conf.selectedSiteNameConfig);
        }
        function modBooleanConfigEvent(key, value) {
            const inputElement = q(`#${key}Checkbox`, HTML.config.panel);
            if (value !== void 0) inputElement.checked = value;
            else value = inputElement.checked || false;
            if (value === void 0) return;
            ADAPTER.conf[key] = value;
            saveConf({ [key]: value }, ADAPTER.conf.selectedSiteNameConfig);
            if (key === "autoLoad") {
                IL.autoLoad = ADAPTER.conf.autoLoad;
                IL.abort(0, ADAPTER.conf.restartIdleLoader / 3);
            }
            if (key === "reversePages") BIFM.changeLayout();
        }
        function changeReadModeEvent(value, siteName) {
            if (value) ADAPTER.conf.readMode = value;
            BIFM.changeLayout();
            ADAPTER.conf.autoPageSpeed = ADAPTER.conf.readMode === "pagination" ? 5 : 1;
            saveConf({
                readMode: ADAPTER.conf.readMode,
                autoPageSpeed: ADAPTER.conf.autoPageSpeed
            }, siteName ?? ADAPTER.conf.selectedSiteNameConfig);
            q("#autoPageSpeedInput", HTML.config.panel).value = ADAPTER.conf.autoPageSpeed.toString();
            Array.from(HTML.readModeSelect.querySelectorAll(".b-main-option")).forEach((element) => {
                if (element.getAttribute("data-value") === ADAPTER.conf.readMode) element.classList.add("b-main-option-selected");
                else element.classList.remove("b-main-option-selected");
            });
            if (ADAPTER.conf.readMode === "pagination") HTML.root.querySelectorAll(".img-land").forEach((element) => element.style.display = "");
            else HTML.root.querySelectorAll(".img-land").forEach((element) => element.style.display = "none");
        }
        function modSelectConfigEvent(key, value) {
            const inputElement = q(`#${key}Select`, HTML.config.panel);
            if (value) inputElement.value = value;
            else value = inputElement.value;
            if (!value) return;
            ADAPTER.conf[key] = value;
            if (key === "readMode") {
                changeReadModeEvent();
                return;
            }
            saveConf({ [key]: value }, ADAPTER.conf.selectedSiteNameConfig);
            if (key === "minifyPageHelper") switch (ADAPTER.conf.minifyPageHelper) {
                case "always":
                    PH.minify("bigImageFrame");
                    break;
                case "inBigMode":
                case "never":
                    PH.minify(BIFM.visible ? "bigImageFrame" : "fullViewGrid");
                    break;
            }
            if (key === "gridMode") EBUS.emit("fvg-layout-change");
        }
        function modTextConfigEvent(key, value) {
            const inputElement = q(`#${key}TextInput`, HTML.config.panel);
            if (value) inputElement.value = value;
            else value = inputElement.value;
            ADAPTER.conf[key] = value;
            saveConf({ [key]: value }, ADAPTER.conf.selectedSiteNameConfig);
        }
        const cancelIDContext = {};
        function collapsePanelEvent(target, id) {
            if (id) abortMouseleavePanelEvent(id);
            const timeoutId = window.setTimeout(() => target.classList.add("p-collapse"), 100);
            if (id) cancelIDContext[id] = timeoutId;
        }
        function abortMouseleavePanelEvent(id) {
            (id ? [id] : [...Object.keys(cancelIDContext)]).forEach((k) => {
                window.clearTimeout(cancelIDContext[k]);
                delete cancelIDContext[k];
            });
        }
        function togglePanelEvent(idPrefix, collapse, target) {
            const id = `${idPrefix}-panel`;
            const element = q("#" + id, HTML.pageHelper);
            if (!element) return;
            if (collapse === void 0) {
                togglePanelEvent(idPrefix, !element.classList.contains("p-collapse"), target);
                return;
            }
            if (collapse) collapsePanelEvent(element, id);
            else {
                Array.from(HTML.root.querySelectorAll(".p-panel")).filter((ele) => ele !== element).forEach((ele) => collapsePanelEvent(ele, ele.id));
                element.classList.remove("p-collapse");
                if (target) relocateElement(element, target, HTML.root.clientWidth, HTML.root.clientHeight);
            }
        }
        const bodyOverflow = document.body.style.overflow;
        function showFullViewGrid() {
            HTML.root.classList.remove("ehvp-root-collapse");
            if (BIFM.visible) {
                BIFM.root.focus();
                PH.minify("bigImageFrame");
            } else {
                HTML.fullViewGrid.focus();
                PH.minify("fullViewGrid");
            }
            document.body.style.overflow = "hidden";
        }
        function hiddenFullViewGrid() {
            PH.minify("exit");
            HTML.entryBTN.setAttribute("data-stage", "exit");
            HTML.root.classList.add("ehvp-root-collapse");
            if (BIFM.visible) BIFM.root.blur();
            else HTML.fullViewGrid.blur();
            document.body.style.overflow = bodyOverflow;
        }
        function initAppEvents() {
            return {
                inBigImageMode: {
                    "exit-big-image-mode": new AppEventDesc(["escape", "enter"], icons.exitIcon, () => BIFM.hidden()),
                    "step-image-prev": new AppEventDesc(["arrowleft"], icons.prevIcon, () => {
                        BIFM.callbackOnWheel?.();
                        BIFM.stepNext(ADAPTER.conf.reversePages ? "next" : "prev");
                    }),
                    "step-image-next": new AppEventDesc(["arrowright"], icons.nextIcon, () => {
                        BIFM.callbackOnWheel?.();
                        BIFM.stepNext(ADAPTER.conf.reversePages ? "prev" : "next");
                    }),
                    "step-to-first-image": new AppEventDesc(["home"], "GO 1", () => BIFM.stepNext("next", 0, 1)),
                    "step-to-last-image": new AppEventDesc(["end"], "GO End", () => BIFM.stepNext("prev", 0, -1)),
                    "scale-image-increase": new AppEventDesc(["="], icons.zoomOutIcon, () => BIFM.scaleBigImages(1, 5)),
                    "scale-image-decrease": new AppEventDesc(["-"], icons.zoomInIcon, () => BIFM.scaleBigImages(-1, 5)),
                    "scroll-image-up": new AppEventDesc([
                        "pageup",
                        "arrowup",
                        "shift+space"
                    ], "UP", (event) => {
                        if (!event) return;
                        const key = parseKey(event);
                        const noPrevent = ["pageup", "shift+space"].includes(key);
                        let customKey = ![
                            "pageup",
                            "arrowup",
                            "shift+space"
                        ].includes(key);
                        BIFM.onWheel(new WheelEvent("wheel", { deltaY: ADAPTER.conf.scrollingDelta * -1 }), noPrevent, customKey, void 0, event);
                    }, true),
                    "scroll-image-down": new AppEventDesc([
                        "pagedown",
                        "arrowdown",
                        "space"
                    ], "DN", (event) => {
                        if (!event) return;
                        const key = parseKey(event);
                        const noPrevent = ["pagedown", "space"].includes(key);
                        const customKey = ![
                            "pagedown",
                            "arrowdown",
                            "space"
                        ].includes(key);
                        BIFM.onWheel(new WheelEvent("wheel", { deltaY: ADAPTER.conf.scrollingDelta }), noPrevent, customKey, void 0, event);
                    }, true),
                    "toggle-auto-play": new AppEventDesc(["p"], icons.playIcon, () => EBUS.emit("toggle-auto-play")),
                    "round-read-mode": new AppEventDesc(["alt+m"], icons.switchReadModeIcon, () => {
                        const readModeList = [
                            "pagination",
                            "continuous",
                            "horizontal"
                        ];
                        modSelectConfigEvent("readMode", readModeList[(readModeList.indexOf(ADAPTER.conf.readMode) + 1) % readModeList.length]);
                    }, true),
                    "toggle-reverse-pages": new AppEventDesc(["alt+f"], icons.reverseIcon, () => modBooleanConfigEvent("reversePages", !ADAPTER.conf.reversePages), true),
                    "rotate-image": new AppEventDesc(["alt+r"], icons.rotateIcon, () => EBUS.emit("bifm-rotate-image"), true),
                    "cherry-pick-current": new AppEventDesc(["alt+x"], "PICK", () => BIFM.cherryPickCurrent(false), true),
                    "exclude-current": new AppEventDesc(["shift+alt+x"], "EXCLUDE", () => BIFM.cherryPickCurrent(true), true),
                    "go-prev-chapter": new AppEventDesc(["shift+alt+w"], icons.prevChapterIcon, () => EBUS.emit("pf-step-chapters", "prev"), true),
                    "go-next-chapter": new AppEventDesc(["alt+w"], icons.nextChapterIcon, () => EBUS.emit("pf-step-chapters", "next"), true)
                },
                inFullViewGrid: {
                    "open-big-image-mode": new AppEventDesc(["enter"], icons.imageIcon, (event) => {
                        let target;
                        if (event instanceof MouseEvent && event.relatedTarget instanceof HTMLDivElement) target = event.relatedTarget.querySelector("a") ?? void 0;
                        else if (numberRecord && numberRecord.length > 0) {
                            let start = Number(numberRecord.join("")) - 1;
                            numberRecord = null;
                            if (isNaN(start)) return;
                            start = Math.max(0, Math.min(start, IFQ.length - 1));
                            target = IFQ[start].node.root?.querySelector("a") ?? void 0;
                        } else target = IFQ[IFQ.currIndex].node.root?.querySelector("a") ?? void 0;
                        target?.dispatchEvent(new MouseEvent("click", {
                            bubbles: false,
                            cancelable: true
                        }));
                    }),
                    "open-in-new-tab": new AppEventDesc(["alt+o"], icons.openInNewTabIcon, (event) => {
                        if (event instanceof MouseEvent && event.relatedTarget) {
                            const href = event.relatedTarget?.querySelector("a")?.href;
                            if (href) {
                                const an = document.createElement("a");
                                an.href = href;
                                an.target = "_blank";
                                an.click();
                                an.remove();
                            }
                        }
                    }, false, true),
                    "cherry-pick-select": new AppEventDesc([""], icons.cherryPickIcon, (event) => {
                        if (event instanceof MouseEvent && event.relatedTarget) {
                            const index = parseInt(event.relatedTarget?.getAttribute("data-index") ?? "");
                            if (isNaN(index) || index < 0) return;
                            EBUS.emit("add-cherry-pick-range", FVGM.chapterIndex, index, true, false);
                        }
                    }, false, true),
                    "cherry-pick-select-range": new AppEventDesc([""], `<span>?</span>${icons.cherryPickIcon}`, (event) => {
                        if (event instanceof MouseEvent && event.relatedTarget) {
                            const index = parseInt(event.relatedTarget?.getAttribute("data-index") ?? "");
                            if (isNaN(index) || index < 0) return;
                            EBUS.emit("add-cherry-pick-range", FVGM.chapterIndex, index, true, true);
                        }
                    }, false, true),
                    "cherry-pick-exclude": new AppEventDesc([""], icons.excludeIcon, (event) => {
                        if (event instanceof MouseEvent && event.relatedTarget) {
                            const index = parseInt(event.relatedTarget?.getAttribute("data-index") ?? "");
                            if (isNaN(index) || index < 0) return;
                            EBUS.emit("add-cherry-pick-range", FVGM.chapterIndex, index, false, false);
                        }
                    }, false, true),
                    "cherry-pick-exclude-range": new AppEventDesc([""], `<span>?</span>${icons.excludeIcon}`, (event) => {
                        if (event instanceof MouseEvent && event.relatedTarget) {
                            const index = parseInt(event.relatedTarget?.getAttribute("data-index") ?? "");
                            if (isNaN(index) || index < 0) return;
                            EBUS.emit("add-cherry-pick-range", FVGM.chapterIndex, index, false, true);
                        }
                    }, false, true),
                    "reload-image": new AppEventDesc([""], `${icons.reloadImageIcon}`, (event) => {
                        if (event instanceof MouseEvent && event.relatedTarget) {
                            const index = parseInt(event.relatedTarget?.getAttribute("data-index") ?? "");
                            if (isNaN(index) || index < 0) return;
                            IFQ[index].resetStage();
                            IFQ[index].start();
                        }
                    }, false, true),
                    "pause-auto-load-temporarily": new AppEventDesc(["alt+p"], icons.pauseAutoLoadIcon, () => {
                        IL.autoLoad = !IL.autoLoad;
                        if (IL.autoLoad) {
                            IL.abort(IFQ.currIndex, ADAPTER.conf.restartIdleLoader / 3);
                            EBUS.emit("notify-message", "info", "Auto load Restarted", 3 * 1e3);
                        } else EBUS.emit("notify-message", "info", "Auto load Pause", 3 * 1e3);
                    }),
                    "exit-full-view-grid": new AppEventDesc(["escape"], icons.exitIcon, () => EBUS.emit("toggle-main-view", false)),
                    "columns-increase": new AppEventDesc(["="], "COL+", () => modNumberConfigEvent("colCount", "add")),
                    "columns-decrease": new AppEventDesc(["-"], "COL-", () => modNumberConfigEvent("colCount", "minus")),
                    "toggle-auto-play": new AppEventDesc(["p"], icons.playIcon, () => EBUS.emit("toggle-auto-play")),
                    "retry-fetch-next-page": new AppEventDesc(["alt+n"], icons.refetchNextIcon, () => EBUS.emit("pf-retry-extend")),
                    "resize-flow-vision": new AppEventDesc(["alt+r"], icons.resizeGridIcon, () => EBUS.emit("fvg-layout-resize")),
                    "start-download": new AppEventDesc(["shift+alt+d"], icons.downloadIcon, () => EBUS.emit("start-download", () => PH.minify("fullViewGrid", false))),
                    "go-prev-chapter": new AppEventDesc(["shift+alt+w"], icons.prevChapterIcon, () => EBUS.emit("pf-step-chapters", "prev"), true),
                    "go-next-chapter": new AppEventDesc(["alt+w"], icons.nextChapterIcon, () => EBUS.emit("pf-step-chapters", "next"), true)
                },
                inMain: {
                    "open-full-view-grid": new AppEventDesc(["enter"], "OPEN", (event) => {
                        if (event instanceof KeyboardEvent) {
                            if (parseKey(event) === "enter") {
                                const activeElement = document.activeElement;
                                if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLSelectElement || activeElement?.isContentEditable) return;
                            }
                        }
                        EBUS.emit("toggle-main-view", true);
                    }, true),
                    "start-download": new AppEventDesc(["shift+alt+d"], icons.downloadIcon, () => {
                        EBUS.emit("start-download", () => PH.minify("exit", false));
                    }, true)
                }
            };
        }
        const appEvents = initAppEvents();
        let numberRecord = null;
        function bigImageFrameKeyBoardEvent(event) {
            if (HTML.bigImageFrame.classList.contains("big-img-frame-collapse")) return;
            const key = parseKey(event);
            const found = Object.entries(appEvents.inBigImageMode).filter((entry) => !entry[1].noKeyboard).find(([id, desc]) => {
                const override = ADAPTER.conf.keyboards.inBigImageMode[id];
                return override !== void 0 && override.length > 0 ? override.includes(key) : desc.defaultKeys.includes(key);
            });
            if (!found) return;
            const [_, desc] = found;
            if (!desc.noPreventDefault) event.preventDefault();
            desc.cb(event);
        }
        function fullViewGridKeyBoardEvent(event) {
            if (HTML.root.classList.contains("ehvp-root-collapse")) return;
            const key = parseKey(event);
            const found = Object.entries(appEvents.inFullViewGrid).filter((entry) => !entry[1].noKeyboard).find(([id, desc]) => {
                const override = ADAPTER.conf.keyboards.inFullViewGrid[id];
                return override !== void 0 && override.length > 0 ? override.includes(key) : desc.defaultKeys.includes(key);
            });
            if (found) {
                const [_, desc] = found;
                if (!desc.noPreventDefault) event.preventDefault();
                desc.cb(event);
            } else if (event instanceof KeyboardEvent && event.key.length === 1 && event.key >= "0" && event.key <= "9") {
                numberRecord = numberRecord ? [...numberRecord, Number(event.key)] : [Number(event.key)];
                event.preventDefault();
            }
        }
        function keyboardEvent(event) {
            if (!HTML.root.classList.contains("ehvp-root-collapse")) return;
            if (!HTML.bigImageFrame.classList.contains("big-img-frame-collapse")) return;
            const key = parseKey(event);
            const found = Object.entries(appEvents.inMain).filter((entry) => !entry[1].noKeyboard).find(([id, desc]) => {
                const override = ADAPTER.conf.keyboards.inMain[id];
                return override !== void 0 && override.length > 0 ? override.includes(key) : desc.defaultKeys.includes(key);
            });
            if (!found) return;
            const [_, desc] = found;
            if (!desc.noPreventDefault) event.preventDefault();
            desc.cb(event);
        }
        function focus() {
            BIFM.visible ? HTML.bigImageFrame.focus() : HTML.fullViewGrid.focus();
        }
        function showHelpGuideEvent() {
            createHelpPanel(HTML.root, focus);
        }
        function showKeyboardCustomEvent() {
            createKeyboardCustomPanel(appEvents, HTML.root, focus);
        }
        function showSiteProfilesEvent() {
            createSiteProfilePanel(HTML.root, focus);
        }
        function showStyleCustomEvent() {
            createStyleCustomPanel(HTML.root, focus);
        }
        function showActionCustomEvent() {
            createActionCustomPanel(HTML.root, focus);
        }
        return {
            modNumberConfigEvent,
            modBooleanConfigEvent,
            modSelectConfigEvent,
            modTextConfigEvent,
            togglePanelEvent,
            showFullViewGrid,
            hiddenFullViewGrid,
            fullViewGridKeyBoardEvent,
            bigImageFrameKeyBoardEvent,
            keyboardEvent,
            showGuideEvent: showHelpGuideEvent,
            collapsePanelEvent,
            abortMouseleavePanelEvent,
            showKeyboardCustomEvent,
            showSiteProfilesEvent,
            showStyleCustomEvent,
            showActionCustomEvent,
            changeReadModeEvent,
            appEvents
        };
    }
    var Layout = class { };
    var FullViewGridManager = class {
        root;
        queue = [];
        done = false;
        chapterIndex = 0;
        layout;
        resizedNodesPending = [];
        debouncer;
        constructor(HTML, BIFM) {
            this.root = HTML.fullViewGrid;
            this.debouncer = new Debouncer();
            if (ADAPTER.conf.gridMode === "flow") this.layout = new FlowVisionLayout(this.root);
            else this.layout = new GRIDLayout(this.root, HTML.styleSheet);
            EBUS.subscribe("pf-on-appended", (_total, nodes, chapterIndex, done) => {
                if (this.chapterIndex > -1 && chapterIndex !== this.chapterIndex) return;
                this.append(nodes);
                this.done = done || false;
                setTimeout(() => this.renderCurrView(), 200);
            });
            EBUS.subscribe("pf-change-chapter", (index) => {
                this.chapterIndex = index;
                this.layout.reset();
                this.queue = [];
                this.done = false;
            });
            EBUS.subscribe("ifq-do", (_, imf) => {
                if (!BIFM.visible) return;
                if (imf.chapterIndex !== this.chapterIndex) return;
                if (!imf.node.root) return;
                let scrollTo = 0;
                if (ADAPTER.conf.gridMode === "flow") scrollTo = imf.node.root.parentElement.offsetTop - window.screen.availHeight / 3;
                else scrollTo = imf.node.root.offsetTop - window.screen.availHeight / 3;
                scrollTo = scrollTo <= 0 ? 0 : scrollTo >= this.root.scrollHeight ? this.root.scrollHeight : scrollTo;
                if (this.root.scrollTo.toString().includes("[native code]")) this.root.scrollTo({
                    top: scrollTo,
                    behavior: "smooth"
                });
                else this.root.scrollTop = scrollTo;
            });
            EBUS.subscribe("cherry-pick-changed", (chapterIndex) => this.chapterIndex === chapterIndex && this.updateRender());
            this.root.addEventListener("scroll", () => this.debouncer.addEvent("FULL-VIEW-SCROLL-EVENT", () => {
                if (HTML.root.classList.contains("ehvp-root-collapse")) return;
                this.renderCurrView();
                this.tryExtend();
            }, 400));
            this.root.addEventListener("click", (event) => {
                if (event.target === HTML.fullViewGrid || event.target.classList.contains("fvg-sub-container")) EBUS.emit("toggle-main-view", false);
            });
            EBUS.subscribe("fvg-layout-change", () => {
                this.layout.remove(this.root);
                if (ADAPTER.conf.gridMode === "flow") this.layout = new FlowVisionLayout(this.root);
                else this.layout = new GRIDLayout(this.root, HTML.styleSheet);
                this.layout.resize(this.queue);
                this.renderCurrView();
            });
            EBUS.subscribe("fvg-layout-resize", () => {
                this.layout.resize(this.queue);
                this.renderCurrView();
            });
            EBUS.subscribe("imf-resize", (imf) => this.resizedNodes(imf));
            // 窗口尺寸变化会改变缩略图的实际显示尺寸，重新排布并重渲染可见缩略图，使画布按新尺寸重新采样
            window.addEventListener("resize", () => this.debouncer.addEvent("FULL-VIEW-RESIZE-EVENT", () => {
                if (HTML.root.classList.contains("ehvp-root-collapse")) return;
                this.layout.resize(this.queue);
                this.renderCurrView();
            }, 300));
        }
        resizedNodes(imf) {
            const node = imf.node;
            if (node.root) this.resizedNodesPending.push(node.root);
            this.debouncer.addEvent("RESIZED-NODES", () => {
                if (this.resizedNodesPending.length === 0) return;
                let node = null;
                while (node = this.resizedNodesPending.shift()) {
                    const remove = this.layout.resizedNode(node, this.resizedNodesPending);
                    this.resizedNodesPending = this.resizedNodesPending.filter((_, i) => !remove.includes(i));
                }
            }, 50);
        }
        append(nodes) {
            if (nodes.length > 0) {
                let index = this.queue.length;
                const list = nodes.map((n) => {
                    const ret = {
                        node: n,
                        element: n.create(),
                        ratio: n.ratio()
                    };
                    ret.element.setAttribute("data-index", index.toString());
                    index++;
                    return ret;
                });
                this.queue.push(...list);
                this.layout.append(list);
            }
        }
        tryExtend() {
            if (this.done) return;
            if (this.layout.nearBottom()) EBUS.emit("pf-try-extend");
        }
        updateRender() {
            this.queue.forEach(({ node }) => node.isRender() && node.render());
        }
        renderCurrView() {
            const [se, ee] = this.layout.visibleRange(this.root, this.queue.map((e) => e.element));
            let [start, end] = [parseInt(se.getAttribute("data-index") ?? "-1"), parseInt(ee.getAttribute("data-index") ?? "-1")];
            if (start > -1) {
                this.queue.slice(start, end + 1).forEach((e) => e.node.render(true));
                evLog("info", "render curr view, range: ", `[${start}-${end}]`);
            } else evLog("error", "render curr view error, range: ", `[${start}-${end}]`);
        }
        mouseOn(x, y) {
            const [se, ee] = this.layout.visibleRange(this.root, this.queue.map((e) => e.element));
            let [start, end] = [parseInt(se.getAttribute("data-index") ?? "-1"), parseInt(ee.getAttribute("data-index") ?? "-1")];
            if (start > -1) return this.queue.slice(start, end + 1).find((e) => {
                const rect = e.element.getBoundingClientRect();
                if (rect.x < x && rect.x + rect.width > x) {
                    if (rect.y < y && rect.y + rect.height > y) return true;
                }
                return false;
            })?.element;
        }
    };
    var GRIDLayout = class extends Layout {
        root;
        style;
        constructor(root, style) {
            super();
            this.root = root;
            this.style = style;
            this.root.classList.add("fvg-grid");
            this.root.classList.remove("fvg-flow");
        }
        append(nodes) {
            this.root.append(...nodes.map((l) => l.element));
        }
        nearBottom() {
            const nodes = Array.from(this.root.childNodes);
            if (nodes.length === 0) return false;
            const lastImgNode = nodes[nodes.length - 1];
            if (this.root.scrollTop + this.root.clientHeight + this.root.clientHeight * 2.5 < lastImgNode.offsetTop + lastImgNode.offsetHeight) return false;
            return true;
        }
        reset() {
            this.root.innerHTML = "";
        }
        resize(allNodes) {
            const rule = queryRule(this.style, ".fvg-grid");
            if (rule) rule.style.gridTemplateColumns = `repeat(${ADAPTER.conf.colCount}, minmax(10px, 1fr))`;
            this.root.innerHTML = "";
            this.append(allNodes);
        }
        resizedNode(_node, pending) {
            return pending.map((_, i) => i);
        }
        visibleRange(container, children) {
            if (children.length === 0) return [container, container];
            const vh = container.offsetHeight;
            let first;
            let last;
            let overRow = 0;
            for (let i = 0; i < children.length; i += ADAPTER.conf.colCount) {
                const rect = children[i].getBoundingClientRect();
                const visible = rect.top + rect.height >= 0 && rect.top <= vh;
                if (visible) {
                    if (first === void 0) first = children[i];
                }
                if (first && !visible) overRow++;
                if (overRow >= 2) {
                    last = children[Math.min(children.length - 1, i + ADAPTER.conf.colCount)];
                    break;
                }
            }
            last = last ?? children[children.length - 1];
            return [first ?? last, last];
        }
        remove(root) {
            root.innerHTML = "";
        }
    };
    var FlowVisionLayout = class extends Layout {
        root;
        lastRow;
        count = 0;
        resizeObserver;
        lastRootWidth;
        base;
        constructor(root) {
            super();
            this.root = root;
            this.root.classList.add("fvg-flow");
            this.root.classList.remove("fvg-grid");
            this.lastRootWidth = this.root.offsetWidth;
            this.base = this.initBaseline();
            this.resizeObserver = new ResizeObserver((entries) => {
                const root = entries[0];
                const width = root.contentRect.width;
                if (this.lastRootWidth !== width) {
                    this.lastRootWidth = width;
                    Array.from(root.target.querySelectorAll(".fvg-sub-container")).forEach((row) => this.resizeRow(row));
                }
            });
            this.resizeObserver.observe(this.root);
        }
        initBaseline() {
            return {
                height: ADAPTER.conf.rowHeight,
                columns: ADAPTER.conf.colCount,
                gap: 8
            };
        }
        createRow(lastRowHeight) {
            const container = document.createElement("div");
            container.classList.add("fvg-sub-container");
            container.style.height = (lastRowHeight ?? this.base.height) + "px";
            container.style.marginTop = this.base.gap + "px";
            this.root.appendChild(container);
            return container;
        }
        append(nodes) {
            for (const node of nodes) {
                node.element.style.marginLeft = this.base.gap + "px";
                if (!this.lastRow) this.lastRow = this.createRow();
                if (this.checkRowFilled(this.lastRow, node.ratio)) {
                    this.resizeRow(this.lastRow);
                    this.lastRow = this.createRow(this.lastRow?.offsetHeight);
                }
                this.lastRow.appendChild(node.element);
                this.count++;
            }
        }
        checkRowFilled(row, newNodeRatio) {
            if (row.childElementCount === 0) return false;
            let filled = row.childElementCount >= this.base.columns;
            if (!filled) {
                let nodeWidth = this.base.height * newNodeRatio;
                const allGap = row.childElementCount * this.base.gap + this.base.gap;
                const factor = .4 / Math.max(1, newNodeRatio);
                nodeWidth = nodeWidth * factor;
                filled = this.childrenRatio(row).reduce((width, curr) => width + curr * this.base.height, 0) + allGap + nodeWidth >= this.root.offsetWidth;
            }
            return filled;
        }
        childrenRatio(row) {
            const ret = [];
            const ratio = (c) => {
                let ratio = parseFloat(c.getAttribute("data-ratio") ?? "1");
                ratio = isNaN(ratio) ? 1 : ratio;
                return ratio;
            };
            row.childNodes.forEach((c) => ret.push(ratio(c)));
            return ret;
        }
        resizeRow(row) {
            const ratio = this.childrenRatio(row).reduce((sum, cur) => sum + cur, 0);
            const allGap = row.childElementCount * this.base.gap + this.base.gap;
            const rowHeight = (this.root.offsetWidth - allGap) / ratio;
            row.style.height = rowHeight + "px";
        }
        resize(allNodes) {
            this.base = this.initBaseline();
            this.root.innerHTML = "";
            this.lastRow = void 0;
            this.append(allNodes);
        }
        resizedNode(node, pending) {
            let row = node.parentElement;
            if (!row) return [];
            const fragment = document.createDocumentFragment();
            let children = [];
            function* next() {
                fragment.append(...children);
                if (row.childElementCount > 0) {
                    const newChildren = Array.from(row.childNodes).map((child) => child);
                    fragment.append(...newChildren);
                    children.push(...newChildren);
                }
                let child = null;
                while (child = children.shift()) yield child;
                const nextRow = row?.nextElementSibling;
                if (nextRow) {
                    children = Array.from(nextRow.childNodes).map((child) => child);
                    while (child = children.shift()) yield child;
                }
            }
            let remove = [];
            let movedImgNode = 0, changedRows = 1;
            while (true) {
                for (const child of next()) {
                    const ratio = parseFloat(child.getAttribute("data-ratio") ?? "1");
                    if (this.checkRowFilled(row, ratio)) {
                        children.unshift(child);
                        this.resizeRow(row);
                        break;
                    }
                    const index = pending.indexOf(child);
                    if (index >= 0) remove.push(index);
                    movedImgNode++;
                    row.appendChild(child);
                }
                row = row?.nextElementSibling;
                if (row === null) row = this.createRow();
                if (children.length === 0) {
                    if (row.childElementCount === 0) row.remove();
                    break;
                }
                if (children.length === row.childElementCount && children[0] === row.firstElementChild) break;
                changedRows++;
            }
            evLog("info", `resizedNode moved img-nodes [${movedImgNode}], changed rows [${changedRows}], resized [${remove.length}]`);
            return remove;
        }
        nearBottom() {
            const last = this.lastRow;
            if (!last) return false;
            if (this.root.scrollTop + this.root.clientHeight + this.root.clientHeight * 2.5 < last.offsetTop + last.offsetHeight) return false;
            return true;
        }
        reset() {
            this.lastRow = void 0;
            this.root.innerHTML = "";
        }
        visibleRange() {
            const children = Array.from(this.root.querySelectorAll(".fvg-sub-container"));
            if (children.length === 0) return [this.root, this.root];
            const vh = this.root.offsetHeight;
            let first;
            let last;
            let overRow = 0;
            for (let i = 0; i < children.length; i++) {
                const rect = children[i].getBoundingClientRect();
                const visible = rect.top + rect.height >= 0 && rect.top <= vh;
                if (visible) {
                    if (first === void 0) first = children[i].firstElementChild;
                }
                if (first && !visible) overRow++;
                if (overRow >= 2) {
                    last = children[i].lastElementChild;
                    break;
                }
            }
            last = last ?? children[children.length - 1].lastElementChild;
            return [first ?? last, last];
        }
        remove(root) {
            root.innerHTML = "";
        }
    };
    function toPositions(vw, vh, mouseX, mouseY) {
        const pos = {
            vw,
            vh
        };
        if (mouseX <= vw / 2) pos.left = Math.max(mouseX, 5);
        else pos.right = Math.max(vw - mouseX, 5);
        if (mouseY <= vh / 2) pos.top = Math.max(mouseY, 5);
        else pos.bottom = Math.max(vh - mouseY, 5);
        return pos;
    }
    function dragElement(element, callbacks, dragHub) {
        (dragHub ?? element).addEventListener("mousedown", (event) => {
            event.preventDefault();
            const wh = window.innerHeight;
            const ww = window.innerWidth;
            const abort = new AbortController();
            callbacks.onStart?.(event.clientX, event.clientY);
            document.addEventListener("mousemove", (event) => {
                callbacks.onMoving?.(toPositions(ww, wh, event.clientX, event.clientY));
            }, { signal: abort.signal });
            document.addEventListener("mouseup", () => {
                abort.abort();
                callbacks.onFinish?.(toPositions(ww, wh, event.clientX, event.clientY));
            }, { once: true });
        });
    }
    function dragElementWithLine(event, element, lock, callback) {
        if (event.buttons !== 1) return;
        document.querySelector("#drag-element-with-line")?.remove();
        const canvas = document.createElement("canvas");
        canvas.id = "drag-element-with-line";
        canvas.style.position = "fixed";
        canvas.style.zIndex = "100000";
        canvas.style.top = "0px";
        canvas.style.left = "0px";
        canvas.style.width = "100vw";
        canvas.style.height = "100vh";
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
        const rect = element.getBoundingClientRect();
        const height = Math.floor(rect.height / 2.2);
        const [startX, startY] = [rect.left + rect.width / 2, rect.top + rect.height / 2];
        const ctx = canvas.getContext("2d", { alpha: true });
        const abort = new AbortController();
        canvas.addEventListener("mouseup", () => {
            document.body.removeChild(canvas);
            abort.abort();
        }, { once: true });
        canvas.addEventListener("mousemove", (evt) => {
            const [endX, endY] = [lock.x ? startX : evt.clientX, lock.y ? startY : evt.clientY];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = "#ffffffa0";
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(endX, endY, height, 0, 2 * Math.PI);
            ctx.fillStyle = "#ffffffa0";
            ctx.fill();
            callback(toMouseMoveData(startX, startY, endX, endY));
        }, { signal: abort.signal });
    }
    function toMouseMoveData(startX, startY, endX, endY) {
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        return {
            start: {
                x: startX,
                y: startY
            },
            end: {
                x: endX,
                y: endY
            },
            distance,
            direction: 1 << (startY > endY ? 3 : 2) | 1 << (startX > endX ? 1 : 0)
        };
    }
    function styleCSS() {
        return `
.ehvp-root {
  --ehvp-theme-bg-color: #333343bb;
  --ehvp-theme-font-color: #fff;
  --ehvp-thumbnail-list-bg: #000;
  --ehvp-thumbnail-border-size: 2px;
  --ehvp-thumbnail-border-radius: 5px;
  --ehvp-thumbnail-box-shadow: none;
  --ehvp-img-fetched: #90ffae;
  --ehvp-img-failed: red;
  --ehvp-img-init: #fff;
  --ehvp-img-fetching: #ffffff70;
  --ehvp-controlbar-border: 1px solid #2f7b10;
  --ehvp-panel-border: none;
  --ehvp-panel-box-shadow: none;
  --ehvp-big-images-gap: 0px;
  --ehvp-big-images-bg: #000000d6;
  --ehvp-clickable-color-hover: #90ea90;
  --ehvp-playing-progress-bar-color: #ffffffd0;
  font-size: 16px;
  font-family: Poppins,sans-serif;
}
.ehvp-root {
  width: 100%;
  height: 100%;
  background-color: #000;
  position: fixed;
  top: 0px;
  left: 0px;
  z-index: 2000;
  box-sizing: border-box;
  overflow: clip;
}
.ehvp-root input[type="checkbox"] {
  width: 1em;
  height: unset !important;
}
.ehvp-root select {
  width: 8em;
  height: 2em;
}
.ehvp-root input {
  width: 3em;
  height: 1.5em;
}
.config-panel-item input.text-input {
  width: 10em;
  cursor: auto;
}
.ehvp-root-collapse {
  height: 0;
}
.fvg-flow {
  width: 100%;
  height: 100%;
  overflow: hidden scroll;
  background: var(--ehvp-thumbnail-list-bg);
}
.fvg-grid {
  width: 100%;
  height: 100%;
  display: grid;
  align-content: start;
  grid-gap: 0.7em;
  grid-template-columns: repeat(${ADAPTER.conf.colCount}, minmax(10px, 1fr));
  overflow: hidden scroll;
  padding: 0.3em;
  box-sizing: border-box;
  background: var(--ehvp-thumbnail-list-bg);
}
.ehvp-root input, .ehvp-root select {
  color: var(--ehvp-theme-font-color);
  background-color: var(--ehvp-theme-bg-color);
  border: 1px solid #000000;
  border-radius: 4px;
  margin: 0px;
  padding: 0px;
  text-align: center;
  vertical-align: middle;
}
.ehvp-root input:enabled:hover, .ehvp-root select:enabled:hover, .ehvp-root input:enabled:focus, .ehvp-root select:enabled:focus {
  background-color: #34355b !important;
}
.ehvp-root select option {
  background-color: #34355b !important;
  color: #f1f1f1;
  font-size: 1em;
}
.p-label {
  cursor: pointer;
  height: 2em;
}
.p-label > span {
  white-space: nowrap;
}
.p-label > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  padding-right: 1.5em;
}
.p-label > span:first-child > .p-tooltip {
  position: absolute;
  right: 0.2em;
}
.full-view-grid, .big-img-frame {
  outline: none !important;
}
.img-node {
  position: relative;
  padding: var(--ehvp-thumbnail-border-size);
  box-sizing: border-box;
  background-color: var(--ehvp-img-init);
  border-radius: var(--ehvp-thumbnail-border-radius);
  box-shadow: var(--ehvp-thumbnail-box-shadow);
}
.fvg-sub-container {
  display: flex;
  width: 100%;
  flex-wrap: nowrap;
  /**
  contain: content;
  scollbar-width: none;
  */
}
/**
.full-view-grid::-webkit-scrollbar {
  display: none;
}
*/
.fvg-sub-container .img-node {
  height: 100%;
}
.fvg-sub-container .img-node a {
  width: 100%;
  height: 100%;
}
.img-node canvas, .img-node img {
  width: 100%;
  height: 100%;
  border-radius: var(--ehvp-thumbnail-border-radius);
}
.img-node-numtip {
  position: absolute;
  top: 0;
  left: 0.5em;
  font-size: 1.8em;
  font-weight: 900;
  height: 1.8em;
  line-height: 1.8em;
  text-shadow: 0px 0px 3px #000000;
  color: var(--ehvp-theme-font-color);
  display: none;
}
.img-node:hover .img-node-numtip {
  display: block;
}
.img-node > a {
  display: block;
  line-height: 0;
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}
.img-node-actions {
  position: absolute;
  bottom: 10px;
  height: 1.2em;
  left: 0;
  z-index: 1;
}
.img-node-action-btn {
  line-height: 1.2em;
  border: 1px solid #efe;
  text-align: center;
  border-radius: 5px;
  color: #efe;
  font-weight: 900;
  background-color: #1f1f1fc7;
  margin-left: 0.3em;
  text-shadow: #000 1px 0 10px;
  cursor: pointer;
}
.img-node-action-btn:hover {
  border: 1px solid yellow;
  color: yellow;
}
.img-node-action-btn-processing {
  animation: btn-rotate 1s linear infinite;
}
.img-node-action-btn-done {
  border: 1px solid #6eff84;
  color: #6eff84;
}
.img-node-action-btn-error {
  border: 1px solid red;
  color: red;
}
@keyframes btn-rotate {
	0% {
    transform: rotate(0.0turn);
	}
	100% {
    transform: rotate(1.0turn);
	}
}
.ehvp-chapter-description, .img-node-error-hint {
  display: block;
  position: absolute;
  bottom: 0px;
  left: 0px;
  background-color: #708090e3;
  color: #ffe785;
  width: 100%;
  font-weight: 700;
  min-height: 3em;
  font-size: 0.8em;
  padding: 0.5em;
  box-sizing: border-box;
  line-height: 1.3em;
  z-index: 10;
}
.img-node-error-hint {
  color: #8a0000;
}
.img-fetched {
  background-color: var(--ehvp-img-fetched);
}
.img-fetch-failed {
  background-color: var(--ehvp-img-failed);
}
.img-fetching {
  background-color: var(--ehvp-img-fetching);
}
.img-excluded {
  filter: brightness(0.3);
}
.img-fetching::after {
  content: '';
  position: absolute;
  top: 0%;
  left: 0%;
  width: 30%;
  height: 30%;
  background-color: #ff0000;
  animation: img-loading 1s linear infinite;
}
@keyframes img-loading {
	25% {
    background-color: #ff00ff;
    top: 0%;
    left: 70%;
	}
	50% {
    background-color: #00ffff;
    top: 70%;
    left: 70%;
	}
	75% {
    background-color: #ffff00;
    top: 70%;
    left: 0%;
	}
}
.big-img-frame::-webkit-scrollbar {
  display: none;
}
.big-img-frame {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  right: 0;
  overflow: auto;
  scrollbar-width: none;
  z-index: 2001;
  background: var(--ehvp-big-images-bg);
  display: flex;
}
.bifm-container > div {
  box-sizing: border-box;
}
.bifm-container-vert {
  width: ${ADAPTER.conf.imgScale}%;
  height: fit-content;
  margin: 0 auto;
}
.bifm-container-hori {
  width: fit-content;
  height: ${ADAPTER.conf.imgScale}%;
  margin: auto 0;
  display: flex;
  flex-wrap: nowrap;
}
.bifm-container-page {
  width: fit-content;
  height: ${ADAPTER.conf.imgScale}%;
  margin: 0 auto;
  display: flex;
  flex-wrap: nowrap;
}
.bifm-container-vert > div {
  margin: var(--ehvp-big-images-gap) 0px;
}
.bifm-container-hori > div {
  margin: 0px var(--ehvp-big-images-gap);
}
.bifm-container-page > div {
  height: 100%;
  margin: 0px var(--ehvp-big-images-gap);
  display: flex;
}
.bifm-node-hide {
  position: fixed;
  left: -100%;
  z-index: -1000;
  opacity: 0;
}
.bifm-container-page .bifm-img {
  ${ADAPTER.conf.imgScale === 100 && ADAPTER.conf.paginationIMGCount === 1 ? "max-width: 100%;" : ""}
}
.bifm-img {
  height: 100%;
  object-fit: contain;
  display: block;
}
.bifm-rotate-90 {
  transform: rotate(90deg);
  width: 100vh;
  height: 100vw;
  transform-origin: 0px 0px;
  left: 100vw;
}
.bifm-rotate-180 {
  transform: rotate(180deg);
}
.bifm-rotate-270 {
  transform: rotate(270deg);
  width: 100vh;
  height: 100vw;
  transform-origin: 0px 0px;
  left: 0px;
  top: 100vh;
}
#bifm-loading-helper {
  position: fixed;
  z-index: 3000;
  display: none;
  padding: 0px 3px;
  background-color: #ffffff90;
  font-weight: blod;
  left: 0px;
}
.ehvp-root-collapse .big-img-frame {
  position: unset;
}
.p-helper {
  position: fixed;
  z-index: 2011 !important;
  box-sizing: border-box;
  top: ${ADAPTER.conf.pageHelperAbTop};
  left: ${ADAPTER.conf.pageHelperAbLeft};
  bottom: ${ADAPTER.conf.pageHelperAbBottom};
  right: ${ADAPTER.conf.pageHelperAbRight};
}
.p-panel {
  z-index: 2012 !important;
  background-color: var(--ehvp-theme-bg-color);
  box-sizing: border-box;
  position: fixed;
  color: var(--ehvp-theme-font-color);
  padding: 3px;
  border-radius: 4px;
  font-weight: 800;
  overflow: hidden;
  width: 24em;
  height: 32em;
  max-height: 75vh;
  border: var(--ehvp-panel-border);
  box-shadow: var(--ehvp-panel-box-shadow);
}
.clickable {
  text-decoration-line: underline;
  user-select: none;
  text-align: center;
  white-space: nowrap;
}
.clickable:hover {
  color: var(--ehvp-clickable-color-hover) !important;
}
.p-collapse {
  height: 0px !important;
  padding: 0px !important;
  border: none !important;
}
.b-main {
  display: flex;
  user-select: none;
  flex-direction: ${ADAPTER.conf.pageHelperAbLeft === "unset" ? "row-reverse" : "row"};
  flex-wrap: wrap-reverse;
}
.b-main-item {
  box-sizing: border-box;
  border: var(--ehvp-controlbar-border);
  border-radius: 4px;
  background-color: var(--ehvp-theme-bg-color);
  color: var(--ehvp-theme-font-color);
  font-weight: 800;
  padding: 0em 0.3em;
  margin: 0em 0.2em;
  position: relative;
  white-space: nowrap;
  font-size: 1em;
  line-height: 1.2em;
}
.b-main-option {
  padding: 0em 0.2em;
}
.b-main-option-selected {
  color: black;
  background-color: #ffffffa0;
  border-radius: 6px;
}
.b-main-btn {
  display: inline-block;
  width: 1em;
}
.b-main-input {
  color: var(--ehvp-theme-font-color);
  background-color: var(--ehvp-theme-bg-color);
  border-radius: 6px;
  display: inline-block;
  text-align: center;
  width: 1.5em;
  cursor: ns-resize;
}
.chapter-thumbnail {
  width: auto;
  height: 100%;
  aspect-ratio: 1 / 1;
  position: relative;
}
.chapter-thumbnail > #chapter-thumbnail-image-container {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  just-content: center;
  items-align: center;
  z-index: 1;
}
.chapter-thumbnail > #chapter-thumbnail-image-container > img {
  object-fit: contain;
  display: block;
  height: 100%;
  min-width: 100%;
}
.chapter-thumbnail > canvas {
  width: 100%;
  height: 100%;
  /**
  filter: blur(3px) brightness(0.5);
  */
}
.chapter-list {
  height: 100%;
  width: 100%;
  overflow: hidden auto;
  scrollbar-width: none;
  border-left: 2px solid black;
}
.chapter-list::-webkit-scrollbar {
  display: none;
}
.chapter-list-item {
  width: 100%;
  padding-left: 0.7em;
  white-space: nowrap;
  line-height: 1.8em;
  text-decoration: underline;
}
.chapter-list-item:hover {
  background-color: #cddee3ab;
}
.chapter-list-item-hl {
  filter: brightness(150%);
  background-color: #84c5ff6b;
}
.p-chapters {
  width: 34em;
  height: 18em;
  display: flex;
  max-height: 80%;
  max-width: 100%;
}
.p-chapters-large {
  width: 45em;
  height: 25em;
}
.p-chapters-large .chapter-thumbnail {
  width: auto;
  height: 100%;
}
.p-config {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  align-content: start;
  line-height: 2em;
  overflow: auto scroll;
  scrollbar-width: none;
}
.p-config::-webkit-scrollbar {
  display: none;
}
.p-config label {
  display: flex;
  justify-content: space-between;
  padding-right: 10px;
  margin-bottom: unset;
}
.p-config input {
  cursor: ns-resize;
}
.p-downloader {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}
.p-downloader canvas {
  /* border: 1px solid greenyellow; */
}
.p-downloader .download-notice {
  text-align: center;
  width: 100%;
}
.p-downloader .downloader-btn-group {
  align-items: center;
  text-align: right;
  width: 100%;
}
.p-btn {
  color: var(--ehvp-theme-font-color);
  cursor: pointer;
  font-weight: 800;
  background-color: var(--ehvp-theme-bg-color);
  vertical-align: middle;
  width: 1.5em;
  height: 1.5em;
  border: 1px solid #000000;
  border-radius: 4px;
}
@keyframes main-progress {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}
.big-img-frame-collapse {
  display: none;
}
.ehvp-root-collapse .img-land,
.big-img-frame-collapse .img-land,
.ehvp-root-collapse .ehvp-message-box,
.ehvp-root-collapse .p-panel
 {
  display: none !important;
}
.download-bar {
  background-color: #33333310;
  height: 0.3em;
  width: 100%;
  bottom: -0.5em;
  position: absolute;
  box-sizing: border-box;
  z-index: 2;
}
.download-bar > div {
  background-color: var(--ehvp-img-fetched);
  height: 100%;
  border: none;
}
.img-land-left, .img-land-right {
  width: 15%;
  height: 50%;
  position: fixed;
  z-index: 2004;
  top: 25%;
}
.img-land-left {
  left: 0;
  cursor: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC3UlEQVR4nO2ZS28TMRDHV0APcON1gXKisUMRJ0QFJ74EAgQfhMclF15nCqk2noTHcVF2nDRCqBc+AZUKRYR3U0olaODK47JoNiqU0mjX9uymSPlLI0Vayfv72157ZuJ5Qw01lLMCL9gKxfAESLwMAutK4nMQ+BWE/tkL+o3z8bNi41Kl2Dhe8kpbvEGrdhAPKKlvKIlLIHVkGB9A4vXKWH00d/DqWLAXhPaV0D8swP8K1RujfK8Y7s4FXkk8B0J/cQXfwEhXCTyTGbh/1B8BqRU3OPxjBKdKJx9vY4Zv7lBSP8waHlZNSGzRO5ng/ZE84WGNCZaVyGPbQP8ou8KfHyB8RFEV4WkreDrWQOIKF8jsZDuaq7wy30pCd33R3GM++0L7nPCrsjEBEm8ZwdPtyHFJrYe3N4Hf7xam96c2QOlBVvCk2dtt8/EEXksFT0lWL0/JBv7ZnTdW4ymJS5Q0JhroZZXZwM/ff+s0riqEE8kGKCXOAL4dLERQdJsYJfTFFPsfQ274l/VOVD3UcP6mQOCD5BWgwoMR/jUu8sDLeAWepjBgnir3g3/36GNUG+eBhzhwJXkLGZ7//eDfzywzw+v4PmA1UB1vRAszy3xnvWQwYLqFaoebfU3YpQ3abQvZfMR5mVDpPmKs2wyejwkMMr3IMjch8EKiAWo6ubwkSxO+aB5LlcwpqRc3nQmBndTdPOqYuS43twkl9NVU8JwFTT8TTyZfZFvQkKgj4GpgIxPm8Jpm/6ZnKjUe7FJSf+Y0YQnfte6bQkGf5TBAYZuRVqQ+ZQX/eyUETnGZyGXrrBfVoS5FjnUIPc3W5O01d7GVI3wzGA22e5yi2eA6mZK2TYm7vb5W1KvkbDnCn/jk/MGaHLHU7qMLxnnGJX6jWS8fae308hbdjtQxs8qdBHZA4BWQep83aMUJYCGcoL4NtT6o8KDKjtKROCWJqzyco2eUElNWuSn+Zh1qKO//1y8OuBKqSFLycQAAAABJRU5ErkJggg=="), auto;
}
.img-land-right {
  right: 0;
  cursor: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADG0lEQVR4nO2ZS2tTQRTHL2oXuvO10bqymYkVV2LRlV9CVPQrdO9jE/ANPvCZcjvToju5mpxJGqtWwZ1QH4UWa1WotTUWtNWt1VJHTi6V2KbJnZmTW4X8YaAQuPP7z5nHOaee11BDDTkr8IKVMpndIzkclwwygsOwZPBNMvUzHPg3vCr9lswd60zmdqe81ApvudW9FbYIrs4JDkXJlTYcHyWHs50tmebYwbtago2SKV8w9cMC/K8hwm+kbyWz62OBFxwOSaa+uoJXMDItGByoG7i/02+SXAlqcLnICHSk9j5ZRQyfXyO46q03vJw3waGAcxLB+01xwssyEySRiGPbyKVH2hX+8DLCaxxdLLvfCh6vNclhynTCR+39+sXl13Rbialpn+U3mK8+U77pZI/b+/Xc7JxGvbwyQhgJuG4Ej6+j6SNVDj8vukjAzM1Ez+bIBjA9MJ1k9F5RV9Lzi8M0JhiciQSPSVaYpxgettacHi0sYeKSeyQEhyImjTUNhFml3SRVTRBEQiSybbUNYErsMEk1E88uuJkQTB2NsP8h67pSVU2cdzDB4E7tCGDhQXDoljTxS+unJ4dsIzAUwQBdqty9Pa8/9E1WNnFi0OKbMFV7CxEUKfUzATOxG8AxcONNxfMwcnuM3gB1tTVwrTL827vjumtbjn4LUR3iqvAZG3gV9RBDpp7w72DCCl6GEQjq/pBVg8d8Ca9X628zOFLTADad6gH/vreou13gudI+y++KlMwJriZI4e9/coaXDMYjd/OwY0YG/4AAnpcO8OlI8LYFDSZqCzX2kAZemhY0YRRU2nSichNjfZOlV9gdXuHqX/VMJVqDdYKrLzYmiOGnrfumMqEO2kxqf8+rRaOTq31W8H8iwaCDCiaWrbNQWIdSFDnGg6kesiZv2NyFQozw+aA5WO1RClfD5may2TYp6vZ6ubBXadNyjDA+Ox9YkysW2334wDivOIfvuOrpHYW1XtzC1xE7Zla5E4NxyeCU5GqTt9wqJYCJbBv2bbD1gYUHVnaYjpRSklKVB4P4G6bEmFX+E/9mbagh7//Xb5hJEJPq8mugAAAAAElFTkSuQmCC"), auto;
}
.p-tooltip { }
.p-tooltip .p-tooltiptext {
  display: none;
  max-width: 34em;
  background-color: var(--ehvp-theme-bg-color);
  color: var(--ehvp-theme-font-color);
  border-radius: 6px;
  position: fixed;
  z-index: 1;
  font-size: small;
  white-space: normal;
  text-align: left;
  padding: 0.3em 1em;
  box-sizing: border-box;
  pointer-events: none;
}
.page-loading {
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  background-color: #333333a6;
}
.page-loading-text {
  color: var(--ehvp-theme-font-color);
  font-size: 6em;
}
@keyframes rotate {
	100% {
		transform: rotate(1turn);
	}
}
.border-ani {
	position: relative;
	z-index: 0;
	overflow: hidden;
}
.border-ani::before {
	content: '';
	position: absolute;
	z-index: -2;
	left: -50%;
	top: -50%;
	width: 200%;
	height: 200%;
	background-color: #fff;
	animation: rotate 4s linear infinite;
}
.border-ani::after {
	content: '';
	position: absolute;
	z-index: -1;
	left: 6px;
	top: 6px;
	width: calc(100% - 16px);
	height: calc(100% - 16px);
	background-color: #333;
}
.overlay-tip {
  position: absolute;
  z-index: 10;
  font-weight: 800;
  top: 0.3em;
  right: 0.3em;
  font-size: 0.8em;
  color: var(--ehvp-theme-font-color);
  text-shadow: 0px 0px 3px #000000;
}
.lightgreen { color: #90ea90; }
.ehvp-full-panel {
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: #000000e8;
  z-index: 3000;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  top: 0;
}
.ehvp-custom-panel {
  min-width: 50vw;
  min-height: 50vh;
  max-width: 80vw;
  max-height: 80vh;
  background-color: var(--ehvp-theme-bg-color);
  border: 1px solid #000000;
  display: flex;
  flex-direction: column;
  text-align: start;
  color: var(--ehvp-theme-font-color);
  position: relative;
  user-select: none;
}
.ehvp-custom-panel-title {
  font-size: 1.8em;
  line-height: 2em;
  font-weight: 800;
  display: flex;
  justify-content: space-between;
  padding-left: 1em;
}
.ehvp-custom-panel-close {
  width: 2em;
  text-align: center;
}
.ehvp-custom-panel-close:hover {
  background-color: #c3c0e0;
}
.ehvp-custom-panel-container {
  overflow: auto;
  scrollbar-width: thin;
}
.ehvp-custom-panel-content {
  border: 1px solid #000000;
  border-radius: 4px;
  margin: 0.5em;
  padding: 0.5em;
}
.ehvp-custom-panel-item {
  margin: 0.2em 0em;
}
.ehvp-custom-panel-item-title {
  font-size: 1.4em;
}
.ehvp-custom-panel-item-values {
  margin-top: 0.3em;
  text-align: end;
  line-height: 1.3em;
}
.ehvp-custom-panel-item-value {
  font-size: 1.1em;
  font-weight: 800;
  color: black;
  background-color: #c5c5c5;
  border: 1px solid #000000;
  box-sizing: border-box;
  margin-left: 0.3em;
  display: inline-flex;
}
.ehvp-custom-panel-item-value span {
  padding: 0em 0.5em;
}
.ehvp-custom-panel-item-value button {
  background-color: #fff;
  color: black;
  border: none;
}
.ehvp-custom-panel-item-value button:hover {
  background-color: #ffff00;
}
.ehvp-custom-panel-item-input, .ehvp-custom-panel-item-span {
  font-size: 1.1em;
  font-weight: 800;
  background-color: #7fef7b;
  color: black;
  border: none;
}
.ehvp-custom-panel-item-span {
  background-color: #34355b;
  color: white;
}
.ehvp-custom-panel-item-add-btn:hover {
  background-color: #ffff00 !important;
}
.ehvp-custom-panel-list > li {
  line-height: 3em;
  margin-left: 0.5em;
  font-size: 1.4em;
}
.ehvp-custom-panel-checkbox:hover {
  border: 1px solid var(--ehvp-theme-font-color);
}
.ehvp-custom-panel-list-item-disable {
  text-decoration: line-through;
  color: red;
}
.ehvp-help-panel > div > h2 {
  color: #c1ffc9;
}
.ehvp-help-panel > div > p {
  font-size: 1.1em;
  margin-left: 1em;
  font-weight: 600;
}
.ehvp-help-panel > div > ul {
  font-size: 1em;
}
.ehvp-help-panel > div a {
  color: #ff5959;
}
.ehvp-help-panel > div strong {
  color: #d76d00;
}
.bifm-vid-ctl {
  position: fixed;
  z-index: 2010;
  padding: 3px 10px;
  bottom: 0.2em;
  ${ADAPTER.conf.pageHelperAbLeft === "unset" ? "left: 0.2em;" : "right: 0.2em;"}
}
.bifm-vid-ctl > div {
  display: flex;
  align-items: center;
  line-height: 1.2em;
}
.bifm-vid-ctl > div > * {
  margin: 0 0.1em;
}
.bifm-vid-ctl:not(:hover) .bifm-vid-ctl-btn,
.bifm-vid-ctl:not(:hover) .bifm-vid-ctl-span,
.bifm-vid-ctl:not(:hover) #bifm-vid-ctl-volume
{
  opacity: 0;
}
.bifm-vid-ctl-btn {
  height: 1.5em;
  width: 1.5em;
  font-size: 1.2em;
  padding: 0;
  margin: 0;
  border: none;
  background-color: #00000000;
  cursor: pointer;
}
#bifm-vid-ctl-volume {
  width: 5em;
  height: 0.5em;
}
.bifm-vid-ctl-pg {
  border: 1px solid #00000000;
  background-color: #3333337e;
  -webkit-appearance: none;
}
#bifm-vid-ctl-pg {
  width: 100%;
  height: 0.2em;
  background-color: #333333ee;
}
.bifm-vid-ctl:hover {
  background-color: var(--ehvp-theme-bg-color);
}
.bifm-vid-ctl:hover #bifm-vid-ctl-pg {
  height: 0.8em;
}
.bifm-vid-ctl-pg-inner {
  background-color: #ffffffa0;
  height: 100%;
}
.bifm-vid-ctl:hover #bifm-vid-ctl-pg .bifm-vid-ctl-pg-inner {
  background-color: #fff;
}
.bifm-vid-ctl-span {
  color: white;
  font-weight: 800;
}
.download-middle {
  width: 100%;
  height: auto;
  flex-grow: 1;
  overflow: hidden;
}
.download-middle .ehvp-tabs + div {
  width: 100%;
  height: calc(100% - 2em);
}
.ehvp-tabs {
  height: 2em;
  width: 100%;
  line-height: 2em;
}
.ehvp-p-tab {
  border: 1px dotted #ff0;
  font-size: 1em;
  padding: 0 0.4em;
}
.download-chapters, .download-status, .download-cherry-pick {
  width: 100%;
  height: 100%;
}
.download-chapters {
  overflow: hidden auto;
}
.download-chapters label {
  white-space: nowrap;
}
.download-chapters label span {
  margin-left: 0.5em;
}
.ehvp-p-tab-selected {
  color: rgb(120, 240, 80) !important;
}
.ehvp-message-box {
  position: fixed;
  z-index: 4001;
  top: 0;
  left: 0;
}
.ehvp-message {
  margin-top: 1em;
  margin-left: 1em;
  line-height: 2em;
  background-color: #ffffffd6;
  border-radius: 6px;
  padding-left: 0.3em;
  position: relative;
  box-shadow: inset 0 0 5px 2px #8273ff;
  color: black;
}
.ehvp-message > button {
  border: 1px solid #00000000;
  margin-left: 1em;
  color: black;
  background-color: #00000000;
  height: 2em;
  width: 2em;
  text-align: center;
  font-weight: 800;
}
.ehvp-message > button:hover {
  background-color: #444;
}
.ehvp-message-duration-bar {
  position: absolute;
  bottom: 0;
  width: 0%;
  left: 0;
  height: 0.1em;
  background: red;
}
.ehvp-custom-btn {
  border: 1px solid #000;
  font-weight: 700;
  color: #000;
  background-color: #ffffff80;
}
.ehvp-custom-btn-plain {
  background-color: #aaa;
}
.ehvp-custom-btn-green {
  background-color: #7fef7b;
}
.ehvp-custom-btn:hover {
  border: 1px solid #fff;
  color: #333;
  background-color: #ffffff90;
  filter: brightness(150%);
}
.ehvp-custom-btn:active {
  color: #ccc;
}
.ehvp-custom-panel-list-item-title {
  display: flex;
  justify-content: space-between;
  border-bottom: 2px solid #000;
  padding: 0em 1em;
}
.ehvp-custom-panel-title:hover, .ehvp-custom-panel-list-item-title:hover {
  background-color: #33333388;
}
.s-pickable:hover {
  border: 1px solid red;
  filter: brightness(150%);
}
#tag-candidates > .tc-selected {
  color: red;
  background-color: #fff;
}
#tag-candidates > li:hover {
  color: green;
  background-color: #aaa;
}
#auto-page-progress {
  height: 100%;
  width: 0%;
  position: absolute;
  top: 0px;
  left: 0px;
  background: var(--ehvp-playing-progress-bar-color);
}
.ehvp-context-menu {
  width: 18em;
  height: auto;
  position: fixed;
  background-color: #00000080;
  z-index: 2003;
  border: 2px solid white;
  padding: 7px;
}
.ehvp-context-menu-tooltip {
  text-align: center;
  color: var(--ehvp-theme-font-color);
  font-weight: bold;
  white-space: nowrap;
}
.ehvp-context-menu-grid {
  display: grid;
  grid-template-columns: repeat(5, auto);
  justify-content: center;
  grid-column-gap: 12px;
}
.ehvp-context-menu-grid > .ehvp-context-menu-item {
  height: 3em;
  color: #000;
  background-color: #fff6f6;
  margin: 0.3em 0;
  width: 3em;
  white-space: nowrap;
  box-shadow: 4px 4px black;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
}
.ehvp-context-menu-grid > .ehvp-context-menu-item:hover {
  background-color: #f6ffb4;
  color: #000;
}
.ehvp-context-menu-grid > .ehvp-context-menu-item:active {
  background-color: #99ff9f;
  color: #fff;
}
@media (max-width: ${IS_MOBILE ? "1440px" : "720px"}) {
  .ehvp-root {
    font-size: 4cqw;
  }
  .ehvp-root-collapse #entry-btn {
    font-size: 2.2em;
  }
  .p-helper {
    bottom: 0px;
    left: 0px;
    top: unset;
    right: unset;
  }
  .b-main {
    flex-direction: row;
  }
  .b-main-item {
    font-size: 1.3em;
    margin-top: 0.2em;
  }
  #pagination-adjust-bar,
  #scale-bar
  {
    display: none;
  }
  .p-panel {
    width: 100%;
    font-size: 5cqw;
  }
  .p-chapters {
    width: 100%;
  }
  .ehvp-custom-panel {
    max-width: 100%;
  }
  .ehvp-root input, .ehvp-root select {
    width: 2em;
    height: 1.2em;
    font-size: 1em;
  }
  .ehvp-root select {
    width: 7em !important;
  }
  .p-btn {
    font-size: 1em;
  }
  .bifm-vid-ctl {
    display: none;
  }
  .ehvp-custom-panel-list-item-title {
    display: block;
  }
  .chapter-thumbnail {
    display: none;
  }
  .bifm-container-hori > div {
    width: 100%;
  }
}
`;
    }
    var DownloaderPanel = class {
        root;
        panel;
        canvas;
        tabStatus;
        tabChapters;
        tabCherryPick;
        statusElement;
        chaptersElement;
        cherryPickElement;
        noticeElement;
        forceBTN;
        startBTN;
        btn;
        constructor(root) {
            this.root = root;
            this.btn = q("#downloader-panel-btn", root);
            this.panel = q("#downloader-panel", root);
            this.canvas = q("#downloader-canvas", root);
            this.tabStatus = q("#download-tab-status", root);
            this.tabChapters = q("#download-tab-chapters", root);
            this.tabCherryPick = q("#download-tab-cherry-pick", root);
            this.statusElement = q("#download-status", root);
            this.chaptersElement = q("#download-chapters", root);
            this.cherryPickElement = q("#download-cherry-pick", root);
            this.noticeElement = q("#download-notice", root);
            this.forceBTN = q("#download-force", root);
            this.startBTN = q("#download-start", root);
            this.panel.addEventListener("transitionend", () => EBUS.emit("downloader-canvas-resize"));
        }
        initTabs() {
            const elements = [
                this.statusElement,
                this.chaptersElement,
                this.cherryPickElement
            ];
            const tabs = [
                {
                    ele: this.tabStatus,
                    cb: () => {
                        elements.forEach((e, i) => e.hidden = i != 0);
                        EBUS.emit("downloader-canvas-resize");
                    }
                },
                {
                    ele: this.tabChapters,
                    cb: () => {
                        elements.forEach((e, i) => e.hidden = i != 1);
                    }
                },
                {
                    ele: this.tabCherryPick,
                    cb: () => {
                        elements.forEach((e, i) => e.hidden = i != 2);
                        q("#download-cherry-pick-input", this.cherryPickElement).focus();
                    }
                }
            ];
            tabs.forEach(({ ele, cb }, i) => {
                ele.addEventListener("click", () => {
                    ele.classList.add("ehvp-p-tab-selected");
                    tabs.filter((_, j) => j != i).forEach((t) => t.ele.classList.remove("ehvp-p-tab-selected"));
                    cb();
                });
            });
        }
        switchTab(tabID) {
            switch (tabID) {
                case "status":
                    this.tabStatus.click();
                    break;
                case "chapters":
                    this.tabChapters.click();
                    break;
                case "cherry-pick":
                    this.tabCherryPick.click();
                    break;
            }
        }
        initNotice(btns) {
            this.noticeElement.innerHTML = "";
            btns.forEach((b) => {
                const a = document.createElement("a");
                a.textContent = b.btn;
                a.classList.add("clickable");
                a.style.color = "gray";
                a.style.margin = "0em 0.5em";
                a.addEventListener("click", b.cb);
                this.noticeElement.append(a);
            });
        }
        abort(stage) {
            this.flushUI(stage);
            this.normalizeBTN();
        }
        flushUI(stage) {
            this.startBTN.style.color = stage === "downloadFailed" ? "red" : "";
            this.startBTN.textContent = i18n[stage].get();
            this.btn.style.color = stage === "downloadFailed" ? "red" : "";
        }
        noticeableBTN() {
            if (!this.btn.classList.contains("lightgreen")) {
                this.btn.classList.add("lightgreen");
                if (!/✓/.test(this.btn.textContent)) this.btn.textContent += "✓";
            }
        }
        normalizeBTN() {
            this.btn.textContent = this.btn.textContent.replace("✓", "");
            this.btn.classList.remove("lightgreen");
        }
        createChapterSelectList(chapters, selectedChapters) {
            const selectAll = chapters.length === 1;
            this.chaptersElement.innerHTML = `
      <div>
        <span id="download-chapters-select-all" class="clickable">Select All</span>
        <span id="download-chapters-unselect-all" class="clickable">Unselect All</span>
        <span id="download-chapters-add-new" class="clickable">Add New Chapters</span>
      </div>
      ${chapters.map((c, i) => `<div><label>
        <input type="checkbox" id="ch-${c.id}" value="${c.id}" ${selectAll || selectedChapters.find((sel) => sel.index === i) ? "checked" : ""} />
        <span>${c.title}</span></label></div>`).join("")}`;
            [["#download-chapters-select-all", true], ["#download-chapters-unselect-all", false]].forEach(([id, checked]) => this.chaptersElement.querySelector(id)?.addEventListener("click", () => chapters.forEach((c) => {
                const checkbox = this.chaptersElement.querySelector("#ch-" + c.id);
                if (checkbox) checkbox.checked = checked;
            })));
            this.chaptersElement.querySelector("#download-chapters-add-new")?.addEventListener("click", (event) => {
                function modal(root, target, inner, onComfirm) {
                    const div = document.createElement("div");
                    div.style.position = "fixed";
                    div.style.zIndex = "2100";
                    div.style.padding = "3px";
                    div.style.backgroundColor = "var(--ehvp-theme-bg-color)";
                    div.style.border = "var(--ehvp-panel-border)";
                    div.style.borderRadius = "5px";
                    div.innerHTML = `
          <div style="display: flex; justify-content: center; margin: 10px 2px;">${inner}</div>
          <div style="display: flex; justify-content: center;">
            <button class="ehvp-custom-btn ehvp-modal-btn-cancel" style="background-color: gray;">Cancel</button>
            <button class="ehvp-custom-btn ehvp-modal-btn-confirm" style="background-color: var(--ehvp-clickable-color-hover);">Confirm</button>
          </div>
        `;
                    root.appendChild(div);
                    div.querySelector(".ehvp-modal-btn-cancel")?.addEventListener("click", () => div.remove());
                    div.querySelector(".ehvp-modal-btn-confirm")?.addEventListener("click", () => onComfirm(div).finally(() => div.remove()));
                    relocateElement(div, target, root.offsetWidth, root.offsetHeight);
                }
                modal(this.root, event.target, `<input id="download-chapters-add-input" style="width: 250px; background-color: #ffffff80;" placeholder="https://example.com" />`, async (div) => {
                    const value = div.querySelector("#download-chapters-add-input")?.value;
                    if (!value) return;
                    const future = EBUS.emit("pf-append-chapters", value);
                    if (future) await future;
                });
            });
        }
        selectedChapters() {
            const idSet = new Set();
            this.chaptersElement.querySelectorAll("input[type=checkbox][id^=ch-]:checked").forEach((checkbox) => idSet.add(Number(checkbox.value)));
            return idSet;
        }
        initCherryPick(onAdd, onRemove, onClear, getRangeList) {
            let chapterIndex = 0;
            function addRangeElements(container, rangeList, onRemove) {
                container.querySelectorAll(".ehvp-custom-panel-item-value").forEach((e) => e.remove());
                const tamplate = document.createElement("div");
                rangeList.forEach((range) => {
                    tamplate.innerHTML = `<span class="ehvp-custom-panel-item-value" data-id="${range.id}"><span >${range.toString()}</span><span class="ehvp-custom-btn ehvp-custom-btn-plain" style="padding:0;border:none;">&nbspx&nbsp</span></span>`;
                    const element = tamplate.firstElementChild;
                    element.style.backgroundColor = range.positive ? "#7fef7b" : "#ffa975";
                    container.appendChild(element);
                    element.querySelector(".ehvp-custom-btn").addEventListener("click", (event) => {
                        const parent = event.target.parentElement;
                        onRemove(parent.getAttribute("data-id"));
                        parent.remove();
                    });
                    tamplate.remove();
                });
            }
            const pickBTN = q("#download-cherry-pick-btn-add", this.cherryPickElement);
            const excludeBTN = q("#download-cherry-pick-btn-exclude", this.cherryPickElement);
            const clearBTN = q("#download-cherry-pick-btn-clear", this.cherryPickElement);
            const rangeBeforeSpan = q("#download-cherry-pick-btn-range-before", this.cherryPickElement);
            const rangeAfterSpan = q("#download-cherry-pick-btn-range-after", this.cherryPickElement);
            const input = q("#download-cherry-pick-input", this.cherryPickElement);
            const addCherryPick = (exclude, range) => {
                const rangeList = range ? [CherryPickRange.from((exclude ? "!" : "") + range)].filter((r) => r !== null) : (input.value || "").split(",").map((s) => (exclude ? "!" : "") + s).map(CherryPickRange.from).filter((r) => r !== null);
                if (rangeList.length > 0) rangeList.forEach((range) => {
                    const newList = onAdd(chapterIndex, range);
                    if (newList === null) return;
                    addRangeElements(this.cherryPickElement.firstElementChild, newList, (id) => onRemove(chapterIndex, id));
                });
                input.value = "";
                input.focus();
            };
            const clearPick = () => {
                onClear(chapterIndex);
                addRangeElements(this.cherryPickElement.firstElementChild, [], (id) => onRemove(chapterIndex, id));
                input.value = "";
                input.focus();
            };
            pickBTN.addEventListener("click", () => addCherryPick(false));
            excludeBTN.addEventListener("click", () => addCherryPick(true));
            clearBTN.addEventListener("click", clearPick);
            this.cherryPickElement.querySelectorAll(".download-cherry-pick-follow-btn").forEach((btn) => {
                const followBTNClick = () => {
                    const step = parseInt(btn.getAttribute("data-sibling-step") || "1");
                    let sibling = btn;
                    for (let i = 0; i < step; i++) sibling = sibling.previousElementSibling;
                    if (step <= 1) clearPick();
                    addCherryPick(step > 1, sibling.getAttribute("data-range") || void 0);
                };
                btn.addEventListener("click", followBTNClick);
            });
            input.addEventListener("keypress", (event) => event.key === "Enter" && addCherryPick(false));
            let lastIndex = 0;
            EBUS.subscribe("add-cherry-pick-range", (chIndex, index, positive, shiftKey) => {
                const range = new CherryPickRange([index + 1, shiftKey ? (lastIndex ?? index) + 1 : index + 1], positive);
                if (!shiftKey) lastIndex = index;
                addRangeElements(this.cherryPickElement.firstElementChild, onAdd(chIndex, range) || [], (id) => onRemove(chIndex, id));
            });
            EBUS.subscribe("get-cherry-pick-last-index", () => lastIndex);
            EBUS.subscribe("pf-change-chapter", (index) => {
                if (index === -1) return;
                chapterIndex = index;
                addRangeElements(this.cherryPickElement.firstElementChild, getRangeList(chapterIndex) || [], (id) => onRemove(chapterIndex, id));
            });
            let pad = 0;
            EBUS.subscribe("pf-on-appended", (total) => {
                pad = total.toString().length;
                const rAfter = rangeAfterSpan.getAttribute("data-range").split("-").map((v) => v.padStart(pad, "0")).join("-");
                rangeAfterSpan.textContent = rAfter;
                rangeAfterSpan.setAttribute("data-range", rAfter);
                const rBefore = rangeBeforeSpan.getAttribute("data-range").split("-").map((v, i) => i === 1 ? total.toString() : v.padStart(pad, "0")).join("-");
                rangeBeforeSpan.textContent = rBefore;
                rangeBeforeSpan.setAttribute("data-range", rBefore);
            });
            EBUS.subscribe("ifq-do", (index) => {
                const rAfter = [1, index + 1].map((v) => v.toString().padStart(pad, "0")).join("-");
                rangeAfterSpan.textContent = rAfter;
                rangeAfterSpan.setAttribute("data-range", rAfter);
                const rBefore = rangeBeforeSpan.getAttribute("data-range").split("-").map((v, i) => i === 0 ? (index + 1).toString().padStart(pad, "0") : v).join("-");
                rangeBeforeSpan.textContent = rBefore;
                rangeBeforeSpan.setAttribute("data-range", rBefore);
            });
        }
        static html() {
            return `
<div id="downloader-panel" class="p-panel p-downloader p-collapse">
    <div id="download-notice" class="download-notice" style="font-size: 0.7em;"></div>
    <div id="download-middle" class="download-middle">
      <div class="ehvp-tabs">
        <a id="download-tab-status" class="clickable ehvp-p-tab">${i18n.status.get()}</a>
        <a id="download-tab-cherry-pick" class="clickable ehvp-p-tab">${i18n.cherryPick.get()}</a>
        <a id="download-tab-chapters" class="clickable ehvp-p-tab">${i18n.selectChapters.get()}</a>
      </div>
      <div>
        <div id="download-status" class="download-status" hidden>
          <canvas id="downloader-canvas" width="0" height="0"></canvas>
        </div>
        <div id="download-cherry-pick" class="download-cherry-pick" hidden>
          <div class="ehvp-custom-panel-item-values" style="text-align: start;">
            <div style="margin-bottom: 1rem;display: flex;">
              <input type="text" class="ehvp-custom-panel-item-input" id="download-cherry-pick-input" placeholder="1, 2-3" style="text-align: start; width: 50%; height: 1.3rem; border-radius: 0px;" />
              <span class="ehvp-custom-btn ehvp-custom-btn-green" id="download-cherry-pick-btn-add">Pick</span>
              <span class="ehvp-custom-btn ehvp-custom-btn-plain" id="download-cherry-pick-btn-exclude">Exclude</span>
              <span class="ehvp-custom-btn ehvp-custom-btn-plain" id="download-cherry-pick-btn-clear">Clear</span>
            </div>
            <div style="margin-bottom: 1rem;">
              <div style="margin-bottom: 0.2rem">
                <span class="ehvp-custom-panel-item-span" id="download-cherry-pick-btn-range-after" data-range="1-1">1-1</span><span
                 class="ehvp-custom-btn ehvp-custom-btn-green download-cherry-pick-follow-btn" data-sibling-step="1">pick</span><span
                 class="ehvp-custom-btn ehvp-custom-btn-plain download-cherry-pick-follow-btn" data-sibling-step="2">exclude</span>
              </div>
              <div>
                <span class="ehvp-custom-panel-item-span" id="download-cherry-pick-btn-range-before" data-range="1-1">1-1</span><span
                class="ehvp-custom-btn ehvp-custom-btn-green download-cherry-pick-follow-btn" data-sibling-step="1">pick</span><span
                class="ehvp-custom-btn ehvp-custom-btn-plain download-cherry-pick-follow-btn" data-sibling-step="2">exclude</span>
              </div>
            </div>
          </div>
        </div>
        <div id="download-chapters" class="download-chapters" hidden></div>
      </div>
    </div>
    <div class="download-btn-group">
       <a id="download-force" class="clickable">${i18n.forceDownload.get()}</a>
       <a id="download-start" style="color: rgb(120, 240, 80)" class="clickable">${i18n.downloadStart.get()}</a>
    </div>
</div>`;
        }
    };
    var ConfigPanel = class {
        root;
        panel;
        configSelect;
        constructor(root) {
            this.root = root;
            this.panel = q("#config-panel", root);
            this.configSelect = q("#config-a-select", root);
        }
        initEvents(events) {
            this.flushConfigItems(events);
            this.configSelect.addEventListener("click", (event) => {
                const value = event.target.getAttribute("data-value");
                if (value) {
                    ADAPTER.conf.selectedSiteNameConfig = value === "global" ? void 0 : value;
                    console.log("ADAPTER.conf.selectedSiteNameConfig: ", ADAPTER.conf.selectedSiteNameConfig);
                    Array.from(this.configSelect.querySelectorAll(".b-main-option")).forEach((element) => {
                        if (element.getAttribute("data-value") === ADAPTER.conf.selectedSiteNameConfig) element.classList.add("b-main-option-selected");
                        else if (element.getAttribute("data-value") === "global" && ADAPTER.conf.selectedSiteNameConfig === void 0) element.classList.add("b-main-option-selected");
                        else element.classList.remove("b-main-option-selected");
                    });
                    this.flushConfigItems(events);
                }
            });
            q("#show-guide-element", this.panel).addEventListener("click", events.showGuideEvent);
            q("#show-keyboard-custom-element", this.panel).addEventListener("click", events.showKeyboardCustomEvent);
            q("#show-site-profiles-element", this.panel).addEventListener("click", events.showSiteProfilesEvent);
            q("#show-style-custom-element", this.panel).addEventListener("click", events.showStyleCustomEvent);
            q("#show-action-custom-element", this.panel).addEventListener("click", events.showActionCustomEvent);
            q("#reset-config-element", this.panel).addEventListener("click", () => {
                const selectedConfig = ADAPTER.conf.selectedSiteNameConfig;
                if (resetConf(selectedConfig)) {
                    ADAPTER.conf = ADAPTER.globalConf = selectedConfig ? ADAPTER.globalConf : defaultConf();
                    ADAPTER.conf.selectedSiteNameConfig = selectedConfig;
                    this.flushConfigItems(events);
                }
            });
        }
        flushConfigItems(events) {
            const header = q("#config-panel-header", this.panel);
            Array.from(this.panel.querySelectorAll(".config-panel-item")).forEach((elem) => elem.remove());
            const nodes = ConfigItems.map(createOption).map((str) => {
                const template = document.createElement("template");
                template.innerHTML = str.trim();
                return template.content.firstElementChild;
            });
            header.after(...nodes);
            ConfigItems.forEach((item) => {
                switch (item.typ) {
                    case "number":
                        q(`#${item.key}MinusBTN`, this.panel).addEventListener("click", () => events.modNumberConfigEvent(item.key, "minus"));
                        q(`#${item.key}AddBTN`, this.panel).addEventListener("click", () => events.modNumberConfigEvent(item.key, "add"));
                        q(`#${item.key}Input`, this.panel).addEventListener("wheel", (event) => {
                            event.preventDefault();
                            if (event.deltaY < 0) events.modNumberConfigEvent(item.key, "add");
                            else if (event.deltaY > 0) events.modNumberConfigEvent(item.key, "minus");
                        });
                        break;
                    case "boolean":
                        q(`#${item.key}Checkbox`, this.panel).addEventListener("click", () => events.modBooleanConfigEvent(item.key));
                        break;
                    case "select":
                        q(`#${item.key}Select`, this.panel).addEventListener("change", () => events.modSelectConfigEvent(item.key));
                        break;
                    case "input":
                        q(`#${item.key}TextInput`, this.panel).addEventListener("change", () => events.modTextConfigEvent(item.key));
                        break;
                }
            });
            this.panel.querySelectorAll(".p-tooltip").forEach((element) => {
                const child = element.querySelector(".p-tooltiptext");
                if (!child) return;
                element.addEventListener("mouseenter", () => {
                    child.style.display = "block";
                    relocateElement(child, element, this.root.offsetWidth, this.root.offsetHeight);
                });
                element.addEventListener("mouseleave", () => child.style.display = "none");
            });
        }
        static html() {
            return `
<div id="config-panel" class="p-panel p-config p-collapse">
    <div id="config-panel-header" style="position: sticky;border: 1px solid black;grid-column-start: 1;grid-column-end: 11;padding: 0px 0.3em;top: 0;z-index: 1;background-color: #33333390">
      <div id="config-a-select"
      ><a class="b-main-option clickable ${ADAPTER.conf.selectedSiteNameConfig === void 0 ? "b-main-option-selected" : ""}" data-value="global">${i18n.global.get()}</a
      ><a class="b-main-option clickable ${ADAPTER.conf.selectedSiteNameConfig === ADAPTER.matcher.name ? "b-main-option-selected" : ""}" data-value="${ADAPTER.matcher.name}">${ADAPTER.matcher.name}</a></div>
    </div>

    <!-- config items will place here -->
    <div style="grid-column-start: 1; grid-column-end: 11; padding-left: 5px;">
        <label class="p-label">
            <span>${i18n.dragToMove.get()}:</span>
            <span id="dragHub" style="font-size: 1.85rem;cursor: grab;">?</span>
        </label>
    </div>
    <div style="grid-column-start: 1; grid-column-end: 11; padding-left: 5px; text-align: left;">
         <a id="show-guide-element" class="clickable" style="border: 1px dotted #fff; padding: 0px 3px;">${i18n.showHelp.get()}</a>
         <a id="show-keyboard-custom-element" class="clickable" style="border: 1px dotted #fff; padding: 0px 3px;">${i18n.showKeyboard.get()}</a>
         <a id="show-site-profiles-element" class="clickable" style="border: 1px dotted #fff; padding: 0px 3px;">${i18n.showSiteProfiles.get()}</a>
         <a id="show-style-custom-element" class="clickable" style="border: 1px dotted #fff; padding: 0px 3px;">${i18n.showStyleCustom.get()}</a>
         <a id="show-action-custom-element" class="clickable" style="border: 1px dotted #fff; padding: 0px 3px;">${i18n.showActionCustom.get()}</a>
         <a id="reset-config-element" class="clickable" style="border: 1px dotted #fff; padding: 0px 3px;">${i18n.resetConfig.get()}</a>
         <a class="clickable" style="border: 1px dotted #fff; padding: 0px 3px;" href="https://github.com/MapoMagpie/comic-looms" target="_blank">${i18n.letUsStar.get()}</a>
    </div>
</div>`;
        }
    };
    function createOption(item) {
        const i18nKey = item.i18nKey || item.key;
        const i18nValue = i18n[i18nKey];
        const i18nValueTooltip = i18n[`${i18nKey}Tooltip`];
        if (!i18nValue) throw new Error(`i18n key ${i18nKey} not found`);
        let display = true;
        if (item.displayInSite) display = item.displayInSite.test(location.href);
        const conf = ADAPTER.conf.selectedSiteNameConfig ? ADAPTER.conf : ADAPTER.globalConf;
        let input = "";
        switch (item.typ) {
            case "boolean":
                input = `<input id="${item.key}Checkbox" ${conf[item.key] ? "checked" : ""} type="checkbox" />`;
                break;
            case "number":
                input = `<span>
                  <button id="${item.key}MinusBTN" class="p-btn" type="button">-</button>
                  <input id="${item.key}Input" value="${conf[item.key]}" disabled type="text" />
                  <button id="${item.key}AddBTN" class="p-btn" type="button">+</button></span>`;
                break;
            case "select":
                if (!item.options) throw new Error(`options for ${item.key} not found`);
                const optionsStr = item.options.map((o) => `<option value="${o.value}" ${conf[item.key] == o.value ? "selected" : ""}>${o.display}</option>`).join("");
                input = `<select id="${item.key}Select">${optionsStr}</select>`;
                break;
            case "input":
                input = `<span><input id="${item.key}TextInput" ${conf[item.key] ? "value=" + conf[item.key] : ""} class="text-input" placeholder="${item.placeholder ?? ""}" type="text" /></span>`;
                break;
        }
        const [start, end] = item.gridColumnRange ? item.gridColumnRange : [1, 11];
        return `<div class="config-panel-item" style="grid-column-start: ${start}; grid-column-end: ${end}; padding-left: 5px;${display ? "" : " display: none;"}"><label class="p-label"><span><span>${i18nValue.get()}</span><span class="p-tooltip">${i18nValueTooltip ? " ?:" : " :"}<span class="p-tooltiptext">${i18nValueTooltip?.get() || ""}</span></span></span>${input}</label></div>`;
    }
    var ChaptersPanel = class {
        panel;
        root;
        thumbnail;
        thumbnailImg;
        thumbnailCanvas;
        listContainer;
        constructor(root) {
            this.root = root;
            this.panel = q("#chapters-panel", root);
            this.thumbnail = q("#chapter-thumbnail", root);
            this.thumbnailImg = q("#chapter-thumbnail-image", root);
            this.thumbnailCanvas = q("#chapter-thumbnail-canvas", root);
            this.listContainer = q("#chapter-list", root);
            EBUS.subscribe("pf-update-chapters", (chapters, slient) => {
                this.updateChapterList(chapters);
                if (chapters.length > 1 && !slient) this.relocateToCenter();
            });
            EBUS.subscribe("pf-change-chapter", (index, chapter) => this.updateHighlight(index, chapter));
        }
        updateChapterList(chapters) {
            const ul = this.listContainer.firstElementChild;
            ul.innerHTML = "";
            chapters.forEach((ch, i) => {
                const li = document.createElement("div");
                let title = "";
                if (ch.title instanceof Array) title = ch.title.join("	");
                else title = ch.title;
                li.innerHTML = `<span>${title}</span>`;
                li.setAttribute("id", "chapter-list-item-" + ch.id.toString());
                li.classList.add("chapter-list-item");
                li.addEventListener("click", () => {
                    ch.onclick?.(i);
                    if (this.panel.classList.contains("p-panel-large")) {
                        this.panel.classList.add("p-collapse");
                        this.panel.classList.remove("p-panel-large");
                        this.panel.classList.remove("p-chapters-large");
                    }
                });
                li.addEventListener("mouseenter", () => this.updateChapterThumbnail(ch));
                ul.appendChild(li);
            });
            this.updateChapterThumbnail(chapters[0]);
        }
        relocateToCenter() {
            this.panel.classList.remove("p-collapse");
            this.panel.classList.add("p-panel-large");
            this.panel.classList.add("p-chapters-large");
            const [w, h] = [this.root.offsetWidth, this.root.offsetHeight];
            const [pw, ph] = [this.panel.offsetWidth, this.panel.offsetHeight];
            const [left, top] = [w / 2 - pw / 2, h / 2 - ph / 2];
            this.panel.style.left = left + "px";
            this.panel.style.top = top + "px";
        }
        updateHighlight(index, chapter) {
            Array.from(this.listContainer.querySelectorAll("div > .chapter-list-item")).forEach((li, i) => {
                if (i === index) li.classList.add("chapter-list-item-hl");
                else li.classList.remove("chapter-list-item-hl");
            });
            this.updateChapterThumbnail(chapter);
        }
        updateChapterThumbnail(chapter) {
            this.thumbnailImg.onload = () => {
                const width = this.thumbnailImg.naturalWidth;
                const height = this.thumbnailImg.naturalHeight;
                let [sx, sw, sy, sh] = [
                    0,
                    width,
                    0,
                    height
                ];
                if (width > height) {
                    sx = Math.floor((width - height) / 2);
                    sw = height;
                } else if (width < height) {
                    sy = Math.floor((height - width) / 2);
                    sh = width;
                }
                this.thumbnailCanvas.width = sw;
                this.thumbnailCanvas.height = sh;
                this.thumbnailCanvas.getContext("2d").drawImage(this.thumbnailImg, sx, sy, sw, sh, 0, 0, width, height);
            };
            this.thumbnailImg.src = chapter.thumbimg ?? "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";
            this.thumbnail.querySelector(".ehvp-chapter-description")?.remove();
            const description = document.createElement("div");
            description.classList.add("ehvp-chapter-description");
            if (Array.isArray(chapter.title)) description.innerHTML = chapter.title.map((t) => `<span>${t}</span>`).join("<br>");
            else description.innerHTML = `<span>${chapter.title}</span>`;
            this.thumbnail.appendChild(description);
        }
        static html() {
            return `
<div id="chapters-panel" class="p-panel p-chapters p-panel-large p-collapse">
    <div id="chapter-thumbnail" class="chapter-thumbnail">
      <div id="chapter-thumbnail-image-container" style="display:none;">
        <img id="chapter-thumbnail-image" src="${DEFAULT_THUMBNAIL}" alt="thumbnail" />
      </div>
      <canvas id="chapter-thumbnail-canvas" width="100" height="100"></canvas>
    </div>
    <div id="chapter-list" class="chapter-list">
      <div></div>
    </div>
</div>`;
        }
    };
    var FilterPanel = class {
        panel;
        root;
        filter;
        input;
        list;
        candidates;
        candidatasFragment;
        candidateSelectIndex = 0;
        candidateCached = [];
        constructor(root, filter) {
            this.root = root;
            this.panel = q("#filter-panel", root);
            this.input = q("#tag-input", this.panel);
            this.list = q("#tag-list", this.panel);
            this.candidates = q("#tag-candidates", this.panel);
            this.candidatasFragment = document.createDocumentFragment();
            this.filter = filter;
            this.input.addEventListener("click", () => EBUS.emit("filter-update-all-tags"));
            this.input.addEventListener("input", (ev) => {
                this.candidateSelectIndex = 0;
                this.updateCandidates(false);
                ev.stopPropagation();
            });
            this.input.addEventListener("keydown", (ev) => ev.stopPropagation());
            this.input.addEventListener("keypress", (ev) => {
                ev.stopPropagation();
                if (ev.key.toLowerCase() === "arrowup") {
                    this.candidateSelectIndex = this.candidateSelectIndex - 1;
                    this.updateCandidates(true);
                } else if (ev.key.toLowerCase() === "arrowdown") {
                    this.candidateSelectIndex = this.candidateSelectIndex + 1;
                    this.updateCandidates(true);
                } else if (ev.key.toLowerCase() === "enter") {
                    const tag = this.candidateCached[this.candidateSelectIndex];
                    const term = this.input.value.trim();
                    this.input.value = "";
                    if (tag) {
                        this.filter.push(term);
                        this.updateFilterValues();
                    }
                    this.candidates.hidden = true;
                }
            });
        }
        updateCandidates(noCache) {
            if (this.input.value.length === 0) {
                this.candidates.hidden = true;
                return;
            }
            let term = this.input.value.trim();
            if (!noCache) this.candidateCached = [...this.filter.allTags].filter((t) => !term || t.includes(term));
            if (this.candidateCached.length > 100) {
                this.candidates.hidden = true;
                return;
            }
            this.candidateSelectIndex = Math.max(0, this.candidateSelectIndex);
            this.candidateSelectIndex = Math.min(this.candidateCached.length - 1, this.candidateSelectIndex);
            let selected;
            for (let i = 0; i < this.candidateCached.length; i++) {
                const tag = this.candidateCached[i];
                const li = document.createElement("li");
                li.textContent = tag.toString();
                if (i === this.candidateSelectIndex) {
                    li.classList.add("tc-selected");
                    selected = li;
                }
                li.addEventListener("click", (ev) => {
                    const tag = ev.target.textContent;
                    if (!tag) return;
                    this.input.value = "";
                    this.filter.push(tag);
                    this.updateFilterValues();
                    this.candidates.hidden = true;
                });
                this.candidatasFragment.appendChild(li);
            }
            this.candidates.innerHTML = "";
            this.candidates.append(...Array.from(this.candidatasFragment.childNodes));
            this.candidates.hidden = false;
            selected?.scrollIntoView({ block: "center" });
        }
        updateFilterValues() {
            this.list.innerHTML = "";
            for (const tag of this.filter.values) {
                const li = document.createElement("li");
                li.textContent = tag.toString();
                if (tag.exclude) {
                    li.style.color = "red";
                    li.style.textDecorationLine = "line-through";
                }
                li.addEventListener("click", (ev) => {
                    const tag = ev.target.textContent;
                    if (!tag) return;
                    this.filter.remove(tag);
                    this.updateFilterValues();
                });
                this.list.appendChild(li);
            }
        }
        static html() {
            return `
<div id="filter-panel" class="p-panel p-filter p-collapse">
    <div style="position: relative;">
      <input id="tag-input" class="tag-input" style="width:76%; margin-top:0.6em; margin-left: 12%;"/>
      <div id="tag-candidates" style="position:absolute; width:100%; min-height:1em; max-height:15em; overflow:auto; background-color:#444; margin-top:0; top:100%;" hidden="true"></div>
    </div>
    <div>
      <ul id="tag-list" class="tag-list">
      <span>Filter the images, unfinished!</span>
      </ul>
    </div>
</div>`;
        }
    };
    function linkify(text) {
        return text.replace(/https?:\/\/[^\s<>"']+/g, (url) => {
            const escapedUrl = escapeHtml(url);
            return `<a target="_blank" href="${escapedUrl}">${escapedUrl}</a>`;
        });
    }
    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, (char) => {
            switch (char) {
                case "&": return "&amp;";
                case "<": return "&lt;";
                case ">": return "&gt;";
                case "\"": return "&quot;";
                case "'": return "&#39;";
                default: return char;
            }
        });
    }
    function createHTML(filter) {
        const base = document.createElement("div");
        const dt = getDisplayText();
        base.id = "ehvp-base";
        base.setAttribute("style", "all: initial");
        document.body.after(base);
        const HTML_STRINGS = `
<div id="page-loading" class="page-loading" style="display: none;">
    <div class="page-loading-text border-ani">Loading...</div>
</div>
<div id="message-box" class="ehvp-message-box"></div>
<div id="ehvp-nodes-container" class="full-view-grid" tabindex="6"></div>
<div id="big-img-frame" class="big-img-frame big-img-frame-collapse" tabindex="7">
   <a id="img-land-left" class="img-land img-land-left"></a>
   <a id="img-land-right" class="img-land img-land-right"></a>
</div>
<div id="p-helper" class="p-helper">
    <div>
        ${ConfigPanel.html()}
        ${DownloaderPanel.html()}
        ${ChaptersPanel.html()}
        ${FilterPanel.html()}
    </div>
    <div id="b-main" class="b-main">
        <a id="entry-btn" class="b-main-item clickable" data-display-texts="${dt.entry},${dt.collapse}">${dt.entry}</a>
        <a id="wn-line-btn" class="b-main-item clickable" title="切换图片线路（换源）">线路: 默认</a>
        <div id="colcount-bar" class="b-main-item">
            <span>
              <span title="每行数量">列</span>
              <a id="colcountMinusBTN" class="b-main-btn clickable" type="button">-</a>
              <span id="colcountInput" class="b-main-input">${ADAPTER.conf.colCount}</span>
              <a id="colcountAddBTN" class="b-main-btn clickable" type="button">+</a>
            </span>
        </div>
        <div id="page-status" class="b-main-item" hidden>
            <a class="clickable" id="p-curr-page" style="color:#ffc005;">1</a><span id="p-slash-1">/</span><span id="p-total">0</span>
        </div>
        <div id="fin-status" class="b-main-item" hidden>
            <span>${dt.fin}:</span><span id="p-finished">0</span>
        </div>
        <a id="auto-page-btn" class="b-main-item clickable" hidden data-status="paused" data-display-texts="${dt.autoPagePlay},${dt.autoPagePause}">
           <span>${dt.autoPagePlay}</span>
           <div id="auto-page-progress"></div>
        </a>
        <a id="config-panel-btn" class="b-main-item clickable" hidden>${dt.config}</a>
        <a id="downloader-panel-btn" class="b-main-item clickable" hidden>${dt.download}</a>
        <a id="chapters-panel-btn" class="b-main-item clickable" hidden>${dt.chapters}</a>
        <a id="filter-panel-btn" class="b-main-item clickable" hidden>${dt.filter}</a>
        <div id="read-mode-bar" class="b-main-item" hidden>
            <div id="read-mode-select"
            ><a class="b-main-option clickable ${ADAPTER.conf.readMode === "pagination" ? "b-main-option-selected" : ""}" data-value="pagination">${dt.pagination}</a
            ><a class="b-main-option clickable ${ADAPTER.conf.readMode === "continuous" ? "b-main-option-selected" : ""}" data-value="continuous">${dt.continuous}</a
            ><a class="b-main-option clickable ${ADAPTER.conf.readMode === "horizontal" ? "b-main-option-selected" : ""}" data-value="horizontal">${dt.horizontal}</a></div>
        </div>
        <div id="pagination-adjust-bar" class="b-main-item" hidden>
            <span>
              <a id="paginationStepPrev" class="b-main-btn clickable" type="button">&lt;</a>
              <a id="paginationMinusBTN" class="b-main-btn clickable" type="button">-</a>
              <span id="paginationInput" class="b-main-input">${ADAPTER.conf.paginationIMGCount}</span>
              <a id="paginationAddBTN" class="b-main-btn clickable" type="button">+</a>
              <a id="paginationStepNext" class="b-main-btn clickable" type="button">&gt;</a>
            </span>
        </div>
        <div id="scale-bar" class="b-main-item" hidden>
            <span>
              <span>${icons.zoomIcon}</span>
              <a id="scaleMinusBTN" class="b-main-btn clickable" type="button">-</a>
              <span id="scaleInput" class="b-main-input" style="width: 3rem; cursor: move;">${ADAPTER.conf.imgScale}</span>
              <a id="scaleAddBTN" class="b-main-btn clickable" type="button">+</a>
            </span>
        </div>
    </div>
</div>
`;
        const shadowRoot = base.attachShadow({ mode: "open" });
        const root = document.createElement("div");
        root.classList.add("ehvp-root");
        root.classList.add("ehvp-root-collapse");
        root.innerHTML = HTML_STRINGS;
        const style = document.createElement("style");
        style.innerHTML = styleCSS();
        const styleCustom = document.createElement("style");
        styleCustom.id = "ehvp-style-custom";
        styleCustom.innerHTML = ADAPTER.conf.customStyle;
        shadowRoot.append(style);
        root.append(styleCustom);
        shadowRoot.append(root);
        return {
            root,
            fullViewGrid: q("#ehvp-nodes-container", root),
            bigImageFrame: q("#big-img-frame", root),
            pageHelper: q("#p-helper", root),
            configPanelBTN: q("#config-panel-btn", root),
            downloaderPanelBTN: q("#downloader-panel-btn", root),
            chaptersPanelBTN: q("#chapters-panel-btn", root),
            filterPanelBTN: q("#filter-panel-btn", root),
            entryBTN: q("#entry-btn", root),
            lineBtn: q("#wn-line-btn", root),
            colcountBar: q("#colcount-bar", root),
            colcountInput: q("#colcountInput", root),
            currPageElement: q("#p-curr-page", root),
            totalPageElement: q("#p-total", root),
            finishedElement: q("#p-finished", root),
            imgLandLeft: q("#img-land-left", root),
            imgLandRight: q("#img-land-right", root),
            autoPageBTN: q("#auto-page-btn", root),
            pageLoading: q("#page-loading", root),
            messageBox: q("#message-box", root),
            config: new ConfigPanel(root),
            downloader: new DownloaderPanel(root),
            chapters: new ChaptersPanel(root),
            filter: new FilterPanel(root, filter),
            readModeSelect: q("#read-mode-select", root),
            paginationAdjustBar: q("#pagination-adjust-bar", root),
            styleSheet: style.sheet
        };
    }
    function addEventListeners(events, HTML, BIFM, DL, PH) {
        HTML.config.initEvents(events);
        const panelElements = {
            "config": {
                panel: HTML.config.panel,
                btn: HTML.configPanelBTN
            },
            "downloader": {
                panel: HTML.downloader.panel,
                btn: HTML.downloaderPanelBTN,
                cb: () => DL.check()
            },
            "chapters": {
                panel: HTML.chapters.panel,
                btn: HTML.chaptersPanelBTN
            },
            "filter": {
                panel: HTML.filter.panel,
                btn: HTML.filterPanelBTN
            }
        };
        function collapsePanel(panel) {
            if (ADAPTER.conf.autoCollapsePanel && !panel.classList.contains("p-panel-large")) events.collapsePanelEvent(panel, panel.id);
            if (BIFM.visible) HTML.bigImageFrame.focus();
            else HTML.fullViewGrid.focus();
        }
        Object.entries(panelElements).forEach(([key, elements]) => {
            elements.panel.addEventListener("mouseleave", () => collapsePanel(elements.panel));
            elements.panel.addEventListener("blur", () => collapsePanel(elements.panel));
            elements.btn.addEventListener("click", () => {
                events.togglePanelEvent(key, void 0, elements.btn);
                elements.cb?.();
            });
        });
        let hovering = false;
        HTML.pageHelper.addEventListener("mouseover", () => {
            hovering = true;
            events.abortMouseleavePanelEvent();
            PH.minify(PH.lastStage, true);
        });
        HTML.pageHelper.addEventListener("mouseleave", () => {
            hovering = false;
            Object.values(panelElements).forEach((elements) => collapsePanel(elements.panel));
            setTimeout(() => !hovering && PH.minify(PH.lastStage, false), 700);
        });
        HTML.entryBTN.addEventListener("click", () => {
            let stage = HTML.entryBTN.getAttribute("data-stage") || "exit";
            stage = stage === "open" ? "exit" : "open";
            HTML.entryBTN.setAttribute("data-stage", stage);
            EBUS.emit("toggle-main-view", stage === "open");
        });
        HTML.currPageElement.addEventListener("wheel", (event) => {
            BIFM.callbackOnWheel?.();
            BIFM.stepNext(event.deltaY > 0 ? "next" : "prev", event.deltaY > 0 ? -1 : 1, parseInt(HTML.currPageElement.textContent) - 1);
        });
        document.addEventListener("keydown", (event) => events.keyboardEvent(event));
        document.addEventListener("mouseup", (event) => events.keyboardEvent(event));
        HTML.fullViewGrid.addEventListener("keydown", (event) => {
            events.fullViewGridKeyBoardEvent(event);
            event.stopPropagation();
        });
        HTML.fullViewGrid.addEventListener("mouseup", (event) => {
            events.fullViewGridKeyBoardEvent(event);
            event.stopPropagation();
        });
        HTML.bigImageFrame.addEventListener("keydown", (event) => {
            events.bigImageFrameKeyBoardEvent(event);
            event.stopPropagation();
        });
        HTML.bigImageFrame.addEventListener("mouseup", (event) => {
            events.bigImageFrameKeyBoardEvent(event);
            event.stopPropagation();
        });
        HTML.imgLandLeft.addEventListener("click", (event) => {
            BIFM.callbackOnWheel?.();
            BIFM.stepNext(ADAPTER.conf.reversePages ? "next" : "prev");
            event.stopPropagation();
        });
        HTML.imgLandRight.addEventListener("click", (event) => {
            BIFM.callbackOnWheel?.();
            BIFM.stepNext(ADAPTER.conf.reversePages ? "prev" : "next");
            event.stopPropagation();
        });
        dragElement(HTML.pageHelper, {
            onFinish: () => {
                ADAPTER.conf.pageHelperAbTop = HTML.pageHelper.style.top;
                ADAPTER.conf.pageHelperAbLeft = HTML.pageHelper.style.left;
                ADAPTER.conf.pageHelperAbBottom = HTML.pageHelper.style.bottom;
                ADAPTER.conf.pageHelperAbRight = HTML.pageHelper.style.right;
                saveConf({
                    pageHelperAbTop: ADAPTER.conf.pageHelperAbTop,
                    pageHelperAbLeft: ADAPTER.conf.pageHelperAbLeft,
                    pageHelperAbBottom: ADAPTER.conf.pageHelperAbBottom,
                    pageHelperAbRight: ADAPTER.conf.pageHelperAbRight
                }, ADAPTER.conf.selectedSiteNameConfig);
            },
            onMoving: (pos) => {
                HTML.pageHelper.style.top = pos.top === void 0 ? "unset" : `${pos.top}px`;
                HTML.pageHelper.style.bottom = pos.bottom === void 0 ? "unset" : `${pos.bottom}px`;
                HTML.pageHelper.style.left = pos.left === void 0 ? "unset" : `${pos.left}px`;
                HTML.pageHelper.style.right = pos.right === void 0 ? "unset" : `${pos.right}px`;
                const rule = queryRule(HTML.styleSheet, ".b-main");
                if (rule) rule.style.flexDirection = pos.left === void 0 ? "row-reverse" : "row";
            }
        }, q("#dragHub", HTML.pageHelper));
        HTML.readModeSelect.addEventListener("click", (event) => {
            const value = event.target.getAttribute("data-value");
            if (value) {
                events.changeReadModeEvent(value, ADAPTER.matcher.name);
                PH.minify(PH.lastStage);
            }
        });
        q("#paginationStepPrev", HTML.pageHelper).addEventListener("click", () => {
            BIFM.callbackOnWheel?.();
            BIFM.stepNext(ADAPTER.conf.reversePages ? "next" : "prev", ADAPTER.conf.reversePages ? -1 : 1);
        });
        q("#paginationStepNext", HTML.pageHelper).addEventListener("click", () => {
            BIFM.callbackOnWheel?.();
            BIFM.stepNext(ADAPTER.conf.reversePages ? "prev" : "next", ADAPTER.conf.reversePages ? 1 : -1);
        });
        q("#paginationMinusBTN", HTML.pageHelper).addEventListener("click", () => events.modNumberConfigEvent("paginationIMGCount", "minus", void 0, ADAPTER.matcher.name));
        q("#paginationAddBTN", HTML.pageHelper).addEventListener("click", () => events.modNumberConfigEvent("paginationIMGCount", "add", void 0, ADAPTER.matcher.name));
        q("#paginationInput", HTML.pageHelper).addEventListener("wheel", (event) => events.modNumberConfigEvent("paginationIMGCount", event.deltaY < 0 ? "add" : "minus", void 0, ADAPTER.matcher.name));
        q("#scaleInput", HTML.pageHelper).addEventListener("mousedown", (event) => {
            const element = event.target;
            const scale = ADAPTER.conf.imgScale || (ADAPTER.conf.readMode === "continuous" ? ADAPTER.conf.defaultImgScaleModeC : 100);
            dragElementWithLine(event, element, { y: true }, (data) => {
                if (data.distance === 0) return;
                const fix = (data.direction & 3) === 1 ? 1 : -1;
                BIFM.scaleBigImages(1, 0, Math.floor(scale + data.distance * .6 * fix));
                element.textContent = ADAPTER.conf.imgScale.toString();
            });
        });
        q("#scaleMinusBTN", HTML.pageHelper).addEventListener("click", () => BIFM.scaleBigImages(-1, 10));
        q("#scaleAddBTN", HTML.pageHelper).addEventListener("click", () => BIFM.scaleBigImages(1, 10));
        q("#scaleInput", HTML.pageHelper).addEventListener("wheel", (event) => BIFM.scaleBigImages(event.deltaY > 0 ? -1 : 1, 5));
    }
    function showMessage(box, level, message, duration) {
        message = linkify(message);
        const element = document.createElement("div");
        element.classList.add("ehvp-message");
        element.innerHTML = `<span ${level === "error" ? "style='color: red;'" : ""}>${message}</span><button>X</button><div class="ehvp-message-duration-bar"></div>`;
        box.appendChild(element);
        element.querySelector("button")?.addEventListener("click", () => element.remove());
        const durationBar = element.querySelector("div.ehvp-message-duration-bar");
        if (duration) {
            durationBar.style.animation = `${duration}ms linear main-progress`;
            durationBar.addEventListener("animationend", () => element.remove());
        }
    }
    var PageHelper = class {
        html;
        chapterIndex = -1;
        pageNumInChapter = [];
        lastStage = "exit";
        chapters;
        downloading;
        constructor(html, chapters, downloading) {
            this.html = html;
            this.chapters = chapters;
            this.downloading = downloading;
            EBUS.subscribe("pf-change-chapter", (index) => {
                let current = 0;
                if (index >= 0) current = this.pageNumInChapter[index] || 0;
                this.chapterIndex = index;
                const [total, finished] = (() => {
                    const queue = this.chapters()[index]?.filteredQueue;
                    if (!queue) return [0, 0];
                    const finished = queue.filter((imf) => imf.stage === FetchState.DONE).length;
                    return [queue.length, finished];
                })();
                this.setPageState({
                    finished: finished.toString(),
                    total: total.toString(),
                    current: (current + 1).toString()
                });
                this.minify(this.lastStage);
            });
            EBUS.subscribe("bifm-on-show", () => this.minify("bigImageFrame"));
            EBUS.subscribe("bifm-on-hidden", () => this.minify("fullViewGrid"));
            EBUS.subscribe("ifq-do", (index, imf) => {
                if (imf.chapterIndex !== this.chapterIndex) return;
                if (!this.chapters()[this.chapterIndex]?.filteredQueue) return;
                this.pageNumInChapter[this.chapterIndex] = index;
                this.setPageState({ current: (index + 1).toString() });
            });
            EBUS.subscribe("ifq-on-finished-report", (index, queue) => {
                if (queue.chapterIndex !== this.chapterIndex) return;
                this.setPageState({ finished: queue.finishedIndex.size.toString() });
                evLog("info", `No.${index + 1} Finished，Current index at No.${queue.currIndex + 1}`);
            });
            EBUS.subscribe("pf-on-appended", (total, _ifs, chapterIndex, done) => {
                if (this.chapterIndex > -1 && chapterIndex !== this.chapterIndex) return;
                this.setPageState({ total: `${total}${done ? "" : ".."}` });
            });
            html.currPageElement.addEventListener("click", (event) => {
                const ele = event.target;
                const index = parseInt(ele.textContent || "1") - 1;
                if (this.chapterIndex >= 0) {
                    const queue = this.chapters()[this.chapterIndex]?.filteredQueue;
                    if (!queue || !queue[index]) return;
                    EBUS.emit("imf-on-click", queue[index]);
                }
            });
        }
        setPageState({ total, current, finished }) {
            if (total !== void 0) this.html.totalPageElement.textContent = total;
            if (current !== void 0) this.html.currPageElement.textContent = current;
            if (finished !== void 0) this.html.finishedElement.textContent = finished;
        }
        minify(stage, hover = false) {
            this.lastStage = stage;
            let level = [0, 0];
            if (stage === "exit") level = [0, 0];
            else switch (stage) {
                case "fullViewGrid":
                    if (ADAPTER.conf.minifyPageHelper === "never" || ADAPTER.conf.minifyPageHelper === "inBigMode") level = [1, 1];
                    else level = hover ? [1, 1] : [3, 1];
                    break;
                case "bigImageFrame":
                    if (ADAPTER.conf.minifyPageHelper === "never") level = [2, 2];
                    else level = hover ? [2, 2] : [3, 2];
                    break;
            }
            function getPick(lvl, downloading = false) {
                switch (lvl) {
                    case 0: return downloading ? [
                        "entry-btn",
                        "page-status",
                        "fin-status"
                    ] : ["entry-btn"];
                    case 1: return [
                        "page-status",
                        "fin-status",
                        "auto-page-btn",
                        "config-panel-btn",
                        "downloader-panel-btn",
                        "chapters-panel-btn",
                        "filter-panel-btn",
                        "wn-line-btn",
                        "colcount-bar",
                        "entry-btn"
                    ];
                    case 2: return [
                        "page-status",
                        "fin-status",
                        "auto-page-btn",
                        "config-panel-btn",
                        "downloader-panel-btn",
                        "chapters-panel-btn",
                        "wn-line-btn",
                        "entry-btn",
                        "read-mode-bar",
                        "pagination-adjust-bar",
                        "scale-bar"
                    ];
                    case 3: return ["page-status", "auto-page-btn"];
                }
                return [];
            }
            const filter = (id) => {
                if (id === "chapters-panel-btn") return this.chapters().length > 1;
                if (id === "filter-panel-btn") return ADAPTER.conf.enableFilter;
                if (id === "auto-page-btn" && level[0] === 3) return this.html.pageHelper.querySelector("#auto-page-btn")?.getAttribute("data-status") === "playing";
                if (id === "pagination-adjust-bar") return ADAPTER.conf.readMode === "pagination";
                return true;
            };
            const pick = getPick(level[0], this.downloading()).filter(filter);
            const notHidden = getPick(level[1], this.downloading()).filter(filter);
            const items = Array.from(this.html.pageHelper.querySelectorAll(".b-main > .b-main-item"));
            for (const item of items) {
                const index = pick.indexOf(item.id);
                item.style.order = index === -1 ? "99" : index.toString();
                item.style.opacity = index === -1 ? "0" : "1";
                item.hidden = !notHidden.includes(item.id);
            }
            const entryBTN = this.html.pageHelper.querySelector("#entry-btn");
            const displayTexts = entryBTN.getAttribute("data-display-texts").split(",");
            entryBTN.textContent = stage === "exit" ? displayTexts[0] : displayTexts[1];
        }
    };
    function onMouse(ele, callback, signal) {
        ele.addEventListener("mousedown", (event) => {
            const { left } = ele.getBoundingClientRect();
            const mouseMove = (event) => {
                const xInProgress = event.clientX - left;
                callback(Math.round(xInProgress / ele.clientWidth * 100));
            };
            mouseMove(event);
            ele.addEventListener("mousemove", mouseMove);
            ele.addEventListener("mouseup", () => {
                ele.removeEventListener("mousemove", mouseMove);
            }, { once: true });
            ele.addEventListener("mouseleave", () => {
                ele.removeEventListener("mousemove", mouseMove);
            }, { once: true });
        }, { signal });
    }
    var PLAY_ICON = `<svg width="1.4rem" height="1.4rem" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M106.854 106.002a26.003 26.003 0 0 0-25.64 29.326c16 124 16 117.344 0 241.344a26.003 26.003 0 0 0 35.776 27.332l298-124a26.003 26.003 0 0 0 0-48.008l-298-124a26.003 26.003 0 0 0-10.136-1.994z"/></svg>`;
    var PAUSE_ICON = `<svg width="1.4rem" height="1.4rem" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M120.16 45A20.162 20.162 0 0 0 100 65.16v381.68A20.162 20.162 0 0 0 120.16 467h65.68A20.162 20.162 0 0 0 206 446.84V65.16A20.162 20.162 0 0 0 185.84 45h-65.68zm206 0A20.162 20.162 0 0 0 306 65.16v381.68A20.162 20.162 0 0 0 326.16 467h65.68A20.162 20.162 0 0 0 412 446.84V65.16A20.162 20.162 0 0 0 391.84 45h-65.68z"/></svg>`;
    var VOLUME_ICON = `<svg width="1.4rem" height="1.4rem" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> <path fill="#fff" d="M10.0012 8.99984H9.1C8.53995 8.99984 8.25992 8.99984 8.04601 9.10883C7.85785 9.20471 7.70487 9.35769 7.60899 9.54585C7.5 9.75976 7.5 10.0398 7.5 10.5998V13.3998C7.5 13.9599 7.5 14.2399 7.60899 14.4538C7.70487 14.642 7.85785 14.795 8.04601 14.8908C8.25992 14.9998 8.53995 14.9998 9.1 14.9998H10.0012C10.5521 14.9998 10.8276 14.9998 11.0829 15.0685C11.309 15.1294 11.5228 15.2295 11.7143 15.3643C11.9305 15.5164 12.1068 15.728 12.4595 16.1512L15.0854 19.3023C15.5211 19.8252 15.739 20.0866 15.9292 20.1138C16.094 20.1373 16.2597 20.0774 16.3712 19.9538C16.5 19.811 16.5 19.4708 16.5 18.7902V5.20948C16.5 4.52892 16.5 4.18864 16.3712 4.04592C16.2597 3.92233 16.094 3.86234 15.9292 3.8859C15.7389 3.9131 15.5211 4.17451 15.0854 4.69733L12.4595 7.84843C12.1068 8.27166 11.9305 8.48328 11.7143 8.63542C11.5228 8.77021 11.309 8.87032 11.0829 8.93116C10.8276 8.99984 10.5521 8.99984 10.0012 8.99984Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    var MUTED_ICON = `<svg width="1.4rem" height="1.4rem" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M16 9.50009L21 14.5001M21 9.50009L16 14.5001M4.6 9.00009H5.5012C6.05213 9.00009 6.32759 9.00009 6.58285 8.93141C6.80903 8.87056 7.02275 8.77046 7.21429 8.63566C7.43047 8.48353 7.60681 8.27191 7.95951 7.84868L10.5854 4.69758C11.0211 4.17476 11.2389 3.91335 11.4292 3.88614C11.594 3.86258 11.7597 3.92258 11.8712 4.04617C12 4.18889 12 4.52917 12 5.20973V18.7904C12 19.471 12 19.8113 11.8712 19.954C11.7597 20.0776 11.594 20.1376 11.4292 20.114C11.239 20.0868 11.0211 19.8254 10.5854 19.3026L7.95951 16.1515C7.60681 15.7283 7.43047 15.5166 7.21429 15.3645C7.02275 15.2297 6.80903 15.1296 6.58285 15.0688C6.32759 15.0001 6.05213 15.0001 5.5012 15.0001H4.6C4.03995 15.0001 3.75992 15.0001 3.54601 14.8911C3.35785 14.7952 3.20487 14.6422 3.10899 14.4541C3 14.2402 3 13.9601 3 13.4001V10.6001C3 10.04 3 9.76001 3.10899 9.54609C3.20487 9.35793 3.35785 9.20495 3.54601 9.10908C3.75992 9.00009 4.03995 9.00009 4.6 9.00009Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    var VideoControl = class {
        ui;
        paused = false;
        abort;
        elementID;
        root;
        constructor(root) {
            this.root = root;
            this.ui = this.create(this.root);
            this.flushUI();
        }
        show() {
            this.ui.root.hidden = false;
        }
        hidden() {
            this.ui.root.hidden = true;
        }
        create(root) {
            const ui = document.createElement("div");
            ui.classList.add("bifm-vid-ctl");
            ui.innerHTML = `
<div>
  <button id="bifm-vid-ctl-play" class="bifm-vid-ctl-btn">${PLAY_ICON}</button>
  <button id="bifm-vid-ctl-mute" class="bifm-vid-ctl-btn">${MUTED_ICON}</button>
    <div id="bifm-vid-ctl-volume" class="bifm-vid-ctl-pg">
      <div class="bifm-vid-ctl-pg-inner" style="width: 30%"></div>
    </div>
  <span id="bifm-vid-ctl-time" class="bifm-vid-ctl-span">00:00</span>
  <span class="bifm-vid-ctl-span">/</span>
  <span id="bifm-vid-ctl-duration" class="bifm-vid-ctl-span">10:00</span>
  <!-- <span id = "bifm-vid-ctl-drag" class="bifm-vid-ctl-span" style = "cursor: grab;">?</span> -->
</div>
<div>
    <div id="bifm-vid-ctl-pg" class="bifm-vid-ctl-pg">
      <div class="bifm-vid-ctl-pg-inner" style="width: 30%"></div>
    </div>
</div>
`;
            root.appendChild(ui);
            return {
                root: ui,
                playBTN: q("#bifm-vid-ctl-play", ui),
                volumeBTN: q("#bifm-vid-ctl-mute", ui),
                volumeProgress: q("#bifm-vid-ctl-volume", ui),
                progress: q("#bifm-vid-ctl-pg", ui),
                time: q("#bifm-vid-ctl-time", ui),
                duration: q("#bifm-vid-ctl-duration", ui)
            };
        }
        flushUI(state, onlyState) {
            const { value, max } = state ? {
                value: state.time,
                max: state.duration
            } : {
                value: 0,
                max: 10
            };
            const percent = value / max * 100;
            this.ui.progress.firstElementChild.style.width = `${percent}%`;
            this.ui.time.textContent = secondsToTime(value);
            this.ui.duration.textContent = secondsToTime(max);
            if (onlyState) return;
            this.ui.playBTN.innerHTML = this.paused ? PLAY_ICON : PAUSE_ICON;
            this.ui.volumeBTN.innerHTML = ADAPTER.conf.muted ? MUTED_ICON : VOLUME_ICON;
            this.ui.volumeProgress.firstElementChild.style.width = `${ADAPTER.conf.volume || 30}%`;
        }
        attach(element) {
            this.detach();
            this.show();
            this.abort = new AbortController();
            const state = {
                time: element.currentTime,
                duration: element.duration
            };
            this.flushUI(state);
            element.addEventListener("timeupdate", (event) => {
                const ele = event.target;
                if (!state) return;
                state.time = ele.currentTime;
                this.flushUI(state, true);
            }, { signal: this.abort.signal });
            element.onwaiting = () => evLog("debug", "onwaiting");
            element.onended = () => {
                element.currentTime = 0;
                element.play();
            };
            element.muted = ADAPTER.conf.muted || false;
            element.volume = Math.min(1, (ADAPTER.conf.volume || 30) / 100);
            if (!this.paused) element.play();
            this.elementID = element.id;
            if (!this.elementID) {
                this.elementID = "vid-" + Math.random().toString(36).slice(2);
                element.id = this.elementID;
            }
            this.ui.playBTN.addEventListener("click", () => {
                const vid = this.getVideoElement();
                if (!vid) return;
                this.paused = !this.paused;
                if (this.paused) vid.pause();
                else vid.play();
                this.flushUI(state);
            }, { signal: this.abort.signal });
            this.ui.volumeBTN.addEventListener("click", () => {
                const vid = this.getVideoElement();
                if (!vid) return;
                ADAPTER.conf.muted = !ADAPTER.conf.muted;
                vid.muted = ADAPTER.conf.muted;
                saveConf({ muted: vid.muted });
                this.flushUI(state);
            }, { signal: this.abort.signal });
            onMouse(this.ui.progress, (percent) => {
                const vid = this.getVideoElement();
                if (!vid) return;
                vid.currentTime = vid.duration * (percent / 100);
                state.time = vid.currentTime;
                this.flushUI(state);
            }, this.abort.signal);
            onMouse(this.ui.volumeProgress, (percent) => {
                const vid = this.getVideoElement();
                if (!vid) return;
                ADAPTER.conf.volume = Math.min(100, percent);
                vid.volume = Math.min(1, ADAPTER.conf.volume / 100);
                saveConf({ volume: ADAPTER.conf.volume });
                this.flushUI(state);
            }, this.abort.signal);
        }
        detach() {
            const vid = this.getVideoElement();
            if (vid) vid.pause();
            this.elementID = void 0;
            this.abort?.abort();
            this.abort = void 0;
            this.flushUI();
            this.hidden();
        }
        getVideoElement() {
            return this.root.querySelector(`#${this.elementID}`);
        }
    };
    function secondsToTime(seconds) {
        return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
    }
    var Scroller = class {
        element;
        scrolling = false;
        step;
        distance = 0;
        additional = 0;
        lastDirection;
        animationID = 0;
        scrollSign = 1;
        currentPromise;
        currentResolve;
        scrollMargin;
        maxScrollMargin;
        setScrollMargin;
        onScrolled;
        constructor(element, step, mode) {
            this.element = element;
            this.step = step || 1;
            if (mode && mode === "x") {
                this.scrollMargin = () => this.element.scrollLeft;
                this.maxScrollMargin = () => this.element.scrollWidth - this.element.clientWidth;
                this.setScrollMargin = (margin) => this.element.scrollLeft = margin;
            } else {
                this.scrollMargin = () => this.element.scrollTop;
                this.maxScrollMargin = () => this.element.scrollHeight - this.element.clientHeight;
                this.setScrollMargin = (margin) => this.element.scrollTop = margin;
            }
        }
        scroll(delta, step) {
            if (step) this.step = step;
            const distance = Math.abs(delta);
            if (distance <= 0) return Promise.resolve();
            const direction = delta < 0 ? "up" : "down";
            if (this.scrolling) {
                if (this.lastDirection === direction) {
                    this.distance += distance;
                    return this.currentPromise ?? Promise.resolve();
                }
                this.finishScroll();
            }
            const promise = new Promise((resolve) => this.currentResolve = resolve);
            this.currentPromise = promise;
            this.distance = distance;
            this.scrollSign = delta < 0 ? -1 : 1;
            this.lastDirection = direction;
            this.additional = 0;
            this.scrolling = true;
            const animationID = ++this.animationID;
            const doFrame = () => {
                if (animationID !== this.animationID) return;
                if (!this.scrolling) return this.finishScroll();
                this.distance -= this.step + this.additional;
                let scrollMargin = this.scrollMargin() + (this.step + this.additional) * this.scrollSign;
                scrollMargin = Math.max(scrollMargin, 0);
                scrollMargin = Math.min(scrollMargin, this.maxScrollMargin());
                this.setScrollMargin(scrollMargin);
                this.onScrolled?.();
                if (this.distance <= 0 || scrollMargin === 0 || scrollMargin === this.maxScrollMargin()) return this.finishScroll();
                window.requestAnimationFrame(doFrame);
            };
            window.requestAnimationFrame(doFrame);
            return promise;
        }
        stop() {
            this.finishScroll();
        }
        finishScroll() {
            this.animationID++;
            this.scrolling = false;
            this.lastDirection = void 0;
            this.distance = 0;
            const resolve = this.currentResolve;
            this.currentPromise = void 0;
            this.currentResolve = void 0;
            resolve?.();
        }
    };
    var TouchPoint = class TouchPoint {
        id;
        x;
        y;
        constructor(id, x, y) {
            this.id = id;
            this.x = x;
            this.y = y;
        }
        static from(tp) {
            return new TouchPoint(tp.identifier, tp.clientX, tp.clientY);
        }
        distance(other) {
            return calculateDistance({
                x: this.x,
                y: this.y
            }, {
                x: other.x,
                y: other.y
            });
        }
        direction(other) {
            const x = this.x - other.x;
            const y = this.y - other.y;
            if (Math.abs(x) > Math.abs(y)) return x > 0 ? "L" : "R";
            else return y > 0 ? "U" : "D";
        }
    };
    var TouchManager = class {
        element;
        trail = {};
        handlers;
        constructor(element, handles) {
            this.element = element;
            this.handlers = handles;
            this.element.addEventListener("touchstart", (ev) => this.start(ev));
            this.element.addEventListener("touchmove", (ev) => this.move(ev));
            this.element.addEventListener("touchend", (ev) => this.end(ev));
        }
        start(ev) {
            const tps = Array.from(ev.targetTouches).map(TouchPoint.from);
            this.trail = tps.reduce((prev, curr) => {
                prev[curr.id] = [curr];
                return prev;
            }, {});
            let distance = 0;
            if (tps.length === 2) distance = tps[0].distance(tps[1]);
            this.handlers.start?.(distance, ev);
        }
        move(ev) {
            const tps = Array.from(ev.targetTouches).map(TouchPoint.from);
            tps.forEach((tp) => {
                const trail = this.trail[tp.id];
                if (trail[trail.length - 1].distance(tp) > 30) trail.push(tp);
            });
            if (Object.keys(this.trail).length === 2 && tps.length === 2) {
                const tp1 = tps[0];
                const tp2 = tps[1];
                this.handlers.zoom?.(tp1.distance(tp2), ev);
                return;
            }
        }
        end(ev) {
            const tpKeys = Object.keys(this.trail).map(Number);
            if (tpKeys.length === 1) {
                if (this.trail[tpKeys[0]].length > 1) {
                    const trail = this.trail[tpKeys[0]];
                    let direction = void 0;
                    for (let i = 0, j = 1; j < trail.length; i++, j++) if (!direction) direction = trail[i].direction(trail[j]);
                    else if (trail[i].direction(trail[j]) !== direction) return;
                    this.handlers.swipe?.(direction, ev);
                }
            }
            if (tpKeys.length === 2) {
                const trail1 = this.trail[tpKeys[0]];
                const trail2 = this.trail[tpKeys[1]];
                if (trail1.length > 1 && trail2.length > 1) {
                    const { angle, clockwise } = calculateAngle([trail1[0], trail1[trail1.length - 1]], [trail2[0], trail2[trail2.length - 1]]);
                    this.handlers.rotate?.(clockwise, angle, ev);
                }
            }
            this.trail = {};
            this.handlers.end?.(ev);
        }
    };
    function calculateDistance(start, end) {
        const dx = start.x - end.x;
        const dy = start.y - end.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    function calculateAngle(line1, line2) {
        if (line1.length !== 2 || line2.length !== 2) throw new Error("line1 or line2 length must be 2");
        [line1, line2].forEach(([start, end]) => {
            if (start.x === end.x && start.y === end.y) throw new Error(`start at ${start.toString()}, end at ${end.toString()}, not line`);
        });
        const vector1 = {
            x: line1[1].x - line1[0].x,
            y: line1[1].y - line1[0].y
        };
        const vector2 = {
            x: line2[1].x - line2[0].x,
            y: line2[1].y - line2[0].y
        };
        const cosTheta = (vector1.x * vector2.x + vector1.y * vector2.y) / (Math.sqrt(vector1.x ** 2 + vector1.y ** 2) * Math.sqrt(vector2.x ** 2 + vector2.y ** 2));
        const angleInRadians = Math.acos(cosTheta);
        const clockwise = vector1.x * vector2.y - vector1.y * vector2.x <= 0;
        return {
            angle: angleInRadians * (180 / Math.PI),
            clockwise
        };
    }
    var BigImageFrameManager = class {
        root;
        container;
        observer;
        intersectingElements = [];
        renderingElements = [];
        currentIndex = 0;
        preventStep = { currentPreventFinished: false };
        debouncer;
        callbackOnWheel;
        visible = false;
        html;
        vidController;
        chapterIndex = 0;
        getChapter;
        loadingHelper;
        currLoadingState = new Map();
        scrollerY;
        scrollerX;
        lastMouse;
        pageNumInChapter = [];
        oriented = "next";
        lastViewportSyncAt = 0;
        intersectingIndexLock = false;
        constructor(HTML, getChapter) {
            this.html = HTML;
            this.root = HTML.bigImageFrame;
            this.debouncer = new Debouncer();
            this.getChapter = getChapter;
            this.scrollerY = new Scroller(this.root);
            this.scrollerX = new Scroller(this.root, void 0, "x");
            this.scrollerY.onScrolled = () => this.syncCurrentFromViewportThrottled();
            this.scrollerX.onScrolled = () => this.syncCurrentFromViewportThrottled();
            this.container = document.createElement("div");
            this.container.classList.add("bifm-container");
            switch (ADAPTER.conf.readMode) {
                case "continuous":
                    this.container.classList.add("bifm-container-vert");
                    break;
                case "pagination":
                    this.container.classList.add("bifm-container-page");
                    break;
                case "horizontal":
                    this.container.classList.add("bifm-container-hori");
                    break;
            }
            this.observer = new IntersectionObserver((entries) => this.intersecting(entries), { root: this.root });
            this.root.appendChild(this.container);
            this.initEvent();
            EBUS.subscribe("pf-on-appended", (_total, nodes, chapterIndex) => {
                if (chapterIndex !== this.chapterIndex) return;
                this.append(nodes);
            });
            EBUS.subscribe("pf-change-chapter", (index) => {
                this.chapterIndex = Math.max(0, index);
                this.container.innerHTML = "";
            });
            EBUS.subscribe("imf-on-click", (imf) => this.show(imf));
            EBUS.subscribe("imf-on-finished", (index, success, imf) => {
                if (imf.chapterIndex !== this.chapterIndex) return;
                this.currLoadingState.delete(index);
                this.debouncer.addEvent("FLUSH-LOADING-HELPER", () => this.flushLoadingHelper(), 20);
                if (!success) return;
                const current = this.renderingElements.find((element) => parseIndex(element) === index);
                if (!current) return;
                current.innerHTML = "";
                current.appendChild(this.newMediaNode(imf));
            });
            EBUS.subscribe("imf-resize", (imf) => {
                if (imf.chapterIndex !== this.chapterIndex) return;
                this.onResize(imf);
            });
            EBUS.subscribe("bifm-rotate-image", () => this.rotate(true));
            this.loadingHelper = document.createElement("span");
            this.loadingHelper.id = "bifm-loading-helper";
            this.root.appendChild(this.loadingHelper);
            EBUS.subscribe("imf-download-state-change", (imf) => {
                if (imf.chapterIndex !== this.chapterIndex) return;
                const [start, end] = [this.currentIndex, this.currentIndex + (ADAPTER.conf.readMode !== "pagination" ? 1 : ADAPTER.conf.paginationIMGCount)];
                if (imf.index < start || imf.index >= end) return;
                this.currLoadingState.set(imf.index, Math.floor(imf.downloadState.loaded / imf.downloadState.total * 100));
                this.debouncer.addEvent("FLUSH-LOADING-HELPER", () => this.flushLoadingHelper(), 20);
            });
            new AutoPage(this, HTML.autoPageBTN);
        }
        onResize(imf) {
            const element = this.container.querySelector(`div[d-index="${imf.index}"]`);
            const current = this.container.querySelector(`div[d-index="${this.currentIndex}"]`);
            if (!element || !current) return;
            if (ADAPTER.conf.readMode === "continuous") {
                const currOffsetTop = current.offsetTop;
                const currScrollTop = this.root.scrollTop;
                element.style.aspectRatio = imf.ratio().toString();
                if (currOffsetTop !== current.offsetTop) this.root.scrollTop = current.offsetTop + (currOffsetTop - currScrollTop);
            } else {
                const currOffsetLeft = current.offsetLeft;
                const currScrollLeft = this.root.scrollLeft;
                element.style.aspectRatio = imf.ratio().toString();
                if (ADAPTER.conf.readMode === "pagination" && imf.index === this.currentIndex) this.jumpTo(this.currentIndex);
                else if (currOffsetLeft !== current.offsetLeft) this.root.scrollLeft = current.offsetLeft - (currOffsetLeft - currScrollLeft);
            }
        }
        intersecting(entries) {
            for (const entry of entries) if (entry.isIntersecting) {
                const element = entry.target;
                if (parseIndex(element) === -1) continue;
                this.intersectingElements.push(element);
            } else {
                const index = this.intersectingElements.indexOf(entry.target);
                if (index > -1) this.intersectingElements.splice(index, 1);
            }
            if (this.intersectingIndexLock) if (this.intersectingElements.find((elem) => this.currentIndex === parseIndex(elem))) this.intersectingIndexLock = false;
            else return;
            this.debouncer.addEvent("rendering-images", () => this.rendering(), 50);
        }
        rendering() {
            const sorting = this.intersectingElements.map((elem) => ({
                index: parseIndex(elem),
                elem
            }));
            sorting.filter((e) => e.index > -1).sort((a, b) => a.index - b.index);
            if (ADAPTER.conf.reversePages) sorting.reverse();
            const intersecting = sorting.map((e) => e.elem);
            if (intersecting.length === 0) return;
            let sibling = intersecting[0];
            let [count, limit] = [0, ADAPTER.conf.paginationIMGCount + 1];
            while ((sibling = sibling.previousElementSibling) && count < limit) {
                intersecting.unshift(sibling);
                count++;
            }
            sibling = intersecting[intersecting.length - 1];
            count = 0;
            while ((sibling = sibling.nextElementSibling) && count < limit) {
                intersecting.push(sibling);
                count++;
            }
            const unrender = [];
            const rendered = [];
            for (const elem of this.renderingElements) if (intersecting.includes(elem)) rendered.push(elem);
            else unrender.push(elem);
            unrender.forEach((ele) => ele.innerHTML = "");
            for (const elem of intersecting) if (!rendered.includes(elem)) {
                elem.innerHTML = "";
                const imf = this.getIMF(elem);
                if (imf) elem.appendChild(this.newMediaNode(imf));
            }
            this.renderingElements = intersecting;
        }
        getIMF(element) {
            const index = parseIndex(element);
            if (index === -1 || isNaN(index)) return null;
            return this.getChapter(this.chapterIndex).filteredQueue[index] ?? null;
        }
        initEvent() {
            this.root.addEventListener("wheel", (event) => this.onWheel(new WheelEvent("wheel", {
                deltaY: ADAPTER.conf.scrollingDelta * (event.deltaY < 0 ? -1 : 1),
                buttons: event.buttons,
                button: event.button
            }), void 0, void 0, void 0, event));
            this.root.addEventListener("scroll", (event) => this.onScroll(event), { passive: false });
            this.root.addEventListener("mousedown", (mdevt) => {
                if (mdevt.button !== 0) return;
                if (mdevt.target.classList.contains("img-land")) return;
                let moved = false;
                const start = {
                    x: mdevt.clientX,
                    y: mdevt.clientY
                };
                let last = {
                    x: mdevt.clientX,
                    y: mdevt.clientY
                };
                let elementsWidth = void 0;
                const abort = new AbortController();
                const [scrollTop, scrollLeft] = [this.root.scrollTop, this.root.scrollLeft];
                this.root.addEventListener("mouseup", (muevt) => {
                    abort.abort();
                    if (!moved) this.hidden(muevt);
                    else if (ADAPTER.conf.magnifier && ADAPTER.conf.imgScale === 100) {
                        this.scaleBigImages(1, 0, ADAPTER.conf.imgScale, false);
                        [this.root.scrollTop, this.root.scrollLeft] = [scrollTop, scrollLeft];
                    }
                    moved = false;
                }, { once: true });
                this.root.addEventListener("mousemove", (mmevt) => {
                    if (ADAPTER.conf.dragImageOut) {
                        moved = true;
                        return;
                    }
                    if (IS_MOBILE) return;
                    if (!moved) {
                        if (calculateDistance(start, {
                            x: mmevt.clientX,
                            y: mmevt.clientY
                        }) < 20) return;
                        if (ADAPTER.conf.magnifier && ADAPTER.conf.imgScale === 100) this.scaleBigImages(1, 0, 150, false);
                        if (ADAPTER.conf.readMode === "pagination") {
                            const showing = this.intersectingElements;
                            if (showing.length > 0) elementsWidth = showing[showing.length - 1].offsetLeft + showing[showing.length - 1].offsetWidth - showing[0].offsetLeft;
                        }
                    }
                    moved = true;
                    this.debouncer.addEvent("BIG-IMG-MOUSE-MOVE", () => {
                        stickyMouse(this.root, mmevt, last, elementsWidth);
                        last = {
                            x: mmevt.clientX,
                            y: mmevt.clientY
                        };
                    }, 5);
                }, { signal: abort.signal });
            });
            new TouchManager(this.root, {
                start: () => {
                    if (ADAPTER.conf.readMode === "pagination") this.root.style.overflow = "hidden";
                },
                swipe: (direction) => {
                    if (ADAPTER.conf.readMode === "continuous" || ADAPTER.conf.readMode === "horizontal") return;
                    this.oriented = (() => {
                        switch (direction) {
                            case "L": return ADAPTER.conf.reversePages ? "next" : "prev";
                            case "R": return ADAPTER.conf.reversePages ? "prev" : "next";
                            case "U": return "next";
                            case "D": return "prev";
                        }
                    })();
                    this.callbackOnWheel?.();
                    this.stepNext(this.oriented);
                    if (ADAPTER.conf.readMode === "pagination") this.root.style.overflow = "";
                },
                rotate: (_clockwise, _angle) => { }
            });
        }
        cherryPickCurrent(exclude) {
            EBUS.emit("add-cherry-pick-range", this.chapterIndex, this.currentIndex, !exclude, false);
            const withRange = ADAPTER.conf.readMode === "pagination" && ADAPTER.conf.paginationIMGCount > 1;
            const end = this.currentIndex + ADAPTER.conf.paginationIMGCount - 1;
            if (withRange) EBUS.emit("add-cherry-pick-range", this.chapterIndex, end, !exclude, true);
            const message = `${exclude ? "Excluded" : "Selected"} Image${withRange ? "s" : ""} no.${this.currentIndex + 1}${withRange ? "-" + (end + 1) : ""}`;
            EBUS.emit("notify-message", "info", message, 1e3);
        }
        rotate(clockwise) {
            const cls = [
                "bifm-rotate-90",
                "bifm-rotate-180",
                "bifm-rotate-270",
                ""
            ];
            if (!clockwise) cls.reverse();
            let idx = cls.findIndex((c) => this.root.classList.contains(c));
            if (idx === -1) idx = clockwise ? 3 : 0;
            else this.root.classList.remove(cls[idx]);
            const add = (idx + 1) % 4;
            if (cls[add] !== "") this.root.classList.add(cls[add]);
        }
        scrollStop() {
            this.scrollerY.stop();
            this.scrollerX.stop();
        }
        hidden(event) {
            if (event && event.target && event.target.tagName === "SPAN") return;
            this.visible = false;
            EBUS.emit("bifm-on-hidden");
            this.html.fullViewGrid.focus();
            this.vidController?.detach();
            this.root.classList.add("big-img-frame-collapse");
            this.renderingElements.forEach((elem) => elem.innerHTML = "");
            this.renderingElements = [];
            this.intersectingIndexLock = false;
        }
        show(imf) {
            this.visible = true;
            this.currentIndex = imf.index;
            this.intersectingIndexLock = true;
            this.root.classList.remove("big-img-frame-collapse");
            this.root.focus();
            this.debouncer.addEvent("TOGGLE-CHILDREN-D", () => imf.chapterIndex === this.chapterIndex && this.setNow(imf), 100);
            EBUS.emit("bifm-on-show");
        }
        setNow(imf) {
            this.currentIndex = imf.index;
            this.pageNumInChapter[this.chapterIndex] = imf.index;
            if (this.visible) this.jumpTo(imf.index);
            EBUS.emit("ifq-do", imf.index, imf, this.oriented ?? "next");
            this.lastMouse = void 0;
            this.currLoadingState.clear();
            this.flushLoadingHelper();
        }
        append(nodes) {
            if (ADAPTER.conf.readMode === "pagination") return;
            const elements = [];
            const scrollWidth = this.root.scrollWidth;
            for (const node of nodes) {
                const div = document.createElement("div");
                div.style.aspectRatio = node.ratio().toString();
                div.setAttribute("d-index", node.index.toString());
                elements.push(div);
                this.observer.observe(div);
            }
            const reverse = ADAPTER.conf.readMode !== "continuous" && ADAPTER.conf.reversePages;
            if (this.container.childElementCount === 0) {
                const paddingRatio = window.innerWidth / window.innerHeight;
                const start = document.createElement("div");
                start.style.aspectRatio = paddingRatio.toString();
                start.setAttribute("d-index", "-1");
                elements.unshift(start);
                const end = document.createElement("div");
                end.style.aspectRatio = paddingRatio.toString();
                end.setAttribute("d-index", "-1");
                elements.push(end);
            } else elements.push(reverse ? this.container.firstElementChild : this.container.lastElementChild);
            if (reverse) {
                elements.reverse();
                this.container.prepend(...elements);
                this.root.scrollLeft = this.root.scrollLeft + this.root.scrollWidth - scrollWidth;
            } else this.container.append(...elements);
        }
        changeLayout() {
            this.resetScaleBigImages(true);
            switch (ADAPTER.conf.readMode) {
                case "continuous":
                    this.container.classList.remove("bifm-container-hori", "bifm-container-vert", "bifm-container-page");
                    this.container.classList.add("bifm-container-vert");
                    break;
                case "pagination":
                    this.container.classList.remove("bifm-container-hori", "bifm-container-vert", "bifm-container-page");
                    this.container.classList.add("bifm-container-page");
                    break;
                case "horizontal":
                    this.container.classList.remove("bifm-container-hori", "bifm-container-vert", "bifm-container-page");
                    this.container.classList.add("bifm-container-hori");
                    break;
            }
            this.container.innerHTML = "";
            this.intersectingElements = [];
            this.renderingElements = [];
            const queue = this.getChapter(this.chapterIndex).filteredQueue;
            this.append(queue);
            this.jumpTo(this.currentIndex);
        }
        jumpTo(index) {
            switch (ADAPTER.conf.readMode) {
                case "pagination": {
                    const showing = this.setElements();
                    if (this.container.offsetWidth > this.root.offsetWidth) if (ADAPTER.conf.reversePages) this.root.scrollLeft = this.container.offsetWidth - this.root.offsetWidth;
                    else this.root.scrollLeft = 0;
                    this.root.scrollTop = 0;
                    if (showing[0].firstElementChild) this.tryPlayVideo(showing[0].firstElementChild);
                    break;
                }
                case "horizontal": {
                    const element = this.container.querySelector(`div[d-index="${index}"]`);
                    if (!element) return;
                    if (ADAPTER.conf.reversePages) this.root.scrollLeft = element.offsetLeft - this.root.offsetWidth + element.offsetWidth;
                    else this.root.scrollLeft = element.offsetLeft;
                    this.syncCurrentFromViewport();
                    break;
                }
                case "continuous": {
                    const element = this.container.querySelector(`div[d-index="${index}"]`);
                    if (!element) return;
                    const rootH = this.root.offsetHeight;
                    const height = element.offsetHeight;
                    let marginT = index === 0 ? 0 : Math.floor((rootH - height) / 2);
                    marginT = Math.max(0, marginT);
                    this.root.scrollTop = element.offsetTop - marginT;
                    this.syncCurrentFromViewport();
                    break;
                }
            }
        }
        stepNext(oriented, fixStep = 0, current) {
            this.oriented = oriented;
            let index = current || this.currentIndex;
            if (index === void 0 || isNaN(index)) return;
            const queue = this.getChapter(this.chapterIndex)?.filteredQueue;
            if (!queue || queue.length === 0) return;
            index = oriented === "next" ? index + ADAPTER.conf.paginationIMGCount : index - ADAPTER.conf.paginationIMGCount;
            if (ADAPTER.conf.paginationIMGCount > 1) index += fixStep;
            if (index < -ADAPTER.conf.paginationIMGCount) index = queue.length - 1;
            else index = Math.max(0, index);
            if (!queue[index]) return;
            this.resetPreventStep();
            this.setNow(queue[index]);
        }
        checkCurrent() {
            if (this.syncCurrentFromViewport()) return;
            const rootRect = this.root.getBoundingClientRect();
            const isCenter = (() => {
                if (ADAPTER.conf.readMode === "continuous") return (rect, rootRect) => rect.top <= rootRect.height / 2 && rect.bottom >= rootRect.height / 2;
                else return (rect, rootRect) => rect.left <= rootRect.width / 2 && rect.right >= rootRect.width / 2;
            })();
            for (const element of this.intersectingElements) if (isCenter(element.getBoundingClientRect(), rootRect)) {
                const imf = this.getIMF(element);
                if (imf === null) continue;
                this.setCurrentFromElement(element, imf);
                break;
            }
        }
        syncCurrentFromViewport() {
            if (ADAPTER.conf.readMode === "pagination") return false;
            const rootRect = this.root.getBoundingClientRect();
            const axis = this.viewportAxis();
            const root = viewportPosition(rootRect, axis);
            let nearest;
            for (const element of Array.from(this.container.children)) {
                if (parseIndex(element) < 0) continue;
                const elementPos = viewportPosition(element.getBoundingClientRect(), axis);
                if (!isVisibleInViewport(root, elementPos)) continue;
                if (this.trySetCenteredElement(element, elementPos, root.center)) return true;
                nearest = nearestViewportElement(nearest, element, elementPos, root.center);
            }
            return this.trySetNearestElement(nearest);
        }
        syncCurrentFromViewportThrottled(timeout = 80) {
            const now = Date.now();
            if (now - this.lastViewportSyncAt < timeout) return;
            this.lastViewportSyncAt = now;
            this.syncCurrentFromViewport();
        }
        trySetCenteredElement(element, position, center) {
            if (position.start > center || position.end < center) return false;
            const imf = this.getIMF(element);
            if (imf === null) return false;
            this.setCurrentFromElement(element, imf);
            return true;
        }
        trySetNearestElement(nearest) {
            if (!nearest) return false;
            const imf = this.getIMF(nearest.element);
            if (imf === null) return false;
            this.setCurrentFromElement(nearest.element, imf);
            return true;
        }
        viewportAxis() {
            return ADAPTER.conf.readMode === "horizontal" ? "x" : "y";
        }
        setCurrentFromElement(element, imf) {
            if (!this.renderingElements.includes(element)) this.renderingElements.push(element);
            if (element.childElementCount === 0) element.appendChild(this.newMediaNode(imf));
            if (imf.index !== this.currentIndex) {
                this.currentIndex = imf.index;
                this.pageNumInChapter[this.chapterIndex] = imf.index;
                EBUS.emit("ifq-do", imf.index, imf, this.oriented);
            }
            if (element.firstElementChild) this.tryPlayVideo(element.firstElementChild);
        }
        onScroll(_event) {
            switch (ADAPTER.conf.readMode) {
                case "continuous": {
                    const [first, last] = [this.container.children.item(1), this.container.children.item(this.container.children.length - 2)];
                    let offsetTop = first.offsetTop ?? 0;
                    if (this.root.scrollTop < offsetTop - 3) this.root.scrollTop = offsetTop - 2;
                    else {
                        offsetTop = last ? last.offsetTop + last.offsetHeight - this.root.offsetHeight : this.root.scrollHeight;
                        if (this.root.scrollTop > offsetTop + 3) this.root.scrollTop = offsetTop + 2;
                    }
                    break;
                }
                case "pagination": break;
                case "horizontal": {
                    const [first, last] = [this.container.children.item(1), this.container.children.item(this.container.children.length - 2)];
                    let offsetLeft = first?.offsetLeft ?? 0;
                    if (this.root.scrollLeft < offsetLeft - 3) this.root.scrollLeft = offsetLeft - 2;
                    else {
                        offsetLeft = last ? last.offsetLeft + last.offsetWidth - this.root.offsetWidth : this.root.scrollWidth;
                        if (this.root.scrollLeft > offsetLeft + 3) this.root.scrollLeft = offsetLeft + 2;
                    }
                    break;
                }
            }
            if (ADAPTER.conf.readMode !== "pagination") {
                this.syncCurrentFromViewportThrottled();
                this.debouncer.addEvent("bifm-on-wheel", () => this.checkCurrent(), 69);
            }
        }
        onWheel(event, noPrevent, customScrolling, noCallback, originEvent) {
            const preventDefault = () => {
                event.preventDefault();
                originEvent?.preventDefault();
            };
            if (!noCallback) this.callbackOnWheel?.();
            if (event.buttons === 2) {
                preventDefault();
                this.scaleBigImages(event.deltaY > 0 ? -1 : 1, 5);
                return Promise.resolve();
            }
            const withShift = originEvent instanceof WheelEvent && originEvent.shiftKey;
            const smartScrolling = !withShift && ADAPTER.conf.smartScrolling;
            switch (ADAPTER.conf.readMode) {
                case "pagination":
                    this.handlePaginationWheel(event, withShift, smartScrolling, customScrolling, noPrevent, preventDefault);
                    break;
                case "horizontal": return this.handleHorizontalWheel(event, smartScrolling, customScrolling, preventDefault);
                case "continuous": return this.handleContinuousWheel(event, customScrolling);
            }
            return Promise.resolve();
        }
        handlePaginationWheel(event, withShift, smartScrolling, customScrolling, noPrevent, preventDefault) {
            const over = this.checkOverflow();
            const direction = wheelDirection(event.deltaY, withShift);
            this.oriented = direction.o;
            const [$ori, $neg] = ADAPTER.conf.reversePages ? [direction.neg, direction.o] : [direction.o, direction.neg];
            if (this.isRotated()) {
                this.stepNext(this.oriented);
                return;
            }
            if (this.tryStepAtPaginationBoundary(over, direction.o, direction.neg, $ori, $neg, noPrevent, preventDefault)) return;
            this.scrollInsidePagination(event, over, direction.o, $ori, customScrolling, smartScrolling);
        }
        handleHorizontalWheel(event, smartScrolling, customScrolling, preventDefault) {
            if (!customScrolling && !smartScrolling) return Promise.resolve();
            preventDefault();
            return this.scrollerX.scroll(event.deltaY * (ADAPTER.conf.reversePages ? -1 : 1), ADAPTER.conf.scrollingSpeed).then(() => {
                this.syncCurrentFromViewport();
            });
        }
        handleContinuousWheel(event, customScrolling) {
            if (!customScrolling) return Promise.resolve();
            return this.scrollerY.scroll(event.deltaY, ADAPTER.conf.scrollingSpeed).then(() => {
                this.syncCurrentFromViewport();
            });
        }
        isRotated() {
            return this.root.classList.contains("bifm-rotate-90") || this.root.classList.contains("bifm-rotate-270");
        }
        tryStepAtPaginationBoundary(over, o, neg, $ori, $neg, noPrevent, preventDefault) {
            if (over[o].overY - 1 > 0 || over[$ori].overX - 1 > 0) return false;
            preventDefault();
            if (!noPrevent && (over[neg].overY > 0 || over[$neg].overX > 0) && this.tryPreventStep()) return true;
            this.stepNext(o);
            return true;
        }
        scrollInsidePagination(event, over, o, $ori, customScrolling, smartScrolling) {
            let fix = o === "next" ? 1 : -1;
            const step = Math.abs(Math.ceil(event.deltaY / 4));
            if (customScrolling && over[o].overY > 0) this.scrollerY.scroll(Math.min(over[o].overY, Math.abs(event.deltaY * 3)) * fix, step);
            if (customScrolling || smartScrolling) {
                fix = fix * (ADAPTER.conf.reversePages ? -1 : 1);
                if (over[o].overY - 1 <= 0 && over[$ori].overX > 0) this.scrollerX.scroll(Math.min(over[$ori].overX, Math.abs(event.deltaY * 3)) * fix, step);
            }
        }
        resetPreventStep(fin) {
            this.preventStep.ani?.cancel();
            this.preventStep.ele?.remove();
            this.preventStep = { currentPreventFinished: fin ?? false };
        }
        tryPreventStep() {
            if (ADAPTER.conf.preventScrollPageTime === 0) return false;
            if (this.preventStep.currentPreventFinished) {
                this.resetPreventStep();
                return false;
            } else {
                if (!this.preventStep.ele) {
                    const lockEle = document.createElement("div");
                    lockEle.style.width = "100vw";
                    lockEle.style.position = "fixed";
                    lockEle.style.display = "flex";
                    lockEle.style.justifyContent = "center";
                    lockEle.style.bottom = "0px";
                    lockEle.innerHTML = `<div style="width: 30vw;height: 0.1rem;background-color: #1b00ff59;text-align: center;font-size: 0.8rem;position: relative;font-weight: 800;color: gray;border-radius: 7px;border: 1px solid #510000;"><span style="position: absolute;bottom: -3px;"></span></div>`;
                    this.root.appendChild(lockEle);
                    this.preventStep.ele = lockEle;
                    if (ADAPTER.conf.preventScrollPageTime > 0) {
                        const ani = lockEle.children[0].animate([{ width: "30vw" }, { width: "0vw" }], { duration: ADAPTER.conf.preventScrollPageTime });
                        ani.onfinish = () => this.preventStep.ele && this.resetPreventStep(true);
                        this.preventStep.ani = ani;
                    }
                    this.preventStep.currentPreventFinished = false;
                }
                return true;
            }
        }
        checkOverflow() {
            const showing = Array.from(this.container.querySelectorAll("div:not(.bifm-node-hide)"));
            if (showing.length === 0) return {
                "prev": {
                    overX: 0,
                    overY: 0
                },
                "next": {
                    overX: 0,
                    overY: 0
                },
                elements: []
            };
            const leftFix = this.root.getBoundingClientRect().left;
            const rectL = showing[0].getBoundingClientRect();
            const rectR = showing[showing.length - 1].getBoundingClientRect();
            return {
                "prev": {
                    overX: Math.round(rectL.left) * -1 + leftFix,
                    overY: Math.round(rectL.top) * -1
                },
                "next": {
                    overX: Math.round(rectR.right) - this.root.offsetWidth,
                    overY: Math.round(rectL.bottom) - this.root.offsetHeight
                },
                elements: showing
            };
        }
        restoreScrollTop(imgNode, distance) {
            this.root.scrollTop = this.getRealOffsetTop(imgNode) - distance;
        }
        getRealOffsetTop(imgNode) {
            return imgNode.offsetTop;
        }
        newMediaNode(imf) {
            if (imf.contentType?.startsWith("video")) {
                const vid = document.createElement("video");
                vid.classList.add("bifm-img");
                vid.classList.add("bifm-vid");
                vid.draggable = ADAPTER.conf.dragImageOut;
                vid.onloadeddata = () => {
                    if (this.visible && imf.index === this.currentIndex) this.tryPlayVideo(vid);
                };
                vid.src = imf.node.blobSrc;
                return vid;
            } else if (imf.contentType?.startsWith("ugoira")) {
                const ugoiraElem = document.createElement("ugoira-element");
                ugoiraElem.classList.add("bifm-img");
                const data = imf.data;
                const meta = data.extra;
                const frames = [];
                for (let i = 1; i < data.list.length; i++) {
                    const frame = data.list[i];
                    frames.push({
                        name: frame.name,
                        delay: meta[i - 1].delay,
                        mimeType: frame.contentType,
                        data: frame.data
                    });
                }
                ugoiraElem.frames = frames;
                return ugoiraElem;
            } else {
                const img = document.createElement("img");
                img.loading = "eager";
                img.classList.add("bifm-img");
                img.draggable = ADAPTER.conf.dragImageOut;
                if (imf.stage === FetchState.DONE) img.src = imf.node.blobSrc;
                else if (imf.node.thumbnailSrc) img.src = imf.node.thumbnailSrc;
                else img.src = DEFAULT_THUMBNAIL;
                return img;
            }
        }
        tryPlayVideo(element) {
            if (element instanceof HTMLVideoElement) {
                if (!this.vidController) this.vidController = new VideoControl(this.html.root);
                this.vidController.attach(element);
            } else this.vidController?.detach();
        }
        scaleBigImages(fix, rate, specifiedPercent, syncConf) {
            let oldPercent = ADAPTER.conf.imgScale;
            let newPercent = specifiedPercent ?? oldPercent + rate * fix;
            switch (ADAPTER.conf.readMode) {
                case "pagination":
                    {
                        const rule = queryRule(this.html.styleSheet, ".bifm-container-page");
                        newPercent = Math.max(newPercent, 100);
                        newPercent = Math.min(newPercent, 300);
                        if (rule) rule.style.height = `${newPercent}%`;
                        if (ADAPTER.conf.paginationIMGCount === 1) {
                            const imgRule = queryRule(this.html.styleSheet, ".bifm-container-page .bifm-img");
                            if (imgRule) imgRule.style.maxWidth = newPercent > 100 ? "" : "100%";
                        }
                    }
                    break;
                case "horizontal":
                    {
                        const scrollLeft = this.root.scrollLeft;
                        const rule = queryRule(this.html.styleSheet, ".bifm-container-hori");
                        newPercent = Math.max(newPercent, 80);
                        newPercent = Math.min(newPercent, 300);
                        if (rule) rule.style.height = `${newPercent}%`;
                        this.root.scrollLeft = scrollLeft * (newPercent / oldPercent);
                    }
                    break;
                case "continuous":
                    {
                        const scrollTop = this.root.scrollTop;
                        const rule = queryRule(this.html.styleSheet, ".bifm-container-vert");
                        newPercent = Math.max(newPercent, 20);
                        newPercent = Math.min(newPercent, 100);
                        if (rule) rule.style.width = `${newPercent}%`;
                        this.root.scrollTop = scrollTop * (newPercent / oldPercent);
                    }
                    break;
            }
            if (syncConf ?? true) {
                ADAPTER.conf.imgScale = newPercent;
                saveConf({ imgScale: newPercent }, ADAPTER.matcher.name);
            }
            q("#scaleInput", this.html.pageHelper).textContent = `${newPercent}`;
            return newPercent;
        }
        resetScaleBigImages(syncConf) {
            const percent = ADAPTER.conf.readMode !== "continuous" || IS_MOBILE ? 100 : ADAPTER.conf.defaultImgScaleModeC;
            this.scaleBigImages(1, 0, percent, syncConf);
        }
        flushLoadingHelper() {
            if (this.currLoadingState.size === 0) this.loadingHelper.style.display = "none";
            else {
                if (this.loadingHelper.style.display === "none") this.loadingHelper.style.display = "inline-block";
                const ret = Array.from(this.currLoadingState).map(([k, v]) => `[P-${k + 1}: ${v}%]`);
                if (ADAPTER.conf.reversePages) ret.reverse();
                this.loadingHelper.textContent = `Loading ${ret.join(",")}`;
            }
        }
        getPageNumber() {
            return this.pageNumInChapter[this.chapterIndex] ?? 0;
        }
        setElements() {
            let elements = Array.from(this.container.childNodes);
            const imgCount = ADAPTER.conf.paginationIMGCount * 3;
            if (elements.length > imgCount) elements.splice(imgCount).forEach((elem) => elem.remove());
            else while (elements.length < imgCount) {
                const div = document.createElement("div");
                elements.push(div);
            }
            const queue = this.getChapter(this.chapterIndex).filteredQueue;
            let [start, end] = [this.currentIndex - ADAPTER.conf.paginationIMGCount, this.currentIndex + ADAPTER.conf.paginationIMGCount * 2 - 1];
            [start, end] = [Math.max(start, 0), Math.min(end, queue.length - 1)];
            const withIndex = elements.map((elem) => ({
                index: parseIndex(elem),
                elem
            })).sort((a, b) => a.index - b.index);
            const findOrSetIndex = (index) => {
                let found = withIndex.findIndex((i) => i.index === index);
                if (found > -1) return [withIndex.splice(found, 1)[0].elem, false];
                found = withIndex.findIndex((i) => i.index < start || i.index > end);
                if (found === -1) return [null, false];
                const element = withIndex.splice(found, 1)[0];
                element.elem.setAttribute("d-index", index.toString());
                return [element.elem, true];
            };
            elements = [];
            const ret = [];
            for (let i = start; i <= end; i++) {
                const [elem, reused] = findOrSetIndex(i);
                if (!elem) throw new Error(`BIFM.setElements cannot found element by index:[${i}], or found empty element`);
                const showing = i >= this.currentIndex && i < this.currentIndex + ADAPTER.conf.paginationIMGCount;
                elements.push(elem);
                if (showing) {
                    elem.classList.remove("bifm-node-hide");
                    ret.push(elem);
                } else elem.classList.add("bifm-node-hide");
                if (reused || elem.childElementCount === 0) {
                    elem.style.aspectRatio = "";
                    elem.innerHTML = "";
                    elem.appendChild(this.newMediaNode(queue[i]));
                }
            }
            if (ADAPTER.conf.reversePages) elements.reverse();
            this.renderingElements = [...elements];
            const remain = withIndex.map((i) => {
                i.elem.setAttribute("d-index", "-1");
                i.elem.innerHTML = "";
                i.elem.classList.add("bifm-node-hide");
                return i.elem;
            });
            elements.push(...remain);
            this.container.append(...elements);
            return ret;
        }
    };
    var AutoPage = class {
        bifm;
        status;
        button;
        lockVer;
        constructor(BIFM, button) {
            this.bifm = BIFM;
            this.status = "stop";
            this.button = button;
            this.lockVer = 0;
            this.bifm.callbackOnWheel = () => {
                if (this.status === "running") {
                    this.stop();
                    this.start(this.lockVer);
                }
            };
            EBUS.subscribe("bifm-on-hidden", () => this.stop());
            EBUS.subscribe("bifm-on-show", () => ADAPTER.conf.autoPlay && this.start(this.lockVer));
            EBUS.subscribe("toggle-auto-play", () => {
                if (this.status === "stop") this.start(this.lockVer);
                else this.stop();
            });
            this.initPlayButton();
        }
        initPlayButton() {
            this.button.addEventListener("click", () => {
                if (this.status === "stop") this.start(this.lockVer);
                else this.stop();
            });
        }
        async start(lockVer) {
            this.status = "running";
            this.button.setAttribute("data-status", "playing");
            const displayTexts = this.button.getAttribute("data-display-texts").split(",");
            this.button.firstElementChild.innerText = displayTexts[1];
            if (!this.bifm.visible) {
                const queue = this.bifm.getChapter(this.bifm.chapterIndex).filteredQueue;
                if (queue.length === 0) return;
                this.bifm.show(queue[this.bifm.currentIndex]);
            }
            const progress = q("#auto-page-progress", this.button);
            const interval = () => ADAPTER.conf.readMode === "pagination" ? ADAPTER.conf.autoPageSpeed : 1;
            while (true) {
                await sleep$1(10);
                progress.style.animation = `${interval() * 1e3}ms linear main-progress`;
                await sleep$1(interval() * 1e3);
                if (this.lockVer !== lockVer) return;
                progress.style.animation = ``;
                if (this.status !== "running") break;
                const queue = this.bifm.getChapter(this.bifm.chapterIndex).filteredQueue;
                if (this.bifm.currentIndex < 0 || this.bifm.currentIndex >= queue.length) break;
                if (ADAPTER.conf.readMode === "pagination") {
                    const curr = this.bifm.container.querySelector(`div[d-index="${this.bifm.currentIndex}"]`)?.firstElementChild;
                    if (curr instanceof HTMLVideoElement) {
                        let resolve;
                        const promise = new Promise((r) => resolve = r);
                        curr.addEventListener("timeupdate", () => {
                            if (curr.currentTime >= curr.duration - 1) sleep$1(1e3).then(resolve);
                        });
                        await promise;
                    }
                }
                const deltaY = this.bifm.root.offsetHeight / 2;
                this.bifm.onWheel(new WheelEvent("wheel", { deltaY }), true, true, true);
            }
            this.stop();
        }
        stop() {
            this.status = "stop";
            this.button.setAttribute("data-status", "paused");
            const progress = q("#auto-page-progress", this.button);
            progress.style.animation = ``;
            this.lockVer += 1;
            const displayTexts = this.button.getAttribute("data-display-texts").split(",");
            this.button.firstElementChild.innerText = displayTexts[0];
            this.bifm.scrollStop();
        }
    };
    function parseIndex(ele) {
        if (!ele) return -1;
        const d = ele.getAttribute("d-index") || "";
        const i = parseInt(d);
        return isNaN(i) ? -1 : i;
    }
    function isVisibleInViewport(root, element) {
        return element.end >= root.start && element.start <= root.end;
    }
    function nearestViewportElement(nearest, element, position, center) {
        const elementCenter = position.start + (position.end - position.start) / 2;
        const distance = Math.abs(elementCenter - center);
        if (!nearest || distance < nearest.distance) return {
            element,
            distance
        };
        return nearest;
    }
    function viewportPosition(rect, axis) {
        if (axis === "x") return {
            center: rect.left + rect.width / 2,
            end: rect.right,
            start: rect.left
        };
        return {
            center: rect.top + rect.height / 2,
            end: rect.bottom,
            start: rect.top
        };
    }
    function wheelDirection(deltaY, withShift) {
        if (withShift && ADAPTER.conf.reversePages) deltaY = deltaY * -1;
        const [o, neg] = deltaY > 0 ? ["next", "prev"] : ["prev", "next"];
        return {
            o,
            neg
        };
    }
    function stickyMouse(element, event, lastMouse, elementsWidth) {
        let [distanceY, distanceX] = [event.clientY - lastMouse.y, event.clientX - lastMouse.x];
        [distanceY, distanceX] = [-distanceY, -distanceX];
        const overflowY = element.scrollHeight - element.offsetHeight;
        if (overflowY > 0) {
            const rateY = ADAPTER.conf.readMode === "continuous" ? 1 : overflowY / (element.offsetHeight / 4) * 3;
            let scrollTop = element.scrollTop + distanceY * rateY;
            scrollTop = Math.max(scrollTop, 0);
            scrollTop = Math.min(scrollTop, overflowY);
            element.scrollTop = scrollTop;
        }
        const overflowX = (elementsWidth ?? element.scrollWidth) - element.offsetWidth;
        if (overflowX > 0) {
            const rateX = ADAPTER.conf.readMode !== "pagination" ? 1 : overflowX / (element.offsetWidth / 4) * 3;
            element.scrollLeft = element.scrollLeft + distanceX * rateX;
        }
    }
    function revertMonkeyPatch(element) {
        const originalScrollTo = Element.prototype.scrollTo;
        Object.defineProperty(element, "scrollTo", {
            value: originalScrollTo,
            writable: true,
            configurable: true
        });
    }
    var Filter = class Filter {
        values = [];
        allTags = new Set();
        onChange;
        constructor() {
            if (ADAPTER.conf.filterTags && ADAPTER.conf.filterTags.length > 0) this.values = ADAPTER.conf.filterTags.map(FilterNode.fromString);
        }
        filterNodes(imfs, clearAllTags) {
            if (!ADAPTER.conf.enableFilter) return imfs;
            let list = imfs;
            for (const val of this.values) list = list.filter((imf) => {
                for (const t of imf.node.tags) if (val.tag.compare(t)) return !val.exclude && true;
                return val.exclude;
            });
            if (clearAllTags) this.allTags.clear();
            list.forEach((imf) => imf.node.tags.forEach((tag) => this.allTags.add(tag.toString())));
            return list;
        }
        push(raw) {
            const filterNode = FilterNode.fromString(raw);
            if (this.values.find((v) => v.toString() === filterNode.toString())) return;
            this.values.push(filterNode);
            this.onChange?.(this);
            saveConf({ filterTags: this.values.map(Filter.toString) }, ADAPTER.matcher.name);
        }
        remove(raw) {
            const index = this.values.findIndex((v) => v.toString() === raw);
            if (index > -1) {
                this.values.splice(index, 1);
                this.onChange?.(this);
                saveConf({ filterTags: this.values.map(Filter.toString) }, ADAPTER.matcher.name);
            }
        }
        clear() {
            this.values = [];
            this.onChange?.(this);
            saveConf({ filterTags: this.values.map(Filter.toString) }, ADAPTER.matcher.name);
        }
    };
    var FilterNode = class FilterNode {
        exclude;
        tag;
        constructor(tag, exclude) {
            this.exclude = exclude;
            this.tag = tag;
        }
        toString() {
            return (this.exclude ? "!" : "") + this.tag.toString();
        }
        static fromString(raw) {
            const exclude = raw.startsWith("!");
            return new FilterNode(new StringTag(exclude ? raw.slice(1) : raw), exclude);
        }
    };
    var StringTag = class {
        value;
        constructor(value) {
            this.value = value;
        }
        compare(other) {
            return this.value === other;
        }
        toString() {
            return this.value;
        }
    };
    var MenuItem = class {
        id;
        desc;
        visible;
        closeAfter;
        constructor(id, desc, visible, closeAfter) {
            this.id = id;
            this.visible = visible;
            this.desc = desc;
            this.closeAfter = closeAfter;
        }
    };
    var ContextMenu = class {
        root;
        menu;
        items;
        scrolled = false;
        getTarget;
        isBigMode;
        pointerDownListener;
        constructor(html, fvgm, events) {
            this.root = html.root;
            html.root.addEventListener("contextmenu", (event) => {
                if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
                event.preventDefault();
                if (!this.scrolled) this.open(event);
                this.scrolled = false;
            });
            html.root.addEventListener("wheel", (event) => {
                if (event.buttons === 2) this.scrolled = true;
            });
            this.pointerDownListener = (event) => {
                if (!this.menu) return;
                if (!event.composedPath().includes(this.menu)) this.close();
            };
            this.getTarget = (x, y) => {
                if (!html.bigImageFrame.classList.contains("big-img-frame-collapse")) return;
                else return fvgm.mouseOn(x, y);
            };
            this.isBigMode = () => !html.bigImageFrame.classList.contains("big-img-frame-collapse");
            this.items = [];
            [
                [
                    "exit-big-image-mode",
                    "onBig",
                    true
                ],
                [
                    "round-read-mode",
                    "onBig",
                    false
                ],
                [
                    "toggle-reverse-pages",
                    "onBig",
                    false
                ],
                [
                    "scale-image-increase",
                    "onBig",
                    false
                ],
                [
                    "scale-image-decrease",
                    "onBig",
                    false
                ],
                [
                    "rotate-image",
                    "onBig",
                    false
                ],
                [
                    "step-image-prev",
                    "onBig",
                    false
                ],
                [
                    "step-image-next",
                    "onBig",
                    false
                ]
            ].forEach(([id, hideOnBigMode, closeAfter]) => this.items.push(new MenuItem(id, events.inBigImageMode[id], hideOnBigMode, closeAfter)));
            [
                [
                    "open-big-image-mode",
                    "onGrid",
                    true
                ],
                [
                    "open-in-new-tab",
                    "onGrid",
                    true
                ],
                [
                    "toggle-auto-play",
                    "alway",
                    false
                ],
                [
                    "pause-auto-load-temporarily",
                    "onGrid",
                    true
                ],
                [
                    "resize-flow-vision",
                    "onGrid",
                    false
                ],
                [
                    "columns-decrease",
                    "onGrid",
                    false
                ],
                [
                    "columns-increase",
                    "onGrid",
                    false
                ],
                [
                    "retry-fetch-next-page",
                    "onGrid",
                    false
                ],
                [
                    "cherry-pick-select",
                    "onGrid",
                    true
                ],
                [
                    "cherry-pick-select-range",
                    "onGrid",
                    true
                ],
                [
                    "cherry-pick-exclude",
                    "onGrid",
                    true
                ],
                [
                    "cherry-pick-exclude-range",
                    "onGrid",
                    true
                ],
                [
                    "reload-image",
                    "onGrid",
                    true
                ],
                [
                    "go-prev-chapter",
                    "alway",
                    false
                ],
                [
                    "go-next-chapter",
                    "alway",
                    false
                ],
                [
                    "start-download",
                    "alway",
                    true
                ],
                [
                    "exit-full-view-grid",
                    "alway",
                    true
                ]
            ].forEach(([id, hideOnBigMode, closeAfter]) => this.items.push(new MenuItem(id, events.inFullViewGrid[id], hideOnBigMode, closeAfter)));
        }
        open(event) {
            this.close();
            const target = this.getTarget(event.clientX, event.clientY);
            this.menu = this.create(new MouseEvent("contextmenu", {
                relatedTarget: target,
                clientX: event.clientX,
                clientY: event.clientY
            }));
            this.root.appendChild(this.menu);
            const [w, h] = [this.menu.offsetWidth, this.menu.offsetHeight];
            let top = event.clientY - h / 2;
            top = Math.max(0, top);
            top = Math.min(window.innerHeight - h, top);
            let left = event.clientX - w / 2;
            left = Math.max(0, left);
            left = Math.min(window.innerWidth - w, left);
            this.menu.style.top = top + "px";
            this.menu.style.left = left + "px";
            document.addEventListener("pointerdown", this.pointerDownListener);
        }
        close() {
            this.menu?.remove();
            document.removeEventListener("pointerdown", this.pointerDownListener);
        }
        create(mev) {
            const div = document.createElement("div");
            div.classList.add("ehvp-context-menu");
            div.innerHTML = `
      <div class="ehvp-context-menu-tooltip"><span class="ehvp-context-menu-tooltip-span">Context Menu</span></div>
      <div class="ehvp-context-menu-grid"></div>
      <div style="color: white; font-size: 12px; text-align: center;"><span>${i18n.contextMenuTooltip.get()}</span></div>
    `;
            const tooltip = q(".ehvp-context-menu-tooltip-span", div);
            const isBigMode = this.isBigMode();
            const items = this.items.filter((item) => {
                switch (item.visible) {
                    case "alway": return true;
                    case "onBig": return isBigMode;
                    case "onGrid": return !isBigMode;
                }
            }).map((item) => {
                const elem = document.createElement("div");
                elem.classList.add("ehvp-context-menu-item");
                elem.innerHTML = `<span style="display: flex; align-items: center;">${item.desc.icon}</span>`;
                let addition = "";
                if (item.id === "cherry-pick-select-range" || item.id === "cherry-pick-exclude-range") {
                    const lastIndex = EBUS.emit("get-cherry-pick-last-index");
                    const currIndex = parseInt(mev.relatedTarget?.getAttribute("data-index") ?? "");
                    if (lastIndex !== void 0 && !isNaN(currIndex)) addition = ` [${lastIndex + 1}-${currIndex + 1}]`;
                }
                elem.addEventListener("mouseover", () => {
                    tooltip.textContent = i18n.keyboard[item.id].get().replace(/\s*\(.*?\)/, "") + addition;
                });
                elem.addEventListener("click", () => {
                    item.desc.cb(mev);
                    if (item.closeAfter) div.remove();
                });
                return elem;
            });
            q(".ehvp-context-menu-grid", div).append(...items);
            div.addEventListener("mouseleave", () => div.remove());
            return div;
        }
    };
    var STORAGE_PREFIX = "ehvh_reading_progress_";
    var INDEX_MATCH_TOLERANCE = 20;
    var RESTORE_SAVE_SUPPRESSION_MS = 12e4;
    var ReadingProgress = class {
        chapters;
        restoredChapters = new Set();
        suppressSaveUntilByChapter = new Map();
        restoringChapters = new Map();
        constructor(chapters) {
            this.chapters = chapters;
            EBUS.subscribe("ifq-do", (index, imf) => this.save(index, imf));
            EBUS.subscribe("imf-on-finished", (index, success, imf) => this.upgradeSavedKey(index, success, imf));
            EBUS.subscribe("pf-change-chapter", (index) => this.restore(index));
            EBUS.subscribe("pf-on-appended", (_total, _nodes, chapterIndex) => this.restore(chapterIndex));
        }
        enabled() {
            return ADAPTER.conf.recordReadingProgress;
        }
        key(chapter) {
            return STORAGE_PREFIX + b64EncodeUnicode(`${ADAPTER.matcher?.name ?? "unknown"}\n${chapter.source}`).replaceAll(/[+=\/]/g, "-");
        }
        nodeKeyInfo(imf) {
            if (imf.node.originSrc) return {
                key: imf.node.originSrc,
                type: "originSrc"
            };
            if (imf.node.href) return {
                key: imf.node.href,
                type: "href"
            };
            if (imf.node.thumbnailSrc) return {
                key: imf.node.thumbnailSrc,
                type: "thumbnailSrc"
            };
            return {
                key: imf.node.title,
                type: "title"
            };
        }
        nodeKey(imf) {
            return this.nodeKeyInfo(imf).key;
        }
        closestMatchingIndex(chapter, record) {
            let bestIndex = -1;
            let bestDistance = Infinity;
            chapter.filteredQueue.forEach((imf, index) => {
                if (this.nodeKey(imf) !== record.nodeKey) return;
                const distance = Math.abs(index - record.index);
                if (distance < bestDistance) {
                    bestIndex = index;
                    bestDistance = distance;
                }
            });
            return bestIndex;
        }
        save(_index, imf) {
            if (!this.enabled()) return;
            const suppressSaveUntil = this.suppressSaveUntilByChapter.get(imf.chapterIndex);
            const restoringUntil = this.restoringChapters.get(imf.chapterIndex);
            if (suppressSaveUntil && Date.now() < suppressSaveUntil || restoringUntil && Date.now() < restoringUntil) return;
            this.suppressSaveUntilByChapter.delete(imf.chapterIndex);
            this.restoringChapters.delete(imf.chapterIndex);
            const chapter = this.chapters()[imf.chapterIndex];
            if (!chapter) return;
            const nodeKey = this.nodeKeyInfo(imf);
            const record = {
                chapterSource: chapter.source,
                chapterTitle: Array.isArray(chapter.title) ? chapter.title.join(" / ") : chapter.title,
                index: imf.index,
                nodeKey: nodeKey.key,
                nodeKeyType: nodeKey.type,
                updatedAt: Date.now()
            };
            window.localStorage.setItem(this.key(chapter), JSON.stringify(record));
        }
        upgradeSavedKey(index, success, imf) {
            if (!this.enabled() || !success || !imf.node.originSrc) return;
            const chapter = this.chapters()[imf.chapterIndex];
            if (!chapter) return;
            const record = this.read(chapter);
            if (!record || record.index !== index) return;
            record.nodeKey = imf.node.originSrc;
            record.nodeKeyType = "originSrc";
            record.updatedAt = Date.now();
            window.localStorage.setItem(this.key(chapter), JSON.stringify(record));
        }
        read(chapter) {
            const raw = window.localStorage.getItem(this.key(chapter));
            if (!raw) return null;
            try {
                return JSON.parse(raw);
            } catch (_err) {
                return null;
            }
        }
        restore(chapterIndex) {
            if (!this.enabled() || chapterIndex < 0) return;
            const chapter = this.chapters()[chapterIndex];
            if (!chapter || this.restoredChapters.has(this.key(chapter))) return;
            const record = this.read(chapter);
            if (!record) return;
            this.restoringChapters.set(chapterIndex, Date.now() + RESTORE_SAVE_SUPPRESSION_MS);
            const matchingIndex = this.closestMatchingIndex(chapter, record);
            const matchingDistance = matchingIndex >= 0 ? Math.abs(matchingIndex - record.index) : Infinity;
            const trustedMatchingIndex = record.nodeKeyType === "originSrc" || matchingDistance <= INDEX_MATCH_TOLERANCE ? matchingIndex : -1;
            const scanLimit = record.index;
            if (!chapter.done && chapter.filteredQueue.length <= scanLimit) {
                EBUS.emit("pf-load-until", chapterIndex, scanLimit, record.index);
                return;
            }
            const fallbackIndex = Math.min(record.index, Math.max(chapter.filteredQueue.length - 1, 0));
            const targetIndex = trustedMatchingIndex >= 0 ? trustedMatchingIndex : fallbackIndex;
            const target = chapter.filteredQueue[targetIndex];
            if (target) {
                this.restoredChapters.add(this.key(chapter));
                this.suppressSaveUntilByChapter.set(chapterIndex, Date.now() + 2e3);
                window.setTimeout(() => {
                    this.suppressSaveUntilByChapter.delete(chapterIndex);
                    this.restoringChapters.delete(chapterIndex);
                }, 2e3);
                window.setTimeout(() => {
                    window.requestAnimationFrame(() => {
                        EBUS.emit("imf-on-click", target);
                        EBUS.emit("notify-message", "info", `Resume from page ${target.index + 1}`, 1500);
                    });
                }, 0);
            } else if (!chapter.done) EBUS.emit("pf-load-until", chapterIndex, record.index, record.index);
            else this.restoringChapters.delete(chapterIndex);
        }
    };

    // ==== preserved cross-module helper functions ====
    function sleep$1(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function q(selector, parent) {
        const element = parent.querySelector(selector);
        if (!element) throw new Error(`Can't find element: ${selector}`);
        return element;
    }

    function generateConvertScript() {
        return [`#!/bin/sh
# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "ffmpeg is not installed. Please install ffmpeg to use this script."
    exit 1
fi
# Find all directories name containing 'ugoira'
dirs=$(find . -maxdepth 1 -type d -name "*ugoira*")
for dir in $dirs; do
    out=$(basename "$dir")
    out=$\{out/_ugoira0/\}
    ffmpeg -f concat -safe 0 -i "$dir/frames.txt" -filter_complex "[0:v]split[x][z];[z]palettegen[p];[x][p]paletteuse=dither=bayer:bayer_scale=5" -loop 0 -y "$out"
    if [ $? -eq 0 ]; then
        echo "Converted $out.gif"
        rm -rf "$dir"
    else
        echo "Failed to convert $out.gif"
    fi
done
echo "Conversion complete."`, `@echo off
setlocal enabledelayedexpansion
REM Check if ffmpeg is installed
where ffmpeg >nul 2>nul
if errorlevel 1 (
    echo ffmpeg is not installed. Please install ffmpeg and make sure it is in your PATH. (Try: winget install ffmpeg)
    pause
    exit /b 1
)
REM Find all directories in the current folder that contain "ugoira"
for /d %%D in (*ugoira*) do (
    set "dir=%%D"
    set "out=%%~nD"
    REM Remove the "_ugoira0" suffix from the folder name
    set "out=!out:_ugoira0=!"
    echo Processing "!dir!"...
    REM Run ffmpeg to generate the animated GIF
    ffmpeg -f concat -safe 0 -i "!dir!\\frames.txt" -filter_complex "[0:v]split[x][z];[z]palettegen[p];[x][p]paletteuse=dither=bayer:bayer_scale=5" -loop 0 -y "!out!.gif"
    REM Check if the ffmpeg command succeeded
    if !errorlevel! == 0 (
        echo Successfully converted: !out!.gif
        REM Delete the original directory
        rmdir /s /q "!dir!"
    ) else (
        echo Failed to convert: !out!.gif
    )
)
echo All conversions completed.
pause`];
    }

    var modules = Object.assign({
        "./platform/matchers/wnacg.ts": wnacg_exports
    });
    for (const path in modules) modules[path];
    function setup() {
        const MATCHER = ADAPTER.matcher.constructor();
        const FL = new Filter();
        const HTML = createHTML(FL);
        [HTML.fullViewGrid, HTML.bigImageFrame].forEach((e) => revertMonkeyPatch(e));
        const IFQ = IMGFetcherQueue.newQueue();
        const IL = new IdleLoader(IFQ);
        const PF = new PageFetcher(IFQ, MATCHER, FL);
        const DL = new Downloader(HTML, IFQ, IL, PF, MATCHER);
        const PH = new PageHelper(HTML, () => PF.chapters, () => DL.downloading);
        const BIFM = new BigImageFrameManager(HTML, (index) => PF.chapters[index]);
        const FVGM = new FullViewGridManager(HTML, BIFM);
        new ReadingProgress(() => PF.chapters);
        const events = initEvents(HTML, BIFM, FVGM, IFQ, IL, PH);
        addEventListeners(events, HTML, BIFM, DL, PH);
        new ContextMenu(HTML, FVGM, events.appEvents);
        // ===== WNACG 图片线路切换（换源） v4.16.0 =====
        function wnRefreshLineBtn() {
            if (HTML.lineBtn) HTML.lineBtn.textContent = "线路: " + WN_LINE_OPTS[wnImageLine];
        }
        wnRefreshLineBtn();
        // ===== 缩略图每行数量快捷切换（- 数字 +）=====
        function wnRefreshColCountBtn() {
            if (HTML.colcountInput) HTML.colcountInput.textContent = ADAPTER.conf.colCount;
        }
        wnRefreshColCountBtn();
        EBUS.subscribe("fvg-layout-resize", wnRefreshColCountBtn);
        if (HTML.colcountBar) {
            HTML.colcountBar.querySelector("#colcountMinusBTN")?.addEventListener("click", () => events.modNumberConfigEvent("colCount", "minus"));
            HTML.colcountBar.querySelector("#colcountAddBTN")?.addEventListener("click", () => events.modNumberConfigEvent("colCount", "add"));
        }
        if (HTML.lineBtn) HTML.lineBtn.addEventListener("click", () => {
            wnImageLine = (wnImageLine + 1) % WN_LINE_OPTS.length;
            try { typeof _GM_setValue === "function" && _GM_setValue("wnacg_image_line", String(wnImageLine)); } catch (e) { }
            wnRefreshLineBtn();
            // 中止空闲预加载；按配置决定是否重置已加载完成的图片
            var switchMode = ADAPTER.conf.wnSwitchMode || "all";
            IL.abort();
            IFQ.forEach((imf) => {
                // 仅未加载模式：已完成的图片保留旧线路数据，不重新下载
                if (switchMode === "pending" && imf.stage === FetchState.DONE) return;
                imf.abort();
                imf.lock = false; // 清掉锁，避免 start() 因 lock 仍为 true 而跳过刚被中断的图
                imf.stage = FetchState.URL;
                imf.rendered = false;
                imf.data = void 0;
                imf.contentType = void 0;
                imf.failedReason = void 0;
                imf.unrender();
                imf.node.changeStyle("init");
                // 同步更新缩略图 <a> 的 href，使拖拽/新标签页打开为换源后地址
                var thumbAnchor = imf.node.root?.querySelector("a");
                if (thumbAnchor) thumbAnchor.href = wnApplyImageLine(imf.node._wnOrigUrl || imf.node.href);
            });
            if (switchMode !== "pending") IFQ.finishedIndex.clear();
            // 从当前浏览位置开始排空闲预加载，保证正在看的页优先重新加载
            var idleThreads = ADAPTER.conf.maxIdleThreads;
            var startFrom = Math.max(0, IFQ.currIndex || 0);
            IL.processingIndexList = [];
            for (var i = 0; i < IFQ.length && IL.processingIndexList.length < idleThreads; i++) {
                var idx = (startFrom + i) % IFQ.length;
                if (IFQ[idx].stage === FetchState.URL) IL.processingIndexList.push(idx);
            }
            IL.start();
            // 让当前页立即重新走抓取流程（BIFM 监听 imf-on-finished，加载完成后自动替换大图）
            try { EBUS.emit("ifq-do", IFQ.currIndex, IFQ[IFQ.currIndex], "next"); } catch (e) { }
            try {
                if (BIFM.visible) {
                    var imfNow = IFQ[BIFM.getPageNumber()];
                    if (imfNow) BIFM.show(imfNow);
                }
            } catch (e) { }
            showMessage(HTML.messageBox, "info", "已切换图片线路: " + WN_LINE_OPTS[wnImageLine], 2000);
        });
        EBUS.subscribe("downloader-canvas-on-click", (index) => {
            IFQ.currIndex = index;
            if (IFQ.chapterIndex !== BIFM.chapterIndex) return;
            BIFM.show(IFQ[index]);
        });
        EBUS.subscribe("notify-message", (level, msg, duration) => showMessage(HTML.messageBox, level, msg, duration));
        PF.beforeInit = () => HTML.pageLoading.style.display = "flex";
        PF.afterInit = () => {
            HTML.pageLoading.style.display = "none";
            const idleThreads = ADAPTER.conf.maxIdleThreads;
            IL.processingIndexList = [];
            for (let i = 0; i < idleThreads && i < PF.queue.length; i++) IL.processingIndexList.push(i);
            evLog("info", `start idle fetch with ${idleThreads} threads, total queue length ${PF.queue.length}`);
            IL.start();
            if (ADAPTER.conf.autoEnterBig || BIFM.visible) {
                const imf = IFQ[BIFM.getPageNumber()];
                if (imf) BIFM.show(imf);
            }
        };
        if (ADAPTER.conf.first) {
            events.showGuideEvent();
            ADAPTER.conf.first = false;
            saveConf({ first: false });
        }
        EBUS.subscribe("start-download", (cb) => {
            signal.first = false;
            if (PF.chapters.length === 0) EBUS.emit("pf-init", () => {
                DL.start();
                cb();
            });
            else {
                DL.start();
                sleep$1(20).then(cb);
            }
        });
        const signal = { first: true };
        function entry(expand) {
            if (HTML.pageHelper) if (expand) {
                events.showFullViewGrid();
                if (signal.first) {
                    signal.first = false;
                    EBUS.emit("pf-init", () => { });
                }
            } else {
                ["config", "downloader"].forEach((id) => events.togglePanelEvent(id, true));
                events.hiddenFullViewGrid();
            }
        }
        EBUS.subscribe("toggle-main-view", entry);
        if (ADAPTER.conf.autoOpen) {
            HTML.entryBTN.setAttribute("data-stage", "open");
            entry(true);
        }
        return () => {
            console.log("destory eh-view-enhance");
            ADAPTER.reset();
            entry(false);
            PF.abort();
            IL.abort();
            IFQ.length = 0;
            EBUS.reset();
            document.querySelector("#ehvp-base")?.remove();
            return sleep$1(500);
        };
    }
    var destoryFunc;
    var debouncer = new Debouncer();
    function start() {
        debouncer.addEvent("LOCATION-CHANGE", () => {
            const innerStart = () => {
                if (window.self !== window.top) {
                    evLog("error", "in iframe");
                    return;
                }
                if (document.querySelector(".ehvp-base")) return;
                ADAPTER.reset();
                ADAPTER.ready.then(() => {
                    destoryFunc = setup();
                });
            };
            if (destoryFunc) destoryFunc().then(innerStart);
            else innerStart();
        }, 20);
    }
    var lastUrl = window.location.href;
    new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = location.href;
            sleep$1(300).then(start);
        }
    }).observe(document, {
        subtree: true,
        childList: true
    });
    sleep$1(300).then(start);
})(pica, zip, saveAs);
