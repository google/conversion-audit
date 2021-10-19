/***************************************************************************
*
*  Copyright 2021 Google Inc.
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      https://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*
*  Note that these code samples being shared are not official Google
*  products and are not formally supported.
*
***************************************************************************/

/**
 * Chrome extension's entry point to launch the Conversion Tag Audit tool
 * in an separate window.
 */

document.addEventListener("DOMContentLoaded", function () {
  var launchButton = document.getElementById("launch");
  launchButton.addEventListener('click', () => {
    chrome.windows.getCurrent(win => {
      chrome.tabs.query({
        "active": true,
        "windowId": win.id
      }, tabs => {
        console.log(tabs);
        chrome.windows.create({
          type: "popup",
          url: "index.html?winId=" + win.id + "&" + "tabId=" + tabs[0].id,
          width: 1300,
          height: 800
        }, newWindow => {
          window.close();
        });
      });
    });
  });
});