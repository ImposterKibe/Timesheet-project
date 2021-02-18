import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from 'src/app/services/admin.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { getDateStrFromDateObj } from '../../../helper/clientCommonFunction'


export interface role {
  value: string,
  roleid: number
}
@Component({
  selector: 'app-add-customer',
  templateUrl: './add-customer.component.html',
  styleUrls: ['./add-customer.component.scss']
})
export class AddCustomerComponent implements OnInit {
  customerForm: FormGroup;
  submitted = false;
  roleid: number;
  date: any;
  access: boolean;
  roles: role[] = [
  ];
  reqBid: number
  customer: any = {
    customer_code: '',
    name: '',
    description: '',
    status: false,
    country: '',
    city: '',
    mail: '',
    fax: '',
    phone: '',
    mobile: '',
    updated_date: '',
    created_date: ''
  };
  edit: boolean
  bussUnitArr: any
  selectedItem;

  constructor(private adminService: AdminService,
    private router: Router,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar) {
    this.getServerTime();
  }
  openSnackBar(message, dur) {
    this.snackBar.open(message, "Close", {
      duration: dur,
    });
  }

  ngOnInit() {
    this.bussUnitArr = []
    this.getAllServiceLines()
    this.access = true
    this.customerForm = this.formBuilder.group({
      bussUnit: ['', Validators.required],
      customerCode: ['', Validators.required],
      customername: ['', Validators.required],
      description: [''],
    });
    this.edit = false;
    const params = this.activatedRoute.snapshot.params;
    if (params.id) {
      this.adminService.getSinglecustomer(params.id)
        .subscribe(
          res => {
            if (res['statusCode'] == undefined || res['statusCode'] == "200") {
              res = res['data']
              this.customer = res[0]
              //console.log("customer is ", res)
              this.edit = true;
              this.access = false;
              this.reqBid = res[0]['BU_code']
              this.selectedItem = parseInt(res[0]['BU_code'])
              //console.log("user is ", this.bussUnitArr ,this.selectedItem);
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

  get f() { return this.customerForm.controls; }

  getAllServiceLines() {
    this.adminService.getServiceLines().subscribe(
      res => {
        //console.log("Res",res)
        if (res['statusCode'] == undefined || res['statusCode'] == "200") {
          res = res['data']
          this.bussUnitArr = res
          //console.log("this.bussUnitArr", this.bussUnitArr);
        } if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      err => console.log(err)
    );
  }

  selectBuid(selectedBid) {
    this.reqBid = selectedBid
  }

  updatecustomer() {
    this.submitted = true;
    this.customerForm.controls.customerCode.clearValidators();
    this.customerForm.controls.customerCode.setErrors(null);
    this.customerForm.controls.customerCode.setValidators(null);
    if (this.customerForm.invalid) {
      return;
    }
    else {
      //console.log("this.customer is ", this.customer)
      this.customer.updated_date = this.date
      this.customer.BU_code = this.reqBid
      this.adminService.updateCustomer(this.customer)
        .subscribe(
          res => {
            if (res['statusCode'] == undefined || res['statusCode'] == "200") {
              //console.log("res from update customer is ", res);
              this.openSnackBar("customer is updated successfully", 5000)
              setTimeout(() => {
                this.router.navigate(['/timesheet/admin/customer']);
              }, 500)
            }
            if (res['statusCode'] == undefined || res['statusCode'] == "500") {
              this.openSnackBar("Error occured while updating customer", 5000)
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

  addNewCustomer() {
    //console.log("this.customerForm.invalid is ", this.customerForm.invalid)
    this.submitted = true;
    if (this.customerForm.invalid) {
      return;
    }
    else {
      // this.customer.role_id = this.roleid;
      this.customer.BU_code = this.reqBid
      //console.log(this.customer)
      this.adminService.addNewCustomer(this.customer)
        .subscribe(
          res => {
            if (res['statusCode'] == undefined || res['statusCode'] == "200") {
              //console.log(res);
              this.openSnackBar("customer is created successfully", 5000)
              setTimeout(() => {
                this.router.navigate(['/timesheet/admin/customer']);
              }, 500)
            }
            if (res['statusCode'] == undefined || res['statusCode'] == "501") {
              this.openSnackBar(res['message'], 5000)
            }
            if (res['statusCode'] == undefined || res['statusCode'] == "500") {
              this.openSnackBar("Error occured while creating customer", 5000)
            }
          },
          err => console.error(err)
        )
    }
  }

  getServerTime() {
    var dateObj = new Date();
    var dt: any = getDateStrFromDateObj(dateObj)
    this.date = dt
    return
  }

  checkCustomerCre(event: any, action) {
    if (event.key >= 'a' && event.key <= 'z') {
      return true;
    }
    else if (event.key >= 'A' && event.key <= 'Z') {
      return true;
    }
    if (action == "name") {
      if (event.which == 32) {
        return true;
      }
      else {
        event.preventDefault()
        return false
      }
    }
    if (action == "id") {
      if (event.which >= 48 && event.which <= 57) {
        return true;
      }
      else {
        event.preventDefault()
        return false
      }
    }
    else {
      event.preventDefault()
      return false
    }
  }
}
