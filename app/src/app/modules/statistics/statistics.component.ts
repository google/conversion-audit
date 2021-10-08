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

import { Component, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { Statistic } from '../../models/statistic';
import { WebCrawlerService } from '../../services/crawler.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit, OnDestroy {

  title: string = "Statistics"
  stats: Statistic
  showSpinner: boolean = false;
  // Subscription that will be monitoring if the statistics need to be updated.
  // Used for x-component communication between the settings-form component
  // and the statistics component.
  private updateStatisticsSubscription!: Subscription;

  constructor(private crawler: WebCrawlerService,
    private changeDetectorRefs: ChangeDetectorRef) {
    this.stats = {} as Statistic;
  }

  ngOnInit(): void {
    // Create subscription to monitor when a new stat needs to be added.
    this.updateStatisticsSubscription = this.crawler.updateStatisticsEmitter
      .subscribe((stats: Statistic) => {
        this.stats = stats;
        // Workaround to update the View 'manually' since it not being updated automatically.
        // TODO: investigate.
        this.changeDetectorRefs.detectChanges();
      });
  }

  ngOnDestroy(): void {
    // Always destroy the subscription to avoid memory leaks.
    this.updateStatisticsSubscription.unsubscribe();
  }
}
