// ==UserScript==
// @name         wnacg Layout Redesign Mobile
// @name:zh-CN   绅士漫画移动端布局优化
// @namespace    绅士漫画
// @description:zh-CN  仅支持移动端，更新排行搜索页重做排列样式，点击图片直接打开slide阅读页，，点击日期一键复制标题。
// @description Mobile only. Redesign page layout, open slide reader by clicking covers, copy title by clicking date.
// @version      2026-05-21 13:16:02
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
// @downloadURL  https://raw.githubusercontent.com/Chihaya7/UserScript/refs/heads/main/wnacg/wnacg Layout Redesign Mobile.user.js
// @updateURL    https://raw.githubusercontent.com/Chihaya7/UserScript/refs/heads/main/wnacg/wnacg Layout Redesign Mobile.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    // =========================
    // 提前注入 CSS
    // =========================

    const style = document.createElement("style");

    style.textContent = /* css */ `
    @media screen and (max-width: 768px) {
     /* 容器改为单列块布局 */
            #classify_container { /* 选中搜索页下的漫画列表外部大容器（ul 标签） */
                display: block !important; /* 强制将外部大容器改为普通的块级布局，破除原有的多列限制 */
                white-space: normal !important; /* 强制允许内部文本正常换行，防止内容溢出屏幕宽度 */

            } /* 结束外部大容器样式的定义 */

            /* li 变成两列 grid */
             #classify_container li { /* 选中搜索页漫画列表中的每一个具体的漫画卡片条目 */
                display: grid !important; /* 核心：强制将每一个条目卡片开启网格（Grid）二维布局模式 */

                grid-template-columns: 54% 1fr !important;
               /*  grid-template-rows:  minmax(15px, 60%) auto !important; */ /* 定义网格行高：第一行标题自适应高度，第二行 info 信息行自动包裹高度 */
                width: 100% !important; /* 强行让每个漫画条目卡片的宽度填满屏幕的 100% */

                box-sizing: border-box !important; /* 设置盒模型为包含内边距与边框，确保整体宽度精准计算、绝不溢出 */
                margin: 0 0 5px 0 !important; /* 设置外边距：仅在每个条目的底部留出 10 像素的间距以作视觉隔离 */
                position: relative !important; /* 将条目设为相对定位，保持图文层级关系的稳定 */
            padding: 10px !important;
            border-bottom: 1px solid #eee !important; /* 強制在卡片底部加上一條 1 像素的淺灰色網頁分割線 */
            } /* 结束条目卡片样式的定义 */

            /* a 消除自身盒子，子元素直接参与 li 的 grid */
             #classify_container li a.ImgA { /* 选中包裹了图片和标题的超链接 a 标签 */
                display: contents !important; /* 顶级魔法：让 a 标签自身不参与排版，使其子元素（图片、标题）直接暴露给父级 Grid 容器 */
            } /* 结束超链接标签样式的定义 */

            /* 图片：左列，跨两行 */
             #classify_container li a.ImgA img { /* 选中超链接内部的原生漫画封面图片 */
                grid-column: 1 !important; /* 指定图片放置在网格的第一列（即最左侧区域） */
max-width: 400px !important;
                grid-row: 1 / 3 !important; /* 指定图片纵向跨越第一行和第二行，完美实现左侧长图独立占位的效果 */
                width: 100% !important; /* 强制图片宽度百分之百填满左侧网格列设定的 200px 宽度 */
                height: auto !important; /* 让图片高度根据宽度等比例自适应缩放，防止画面拉伸扭曲 */
                aspect-ratio: 3 / 4 !important; /* 无论图片宽度怎么变，始终保持 3:4 的漫画封面比例 */
                object-fit: cover !important; /* 若图片比例与格子不符，自动进行居中裁剪填充，确保排版整齐美观 */
            } /* 结束图片样式的定义 */

            #classify_container li a.ImgA span, /* 匹配 search 页面的标题 */
#classify_container > li .txtA    /* 匹配 albums 页面的标题 */ {

    /* 网格定位相同 */
    grid-column: 2 !important; /* 共同：两边都放置在网格的第二列（右侧文字区域） */
    grid-row: 1 !important;    /* 共同：两边都放置在网格的第一行（右上角区域） */

    /* 文字排版相同 */
    font-size: 14px !important;   /* 共同：两边字体大小统一调整为醒目的 19 像素 */
    line-height: 1.5 !important;  /* 共同：统一设置 1.5 倍的行高，防止多行时挤压 */
    color: #333 !important;       /* 共同：统一修改为适合在白底上阅读的深灰色 */

    /* 顶部间距相同 */
    margin: 22px 0 0 0 !important;/* 共同：统一向下平移 22 像素。写在最后能成功覆盖上面 albums 的 margin:0 */
    padding: 5px !important;

        overflow: scroll !important; /*强制让溢出的内容保持可见 */
    height: auto !important; /*强制高度为自动，随文字多寡自由撑开 */
    max-height:66%;
    position: static !important; /* search独有：彻底解除原网页自带的 absolute 绝对定位 */
    background: transparent !important; /* search独有：彻底清除原本压在图片下方时自带的半透明黑色背景 */
    border-radius: 0 !important; /* search独有：移除原本在压图模式下的倒角边框效果 */


}
            /* info：右下 */
             #classify_container li span.info { /* 选中列表中原本独立的、用来展示图片数量等信息的 info 标签 */
                grid-column: 2 !important; /* 指定信息文本放置在网格的第二列（即右侧文字区域） */
                grid-row: 2 !important; /* 指定信息文本放置在网格的第二行（即右下角区域） */
                padding: 0 8px 8px !important; /* 精细调整内边距：上方不留空，左右和底部留出 8 像素维持视觉平衡 */
                align-self: end !important; /* 强制让 info 信息文本在自己的网格内沿垂直方向向底部对齐 */
                overflow: visible !important;
font-size: 15px !important; /* 强制将信息文字缩小至 12 像素，与标题拉开主次层级 */

    line-height: 1.5 !important; /* 设置 1.5 倍的行高维持排版整齐 */
            margin-bottom : 15px !important;
            cursor: pointer !important; /* 强制鼠标悬停时显示手型光标，直观提示用户此处可点击 */
            } /* 结束 info 信息样式的定义 */
} /* 结束信息标签样式定义 */

    /* =========================
       ranking页topImgCon 样式
    ========================= */
    #topImgCon .select{/* 自动分列 */
        display: grid!important;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 370px), 1fr));
        gap: 3px; /* 列间距 */
    }

    /* 整个卡片 */
    #topImgCon .itemBox{
        all: unset;
        display: flex;
        align-items: stretch;/* flex-start; */
        gap: 6px;
        width: 100%;
        padding: 6px;
        box-sizing: border-box;
        position: relative;
        border-bottom: 1px solid #ddd;
        overflow: hidden;/* 防止右侧超出 */
        /* clear: both;/* 清除元素左右浮动 */ 

    }

    /* 左侧区域外层容器 */
    #topImgCon .itemImg{
        width: 54%;
        height: auto;/* 覆写原有height: 103px; */
        flex-shrink: 0;/* 不压缩 */
    }

    /* 图片 */
    #topImgCon .itemImg img{/* 当前全没用 */
        width: 100%;/* 覆写原有width: 100%; */
        height: auto;
        display: block;
    }

    /* 右侧区域外层容器 */
    #topImgCon .itemTxt{
        flex: 1;/* 自动占 剩下全部宽度 */
        display: flex;
        flex-direction: column;
        height: auto;/* 覆写原有height: 114px; */
        min-height:114px;
        contain: size;/* 忽略本列实际元素高度，强制和左侧一样 */
        min-width: 0;/*设大让小屏显示.txtItme栏但会遮挡标题*/
        margin: 0 !important;
        padding: 0 !important;
        /* height: 266; 网页原有*/
    }

    /* 对直接子元素 */
    #topImgCon .itemTxt > *{/* 好像没用到 */
        position: static !important;
        float: none !important;
    }

    /* 文字标题 */
    #topImgCon .itemTxt .title{
        height:auto;
        max-height: 66%;/* 保证显示底端.txtItme */
        line-height: 1.5;
        overflow: scroll;/* 超出可滚动 */
        white-space: normal !important;/* 好像没用 */
        margin: 0 !important;
        padding: 0 !important;
    }

    /* 信息行 */
    #topImgCon .itemTxt .txtItme{
        min-height: 15;
        height: auto;/*  覆盖原有height: 15px;*/
        overflow: hidden;
        margin: 2px 0 0 0 !important;
    }

    /* 排名徽章 */
    #topImgCon .number{
        top: 10px;
        left: 10px;
    }

    /* =========================
       Toast 提示框
    ========================= */

    .copyToast{

        position: fixed;

        left: 50%;
        bottom: 80px;

        transform: translateX(-50%);

        background: rgba(0,0,0,.8);
        color: #fff;

        padding: 10px 18px;

        border-radius: 8px;

        font-size: 14px;

        z-index: 999999;

        opacity: 0;

        transition: opacity .25s;
    }

    /* 显示状态 */
    .copyToast.showTosat{
        opacity: 1;
    }
    `;

    document.documentElement.appendChild(style);

    // =========================
    // Toast
    // =========================

    function showToast(text) {
        // 删除旧 toast
        const old = document.querySelector(".copyToast");

        if (old) old.remove();

        // 创建 toast
        const toast = document.createElement("div");

        toast.className = "copyToast";

        toast.textContent = text;

        document.body.appendChild(toast);

        // 下一帧显示
        requestAnimationFrame(() => {
            toast.classList.add("showTosat");
        });

        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove("showTosat");

            setTimeout(() => {
                toast.remove();
            }, 250);
        }, 1500);
    }

    // =========================
    // 绑定复制点击事件
    // =========================

    function bindCopyClick(clickEl, textEl) {
        // 元素不存在直接返回
        if (!clickEl || !textEl) return;

        // 鼠标小手
        clickEl.style.cursor = "pointer";

        clickEl.addEventListener("click", async (e) => {
            // 阻止默认行为
            e.preventDefault();

            // 阻止冒泡
            e.stopPropagation();

            try {
                // 复制文字
                await navigator.clipboard.writeText(textEl.textContent.trim());

                showToast("复制成功");
            } catch {
                showToast("复制失败");
            }
        });
    }

    // =========================
    // DOM 完成后执行
    // =========================

    function init() {
        // =========================
        // albums页面imgBox 处理
        // =========================

        if (document.querySelector(".imgBox")) {
            document.querySelectorAll(".imgBox li").forEach((li) => {
                // 删除 cate-0
                if (li.classList.contains("cate-0")) {
                    li.remove();
                    return;
                }

                const imgA = li.querySelector("a.ImgA.autoHeight[href]");
                //Span是search页面包含title的元素，但无法被添加href，也就是不能像ablums那样跳转
                const txtA = li.querySelector(".txtA") || imgA.querySelector("span");
                const info = li.querySelector(".info");

                // txtA 使用 imgA 链接
                if (imgA && txtA) {
                    txtA.href = imgA.href;
                    txtA.target = "_blank";
                }

                // 点击 info 复制 txtA 标题
                bindCopyClick(info, txtA);
            });
        }

        // =========================
        // Ranking页topImgCon 处理
        // =========================

        if (document.getElementById("topImgCon")) {
            document.querySelectorAll("#topImgCon .itemBox").forEach((box) => {
                const title = box.querySelector(".title");
                const dateItem = box.querySelector(".txtItme .date");
                if (title) {
                    title.target = "_blank";
                }

                // 点击日期复制标题
                bindCopyClick(dateItem, title);
            });
        }

        // =========================
        // href index → slide
        // =========================

        document
            .querySelectorAll(
                ".pic_box a[href], .itemImg a[href], a.ImgA.autoHeight[href]",
            )
            .forEach((a) => {
                if (a.href.includes("index")) {
                    a.href = a.href.replace(/index/g, "slide");

                    a.target = "_blank";
                }
            });
    }

    // =========================
    // 等待 DOM
    // =========================

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
