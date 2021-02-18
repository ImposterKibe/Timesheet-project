import { Component, OnInit, HostBinding, ViewChild, Inject } from '@angular/core';
import { MatPaginator, MatTableDataSource, MatSort, Sort, MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { ConfirmMessageComponent } from '../confirm-message/confirm-message.component';
import { ApplicationStateService } from 'src/app/application-state.service';
import { getDateStrFromDateObj } from '../../../helper/clientCommonFunction'

export interface data {
  id: number;
  value: string;
}
@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {
  project: any = {
    updated_date: '',
  };
  screen: boolean = false;
  actionFlag: any = true
  date: any;
  tid: number
  tableMsg: string;
  showTable: any
  projects: MatTableDataSource<any>;
  roleid = window.sessionStorage.getItem('role');
  UserId = window.sessionStorage.getItem('userid');
  displayedColumns: string[] = [];
  @HostBinding('class') classes = 'row';
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  matColumnDefJson:any={}

  constructor(public dialog: MatDialog, private adminService: AdminService,
    private router: Router, private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    private applicationStateService: ApplicationStateService) {
    this.getServerTime();
  }

  ngOnInit() {
    this.matColumnDefJson={}
    if (this.roleid == '2') {
      this.actionFlag = true
      // 'project_code', 
      this.displayedColumns = ['project_name', 'customer_name', 'service_line', 'planned_start_date', 'planned_end_date']
    }
    else {
      this.actionFlag = false
      // 'project_code', 
      this.displayedColumns = ['project_name', 'customer_name', 'service_line', 'user_name', 'planned_start_date', 'planned_end_date', 'action']
    }

    this.displayedColumns.filter((eachBlk:any)=>{
      this.matColumnDefJson[eachBlk]=eachBlk
      if (this.roleid == '2'){
        this.matColumnDefJson[eachBlk]+="_manager"
      }
      else{
        this.matColumnDefJson[eachBlk]+="_admin"
      }
    })
    this.getProjects();
    this.showTable = true
    if (this.applicationStateService.getIsMobileResolution()) {
      this.screen = true
    }
    else
      this.screen = false
  }

  openSnackBar(message) {
    this.snackBar.open(message, "Close", {
      duration: 100,
    });
  }



  getProjects() {
    this.adminService.getProjects(this.UserId, this.roleid).subscribe(
      res => {
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          res = res['data']
          if (Object.keys(res).length == 0) {
            this.tableMsg = "No Data Available!"
            this.showTable = false
            return
          }
          this.tableMsg = ""
          this.showTable = true
          res = this.changeDateFormat(res)
          for (var i = 0; i < Object.keys(res).length; i++) {
            var str = res[i]['project_code']
            if (str.startsWith("p-")) {
              res[i]['project_code'] = res[i]['project_code_old']
            }
          }
          if (this.roleid == '1') {
            this.projects = new MatTableDataSource(res as {
            }[]);
            this.projects.sort = this.sort;
            const sortState: Sort = { active: 'project_name', direction: 'asc' };
            this.sort.active = sortState.active;
            this.sort.direction = sortState.direction;
            this.sort.sortChange.emit(sortState);
            this.projects.paginator = this.paginator;
          }
          else {
            this.projects = new MatTableDataSource(res as {
            }[]);
            this.projects.sort = this.sort;
            const sortState: Sort = { active: 'project_name', direction: 'asc' };
            this.sort.active = sortState.active;
            this.sort.direction = sortState.direction;
            this.sort.sortChange.emit(sortState);
            this.projects.paginator = this.paginator;
          }
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      err => console.error(err)
    );
  }

  edit(projectid) {
    this.router.navigate(['timesheet/admin/projects/edit/' + projectid]);
  }

  applyProjectsFilter(filterValue: string) {
    this.projects.filter = filterValue.trim().toLowerCase();
  }

  delete(projDetails): void {
    var projectid: any = projDetails.id
    const dialogRef = this.dialog.open(ConfirmMessageComponent, {
      width: '250px',
      data: { id: projDetails.project_name, name: projDetails.project_name }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result != undefined) {
        this.projects = new MatTableDataSource();
        this.tid = projectid
        this.project.updated_date = this.date
        this.adminService.deleteProject(this.tid, this.project)
          .subscribe(
            res => {
              if (res['status'] == 200) {
                this.openSnackBar("Project is deleted successfully")
                setTimeout(() => {
                }, 1000)

                this.getProjects();
                this.projects.sort = this.sort;
                this.projects.paginator = this.paginator;
              }
              else {
                this.openSnackBar("Error Occured while deleting project")
                setTimeout(() => {
                }, 1000)
              }
            },
            err => console.error(err)
          )
      }
    });

  }

  getServerTime() {
    var dateObj = new Date();
    var dt: any = getDateStrFromDateObj(dateObj)
    this.date = dt
    return
  }

  changeDateFormat(arr) {
    var len = Object.keys(arr).length
    for (var i = 0; i < arr.length; i++) {
      arr[i]['planned_start_date'] = arr[i]['planned_start_date'].substring(0, 10)
      var y = arr[i]['planned_start_date'].split('-')[0]
      var m = arr[i]['planned_start_date'].split('-')[1]
      var d = arr[i]['planned_start_date'].split('-')[2]
      arr[i]['planned_start_date'] = d + "/" + m + "/" + y
      arr[i]['planned_end_date'] = arr[i]['planned_end_date'].substring(0, 10)
      var y = arr[i]['planned_end_date'].split('-')[0]
      var m = arr[i]['planned_end_date'].split('-')[1]
      var d = arr[i]['planned_end_date'].split('-')[2]
      arr[i]['planned_end_date'] = d + "/" + m + "/" + y
    }
    return arr
  }
}

