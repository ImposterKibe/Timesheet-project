import { Component, OnInit } from '@angular/core';

import { Observable, Observer } from 'rxjs';
export interface ExampleTab {
  label: string;
  content: string;
}

@Component({
  selector: 'app-view-reports',
  templateUrl: './view-reports.component.html',
  styleUrls: ['./view-reports.component.scss']
})
export class ViewReportsComponent implements OnInit {
  showAdminReport: boolean
  showManagerReport: boolean
  showUserReport: boolean
  showAvailableReport: boolean
  // public demo1TabIndex = 2;
  roleid = window.sessionStorage.getItem('role');
  constructor() {
    this.showAdminReport = false
    this.showManagerReport = false
    this.showAvailableReport = false
    this.showUserReport = true
  }

  ngOnInit() {
  }
  tabClick(event) {
    this.showAdminReport = false
    this.showManagerReport = false
    this.showAvailableReport = false
    this.showUserReport = false
    // console.log(event, event.index)
    if (event.index == 0) {
      this.showUserReport = true
    }
    if (event.index == 1) {
      this.showManagerReport = true
    }
    if (event.index == 2) {
      this.showAdminReport = true
    }
    else if (event.index == 3) {
      this.showAvailableReport = true
    }
  }
}
