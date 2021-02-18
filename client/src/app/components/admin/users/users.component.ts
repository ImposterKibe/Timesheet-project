import { Component, OnInit, HostBinding, ViewChild, Output, EventEmitter } from '@angular/core';
import { MatPaginator, MatTableDataSource, MatSort, Sort, MatDialog, MatSnackBar, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { ConfirmMessageComponent } from '../confirm-message/confirm-message.component';
import { ApplicationStateService } from 'src/app/application-state.service';
export interface data {
  id: number;
  value: string;
}
@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})

export class UsersComponent implements OnInit {
  id: string
  tableMsg: string;
  showTable: any
  userDetails: any = {
    user_id: '',
    user_name: '',
    password: '',
    updated_date: '',
  };
  roles: any
  screen: boolean = false;
  users: MatTableDataSource<any>;
  displayedColumns: string[] = ['user_id', 'user_name', 'email_id', 'emp_group', 'role_id', 'action'];
  @HostBinding('class') classes = 'row';
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(public dialog: MatDialog, private adminService: AdminService, private router: Router,
    private activatedRoute: ActivatedRoute, private snackBar: MatSnackBar,
    private applicationStateService: ApplicationStateService) {
  }

  ngOnInit() {
    this.roles = {}
    this.getRoles();
    this.getusers();
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

  getRoles() {
    this.adminService.getRoles().subscribe(
      res => {
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          res = res['data']
          var keys = Object.keys(res);
          var len = keys.length;
          for (var i = 0; i < len; i++) {
            this.roles['' + res[i]['role_id']] = res[i]['role_name']
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

  getusers() {
    this.adminService.getusers().subscribe(
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
          this.users = new MatTableDataSource(res as {
            user_id: '',
            user_name: '',
            email_id: '',
            emp_group: '',
            role_id: ''
          }[]);
          this.users.sort = this.sort;
          const sortState: Sort = { active: 'user_name', direction: 'asc' };
          this.sort.active = sortState.active;
          this.sort.direction = sortState.direction;
          this.sort.sortChange.emit(sortState);
          this.users.paginator = this.paginator;
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      err => console.error(err)
    );
  }

  applyUsersFilter(filterValue: string) {
    this.users.filter = filterValue.trim().toLowerCase();
  }

  editUser(userid) {
    var id = userid
    this.router.navigate(['timesheet/admin/users/edit/' + id]);
  }

  deleteUser(userDetails): void {
    const dialogRef = this.dialog.open(ConfirmMessageComponent, {
      width: '250px',
      data: { id: userDetails.user_name, name: userDetails.user_name }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result != undefined) {
        this.users = new MatTableDataSource();
        this.id = userDetails.user_id
        this.adminService.deleteUser(this.id, {})
          .subscribe(
            res => {
              if (res['statusCode'] == 200) {
                this.openSnackBar("User is deleted successfully")
                setTimeout(() => {
                }, 100)
                this.getusers()
                this.paginator._changePageSize(this.paginator.pageSize);
                this.users.sort = this.sort;
                this.users.paginator = this.paginator;
              }
              else {
                this.openSnackBar("Error Occured while deleting use4r")
                setTimeout(() => {
                }, 1000)
              }
            },
            err => console.error(err)
          )
      }
    });
    return
  }
}
