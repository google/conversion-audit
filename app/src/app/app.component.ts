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

import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalTagVerificationService } from './services/global-tag-verification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  title = 'Conversion Tag Audit Tool';
  // Subscription that will be monitoring if the global-site-tag-report
  // should be displayed. Used for x-component communication between the
  // settings-form component and the global-site-tag-report component.
  private showGlobalSiteReportSubscription!: Subscription
  showGlobalSiteTagReport: boolean = false;

  constructor(private globalTag: GlobalTagVerificationService) { }

  ngOnInit(): void {
    // Create subscription to monitor when the global-site-tag-report component should be displayed.
    this.showGlobalSiteReportSubscription = this.globalTag.showGlobalSiteReportEmitter
      .subscribe((show: boolean) => {
        this.showGlobalSiteTagReport = show;
      });
  }

  ngOnDestroy(): void {
    // Always destroy the subscription to avoid memory leaks.
    this.showGlobalSiteReportSubscription.unsubscribe();
  }

}