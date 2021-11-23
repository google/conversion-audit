/***************************************************************************
*
*  Copyright 2020 Google Inc.
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
import { uuidv4 } from '../utils/utils';
import { TagInformation } from '../models/tag-information';
import { Subject } from 'rxjs';

@Injectable()
export class FloodlightTrackerService {

    tracker: { [key: string]: any } = {};
    counter: number = 0;
    gclid: string = '';
    dcmProfileId: string = '';
    dcmAccountId: string = '';
    showNoFloodlight: boolean = false;
    dcm: any = null;
    // The emitter event to detect when a tag needs to be added to the table
    // in the conversion-tag-report component. Used for cross component communication
    // between the settings-form component and the conversion-tag-report component.
    addToTableEmitter = new Subject<TagInformation>();

    constructor() { }

    setGclid = (gclid: string | null) => {
        this.gclid = gclid || this.gclid;
    }

    setdcmProfileId(profileId: string | null) {
        this.dcmProfileId = profileId || '';
    }

    setdcmAccountId(accountId: string | null) {
        this.dcmAccountId = accountId || '';
    }

    setshowNoFloodlight(showNoFloodlight: boolean) {
        this.showNoFloodlight = showNoFloodlight || false;
    }

    setDcmInformation = (profileID: string, accountID: string) => {
        this.dcmProfileId = profileID || this.dcmProfileId;
        this.dcmAccountId = accountID || this.dcmAccountId;
    }

    setShowNoFloodlight = (value: boolean) => {
        this.showNoFloodlight = value || this.showNoFloodlight;
    }

    getCounter() {
        return this.counter;
    }

    initService() {
        this.tracker = {};
        this.counter = 0;
        this.gclid = '';
        this.dcmProfileId = '';
        this.dcmAccountId = '';
        this.showNoFloodlight = false;
        this.dcm = null;
    }

    /**
     * Calls the subject emitter method that allows x-component communication.
     * This helps to update the table in the coversion-tag-report component
     * when a new tag is found.
     * @param tagInformation - The tag found.
    */
    addTagToComponentTable(mode: string, floodlight_obj: any) {
        if (mode === 'doubleclick') {
            let tagInformation = this.buildTagInformation(floodlight_obj);
            this.addToTableComponent(tagInformation);
        }
    }

    /**
     * Subject emitter that allows x-component communication.
     * This helps to update the table in the coversion-tag-report component
     * when a new tag is found.
     * @param tagInformation - The tag found.
     * TODO: added 'any; type for now, Union types not working with the dependencies update
    */
    addToTableComponent(tagInformation: any) {
        this.addToTableEmitter.next(tagInformation);
    }

    /**
     * Builds the tag information that will be added to the
     * conversion-tag-report table.
     * @param floodlight_obj - The floodlight obj with the raw data.
     * @returns A TagInformation obj.
    */
    buildTagInformation(floodlight_obj: any) {
        let id = floodlight_obj.id;
        let page = floodlight_obj.page_url || 'None';
        let tagType = floodlight_obj.tag_type || 'None';
        let accountId = floodlight_obj.advertiser || 'None';
        let gTag = typeof floodlight_obj.event_snippet === 'boolean' ? floodlight_obj.event_snippet : 'None';
        let networkCall = floodlight_obj.floodlights[0].url || 'None';
        let floodlightId = floodlight_obj.floodlight_id || 'None';
        let floodlightActivityTag = floodlight_obj.activity || 'None';
        let floodlightActivityGroup = floodlight_obj.group || 'None';
        let floodlightSalesOrder = floodlight_obj.order || 'None';
        let floodlightUVariables = floodlight_obj.uvars || 'None';
        let warnings = floodlight_obj.warnings || 'None';
        let errors = floodlight_obj.errors || 'None';
        return {
            id: id,
            page: page,
            tagType: tagType,
            accountId: accountId,
            gTag: gTag,
            networkCall: networkCall,
            floodlightId: floodlightId,
            floodlightActivityTag: floodlightActivityTag,
            floodlightActivityGroup: floodlightActivityGroup,
            floodlightSalesOrder: floodlightSalesOrder,
            floodlightUVariables: floodlightUVariables,
            warnings: warnings,
            errors: errors
        }
    }

    addToTracker = (domain: string, mode: string, url: string, event: any, floodlightConfigId: string[]) => {
        let page_url = decodeURI(url);
        if (!page_url.match(new RegExp(domain))) {
            return;
        }
        if (mode === 'doubleclick') {
            this.extractTagData(page_url, event, floodlightConfigId);
        }
    }

    addEmptyTrackerEntry = (mode: string, url: string) => {
        let page_url = decodeURI(url);
        if (!this.tracker[page_url]) {
            console.log('Add empty entry to tracker for: ', page_url);
            this.tracker[page_url] = {};
            let id = uuidv4();

            if (mode === 'doubleclick') {
                this.tracker[page_url][0] = {
                    id: id,
                    page_url: page_url,
                    tag_type: 'None',
                    floodlights: ['None'],
                    advertiser: 'None',
                    // network_call_verification: 'None',
                    // network_call_detail: '',
                    activity: 'None',
                    group: 'None',
                    uvars: 'None',
                    order: 'None',
                    event_snippet: 'None',
                    floodlight_cookie: 'None',
                    google_ads_cookie: 'None',
                    auiddc: 'None',
                    floodlight_id: null,
                    warnings: 'None',
                    errors: 'No Conversion Tags detected'
                };
            }
            this.addTagToComponentTable(mode, this.tracker[page_url][0]);
        }
    }

    extractTagData = (page_url: string, event: any, floodlightConfigId: string[]) => {
        let data = null;
        let floodlight_url = event.url;
        let tag_type = null;
        let tag_sub_type = null;
        let fl_advertiser = null;
        let activity = null;
        let group = null;
        let floodlight_cookie = null;
        let google_ads_cookie = null;
        let auiddc = null;
        let uvars = null;
        let order = null;
        let redirectCall = null;
        let event_snippet = null;

        if (floodlight_url.match(/doubleclick.net.*\/activity/) != null) {
            tag_type = 'Floodlight';
            fl_advertiser = floodlight_url.match(/src=(\w*)/) ? // Note - this is also used as the Floodlight Config ID
                floodlight_url.match(/src=(\w*)/)[1] : null;
            // Check for a match between Floodlight config ID list and advertiser ID -- return null here if there is not a match
            if (floodlightConfigId.length > 0 && !floodlightConfigId.includes(fl_advertiser)) {
                return null;
            }

            // cat = FL activity tag string (or, “Activity tag string” value in SA360 or Campaign Manager UI)
            activity = floodlight_url.match(/cat=(\w*)/) ?
                floodlight_url.match(/cat=(\w*)/)[1] : null;

            // type = is the FL activity group string (or, “Floodlight activity group” value in SA360 or Campaign Manager UI)
            group = floodlight_url.match(/type=(\w*)/) ?
                floodlight_url.match(/type=(\w*)/)[1] : null;

            // gcldc = floodlight cookie
            floodlight_cookie = floodlight_url.match(/gcldc=([\w-\*]+)/) ?
                floodlight_url.match(/gcldc=([\w-\*]+)/)[1] : null;

            // gclaw = google ads cookie
            google_ads_cookie = floodlight_url.match(/gclaw=([\w-\*]+)/)
                ? floodlight_url.match(/gclaw=([\w-\*]+)/)[1] : null;

            // auiddc = ID used to map gclids for non last click attribution
            auiddc = floodlight_url.match(/auiddc=([\w\.]*)/)
                ? floodlight_url.match(/auiddc=([\w\.]*)/)[1] : null;

            uvars = decodeURIComponent(
                JSON.stringify(floodlight_url.match(/u[0-9]*=([^;]*)/g)).replace(/"/g, '')
            ) || null;

            order = floodlight_url.match(/ord=([\d\.]*)/)
                ? floodlight_url.match(/ord=([\d\.]*)/)[1] : null;

            redirectCall = floodlight_url.match(/dc_pre=/) ? true : false;
        }


        if (floodlight_url.match(/www.google-analytics.com/) !== null) {
            tag_type = 'Google Analytics';
            fl_advertiser = floodlight_url.match(/tid=(\w*)/) ? //
                floodlight_url.match(/tid=(\w*(-\w*)*)/)[1] : null;
            tag_sub_type = floodlight_url.match(/&t=(\w*)/) ? //
                floodlight_url.match(/&t=(\w*)/)[1] : null;
        }

        if (floodlight_url.match(/g.doubleclick.net\/pagead\/viewthroughconversion/) !== null) {
            tag_type = 'Google Ads Remarketing';
            fl_advertiser = floodlight_url.match(/pagead\/viewthroughconversion\/(\w*)/) ? //
                floodlight_url.match(/pagead\/viewthroughconversion\/(\w*)/)[1] : null;
        }

        if (floodlight_url.match(/googleadservices.com\/pagead\/conversion/) !== null) {
            tag_type = 'Google Ads Conversion';
            fl_advertiser = floodlight_url.match(/pagead\/conversion\/(\w*)/) ? //
                floodlight_url.match(/pagead\/conversion\/(\w*)/)[1] : null;
        }

        // gtm = denotes that this is an event snippet
        event_snippet = floodlight_url.match(/gtm=(\w*)/) ? true : false;
        // floodlight_url.match(/gtm=(\w*)/)[1] : null;

        /*
         // @TODO - this statement may filter out adservice calls that come in with minial data
         if(!fl_advertiser && !activity && !group) {
             return null;
         }
        */

        // Ignore redirect calls
        if (redirectCall) {
            return null;
        }
        let id = uuidv4();
        //let floodlight_uuid = `${fl_advertiser}_${activity}_${group}`; //Dedup
        let floodlight_uuid = `${id}`;   //No Dedup
        //page_url = page_url.split('?')[0]; //remove query parameters
        data = {
            id: id,
            page_url: page_url,
            tag_type: tag_type,
            floodlights: [{ url: floodlight_url, network_call_status: event.statusCode }],
            advertiser: fl_advertiser,
            // network_call_verification: '',
            // network_call_detail: '',
            floodlight_id: null,
            activity,
            group,
            uvars,
            order,
            event_snippet,
            floodlight_cookie,
            google_ads_cookie,
            auiddc,
            warnings: null,
            errors: null
        }

        if (!this.tracker.hasOwnProperty(page_url)) {
            this.tracker[page_url] = {};
        }
        // const debouncedVerification = debounce(this.floodlightVerification, 500);

        if (!this.tracker[page_url].hasOwnProperty(floodlight_uuid)) {
            this.tracker[page_url][floodlight_uuid] = data;
            this.counter += 1;
            if (tag_type == 'Floodlight') {
                this.extractWarnings(this.tracker[page_url][floodlight_uuid]);
                this.addTagToComponentTable('doubleclick', this.tracker[page_url][floodlight_uuid]);
                this.dcmVerification(this.tracker[page_url][floodlight_uuid]);
            } else {
                this.addTagToComponentTable('doubleclick', this.tracker[page_url][floodlight_uuid]);
            }
        } else {
            this.tracker[page_url][floodlight_uuid].floodlights.push({
                url: floodlight_url,
                network_call_status: event.statusCode,
            });
            if (tag_type == 'Floodlight') {
                this.extractWarnings(this.tracker[page_url][floodlight_uuid]);
            }
            // this.floodlightVerification(this.tracker[page_url][floodlight_uuid]);
        }
        // this.floodlightVerification(this.tracker[page_url][floodlight_uuid]);
        return '';
    }

    extractWarnings = (floodlight_obj: any) => {
        let warning_str = ''
        if (!floodlight_obj.advertiser) {
            warning_str += '- Missing advertiser value.<br/>';
        }
        if (!floodlight_obj.activity) {
            warning_str += '- Missing activty tag string value.<br/>';
        }
        if (!floodlight_obj.group) {
            warning_str += '- Missing activity group string value.<br/>';
        }
        if (!floodlight_obj.uvars) {
            warning_str += '- No Uvars found.<br/>';
        } else {
            let uvars = floodlight_obj.uvars.replace(/(\[|\])/g, '').split(',');
            uvars.forEach((vars: string) => {
                let matches = vars.match(/(u\d*)=(.*)/);
                if (matches) {
                    if (
                        matches[2] === 'undefined' ||
                        matches[2] === 'null' ||
                        matches[2] === ''
                    ) {
                        warning_str += `- ${matches[1]} value may be missing.<br/>`;
                    }
                } else {
                    warning_str += '- No Uvars found.<br/>';
                }
            })
        }
        if (!floodlight_obj.order) {
            warning_str += '- Missing sales order value.<br/>';
        }
        if (!floodlight_obj.event_snippet) {
            warning_str += '- Missing event snippet value.<br/>';
        }
        // if(!floodlight_obj.floodlight_cookie) {
        //     warning_str += '- No floodlight cookie value captured.<br/>';
        // }
        // if(!floodlight_obj.google_ads_cookie) {
        //     warning_str += '- No google ads cookie value captured.<br/>';
        // }
        // if(!floodlight_obj.auiddc) {
        //     warning_str += '- Missing auiddc value.<br/>';
        // }
        if (warning_str === '') {
            floodlight_obj.warnings = null;
        } else {
            floodlight_obj.warnings = warning_str;
        }
    }

    extractGAFloodlightData = (page_url: string, floodlight_url: string) => {
        let matchId = floodlight_url.match(/tid=([\w-]*)/);
        let matchIteraction = floodlight_url.match(/t=([\w-]*)/);
        if (!matchId || !matchIteraction) {
            return; //nothing to process
        }

        let id = uuidv4();

        if (!this.tracker.hasOwnProperty(page_url)) {
            this.tracker[page_url] = {};
        }
        if (!this.tracker[page_url].hasOwnProperty(matchId[1])) {
            this.tracker[page_url][matchId[1]] = {
                id: id,
                page_url: page_url,
                gaId: matchId ? matchId[1] : '',
                interactionType: matchIteraction ? matchIteraction[1] : ''
            };
            this.counter += 1;
            this.addTagToComponentTable('ga', this.tracker[page_url][matchId[1]]);
        }
    }

    printTracker = (mode: string) => {
        let output = "";
        if (mode == 'doubleclick') {
            // Removed Network Calls Verified,Floodlight Coookie,Google Ads Cookie,auiddc,
            output = 'Page,Tag Type,Account,OGT (Y/N),Network Call,Floodlight ID,Floodlight Activity,Floodlight Activity Group,Sales Order,U Variables,Warnings,Errors\r\n';
            Object.keys(this.tracker).forEach(page => {
                Object.keys(this.tracker[page]).forEach(fl => {
                    let flood = this.tracker[page][fl];
                    let url = encodeURI(flood.page_url);
                    url = url.replace(/#/g, '%23');
                    let tag_url = flood.floodlights[0].url;
                    // "${flood.network_call_verification ? flood.network_call_verification.replace(/<br\/>/g, ' ') : 'None'}",
                    // "${flood.floodlight_cookie || 'None'}","${flood.google_ads_cookie || 'None'}",
                    // "${flood.auiddc || 'None'}",
                    output += `"${url || 'None'}","${flood.tag_type || 'None'}","${flood.advertiser || 'None'}","${typeof flood.event_snippet === 'boolean' ? flood.event_snippet : 'None'}",` +
                        `"${tag_url || 'None'}","${flood.floodlight_id ? flood.floodlight_id : 'None'}",` +
                        `"${flood.activity || 'None'}","${flood.group || 'None'}","${flood.order || 'None'}","${flood.uvars || 'None'}",` +
                        `"${flood.warnings ? flood.warnings.replace(/<br\/>/g, ' ') : 'None'}","${flood.errors ? flood.errors.replace(/<br\/>/g, ' ') : 'None'}"\r\n`;
                });
            });
        }
        return output;
    }

    clearTracker = () => {
        Object.keys(this.tracker).forEach(page => {
            Object.keys(this.tracker[page]).forEach(floodlight => {
                delete this.tracker[page][floodlight];
            });
            delete this.tracker[page];
        });
        this.counter = 0;
    }

    dcmVerification = (floodlight_obj: any) => {
        if (floodlight_obj) {
            if (this.dcmProfileId) {
                this.dcm.getFloodlightID(
                    floodlight_obj.advertiser,
                    floodlight_obj.activity,
                    floodlight_obj.group,
                    this.dcmProfileId)
                    .then((floodlight_id: string) => {
                        if (!floodlight_obj.floodlight_id && floodlight_id) {
                            floodlight_obj.floodlight_id = floodlight_id;
                            // getCMLink(
                            //     floodlight_obj.dcmAccountId,
                            //     floodlight_obj.advertiser,
                            //     floodlight_obj.floodlight_id
                            // );
                        }
                    }).catch((res: any) => console.log('Error during api call: ', res));
            }
        }
    }

    floodlightVerification = (floodlight_obj: any) => {//debounce((floodlight_obj) => {
        let verify1 = 'Doubleclick 302 Not Found';
        let verify2 = 'Doubleclick 200 Not Found';
        let verify3 = 'Ad Service 200 Not Found';
        let network_errors = '';
        floodlight_obj.floodlights.forEach((fl: any) => {
            let doubleClick = fl.url.match(/fls\.doubleclick\.net/);
            let adService = fl.url.match(/adservice\.google\.com/);
            let floodlight_cookie = '';
            let google_ads_cookie = '';
            // find gldc value when it equals a alphanumeric string
            if ((doubleClick || adService) && fl.url.match(/gcldc=([\w-]+)/)) {
                floodlight_cookie = fl.url.match(/gcldc=([\w-]+)/)[1];
            }
            // find gldc value when it equals '*'
            if ((doubleClick || adService) && fl.url.match(/gcldc=(\*+)/)) {
                floodlight_cookie = '*';
            }

            // find glaw value when it equals a alphanumeric string
            if ((doubleClick || adService) && fl.url.match(/gclaw=([\w-]+)/)) {
                google_ads_cookie = fl.url.match(/gclaw=([\w-]+)/)[1];
            }

            // find gclaw value when it equals '*'
            if ((doubleClick || adService) && fl.url.match(/gclaw=(\*+)/)) {
                google_ads_cookie = '*';
            }

            // verifies 1st Doubleclick network calls
            if (doubleClick) {
                if (fl.network_call_status === 302) {
                    if (floodlight_cookie !== this.gclid) {
                        network_errors += '- 302 Doubleclick call did not have gcldc properly set.<br/>';
                        verify1 = 'Doubleclick 302 Warning'
                    }
                    if (google_ads_cookie !== this.gclid) {
                        network_errors += '- 302 Doubleclick call did not have gclaw properly set.<br/>'
                        verify1 = 'Doubleclick 302 Warning'
                    }
                    if (floodlight_cookie === this.gclid && google_ads_cookie === this.gclid) {
                        verify1 = 'Doubleclick 302 OK';
                    }
                } else if (fl.network_call_status === 200) {
                    if (floodlight_cookie !== this.gclid) {
                        network_errors += '- 200 Doubleclick call did not have gcldc properly set.<br/>';
                        verify2 = 'Doubleclick 200 Warning'
                    }
                    if (google_ads_cookie !== this.gclid) {
                        network_errors += '- 200 Doubleclick call did not have gclaw properly set.<br/>'
                        verify2 = 'Doubleclick 200 Warning'
                    }
                    if (floodlight_cookie === this.gclid && google_ads_cookie === this.gclid) {
                        verify2 = 'Doubleclick 200 OK';
                    }
                }
            }
            // verifies Ad Service network call
            if (adService && fl.network_call_status === 200) {

                if (floodlight_cookie !== '*') {
                    network_errors += '- 200 AdService call did not have gcldc properly set.<br/>';
                    verify3 = 'Ad Service 200 Warning'
                }
                if (google_ads_cookie !== '*') {
                    network_errors += '- 200 AdService call did not have gclaw properly set.<br/>';
                    verify3 = 'Ad Service 200 Warning'
                }
                if (floodlight_cookie === '*' && google_ads_cookie === '*') {
                    verify3 = 'Ad Service 200 OK';
                }
            }
        });
        network_errors = verify3.includes('Not Found') ? `- Ad Service 200 Not Found.<br/>${network_errors}` : network_errors;
        network_errors = verify2.includes('Not Found') ? `- Doubleclick 200 Not Found.<br/>${network_errors}` : network_errors;
        network_errors = verify1.includes('Not Found') ? `- Doubleclick 302 Not Found.<br/>${network_errors}` : network_errors;

        // floodlight_obj.network_call_detail = network_errors.replace(/<br\/>/g, '&#10;');
        floodlight_obj.errors = network_errors;
        floodlight_obj.network_call_verification = [verify1, verify2, verify3].join('<br/>');
    }
    //, 300)
}
