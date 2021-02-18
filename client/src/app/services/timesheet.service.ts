import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimesheetService {

  constructor(private http: HttpClient) { }

  getAllDurations(id: string, jsonObj: any) {
    return this.http.post(`/api/common/getAllDurations/${id}`, jsonObj);
  }

  getDateList() {
    return this.http.get(`/api/common/getDateList`);
  }

  getServerTime() {
    return this.http.get(`/api/common/getServerTime`);
  }

  getTimeZone() {
    // return -12
    return new Date().getTimezoneOffset()/60
  }

  getDatesToFillTS() {
    var jsonObj: any = {}
    jsonObj["presentDate"] = new Date()
    jsonObj["localeTimeOffset"] = this.getTimeZone()
    return this.http.post(`/api/timesheet/getDatesToFillTS`, jsonObj);
  }

  getTimesheet(id: string) {
    var jsonObj: any = {}
    jsonObj["id"] = id
    jsonObj["presentDate"] = new Date()
    jsonObj["localeTimeOffset"] = this.getTimeZone()
    return this.http.post(`/api/timesheet/onesheet/${id}`, jsonObj);
  }

  saveTimesheet(timesheet: any) {
    timesheet["localeTimeOffset"] = this.getTimeZone()
    return this.http.post(`/api/timesheet/addtimesheet`, timesheet);
  }

  updateTimesheet(id: string | number, updatedTimesheet: any): Observable<any> {
    updatedTimesheet["localeTimeOffset"] = this.getTimeZone()
    return this.http.put(`/api/timesheet/updatetimesheet/${id}`, updatedTimesheet);
  }

  getDaySpecificTimeSheet(jsonObj: any): Observable<any> {
    var id = jsonObj["id"]
    jsonObj["localeTimeOffset"] = this.getTimeZone()
    return this.http.post(`/api/timesheet/getDayWiseData/${id}`, jsonObj);
  }

  getDateRanger(id: string) {
    var jsonObj: any = {}
    jsonObj["id"] = id
    jsonObj["localeTimeOffset"] = this.getTimeZone()
    return this.http.post(`/api/timesheet/getDateRanger/${id}`, jsonObj);
  }

  getProjectsForTimesheet(id: string, jsonObj: any) {
    return this.http.post(`/api/common/getProjSpecificUserForTimesheet/${id}`, jsonObj);
  }

  //remove this function
  getProjects(id: string) {
    return this.http.get(`/api/common/getProjSpecificUser/${id}`);
  }

}
