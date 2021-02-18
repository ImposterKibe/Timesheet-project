import { Component, OnInit, Inject, HostBinding } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material'
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { TimesheetService } from 'src/app/services/timesheet.service';
import { MatSnackBar } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import * as _moment from 'moment';
import { getDateStrFromDateObj } from '../../helper/clientCommonFunction'
import store from 'src/assets/clientConfig'
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
    value: any,
    proid: any
}
@Component({
    selector: 'app-add-timesheet',
    templateUrl: './add-timesheet.component.html',
    styleUrls: ['./add-timesheet.component.scss'],
    providers: [
        {
            provide: DateAdapter,
            useClass: MomentDateAdapter,
            deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
        },

        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    ],
})
export class AddTimesheetComponent implements OnInit {
    minDate: any
    maxDate: any
    timesheetForm: FormGroup;
    @HostBinding('class') classes = 'row';
    pros: pro[] = [
    ];
    arr = [];
    dateLimit = store.dateRecord.lastDay
    proid: number
    userid = window.sessionStorage.getItem('userid');
    calcDuration: string = '00:00'
    submitted = false;
    saveBtnShow = false;
    timesheet: any = {
        timesheet_id: 0,
        project_id: 0,
        user_id: '',
        created_date: '',
        updated_date: '',
        duration: 0,
        approved: 1,
        description: '',
        start_time: '',
        end_time: '',
        entry_date: new Date()
    };

    edit: boolean = false;

    constructor(private formBuilder: FormBuilder, private authService: AuthenticationService, private timesheetService: TimesheetService,
        private adminService: AdminService, private router: Router, private activatedRoute: ActivatedRoute,
        private snackBar: MatSnackBar) {
        this.getServerTime();
    }

    getServerTime() {
        // this.timesheet.date = new Date();
        this.timesheet.start_time = new Date().toLocaleTimeString('en-GB')
        this.timesheet.end_time = new Date().toLocaleTimeString('en-GB')
        this.timesheet.created_date = new Date()
        this.timesheet.updated_date = new Date()
    }

    changedDate(type: string, event: MatDatepickerInputEvent<Date>) {
        this.timesheet.date = event.value
        var check = moment(this.timesheet.date, 'DD/MM/YYYY');
        var day = check.format('DD')
        var month = check.format('MM')
        var year = check.format('YYYY')
        this.timesheet.entry_date = year + "-" + month + "-" + day
    }

    openSnackBar(msg, dur) {
        this.snackBar.open(msg, "Close", {
            duration: dur,
        });
    }

    ngOnInit() {
        this.edit = false;
        this.timesheetForm = this.formBuilder.group({
            description: [''],
            projectid: ['', Validators.required],
            date: ['', Validators.required],
            start: ['', Validators.required],
            end: ['', Validators.required],
            duration: [{ value: '', disabled: true }, Validators.required],
        });
        const params = this.activatedRoute.snapshot.params;
        if (params.id) {
            this.saveBtnShow = false;
            this.timesheetService.getTimesheet(params.id)
                .subscribe(
                    res => {
                        if (res["statusCode"] == 501) {
                            this.openSnackBar(res["message"], 2000)
                            this.router.navigate(['/timesheet']);
                        }
                        else {
                            if (res['statusCode'] == undefined || res['statusCode'] == 200) {
                                res = res['data']
                                var options = { hour12: false };
                                res['start_time'] = new Date(res['start_time']).toLocaleTimeString('en-GB')
                                res['end_time'] = new Date(res['end_time']).toLocaleTimeString('en-GB')
                                res['entry_date'] = res['entry_date'].substring(0,10)
                                this.edit = true;
                                this.getDateList();
                                this.timesheet = res;
                                this.timesheetForm.get('projectid').setValue(this.timesheet.project_id);
                                this.timesheet.date = res['entry_date']
                                this.displayDuration();
                            }
                            if (res['statusCode'] == "401") {
                                localStorage.clear();
                                this.router.navigate(['/login']);
                            }
                        }
                    },
                    err => console.error(err)
                )
        }
        else
            this.getDateList();
    }

    get f() { return this.timesheetForm.controls; }

    getProjects(st, end) {
        var jsonObj = {}
        jsonObj["user_id"] = this.userid
        jsonObj['start_date'] = st
        jsonObj['end_date'] = end
        jsonObj['action'] = "timesheet"
        this.authService.getAllProjForReportOrPlanning(jsonObj).subscribe(
            res => {
                if (res['statusCode'] == "200") {
                    res = res['data']
                    var len = res.length;
                    this.pros = []
                    if (len > 0) {
                        for (var i = 0; i < len; i++) {
                            if (res[i]['project_code'].split("-")[0] == 'p') {
                                this.pros.push({ value: res[i]['project_name'] + "_" + res[i]['project_code_old'], proid: res[i]['id'] })
                            }
                            else {
                                this.pros.push({ value: res[i]['project_name'] + "_" + res[i]['project_code'], proid: res[i]['id'] })
                            }
                        }
                    }
                    else if (len == 0) {
                        this.openSnackBar("No Projects Available!", 2000)
                        setTimeout(() => {
                            this.router.navigate(['/timesheet']);
                        }, 2010)
                    }
                }
                if (res['statusCode'] == "500") {
                    this.openSnackBar(res["message"], 2000)
                    setTimeout(() => {
                        this.router.navigate(['/timesheet']);
                    }, 2010)
                }
                if (res['statusCode'] == "401") {
                    localStorage.clear();
                    this.router.navigate(['/login']);
                }
            },
            err => console.error(err)
        );
        return
    }

    getDateList() {
        this.timesheetService.getDatesToFillTS()
            .subscribe(
                res => {
                    if (res['statusCode'] == "200") {
                        res = res['data']
                        // new Date
                        this.minDate = (res['from']).substring(0,10)
                        this.maxDate = (res['to']).substring(0,10)
                        if (!this.edit) {
                            this.timesheet.date = (res['to']).substring(0,10)
                            this.timesheet.entry_date = this.timesheet.date
                        }
                        
                        this.getProjects(this.minDate, this.maxDate);
                    }
                    if (res['statusCode'] == "501") {
                        this.openSnackBar("Date list Error", 5000)
                    }
                    if (res['statusCode'] == "500") {
                        this.openSnackBar("Error occured while getting date list", 5000)
                    }
                    if (res['statusCode'] == "401") {
                        localStorage.clear();
                        this.router.navigate(['/login']);
                    }
                },
                err => console.error(err)
            )
        return
    }

    selectproid(proid) {
        this.proid = proid;
        this.timesheet.project_id = proid
        if (this.calcDuration == '' || this.calcDuration == '00:00') {
            this.saveBtnShow = false;
        } else {
            this.saveBtnShow = false;
        }
    }

    compareTimes() {
        if (this.timesheet.start_time.split(":")[2] == undefined)
            this.timesheet.start_time = this.timesheet.start_time + ":00"
        if (this.timesheet.end_time.split(":")[2] == undefined)
            this.timesheet.end_time = this.timesheet.end_time + ":00"
        var timeComp = (this.timesheet.start_time).localeCompare(this.timesheet.end_time);
        if (timeComp == 1) {
            this.openSnackBar("End time should be greater than Start time!", 2000)
            this.timesheet.end_time = '00:00';
            this.calcDuration = ''
            this.saveBtnShow = false;
        }
        else if (timeComp == 0) {
            this.openSnackBar("End time should be greater than Start time!", 2000)
            this.timesheet.end_time = '00:00';
            this.calcDuration = ''
            this.saveBtnShow = false;
        }
        else {
            this.saveBtnShow = false;
            this.getDuration()
            this.displayDuration();
        }
    }

    getDuration() {
        var p = this.timesheet.end_time;
        var n = this.timesheet.start_time;
        var z = n.localeCompare(p);
        var hms = n;
        var a = hms.split(':');
        var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60;
        var hm = p;
        var b = hm.split(':');
        var second = (+b[0]) * 60 * 60 + (+b[1]) * 60; //result
        var result = second - seconds;
        var t = result + 1
        this.timesheet.duration = result;
    }

    displayDuration() {
        var dur = '00:00'
        var d = this.timesheet.duration;
        const HOUR = 60 * 60;
        const MINUTE = 60;
        var minutesInSeconds = d % HOUR;
        var hours = Math.floor(d / HOUR);
        var minutes = Math.floor(minutesInSeconds / MINUTE)
        if (hours < 10) {
            var hr = "" + "0" + hours;
        }
        else {
            var hr = "" + hours;
        }
        if (minutes < 10) {
            var min = "" + "0" + minutes;
        }
        else {
            var min = "" + minutes;
        }
        dur = hr + ":" + min;
        this.calcDuration = dur
        if (dur == '00:00') {
            this.saveBtnShow = false
        } else {
            if (this.proid != undefined)
                this.saveBtnShow = false;
        }
        return dur;
    }

    saveNewTimesheet() {
        this.submitted = true;
        if (this.timesheetForm.invalid) {
            return;
        }
        else {
            var timeComp = (this.timesheet.start_time).localeCompare(this.timesheet.end_time);
            if (timeComp == 0) {
                this.openSnackBar("End time should be greater than Start time!", 5000)
                this.timesheet.end_time = '00:00';
                this.calcDuration = ''
                this.saveBtnShow = false;
            }
            else if (timeComp == 1) {
                this.openSnackBar("End time should be greater than Start time!", 5000)
                this.timesheet.end_time = '00:00';
                this.calcDuration = ''
                this.saveBtnShow = false;
            }
            else {
                this.saveBtnShow = false;
                if (typeof (this.timesheet.entry_date) == 'object')
                    this.timesheet.entry_date = new Date(getDateStrFromDateObj(this.timesheet.entry_date))
                else
                    this.timesheet.entry_date = new Date((this.timesheet.entry_date))

                delete this.timesheet.timesheet_id;
                this.timesheet.project_id = this.proid;
                this.timesheet.user_id = this.userid;
                if (this.timesheet.start_time.split(":")[2] == undefined)
                    this.timesheet.start_time = this.timesheet.start_time + ":00"
                if (this.timesheet.end_time.split(":")[2] == undefined)
                    this.timesheet.end_time = this.timesheet.end_time + ":00"

                this.timesheet["actualStartTime"] = new Date(getDateStrFromDateObj(this.timesheet["entry_date"]) + " " + this.timesheet["start_time"])
                this.timesheet["actualEndTime"] = new Date(getDateStrFromDateObj(this.timesheet["entry_date"]) + " " + this.timesheet["end_time"])
                
                this.timesheetService.saveTimesheet(this.timesheet)
                    .subscribe(
                        res => {
                            if (res['statusCode'] == undefined || res['statusCode'] == "200") {
                                this.openSnackBar("Timesheet is created successfully", 5000)
                                setTimeout(() => {
                                    this.router.navigate(['/timesheet']);
                                }, 500)
                            }
                            if (res['statusCode'] == undefined || res['statusCode'] == "501") {
                                this.openSnackBar(res["message"], 5000)
                            }
                            if (res['statusCode'] == undefined || res['statusCode'] == "500") {
                                this.openSnackBar("Error occured while creating Timesheet", 5000)
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
    }

    updateTimesheet() {
        this.submitted = true;
        if (this.timesheetForm.invalid) {
            this.openSnackBar("Error occured while creating Timesheet", 5000)
            return;
        }
        else {
            if (typeof (this.timesheet.entry_date) == 'object')
                this.timesheet.entry_date = new Date(getDateStrFromDateObj(this.timesheet.entry_date))
            else
                this.timesheet.entry_date = new Date((this.timesheet.entry_date))

            if (this.timesheet.start_time.split(":")[2] == undefined)
                this.timesheet.start_time = this.timesheet.start_time + ":00"
            if (this.timesheet.end_time.split(":")[2] == undefined)
                this.timesheet.end_time = this.timesheet.end_time + ":00"

            this.timesheet["actualStartTime"] = new Date(getDateStrFromDateObj(this.timesheet["entry_date"]) + " " + this.timesheet["start_time"])
            this.timesheet["actualEndTime"] = new Date(getDateStrFromDateObj(this.timesheet["entry_date"]) + " " + this.timesheet["end_time"])

            
            this.timesheetService.updateTimesheet(this.timesheet.timesheet_id, this.timesheet)
                .subscribe(
                    res => {
                        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
                            this.openSnackBar("Timesheet is updated successfully", 5000)
                            setTimeout(() => {
                                this.router.navigate(['/timesheet']);
                            }, 500)
                        }
                        if (res['statusCode'] == undefined || res['statusCode'] == "501") {
                            this.openSnackBar("Timesheet already exist,Please check start and end time", 5000)
                        }
                        if (res['statusCode'] == undefined || res['statusCode'] == "500") {
                            this.openSnackBar("Error occured while creating Timesheet", 5000)
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
}