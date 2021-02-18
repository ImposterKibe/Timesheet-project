import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TextMaskModule } from 'angular2-text-mask';
import 'hammerjs';
import { MatExpansionModule } from '@angular/material/expansion';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatCheckboxModule } from '@angular/material';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AddTimesheetComponent } from './components/add-timesheet/add-timesheet.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { TimesheetComponent } from './components/timesheet/timesheet.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { UsersComponent } from './components/admin/users/users.component';
import { ProjectsComponent } from './components/admin/projects/projects.component';
import { MatTreeModule } from '@angular/material/tree';
import { MatListModule } from '@angular/material/list';
import { LoginComponent } from './components/login/login.component';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { AdduserComponent } from './components/admin/adduser/adduser.component';
import { AddprojectComponent } from './components/admin/addproject/addproject.component';
import { ConfirmMessageComponent } from './components/admin/confirm-message/confirm-message.component';
import { AuthenticationService } from './services/authentication.service'
import { AuthGuardService } from './services/auth-guard.service'
import { mapToMapExpression } from '@angular/compiler/src/render3/util';
import { PlanComponent } from './components/admin/plan/plan.component';
import { AuthInterceptorService } from './services/auth-interceptor.service';
import { CustomerComponent } from './components/admin/customer/customer.component';
import { AddCustomerComponent } from './components/admin/add-customer/add-customer.component';
import { MatDatepickerModule, MatNativeDateModule } from '@angular/material';
import { CdkTableModule } from '@angular/cdk/table';
import { MatAutocompleteModule } from '@angular/material';
import { ChangepasswordComponent } from './components/changepassword/changepassword.component';
import { ForgotpasswordComponent } from './components/forgotpassword/forgotpassword.component';
import { AddplanComponent } from './components/admin/addplan/addplan.component';
import { LoaderComponent } from './components/loader/loader.component';
import { DatePipe } from '@angular/common';
import { AdminReportsComponent } from './components/reports/admin-reports/admin-reports.component';
import { UserReportsComponent } from './components/reports/user-reports/user-reports.component';
import { ManagerReportsComponent } from './components/reports/manager-reports/manager-reports.component';
import { ViewReportsComponent } from './components/reports/view-reports/view-reports.component';
import { AvailableReportsComponent } from './components/reports/available-reports/available-reports.component';

@NgModule({
  declarations: [
    AppComponent,
    AddTimesheetComponent,
    NavbarComponent,
    TimesheetComponent,
    UsersComponent,
    ProjectsComponent,
    LoginComponent,
    AdduserComponent,
    AddprojectComponent,
    ConfirmMessageComponent,
    PlanComponent,
    CustomerComponent,
    AddCustomerComponent,
    ChangepasswordComponent,
    ForgotpasswordComponent,
    AddplanComponent,
    LoaderComponent,
    AdminReportsComponent,
    UserReportsComponent,
    ManagerReportsComponent,
    ViewReportsComponent,
    AvailableReportsComponent,
  ],
  imports: [
    TextMaskModule,
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatMenuModule,
    MatInputModule,
    MatRadioModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    FormsModule,
    MatIconModule,
    MatToolbarModule,
    MatGridListModule,
    MatTableModule,
    FlexLayoutModule,
    MatCardModule,
    MatDialogModule,
    MatSelectModule,
    HttpClientModule,
    MatPaginatorModule,
    MatSortModule,
    MatTabsModule,
    MatTreeModule,
    MatListModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CdkTableModule,
    NgxMaterialTimepickerModule.forRoot()

  ],
  providers: [
    DatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true },
    AuthenticationService,
    AuthGuardService,
  ],
  bootstrap: [AppComponent],
  entryComponents: [LoginComponent, ConfirmMessageComponent]
})
export class AppModule { }
