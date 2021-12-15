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

import { Component, ViewChild, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { TagInformation } from '../../models/tag-information';
import { DialogComponent } from '../dialog/dialog.component';
import { FloodlightTrackerService } from '../../services/floodlight-tracker.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-conversion-tag-report',
  templateUrl: './conversion-tag-report.component.html',
  styleUrls: ['./conversion-tag-report.component.css']
})
export class ConversionTagReportComponent implements OnInit, OnDestroy {

  title: string = 'Conversion Tag Report';
  displayedColumns: Array<string>;
  dataSource: MatTableDataSource<TagInformation>
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  // Subscription that will be monitoring if a new tag needs to be added
  // to the table. Used for x-component communication betweem the settings-form component
  // and the conversion-tag-report component.
  private addToTableSubscription!: Subscription;

  constructor(private floodlightTracker: FloodlightTrackerService,
    private changeDetectorRefs: ChangeDetectorRef,
    public dialog: MatDialog) {
    this.paginator = new MatPaginator(new MatPaginatorIntl(), ChangeDetectorRef.prototype);
    this.sort = new MatSort();
    this.dataSource = new MatTableDataSource<TagInformation>([]);
    this.displayedColumns = this.buildColumns();
  }

  ngOnInit(): void {
    // Create subscription to monitor when a new tag needs to be added to the table.
    this.addToTableSubscription = this.floodlightTracker.addToTableEmitter
      .subscribe((tagInformation: TagInformation | undefined) => {
        if (tagInformation) {
          let rows = this.dataSource.data;
          rows.push(tagInformation);
          this.dataSource.data = rows;
          // Workaround to update the View 'manually' since it not being updated automatically.
          // TODO: investigate.
          this.changeDetectorRefs.detectChanges();
        } else {
          // Clear table when undefined, it means that the table needs to be reset.
          this.dataSource.data = [];
        }
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    // Always destroy the subscription to avoid memory leaks.
    this.addToTableSubscription.unsubscribe();
  }

  buildColumns() {
    return [
      'page',
      'tagType',
      'accountId',
      'gTag',
      'networkCall',
      'floodlightId',
      'floodlightActivityTag',
      'floodlightActivityGroup',
      'floodlightSalesOrder',
      'floodlightUVariables',
      'warnings',
      'errors'
    ]
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  cropURL(url: string) {
    let limit = 30;
    if (url.length > limit) {
      url = url.substr(0, limit) + "...";
    }
    return url;
  }

  cleanupColumn(content: string) {
    content = content.replace('<br/>', '').replace('<br>', '');
    if(!content || content === 'null') {
      return 'None'
    }
    return content;
  }

  openDialog(title: string, url: string) {
    this.dialog.open(DialogComponent, {
      data: {
        title: title,
        url: url
      }
    });
  }

}
