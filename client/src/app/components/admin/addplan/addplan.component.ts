import { Component, OnInit, HostBinding, ViewChild, ChangeDetectorRef } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { MatPaginator, MatTableDataSource, MatSort, MatSelect, MatOption, MatSnackBar, Sort } from '@angular/material';
import { TimesheetService } from 'src/app/services/timesheet.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApplicationStateService } from 'src/app/application-state.service';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { getDateStrFromDateObj } from '../../../helper/clientCommonFunction'
import * as _moment from 'moment';
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

@Component({
  selector: 'app-addplan',
  templateUrl: './addplan.component.html',
  styleUrls: ['./addplan.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})

export class AddplanComponent {

  classFlag;
  @HostBinding('class') classes = 'row';
  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  show: boolean = false;
  planSubmit: boolean = false;
  showEdit: boolean = false;
  showForm: boolean = false;
  planForm: FormGroup;
  submitted = false;
  total = 0
  totalAss = 0
  values = 0
  firstWeek: any
  columns = [
  ];
  dataSource: MatTableDataSource<any>;
  displayedColumns = []
  displayedTopColumns = []
  projectsList: any
  nowDate: any
  showChangedDate: any
  startMinDate: any
  startMaxDate: any
  endMinDate: any
  endMaxDate: any
  users: any
  plan: any = {
    user_id: '',
    project_id: '',
    start_Date: '',
    end_Date: ''
  };
  screen: boolean = false;
  roleid = window.sessionStorage.getItem('role');
  UserId = window.sessionStorage.getItem('userid');
  constructor(private adminService: AdminService, private timesheetService: TimesheetService,
    private authService: AuthenticationService,
    private formBuilder: FormBuilder,
    private router: Router,
    private changeDetectorRefs: ChangeDetectorRef,
    private applicationStateService: ApplicationStateService,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit() {
    this.projectsList = []

    const params = this.activatedRoute.snapshot.params;
    if (Object.keys(params).length > 0) {
      this.planSubmit = true
    }
    this.getTodaysStartingWeek()
    this.users = []
    this.planForm = this.formBuilder.group({
      user_id: ['', Validators.required],
      project_id: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
    if (this.applicationStateService.getIsMobileResolution()) {
      this.screen = true
    }
    else
      this.screen = false

  }

  checkRouting() {
    const params = this.activatedRoute.snapshot.params;
    if (Object.keys(params).length == 0) {
      // this.nowDate = new Date()
      // this.showChangedDate = new Date()
      this.planSubmit = false
      this.getProjects();

    }
    if (Object.keys(params).length > 0 && this.roleid == '1') {
      var dts = new Date().toISOString()
      dts = dts.substring(0, 10)
      this.planSubmit = true
      this.plan.user_id = [params.uid]
      this.plan.project_id = parseInt(params.pid)
      this.plan.startDate = params.st
      this.plan.endDate = params.ed
      var json = {}
      json['user_id'] = [params.uid]
      json['project_id'] = [parseInt(params.pid)]
      json['start_date'] = params.st
      json['end_date'] = params.ed
      this.plan.start_Date = params.st
      this.plan.end_Date = params.ed
      if (this.plan.endDate < dts)
        this.showEdit = true
      this.adminService.PlannedDataSubmit(json)
        .subscribe(
          res => {

            this.getProjects();
            if (res['statusCode'] == undefined || res['statusCode'] == "200") {
              this.relJson = res
              this.show = true;
              this.createJsonFormat(this.relJson)
            }
            if (res['statusCode'] == "500") {
              this.openSnackBar("Error Occured while getting Table Data!", 2000)
            }
          },
          err => console.error(err)
        )
    }
    if (Object.keys(params).length > 0 && this.roleid == '2') {
      var User_id = window.sessionStorage.getItem('userid')
      this.adminService.getverifiedPro(User_id, params.pid)
        .subscribe(
          res => {
            if (res['statusCode'] == "500") {
              this.openSnackBar("Error Occured while getting Table Data!", 2000)
            }
            if (res['statusCode'] == "200") {
              this.getProjects();
              if (res['data'] == 1) {
                var dts = new Date().toISOString()
                dts = dts.substring(0, 10)
                this.planSubmit = true
                this.plan.user_id = [params.uid]
                this.plan.project_id = parseInt(params.pid)
                this.plan.startDate = params.st
                this.plan.endDate = params.ed
                this.plan.start_Date = params.st
                this.plan.end_Date = params.ed
                var json = {}
                json['user_id'] = [params.uid]
                json['project_id'] = [parseInt(params.pid)]
                json['start_date'] = params.st
                json['end_date'] = params.ed
                if (this.plan.endDate < dts)
                  this.showEdit = true
                this.adminService.PlannedDataSubmit(json)
                  .subscribe(
                    res => {
                      if (res['statusCode'] == undefined || res['statusCode'] == "200") {
                        this.relJson = res
                        this.show = true;
                        this.createJsonFormat(this.relJson)
                      }
                      if (res['statusCode'] == "500") {
                        this.openSnackBar("Error Occured while getting Table Data!", 2000)
                      }
                    },
                    err => console.error(err)
                  )
              }
              if (res['data'] == 0) {
                this.router.navigate(['/timesheet/admin/planning/add']);
              }
            }

          },
          err => console.error(err)
        )
    }
  }
  openSnackBar(message, dur) {
    this.snackBar.open(message, "Close", {
      duration: dur,
    });
  }

  changedStartDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.endMinDate = event.value
    this.plan.startDate = event.value
    this.planSubmit = false
    var check = moment(this.plan.startDate, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.plan.start_Date = year + "-" + month + "-" + day
  }

  changedEndDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.plan.endDate = event.value
    this.planSubmit = false
    var check = moment(this.plan.endDate, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.plan.end_Date = year + "-" + month + "-" + day
    this.startMaxDate = event.value
  }

  getProjects() {
    var jsonObj: any = {}
    jsonObj["user_id"] = this.UserId
    jsonObj["action"] = "planning"
    this.authService.getAllProjForReportOrPlanning(jsonObj).subscribe(
      (res: any) => {
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          res = res['data']
          this.getusers();
          res.filter((eachBlk: any, index: any) => {
            if (eachBlk["project_code"].split("-")[0] == 'p') {
              res[index]["value"] = eachBlk["project_code_old"]
            }
            else {
              res[index]["value"] = eachBlk["project_code"]
            }

            if (index == res.length - 1)
              this.projectsList = res
          })

          if (this.projectsList.length == 0) {
            this.openSnackBar("No Projects Available", 1000)
            setTimeout(() => {
              this.router.navigate(['/timesheet/admin/planning']);
            }, 2010)
          }
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

  get f() { return this.planForm.controls; }

  getusers() {
    this.adminService.getusers().subscribe(
      res => {
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          res = res['data']
          // this.getTodaysStartingWeek()
          this.users = res
          if (this.users.length == 0) {
            this.openSnackBar("No Users Available", 1000)
            setTimeout(() => {
              this.router.navigate(['/timesheet/admin/planning']);
            }, 2010)
          }
          if (res['statusCode'] == "401") {
            localStorage.clear();
            this.router.navigate(['/login']);
          }
        }
      },
      err => console.error(err)
    );
  }

  planningSubmit() {
    this.submitted = true;
    if (this.planForm.invalid) {
      return;
    }
    else {
      if (this.plan.start_Date == "")
        this.openSnackBar("Please Choose Start Date", 2000)
      if (this.plan.end_Date == "")
        this.openSnackBar("Please Choose End Date", 2000)
      var json = {}
      json['user_id'] = this.plan.user_id
      json['project_id'] = [this.plan.project_id]
      json['start_date'] = this.plan.start_Date
      json['end_date'] = this.plan.end_Date
      this.adminService.PlannedDataSubmit(json)
        .subscribe(
          res => {
            if (res['status'] == "200") {
              this.relJson = res
              this.show = true;
              this.createJsonFormat(this.relJson)
              this.planSubmit = true

            }
            if (res['status'] == "500") {
              this.openSnackBar("Error Occured while getting Table Data!", 2000)
            }
            if (res['statusCode'] == "401") {
              localStorage.clear();
              this.router.navigate(['/login']);
            }
          },
          err => console.error(err)
        )
    }
  }


  tempEleData: any = []
  tempColData: any = []
  tempColRefData: any = []
  tempTopCol: any = []
  relJson: any
  showTable: any
  tableMsg: any

  createJsonFormat(resJson) {

    this.dataSource = new MatTableDataSource();
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
    this.tempTopCol.push({ 'columnDef': 'total1', 'header': '', colspan: 1, class: 'mat-column-total1' })
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
    this.columns = this.tempColRefData
    this.displayedColumns = this.tempColData.map(c => c.columnDef);
    this.displayedTopColumns = this.tempTopCol.map(c => c.columnDef);
    if (resJson['tableData'].length > 0) {
      for (var i = 0; i < resJson['tableData'].length; i++) {
        for (var key in resJson['tableData'][i]) {
          if (key == "Employee_name") {
            this.tempEleData.push({ 'number': i + 1, 'empName': resJson['tableData'][i]['Employee_name'], 'empId': resJson['tableData'][i]['Employee_id'] })
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
          this.tempEleData[i]['week_' + innerkey]['max'] = 0
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
                this.tempEleData[i]['' + tableKey]['max'] += resJson['tableData'][i]['' + tableKey]['' + innerKey]
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
                this.tempEleData[i]['' + tableKey]['max'] += resJson['tableData'][i]['' + tableKey]['' + innerKey]
                this.total = this.total + parseInt(resJson['tableData'][i]['' + tableKey]['' + innerKey])
              }
            }
          }
          this.tempEleData[i]['total'] = this.total
          this.tempEleData[i]['totalAss'] = this.totalAss
        }
      }
    }
    this.changeDetectorRefs.detectChanges()
    this.dataSource = new MatTableDataSource(this.tempEleData as {
    }[]);
    this.dataSource.sort = this.sort;
    var sortState: Sort = { active: 'empName', direction: 'asc' };
    this.sort.active = sortState.active;
    this.sort.direction = sortState.direction;
    this.sort.sortChange.emit(sortState);
    this.dataSource.paginator = this.paginator;
    this.changeDetectorRefs.detectChanges()
  }
  sendingData = {}
  temp = []

  savePlanning() {
    this.sendingData = {}
    this.sendingData['project_id'] = this.plan.project_id
    this.sendingData['tableInfo'] = []
    this.sendingData['start_date'] = this.plan.start_Date
    this.sendingData['end_date'] = this.plan.end_Date
    this.temp = []
    this.temp = this.dataSource.data
    if (this.temp.length > 0) {
      for (var i = 0; i < this.temp.length; i++) {
        this.sendingData['tableInfo'][i] = {}
        this.sendingData['tableInfo'][i]['y_week_no'] = []
        this.sendingData['tableInfo'][i]['assigned_hours'] = []
        this.sendingData['tableInfo'][i]['available_hours'] = []
        this.sendingData['tableInfo'][i]['year'] = []
        for (var key in this.temp[i]) {
          if (key == "empId") {
            this.sendingData['tableInfo'][i]['user_id'] = this.temp[i][key]
          }
          else if (key != "empName" && key != "empId") {
            for (var innerKey in this.temp[i]['' + key]) {
              if (innerKey == "y_week_no")
                this.sendingData['tableInfo'][i]['' + innerKey].push(this.temp[i]['' + key]['' + innerKey])
              if (innerKey == "year")
                this.sendingData['tableInfo'][i]['' + innerKey].push(this.temp[i]['' + key]['' + innerKey])
              if (innerKey == "Available")
                this.sendingData['tableInfo'][i]['available_hours'].push(this.temp[i]['' + key]['' + innerKey])
              if (innerKey == "Assigned") {
                this.sendingData['tableInfo'][i]['assigned_hours'].push(this.temp[i]['' + key]['' + innerKey])
              }
            }
          }
        }
      }
    }
    this.adminService.savePlannedData(this.sendingData['project_id'], this.sendingData)
      .subscribe(
        res => {
          if (res['status'] == "200") {
            this.openSnackBar("Planning is saved successfully", 5000)
            setTimeout(() => {
              this.router.navigate(['timesheet/admin/planning']);
            }, 500)
          }
          if (res['status'] == "500") {
            this.openSnackBar("Error occured while Saving Plan", 5000)
          }
          if (res['statusCode'] == "401") {
            localStorage.clear();
            this.router.navigate(['/login']);
          }
        },
        err => console.error(err)
      )
  }

  assignedChange(event: any, req_row, req_col, max) {
    req_row = parseInt(req_row) - 1
    if (event.target.value > max || !event.target.value) {
      event.target.value = 0
    }
    if (event.target.value < 0) {
      event.target.value = 0
    }
    this.tempEleData['' + req_row]['' + req_col]['Assigned'] = parseInt(event.target.value)
    if (this.tempEleData.length > 0) {
      this.total = 0
      for (var key in this.tempEleData['' + req_row]) {
        if (key != "Employee_name") {
          for (var innerKey in this.tempEleData['' + req_row]['' + key]) {
            if (innerKey == "Assigned") {
              if (isNaN(this.tempEleData['' + req_row]['' + key]['' + innerKey]))
                this.total = this.total + 0
              else
                this.total = this.total + parseInt(this.tempEleData['' + req_row]['' + key]['' + innerKey])
            }
          }
        }
        this.tempEleData['' + req_row]['total'] = this.total
      }

    }
    this.dataSource.data = this.tempEleData
  }

  selectuserid(selectUser) {
    this.planSubmit = false
  }

  selectProid(selectUser) {
    this.planSubmit = false
  }

  getTodaysStartingWeek() {
    var dateObj = new Date();
    var id: any = getDateStrFromDateObj(dateObj)
    this.timesheetService.getDateRanger(id).subscribe(
      res => {
        if (res['statusCode'] == undefined || res['statusCode'] == 200) {
          this.checkRouting()
          this.firstWeek = res['data']['thisweekMon']
          this.firstWeek = this.firstWeek.substring(0, 10)
          this.startMinDate = res['data']['today']
          this.endMinDate = res['data']['today']
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

  isSortingDisabled(col) {
    var a = col.hoverTxt.split(" to ")[1]
    var d = a.split('/')[0]
    var m = a.split('/')[1]
    var y = a.split('/')[2]
    var check = y + "-" + m + "-" + d
    var st = this.firstWeek
    var end = new Date("" + check).toISOString().split("T")[0]
    // console.log("isSortingDisabled ",st,end,check)
    if (st >= end) {
      return true
    }
    else {
      return false
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
