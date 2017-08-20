// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const INITED = '✓';
const NOTINITED = '×';

chrome.browserAction.setBadgeBackgroundColor({'color':'#0072ed'});
chrome.browserAction.setBadgeText({text: NOTINITED});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.processing){
            chrome.browserAction.setBadgeText({text:INITED});
            const settings = {};
            chrome.storage.sync.get('bittrex-enhanced-tvChart', function(data) {
                settings.tvChart = data['bittrex-enhanced-tvChart'];
                chrome.storage.sync.get('bittrex-enhanced-usdVal', function(data) {
                    settings.usdVal = data['bittrex-enhanced-usdVal'];
                    sendResponse(settings);
                });
            });
        }
        return true;
    }
);

// Settings
chrome.storage.sync.get('bittrex-enhanced-usdVal', function(data) {
    if(!data['bittrex-enhanced-usdVal']){
        chrome.storage.sync.set({'bittrex-enhanced-usdVal': true});
    }
});
chrome.storage.sync.get('bittrex-enhanced-tvChart', function(data) {
    if(!data['bittrex-enhanced-tvChart']){
        chrome.storage.sync.set({'bittrex-enhanced-tvChart': true});
    }
});
