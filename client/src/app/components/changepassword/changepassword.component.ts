import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { AuthenticationService } from 'src/app/services/authentication.service'
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from 'src/app/services/login.service';
import * as jwt_decode from 'jwt-decode'
import { MatSnackBar } from '@angular/material';



@Component({
  selector: 'app-changepassword',
  templateUrl: './changepassword.component.html',
  styleUrls: ['./changepassword.component.scss']
})
export class ChangepasswordComponent implements OnInit {
  pwdForm: FormGroup;
  submitted = false;
  showMsg: boolean = false;
  date: string;
  msg: string;

  user: any = {
    oldPwd: '',
    newPwd: '',
    confirmPwd: '',
    user_id: '',
    updated_date: ''
  };
  decodedata: any
  resetFlag: boolean
  tokenParam: any
  constructor(
    private auth: AuthenticationService,
    private adminService: AdminService,
    private loginService: LoginService,
    private router: Router,
    private formBuilder: FormBuilder,
    private activeRoute: ActivatedRoute, private snackBar: MatSnackBar) {
  }

  userid = window.sessionStorage.getItem('userid');

  ngOnInit() {
    if (this.activeRoute.snapshot.params.token) {
      this.resetFlag = false
      this.pwdForm = this.formBuilder.group({
        newPwd: ['', [Validators.required, Validators.minLength(4)]],
        confirmPwd: ['', [Validators.required, Validators.minLength(4)]]
      });
      this.tokenParam = this.activeRoute.snapshot.params.token
      this.getId(this.activeRoute.snapshot.params.token)
    }
    else {
      this.resetFlag = true
      this.pwdForm = this.formBuilder.group({
        oldPwd: ['', Validators.required],
        newPwd: ['', [Validators.required, Validators.minLength(4)]],
        confirmPwd: ['', [Validators.required, Validators.minLength(4)]]
      });
      this.tokenParam = "no"
    }
  }

  getId(token) {
    try {
      this.decodedata = jwt_decode(token)
      this.user['user_id'] = this.decodedata['userid']

      this.auth.checkToken(token, this.router.url.includes('resetPassword')).subscribe(
        (res) => {
          //console.log("res is ", res)
          if (res['status'] == false) {
            this.openSnackBar("Link expired! Please request again.", 5000)
            this.auth.logout();
          }
          else if (res['openedSecTime']) {//openedSecond Time
            this.openSnackBar("Link was used! Please request again.", 5000)
            this.auth.logout();
          }
        },
        (err) => {
        }
      )
    }
    catch (err) {
      if (this.router.url.includes('resetPassword')) {
        this.resetFlag = false
        if (this.auth.isLoggedIn()) {
          this.router.navigateByUrl('/login')
        }
      }
      else {
        this.resetFlag = true
        this.auth.checkToken(localStorage.getItem('token'), this.router.url.includes('resetPassword')).subscribe(
          (res) => {
            if (res['status'] == false || res['errFlag'] == true) {
              this.auth.logout();
            }
          },
          (err) => {
            console.log("err in checktoken is ", err);
          }
        )
      }
    }
  }

  openSnackBar(msg, dur) {
    this.snackBar.open(msg, "Close", {
      duration: dur,
    });
  }

  changePwd() {
    this.submitted = true;
    this.showMsg = false
    this.msg = ""
    if (this.pwdForm.invalid) {
      return;
    }
    else {
      this.user.user_id = this.userid
      if (this.user.newPwd == this.user.confirmPwd) {
        this.loginService.changePassword(this.user)
          .subscribe(
            res => {
              if (res['statusCode'] == undefined || res['statusCode'] == "501") {
                this.msg = "Old Password is incorrect!"
                this.openSnackBar(res["message"], 2000)
              }
              if (res['statusCode'] == undefined || res['statusCode'] == "200") {
                this.openSnackBar("Password Updated successfully", 2000)
                this.router.navigate(['/timesheet']);
              }
              if (res['statusCode'] == undefined || res['statusCode'] == "401") {
                this.loginService.logout();
                this.router.navigate(['/login']);
              }
            },
            err => console.error(err)
          )
      }
      else {
        this.msg = "New password and Confirm password are not same"
        this.openSnackBar(this.msg, 2000)
      }
    }
  }

  resetPassword() {
    //console.log(this.user)
    this.submitted = true;
    this.showMsg = false
    this.msg = ""
    if (this.pwdForm.invalid) {
      return;
    }
    else {
      //console.log("changePwd", this.user)
      if (this.tokenParam != "no") {
        this.user.genToken = this.tokenParam
      }
      if (this.user.newPwd == this.user.confirmPwd) {
        this.loginService.resetPassword(this.user)
          .subscribe(
            res => {
              if (res['statusCode'] == undefined || res['statusCode'] == "200") {
                this.openSnackBar("Password Updated Successfully", 500)
                this.router.navigate(['/login']);
              }
              else {
                //console.log("message is ", res['message'])
                this.openSnackBar("Error occured while updating password", 2000)
              }
            },
            err => console.error(err)
          )
      }
      else {
        //this.showMsg = true
        this.msg = "New password and Confirm password are not same"
        this.openSnackBar(this.msg, 2000)
      }
    }
  }

  get f() { return this.pwdForm.controls; }

}
