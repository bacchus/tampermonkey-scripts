// ==UserScript==
// @name         BCC-Aliexpress-helper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Aliexpress helper
// @author       bacchus
// @include      https://www.aliexpress.com/wholesale*
// @include      https://www.aliexpress.com/w/wholesale*
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/UserScript==

(function() {
    'use strict';

    window.onload = function () {
        $("#view-thum").click();
        $("#price_lowest_1").click();
    };

})();

