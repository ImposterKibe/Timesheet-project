import { Component, OnInit, HostBinding, ViewChild, ChangeDetectorRef } from '@angular/core';
import { TimesheetService } from '../../services/timesheet.service';
import { MatPaginator, MatTableDataSource, MatSort, MatChipSelectionChange, MatSnackBar, Sort } from '@angular/material';
import { MatRippleModule } from '@angular/material/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { ApplicationStateService } from 'src/app/application-state.service';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { validateBasis } from '@angular/flex-layout';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import * as _moment from 'moment';
import { getDateStrFromDateObj, changeDateToLocale } from '../../helper/clientCommonFunction'

const moment = _moment;
export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY',
  },
};

@Component({
  selector: 'app-timesheet',
  templateUrl: './timesheet.component.html',
  styleUrls: ['./timesheet.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class TimesheetComponent implements OnInit {
  todayhrs: string
  yesterdayhrs: string
  lastWeekHrs: string
  lastMonthHrs: string
  thisWeekHrs: string
  thisMonthHrs: string
  dateHrs: string
  tableMsg: string;
  showTable: any
  selectedStartDate: any;
  selectedEndDate: any
  showChangedDate: any
  maxDate: any
  screen: boolean;
  dateRangeJson: any = {
    "today": "",
    "yesterday": "",
    "lastweekSun": "",
    "lastweekMon": "",
    "lastweekFri": "",
    "lastweekSat": "",
    "thisweekSun": "",
    "thisweekMon": "",
    "thisWeekFri": "",
    "thisWeekSat": "",
    "firstThisMonth": "",
    "endThisMonth": "",
    "firstLastMonth": "",
    "endLastMonth": "",
  }
  userid = window.sessionStorage.getItem('userid');

  timesheet: any = {
    timesheet_id: 0,
    user_id: '',
    project_id: 0,
    description: '',
    duration: 0,
    approved: 0,
    entry_date: '',
    created_date: '',
    updated_date: '',
    start_time: new Date().getHours() + ':' + new Date().getMinutes(),
    end_time: new Date().getHours() + ':' + new Date().getMinutes(),
    planned_start_date: '',
    planned_end_date: ''

  };
  timesheets: MatTableDataSource<any>;

  displayedColumns: string[] = ['project_name', 'entry_date', 'start_time', 'end_time', 'duration', 'description', 'action'];
  @HostBinding('class') classes = 'row';
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  selectedIndex = 0
  constructor(private timesheetService: TimesheetService, private router: Router,
    private ChangeDetectorRefs: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private applicationStateService: ApplicationStateService) {
  }

  ngOnInit() {
    this.getDatesOfRange()
    this.todayhrs = "00:00"
    this.yesterdayhrs = "00:00"
    this.lastWeekHrs = "00:00"
    this.lastMonthHrs = "00:00"
    this.thisWeekHrs = "00:00"
    this.thisMonthHrs = "00:00"
    this.dateHrs = "00:00"
    this.showTable = true
    var dateObj = new Date()
    var dt: any = getDateStrFromDateObj(dateObj)
    this.maxDate = dt
    this.showChangedDate = new Date()
    this.timesheet.start_Date = dt
    this.timesheet.end_Date = dt
    this.selectedStartDate = dt
    this.selectedEndDate = dt
    this.showChangedDate = dt
    this.timesheets = new MatTableDataSource([])
    if (this.applicationStateService.getIsMobileResolution()) {
      this.screen = true
    }
    else
      this.screen = false
  }

  openSnackBar(msg, dur) {
    this.snackBar.open(msg, "Close", {
      duration: dur,
    });
  }

  checkRouting(selRoute) {
    if (selRoute == 'today') {
      this.cardClicked('today')
      this.dateHrs = this.todayhrs
      this.selectedIndex = 1
    }
    else if (selRoute == 'yesterday') {
      this.cardClicked('yesterday')
      this.selectedIndex = 2
    }
    else if (selRoute == 'week') {
      this.cardClicked('thisWeek')
      this.selectedIndex = 3
    }
    else if (selRoute == 'thisMonth') {
      this.cardClicked('thisMonth')
      this.selectedIndex = 5
    }
    else if (selRoute == 'lastMonth') {
      this.cardClicked('lastMonth')
      this.selectedIndex = 6
    }
    else if (selRoute == 'lastWeek') {
      this.cardClicked('lastWeek')
      this.selectedIndex = 4
    }
    else {
      this.cardClicked('today')
      this.dateHrs = this.todayhrs
      this.selectedIndex = 1

    }
  }

  getDurationString(value) { //value is in minutes
    if (value == null) {
      return "00:00"
    }
    var str = value
    if (value > 9) {
      if (value > 59) {//more than 1 hr
        var hrs = Math.floor(value / 60)  //hours
        value = value % 60

        if (hrs < 10) {
          str = "0" + hrs + ":"
          if (value < 10) {
            str += "0" + value
          }
          else {
            str += value
          }
        }
        else {
          str = hrs + ":"
          if (value < 10) {
            str += "0" + value
          }
          else {
            str += value
          }
        }
      }
      else {
        str = "00:" + value;
      }
    }
    else {
      str = "00:0" + value
    }
    return str
  }

  getAllDurations(jsonObj) {
    var id = this.userid
    this.timesheetService.getAllDurations(id, jsonObj).subscribe(
      res => {
        if (res['statusCode'] == 200) {

          this.checkRouting(this.router.url.split('/')[2])
          this.todayhrs = this.getDurationString(Math.round(res['data']['todayDur']))
          this.yesterdayhrs = this.getDurationString(Math.round(res['data']['yesterdayDur']))
          this.thisMonthHrs = this.getDurationString(Math.round(res['data']['thisMonthHrs']))
          this.lastMonthHrs = this.getDurationString(Math.round(res['data']['lastMonthHrs']))
          this.thisWeekHrs = this.getDurationString(Math.round(res['data']['thisWeekHrs']))
          this.lastWeekHrs = this.getDurationString(Math.round(res['data']['lastWeekHrs']))
          // if (this.yesterdayhrs == "00:00") {
          //   this.openSnackBar("Yesterday's timesheet is missing!",3500)
          // }
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          sessionStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      err => console.error(err)
    );
  }

  getDatesOfRange() {
    var dateObj = new Date();
    var id = getDateStrFromDateObj(dateObj)
    this.timesheetService.getDateRanger(id).subscribe(
      res => {
        if (res['statusCode'] == undefined || res['statusCode'] == 200) {
          // this.dateRangeJson['today'] = getDateStrFromDateObj(new Date(res['data']['today']))
          // this.dateRangeJson['yesterday'] = getDateStrFromDateObj(new Date(res['data']['yesterday']))

          this.dateRangeJson['today'] = res['data']['today']
          this.dateRangeJson['yesterday'] = res['data']['yesterday']
          this.dateRangeJson['thisweekSun'] = res['data']['thisweekSun']
          this.dateRangeJson['thisweekMon'] = res['data']['thisweekMon']
          this.dateRangeJson['thisWeekFri'] = res['data']['thisWeekFri']
          this.dateRangeJson['thisWeekSat'] = res['data']['thisWeekSat']
          this.dateRangeJson['lastweekSun'] = res['data']['lastweekSun']
          this.dateRangeJson['lastweekMon'] = res['data']['lastweekMon']
          this.dateRangeJson['lastweekFri'] = res['data']['lastweekFri']
          this.dateRangeJson['lastweekSat'] = res['data']['lastweekSat']
          for (var key in this.dateRangeJson) {
            this.dateRangeJson[key] = this.dateRangeJson[key].substring(0, 10)
          }
          var dt = this.dateRangeJson['today']
          var gYear = dt.split("-")[0]
          var gMon = dt.split("-")[1]
          var dt1 = gYear + "-" + gMon + "-01"
          var dt2 = this.generateMonth(dt)
          this.dateRangeJson['firstThisMonth'] = dt1
          this.dateRangeJson['endThisMonth'] = dt2
          var tempMon = parseInt(dt.split("-")[1]) - 1
          if (tempMon < 9) {
            var gMon: any = "0" + tempMon
          }
          if (tempMon > 9) {
            gMon = "" + tempMon
          }
          if (tempMon == 0)
            gMon = "12"

          var dt3 = gYear + "-" + gMon + "-01"
          var dt4 = this.generateMonth(dt3)
          this.dateRangeJson['firstLastMonth'] = dt3
          this.dateRangeJson['endLastMonth'] = dt4
          this.getAllDurations(this.dateRangeJson);
        }
        if (res['statusCode'] == "401") {
          sessionStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      err => console.error(err)
    );
  }

  leapYear(year) {
    return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
  }

  generateMonth(givenDate) {
    var gYear = givenDate.split("-")[0]
    var gMon = givenDate.split("-")[1]
    var gDate = givenDate.split("-")[2]
    if (this.leapYear) {
      var mon = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    }
    else {
      var mon = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    }
    var returned = gYear + "-" + gMon + "-" + mon[parseInt(gMon)]
    return returned
  }

  editTimesheet(selTId) {
    var id = selTId
    this.router.navigate(['timesheet/edit/' + id]);
  }

  getDuration(res) {
    return this.getDurationString(Math.round(res / 60));
  }

  cardClicked(type) {
    var id = this.userid
    var jsonObj = {}
    jsonObj["id"] = id
    jsonObj["presentDate"] = new Date(getDateStrFromDateObj(new Date))
    if (type == 'today') {
      jsonObj['start_date'] = this.dateRangeJson['today']
      jsonObj['end_date'] = this.dateRangeJson['today']
    }
    else if (type == 'yesterday') {
      jsonObj['start_date'] = this.dateRangeJson['yesterday']
      jsonObj['end_date'] = this.dateRangeJson['yesterday']
    }
    else if (type == 'thisWeek') {
      jsonObj['start_date'] = this.dateRangeJson['thisweekSun']
      jsonObj['end_date'] = this.dateRangeJson['thisWeekSat']
    }
    else if (type == 'thisMonth') {
      jsonObj['start_date'] = this.dateRangeJson['firstThisMonth']
      jsonObj['end_date'] = this.dateRangeJson['endThisMonth']
    }
    else if (type == 'lastMonth') {
      jsonObj['start_date'] = this.dateRangeJson['firstLastMonth']
      jsonObj['end_date'] = this.dateRangeJson['endLastMonth']
    }
    else if (type == 'lastWeek') {
      jsonObj['start_date'] = this.dateRangeJson['lastweekSun']
      jsonObj['end_date'] = this.dateRangeJson['lastweekSat']
    }
    this.timesheetService.getDaySpecificTimeSheet(jsonObj).subscribe(
      res => {
        if (res['statusCode'] == "401") {
          sessionStorage.clear();
          this.router.navigate(['/login']);
        }
        if (res['statusCode'] == 200) {
          this.changeDisplayDate(type)
          res = res['data']
          if (Object.keys(res).length == 0) {
            this.tableMsg = "No Data Available!"
            this.showTable = false
            return
          }
          res = changeDateToLocale({ "res": res })
          this.tableMsg = ""
          this.showTable = true
          this.ChangeDetectorRefs.detectChanges()
          this.timesheets = new MatTableDataSource(res as {
            project_name: '',
            entry_date: any,
            duration: number,
            start_time: '',
            end_time: '',
            description: ''
          }[]);
          this.timesheets.sort = this.sort;
          const sortState: Sort = { active: 'entry_date', direction: 'asc' };
          this.sort.active = sortState.active;
          this.sort.direction = sortState.direction;
          this.sort.sortChange.emit(sortState);
          this.timesheets.paginator = this.paginator;
        }
      },
      err => console.error(err)
    );
  }

  changeDisplayDate(type) {
    var dateObj = new Date();
    var dt = this.dateRangeJson['today']
    if (type == "today") {
      var dt1 = this.dateRangeJson['today']
      this.selectedStartDate = dt
      this.showChangedDate = dt
      this.selectedEndDate = dt1
      this.timesheet.start_Date = dt
      this.timesheet.end_Date = dt1
      this.dateHrs = this.todayhrs
    }
    else if (type == "yesterday") {
      var dt1 = this.dateRangeJson['yesterday']
      this.selectedStartDate = dt1
      this.showChangedDate = dt1
      this.timesheet.start_Date = dt1
      this.selectedEndDate = dt1
      this.timesheet.end_Date = dt1
      this.dateHrs = this.yesterdayhrs
    }
    else if (type == "thisWeek") {
      var dt1 = this.dateRangeJson['thisweekSun']
      this.selectedStartDate = dt1
      this.showChangedDate = dt1
      this.selectedEndDate = this.dateRangeJson['thisWeekSat']
      this.timesheet.start_Date = dt1
      this.timesheet.end_Date = this.dateRangeJson['thisWeekSat']
      this.dateHrs = this.thisWeekHrs
    }
    else if (type == "lastWeek") {
      var dt1 = this.dateRangeJson['lastweekSun']
      this.selectedStartDate = dt1
      this.showChangedDate = dt1
      this.selectedEndDate = this.dateRangeJson['lastweekSat']
      this.timesheet.start_Date = dt1
      this.timesheet.end_Date = this.dateRangeJson['lastweekSat']
      this.dateHrs = this.lastWeekHrs
    }
    else if (type == "thisMonth") {
      var dt1 = this.dateRangeJson['firstThisMonth']
      this.selectedStartDate = dt1
      this.showChangedDate = dt1
      this.selectedEndDate = this.dateRangeJson['endThisMonth']
      this.timesheet.start_Date = dt1
      this.timesheet.end_Date = this.dateRangeJson['endThisMonth']
      this.dateHrs = this.thisMonthHrs
    }
    else if (type == "lastMonth") {
      var dt1 = this.dateRangeJson['firstLastMonth']
      this.selectedStartDate = dt1
      this.showChangedDate = dt1
      this.selectedEndDate = this.dateRangeJson['endLastMonth']
      this.timesheet.start_Date = dt1
      this.timesheet.end_Date = this.dateRangeJson['endLastMonth']
      this.dateHrs = this.lastMonthHrs
    }
  }

  callTSAPI(jsonObjData: any) {
    var jsonObj: any = jsonObjData["jsonObj"]
    jsonObj["id"] = jsonObjData["id"]
    jsonObj["presentDate"] = new Date(getDateStrFromDateObj(new Date))
    this.timesheetService.getDaySpecificTimeSheet(jsonObj).subscribe(
      (res: any) => {
        if (res['statusCode'] == "401") {
          sessionStorage.clear();
          this.router.navigate(['/login']);
        }
        if (res['statusCode'] == 200) {
          this.dateHrs = this.getDurationString(Math.round(res['time']))
          res = res['data']
          if (Object.keys(res).length == 0) {
            this.tableMsg = "No Data Available!"
            this.showTable = false
            return
          }
          res = changeDateToLocale({ "res": res })
          this.tableMsg = ""
          this.showTable = true
          this.ChangeDetectorRefs.detectChanges()
          this.timesheets = new MatTableDataSource(res as {
            project: number,
            duration: number,
            start_time: '',
            end_time: '',
            description: ''
          }[]);
          this.timesheets.sort = this.sort;
          const sortState: Sort = { active: 'entry_date', direction: 'asc' };
          this.sort.active = sortState.active;
          this.sort.direction = sortState.direction;
          this.sort.sortChange.emit(sortState);
          this.timesheets.paginator = this.paginator;
        }
      },
      err => console.error(err)
    );
  }

  changedStartDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.selectedIndex = 0
    this.showChangedDate = event.value
    this.timesheet.start_Date = event.value
    var check = moment(this.showChangedDate, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.timesheet.planned_start_date = year + "-" + month + "-" + day
    var jsonObj = { "start_date": "", "end_date": "" }
    var id = this.userid
    jsonObj['start_date'] = this.timesheet.planned_start_date
    if (this.timesheet.planned_end_date == "")
      this.timesheet.planned_end_date = this.timesheet.end_Date
    jsonObj['end_date'] = this.timesheet.planned_end_date


    var reqJsonObj: any = {}
    reqJsonObj['id'] = id
    reqJsonObj['jsonObj'] = jsonObj
    this.callTSAPI(reqJsonObj)
  }

  changedEndDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.selectedIndex = 0
    this.timesheet.end_Date = event.value
    var anothershowChangedDate = event.value
    var check = moment(anothershowChangedDate, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.timesheet.planned_end_date = year + "-" + month + "-" + day
    var jsonObj = { "start_date": "", "end_date": "" }
    var id = this.userid
    if (this.timesheet.planned_start_date == "")
      this.timesheet.planned_start_date = this.timesheet.start_Date
    jsonObj['start_date'] = this.timesheet.planned_start_date
    jsonObj['end_date'] = this.timesheet.planned_end_date

    var reqJsonObj: any = {}
    reqJsonObj['id'] = id
    reqJsonObj['jsonObj'] = jsonObj
    this.callTSAPI(reqJsonObj)
  }

}
