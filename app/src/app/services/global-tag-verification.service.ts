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

import { Injectable } from '@angular/core';
import { scrubUrl } from '../utils/utils';
import { GlobalSiteTagType } from '../models/global-site-tag';
import { Subject } from 'rxjs';
import { GlobalSiteTag } from '../models/global-site-tag';

@Injectable()
export class GlobalTagVerificationService {

    verificationUrl: string = '';
    verificationTabId: number = 0;
    isLoading: boolean = false;
    globalSiteTags: GlobalSiteTagType = {};
    id: number = 0;
    gclid: string = '';
    domain: string = '';
    verificationEnabled: boolean = false;
    manualSet: boolean = false;
    tagResetEnabled: boolean = false;
    // The emitter subject event to detect when a tag needs to be added to the table
    // in the global-site-tag-report component. Used for x-component communication
    // between the settings-form component and the global-tag-verification-report component.
    addToTableEmitter = new Subject<GlobalSiteTag>();
    // The emitter subject event to detect when the global-site-tag-report should be hidden.
    // Used for x-component communication between the settings-form component and the
    // global-tag-verification-report component.
    showGlobalSiteReportEmitter = new Subject<boolean>();

    constructor() {}

    setDomain(domain: string) {
        this.domain = domain;
    }

    setVerificationEnabled(verificationEnabled: boolean) {
        this.verificationEnabled = verificationEnabled;
    }

    setManualSet(manualSet: boolean) {
        this.manualSet = manualSet;
    }

    setTagResetEnabled(tagResetEnabled: boolean) {
        this.tagResetEnabled = tagResetEnabled;
    }

    setUrl = (url: string) => {
        this.addToGSTMap(url)
    }

    setTabId = (id: number) => {
        this.verificationTabId = id;
    }

    setGclid = (newGclid: string) => {
        this.gclid = newGclid;
    }

    initService() {
        this.verificationUrl = '';
        this.verificationTabId = 0;
        this.isLoading = false;
        this.globalSiteTags = {};
        this.id = 0;
        this.gclid = '';
        this.domain = '';
        this.verificationEnabled = false;
        this.manualSet = false;
        this.tagResetEnabled = false;
    }

    /**
     * Calls the subject emitter method that allows x-component communication.
     * This helps to update the table in the global-site-tag-verification-report
     * component when a new tag is found.
     * @param url - The current url.
    */
    showGlobalSiteReport(show: boolean) {
        this.showGlobalSiteReportEmitter.next(show);
    }

    addToGSTMap = (url: string) => {
        let cleanUrl = scrubUrl(url);
        if (!this.globalSiteTags.hasOwnProperty(cleanUrl)) {
            this.globalSiteTags[cleanUrl] = {
                id: this.id,
                url: cleanUrl,
                tags: [],
                cookies: []
            }
            this.id += 1;
        }
    }

    /**
     * Sets up global tag verification and cookie verification
     * listeners for the current instance.
     * @param url - The current url.
     * @param tabId - The id of the tab.
     * @param gclid - The generated gclid.
     */
    globalVerificationSetup = (url: string, tabId: number, gclid: string) => {
        this.addToGSTMap(url);
        this.setTabId(tabId);
        this.setGclid(gclid);
        // add no-cache headers onto outgoing requests to
        // prevent tham from being cached
        chrome.webRequest.onBeforeSendHeaders.addListener(
            this.disableRequestCache,
            {
                "urls": [
                    "http://www.googletagmanager.com/*",
                    "https://www.googletagmanager.com/*"
                ]
            }
        );
        chrome.webRequest.onCompleted.addListener(
            this.verificationProxy,
            {
                "urls": [
                    "http://www.googletagmanager.com/*",
                    "https://www.googletagmanager.com/*"
                ]
            }
        );
        chrome.tabs.onUpdated.addListener(this.cookieVerification);
    }

    /**
     * Resets the GlobalTagVerification instance to
     * its initial state. Removes all listeners, clears
     * global site table in the DOM, and resets instance
     * variables
     */
    globalVerificationReset = () => {
        this.verificationUrl = '';
        this.verificationTabId = 0;
        this.isLoading = false;
        this.globalSiteTags = {};
        this.id = 0;
        this.removeVerificationListener();
        this.clearGlobalSiteTables();
    }

    /**
     * Removes verification listeners.
     */
    removeVerificationListener = () => {
        // chrome.webRequest.onCompleted.removeListener(this.globalTagVerification)
        chrome.webRequest.onBeforeSendHeaders.removeListener(this.disableRequestCache)
        chrome.webRequest.onCompleted.removeListener(this.verificationProxy)
        chrome.tabs.onUpdated.removeListener(this.cookieVerification)
    }

    /**
     * Clears contents of Global Site Tag table in the DOM.
     */
    clearGlobalSiteTables = () => {
        /* TODO ae MODIFIED */
        //$('#first-party-cookie-body, #network-call-body, #global-site-panel-url').html("");
    }

    /**
     * Removes all cookies under the given domain.
     *
     * @param {string} url - url associated with cookie
     * @param {string} cookieDomain - specific domain which cookies belong to
     */
    clearFirstPartyCookies = (url: string, cookieDomain: string) => {
        console.log(`clearing fp cookies: ${url} ${cookieDomain}`);
        chrome.cookies.getAll({ 'domain': cookieDomain }, (cookies) => {
            cookies.forEach(c => {
                chrome.cookies.remove({ 'url': url, 'name': c.name })
            })
        })
    }

    printGlobalSiteTable = () => {
        let output = 'URL,AccountIDs,Cookies\r\n'
        Object.keys(this.globalSiteTags).forEach(page => {
            let tags = this.globalSiteTags[page].tags.length > 0
                ? `${this.globalSiteTags[page].tags.join('; ')}`
                : null;
            let cookies = this.globalSiteTags[page].cookies.length > 0
                ? `${this.globalSiteTags[page].cookies.join('; ')}`
                : null;
            output += `${this.globalSiteTags[page].url || 'None'},${tags || 'None'},${cookies || 'None'}\r\n`;
        });
        return output;
    }

    /**
     * Adds table row to specified table element using the row values passed.
     *
     * @param {string} tableName - id of table DOM element
     * @param {string []} rowValues - array of data values to construct row from
     */
    addToGlobalSiteTable = (tableName: string, rowValues: []) => {
        /* TODO ae MODIFIED */
        /*var table;
        var row = '';
        if(tableName === 'first-party-cookie' && rowValues.length > 0) {
            row = "<tr>" // start row
            rowValues.forEach(v => {
                row += `<td>${v}</td>`;
            })
            row += "</tr>" // end row
        } else if(tableName === 'network-call' && rowValues.length > 0) {
            row = "<tr>" // start row
            rowValues.forEach(v => {
                row += `<td>${v}</td>`;
            })
            row += "</tr>" // end row
        }
        table = $(`#${tableName}-body`);
        if(table && row) {
            table.append(row);
        }*/
    }

    addGlobalSiteTag = (url: string) => {
        /*var page_url = decodeURI(url);
        var id = this.globalSiteTags[page_url].id;
        var table = $('#network-call-body');
        // var element = $(`td#${id}_tag`);
        var element = $(`tr#global_tag_${id}`);
        var tags = this.globalSiteTags[page_url].tags.length > 0 ?
            this.globalSiteTags[page_url].tags.join(',</br>') : 'None';
        var cookies = this.globalSiteTags[page_url].cookies.length > 0 ?
            this.globalSiteTags[page_url].cookies.join(',</br>') : 'None';
        var content;
        content = `<td id="${id}_url">${page_url}</td>`;
        content += `<td id="${id}_tag">${tags}</td>`;
        content += `<td id="${id}_cookie">${cookies}</td>`;
        if(element.length > 0) {
            element.html(content);
        } else {
            var row = `<tr id="global_tag_${id}">${content}</tr>`;
            table.append(row);
        }*/
    }

    /**
     * Calls the subject emitter method that allows x-component communication.
     * This helps to update the table in the global-site-tag-verification-report
     * component when a new tag is found.
     * @param url - The current url.
    */
    addGlobalSiteTagToComponent(url: string) {
        let globalTag = this.buildGlobalSiteTag(url);
        this.addToTableComponent(globalTag);
    }

    /**
     * Subject emitter that allows x-component communication.
     * This helps to update the table in the global-site-tag-verification-report
     *  component when a new global tag is found.
     * @param globalTag - The global tag found.
    */
    addToTableComponent(globalTag: GlobalSiteTag | undefined) {
        this.addToTableEmitter.next(globalTag);
    }

    buildGlobalSiteTag(url: string) {
        var page_url = decodeURI(url);
        var id = this.globalSiteTags[page_url].id;
        var tags = this.globalSiteTags[page_url].tags.length > 0 ?
            this.globalSiteTags[page_url].tags.join(',\n') : 'None';
        var cookies = this.globalSiteTags[page_url].cookies.length > 0 ?
            this.globalSiteTags[page_url].cookies.join(',\n') : 'None';
        return {
            id: id,
            url: page_url,
            tags: tags,
            cookies: cookies
        }
    }

    /**
     * Formats string of comma seperated domain values and formats it into a regular
     * expression to match them. Return null if there are no user entered domains.
     *
     * @param {string} domains - string of domains, seperated by commas.
     * @returns {string} String representing a regex of all the given domains.
     */
    formatDomains = (domains: string) => {
        if (!domains) return null;
        let formatted_white_list = domains.split(',')
        if (formatted_white_list.length === 1 && formatted_white_list[0] === '') {
            return null;
        }
        return formatted_white_list.map(
            i => i.trim().replace('.', '\\.')
        ).filter(
            j => j.trim() !== ''
        ).join('|');
    }

    disableRequestCache = (details: any) => {
        let headers = details.requestHeaders || [];
        headers.push({
            "name": "Cache-Control",
            "value": "no-cache"
        });
        return { requestHeaders: headers };
    }

    /**
     * Pulls all necesary form data to funnel network event into the global
     * tag verification function with the proper parameters based on the domain
     * the event originated from and user settings.
     *
     * @param {Event} event - webrequest chrome event.
     */
    verificationProxy = (event: any) => {
        if (this.verificationEnabled) {
            let domain_regex = new RegExp(`${this.domain.replace('.', '\\.')}`);
            if (this.manualSet) {
                if (event.initiator.match(domain_regex)) {
                    this.globalTagVerification(event, event.tabId)
                }
            } else {
                this.globalTagVerification(event, this.verificationTabId)
            }
        }
    }

    /**
     * Sets Global Site Tag panel url and delegates event to parseTagmanager function.
     *
     * @param {Event} event - webrequest chrome event.
     * @param {number} tabId - id of the tab from which the request originated.
     */
    globalTagVerification = (event: any, tabId: number) => {
        /* TODO ae MODIFIED */
        chrome.tabs.get(tabId, (tab) => {
            if (tab && tab.url) {
                this.addToGSTMap(tab.url);
                let cleanUrl = scrubUrl(tab.url);
                // Pass in cleaned up URL to ensure value matches what was added to the map
                this.parseTagManager(cleanUrl, event);
            }
        });
    }

    /**
     * Parses web request url, if it originates from Google Tag Manager,
     * for accountId and network call status. Passes results to be written
     * out to table.
     *
     * @param {string} pageUrl - the page URL.
     * @param {Event} event - webrequest chrome event.
     */
    parseTagManager = (pageUrl: string, event: any) => {
        /* TODO ae MODIFIED */
        let u = event.url;
        let val;
        if (u.match(/googletagmanager\.com/)) {
            // previous logic - u.match(/js\?id\=([\w-]*)/) && event.statusCode === 200
            val = u.match(/js\?id\=([\w-]*)/);
            if (val) {
                if (this.globalSiteTags[pageUrl].tags.indexOf(val[1]) === -1) {
                    this.globalSiteTags[pageUrl].tags.push(val[1]);
                    /* TODO ae COMMENTED OUT FOR NOW IN FAVOR OF THE NEW TABLE IN ANGULAR
                    this.addGlobalSiteTag(pageUrl); */
                    this.addGlobalSiteTagToComponent(pageUrl);
                }
            }
        }
    }

    /**
     * Recieves any chrome tab update filtering for only updates to window location.
     * Delegates tab updates to cookie scraping function if tab meets user criteria.
     *
     * Reference chrome.tabs.onUpdated.addListener:
     * https://developer.chrome.com/extensions/tabs#event-onUpdated
     *
     * @param {number} updatedTabId - ID of updated tab.
     * @param {Object} changeInfo - Lists the changes to the state of the tab that was updated.
     * @param {Object} tab - Gives the state of the tab that was updated.
     *
     */
    cookieVerification = (updatedTabId: number, changeInfo: any, tab: any) => {
        // +++++++++ DO NOT REMOVE - may revisit this logic in the future +++++++++ //
        // ++++++++++++++ Also used int verificationProxy() function ++++++++++++++ //
        // var linked_domains = document.getElementById('linked-domains').value;
        // var linked_domain_list = this.formatDomains(linked_domains);
        // var domain_regex = linked_domain_list ?
        //     new RegExp(`(\w*\d*.)?${domain.replace('.', '\\.')}|${linked_domain_list}`):
        //     new RegExp(`(\w*\d*.)?${domain.replace('.', '\\.')}`);
        // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ //

        if (this.verificationEnabled) {
            // generate regex to match incoming tab url with top level domain
            let tab_url = decodeURI(tab.url);
            let domain_regex = new RegExp(`(\w*\d*\.)?${this.domain.replace('.', '\\.')}`);
            let domain_match = tab_url.match(domain_regex);
            if (this.manualSet) {
                if (changeInfo.status === 'complete' && domain_match) {
                    this.updateCookies(this.domain, tab_url);
                }
            } else {
                if (updatedTabId === this.verificationTabId) {
                    if (this.tagResetEnabled && changeInfo.status === 'loading' && changeInfo.url) {
                        this.clearFirstPartyCookies(tab_url, this.domain);
                    } else if (changeInfo.status && domain_match) { //&& tab_url === verificationUrl) {
                        this.updateCookies(this.domain, tab_url);
                    }
                }
            }
        }
    }

    /**
     * Fetches all cookies that match the passed domain parameter and parses
     * through to find first party doubleclick/adword cookies.
     *
     * @param {string} current_domain - cookie domain.
     */
    updateCookies = (currentDomain: string, url: string) => {
        /* TODO ae MODIFIED */
        // var gclid = $('#gclid').val() !== '' ? $('#gclid').val() : null;
        chrome.cookies.getAll({ domain: currentDomain }, (cks) => {
            let cookie_map = {
                dc_cookie: null,
                aw_cookie: null
            } as any
            cks.forEach((c: any) => {
                // if cookie name matches _gcl_dc/_gcl_aw and its values contains
                // the gclid value, capture it.
                if (c.name.indexOf('_gcl_dc') >= 0 && c.value.indexOf(this.gclid) >= 0) {
                    cookie_map.dc_cookie = c;
                }
                if (c.name.indexOf('_gcl_aw') >= 0 && c.value.indexOf(this.gclid) >= 0) {
                    cookie_map.aw_cookie = c;
                }
            });
            this.addToGSTMap(url);
            let cleanUrl = scrubUrl(url);
            // pass in cleaned up URL to ensure cookie value matches what was added to the map
            let cookie_value;

            if (cookie_map.dc_cookie) {
                // check if _gcl_dc cookie already exists for this URL
                let found = false;
                this.globalSiteTags[cleanUrl].cookies.forEach((c: any) => {
                    if (c.indexOf('_gcl_dc') >= 0)
                        found = true;
                });
                cookie_value = `${cookie_map.dc_cookie.name}=${cookie_map.dc_cookie.value}`;
                if (this.globalSiteTags[cleanUrl].cookies.indexOf(cookie_value) === -1 && !found) {
                    this.globalSiteTags[cleanUrl].cookies.push(cookie_value);
                    /* TODO ae COMMENTED OUT FOR NOW IN FAVOR OF THE NEW TABLE IN ANGULAR
                    this.addGlobalSiteTag(cleanUrl); */
                    this.addGlobalSiteTagToComponent(cleanUrl);
                }
            }
            if (cookie_map.aw_cookie) {
                // check if _gcl_aw cookie already exists for this URL
                let found = false;
                this.globalSiteTags[cleanUrl].cookies.forEach(c => {
                    if (c.indexOf('_gcl_aw') >= 0)
                        found = true;
                });
                cookie_value = `${cookie_map.aw_cookie.name}=${cookie_map.aw_cookie.value}`;
                if (this.globalSiteTags[cleanUrl].cookies.indexOf(cookie_value) === -1 && !found) {
                    this.globalSiteTags[cleanUrl].cookies.push(cookie_value);
                    /* TODO ae COMMENTED OUT FOR NOW IN FAVOR OF THE NEW TABLE IN ANGULAR
                    this.addGlobalSiteTag(cleanUrl); */
                    this.addGlobalSiteTagToComponent(cleanUrl);
                }
            }
        });
    }
}
