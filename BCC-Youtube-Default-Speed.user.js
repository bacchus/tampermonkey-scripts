// ==UserScript==
// @name        BCC-Youtube-Default-Speed
// @namespace   youtubedefaultspeed
// @version     1.1.1.3
// @author      splttingatms
// @description Set a default playback rate for YouTube videos.
// @match       http*://*.youtube.com/*
// @grant       GM_getValue
// @grant       GM_setValue
// @run-at      document-idle
// @noframes
//
// homepage: https://github.com/splttingatms/YouTubeDefaultSpeed
// bacchus: fix null head
// ==/UserScript==

(function () {
    'use strict';

    var RATE_OPTIONS = ["1.5", "2.5", "3"]; // max: 16
    var RETRY_DELAY_IN_MS = 100;

    /* Performs multiple retries of a function call until it either succeeds or has failed all attempts. */
    var retryFnCall = function(fnCallback, maxAttempts, waitDelay) {
        // Default parameters: 40 * 50ms = Max ~2 seconds of additional retries.
        maxAttempts = (typeof maxAttempts !== 'undefined') ? maxAttempts : 40;
        waitDelay = (typeof waitDelay !== 'undefined') ? waitDelay : 50;

        // If we don't succeed immediately, we'll perform multiple retries.
        var success = fnCallback();
        if (!success) {
            var attempt = 0;
            var searchTimer = setInterval(function() {
                var success = fnCallback();

                // If we've reached max attempts or found success, we must now stop the interval timer.
                if (++attempt >= maxAttempts || success) {
                    clearInterval(searchTimer);
                }
            }, waitDelay);
        }
    };

    /* Searches for a specific element. */
    var findElement = function(parentElem, elemQuery, expectedLength, selectItem, fnCallback) {
        var elems = parentElem.querySelectorAll(elemQuery);
        console.log('Debug: findElement.size: "'+elems.length+'".');
        if (elems.length === expectedLength) {
            var item = elems[selectItem];
            fnCallback(item);
            return true;
        }

        console.log('Debug: Cannot find "'+elemQuery+'".');
        return false;
    };

    var retryFindElement = function(parentElem, elemQuery, expectedLength, selectItem, fnCallback, maxAttempts, waitDelay) {
        // If we can't find the element immediately, we'll perform multiple retries.
        retryFnCall(function() {
            return findElement(parentElem, elemQuery, expectedLength, selectItem, fnCallback);
        }, maxAttempts, waitDelay);
    };

    function getElement(query, callback) {
        var element = document.querySelector(query);
        if (element === null) {
            // null possible if element not loaded yet, retry with delay
            window.setTimeout(function () {
                getElement(query, callback);
            }, RETRY_DELAY_IN_MS);
        } else {
            callback(element);
        }
    }

    function setPlaybackRate(rate) {
        // video element can force unofficial playback rates
        getElement("video", function (video) {
            video.playbackRate = rate;
        });

        // movie_player div controls the displayed "Speed" in player menu
        // note: does not show values beyond official list
        getElement("#movie_player", function (player) {
            player.setPlaybackRate(rate);
        });
    }

    function setPlaybackRateToPreference() {
        var preferredRate = GM_getValue("playbackRate", 1); // default to 1 if not set yet
        setPlaybackRate(preferredRate);
    }

    function onElementSourceUpdate(target, callback) {
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                callback();
            });
        });
        observer.observe(target, {attributes: true, attributeFilter: ["src"]});
    }

    function handleRateButtonClick(rate) {
        GM_setValue("playbackRate", rate);
        setPlaybackRate(rate);
    }

    function injectButtons() {
        var form = document.createElement("form");
        form.style = "margin-right: 10px";
        RATE_OPTIONS.forEach(function (rate) {
            var input = document.createElement("input");
            input.type = "radio";
            input.name = "playbackRate";
            input.id = "playbackRate" + rate;
            input.onclick = function () { handleRateButtonClick(rate); };
            input.checked = (rate === GM_getValue("playbackRate", 1));
            var label = document.createElement("label");
            label.htmlFor = "playbackRate" + rate;
            label.innerHTML = rate;
            label.style = "margin-right: 5px";
            label.style.color = "red";
            form.appendChild(input);
            form.appendChild(label);
        });

        retryFindElement(document, '#masthead-container', 1, 0, function(head_container) { // yt-masthead-user; menu
            retryFindElement(head_container, '#container', 2, 0, function(head) {
                retryFindElement(head, '#end', 1, 0, function(end_elm) { // search
                    head.insertBefore(form, end_elm); // //head.appendChild(form);
                });
            });
        });
    }

    function main() {
        setPlaybackRateToPreference();
        injectButtons();

        // YouTube uses AJAX so monitor element for video changes
        getElement("video", function (video) {
            onElementSourceUpdate(video, function () {
                setPlaybackRateToPreference();
            });
        });
    }

    main();
})();
