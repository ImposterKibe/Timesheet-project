import { Component, OnInit, HostBinding, ViewChild } from '@angular/core';
import { MatPaginator, MatTableDataSource, MatSort, Sort } from '@angular/material';
import { AdminService } from 'src/app/services/admin.service';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { ApplicationStateService } from 'src/app/application-state.service';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss']
})
export class CustomerComponent implements OnInit {

  curstomersArr: MatTableDataSource<any>;
  displayedColumns: string[] = ['customer_code', 'name', 'description', 'action'];
  @HostBinding('class') classes = 'row';

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  screen: boolean = false;
  tableMsg: string;
  showTable: any

  constructor(private adminService: AdminService, private router: Router,
    private applicationStateService: ApplicationStateService) { }

  ngOnInit() {
    this.getAllCustomerDetails()
    this.showTable = true
    if (this.applicationStateService.getIsMobileResolution()) {
      this.screen = true
    }
    else
      this.screen = false
  }

  getAllCustomerDetails() {
    this.adminService.getAllCustomers().subscribe(
      res => {
        //console.log("res",res);
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          res = res['data']
          if (Object.keys(res).length == 0) {
            this.tableMsg = "No Data Available!"
            this.showTable = false
            return
          }
          this.tableMsg = ""
          this.showTable = true
          this.curstomersArr = new MatTableDataSource(res as {
            customer_code: '',
            name: '',
            description: '',
          }[]);
          this.curstomersArr.sort = this.sort;
          const sortState: Sort = { active: 'name', direction: 'asc' };
          this.sort.active = sortState.active;
          this.sort.direction = sortState.direction;
          this.sort.sortChange.emit(sortState);
          this.curstomersArr.paginator = this.paginator;
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      err => console.log(err)
    );
  }

  edit(custoCode) {
    this.router.navigate(['timesheet/admin/customer/edit/' + custoCode]);
  }

  applyCustomerFilter(filterValue: string) {
    this.curstomersArr.filter = filterValue.trim().toLowerCase();
  }
}
