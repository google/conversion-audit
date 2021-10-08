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

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { SharedModule } from './modules/shared/shared.module';
import { ToolbarComponent } from './modules/toolbar/toolbar.component';
import { SettingsFormComponent } from './modules/settings-form/settings-form.component';
import { ChromeAPIService } from './services/chrome-api.service';
import { GlobalTagVerificationService } from './services/global-tag-verification.service';
import { NetworkMonitorService } from './services/network-monitor.service';
import { FloodlightTrackerService } from './services/floodlight-tracker.service';
import { WebCrawlerService } from './services/crawler.service';
import { StatisticsComponent } from './modules/statistics/statistics.component';
import { ConversionTagReportComponent } from './modules/conversion-tag-report/conversion-tag-report.component';
import { GlobalSiteTagReportComponent } from './modules/global-site-tag-report/global-site-tag-report.component';
import { DialogComponent } from './modules/dialog/dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    ToolbarComponent,
    SettingsFormComponent,
    StatisticsComponent,
    ConversionTagReportComponent,
    GlobalSiteTagReportComponent,
    DialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    SharedModule
  ],
  providers: [
    ChromeAPIService,
    GlobalTagVerificationService,
    NetworkMonitorService,
    FloodlightTrackerService,
    WebCrawlerService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
