# This solution has been deprecated

# Conversion Audit Tool

The Conversion Tag Audit Tool is a Chrome extension that crawls a website and
generates a gTag (Google Analytics, Google Ads and Floodlight event tags)
report by monitoring network traffic from the page.

In this document, we will be outlining the installation, base functionality,
features and way to use the Conversion Tag Audit Tool that may come up in most
use cases.

***The Conversion Tag Audit Tool is not an officially supported Google product.***

## License

Copyright 2021 Google LLC

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.

***Note that these code samples being shared are not official Google products and
are not formally supported.***

## Contents

  - [1. Installation](#1-installation)
  - [2. Installation for Developers](#2-installation-for-developers)
  - [3. User Interface](#3-user-interface)
  - [4. How to Use It](#4-how-to-use-it)
  - [5. Output](#5-output)
  - [6. Notes](#6-notes)

## 1. Installation

1. Clone this repository using ```git clone https://github.com/google/conversion-audit.git``` or ```git clone git@github.com:google/conversion-audit.git``` if SSH has been setup.  More details on how
to set it up here -> [Setup SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/about-ssh). The code can also be downloaded as ZIP using the green **Code** button at the top.
2. In order to load the Chrome extension correctly, all the Angular files need to be built into bundles in a single folder with the required HTML, JS, CSS and manifest files that will used by the extension. In case the tool is used out of the box,
a **dist** folder has already been generated under the **app** folder. This is the folder that will be loaded in the Chrome Extensions page.
3. Open a Chrome browser window, navigate the extensions management page by browsing to: chrome://extensions/
4. On the top right of the page flip the "Developer Mode" switch to on.
5. At the top of the page, on the left, click the “Load Unpacked Extension ...” button.
6. Go to the **app** folder and then select the **dist** folder.
7. The tool should now be installed, and a new icon should show in the extensions toolbar on the top right corner of Chrome.
8. Finally click the icon in the extension toolbar to open the tool.

If the extension doesn't work due to chrome extensions restrictions in your
organization you may be need to generate a key, follow instructions here:
https://developer.chrome.com/apps/manifest/key

## 2. Installation for Developers

Follow these steps in case the tool has had some changes that want to be incorporated:

1. Open a terminal and check if npm is installed using ```npm --version```. If not,
install it following the instructions in the official npm docs [Install npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
2. Check if the Angular CLI is installed using ```ng --version```. If not,
install it following the instructions in the official Angular docs [Install the Angular CLI](https://angular.io/guide/setup-local#install-the-angular-cli).
3. Clone this repository using ```git clone https://github.com/google/conversion-audit.git``` or
```git clone git@github.com:google/conversion-audit.git``` if SSH has been setup. More details on how
to set it up: [Setup SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/about-ssh).
4. Once cloned, go to the ***app*** folder using ```cd app``` and install the required dependencies using ```npm install```.
5. Then, in order to load the Chrome extension correctly, all the Angular files need to be built into bundles in a single folder with the required HTML, JS, CSS and manifest files that will used by the extension. To build the files execute the build script ```./build.sh```. After this, a new ***dist*** folder will be created. This is the folder that will be loaded in the Chrome Extensions page.
- Once the files are built, the console will show something like this:
    - ✔ Browser application bundle generation complete.
    - ✔ Copying assets complete.
    - ✔ Index html generation complete.
- **NOTE:** If for some reason the code is changed, it needs to be rebuilt and reloaded in Chrome again to identify the changes.
6. Open a Chrome browser window, navigate the extensions management page by browsing to: chrome://extensions/
7. On the top right of the page flip the "Developer Mode" switch to on.
8. At the top of the page, on the left, click the “Load Unpacked Extension ...” button.
9. Select the ***dist*** folder created when the source code was built.
10. The tool should now be installed, and a new icon should show in the extensions toolbar on the top right corner of Chrome.
11. Finally click the icon in the extension toolbar to open the tool.

If the extension doesn't work due to chrome extensions restrictions in your
organization you may be need to generate a key, follow instructions here:
https://developer.chrome.com/apps/manifest/key

Add a new "key" field in manifest.json and set the value to your key.

## 3. User Interface

<img src="images/ui.png">

In this section we are going to outline the functionality of each element within
the **Settings** panel.

1.  *Domain* - Displays the top level domain for the website in the tab the tool
    was open in.

2.  *Depth (optional)* - Determines how deep in the web page directory path you
    wish for the tool to scrape from the root domain

3.  *Load Time (seconds) (optional)* - This setting determines how long the tool
    allows for a page to load before moving onto the next page. \*It is
    critically important if using the tool in automated mode to choose a page
    load time that would be inclusive of when Google tags fire or use a load
    time that aligns with typical user navigation time.

4.  *URL Suffix* - Optional field to add URL suffix to URL string

5.  *Enable Manual Mode - (defaults to off)* - If checked, the tool will run the
    audit in manual mode meaning that it will not automatically visit and scrape
    web pages. Instead it will sit back passively and record any floodlight
    light activity as the user navigates through the website on their Chrome
    tab. This allows a user to audit particular pages, completing actions
    (button click, sign up, test purchase) to record activity based.

6.  *Enable Global Site Tag Verification - (defaults to off)* - If checked, it
    will enable the feature to capture Global Site Tag and cookie information on
    each visited page (compatible with manual and default automatic mode) which
    will be displayed in a separate table similar to the floodlight table.

7.  *Show Page with No Conversion Tags - (defaults to off)* - If checked, tells
    the tool to add an entry in the Conversion Tag Report table for web pages
    that were visited and where no conversion tags were captured. If this
    feature is not activated, by default the tool will only record entries on
    pages where conversion tags were present, leaving out pages with no
    conversion tags.

8.  *File Upload* - Optional field to upload a csv list of URLs for the tool to
    crawl (no URL volume limit)

9.  *Run Button* - Will trigger the audit process once it is clicked. After the
    first click, it will be replaced by a Stop button which will terminate the
    audit.

10. *Download Button* - Allows the user to download the audit results as a csv
    file matching the information displayed in the UI. It will download
    Floodlight results and Global Site Tag (if enabled by user) results as
    separate CSV files. Can be clicked at any point during the audit process.

## 4. How to Use It

1.  Navigate to the page from which you want to start with in Chrome, usually
    the websites home page;
2.  Open the tool by clicking the icon from the chrome toolbar;
3.  The Domain is pre-populated based on the domain on the page from which you
    started, you can change it to narrow down the pages that should be crawled;
4.  (OPTIONAL) Check “Enable Manual Mode” you wish to run the audit in manual
    mode. If checked you as the user will need to navigate through the website
    manually.
5.  (OPTIONAL) Check “Enable Global Site Tag Verification” to enable and record
    GST and cookie data during the audit.
6.  (OPTIONAL) Check the “Show Pages with No Conversion Tags” in case you want
    the report to include pages that are visited but do not cause floodlight
    tags to be fired. This is particularly useful if you want to determine pages
    that are not being tracked.
7.  Click the Run button, and wait as the crawler starts to visit your site.
    Note, keep the tool popup open, if you close it by clicking anywhere on
    Chrome the process will stop, and you will only get a partial report.
8.  Once the crawling is over and the number of pages visited is the same as the
    number of pages found then the audit will be marked as completed. At this
    point you can click the Download button to export a CSV version of the final
    Floodlight and Global Site Tag report (if enabled).

## 5. Output

1.  *Page* - URL that was crawled for that result
2.  *Tag Type* - Floodlight, Google Ads Conversion Tags, Google Analytics
    Conversion Tags
3.  *Account ID* - Config ID of the associated Global Site Tag
4.  *gTag (Y/N)* - Flag to confirm associated gTag was observed\*
5.  *Network Call* - Network call of the observed tag
6.  *Floodlight ID* - Floodlight Activity ID
7.  *Floodlight Activity Tag* - Floodlight Activity Tag. “Cat=” Parameter value.
8.  *Floodlight Activity Group* - Floodlight Activity Group. “Type=” Parameter
    value
9.  *Floodlight Sales Order* - Order ID or cachebuster random number, depending
    on whether the tag in question is a Sales Tag or a Counter Tag
10. *Floodlight uVariables* - Custom uVariables associated with the floodlight
    in question and whether they pulled in values for that Floodlight fire
11. *Warnings* - Some warnings (like calling out empty uVariables) may be
    expected. We are just highlighting this for you to look into if you wish.
12. *Errors* - Any implementation errors we observe

## 6. Notes

*   \*If you are seeing “False” for the “OGT” Column in the Conversion Tag
    Report section:
    *   Check that the Global Site Tag (gTag) includes the Config ID associated
        to the conversion tag
    *   Ensure the gTag is implemented properly and is firing immediately on
        each page. If there is a delay, the output could show pages as not being
        tagged
    *   Validate that the specific Conversion or Remarketing actions are
        deployed using GTM or a gTag Event Snippet
*   Google Analytics calls are captured with google-analytics.com domains. If it
    is a newer GA4 implementation the calls will not be captured if they are
    hitting analytics.google.com instead of google-analytics.com/g/collect.
