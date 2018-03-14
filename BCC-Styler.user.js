// ==UserScript==
// @name         BCC-Styler
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  change sites style to my nice one
// @author       bacchus
// @match        http*://*/*
// @exclude      https://www.chess.com/*
// @exclude      https://github.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function addGlobalStyle(css) {
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        head.appendChild(style);
    }

    function myFixStyle() {
        addGlobalStyle('html, body, div, ul, ol, li, dl, dt, dd, form, table, tr, td, h1, h2, h3, h4, h5, h6, p, span, a, b, i, input, textarea, fieldset, figure {font-family:Ubuntu !important;}');
        addGlobalStyle('code {font-family:Ubuntu Mono !important;}');

        //addGlobalStyle('.entryBody { max-width: 900px !important; }');
        //addGlobalStyle('#feedlyFrame { width: 1230px !important; }');
        //addGlobalStyle('#feedlyPage { width: 900px !important; }');
        //addGlobalStyle('.entryBody .content img { max-width: 850px !important; width: auto !important; height: auto !important; max-height: 600px !important;}');
    }

    myFixStyle();
})();
