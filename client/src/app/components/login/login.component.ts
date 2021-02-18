import { Component, OnInit, ChangeDetectorRef, HostListener, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { from } from 'rxjs';
import { LoginService } from '../../services/login.service';
import { AuthenticationService } from '../../services/authentication.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  message: string;
  submitted = false;
  userDetails: any = {
    user_id: '',
    password: ''
  };


  @ViewChild("uidInput") uidInput: ElementRef;
  constructor(private changeDetector: ChangeDetectorRef, private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    private loginService: LoginService,
    private auth: AuthenticationService) {
    //console.log(window.localStorage.getItem('userid'));
    // if (window.localStorage.getItem('userid')) {
    //   if (window.sessionStorage.getItem('userid')) {
    //   this.router.navigate(['/timesheet']);
    // }
  }
  @HostListener('document:keydown.tab', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    event.preventDefault();
  }
  @ViewChild("input") input: ElementRef;
  @ViewChild('btnRef') button
  onKey(event: KeyboardEvent, action: any) {
    event.preventDefault();

    if (event.key === "Tab") {
      if (action == "uid") {
        this.changeDetector.detectChanges();
        this.input.nativeElement.focus();
        //console.log(document.activeElement)
        return true
      }
      else if (action == "pwd") {
        this.changeDetector.detectChanges();
        this.button.focus()
        //console.log(document.activeElement)
        return true
      }
      else
        return false
    }
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      userid: ['', Validators.required],
      password: ['', Validators.required],
    });
    this.changeDetector.detectChanges();
    this.uidInput.nativeElement.focus();
  }

  get f() { return this.loginForm.controls; }

  login() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }
    else {
      //console.log(this.userDetails)
      this.loginService.login(this.userDetails)
        .subscribe(
          res => {
            var store = res['res']
            if (res['statusCode'] != undefined) {
              this.message = 'please check your userid and password';
              this.openSnackBar(res["message"])
            }
            else {
              sessionStorage.setItem('token', res['token']);
            }
            this.auth.getLocalStorage();

            this.router.navigate(['/timesheet']);
          },
          err => {
            this.message = 'please check your userid and password';
            this.openSnackBar(this.message)
          }
        )
    }
  }

  openSnackBar(message) {
    this.snackBar.open(message, "Close", {
      duration: 2000,
    });
  }

  changePwd() {
    //console.log(document.activeElement,document.activeElement.id)
    if (document.activeElement.id == "loginBtn") {
      this.login()
    }
    else if (document.activeElement.id == "uid") {
      this.changeDetector.detectChanges();
      this.input.nativeElement.focus();
      //console.log(document.activeElement)
      event.preventDefault()
      return
    }
    if (document.activeElement.id == "pwd") {
      this.changeDetector.detectChanges();
      this.button.focus()
      //console.log(document.activeElement)
      return
    }
  }
}
