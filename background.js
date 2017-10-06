// The MIT License (MIT)

// Copyright (c) 2017 Nirvana Tikku

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

const INITED = '✓';
const NOTINITED = '×';
const TRADING_VIEW_DEFAULT_OPTIONS = {
    width: '100%',
    height: 550,
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
