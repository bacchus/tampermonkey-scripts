// ==UserScript==
// @name         BCC-Aliexpress-ermus19
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  exports all orders from Aliexpress; goes backwards, so start from last page
// @author       Ermus19; bacchus
// @include      http://trade.aliexpress.com/order_list.htm*
// @include      https://trade.aliexpress.com/orderList.htm*
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
    var reqs = [];

    function test(data) {
        console.log("test");
        return data;
    }

    $.when.apply(null, reqs).done(function() {
        console.log("when.apply");
    });

    function processPage() {
        $(".order-item-wraper").each((ind, el) => {
            let order = {
                id: $(el).find(".order-info .first-row .info-body ").text().trim(),
                orderDate: $(el).find(".order-info .second-row .info-body").text().trim(),
                orderPrice: $(el).find(".order-amount .amount-body .amount-num").text().trim().slice(1).trim(),
                status: $(el).find(".order-status .f-left").text().trim(),
                sellerName: $(el).find(".store-info .first-row .info-body").text().trim()
            };

            var req = new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: "https://ilogisticsaddress.aliexpress.com/ajax_logistics_track.htm?orderId=" + order.id + "&callback=test",
                    onload:(data) => {
                        var assoc = [];
                        if (typeof data.responseText !== 'undefined') {
                            var tracking = eval(data.responseText).tracking;
                            var trackingNumber = tracking.map(it => it.mailNo);//.join(", ");
                            var trackingUrl = tracking.map(it => it.officialUrl);//.join(", ");
                            for(var i=0; i<trackingNumber.length; i++) {
                                assoc[i] = trackingNumber[i] + ":" + trackingUrl[i];
                            }
                        }
                        order.trackingList = assoc.join(", ");
                        resolve(order);
                        orders.push(order);
                    },
                    onerror: () => reject(400)
                });
            });
            reqs.push(req);
        });
    }

    function finalizePage() {
        Promise.all(reqs).then(o => {
            var s = "";// = "id\t orderDate\t orderPrice\t status\t sellerName\t trackingList\t \n";
            orders.forEach(e => {
                s += e.id + "\t";
                s += e.orderDate + "\t";
                s += e.orderPrice + "\t";
                s += e.status + "\t";
                s += e.sellerName + "\t";
                s += (e.trackingList || ' ') + "\t";
                s += "\n";
            });

            orders = [];
            var curs = GM_getValue("bccAliRes", "");
            curs += s;
            GM_setValue("bccAliRes", curs);

            goNext();
        });
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

    function goNext() {
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

    function loadRecursive() {
        $("#csvBtn").text("Loading...");
        processPage();
        finalizePage();
        //goNext();
    }

    $('<button/>', {
        text: "LOAD Ermus19" ,
        id: 'csvBtn',
        click: function () {
            console.log("hello kittie=)");
            GM_setValue("loadStarted", "true");
            GM_setValue("bccAliRes", "");
            loadRecursive();
        }
    }).appendTo("#appeal-alert");

})();

