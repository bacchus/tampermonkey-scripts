// ==UserScript==
// @name         BCC-Facebook-unsponsored
// @namespace    http://tampermonkey.net/
// @version      1.12.3.2
// @description  Block Facebook news feed "sponsored" posts
// @author       solskido
// @match        https://www.facebook.com/*
// @run-at       document-idle
// @grant        none
//
// homepage: https://greasyfork.org/en/scripts/22210-facebook-unsponsored
// Thanks to: enm, Mathieu
// bacchus: only en, add video block
// ==/UserScript==

(function() {
    'use strict';
    // Selectors
    var streamSelector = 'div[id^="topnews_main_stream"]';
    var storySelector = 'div[id^="hyperfeed_story_id"]';
    var searchedNodes = [{
        // Sponsored
        'selector': [
            '.fbUserPost span > div > a:not([title]):not([role]):not(.UFICommentActorName):not(.uiLinkSubtle):not(.profileLink)',
            '.fbUserStory span > div > a:not([title]):not([role]):not(.UFICommentActorName):not(.uiLinkSubtle):not(.profileLink)',
            '.fbUserContent span > div > a:not([title]):not([role]):not(.UFICommentActorName):not(.uiLinkSubtle):not(.profileLink)'
        ],
        'content': {
            'en':      ['Sponsored', 'Chartered']
        }
    }, {
        // Suggested Post
        'selector': [
            '.fbUserPost div > div > span > span',
            '.fbUserStory div > div > span > span',
            '.fbUserContent div > div > span > span'
        ],
        'content': {
            'en':        ['Suggested Post', 'Recommended fer ye eye', 'Recommended for you']
        }
    }, {
        // Popular Live Video                                                      // A Video You May Like
        'selector': [
            '.fbUserPost div > div > div:not(.userContent)',
            '.fbUserStory div > div > div:not(.userContent)',
            '.fbUserContent div > div > div:not(.userContent)'
        ],
        'exclude': function(node) {
            if(!node) {
                return true;
            }

            return (node.children && node.children.length);
        },
        'content': {
            'en':        ['Popular Live Video',                                    'A Video You May Like']
        }
    }, {
      // Popular Across Facebook
        'selector': [
            '.fbUserPost > div > div > div',
            '.fbUserStory > div > div > div',
            '.fbUserContent > div > div > div'
        ],
        'content': {
            'en':        ['Popular Across Facebook']
        }
    }, {
        // Page Stories You May Like
        'selector': [
            'div[title="Page Stories You May Like"] > div > div > div > div'
        ],
        'content': {
            'en':        ['Page Stories You May Like']
        }
    }, {
        // Video
        'selector': [
            '.fbUserStory > div > div > div > div > div > div > div > div > div > h5 > span > span > a',
            'div > div > div > div > div > div > div > div > div > div > h5 > span > span > a',
            'div > div > div > div > div > div > div > div > div > div > div > h5 > span > span > a',
            'div > div > div > div > div > div > div > div > div > div > div > div > h5 > span > span > a'
        ],
        'content': {
            'en':        ['video', 'a photo and a video', 'post']
        }
    }];

    var language = document.documentElement.lang;
    var nodeContentKey = (('innerText' in document.documentElement) ? 'innerText' : 'textContent');
    var mutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

    // Default to 'en' when the current language isn't yet supported
    var i;
    for(i = 0; i < searchedNodes.length; i++) {
        if(searchedNodes[i].content[language]) {
            searchedNodes[i].content = searchedNodes[i].content[language];
        }
        else {
            searchedNodes[i].content = searchedNodes[i].content.en;
        }
    }

    var body;
    var stream;
    var observer;

    function block(story) {
        if(!story) {
            return;
        }

        story.remove();
    }

    function isSponsored(story) {
        if(!story) {
            return false;
        }

        var nodes;
        var nodeContent;

        var typeIterator;
        var selectorIterator;
        var nodeIterator;
        var targetIterator;
        for(typeIterator = 0; typeIterator < searchedNodes.length; typeIterator++) {
            for(selectorIterator = 0; selectorIterator < searchedNodes[typeIterator].selector.length; selectorIterator++) {
                nodes = story.querySelectorAll(searchedNodes[typeIterator].selector[selectorIterator]);
                for(nodeIterator = 0; nodeIterator < nodes.length; nodeIterator++) {
                    nodeContent = nodes[nodeIterator][nodeContentKey];
                    if(nodeContent) {
                        for(targetIterator = 0; targetIterator < searchedNodes[typeIterator].content.length; targetIterator++) {
                            if(searchedNodes[typeIterator].exclude && searchedNodes[typeIterator].exclude(nodes[nodeIterator])) {
                                //console.log("skip", story);
                                continue;
                            }

                            if(nodeContent.trim() == searchedNodes[typeIterator].content[targetIterator]) {
                                return true;
                            }
                        }
                    }
                }
            }
        }

        return false;
    }

    function process() {
        // Locate the stream every iteration to allow for FB SPA navigation which
        // replaces the stream element
        stream = document.querySelector(streamSelector);
        if(!stream) {
            return;
        }

        var stories = stream.querySelectorAll(storySelector);
        if(!stories.length) {
            return;
        }

        var i;
        for(i = 0; i < stories.length; i++) {
            if(isSponsored(stories[i])) {
                block(stories[i]);
            }
        }
    }

    if(mutationObserver) {
        body = document.querySelector('body');
        if(!body) {
            return;
        }

        observer = new mutationObserver(process);
        observer.observe(body, {
            'childList': true,
            'subtree': true
        });
    }
})();
