// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const INITED = '✓';
const NOTINITED = '×';
const TRADING_VIEW_DEFAULT_OPTIONS = {
    width: '100%',
    height: 400,
    interval: 30,
    timezone: 'America/New_York',
    theme: 'Light',
    style: 1,
    locale: 'en',
    enable_publishing: false,
    withdateranges: true,
    studies: [],
    hide_side_toolbar: false,
    show_popup_button: true,
    popup_width: 1000,
    popup_height: 650,
    allow_symbol_change: true,
    hideideas: true
};

chrome.browserAction.setBadgeBackgroundColor({'color':'#0072ed'});
chrome.browserAction.setBadgeText({text: NOTINITED});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.processing){
            chrome.browserAction.setBadgeText({text:INITED});
            const settings = {};
            chrome.storage.sync.get([
                'bittrex-enhanced-tvChart', 
                'bittrex-enhanced-usdVal', 
                'bittrex-enhanced-tvChartOpts'
            ], function(data) {
                console.log(data);
                settings.tvChart = data['bittrex-enhanced-tvChart'];
                settings.usdVal = data['bittrex-enhanced-usdVal'];
                settings.tradingViewOpts = data['bittrex-enhanced-tvChartOpts'] || {};
                sendResponse(settings);
            });
        }
        return true;
    }
);

// Settings
chrome.storage.sync.get([
    'bittrex-enhanced-usdVal',
    'bittrex-enhanced-tvChart',
    'bittrex-enhanced-tvChartOpts'
], function(data) {
    if(!data['bittrex-enhanced-usdVal']){
        chrome.storage.sync.set({'bittrex-enhanced-usdVal': true});
    }
    if(!data['bittrex-enhanced-tvChart']){
        chrome.storage.sync.set({'bittrex-enhanced-tvChart': true});
    }
    if(!data['bittrex-enhanced-tvChartOpts']){
        chrome.storage.sync.set({'bittrex-enhanced-tvChartOpts': TRADING_VIEW_DEFAULT_OPTIONS})
    }
});
