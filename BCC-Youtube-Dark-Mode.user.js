// ==UserScript==
// @name            BCC-Youtube-Dark-Mode
// @namespace       SteveJobzniak
// @version         1.6.4
// @description     A low-tech solution to a high-tech problem! Automatically clicks YouTube's "Dark Mode" button if dark mode isn't already active.
// @author          SteveJobzniak
// @license         https://www.apache.org/licenses/LICENSE-2.0
// @contributionURL https://www.paypal.me/Armindale/0usd
// @match           *://www.youtube.com/*
// @exclude         *://www.youtube.com/tv*
// @exclude         *://www.youtube.com/embed/*
// @run-at          document-end
// @grant           none
// @noframes
// ==/UserScript==

// homepage        https://greasyfork.org/scripts/32954-automatic-material-dark-mode-for-youtube
// bacchus: fix elements selectors
// Utils-MultiRetry v1.1 by SteveJobzniak
// Utils-ElementFinder v1.3 by SteveJobzniak

(function() {
    'use strict';

    // Performs multiple retries of a function call until it either succeeds or has failed all attempts.
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

    // Searches for a specific element.
    var findElement = function(parentElem, elemQuery, expectedLength, selectItem, fnCallback) {
        var elems = parentElem.querySelectorAll(elemQuery);
        if (elems.length === expectedLength) {
            var item = elems[selectItem];
            fnCallback(item);
            return true;
        }

        //console.log('Debug: Cannot find "'+elemQuery+'".');
        return false;
    };

    var retryFindElement = function(parentElem, elemQuery, expectedLength, selectItem, fnCallback, maxAttempts, waitDelay) {
        // If we can't find the element immediately, we'll perform multiple retries.
        retryFnCall(function() {
            return findElement(parentElem, elemQuery, expectedLength, selectItem, fnCallback);
        }, maxAttempts, waitDelay);
    };

    function setDarkTheme() {
        // Check the dark mode state "flag" and abort processing if dark mode is already active.
        // Wait until the settings menu is available, to ensure that YouTube's "dark mode state" and code has been loaded...
        // Note that this particular menu button always exists (both when logged in and when logged out of your account),
        // but its actual icon and the list of submenu choices differ. However, its "dark mode" submenus are the same in either case.
        retryFindElement(document, '#avatar-btn', 1, 0, function(settingsMenuButton) {
            if (document.documentElement.getAttribute('dark') === 'true') {
                return;
            }

            // We MUST open the "settings" menu, otherwise nothing will react to the "toggle dark mode" event!
            settingsMenuButton.click();

            // Wait a moment for the settings-menu to open up after clicking...
            retryFindElement(document, '#items > ytd-toggle-theme-compact-link-renderer', 1, 0, function(darkModeSubMenuButton) {
                // Next, go to the "toggle dark mode" settings sub-page.
                darkModeSubMenuButton.click();

                // Wait a moment for the settings sub-page to switch...
                // Get a reference to the "activate dark mode" button...
                retryFindElement(document, '#caption-container > paper-toggle-button', 1, 0, function(darkModeToggle) {
                    //darkModeToggle.click();

                    // We MUST now use this very ugly, hardcoded sleep-timer to ensure that YouTube's "activate dark mode" code is fully
                    // loaded; otherwise, YouTube will be completely BUGGED OUT and WON'T save the fact that we've enabled dark mode!
                    // Since JavaScript is single-threaded, this timeout simply ensures that we'll leave our current code so that we allow
                    // YouTube's event handlers to deal with loading the settings-page, and then the timeout gives control back to us.
                    setTimeout(function() {
                        // Now simply click YouTube's button to enable their dark mode.
                        darkModeToggle.click();

                        // And lastly, give keyboard focus back to the input search field... (We don't need any setTimeout here...)
                        retryFindElement(document, 'input#search', 1, 0, function(searchField) {
                            searchField.click(); // First, click the search-field to force the settings-panel to close...
                            searchField.focus(); // ...and finally give the search-field focus! Voila!
                        });
                    }, 30); // We can use 0ms here for "as soon as possible" instead, but our "at least 30ms" might be safer just in case.
                });
            });
        }, 120, 50); // 120 * 50ms = ~6 seconds of retries.
    }

    setDarkTheme();
})();
