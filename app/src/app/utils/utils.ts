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
 * This module contains several useful functions applicable to several of the
 * modules of the application
 */

import * as uuid from 'uuid';

/**
* Cleans url to avoid duplication
*
* @param url - string url to scrub
*
* returns: clean url, without query string parameters or trailing slashes
*/
export function scrubUrl(url: string) {
    var cleanUrl = decodeURI(url);
    // remove url params to reduce duplication
    cleanUrl = cleanUrl.replace(/[\?|#].*$/, '');
    // remove trailing '/' character from urls, reduce duplication
    cleanUrl = cleanUrl.replace(/\/$/, '');
    return cleanUrl;
}

/**
 * Parses a query string parameter by name from the URL
 *
 * @param name - String, name of the parameter to parse
 *
 * @returns: value of the parameter
 */
export function urlParam(name: string) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results && results.length > 1) {
        return results[1]
    }
    return 0;
}

/**
 * Promisifying javascript setTimeout function
 */
export function wait(timeout: number) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, timeout);
    });
}

/**
 * Generates a unique identifier
 */
export function uuidv4() {
    const id = uuid.v4();
    return id;
}

/**
 * Downloads a file to the user
 *
 * @param fileName - string with the default file name
 * @param content - string content of the file
 */
export function download(fileName: string, content: string) {
    var downloadLink = document.createElement("a");
    var file_blob = new Blob(["\ufeff", content]);
    var url = URL.createObjectURL(file_blob);
    downloadLink.href = url;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

/**
 * Constructs a URL with gclid for validating global site tags
 *
 * @param url - the base url
 * @param includeParams - whether to include gclid params in the generated URL
 *
 * @returns constructed URL
 *
 * TODO: this should probably be a method inside GlobalSiteTagVerification, and
 * the gclid and gclsrc should be constructor parameters
 */
export function constructUrl(url: string, includeUserParams: boolean, gclidValue: string,
    gclsrcValue: string, urlSuffix: string) {
    if (!url) return;
    var newUrl = url;
    var parameters = [];
    if (includeUserParams) {
        if (gclidValue !== '') parameters.push(`gclid=${gclidValue}`);
        if (gclsrcValue !== '') parameters.push(`gclsrc=${gclsrcValue}`);
    }
    if (urlSuffix !== '' && !newUrl.includes(urlSuffix)) {
        parameters.push(`${urlSuffix.replace(/^\?/, '')}`);
    }
    if (parameters.length > 0) {
        if (newUrl.match(/\?/)) {
            newUrl += `&${parameters.join('&')}`;
        } else {
            newUrl += `?${parameters.join('&')}`;
        }
    }
    return newUrl;
}

/**
 * Updates monitor when behavior changes
 */
export function updateBehavior() {
    chrome.webRequest.handlerBehaviorChanged(() => {
        console.log('Web request handler behavior has been changed, clearing cache.');
    });
}

/**
 * General configs of the tool
 * URLs to monitor
 */
export function getMonitoringURLs() {
    return [
        "https://*.fls.doubleclick.net/activityi*",
        "http://*.fls.doubleclick.net/activityi*",
        "https://*.fls.doubleclick.net/activityj*",
        "http://*.fls.doubleclick.net/activityj*",
        "https://fls.doubleclick.net/activityi*",
        "http://fls.doubleclick.net/activityi*",
        "https://fls.doubleclick.net/activityj*",
        "http://fls.doubleclick.net/activityj*",
        "http://stats.g.doubleclick.net/r/collect/*",
        "https://stats.g.doubleclick.net/r/collect/*",
        "http://*.google-analytics.com/i/collect*",
        "http://*.google-analytics.com/j/collect*",
        "http://*.google-analytics.com/collect*",
        "http://*.google-analytics.com/g/collect*",
        "https://*.google-analytics.com/i/collect*",
        "https://*.google-analytics.com/j/collect*",
        "https://*.google-analytics.com/collect*",
        "https://*.google-analytics.com/g/collect*",
        "http://*.g.doubleclick.net/pagead/viewthroughconversion/*",
        "https://*.g.doubleclick.net/pagead/viewthroughconversion/*",
        "http://*.googleadservices.com/pagead/conversion/*",
        "https://*.googleadservices.com/pagead/conversion/*",
        "https://*.fls.doubleclick.net/activityi*",
        "http://*.fls.doubleclick.net/activityi*",
        "https://*.fls.doubleclick.net/activityj*",
        "http://*.fls.doubleclick.net/activityj*",
        "https://fls.doubleclick.net/activityi*",
        "http://fls.doubleclick.net/activityi*",
        "https://fls.doubleclick.net/activityj*",
        "http://fls.doubleclick.net/activityj*",
        "http://stats.g.doubleclick.net/r/collect/*",
        "https://stats.g.doubleclick.net/r/collect/*",
        "http://*.google-analytics.com/*",
        "https://*.google-analytics.com/*",
        "http://*.g.doubleclick.net/pagead/viewthroughconversion/*",
        "https://*.g.doubleclick.net/pagead/viewthroughconversion/*",
        "http://*.googleadservices.com/pagead/conversion/*",
        "https://*.googleadservices.com/pagead/conversion/*",
        "https://ad.doubleclick.net/activity*",
        "http://ad.doubleclick.net/activity*",
        "https://ad.doubleclick.net/ddm/activity*",
        "http://ad.doubleclick.net/ddm/activity*",
        "https://*.fls.doubleclick.net/activityi*",
        "http://*.fls.doubleclick.net/activityi*",
        "https://*.fls.doubleclick.net/activityj*",
        "http://*.fls.doubleclick.net/activityj*",
        "https://fls.doubleclick.net/activityi*",
        "http://fls.doubleclick.net/activityi*",
        "https://fls.doubleclick.net/activityj*",
        "http://fls.doubleclick.net/activityj*",
        "http://*.google-analytics.com/i/collect*",
        "http://*.google-analytics.com/j/collect*",
        "http://*.google-analytics.com/collect*",
        "http://*.google-analytics.com/g/collect*",
        "https://*.google-analytics.com/i/collect*",
        "https://*.google-analytics.com/j/collect*",
        "https://*.google-analytics.com/collect*",
        "https://*.google-analytics.com/g/collect*",
        "http://*.g.doubleclick.net/pagead/viewthroughconversion/*",
        "https://*.g.doubleclick.net/pagead/viewthroughconversion/*",
        "http://*.googleadservices.com/pagead/conversion/*",
        "https://*.googleadservices.com/pagead/conversion/*"
    ];
}