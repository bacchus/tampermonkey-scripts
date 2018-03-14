// ==UserScript==
// @name         Disable-Youtube-autoplay
// @version      1.1
// @description  This script turns off Youtube's newest autoplay feature after the page loads
// @author       Jeff Bellucci
// @match        *://www.youtube.com/*
// @run-at       document-start
// @grant        none
// @namespace http://tampermonkey.net/
// ==/UserScript==

(function() {
    'use strict';
    function uncheck(toggle) {
        if (toggle.hasAttribute("checked")) {
            toggle.click();
        }
    }

    function disableAfterLoad() {
        var autoplayToggle = document.getElementById('toggle');
        if (autoplayToggle) {
            uncheck(autoplayToggle);
        } else {
            setTimeout(disableAfterLoad, 500);
        }
    }

    disableAfterLoad();
})();
