import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { LoginService } from '../../services/login.service';
import { Router } from '@angular/router';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Input() showActiveCompo: boolean;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

  enteredButton: boolean = false;
  isMatMenuOpen: boolean = false;
  prevButtonTrigger: any;

  role: String;
  roleid = window.sessionStorage.getItem('role');
  uname = window.sessionStorage.getItem('uname');
  showMenu: any
  show: boolean = false;

  showActive: boolean = true

  constructor(private loginService: LoginService, private router: Router) { }

  reportsAct: any
  ngOnInit() {
    this.role = 'admin';
    this.reportsAct = 0;
    this.showMenu = true
    this.showMenu = true

    this.showActive = true
    if (this.showActiveCompo != undefined) {
      this.showActive = this.showActiveCompo
    }
  }
  logout(): void {
    this.loginService.logout();
  }
  changePassword(): void {
    this.router.navigate(['/timesheet/changePassword']);
  }
  toggle() {
    this.show = !this.show;
  }
  clicked() {
    this.show = !this.show;
  }

  buttonEnter(trigger: any) {
    setTimeout(() => {
      if (this.prevButtonTrigger && this.prevButtonTrigger != trigger) {
        this.prevButtonTrigger.closeMenu();
        this.prevButtonTrigger = trigger;
        this.isMatMenuOpen = false;
        trigger.openMenu();
      }
      else if (!this.isMatMenuOpen) {
        this.enteredButton = true;
        this.prevButtonTrigger = trigger
        trigger.openMenu();
      }
      else {
        this.enteredButton = true;
        this.prevButtonTrigger = trigger
      }
    })
  }

  buttonLeave(trigger: any) {
    setTimeout(() => {
      if (this.enteredButton && !this.isMatMenuOpen) {
        trigger.closeMenu();
      } if (!this.isMatMenuOpen) {
        trigger.closeMenu();
      } else {
        this.enteredButton = false;
      }
    }, 100)
  }

  menuenter() {
    this.isMatMenuOpen = true;
  }

  menuLeave(trigger) {
    setTimeout(() => {
      if (!this.enteredButton) {
        this.isMatMenuOpen = false;
        trigger.closeMenu();
      } else {
        this.isMatMenuOpen = false;
      }
    }, 80)
  }


}
