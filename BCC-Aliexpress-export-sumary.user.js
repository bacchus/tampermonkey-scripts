// ==UserScript==
// @name         BCC-Aliexpress-export-sumary
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  exports orders without details from Aliexpress, for real paid sumary
// @author       bacchus
// @include      http://trade.aliexpress.com/order_list.htm
// @include      https://trade.aliexpress.com/orderList.htm
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/UserScript==

(function() {
    'use strict';

    var orders = [];

    function processPage() {
        $(".order-item-wraper").each((ind, el) => {
            let order = {
                orderId: $(el).find(".order-info .first-row .info-body ").text().trim(),
                orderDate: $(el).find(".order-info .second-row .info-body").text().trim(),
                orderPrice: parseFloat($(el).find(".order-amount .amount-body .amount-num").text().trim().slice(1).trim()),
                sellerName: $(el).find(".store-info .first-row .info-body").text().trim(),
                isMobile: $(el).find(".order-status .order-list-mobile-orders").length > 0
            };
            orders.push(order);
        });

        finalizePage();
    }

    function finalizePage() {
        var s = ""; //"orderId\t date\t price\t storeName\t mobile\t \n";
        orders.reverse();
        orders.forEach(o => {
            s += o.orderId + "\t";      // 14
            s += o.orderDate + "\t";    // 18
            s += (o.isMobile ? "mobile":"      ") + "\t";
            s += o.orderPrice + "\t";   // 4-6
            s += o.sellerName + "\t";   // few words
            s += "\n";
        });

        orders = [];
        var curs = GM_getValue("bccAliRes", "");
        curs += s;
        GM_setValue("bccAliRes", curs);
    }

    function finalizeAll() {
        var s = GM_getValue("bccAliRes", "");
        GM_setClipboard(s);
        GM_setValue("bccAliRes", "");
    }

    window.onload = function () {
        var loadStarted = GM_getValue("loadStarted", "false");
        if (loadStarted === "true") {
            loadRecursive();
        }
    };

    function loadRecursive() {
        $("#csvBtn").text("Loading...");
        processPage();
        var curPage = $(".ui-pagination-active").text().trim();
        console.log("curPage: " + curPage);
        if (curPage > 1) {
            $("#gotoPageNum").val(curPage - 1);
            $("#btnGotoPageNum").click();
        } else {
            console.log("finish!!!");
            GM_setValue("loadStarted", "false");
            finalizeAll();
            $("#csvBtn").text("Loaded to clipboard");
        }
    }

    $('<button/>', {
        text: "LOAD" ,
        id: 'csvBtn',
        click: function () {
            console.log("hello kittie=)");
            GM_setValue("loadStarted", "true");
            GM_setValue("bccAliRes", "");
            loadRecursive();
        }
    }).appendTo("#appeal-alert");

})();

