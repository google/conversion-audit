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
 * Crawls a web site
 */

import { Injectable } from '@angular/core';
import { scrubUrl, wait } from '../utils/utils';
import { Subject } from 'rxjs';
import { Statistic } from '../models/statistic';

@Injectable()
export class WebCrawlerService {

    // Starting point of the crawler
    startingUrl: string = '';
    previousUrl: string = '';
    // The target tab ID
    tabId: number = 0;
    // Reference to the chrome tab in which to load pages
    tab: any = null;
    // How long to wait for the pages to load
    loadTime: number = 5;
    // Domain that is being crawled, restricts crawling to this domain
    domain: string = '';
    // Discover new links on the page, true if links should be scraped from the page, false otherwise
    discovery: boolean = true;
    // Whether the crawler is running
    running: boolean = false;
    // Current depth of the crawling
    depth: number = 1;
    // Maintains a map of found and visited urls
    urlMap: any = null;
    passive: boolean = false;
    // Handler to emit status updates
    _updateStats: any = null;
    // Handler to emit before visit events
    _beforeVisit: any = null;
    // Handler to check if a page should be visited
    _shouldVisit: any = null;
    // The emitter event to detect when the statistics need to be updated
    // in the statistics component. Used for x-component communication
    // between the settings-form component and the statistics component.
    updateStatisticsEmitter = new Subject<Statistic>();

    constructor() {
        chrome.tabs.onUpdated.addListener(this.tabOnCompleteListener);
    }

    setStartingUrl(startingUrl: string) {
        this.startingUrl = startingUrl;
    }

    setTab(tab: any) {
        this.tab = tab;
    }

    setTabId(tabId: number) {
        this.tabId = tabId;
    }

    setDomain(domain: string) {
        this.domain = domain;
    }

    setDiscovery(discovery: boolean) {
        this.discovery = discovery;
    }

    setLoadTime(loadTime: number) {
        this.loadTime = loadTime;
    }

    initService() {
        this.startingUrl = '';
        this.previousUrl = '';
        this.tabId = 0;
        this.tab = null;
        this.loadTime = 5;
        this.domain = '';
        this.discovery = true;
        this.running = false;
        this.depth = 1;
        this.urlMap = null;
        this.passive = false;
        this._updateStats = null;
        this._beforeVisit = null;
        this._shouldVisit = null;
    }

    updateStatistics(pagesFound: number, pagesVisited: number,
        tagsFound: number) {
        let stats = this.buildStats(pagesFound, pagesVisited, tagsFound);
        this.updateStatisticsEmitter.next(stats);
    }

    buildStats(pagesFound: number, pagesVisited: number,
        tagsFound: number) {
        return {
            'pagesFound': pagesFound,
            'pagesVisited': pagesVisited,
            'tagsFound': tagsFound
        }
    }

    /**
     * Sets a list of urls to be visited by the crawler
     *
     * @param: urls - list of strings representing the urls to visit
     */
    setUrls = (urls: string[]) => {
        this.resetUrlMap();

        urls.forEach(url => this.found(url));
    }

    /**
     *  Resets the url map
     */
    resetUrlMap = () => {
        this.urlMap = {
            found: 0,
            visited: 0
        }
    }

    /**
     * Triggers the update stats event
     *
     * @param: url - the current url
     */
    updateStats = (url: string) => {
        if (this._updateStats) {
            this._updateStats(this.urlMap.found, this.urlMap.visited, url, !this.running);
        }
    }

    /**
     * Adds a new URL to the map
     *
     * @param url: String url to add
     */
    found = (url: string) => {
        if (!this._shouldVisit || this._shouldVisit(url)) {
            if (!this.urlMap[url]) {
                this.urlMap[url] = "FOUND";
                this.urlMap.found++;
            }
        }
    }

    /**
     * Gets the next page to visit, updates urlMap to signal previous page has
     * been visited
     *
     * @returns url of the next page to visit, or null if none are found
     */
    getNextPage = () => {
        for (var url in this.urlMap) {
            if (this.urlMap.hasOwnProperty(url)) {
                if (this.urlMap[url] == "FOUND") {
                    this.urlMap[url] = "VISITED";
                    this.urlMap.visited++;
                    return url;
                }
            }
        }
        return;
    }

    /**
     * Event handler for when tabs are fully loaded, it scrape the page for links
     * to visit
     *
     * @param: @see tabOnCompleteListener in chrome extensions documentation
     */
    tabOnCompleteListener = (id: number, changeInfo: any, tab: any) => {
        if (this.running && changeInfo.status === 'complete' && id === this.tabId) {
            this.updateStats(this.previousUrl);
            this.previousUrl = scrubUrl(tab.url);

            if (!this.passive && this.discovery) {
                this.scrapeLinks();
            }

            if (!this.passive) {
                wait(this.loadTime * 1000).then(this.visit);
            }
        }
    }

    /**
     * Scrapes a web page and find links for further crawling
     */
    async scrapeLinks() {
        let result: any[] = await this.injectScriptFunction(this.tabId);
        if (result) {
            if (result.length > 0) {
                let links = result[0].result;
                let updatedURL = this.tab.url;
                let currentDomainMatch = updatedURL.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im);
                let current_domain = currentDomainMatch[1];

                // makes sure to get the current domain in which the scrpaed links are found
                // so that it may correctly appended to relative links (eg. mycurrent.domain.com/#nav)
                let current_base_url = currentDomainMatch ? currentDomainMatch[0] : '';

                // Note: this regex will allow for extended locales (ex. www.espn.com.br). This is not expected
                // behavior for the current state of the tool.
                let domain_regex = new RegExp('^(?:https?:\/\/)?(?:www\.)?' + this.domain.replace('.', '\\.') + '(\/.*)?$');

                for (let i = 0; i < links.length; i++) {
                    let link = links[i].substring(1, links[i].length - 1);

                    // filter out scraped links for only those that are expected and within the original domain
                    let url_match = link.match(domain_regex); //original
                    if (
                        (url_match || link.startsWith('/')) &&
                        !link.startsWith("mailto:") &&
                        !link.startsWith("//") &&
                        !link.startsWith('javascript:') &&
                        !link.startsWith('chrome-extension:')
                    ) {
                        if (current_domain === this.domain && link.startsWith('/')) {
                            link = current_base_url + link;
                        } else if (current_domain != this.domain && link.startsWith('/')) {
                            link = null;
                        }

                        // add clean URL to graph to reduce duplication
                        let cleanLink = scrubUrl(link);
                        if (cleanLink && cleanLink != 'null' && cleanLink != 'undefined') {
                            this.found(cleanLink);
                        }
                    }
                }
            }
        }
    }

    /**
     * Async function that injects a script function
     * to the current tab.
     * @param: tabId - the current tab id.
     */
    async injectScriptFunction(tabId: number) {
        let results = chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: injectCode
        });
        return results

        function injectCode() {
            var links = document.documentElement.innerHTML.match(/href="(.*?)"/g);
            var result = [];
            if (links) {
                for (var i = 0; i < links.length; i++) {
                    if (!(
                        // anchor tags and same page variants(ex. '/' or '#reviews')
                        links[i].match(/^"\/#/g) ||
                        links[i].match(/^"\#/g) ||
                        links[i].match(/^"\/"$/g) ||
                        // misc files
                        links[i].match(/[\/\.]?json[\/\"]?/g) ||
                        links[i].match(/[\/\.]?js[\/\"]?/g) ||
                        links[i].match(/[\/\.]?pdf[\/\"]?/g) ||
                        // image files
                        links[i].match(/[\/\.]?css[\/\"]?/g) ||
                        links[i].match(/[\/\.]?jpg[\/\"]?/g) ||
                        links[i].match(/[\/\.]?png[\/\"]?/g) ||
                        links[i].match(/[\/\.]?xml[\/\"]?/g) ||
                        links[i].match(/[\/\.]?jpeg[\/\"]?/g) ||
                        links[i].match(/[\/\.]?gif[\/\"]?/g) ||
                        links[i].match(/[\/\.]?webp[\/\"]?/g) ||
                        links[i].match(/[\/\.]?svg[\/\"]?/g) ||
                        links[i].match(/[\/\.]?svgz[\/\"]?/g) ||
                        links[i].match(/[\/\.]?heif[\/\"]?/g) ||
                        links[i].match(/[\/\.]?heic[\/\"]?/g) ||
                        // icon file
                        links[i].match(/[\/\.]?ico[\/\"]?/g) ||
                        // font files
                        links[i].match(/[\/\.]?otf[\/\"]?/g) ||
                        links[i].match(/[\/\.]?ttf[\/\"]?/g) ||
                        links[i].match(/[\/\.]?svg[\/\"]?/g) ||
                        links[i].match(/[\/\.]?eot[\/\"]?/g) ||
                        links[i].match(/[\/\.]?woff[\/\"]?/g) ||
                        links[i].match(/[\/\.]?woff2[\/\"]?/g))) {
                        result.push(links[i].substring(5));
                    }
                }
            }
            return result
        }
    }

    /**
     * Visits a webpage
     */
    visit = () => {
        var nextUrl = this.getNextPage();
        if (this.running && nextUrl) {
            if (this.beforeVisit) {
                nextUrl = this.beforeVisit(nextUrl);
            }
            return new Promise((resolve, reject) => {
                console.log('Visit: ', nextUrl);
                var hasFloodlight = false;

                if (nextUrl) {
                    chrome.tabs.update(this.tabId, {
                        url: nextUrl
                    }, () => {
                        wait(this.loadTime * 1000).then(() => {
                            if (chrome.runtime.lastError) {
                                reject(`Error in loading url: ${nextUrl} - ${chrome.runtime.lastError.message}`);
                            } else {
                                resolve(true);
                            }
                        });
                    });
                } else {
                    this.stop();
                    resolve(false);
                }
            });
        } else {
            console.log("this.running = false");
            this.running = false;
            return "";
        }
    }

    /**
     * Set up a handler to check whether a page should be visited.
     *
     * @param: func function that takes a string url and returns true / false
     * indicating it should be visited
     */
    shouldVisit = (func: Function) => {
        this._shouldVisit = func;
    }

    /**
     * Set up a listener to emit updates whenever there is a status change
     *
     * @param: func function(found, visited, url, done)
     */
    onUpdateStats = (func: Function) => {
        this._updateStats = func;
    }

    /**
     * Event triggered before a page is visited
     *
     * @param: function(url) - callback function, receives the url that will be visited
     *  next
     */
    onBeforeVisit = (func: Function) => {
        this._beforeVisit = func;
    }

    /**
     * Triggers the before visit event
     *
     * @param: url - the url that will be visited
     */
    beforeVisit = (url: string) => {
        if (this._beforeVisit) {
            return this._beforeVisit(url);
        }

        return url;
    }

    /**
     * Stops the crawler
     */
    stop = () => {
        this.running = false;
    }

    /**
     * Starts the crawler
     *
     * @param: passive - boolean, if true the crawler only listens for events and do not
     *  actively crawl the website, this allows users to navigate themselves in
     *  manual mode
     */
    start = (passive: boolean) => {
        if (this.discovery) {
            this.resetUrlMap();
            this.found(this.startingUrl);
        }

        this.previousUrl = this.startingUrl;
        this.running = true;
        this.passive = passive;

        if (!this.passive) {
            this.visit();
        }
    }

}
