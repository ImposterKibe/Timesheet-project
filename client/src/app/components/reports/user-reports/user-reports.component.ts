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
  type: '',
  hours: 0,
  percent: 0
}
@Component({
  selector: 'app-user-reports',
  templateUrl: './user-reports.component.html',
  styleUrls: ['./user-reports.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class UserReportsComponent implements OnInit {
  data: any = [];
  screen: boolean;
  example: any = [];
  private chart: am4charts.XYChart;
  @HostBinding('class') classes = 'row';
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('allProSelected') private allProSelected: MatOption;
  @Input() showNav: string;
  userForm: FormGroup;
  Tabledata: Exportsheet = {
    type: '',
    hours: 0,
    percent: 0
  };
  selectedProjectName = [];
  tabledata: MatTableDataSource<Exportsheet>;
  displayedColumns: string[] = ['Details', 'Hours', 'percentOfHrs'];
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
  showBarGraph: boolean = false
  bgMsg: any
  onlyProId = []
  userLoginId = window.sessionStorage.getItem('userid');
  defaultSelectedPro: any
  startMinDate:any
  startMaxDate:any
  endMinDate:any
  endMaxDate:any
  showChangedDate: any
  selectedEndDate: any
  selectedStartDate: any
  barchartData: any = []
  firstWeek: any
  isDisabled: boolean = true;
  barchart: any
  piechart: any
  constructor(private excelService: ExcelDownloadService,
    private applicationStateService: ApplicationStateService, private zone: NgZone,
    private timesheetService: TimesheetService, private authService: AuthenticationService, private adminService: AdminService,
    private router: Router,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    private changeDetectorRefs: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.userForm = this.formBuilder.group({
      proType: ['',],
    });
    this.showTable = false
    this.bgMsg = "No Data Available!"
    this.showBarGraph = false
    this.getProjects();
    this.tableMsg = "No Data Available!"
    this.timesheet.user_id = this.userLoginId
    if (this.applicationStateService.getIsMobileResolution()) {
      this.screen = true
    }
    else
      this.screen = false
  }

  buildBarGraph() {
    this.barchart = am4core.create("barChartdiv", am4charts.XYChart);
    this.barchart.data = []
    this.barchart.responsive.enabled = true;
    let categoryAxis = this.barchart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "TypeOfHours";
    categoryAxis.renderer.grid.template.location = 0;
    let label = this.barchart.createChild(am4core.Label);
    label.horizontalCenter = "middle";
    let valueAxis = this.barchart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.min = 0;
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

  buildPieChart() {
    this.piechart = am4core.create("pieChartdiv", am4charts.PieChart3D);
    this.piechart.data = []
    this.piechart.responsive.enabled = true;
    var pieSeries = this.piechart.series.push(new am4charts.PieSeries3D());
    pieSeries.dataFields.value = "hours";
    pieSeries.dataFields.category = "type";
    pieSeries.dataFields.hidden = "hidden";
    pieSeries.ticks.template.disabled = true;
    pieSeries.alignLabels = false;
    pieSeries.labels.template.text = "{value.percent.formatNumber('#.0')}%";
    // pieSeries.labels.template.radius = am4core.percent(-40);


    pieSeries.labels.template.radius = am4core.percent(-20);
    pieSeries.labels.template.fontSize = 10
    pieSeries.labels.template.paddingTop = 10
    pieSeries.labels.template.paddingBottom = 10
    pieSeries.labels.template.fill = am4core.color("black");


    // pieSeries.labels.template.fill = am4core.color("white");
    pieSeries.colors.list = [
      am4core.color("#4EBA6F"),
      am4core.color("#2D95BF"),
      am4core.color("#955BA5"),
      am4core.color("#BF9004"),
      am4core.color("#F0C419"),
      am4core.color("#F2506E"),
      am4core.color("#f30000"),
    ];
    // pieSeries.labels.template.adapter.add("fill", function (color, target) {
    //   if (target.dataItem && (target.dataItem.values.value.percent < 20)) {
    //     return am4core.color("#000");
    //   }
    //   return color;
    // });

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
      })
  }

  getAllData() {
    if (typeof (this.timesheet.start_date) == "object") {
      this.timesheet.start_date = getDateStrFromDateObj(this.timesheet.start_date)
    }
    if (typeof (this.timesheet.end_date) == "object") {
      this.timesheet.end_date = getDateStrFromDateObj(this.timesheet.end_date)
    }
    var json = {}
    json['user_id'] = this.timesheet.user_id
    json['start_date'] = this.timesheet.start_date
    json['end_date'] = this.timesheet.end_date
    this.getUserTimesheetData(json, "initial")
    if (this.timesheet.project_id.length > 0) {
      this.getBarChartData(this.timesheet, "initial")
    }
    else {
      this.bgMsg = "No Data Available!"
      this.showBarGraph = false
    }
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
    var jsonObj = {}
    this.tabledata = new MatTableDataSource();
    if (typeof (this.timesheet.start_date) == "object") {
      this.timesheet.start_date = getDateStrFromDateObj(this.timesheet.start_date)
    }
    if (typeof (this.timesheet.end_date) == "object") {
      this.timesheet.end_date = getDateStrFromDateObj(this.timesheet.end_date)
    }
    this.timesheet.project_id = this.selectedProjectName
    if (this.timesheet.start_date > this.timesheet.end_date) {
      this.openSnackBar("Please check the Dates")
      return
    }
    if (this.onlyProId.length == 0) {
      this.showTable = false
      this.tableMsg = "No Data Available!"
      this.showBarGraph = false
      this.bgMsg = "No Data Available!"
      jsonObj['user_id'] = this.timesheet.user_id
      jsonObj['start_date'] = this.timesheet.start_date
      jsonObj['end_date'] = this.timesheet.end_date
      this.getUserTimesheetData(jsonObj, "second")
      return
    }
    if (this.selectedProjectName.length == 0) {
      this.tableMsg = "Please Select a  Project!"
      this.getBarChartData({}, "other")
      this.bgMsg = "Please Select a  Project!"
      this.showBarGraph = false
      this.showTable = false
      jsonObj['user_id'] = this.timesheet.user_id
      jsonObj['start_date'] = this.timesheet.start_date
      jsonObj['end_date'] = this.timesheet.end_date
      this.getUserTimesheetData(jsonObj, "second")
      return
    }
    this.tableMsg = ''
    this.showTable = true

    var index1 = this.timesheet.project_id.indexOf(0);
    if (index1 > -1) {
      this.timesheet.project_id.splice(index1, 1);
    }

    jsonObj['user_id'] = this.timesheet.user_id
    jsonObj['start_date'] = this.timesheet.start_date
    jsonObj['end_date'] = this.timesheet.end_date
    this.getUserTimesheetData(jsonObj, "second")

    jsonObj['project_id'] = this.timesheet.project_id
    this.getBarChartData(jsonObj, "second")
  }

  getBarChartData(jsonObj, action) {
    if (action != "other") {
      this.adminService.getUserProjectReport(jsonObj).subscribe(
        res => {
          if (res['statusCode'] == undefined || res['statusCode'] == "200") {
            if (Object.keys(res['data']).length == 0) {
              this.getBarChartData({}, "other")
              this.bgMsg = "Please Select a  Project!"
              this.showBarGraph = false
              return
            }
            this.showBarGraph = true
            this.bgMsg = ''
            res = res['data']
            this.barchartData = []
            for (var i = 0; i < Object.keys(res).length; i++) {
              this.barchartData.push({ "TypeOfHours": res[i]['type'], "Hours": parseFloat(res[i]['hours']).toFixed(2) })
            }
            this.changeBarChart(this.barchartData)
          }
          if (res['status'] == "500") {
            this.openSnackBar("Error Occured while getting Table Data!")
          }
        },
        err => console.error(err)
      );
    }
    else if (action == "other") {
      var res = { "actual": 0, "planned": 0 }
      this.barchartData = []
      for (var key in res) {
        this.barchartData.push({ "TypeOfHours": key, "Hours": res[key] })
      }
      this.changeBarChart(this.barchartData)
    }
  }

  changeBarChart(reqData) {
    if (this.barchart) {
      this.barchart.data = []
      this.barchart.data = reqData
    }
  }

  changePieChart(reqData) {
    if (this.piechart) {
      reqData = reqData.slice(1, reqData.length)
      this.piechart.data = []
      this.piechart.data = reqData
    }
  }

  getUserTimesheetData(jsonObj, action) {
    this.adminService.getUserSummaryReport(jsonObj).subscribe(
      (res: any) => {
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          if (res == undefined || Object.keys(res['data']).length == 0) {
            //console.log("No Data Available")
          }
          res = res['data']
          var tempRes = []
          var zeroFound = false
          for (var i = 0; i < Object.keys(res).length; i++) {
            if (res[i]['hours'] == 0) {
              tempRes.push({ type: res[i]['type'], hours: res[i]['hours'], hidden: true })
            }
            else if (res[i]['hours'] > 0) {
              zeroFound = true
              tempRes.push({ type: res[i]['type'], hours: res[i]['hours'], hidden: false })
            }
          }
          //console.log(zeroFound, tempRes)
          this.showTable = zeroFound
          this.createTableData(res)
          this.changePieChart(tempRes)
        }
        if (res['status'] == "500") {
          this.openSnackBar("Error Occured while getting Table Data!")
        }
      },
      err => console.log(err)
    );
  }

  createTableData(reqTableData) {
    if (reqTableData.length > 0) {
      this.tabledata = new MatTableDataSource();
      this.isDisabled = false
      this.tabledata = new MatTableDataSource(reqTableData as {
        type: '',
        hours: 0,
        percent: 0
      }[]);
    }
    if (reqTableData.length == 0) {
      this.isDisabled = true

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
        //console.log("all timesheet date", res);
        if (res['statusCode'] == undefined || res['statusCode'] == 200) {
          this.firstWeek = res['data']['thisweekMon']
          this.firstWeek = this.firstWeek.substring(0, 10)
          this.selectedStartDate = this.firstWeek
          this.timesheet.start_date = this.selectedStartDate

          this.selectedEndDate = res['data']['today']
          this.timesheet.end_date = res['data']['today']
          this.startMaxDate = res['data']['today']
          this.endMaxDate = res['data']['today']
          if (this.timesheet.project_id.length != 0) {

            this.buildBarGraph()
          }
          this.buildPieChart()
          this.getAllData()
          //console.log(this.firstWeek)
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

  selectproid(selectedProject) {
    if (this.allProSelected.selected) {
      this.allProSelected.deselect();
    }
    if (this.userForm.controls.proType.value.length == this.pros.length) {
      this.allProSelected.select();
    }
    this.timesheet.project_id = this.selectedProjectName

    if (this.onlyProId.length == 0) {
      this.showBarGraph = false
      this.bgMsg = "No Projects Available!"
      return
    }
    if (this.selectedProjectName.length == 0) {
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
        this.bgMsg = "Please select a project"
        this.showBarGraph = false
        return
      }
    }
  }

  ngOnDestroy() {
    //   this.zone.runOutsideAngular(() => {
    //     if (this.barchart) {
    //       this.barchart.dispose();
    //     }
    //     if (this.piechart) {
    //       this.piechart.dispose();
    //     }
    //   });
  }
}
