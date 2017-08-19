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
    }
  });
