import { Component, OnInit, HostBinding, ViewChild, Input, ChangeDetectorRef, NgZone } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { TimesheetService } from 'src/app/services/timesheet.service';
import { MatPaginator, MatTableDataSource, MatSort, MatSelect, MatOption, MatSnackBar, Sort } from '@angular/material';
import { ExcelDownloadService } from 'src/app/services/excel-download.service';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { ApplicationStateService } from 'src/app/application-state.service';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import * as _moment from 'moment';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { getDateStrFromDateObj } from '../../../helper/clientCommonFunction'
am4core.useTheme(am4themes_animated);

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


export interface pro {
  value: string;
  proid: any

}

export interface Exportsheet {
  user_name: '',
  planned: 0,
  actual: 0,
  variance: 0
}
@Component({
  selector: 'app-manager-reports',
  templateUrl: './manager-reports.component.html',
  styleUrls: ['./manager-reports.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class ManagerReportsComponent implements OnInit {

  data: any = [];
  screen: boolean;
  example: any = [];
  private chart: am4charts.XYChart;
  @HostBinding('class') classes = 'row';
  @Input() showNav: string;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('allProSelected') private allProSelected: MatOption;
  userForm: FormGroup;

  Tabledata: Exportsheet = {
    user_name: '',
    planned: 0,
    actual: 0,
    variance: 0
  };
  selectedProjectName = [];
  tabledata: MatTableDataSource<Exportsheet>;
  displayedColumns: string[] = ['user_name', 'planned', 'actual', 'variance'];
  message: string;
  timesheet: any = {
    start_date: '',
    end_date: '',
    project_id: '',
    user_id: ''
  };
  pros: pro[] = [
  ];
  proid: any = []
  userid: any = []
  tableMsg: any
  showTable: boolean = false
  onlyProId = []
  userLoginId = window.sessionStorage.getItem('userid');
  roleid = window.sessionStorage.getItem('role');
  defaultSelectedPro: any
  selectedEndDate: any
  selectedStartDate: any
  
  startMinDate:any
  startMaxDate:any
  endMinDate:any
  endMaxDate:any
  barchartData: any = []
  firstWeek: any
  isDisabled: boolean = true;
  barchart: any
  showBarGraph: boolean = false
  bgMsg: any
  constructor(private excelService: ExcelDownloadService,
    private applicationStateService: ApplicationStateService, private zone: NgZone,
    private timesheetService: TimesheetService, private adminService: AdminService, private authService: AuthenticationService,
    private router: Router,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    private changeDetectorRefs: ChangeDetectorRef) { }

  ngOnInit() {
    this.userForm = this.formBuilder.group({
      proType: ['',],
    });
    this.bgMsg = "No Data Available!"
    this.showBarGraph = false
    this.tabledata = new MatTableDataSource();
    this.getProjects();
    this.tableMsg = "No Data Available!"
    this.timesheet.user_id = this.userLoginId
    if (this.applicationStateService.getIsMobileResolution()) {
      this.screen = true
    }
    else
      this.screen = false
  }

  exportAsXLSX(state: any): void {
    if (state == false)
      this.excelService.exportAsExcelFile(this.tabledata.data, 'Timesheet');
  }

  getProjects() {
    var id = this.userLoginId
    var jsonObj: any = {}
    jsonObj["user_id"] = id
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

  getAllData() {
    this.tabledata = new MatTableDataSource();
    if (typeof (this.timesheet.start_date) == "object") {
      this.timesheet.start_date = getDateStrFromDateObj(this.timesheet.start_date)
    }
    if (typeof (this.timesheet.end_date) == "object") {
      this.timesheet.end_date = getDateStrFromDateObj(this.timesheet.end_date)
    }
    if (this.timesheet.project_id.length > 0)
      this.getBarChartData(this.timesheet, "initial")
    else if (this.timesheet.project_id.length == 0) {
      this.bgMsg = "No Data Available!"
      this.showBarGraph = false
    }
  }

  getBarChartData(jsonObj, action) {
    if (action != "other") {
      this.adminService.getManagerReport(jsonObj).subscribe(
        res => {
          if (res['statusCode'] == "401") {
            this.getBarChartData({}, "other")
            this.bgMsg = "No Data Available!"
            this.showBarGraph = false
          }
          if (res['statusCode'] == "200") {
            if (res == undefined || Object.keys(res['data']).length == 0) {
              this.getBarChartData({}, "other")
              this.bgMsg = "Please Select a  Project!"
              this.showBarGraph = false
            }
            this.showBarGraph = true
            this.bgMsg = ''
            res = res['data']
            this.barchartData = []
            for (var i = 0; i < Object.keys(res['chart']).length; i++) {
              this.barchartData.push({ "TypeOfHours": res['chart'][i]['type'], "Hours": parseFloat(res['chart'][i]['hours']).toFixed(2) })
            }
            this.changeBarChart(this.barchartData)
            this.createTableData(res['table'])
          }
          if (res['status'] == "500") {
            this.openSnackBar("Error Occured while getting Table Data!")
          }
        },
        err => console.log(err)
      );
    } else if (action == "other") {
      var res = { "actual": 0, "planned": 0 }
      this.barchartData = []
      for (var key in res) {
        this.barchartData.push({ "TypeOfHours": key, "Hours": res[key] })
      }
      this.changeBarChart(this.barchartData)
    }
  }

  buildBarGraph() {
    this.barchart = am4core.create("barChartdiv", am4charts.XYChart);
    this.barchart.data = []
    let categoryAxis = this.barchart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "TypeOfHours";
    categoryAxis.renderer.grid.template.location = 0;
    let label = this.barchart.createChild(am4core.Label);
    label.horizontalCenter = "middle";
    let valueAxis = this.barchart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.min = 0;
    this.barchart.responsive.enabled = true;
    let series = this.barchart.series.push(new am4charts.ColumnSeries());
    series.dataFields.valueY = "Hours";
    series.dataFields.categoryX = "TypeOfHours";
    series.name = "Hours";
    let valueLabel = series.bullets.push(new am4charts.LabelBullet());
    valueLabel.label.text = "{Hours}";
    valueLabel.label.dy = -5;
    series.columns.template.tooltipText = "{categoryX}: [bold]{valueY}[/]";
    series.columns.template.fillOpacity = .8;
    series.columns.template.width = am4core.percent(20);
    let columnTemplate = series.columns.template;
    columnTemplate.strokeWidth = 2;
    columnTemplate.strokeOpacity = 1;
  }

  changeBarChart(reqData) {
    this.barchart.data = []
    this.barchart.data = reqData
  }

  createTableData(reqTableData) {
    this.tabledata = new MatTableDataSource();
    if (reqTableData.length > 0) {
      this.tabledata = new MatTableDataSource();
      this.isDisabled = false
      this.showTable = true
      this.tableMsg = ""
      this.tabledata = new MatTableDataSource(reqTableData as {
        user_name: '',
        planned: 0,
        actual: 0,
        variance: 0
      }[]);
      if (!this.changeDetectorRefs['destroyed']) {
        this.changeDetectorRefs.detectChanges()
      }
      this.tabledata.sort = this.sort
      const sortState: Sort = { active: 'user_name', direction: 'asc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
      this.tabledata.paginator = this.paginator;
    }
    if (reqTableData.length == 0) {
      this.isDisabled = true
      this.showTable = false
      this.tableMsg = "No Data Available"
    }
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
          this.timesheet.start_date = this.selectedStartDate
          this.selectedEndDate = res['data']['today']
          this.timesheet.end_date = res['data']['today']
          this.startMaxDate = res['data']['today']
          this.endMaxDate = res['data']['today']
          if (this.timesheet.project_id.length != 0)
            this.buildBarGraph()
          this.getAllData()
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      err => console.log(err)
    );
    return
  }

  changedStartDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.endMinDate = event.value
    var check = moment(event.value, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.timesheet.start_date = year + "-" + month + "-" + day
  }

  changedEndDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.startMaxDate=event.value
    var check = moment(event.value, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.timesheet.end_date = year + "-" + month + "-" + day
  }

  changedDate() {
    var jsonObj = { user_id: "", project_id: [], start_date: "", end_date: "" }
    this.tabledata = new MatTableDataSource();
    this.tabledata.sort = this.sort
    if (typeof (this.timesheet.start_date) == "object") {
      this.timesheet.start_date = getDateStrFromDateObj(this.timesheet.start_date)
    }
    if (typeof (this.timesheet.end_date) == "object") {
      this.timesheet.end_date = getDateStrFromDateObj(this.timesheet.end_date)
    }
    this.timesheet.project_id = this.selectedProjectName
    if (this.timesheet.start_date > this.timesheet.end_date) {
      this.openSnackBar("Please check the Dates")
      this.isDisabled = true
      return
    }
    if (this.onlyProId.length == 0) {
      this.showTable = false
      this.tableMsg = "No Data Available!"
      this.showBarGraph = false
      this.bgMsg = "No Data Available!"
      return
    }
    if (this.selectedProjectName.length == 0) {
      this.tableMsg = "Please Select a  Project!"
      this.getBarChartData({}, "other")
      this.bgMsg = "Please Select a  Project!"
      this.showBarGraph = false
      this.showTable = false
      return
    }
    this.tableMsg = ''
    this.showTable = true
    var index1 = this.timesheet.project_id.indexOf(0);
    if (index1 > -1) {
      this.timesheet.project_id.splice(index1, 1);
    }
    jsonObj['project_id'] = this.timesheet.project_id
    jsonObj['user_id'] = this.timesheet.user_id
    jsonObj['start_date'] = this.timesheet.start_date
    jsonObj['end_date'] = this.timesheet.end_date
    this.getBarChartData(jsonObj, "second")
  }

  selectproid(selectedProject) {
    if (this.allProSelected.selected) {
      this.allProSelected.deselect();
    }
    if (this.userForm.controls.proType.value.length == this.pros.length) {
      this.allProSelected.select();
    }
    this.timesheet.project_id = this.selectedProjectName
    if (this.onlyProId.length == 0) {
      this.getBarChartData({}, "other")
      this.showBarGraph = false
      this.bgMsg = "No Projects Available!"
      return
    }
    if (this.selectedProjectName.length == 0) {
      this.getBarChartData({}, "other")
      this.bgMsg = "Please Select a  Project!"
      this.showBarGraph = false
      return
    }
    this.bgMsg = ''
    this.showBarGraph = true
    var index1 = this.timesheet.project_id.indexOf(0);
    if (index1 > -1) {
      this.timesheet.project_id.splice(index1, 1);
    }
    var jsonObj = {}
    jsonObj['project_id'] = this.selectedProjectName
    jsonObj['user_id'] = this.timesheet.user_id
    jsonObj['start_date'] = this.timesheet.start_date
    jsonObj['end_date'] = this.timesheet.end_date
    this.getBarChartData(jsonObj, "second")
  }

  toggleAllProSelection() {
    if (this.allProSelected.selected) {
      this.userForm.controls.proType
        .patchValue([...this.pros.map(item => item.proid), 0]);
      this.timesheet.project_id = this.onlyProId
      if (this.onlyProId.length == 0) {
        this.bgMsg = "No Data Available!"
        this.showBarGraph = false
        return
      }
      this.bgMsg = ""
      this.showBarGraph = true
      var jsonObj = {}
      jsonObj['project_id'] = this.onlyProId
      jsonObj['user_id'] = this.timesheet.user_id
      jsonObj['start_date'] = this.timesheet.start_date
      jsonObj['end_date'] = this.timesheet.end_date
      this.getBarChartData(jsonObj, "second")
      return;
    } else {
      this.userForm.controls.proType.patchValue([]);
      if (this.onlyProId.length == 0) {
        this.bgMsg = "No Data Available!"
        this.showBarGraph = false
        return
      }
      if (this.selectedProjectName.length == 0) {
        this.getBarChartData({}, "other")
        this.bgMsg = "Please Select a  Project!"
        this.showBarGraph = false
        return
      }
    }
  }

  ngOnDestroy() {
    // this.zone.runOutsideAngular(() => {
    //   if (this.barchart) {
    //     this.barchart.dispose();
    //   }
    // });
  }
}
