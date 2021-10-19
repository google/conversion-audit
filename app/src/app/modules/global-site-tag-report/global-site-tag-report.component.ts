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
import { GlobalSiteTag } from '../../models/global-site-tag';
import { GlobalTagVerificationService } from '../../services/global-tag-verification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-global-site-tag-report',
  templateUrl: './global-site-tag-report.component.html',
  styleUrls: ['./global-site-tag-report.component.css']
})
export class GlobalSiteTagReportComponent implements OnInit, OnDestroy {

  title: string = 'Global Site Tag Verification Report';
  displayedColumns: Array<string>;
  dataSource: MatTableDataSource<GlobalSiteTag>
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  // Subscription that will be monitoring if a new tag needs to be added
  // to the table. Used for x-component communication between the settings-form component
  // and the global-site-tag-report component.
  private addToTableSubscription!: Subscription;

  constructor(private globalTag: GlobalTagVerificationService,
    private changeDetectorRefs: ChangeDetectorRef) {
    this.paginator = new MatPaginator(new MatPaginatorIntl(), ChangeDetectorRef.prototype);
    this.sort = new MatSort();
    this.dataSource = new MatTableDataSource<GlobalSiteTag>([]);
    this.displayedColumns = this.buildColumns();
  }

  ngOnInit(): void {
    // Create subscription to monitor when a new tag needs to be added to the table.
    this.addToTableSubscription = this.globalTag.addToTableEmitter
      .subscribe((tagInformation: GlobalSiteTag | undefined) => {
        if (tagInformation) {
          var rows = this.dataSource.data;
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
      'url',
      'tags'
    ]
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

}
