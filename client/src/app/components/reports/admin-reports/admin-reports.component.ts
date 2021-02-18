import { Component, OnInit, Input, HostBinding, ViewChild, ChangeDetectorRef } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { TimesheetService } from 'src/app/services/timesheet.service';
import { MatPaginator, MatTableDataSource, MatSort, Sort, MatSelect, MatOption, MatSnackBar } from '@angular/material';
import { ExcelDownloadService } from 'src/app/services/excel-download.service';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { ApplicationStateService } from 'src/app/application-state.service';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import * as _moment from 'moment';
import { getDateStrFromDateObj, changeDateToLocale, getLocaleTimeFromDate, getWrokedHrsFromSeconds } from '../../../helper/clientCommonFunction'
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

export interface user {
  value: string;
  userid: any

}
export interface pro {
  value: string;
  proid: any

}

export interface summaryDataTable {
  hours: any;
  percentage: any;
  type: any;
}
export interface detailedDataTable {
  user_name: any;
  net_available_hrs: any;
  billable_hrs: any;
  pre_sales: any;
  qta_dev: any;
  internal_engg: any;
  competency: any;
  non_billable_hrs: any;
  unaccounted_hrs: any;
  billable_utilization: any
}
@Component({
  selector: 'app-admin-reports',
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class AdminReportsComponent implements OnInit {
  screen: boolean;
  example: any = [];
  @HostBinding('class') classes = 'row';
  @Input() showNav: string;
  @ViewChild('timesheetPaginator') timesheetPaginator: MatPaginator;
  @ViewChild('timesheetSort') timesheetSort: MatSort;
  @ViewChild('detailedPaginator') detailedPaginator: MatPaginator;
  @ViewChild('detailedSort') detailedSort: MatSort;
  @ViewChild('allProSelected') private allProSelected: MatOption;
  @ViewChild('allUserSelected') private allUserSelected: MatOption;
  userForm: FormGroup;
  proForm: FormGroup;
  Tabledata: any = {
    user_name: '',
    project_name: '',
  };
  selectedProjectName = [];
  selectedUserName = [];
  tabledata: MatTableDataSource<any>;
  summarytabledata: MatTableDataSource<summaryDataTable>;
  detailedtabledata: MatTableDataSource<detailedDataTable>;
  displayedSummaryColumns: string[] = ['reportType', 'hours', 'percentOfHours'];
  displayedColumns: string[] = ['user_name', 'project_name', 'entry_date', 'start_time', 'end_time', 'duration'];
  displayedDetailedColumns: string[] = ['user_name', 'workingDaysHours', 'leavesDaysHours', 'net_available_hrs', 'billable_hrs', 'pre_sales', 'qta_dev', 'internal_engg',
    'competency', 'non_billable_hrs', 'billable_utilization', 'unaccounted_hrs'];
  message: string;
  timesheet: any = {
    start_Date: '',
    end_Date: '',
    user_id: '',
    project_id: ''
  };
  users: user[] = [
  ];
  pros: pro[] = [
  ];
  tableMsg: any
  showReportsTable: boolean = false
  onlyProId = []
  onlyuserId = []
  roleid = window.sessionStorage.getItem('role');
  UserId = window.sessionStorage.getItem('userid');
  defaultSelectedUser: any
  defaultSelectedPro: any
  startMinDate: any
  startMaxDate: any
  endMinDate: any
  endMaxDate: any
  showChangedDate: any
  selectedEndDate: any
  selectedStartDate: any
  firstWeek: any
  isDisabled: boolean = true;
  constructor(private excelService: ExcelDownloadService,
    private applicationStateService: ApplicationStateService,
    private timesheetService: TimesheetService, private adminService: AdminService, private authService: AuthenticationService,
    private router: Router,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    private changeDetectorRefs: ChangeDetectorRef) { }

  ngOnInit() {
    this.userForm = this.formBuilder.group({
      proType: ['',],
      userType: ['',],
    });
    this.proForm = this.formBuilder.group({
      proType: ['',],
      userType: ['',],
    });
    this.getTodaysStartingWeek()
    if (this.applicationStateService.getIsMobileResolution()) {
      this.screen = true
    }
    else
      this.screen = false
  }

  changedDetailedData(realData: any) {
    var tempArr: any = [],tempJson:any={}
    realData.filter((eachBlk:any)=>{
      tempJson={}
      tempJson['User Name']=eachBlk['user_name']
      tempJson['Working Hours']=eachBlk['workingDaysHours']
      tempJson['Leaves Hours']=eachBlk['leavesDaysHours']
      tempJson['Net Available Hours']=eachBlk['net_available_hrs']
      tempJson['Billable Hours']=eachBlk['billable_hrs']
      tempJson['Pre Sales']=eachBlk['pre_sales']
      tempJson['QTA Development']=eachBlk['qta_dev']
      tempJson['Internal Engg']=eachBlk['internal_engg']
      tempJson['Competency']=eachBlk['competency']
      tempJson['Non Billable Hours']=eachBlk['non_billable_hrs']
      tempJson['Billable Utilization']=eachBlk['billable_utilization']
      tempJson['Unaccounted Hours']=eachBlk['unaccounted_hrs']
      tempArr.push(tempJson)
    })
    return tempArr
  }

  changedTSData(realData: any) {
    var tempArr: any = [],tempJson:any={}
    realData.filter((eachBlk:any)=>{
      tempJson={}
      tempJson['User Name']=eachBlk['user_name']
      tempJson['Project Name']=eachBlk['project_name']
      tempJson['Entry Date']=getDateStrFromDateObj(eachBlk['entry_date'])
      tempJson['Start Time']=getLocaleTimeFromDate(eachBlk['start_time'])
      tempJson['End Time']=getLocaleTimeFromDate(eachBlk['end_time'])
      tempJson['Worked For']=getWrokedHrsFromSeconds(eachBlk['workedHrs'])
      
      tempArr.push(tempJson)
    })
    return tempArr
  }

  changedSummaryData(realData: any) {
    var tempArr: any = [],tempJson:any={}
    realData.filter((eachBlk:any)=>{
      tempJson={}
      tempJson['Work Type']=eachBlk['type']
      tempJson['Total Hours']=eachBlk['hours']
      tempJson['Percentage']=(eachBlk['percent'])
      
      tempArr.push(tempJson)
    })
    return tempArr
  }

  exportAsXLSX(): void {
    this.excelService.exportAsExcelFile(this.changedTSData(this.tabledata.data), 'Timesheet Report');
  }

  SummaryReportExcel() {
    this.excelService.exportAsExcelFile(this.changedSummaryData(this.summarytabledata.data), 'Summary Report');
  }  

  detailedReportExcel() {
    this.excelService.exportAsExcelFile(this.changedDetailedData(this.detailedtabledata.data), 'Detailed Report');
  }

  getusers() {
    this.adminService.getusers().subscribe(
      res => {
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          res = res['data']
          var keys = Object.keys(res);
          var len = keys.length;
          this.selectedUserName.push(0)

          for (var i = 0; i < len; i++) {
            this.users.push({ value: res[i]['user_name'], userid: res[i]['user_id'] })
            this.onlyuserId.push(res[i]['user_id'])
            this.selectedUserName.push(res[i]['user_id'])
          }
          this.timesheet.user_id = this.onlyuserId
          this.getProjects();
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
          this.getProjects();
        }
      },
      err => console.error(err)
    );
  }

  getProjects() {
    var jsonObj: any = {}
    jsonObj["user_id"] = this.UserId
    jsonObj["action"] = "report"
    this.authService.getAllProjForReportOrPlanning(jsonObj).subscribe(
      (res: any) => {
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          res = res['data']
          var len = res.length;
          this.selectedProjectName.push(0)
          for (var i = 0; i < len; i++) {
            if (res[i]['project_code'].split("-")[0] == 'p') {
              this.pros.push({ value: res[i]['project_name'] + "_" + res[i]['project_code_old'], proid: res[i]['id'] })
            }
            else {
              this.pros.push({ value: res[i]['project_name'] + "_" + res[i]['project_code'], proid: res[i]['id'] })
            }
            this.onlyProId.push(res[i]['id'])
            this.selectedProjectName.push(res[i]['id'])
          }
          this.timesheet.project_id = this.onlyProId
          this.getSummaryTableData()
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      (err: any) => {
        console.error("Error while getProjects ", err)
      }
    )
  }

  getMessage(type) {
    if (type == "userid") {
      this.message = this.selectedUserName + ' is not assigned to any Project ';
    }
    else if (type == 'projectid') {
      this.message = 'No user are assigned to this project ' + this.selectedProjectName;
    }
    else if (type == "Please check the Dates") {
      this.message = 'No user are assigned to this project ' + this.selectedProjectName;
    }
    else {
      this.message = this.selectedUserName + ' is not assigned to the Project ' + this.selectedProjectName;;
    }
  }

  getSummaryTableData() {
    this.summarytabledata = new MatTableDataSource();
    var jsonObj = {}
    jsonObj['start_date'] = this.timesheet.start_Date
    jsonObj['end_date'] = this.timesheet.end_Date
    jsonObj['user_id'] = this.timesheet.user_id
    this.adminService.getAdminSummaryReport(jsonObj).subscribe(
      res => {
        this.getDetailedTableData(jsonObj);
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          if (res == undefined || Object.keys(res['data']).length == 0) {
            this.getMessage(res['type'])
            this.tableMsg = "No Data Available"
            this.isDisabled = true
            return;
          }
          res = res['data']
          this.summarytabledata = new MatTableDataSource(res as {
            type: '',
            hours: '',
            percentage: '',
          }[]);
        }
        if (res['status'] == "500") {
          this.openSnackBar("Error Occured while getting Summary Table Data!")
          this.getDetailedTableData(jsonObj);
        }
      },
      err => console.error(err)
    );
  }

  getDetailedTableData(jsonObj) {
    this.detailedtabledata = new MatTableDataSource();
    this.adminService.getAdminDetailedReport(jsonObj).subscribe(
      res => {
        this.getAllData();
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          if (res == undefined || Object.keys(res['data']).length == 0) {
            this.getMessage(res['type'])
            this.tableMsg = "No Data Available"
            this.isDisabled = true
            return;
          }
          res = res['data']
          this.detailedtabledata = new MatTableDataSource(res as {
            user_name: any;
            net_available_hrs: any;
            billable_hrs: any;
            pre_sales: any;
            qta_dev: any;
            internal_engg: any;
            competency: any;
            non_billable_hrs: any;
            unaccounted_hrs: any;
            billable_utilization: any
          }[]);
          if (!this.changeDetectorRefs['destroyed']) {
            this.changeDetectorRefs.detectChanges()
          }
          this.detailedtabledata.sort = this.detailedSort;
          const sortState: Sort = { active: 'user_name', direction: 'asc' };
          this.detailedSort.active = sortState.active;
          this.detailedSort.direction = sortState.direction;
          this.detailedSort.sortChange.emit(sortState);
          this.detailedtabledata.paginator = this.detailedPaginator;
        }
        if (res['status'] == "500") {
          this.openSnackBar("Error Occured while getting Summary Table Data!")
          this.getAllData();
        }
      },
      err => console.error(err)
    );
  }

  selectproid(selectedProject) {
    this.tabledata = new MatTableDataSource();
    if (this.allProSelected.selected) {
      this.allProSelected.deselect();
    }
    if (this.proForm.controls.proType.value.length == this.pros.length) {
      this.allProSelected.select();
    }
    this.timesheet.project_id = this.selectedProjectName
    if (this.onlyuserId.length == 0) {
      this.showReportsTable = false
      this.tableMsg = "No Users Available!"
      return
    }
    if (this.onlyProId.length == 0) {
      this.showReportsTable = false
      this.tableMsg = "No Projects Available!"
      return
    }
    if (this.selectedProjectName.length == 0 || this.selectedUserName.length == 0) {
      if (this.selectedProjectName.length == 0)
        this.tableMsg = "Please Select a  Project!"
      else
        this.tableMsg = "Please Select a User!"
      this.showReportsTable = false
      return
    }
    this.getAllData()
    return
  }

  selectuserid(selectUser) {
    this.tabledata = new MatTableDataSource();
    if (this.allUserSelected.selected) {
      this.allUserSelected.deselect();
    }
    if (this.userForm.controls.userType.value.length == this.users.length) {
      this.allUserSelected.select();
    }
    this.timesheet.user_id = this.selectedUserName
    if (this.onlyuserId.length == 0) {
      this.showReportsTable = false
      this.tableMsg = "No Users Available!"
      return
    }
    if (this.onlyProId.length == 0) {
      this.showReportsTable = false
      this.tableMsg = "No Projects Available!"
      return
    }
    if (this.selectedProjectName.length == 0 || this.selectedUserName.length == 0) {
      if (this.selectedProjectName.length == 0)
        this.tableMsg = "Please Select a  Project!"
      else
        this.tableMsg = "Please Select a User!"
      this.showReportsTable = false
      return
    }
    this.tableMsg = ''
    this.showReportsTable = true
    this.getSummaryTableData()
    return
  }

  openSnackBar(message) {
    this.snackBar.open(message, "Close", {
      duration: 5000,
    });
  }

  getTodaysStartingWeek() {
    var dateObj = new Date();
    var dt: any = getDateStrFromDateObj(dateObj)
    var id = dt
    this.timesheetService.getDateRanger(id).subscribe(
      res => {
        if (res['statusCode'] == undefined || res['statusCode'] == 200) {
          this.firstWeek = res['data']['thisweekMon']
          this.firstWeek = this.firstWeek.substring(0, 10)
          this.selectedStartDate = this.firstWeek
          this.timesheet.start_Date = this.selectedStartDate
          this.selectedEndDate = res['data']['today']
          this.timesheet.end_Date = res['data']['today']
          this.startMaxDate = res['data']['today']
          this.endMaxDate = res['data']['today']
          this.getusers();
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }

      },
      err => console.error(err)
    );
    return
  }

  getAllData() {
    this.tabledata = new MatTableDataSource()
    var index = this.selectedUserName.indexOf(0);
    if (index > -1) {
      this.selectedUserName.splice(index, 1);
    }
    var index1 = this.selectedProjectName.indexOf(0);
    if (index1 > -1) {
      this.selectedProjectName.splice(index1, 1);
    }
    var jsonObj = {}
    jsonObj['userid'] = this.selectedUserName
    jsonObj['proid'] = this.selectedProjectName
    jsonObj['start_date'] = this.timesheet.start_Date
    jsonObj['end_date'] = this.timesheet.end_Date
    this.adminService.getSpecData(jsonObj).subscribe(
      (res: any) => {
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          if (res == undefined || Object.keys(res['status']).length == 0) {
            this.getMessage(res['type'])
            this.showReportsTable = false
            this.tableMsg = "No Data Available"
            this.isDisabled = true
            return;
          }
          this.showReportsTable = true
          this.tableMsg = ''
          res = changeDateToLocale({ "res": res['status'] })
          var keys = Object.keys(res);
          var len = keys.length;
          this.isDisabled = false
          this.showReportsTable = true
          this.tableMsg = ''
          this.tabledata = new MatTableDataSource(res as {
            user_name: '',
            project_name: '',
            workedHrs: 0
          }[]);
          if (!this.changeDetectorRefs['destroyed']) {
            this.changeDetectorRefs.detectChanges()
          }
          this.tabledata.sort = this.timesheetSort;
          const sortState: Sort = { active: 'entry_date', direction: 'asc' };
          this.timesheetSort.active = sortState.active;
          this.timesheetSort.direction = sortState.direction;
          this.timesheetSort.sortChange.emit(sortState);
          this.tabledata.paginator = this.timesheetPaginator;
        }
        if (res['statusCode'] == "500") {
          this.openSnackBar("Error Occured while getting Table Data!")
        }
      },
      err => console.error(err)
    );
  }

  changedStartDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.endMinDate = event.value
    var check = moment(event.value, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.timesheet.start_Date = year + "-" + month + "-" + day
  }

  changedEndDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.startMaxDate = event.value
    var check = moment(event.value, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.timesheet.end_Date = year + "-" + month + "-" + day
  }

  changedDate() {
    this.tabledata = new MatTableDataSource();
    if (this.timesheet.start_Date > this.timesheet.end_Date) {
      this.getMessage("Please check the Dates")
      this.openSnackBar("Please check the Dates")
      this.isDisabled = true
      return
    }
    this.getSummaryTableData()
    return
  }

  getDuration(res) {
    return this.getDurationString(Math.round(res / 60));
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

  toggleAllProSelection() {
    this.tabledata = new MatTableDataSource();
    if (this.allProSelected.selected) {
      this.proForm.controls.proType
        .patchValue([...this.pros.map(item => item.proid), 0]);
      this.timesheet.project_id = this.onlyProId
      if (this.selectedProjectName.length == 0 || this.selectedUserName.length == 0) {
        if (this.selectedProjectName.length == 0)
          this.tableMsg = "Please Select a  Project!"
        else
          this.tableMsg = "Please Select a User!"
        this.showReportsTable = false
        return
      }
      this.tableMsg = ''
      this.showReportsTable = true
      //write api calling
      this.getAllData()
      return
    } else {
      this.proForm.controls.proType.patchValue([]);
      if (this.selectedProjectName.length == 0 || this.selectedUserName.length == 0) {
        if (this.selectedProjectName.length == 0)
          this.tableMsg = "Please Select a  Project!"
        else
          this.tableMsg = "Please Select a User!"
        this.showReportsTable = false
        return
      }
    }

  }

  toggleAllUserSelection() {
    this.tabledata = new MatTableDataSource();
    if (this.allUserSelected.selected) {
      this.userForm.controls.userType
        .patchValue([...this.users.map(item => item.userid), 0]);
      this.timesheet.user_id = this.onlyuserId
      if (this.selectedProjectName.length == 0 || this.selectedUserName.length == 0) {
        if (this.selectedProjectName.length == 0)
          this.tableMsg = "Please Select a  Project!"
        else
          this.tableMsg = "Please Select a User!"
        this.showReportsTable = false
        return
      }
      this.tableMsg = ''
      this.showReportsTable = true
      this.getSummaryTableData()
      return

    } else {
      this.userForm.controls.userType.patchValue([]);
      if (this.selectedProjectName.length == 0 || this.selectedUserName.length == 0) {
        if (this.selectedProjectName.length == 0)
          this.tableMsg = "Please Select a  Project!"
        else
          this.tableMsg = "Please Select a User!"
        this.showReportsTable = false
        return
      }
    }

  }

  applyDetailedFilter(filterValue: string) {
    this.detailedtabledata.filter = filterValue.trim().toLowerCase();
  }

  applyTimesheetFilter(filterValue: string) {
    this.tabledata.filter = filterValue.trim().toLowerCase();
  }
}
