import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';

import { getDateStrFromDateObj } from '../../../helper/clientCommonFunction'
export interface role {
  value: string,
  roleid: number
}
@Component({
  selector: 'app-adduser',
  templateUrl: './adduser.component.html',
  styleUrls: ['./adduser.component.scss']
})
export class AdduserComponent implements OnInit {
  userForm: FormGroup;
  submitted = false;

  selectedItem;
  roleid: number
  roles: role[] = [
  ];
  //selectedrole: role;
  user: any = {
    user_id: '',
    network_id: '',
    user_name: '',
    email_id: '',
    emp_group: '',
    role_id: 0,
    status: 0,
    updated_date: '',
    created_date: '',
    is_billable: false,
  };
  access: boolean = true
  date: string;
  edit: boolean = false;
  constructor(private adminService: AdminService,
    private router: Router,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar) {
    this.getServerTime();
  }
  rolevalue: string
  usrEmpGrp: any
  openSnackBar(message, dur) {
    this.snackBar.open(message, "Close", {
      duration: dur,
    });
  }

  ngOnInit() {
    this.usrEmpGrp = [
      {
        value: "MBT",
        key: "MBT",
      },
      {
        value: "MTT",
        key: "MTT",
      }
    ]
    this.userForm = this.formBuilder.group({
      userid: ['', Validators.required],
      network_id: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]*$')]],
      username: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]],
      roleid: ['', Validators.required],
      email_id: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]*$')]],
      emp_group: ['', Validators.required],
      isBillable: ['']
    });
    this.getRoles();
    const params = this.activatedRoute.snapshot.params;
    if (params.id) {
      this.adminService.getuser(params.id)
        .subscribe(
          res => {
            if (res['statusCode'] == undefined || res['statusCode'] == "200") {
              res = res['data']
              res['email_id'] = res['email_id'].split("@")[0]
              this.user = res;
              this.edit = true;
              this.access = false;
              this.selectedItem = res['role_id']
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

  get f() { return this.userForm.controls; }

  selectroleid(roleid) {
    this.roleid = roleid;
  }

  getRoles() {
    this.adminService.getRoles().subscribe(
      res => {
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          res = res['data']
          var keys = Object.keys(res);
          var len = keys.length;
          for (var i = 0; i < len; i++) {
            this.roles.push({
              value: res[i]['role_name'],
              roleid: res[i]['role_id']
            })
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

  saveNewUser() {
    this.submitted = true;
    if (this.userForm.invalid) {
      return;
    }
    else {
      this.user.role_id = this.roleid;
      this.adminService.saveNewUser(this.user)
        .subscribe(
          res => {
            if (res['statusCode'] == undefined || res['statusCode'] == "200") {
              this.openSnackBar("User is created successfully", 5000)
              setTimeout(() => {
                this.router.navigate(['/timesheet/admin/users']);
              }, 500)
            }
            if (res['statusCode'] == undefined || res['statusCode'] == "501") {
              this.openSnackBar(res['message'], 5000)
            }
            if (res['statusCode'] == undefined || res['statusCode'] == "500") {
              this.openSnackBar(res["message"], 5000)
            }
          },
          err => console.error(err)
        )
    }
  }

  updateUser() {
    this.submitted = true;
    this.userForm.controls.userid.clearValidators();
    this.userForm.controls.userid.setErrors(null);
    this.userForm.controls.userid.setValidators(null);
    if (this.userForm.invalid) {
      return;
    }
    else {
      var id = this.user.user_id;
      delete this.user.user_id;
      delete this.user.created_date;
      this.user.updated_date = new Date();
      this.user.role_id = this.userForm.get('roleid').value
      this.adminService.updateUser(id, this.user)
        .subscribe(
          res => {
            this.user.user_id=id
            if (res['statusCode'] == "200") {
              this.openSnackBar(res["message"], 5000)
              setTimeout(() => {
                this.router.navigate(['/timesheet/admin/users']);
              }, 500)
            }
            if (res['statusCode'] == "501") {
              this.openSnackBar(res["message"], 5000)
              // this.openSnackBar("Please check the entered data", 5000)
            }
            if (res['statusCode'] == "500") {
              this.openSnackBar(res["message"], 5000)
            }
          },
          err => console.error(err)
        )
    }
  }
  getServerTime() {
    var dateObj = new Date();
    var dt: any = getDateStrFromDateObj(dateObj)
    this.date = dt
    return
  }

  checkEmail(event: any) {
    if (event.key >= 'a' && event.key <= 'z') {
      return true;
    }
    else if (event.key >= 'A' && event.key <= 'Z') {
      return true;
    }
    else if (event.key >= '0' && event.key <= '9') {
      return true;
    }
    else {
      event.preventDefault()
      return false
    }
  }

  checkUserCre(event: any, action) {
    var flag = false
    if (event.key >= 'a' && event.key <= 'z') {
      flag = true
    }
    else if (event.key >= 'A' && event.key <= 'Z') {
      flag = true
    }

    if(action == "name"){
      if (event.which == 32) {
        flag = true
      }
    }
    else if (action == "network_id") {
      if (event.key >= '0' && event.key <= '9') {
        flag = true
      }
    }
    else if (action == "id") {
      if (event.key >= '0' && event.key <= '9') {
        flag = true
      }
    }
    if (flag) {
      if (action == "network_id") {
        this.user.email_id = this.user.network_id + event.key
      }
      return flag
    }
    else {
      event.preventDefault()
      return flag
    }
  }

}
