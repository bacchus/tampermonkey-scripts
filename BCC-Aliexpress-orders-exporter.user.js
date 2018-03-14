// ==UserScript==
// @name         BCC-Aliexpress-orders-exporter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  exports all orders from Aliexpress; goes backwards, so start from last page
// @author       bacchus
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

    var products = [];

    function processPage() {
        $(".order-item-wraper").each((ind, el) => {
            let order = {
                id: $(el).find(".order-info .first-row .info-body ").text().trim(),
                orderDate: $(el).find(".order-info .second-row .info-body").text().trim(),
                sellerName: $(el).find(".store-info .first-row .info-body").text().trim(),
                sellerLink: "https:"+$(el).find(".store-info .second-row").find("a").eq(0).attr("href"),
                orderPrice: parseFloat($(e).find(".order-amount .amount-body .amount-num").text().trim().slice(1).trim()),
                status: $(el).find(".order-status .f-left").text().trim(),
                isMobile: $(el).find(".order-status .order-list-mobile-orders").length > 0
                //hasTracking: $(el).find(".button-logisticsTracking ").length > 0
                //productPriceAndAmount: $(el).find(".product-right .product-amount").text().trim().replace(/(?:\s\s)/g, ""),
                //productsNames: products.map((it) => it.title).join(", ")
            };

            /*
            var reqs = [];
            if (order.hasTracking) {
                function test(data) { return data; }
                var req = new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: "https://ilogisticsaddress.aliexpress.com/ajax_logistics_track.htm?orderId=" + order.id + "&callback=test",
                        onload:(data) => {
                            order.tracking = eval(data.responseText).tracking;
                            order.trackingNumber = order.tracking.map(it => it.mailNo).join(", ");
                            resolve(order);
                            orders.push(order);
                        }
                        , onerror: () => reject(400)
                    });
                });
                reqs.push(req);
            }

            $.when.apply(null, reqs).done(function() {
                //console.log(orders);
            });

            Promise.all(reqs).then(o => {
                var s = "";
                orders.forEach(e => {
                    s += e.id + "\t";
                    ...
                });
            });
            */

            $(el).find(".order-body").each((i,e) => {
                // there is one .product-sets, mb its done for check if it exists
                $(e).find(".product-sets").each((i,e) => {
                    let obj = {
                        id: $(e).find(".product-title").find("a").attr("productid"),
                        pic: $(e).find(".product-left").find("a").find("img").attr("src"),
                        title: $(e).find(".product-title").text().trim(),
                        price: parseFloat($(el).find(".product-amount span:first()").text().trim().slice(1).trim()),
                        amount: $(e).find(".product-amount span:eq(1)").text().trim().slice(1),
                        property: $(e).find(".product-property span").text().trim(),
                        memo: $(e).find(".product-memo").text().trim(),
                        // order details
                        orderId: order.id,
                        orderDate: order.orderDate,
                        store: order.sellerName,
                        storeLink: order.sellerLink,
                        status: order.status
                    };
                    products.push(obj);
                });
            });
        });
    }

    function finalizePage() {
        var s = ""; //"prodId\t orderId\t date\t pic\t price1\t amount\t storePage\t storeName\t status\t title\t property\t memo\n";
        products.reverse();
        products.forEach(prod => {
            s += prod.id + "\t";           // 11
            s += prod.orderId + "\t";      // 14
            s += prod.orderDate + "\t";    // 18
            s += prod.pic + "\t";          // 61
            s += prod.price + "\t";        // 4-6
            s += prod.amount + "\t";       // 1-3
            s += prod.storeLink + "\t";    // 39
            s += prod.store + "\t";        // few words
            s += prod.status + "\t";       // few words
            s += prod.title + "\t";        // loong
            //s += prod.property + "\t";     // long (add to title, TODO: span > span trim)
            //s += prod.memo + "\t";         // xz (never occur)
            s += "\n";
        });

        products = [];
        var curs = GM_getValue("bccAliRes", "");
        curs += s;
        GM_setValue("bccAliRes", curs);
        
        goNext();
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
        text: "LOAD bcc" ,
        id: 'csvBtn',
        click: function () {
            console.log("hello kittie=)");
            GM_setValue("loadStarted", "true");
            GM_setValue("bccAliRes", "");
            loadRecursive();
        }
    }).appendTo("#appeal-alert");

})();

