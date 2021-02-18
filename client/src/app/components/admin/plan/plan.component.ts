import { Component, OnInit, HostBinding, ViewChild, ChangeDetectorRef } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { MatPaginator, MatTableDataSource, MatSort, MatSelect, MatOption, MatSnackBar, Sort } from '@angular/material';
import { TimesheetService } from 'src/app/services/timesheet.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApplicationStateService } from 'src/app/application-state.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import * as _moment from 'moment';
import { getDateStrFromDateObj } from '../../../helper/clientCommonFunction'

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
import { DataSource } from '@angular/cdk/collections';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { analyzeAndValidateNgModules } from '@angular/compiler';
export interface user {
  value: string;
  userid: any

}
export interface pro {
  value: string;
  proid: any

}
export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}


@Component({
  selector: 'app-plan',
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ]
})

export class PlanComponent implements OnInit {
  classFlag;
  data: any = [];
  example: any = [];
  @HostBinding('class') classes = 'row';
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('select') select: MatSelect;
  dataSource: MatTableDataSource<any>;
  @ViewChild('allProSelected') private allProSelected: MatOption;
  @ViewChild('allUserSelected') private allUserSelected: MatOption;
  Tabledata: any = {
    user_id: '',
    user_name: '',
    project_name: '',
    description: ''
  };
  selectedProjectName = [];
  selectedUserName = [];
  startDate: any
  endDate: any
  tabledata: MatTableDataSource<any>;
  displayedColumns = [];
  displayedTopColumns = []
  columns = [];
  headerColumns = [];
  message: string;

  users: user[] = [
  ];
  pros: pro[] = [
  ];
  tableMsg: any
  onlyProId = []
  onlyuserId = []
  startMinDate:any
  startMaxDate:any
  endMinDate:any
  endMaxDate:any
  proid: any = []
  userid: any = []
  showTable: any
  readOnly: boolean = true;
  planSubmit: boolean = false;
  screen: boolean;
  firstWeek: any
  roleid = window.sessionStorage.getItem('role');
  UserId = window.sessionStorage.getItem('userid');
  constructor(private adminService: AdminService, private timesheetService: TimesheetService,
    private authService: AuthenticationService,
    private snackBar: MatSnackBar,
    private changeDetectorRefs: ChangeDetectorRef,
    private formBuilder: FormBuilder, private applicationStateService: ApplicationStateService,
    private router: Router,
    private activatedRoute: ActivatedRoute) { }
  userForm: FormGroup;

  ngOnInit() {
    this.showTable = true
    this.readOnly = true
    this.getusers();
    this.userForm = this.formBuilder.group({
      proType: ['',],
      userType: ['',],
    });
    if (this.applicationStateService.getIsMobileResolution()) {
      this.screen = true
    }
    else
      this.screen = false
  }

  getTodaysStartingWeek() {
    var dateObj = new Date();
    var dt: any = getDateStrFromDateObj(dateObj)
    var id = dt
    this.timesheetService.getDateRanger(id).subscribe(
      res => {
        if (res['statusCode'] == undefined || res['statusCode'] == 200) {
          this.firstWeek = res['data']['thisweekMon']
          var endWeek = res['data']['thisWeekFri']
          this.firstWeek = this.firstWeek.substring(0, 10)
          endWeek = endWeek.substring(0, 10)
          this.plan.startDate = this.firstWeek
          this.plan.start_date = this.firstWeek
          this.plan.endDate = endWeek
          this.plan.end_date = endWeek
// this.nowDate=
          this.startMaxDate =res['data']['thisWeekFri']
          this.endMinDate =res['data']['thisweekMon']
          this.plan.end_date = res['data']['thisWeekFri']
          this.plan.endDate = res['data']['thisWeekFri']
          this.getAllData()
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

  getusers() {
    this.userid = []
    this.proid = []
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
          this.plan.user_id = this.onlyuserId
          this.getProjects();
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      err => console.error(err)
    );
  }

  getProjects() {
    var jsonObj: any = {}
    jsonObj["user_id"] = this.UserId
    jsonObj["action"] = "planning"
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
          this.plan.project_id = this.onlyProId
          this.getTodaysStartingWeek()
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

  selectproid(selectedProject) {
    if (this.allProSelected.selected) {
      this.allProSelected.deselect();
    }
    if (this.userForm.controls.proType.value.length == this.pros.length) {
      this.allProSelected.select();
    }
    this.plan.project_id = this.selectedProjectName
    this.getAllData()
    return
  }

  selectuserid(selectUser) {
    if (this.allUserSelected.selected) {
      this.allUserSelected.deselect();
    }
    if (this.userForm.controls.userType.value.length == this.users.length) {
      this.allUserSelected.select();
    }
    this.plan.user_id = this.selectedUserName
    this.getAllData()
    return
  }

  openSnackBar(message) {
    this.snackBar.open(message, "Close", {
      duration: 2000,
    });
  }

  plan: any = {
    user_id: '',
    project_id: '',
    startDate: '',
    endDate: ''
  };


  getAllData() {
    // var dt = new Date().toISOString();
    // dt = dt.substring(0, 10)
    if (this.onlyuserId.length == 0) {
      this.showTable = false
      this.tableMsg = "No Users Available!"
      return
    }
    if (this.onlyProId.length == 0) {
      this.showTable = false
      this.tableMsg = "No Projects Available!"
      return
    }
    if (this.selectedProjectName.length == 0 || this.selectedUserName.length == 0) {
      if (this.selectedProjectName.length == 0)
        this.tableMsg = "Please Select a  Project!"
      else
        this.tableMsg = "Please Select a User!"
      this.showTable = false
      return
    }
    this.plan.project_id = this.selectedProjectName
    this.plan.user_id = this.selectedUserName
    var index = this.plan.user_id.indexOf(0);
    if (index > -1) {
      this.plan.user_id.splice(index, 1);
    }
    var index1 = this.plan.project_id.indexOf(0);
    if (index1 > -1) {
      this.plan.project_id.splice(index1, 1);
    }
    var jsonObj = {}
    // jsonObj['user_id'] = this.plan.user_id
    // jsonObj['user_id'] = []
    jsonObj['project_id'] = this.plan.project_id
    jsonObj['start_date'] = this.plan.start_date
    jsonObj['end_date'] = this.plan.end_date
    this.adminService.PlannedAllDataSubmit(jsonObj)
      .subscribe(
        res => {
          if (res['status'] == "200") {
            if (Object.keys(res).length == 0) {
              this.tableMsg = "No Data Available!"
              this.showTable = false
              return
            }
            this.relJson = res
            this.createJsonFormat(this.relJson)
            var st = new Date("" + this.firstWeek).toISOString()
            var end = new Date("" + this.plan.end_date).toISOString()
            if (st >= end) {
              this.planSubmit = true
            }
            else {
              this.planSubmit = false
            }
          }
          if (res['statusCode'] == "500") {
            this.tableMsg = "Error Occured while getting Table Data!"
            this.showTable = false
          }
        },
        err => console.error(err)
      )
  }

  tempEleData: any = []
  tempColData: any = []
  tempTopCol: any = []
  span: any = []
  tempColRefData: any = []
  relJson: any
  total = 0
  totalAss = 0
  values = 0

  addPlan() {
    this.router.navigate(['/timesheet/admin/planning/add']);
  }

  createJsonFormat(resJson) {
    this.tempColData = []
    this.tempColRefData = []
    this.tempEleData = []
    this.displayedColumns = []
    this.displayedTopColumns = []
    this.columns = []
    this.tempTopCol = []
    var classJson = []
    if (resJson['tableData'].length == 0) {
      this.tableMsg = "No Data Available"
      this.showTable = false
      return
    }
    this.tableMsg = ''
    this.showTable = true
    resJson['columns'] = this.changeDateFormat(resJson['columns'])
    this.tempTopCol.push({ 'columnDef': 'empName1', 'header': '', colspan: 3, class: 'mat-column-empName1' })
    for (var i = 0; i < resJson['topHeader'].length; i++) {
      if (i % 2 == 0)
        this.classFlag = 'even'
      else
        this.classFlag = 'odd'

      this.tempTopCol.push({ 'columnDef': resJson['topHeader'][i]['header'], 'header': resJson['topHeader'][i]['header'], colspan: resJson['topHeader'][i]['span'], rowspan: 1, class: "table-month-" + this.classFlag })
      var t = resJson['topHeader'][i]['header'].split(" ")[1]
      classJson.push(t + "." + resJson['topHeader'][i]['month'])

    }
    this.tempTopCol.push({ 'columnDef': 'total1', 'header': '', colspan: 2, class: 'mat-column-total1' })
    this.tempColData.push({ 'columnDef': 'empName', 'header': '' })
    this.tempColData.push({ 'columnDef': 'projectName', 'header': '' })
    this.tempColData.push({ 'columnDef': 'showAvAs', 'header': '' })
    if (Object.keys(resJson['columns']).length > 0) {
      for (var key in resJson['columns']) {
        var show_key = key.split("_")[1]
        var t = resJson['columns'][key]
        var m = t.split("/")[1]
        m = parseInt(m)
        var y = t.split("/")[2]
        y = y.split(" to")[0]
        y = parseInt(y)
        for (var p = 0; p < classJson.length; p++) {
          if (p % 2 == 0)
            this.classFlag = 'even'
          else
            this.classFlag = 'odd'
          if (m == classJson[p].split(".")[1] && y == classJson[p].split(".")[0]) {
            this.tempColData.push({ 'columnDef': 'week_' + key, 'header': "Week " + show_key, 'hoverTxt': resJson['columns'][key], class: "table-month-" + this.classFlag })
            this.tempColRefData.push({ 'columnDef': 'week_' + key, 'header': "Week " + show_key, 'hoverTxt': resJson['columns'][key], class: "table-month-" + this.classFlag })
          }
        }
      }
    }
    this.tempColData.push({ 'columnDef': 'total', 'header': 'Total' })
    this.tempColData.push({ 'columnDef': 'action', 'header': 'Action' })
    this.columns = this.tempColRefData
    this.displayedColumns = this.tempColData.map(c => c.columnDef);
    this.displayedTopColumns = this.tempTopCol.map(c => c.columnDef);
    if (resJson['tableData'].length > 0) {
      for (var i = 0; i < resJson['tableData'].length; i++) {
        for (var key in resJson['tableData'][i]) {
          if (key == "Employee_name") {
            this.tempEleData.push({ 'number': i + 1, 'empName': resJson['tableData'][i]['Employee_name'] })
          } if (key == "Project_name") {
            this.tempEleData[i]['projectName'] = (resJson['tableData'][i]['' + key])
          }
          if (key == "Employee_id") {
            this.tempEleData[i]['Employee_id'] = (resJson['tableData'][i]['' + key])
          }
          if (key == "Project_id") {
            this.tempEleData[i]['Project_id'] = (resJson['tableData'][i]['' + key])
          }

        }
      }
      for (var i = 0; i < resJson['tableData'].length; i++) {
        for (var innerkey in resJson['columns']) {
          this.tempEleData[i]['week_' + innerkey] = {}
          this.tempEleData[i]['week_' + innerkey]['Available'] = 0
          this.tempEleData[i]['week_' + innerkey]['Assigned'] = 0
          this.tempEleData[i]['week_' + innerkey]['year'] = 0
          var t = resJson['columns'][innerkey]
          var m = t.split("/")[1]
          m = parseInt(m)
          var y = t.split("/")[2]
          y = y.split(" to")[0]
          y = parseInt(y)
          for (var p = 0; p < classJson.length; p++) {
            if (p % 2 == 0)
              this.classFlag = 'even'
            else
              this.classFlag = 'odd'
            if (m == classJson[p].split(".")[1] && y == classJson[p].split(".")[0]) {
              this.tempEleData[i]['week_' + innerkey]['class'] = "table-month-" + this.classFlag
            }
          }

        }
      }
      for (var i = 0; i < resJson['tableData'].length; i++) {
        this.total = 0
        this.totalAss = 0
        for (var tableKey in resJson['tableData'][i]) {
          if (tableKey != "Employee_name" && tableKey != "Project_name" && tableKey != "Employee_id" && tableKey != "Project_id") {
            for (var innerKey in resJson['tableData'][i]['' + tableKey]) {
              if (innerKey == "available_hours") {
                if (resJson['tableData'][i]['' + tableKey]['' + innerKey] == null)
                  resJson['tableData'][i]['' + tableKey]['' + innerKey] = 0
                this.tempEleData[i]['' + tableKey]['Available'] = resJson['tableData'][i]['' + tableKey]['' + innerKey]
                this.totalAss = this.totalAss + parseInt(resJson['tableData'][i]['' + tableKey]['' + innerKey])
              }
              if (innerKey == "y_week_no")
                this.tempEleData[i]['' + tableKey]['y_week_no'] = resJson['tableData'][i]['' + tableKey]['' + innerKey]
              if (innerKey == "year")
                this.tempEleData[i]['' + tableKey]['year'] = resJson['tableData'][i]['' + tableKey]['' + innerKey]
              if (innerKey == "assigned_hours") {
                if (resJson['tableData'][i]['' + tableKey]['' + innerKey] == null)
                  resJson['tableData'][i]['' + tableKey]['' + innerKey] = 0
                this.tempEleData[i]['' + tableKey]['Assigned'] = resJson['tableData'][i]['' + tableKey]['' + innerKey]
                this.total = this.total + parseInt(resJson['tableData'][i]['' + tableKey]['' + innerKey])
              }
            }
          }
          this.tempEleData[i]['total'] = this.total
          this.tempEleData[i]['totalAss'] = this.totalAss
        }
      }
    }
    this.dataSource = new MatTableDataSource()
    this.changeDetectorRefs.detectChanges()
    this.dataSource = new MatTableDataSource(this.tempEleData as {
    }[]);
    this.dataSource.sort = this.sort;
    const sortState: Sort = { active: 'empName', direction: 'asc' };
    this.sort.active = sortState.active;
    this.sort.direction = sortState.direction;
    this.sort.sortChange.emit(sortState);
    this.dataSource.paginator = this.paginator;
    // this.changeDetectorRefs.detectChanges()
  }

  changedStartDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.endMinDate = event.value
    this.plan.start_date = event.value
    this.plan.startDate = event.value
    var check = moment(this.plan.start_date, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.plan.start_date = year + "-" + month + "-" + day
  }

  changedEndDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.plan.endDate = event.value
    this.plan.end_date = event.value
    var check = moment(this.plan.end_date, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.startMaxDate=event.value
    this.plan.end_date = year + "-" + month + "-" + day
  }

  changedDate() {
    if (typeof (this.plan.start_date) == "object") {
      this.plan.start_date = new Date(this.plan.start_date - this.plan.start_date.getTimezoneOffset() * 60000).toISOString();
      this.plan.start_date = this.plan.start_date.substring(0, 10)
    }
    if (typeof (this.plan.end_date) == "object") {
      this.plan.end_date = new Date(this.plan.end_date - this.plan.end_date.getTimezoneOffset() * 60000).toISOString();
      this.plan.end_date = this.plan.end_date.substring(0, 10)
    }
    if (this.plan.start_date > this.plan.end_date) {
      this.tableMsg = "Please select dates properly!"
      this.showTable = false
      return
    }
    this.tableMsg = ''
    this.showTable = true
    this.getAllData()
    return
  }

  sendingData = {}
  temp = []

  editPlan(ele) {
    var pid = ele.Project_id
    var uid = ele.Employee_id
    var len = this.columns.length
    if (len > 0) {
      var start = this.columns[0]['hoverTxt'].split(" to ")[0]
      var end = this.columns[len - 1]['hoverTxt'].split(" to ")[1]
      var check = moment(start, 'DD/MM/YYYY');
      var day = check.format('DD')
      var month = check.format('MM')
      var year = check.format('YYYY')
      start = year + "-" + month + "-" + day
      var check1 = moment(end, 'DD/MM/YYYY');
      var day1 = check1.format('DD')
      var month1 = check1.format('MM')
      var year1 = check1.format('YYYY')
      end = year1 + "-" + month1 + "-" + day1
    }
    this.router.navigate(['timesheet/admin/planning/edit/' + pid + "/" + uid + "/" + start + "/" + end]);

  }

  toggleAllProSelection() {
    if (this.allProSelected.selected) {
      this.userForm.controls.proType
        .patchValue([...this.pros.map(item => item.proid), 0]);
      this.plan.project_id = this.onlyProId
      if (this.selectedProjectName.length == 0 || this.selectedUserName.length == 0) {
        if (this.selectedProjectName.length == 0)
          this.tableMsg = "Please Select a  Project!"
        else
          this.tableMsg = "Please Select a User!"
        this.showTable = false
        return
      }
      this.tableMsg = ''
      this.showTable = true
      var jsonObj = {}
      // jsonObj['user_id'] = this.plan.user_id
      jsonObj['project_id'] = this.plan.project_id
      jsonObj['start_date'] = this.plan.start_date
      jsonObj['end_date'] = this.plan.end_date
      this.adminService.PlannedAllDataSubmit(jsonObj)
        .subscribe(
          res => {
            if (res['status'] == "200") {
              this.relJson = res
              this.createJsonFormat(this.relJson)
            }
            if (res['status'] == "500") {
              this.tableMsg = "Error Occured while getting Table Data!"
              this.showTable = false
            }
          },
          err => console.error(err)
        )
    } else {

      this.userForm.controls.proType.patchValue([]);
      if (this.selectedProjectName.length == 0 || this.selectedUserName.length == 0) {
        if (this.selectedProjectName.length == 0)
          this.tableMsg = "Please Select a  Project!"
        else
          this.tableMsg = "Please Select a User!"
        this.showTable = false
        return
      }
    }

  }

  toggleAllUserSelection() {
    if (this.allUserSelected.selected) {
      this.userForm.controls.userType
        .patchValue([...this.users.map(item => item.userid), 0]);
      this.plan.user_id = this.onlyuserId
      if (this.selectedProjectName.length == 0 || this.selectedUserName.length == 0) {
        if (this.selectedProjectName.length == 0)
          this.tableMsg = "Please Select a  Project!"
        else
          this.tableMsg = "Please Select a User!"
        this.showTable = false
        return
      }
      this.tableMsg = ''
      this.showTable = true
      var jsonObj = {}
      jsonObj['user_id'] = this.plan.user_id
      jsonObj['project_id'] = this.plan.project_id
      jsonObj['start_date'] = this.plan.start_date
      jsonObj['end_date'] = this.plan.end_date
      this.adminService.PlannedAllDataSubmit(jsonObj)
        .subscribe(
          res => {
            if (res['status'] == "200") {
              this.relJson = res
              this.createJsonFormat(this.relJson)
            }
            if (res['status'] == "500") {
              this.tableMsg = "Error Occured while getting Table Data!"
              this.showTable = false
            }
          },
          err => console.error(err)
        )
    } else {

      this.userForm.controls.userType.patchValue([]);
      if (this.selectedProjectName.length == 0 || this.selectedUserName.length == 0) {
        if (this.selectedProjectName.length == 0)
          this.tableMsg = "Please Select a  Project!"
        else
          this.tableMsg = "Please Select a User!"
        this.showTable = false
        return
      }
    }

  }

  changeDateFormat(arr) {
    var len = Object.keys(arr).length
    for (var i in arr) {
      var a1 = arr[i].split(" to ")[0]
      var a2 = arr[i].split(" to ")[1]
      var y = a1.split('-')[0]
      var m = a1.split('-')[1]
      var d = a1.split('-')[2]
      var y1 = a2.split('-')[0]
      var m1 = a2.split('-')[1]
      var d1 = a2.split('-')[2]
      arr[i] = d + "/" + m + "/" + y + " to " + d1 + "/" + m1 + "/" + y1
    }
    return arr
  }
}
