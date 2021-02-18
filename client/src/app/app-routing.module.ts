import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TimesheetComponent } from './components/timesheet/timesheet.component';
import { AddTimesheetComponent } from './components/add-timesheet/add-timesheet.component';
import { UsersComponent } from './components/admin/users/users.component';
import { PlanComponent } from './components/admin/plan/plan.component';
import { CustomerComponent } from './components/admin/customer/customer.component';
import { ProjectsComponent } from './components/admin/projects/projects.component';
import { LoginComponent } from './components/login/login.component';
import { AdduserComponent } from './components/admin/adduser/adduser.component';
import { AddprojectComponent } from './components/admin/addproject/addproject.component';
import { AddCustomerComponent } from './components/admin/add-customer/add-customer.component';
import { ChangepasswordComponent } from './components/changepassword/changepassword.component'
import { ForgotpasswordComponent } from './components/forgotpassword/forgotpassword.component'
import { AddplanComponent } from './components/admin/addplan/addplan.component'
import { AdminReportsComponent } from './components/reports/admin-reports/admin-reports.component';
import { UserReportsComponent } from './components/reports/user-reports/user-reports.component';
import { ManagerReportsComponent } from './components/reports/manager-reports/manager-reports.component';

import { ViewReportsComponent } from './components/reports/view-reports/view-reports.component';
//AUTH GUARD
import { AuthGuardService } from './services/auth-guard.service'

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'timesheet', component: TimesheetComponent, canActivate: [AuthGuardService], data: { roles: ['user', 'admin', 'manager'] },
    children: [
      { path: 'timesheet/add', component: AddTimesheetComponent, canActivate: [AuthGuardService], data: { roles: ['user', 'admin', 'manager'] } },
    ]
  },
  { path: 'timesheet/yesterday', component: TimesheetComponent, canActivate: [AuthGuardService], data: { roles: ['user', 'admin', 'manager'] } },
  { path: 'timesheet/today', component: TimesheetComponent, canActivate: [AuthGuardService], data: { roles: ['user', 'admin', 'manager'] } },
  { path: 'timesheet/week', component: TimesheetComponent, canActivate: [AuthGuardService], data: { roles: ['user', 'admin', 'manager'] } },
  { path: 'timesheet/lastWeek', component: TimesheetComponent, canActivate: [AuthGuardService], data: { roles: ['user', 'admin', 'manager'] } },
  { path: 'timesheet/thisMonth', component: TimesheetComponent, canActivate: [AuthGuardService], data: { roles: ['user', 'admin', 'manager'] } },
  { path: 'timesheet/lastMonth', component: TimesheetComponent, canActivate: [AuthGuardService], data: { roles: ['user', 'admin', 'manager'] } },
  { path: 'timesheet/add', component: AddTimesheetComponent, canActivate: [AuthGuardService], data: { roles: ['user', 'admin', 'manager'] } },
  { path: 'timesheet/edit/:id', component: AddTimesheetComponent, canActivate: [AuthGuardService], data: { roles: ['user', 'admin', 'manager'] } },
  { path: 'timesheet/admin/planning/add', component: AddplanComponent, canActivate: [AuthGuardService], data: { roles: ['admin', 'manager'] } },
  { path: 'timesheet/admin/planning/edit/:pid/:uid/:st/:ed', component: AddplanComponent, canActivate: [AuthGuardService], data: { roles: ['admin', 'manager'] } },
  { path: 'timesheet/admin/planning/edit/:json', component: AddplanComponent, canActivate: [AuthGuardService], data: { roles: ['admin', 'manager'] } },
  { path: 'timesheet/admin/planning', component: PlanComponent, canActivate: [AuthGuardService], data: { roles: ['admin', 'manager'] } },
  { path: 'timesheet/admin/customer', component: CustomerComponent, canActivate: [AuthGuardService], data: { roles: ['admin'] } },
  { path: 'timesheet/admin/customer/add', component: AddCustomerComponent, canActivate: [AuthGuardService], data: { roles: ['admin'] } },
  { path: 'timesheet/admin/customer/edit/:id', component: AddCustomerComponent, canActivate: [AuthGuardService], data: { roles: ['admin'] } },
  { path: 'timesheet/admin/users', component: UsersComponent, canActivate: [AuthGuardService], data: { roles: ['admin'] } },
  { path: 'timesheet/admin/users/add', component: AdduserComponent, canActivate: [AuthGuardService], data: { roles: ['admin'] } },
  { path: 'timesheet/admin/users/edit/:id', component: AdduserComponent, canActivate: [AuthGuardService], data: { roles: ['admin'] } },
  { path: 'timesheet/admin/users/delete/:id', component: UsersComponent, canActivate: [AuthGuardService], data: { roles: ['admin'] } },
  { path: 'timesheet/admin/projects', component: ProjectsComponent, canActivate: [AuthGuardService], data: { roles: ['admin', 'manager'] } },
  { path: 'timesheet/admin/projects/add', component: AddprojectComponent, canActivate: [AuthGuardService], data: { roles: ['admin', 'manager'] } },
  { path: 'timesheet/admin/projects/edit/:id', component: AddprojectComponent, canActivate: [AuthGuardService], data: { roles: ['admin', 'manager'] } },
  { path: 'timesheet/changePassword', component: ChangepasswordComponent, canActivate: [AuthGuardService], data: { roles: ['user', 'admin', 'manager'] } },
  { path: 'timesheet/forgotPassword', component: ForgotpasswordComponent, },
  { path: 'resetPassword/:token', component: ChangepasswordComponent },
  { path: 'timesheet/userReports', component: UserReportsComponent, canActivate: [AuthGuardService], data: { roles: ['admin', 'manager', 'user'] } },
  { path: 'timesheet/ViewReports', component: ViewReportsComponent, canActivate: [AuthGuardService], data: { roles: ['admin', 'manager'] } },
  { path: '**', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
