import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from 'src/app/services/login.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-forgotpassword',
  templateUrl: './forgotpassword.component.html',
  styleUrls: ['./forgotpassword.component.scss']
})
export class ForgotpasswordComponent implements OnInit {
  pwdForm: FormGroup;
  submitted = false;
  showMsg: boolean = false;
  date: string;
  msg: string;
  task: string;

  user: any = {
    emailId: '',
  };
  constructor(private adminService: AdminService,
    private loginService: LoginService,
    private router: Router,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute, private snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.pwdForm = this.formBuilder.group({
      emailId: ['', [Validators.required, Validators.pattern('^[a-zA-Z\-\']*$')]],
    });
  }
  openSnackBar(msg, dur) {
    this.snackBar.open(msg, "Close", {
      duration: dur,
    });
  }
  forgotPwd() {
    this.submitted = true;
    this.showMsg = false
    this.msg = ""
    if (this.pwdForm.invalid) {
      return;
    }
    else {
      this.task = "resetPassword"
      this.user.task = this.task
      this.loginService.forgotPassword(this.user)
        .subscribe(
          res => {
            if (res['statusCode'] == undefined || res['statusCode'] == "501") {
              this.showMsg = true
              this.msg = res['message']
              this.openSnackBar(this.msg, 2000)
            }
            if (res['statusCode'] == undefined || res['statusCode'] == "200") {
              this.openSnackBar("Mail sent Successfully", 500)
              this.router.navigate(['/login']);
            }
          },
          err => console.error(err)
        )
    }
  }

  get f() { return this.pwdForm.controls; }
  checkEmail(event: any) {

    if (event.key >= 'a' && event.key <= 'z') {
      return true;
    }
    else if (event.key >= 'A' && event.key <= 'Z') {
      return true;
    }
    else {
      event.preventDefault()
      return false
    }
  }
}
