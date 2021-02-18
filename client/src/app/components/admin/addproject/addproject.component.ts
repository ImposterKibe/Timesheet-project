import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ApplicationStateService } from 'src/app/application-state.service';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
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
@Component({
  selector: 'app-addproject',
  templateUrl: './addproject.component.html',
  styleUrls: ['./addproject.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class AddprojectComponent implements OnInit {
  projectForm: FormGroup;
  project: any = {
    project_code: '',
    project_name: '',
    description: '',
    created_date: '',
    updated_date: '',
    start_date: '',
    end_date: '',
    planned_start_date: '',
    planned_end_date: '',
    is_billable: false
  };
  submitted = false;
  edit: boolean = false;
  date: any;
  selectedStartDate: any
  selectedEndDate: any
  projManArr: any
  customerCodeArr: any
  customerCodeResArr: any
  projCatgArr: any
  proTypeArr: any
  proTypeResArr: any
  screen: boolean = false;
  constructor(private adminService: AdminService,
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private applicationStateService: ApplicationStateService,
    private snackBar: MatSnackBar) {
    this.getServerTime();
    this.projManArr = []
    this.getALLProjManagers()
  }

  openSnackBar(message, dur) {
    this.snackBar.open(message, "Close", {
      duration: dur,
    });
  }

  ngOnInit() {
    this.projectForm = this.formBuilder.group({
      serviceLine: ['', Validators.required],
      project_code: ['', Validators.required],
      projectname: ['', Validators.required],
      projectCatg: ['', Validators.required],
      description: ['',],
      bussinessUnit: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      customerId: ['', Validators.required],
      BU_code: ['', Validators.required],
      customerCode: ['', Validators.required],
      serviceLineType: ['', Validators.required],
    });
    if (this.applicationStateService.getIsMobileResolution()) {
      this.screen = true
    }
    else
      this.screen = false
    const params = this.activatedRoute.snapshot.params;
    if (params.id) {
      delete this.project.created_date;
      delete this.project.updated_date;
      this.getProjCatg()
      this.adminService.getProject(params.id)
        .subscribe(
          res => {
            if (res['statusCode'] == undefined || res['statusCode'] == "200") {
              res = res['data']
              this.project = res;
              this.edit = true;
            }
            if (res['statusCode'] == "401") {
              localStorage.clear();
              this.router.navigate(['/login']);
            }
          },
          err => console.error(err)
        )
    }
    else {
      this.getProTypes();
      this.getProjCatg()
      this.customerCodeArr = []
      this.getAllCustomerNames()
    }
  }

  getProjCatg() {
    this.adminService.getAllProjCatg().subscribe(
      res => {
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          res = res['data']
          var len = Object.keys(res).length
          this.projCatgArr = []
          for (var i = 0; i < len; i++) {
            this.projCatgArr[i] = ({ "id": res[i]['cat_id'], "category_name": res[i]['p_catg'] })
          }
          if (this.projCatgArr.length == 0) {
            this.openSnackBar("No Project category Available", 2000)
            setTimeout(() => {
              this.router.navigate(['/timesheet/admin/projects']);
            }, 2010)
          }
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      err => console.log(err)
    );
  }

  getAllCustomerNames() {
    this.adminService.getAllCustomerNames().subscribe(
      res => {
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          res = res['data']
          var len = Object.keys(res).length
          this.customerCodeArr = []
          for (var i = 0; i < len; i++) {
            this.customerCodeArr[i] = ({ "id": res[i]['id'], "customer_name": res[i]['name'] })
          }
          this.customerCodeResArr = res
          if (this.customerCodeArr.length == 0) {
            this.openSnackBar("No Customers Available", 2000)
            setTimeout(() => {
              this.router.navigate(['/timesheet/admin/projects']);
            }, 2010)
          }
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      err => console.log(err)
    );
  }

  getALLProjManagers() {
    this.adminService.getProjectManagers().subscribe(
      res => {
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          res = res['data']
          this.projManArr = res
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      err => console.log(err)
    );
  }

  get f() { return this.projectForm.controls; }

  changedStartDate(type: string, event: MatDatepickerInputEvent<Date>) {
    //console.log("event", event.value)
    this.project.start_date = event.value
    var check = moment(this.project.start_date, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.project.planned_start_date = year + "-" + month + "-" + day
  }

  changedEndDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.project.end_date = event.value
    var check = moment(this.project.end_date, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.project.planned_end_date = year + "-" + month + "-" + day
  }

  saveNewProject() {
    this.submitted = true;
    if (this.projectForm.invalid) {
      return;
    }
    else {
      delete this.project.end_date;
      delete this.project.start_date;
      this.adminService.saveNewProject(this.project)
        .subscribe(
          res => {
            if (res['statusCode'] == undefined || res['statusCode'] == "200") {
              this.openSnackBar("Project is created successfully", 5000)
              setTimeout(() => {
                this.router.navigate(['/timesheet/admin/projects']);
              }, 500)
            }
            if (res['statusCode'] == undefined || res['statusCode'] == "501") {
              this.openSnackBar(res['message'], 5000)
            }
            if (res['statusCode'] == undefined || res['statusCode'] == "500") {
              this.openSnackBar("Error occured while creating Project", 5000)
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

  changesForUpdateProject() {
    this.projectForm.controls.serviceLine.clearValidators();
    this.projectForm.controls.serviceLine.setErrors(null);
    this.projectForm.controls.serviceLine.setValidators(null);
    this.projectForm.controls.project_code.clearValidators();
    this.projectForm.controls.project_code.setErrors(null);
    this.projectForm.controls.project_code.setValidators(null);
    this.projectForm.controls.bussinessUnit.clearValidators();
    this.projectForm.controls.bussinessUnit.setErrors(null);
    this.projectForm.controls.bussinessUnit.setValidators(null);
    this.projectForm.controls.start_date.clearValidators();
    this.projectForm.controls.start_date.setErrors(null);
    this.projectForm.controls.start_date.setValidators(null);
    this.projectForm.controls.end_date.clearValidators();
    this.projectForm.controls.end_date.setErrors(null);
    this.projectForm.controls.end_date.setValidators(null);
    this.projectForm.controls.customerId.clearValidators();
    this.projectForm.controls.customerId.setErrors(null);
    this.projectForm.controls.customerId.setValidators(null);
    this.projectForm.controls.BU_code.clearValidators();
    this.projectForm.controls.BU_code.setErrors(null);
    this.projectForm.controls.BU_code.setValidators(null);
    this.projectForm.controls.customerCode.clearValidators();
    this.projectForm.controls.customerCode.setErrors(null);
    this.projectForm.controls.customerCode.setValidators(null);
    this.projectForm.controls.serviceLineType.clearValidators();
    this.projectForm.controls.serviceLineType.setErrors(null);
    this.projectForm.controls.serviceLineType.setValidators(null);

    delete this.project.id
    delete this.project.created_date;
    delete this.project.updated_date;
    delete this.project.end_date;
    delete this.project.start_date;
    delete this.project.planned_start_date;
    delete this.project.planned_end_date;
    delete this.project.actual_start_date;
    delete this.project.actual_end_date;

  }

  updateProject() {
    this.submitted = true;
    var id = this.project.id
    this.changesForUpdateProject();
    if (this.projectForm.invalid) {
      return;
    }
    else {
      this.project.updated_date = this.date

      this.adminService.updateProject(id, this.project)
        .subscribe(
          res => {
            this.project.id = id
            if (res['statusCode'] == "200") {
              this.openSnackBar(res["message"], 5000)
              setTimeout(() => {
                this.router.navigate(['/timesheet/admin/projects']);
              }, 500)
            }
            if (res['statusCode'] == "501") {
              this.openSnackBar("Please check the entered data", 5000)
            }
            if (res['statusCode'] == "500") {
              this.openSnackBar("Error occured while creating User", 5000)
            }
          },
          err => console.error(err)
        )
    }
  }

  getServerTime() {
    this.date = new Date();
    this.project.created_date = new Date()
    this.project.updated_date = new Date();
    return
  }

  changeBuCode(givenId, givenPtype) {
    if (givenId != undefined) {
      for (var i = 0; i < this.customerCodeResArr.length; i++) {
        if (givenId == this.customerCodeResArr[i]['id']) {
          this.project.BU_code = this.customerCodeResArr[i]['BU_code']
          this.project.customer_code = this.customerCodeResArr[i]['customer_code']
          break;
        }
      }
    }
    if (givenPtype != undefined) {
      for (var i = 0; i < this.proTypeArr.length; i++) {
        if (givenPtype == this.proTypeArr[i]['id']) {
          this.project.p_type = this.proTypeArr[i]['p_type']
          break;
        }
      }
    }
    if (givenId != undefined && givenPtype != undefined) {
      var jsonObj = { "proId": givenId, "Bid": givenPtype }
      this.adminService.getLatestProiD(givenId, givenPtype).subscribe(
        res => {
          if (res['statusCode'] == "401") {
            localStorage.clear();
            this.router.navigate(['/login']);
          }
          else {
            res = res['data']
            var len = Object.keys(res).length + 1
            if (len <= 9) {
              var grand = "0" + len
            }
            else
              var grand = "" + len
            this.project.project_code = grand
          }
        },
        err => console.log(err)
      );
    }
  }

  getProTypes() {
    this.adminService.getProTypes().subscribe(
      res => {
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          res = res['data']
          //console.log(res)
          this.proTypeResArr = res
          this.proTypeArr = res
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      err => console.log(err)
    );
  }

  checkProCre(event: any, action) {
    if (event.key >= 'a' && event.key <= 'z') {
      return true;
    }
    else if (event.key >= 'A' && event.key <= 'Z') {
      return true;
    }
    if (action == "name") {
      if (event.which == 32) {
        return true;
      }
      else {
        event.preventDefault()
        return false
      }
    }
    if (action == "id") {
      if (event.which >= 48 && event.which <= 57) {
        return true;
      }
      else {
        event.preventDefault()
        return false
      }
    }
    else {
      event.preventDefault()
      return false
    }
  }

}

