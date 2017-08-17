// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
chrome.browserAction.setBadgeBackgroundColor({'color':'#0072ed'});
chrome.browserAction.setBadgeText({text: '×'});

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript({
    code: 'Enhancer.go(window, document);'
  });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.processing){
      chrome.browserAction.setBadgeText({text:'✓'});
    } else {
      chrome.browserAction.setBadgeText({text:'×'});
    }
  });
