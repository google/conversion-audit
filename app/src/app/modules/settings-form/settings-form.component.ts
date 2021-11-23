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

import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { constructUrl, updateBehavior, getMonitoringURLs, download, scrubUrl } from '../../utils/utils';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ChromeAPIService } from '../../services/chrome-api.service';
import { GlobalTagVerificationService } from '../../services/global-tag-verification.service';
import { NetworkMonitorService } from '../../services/network-monitor.service';
import { FloodlightTrackerService } from '../../services/floodlight-tracker.service';
import { WebCrawlerService } from '../../services/crawler.service';

@Component({
  selector: 'app-settings-form',
  templateUrl: './settings-form.component.html',
  styleUrls: ['./settings-form.component.css']
})
export class SettingsFormComponent implements OnInit {

  title: string = "Settings";
  tabId: number = 0;
  winId: number = 0;
  gclid = "";
  gclsrc = "";
  settingsForm: FormGroup;
  // Controls whether to discover new pages or only scan list of urls uploaded
  discovery: boolean = true;
  // List of urls uploaded by the user
  urls: string[] = [];
  showRunButton: boolean = true;
  fileName: string = '';

  constructor(private chromeAPIService: ChromeAPIService,
    private globalTag: GlobalTagVerificationService,
    private monitor: NetworkMonitorService,
    private floodlightTracker: FloodlightTrackerService,
    private crawler: WebCrawlerService) {
    this.settingsForm = this.buildSettingsForm();
  }

  ngOnInit(): void {
    this.generateGclid();
    this.chromeAPIService.getCurrentTab().then(parentTab => {
      this.setActualWindowAndTabInformation(parentTab.url);
      this.chromeAPIService.getTabById(this.tabId).then(tab => {
        if (tab && tab.url) {
          let url = tab.url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im);
          if (url && url.length > 1) {
            this.settingsForm.patchValue({ 'domain': url[1] });
          } else {
            this.settingsForm.patchValue({ 'domain': "" });
          }
        }
      });
    });
  }

  buildSettingsForm() {
    return new FormGroup({
      'domain': new FormControl('', [Validators.required]),
      'depth': new FormControl('10', [Validators.required]),
      'loadTime': new FormControl('5', [Validators.required]),
      'urlSuffix': new FormControl(''),
      'urlFile': new FormControl(''),
      'manualSet': new FormControl(false),
      'verificationEnabled': new FormControl(false),
      'showNoFloodlight': new FormControl(false),
    })
  }

  onGlobalSiteTagChanged(event: MatSlideToggleChange) {
    this.globalTag.showGlobalSiteReport(event.checked);
  }

  async run() {
    this.showRunButton = false;
    this.initServices();
    this.resetComponents();
    let tab = await this.chromeAPIService.getTabById(this.tabId);
    if (tab && tab.url) {
      let domain = this.settingsForm.get('domain')?.value;
      let urlSuffix = this.settingsForm.get('urlSuffix')?.value;
      let startingUrl = constructUrl(scrubUrl(tab.url), true,
        this.gclid, this.gclsrc, urlSuffix);
      let loadTime = parseInt(this.settingsForm.get('loadTime')?.value);
      // Setup Global Tag Verification
      this.setupGlobalTagVerification(startingUrl!, domain);
      // Setup Network Monitor
      this.setUpNetworkMonitor(tab, domain);
      // Setup Floodlight Tracker
      this.setupFloodlightTracker();
      // Setup Crawler
      this.setupCrawler(startingUrl!, tab, loadTime, domain);
    }
    // TODO ae show a spinner
  }

  initServices() {
    this.floodlightTracker.initService();
    this.globalTag.initService();
    this.crawler.initService();
    this.monitor.initService();
  }

  resetComponents() {
    this.updateStats(0, 0, 0);
    this.floodlightTracker.addToTableComponent(undefined);
    this.globalTag.addToTableComponent(undefined);
  }

  setupGlobalTagVerification(startingUrl: string, domain: string) {
    let verificationEnabled = this.settingsForm.get('verificationEnabled')?.value;
    let manualSet = this.settingsForm.get('manualSet')?.value;
    // Init Global Tag Verification
    this.globalTag.setDomain(domain);
    this.globalTag.setVerificationEnabled(verificationEnabled);
    this.globalTag.setManualSet(manualSet);
    // Setup Global Tag Verification
    this.globalTag.globalVerificationReset();
    if (verificationEnabled) {
      this.globalTag.globalVerificationSetup(startingUrl, this.tabId, this.gclid);
      updateBehavior();
    }
  }

  setUpNetworkMonitor(tab: any, domain: string) {
    // Setup Network Monitor
    this.monitor.setTab(tab);
    this.monitor.setMonitoringURLs(getMonitoringURLs())
    this.monitor.onCapture((url: string, event: any) => {
      console.log(`Adding url to tracker: ${url}`);
      this.floodlightTracker.addToTracker(this.discovery ? domain : '', 'doubleclick',
        url, event, []);
    });
  }

  setupFloodlightTracker() {
    // Setup Floodlight Tracker
    let showNoFloodlight = this.settingsForm.get('showNoFloodlight')?.value;
    this.floodlightTracker.setGclid(null);
    this.floodlightTracker.setdcmProfileId(null);
    this.floodlightTracker.setdcmAccountId(null)
    this.floodlightTracker.setShowNoFloodlight(showNoFloodlight);
  }

  setupCrawler(startingUrl: string, tab: any, loadTime: number,
    domain: string) {
    // Setup crawler
    this.crawler.setStartingUrl(startingUrl);
    this.crawler.setTab(tab);
    this.crawler.setTabId(this.tabId);
    this.crawler.setLoadTime(loadTime);
    this.crawler.setDomain(domain);
    this.crawler.setDiscovery(this.discovery);
    let showNoFloodlight = this.settingsForm.get('showNoFloodlight')?.value;
    let manualSet = this.settingsForm.get('manualSet')?.value;
    if (this.urls && this.urls.length > 0) {
      this.crawler.setUrls(this.urls);
    }
    this.crawler.onBeforeVisit((url: string) => {
      // Send false to includeUserParams for now
      let cUrl = constructUrl(url, false, '', '', '');
      if (cUrl) {
        this.globalTag.setUrl(cUrl);
      }
      return cUrl;
    });
    let previousUrl = '';
    this.crawler.onUpdateStats((found: number, visited: number, url: string,
      done: boolean) => {
      let tagsFound = this.floodlightTracker.getCounter();
      this.updateStats(found, visited, tagsFound);
      if (previousUrl) {
        if (!this.floodlightTracker.tracker[previousUrl] && showNoFloodlight) {
          this.floodlightTracker.addEmptyTrackerEntry('doubleclick', previousUrl);
        }
      }
      previousUrl = url;
      if (done) {
        console.log('done');
        this.stopClick();
      }
    });
    this.monitor.start();
    this.crawler.start(manualSet);
  }

  /**
   * Subject event that sends the new stats to the statistics component.
   * This allows x-component comunication using a service.
   * @param pagesFound - The number of pages found.
   * @param pagesVisited - The number of pages visited.
   * @param tagsFound - the number of tags found.
   */
  updateStats(pagesFound: number, pagesVisited: number, tagsFound: number) {
    this.crawler.updateStatistics(pagesFound, pagesVisited, tagsFound);
  }

  /**
   * Stop button click
   */
  stopClick = () => {
    this.showRunButton = true;
    if (this.crawler) {
      this.crawler.stop();
    }
    this.monitor.stop();
    this.globalTag.removeVerificationListener();
  }

  /**
   * Download button click. Downloads the current report to the user
   */
  downloadClick = () => {
    if (this.floodlightTracker) {
      var gstOutput = this.globalTag.printGlobalSiteTable();
      var out = this.floodlightTracker.printTracker('doubleclick');
      var date = new Date().toString().replace(/\s/g, "");
      let domain = this.settingsForm.get('domain')?.value;
      let verificationEnabled = this.settingsForm.get('verificationEnabled')?.value;
      // Download Conversion Tag Report
      download(`${domain}-doubleclick-floodlight-report-${date}.csv`, out);
      // Download Global Site Tag Report
      if (verificationEnabled) {
        download(`${domain}-gst-report-${date}.csv`, gstOutput);
      }
    }
    // TODO download other types of outputs
  }

  /**
   * Generates the gclid parameters for global site tag verification
   */
  generateGclid() {
    // Generate test gclid value
    this.gclid = "Test-" + Math.floor((Math.random() * 1000) + 1);
    this.gclsrc = 'aw.ds';
  }

  setActualWindowAndTabInformation(parentUrl?: string) {
    if (parentUrl) {
      let index = parentUrl.indexOf("?");
      let urlSubs = parentUrl.substr(index + 1, parentUrl.length);
      let parts = urlSubs.split("&");
      if (parts.length == 2) {
        // Substract the parameters set in the extension's URL as query params
        // ?winId=1&tabId=6198
        this.winId = parseInt(parts[0].substr(6));
        this.tabId = parseInt(parts[1].substr(6));
      }
    }
  }

  readFileContent(event: any) {
    this.discovery = true;
    let that = this;
    if (event.target) {
      let fileChooser = event.target;
      if (fileChooser.files.length) {
        this.fileName = fileChooser.files[0].name;
        let reader = new FileReader();
        reader.onload = function (e: any) {
          let split_data = e.target.result.split("\n");
          let data: any[] = [];
          split_data.forEach((row: string) => {
            data.push(row.split(','));
          });
          if (data.length > 0) {
            that.urls = data;
            console.log(`Setting discovery to false, see what difference it makes`);
            that.discovery = false;
          }
        }
        reader.readAsText(fileChooser.files[0]);
      }
    }
  }

  resetFile() {
    this.settingsForm.patchValue({ 'urlFile' : '' });
  }

  removeFile() {
    this.fileName = '';
    // Reset urls
    this.urls = [];
  }

  isInvalidInput(property: string) {
    return !this.settingsForm.get(property)?.valid
      && this.settingsForm.get(property)?.touched
  }

}
