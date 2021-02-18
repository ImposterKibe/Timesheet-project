import { Component, OnInit, HostBinding, ViewChild, Input, ChangeDetectorRef, NgZone } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { TimesheetService } from 'src/app/services/timesheet.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { MatPaginator, MatTableDataSource, MatSort, MatSelect, MatOption, MatSnackBar, Sort } from '@angular/material';
import { ExcelDownloadService } from 'src/app/services/excel-download.service';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { ApplicationStateService } from 'src/app/application-state.service';
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

@Component({
  selector: 'app-available-reports',
  templateUrl: './available-reports.component.html',
  styleUrls: ['./available-reports.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class AvailableReportsComponent implements OnInit {
  classFlag;
  @Input() showNav: string;
  constructor(private excelService: ExcelDownloadService,
    private applicationStateService: ApplicationStateService, private zone: NgZone,
    private timesheetService: TimesheetService, private authService: AuthenticationService, private adminService: AdminService,
    private router: Router,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    private changeDetectorRefs: ChangeDetectorRef) { }
  timesheet: any = {
    start_date: '',
    end_date: '',
    project_id: '',
    user_id: ''
  };

  startMinDate: any
  startMaxDate: any
  endMinDate: any
  endMaxDate: any
  showChangedDate: any
  selectedEndDate: any
  selectedStartDate: any
  tabledata: MatTableDataSource<any>;
  displayedColumns = [];
  tableMsg: any
  displayedTopColumns = []
  columns = [];
  headerColumns = [];
  showTable: any
  dataSource: MatTableDataSource<any>;
  @HostBinding('class') classes = 'row';
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngOnInit() {
    this.getTodaysStartingWeek()
  }

  getTodaysStartingWeek() {
    var dateObj = new Date();
    var dt: any = getDateStrFromDateObj(dateObj)
    var id = dt
    this.timesheetService.getDateRanger(id).subscribe(
      res => {
        if (res['statusCode'] == undefined || res['statusCode'] == 200) {
          this.timesheet.start_date = res['data']['thisweekMon']
          this.timesheet.end_date = res['data']['thisWeekFri']

          this.selectedStartDate = this.timesheet.start_date
          this.selectedEndDate = this.timesheet.end_date

          this.startMinDate = this.timesheet.start_date
          this.endMinDate = this.timesheet.start_date
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

  changedStartDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.showChangedDate = event.value
    this.endMinDate = event.value
    var check = moment(event.value, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.timesheet.start_date = year + "-" + month + "-" + day
  }

  changedEndDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.startMaxDate = event.value
    var check = moment(event.value, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.timesheet.end_date = year + "-" + month + "-" + day
  }

  changedDate() {
    var jsonObj = {}
    jsonObj['start_date'] = this.timesheet.start_date
    jsonObj['end_date'] = this.timesheet.end_date
    this.adminService.getAdminAvailableReport(jsonObj).subscribe(res => {
      if (res['status'] == "200") {
        this.relJson = res
        this.createJsonFormat(this.relJson)

      } if (res['status'] == "500") {
        this.tableMsg = "Error Occured while getting Table Data!"
        this.showTable = false
      }
    })
  }
  getAllData() {
    var jsonObj = {}
    jsonObj['start_date'] = this.timesheet.start_date
    jsonObj['end_date'] = this.timesheet.end_date
    this.adminService.getAdminAvailableReport(jsonObj).subscribe(res => {
      if (res['status'] == "200") {
        this.relJson = res
        this.createJsonFormat(this.relJson)

      } if (res['status'] == "500") {
        this.tableMsg = "Error Occured while getting Table Data!"
        this.showTable = false
      }
    })
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
    this.tempTopCol.push({ 'columnDef': 'empName1', 'header': '', colspan: 2, class: 'mat-column-empName1' })
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
            this.tempEleData.push({ 'number': i + 1, 'empName': resJson['tableData'][i]['Employee_name'] })
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
          this.tempEleData[i]['week_' + innerkey]['leavesCount'] = 0
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
              if (innerKey == "leavesCount") {
                if (resJson['tableData'][i]['' + tableKey]['' + innerKey] == null)
                  resJson['tableData'][i]['' + tableKey]['' + innerKey] = 0
                this.tempEleData[i]['' + tableKey]['leavesCount'] = resJson['tableData'][i]['' + tableKey]['' + innerKey]
                this.total = this.total + parseInt(resJson['tableData'][i]['' + tableKey]['' + innerKey])
              }
            }
          }
          this.tempEleData[i]['totalLeaves'] = this.total
          this.tempEleData[i]['totalAvailable'] = this.totalAss
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

  changeAvailableData(realData: any) {
    var finalDataArr: any = [], temp1Json: any = {}, temp2Json: any = {}
    realData.filter((eachBlk: any) => {
      temp1Json = {}, temp2Json = {}

      temp1Json['Employee Name'] = eachBlk['empName']
      temp2Json['Employee Name'] = eachBlk['empName']

      temp1Json['Type'] = 'Available'
      temp2Json['Type'] = 'Leaves'

      Object.keys(eachBlk).filter((eachKey:any)=>{
        if(eachKey.split('_')[0]=='week'){
          temp1Json[eachKey]=eachBlk[eachKey]['Available']
          temp2Json[eachKey]=eachBlk[eachKey]['leavesCount']
        }
      })

      temp1Json['Total'] = eachBlk['totalAvailable']
      temp2Json['Total'] = eachBlk['totalLeaves']

      finalDataArr.push(temp1Json)
      finalDataArr.push(temp2Json)
    })
    return finalDataArr
  }

  exportAsXLSX(): void {
    this.excelService.exportAsExcelFile(this.changeAvailableData(this.dataSource.data), 'Availability Report');
  }
}
