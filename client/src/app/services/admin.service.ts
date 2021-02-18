import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { HttpParams } from "@angular/common/http";
import { Observable } from 'rxjs';
import * as _moment from 'moment';

const moment = _moment;

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  //API_URI = 'http://localhost:3000/api';
  //${this.API_URI}
  constructor(private http: HttpClient) { }

  getServerTime() {
    return this.http.get(`/api/common/getServerTime`);
  }

  //users
  getusers() {
    return this.http.get(`/api/admin/allusers`);
  }

  getuser(id: string) {
    return this.http.get(`/api/admin/oneuser/${id}`);
  }

  saveNewUser(user: any) {
    return this.http.post(`/api/admin/adduser`, user);
  }
  updateUser(id: string | number, updatedUser: any): Observable<any> {
    return this.http.put(`/api/admin/updateuser/${id}`, updatedUser);
  }

  deleteUser(id: string | number, deletedUser: any): Observable<any> {
    return this.http.put(`/api/admin/deleteuser/${id}`, deletedUser);
  }


  //projects
  getProjects(id: any, role: any) {
    return this.http.get(`/api/admin/allprojects/${id}/${role}`);
  }

  //remove below function
  getSpecificProjects(id: any, role: any) {
    return this.http.get(`/api/admin/getSpecificProjects/${id}/${role}`);
  }

  getProject(id: number) {
    return this.http.get(`/api/admin/oneproject/${id}`);
  }

  getServiceLines() {
    return this.http.get(`/api/admin/getServiceLines`);
  }
  getProTypes() {
    return this.http.get(`/api/admin/getProTypes`);
  }
  getLatestProiD(custId: any, PtypeId: any) {
    return this.http.get(`/api/admin/getLatestProiD/${custId}/${PtypeId}`);
  }

  getAllProjCatg(){
    return this.http.get(`/api/admin/getAllProjCatg`);
  }

  getAllCustomerNames() {
    return this.http.get(`/api/admin/getAllCustomerNames`);
  }
  getverifiedPro(uid: any, pid: any) {
    return this.http.get(`/api/admin/getverifiedPro/${uid}/${pid}`);
  }

  getProjectManagers() {
    return this.http.get(`/api/admin/getProjManagers`);
  }

  saveNewProject(project: any) {
    return this.http.post(`/api/admin/addproject`, project);
  }

  updateProject(id: string | number, updatedProject: any): Observable<any> {
    return this.http.put(`/api/admin/projects/${id}`, updatedProject);
  }
  deleteProject(id: number, deletedproject: any): Observable<any> {
    return this.http.put(`/api/admin/deleteproject/${id}`, deletedproject);
  }
  //roles
  getRoles() {
    return this.http.get(`/api/admin/roles`);
  }

  //mapping
  getuserMap(id: string) {
    return this.http.get(`/api/admin/getusermap/${id}`);
  }

  mapProToUser(jsonObj) {
    return this.http.put(`/api/admin/mapProToUser/${jsonObj.user_id}`, jsonObj);
  }

  //Unmapping
  getuserunmap(id: string) {
    return this.http.get(`/api/admin/getuserunmap/${id}`);
  }

  unmapProToUser(jsonObj) {
    return this.http.put(`/api/admin/unmapProToUser/${jsonObj.user_id}`, jsonObj);
  }

  updateProjects(nonDbProj: any[]) {
    var id = nonDbProj[0]['user_id']
    return this.http.put(`/api/admin/updateProjects/${id}`, nonDbProj);
  }

  updateProjectsStatustoZero(selectedproject: any) {
    var id = selectedproject['id']
    return this.http.put(`/api/admin/updateProjectToZero/${id}`, selectedproject);
  }

  //timesheets

  getData(jsonObj) {
    return this.http.post(`/api/admin/getData/`, jsonObj);
  }
  getSpecData(jsonObj) {
    return this.http.post(`/api/admin/getSpecData/`, jsonObj);
  }
  //customers
  getAllCustomers() {
    return this.http.get(`/api/admin/getAllCustomers/`);
  }

  getSinglecustomer(id: string) {
    return this.http.get(`/api/admin/getOneCustomer/${id}`);
  }

  updateCustomer(customer) {
    return this.http.post(`/api/admin/updateCustomer`, customer);
  }

  // Add new customer
  addNewCustomer(customer: any) {
    return this.http.post(`/api/admin/addNewCustomer`, customer);
  }

  deleteCustomer() {
  }

  PlannedDataSubmit(customer) {
    return this.http.post(`/api/projectPlan/getProjectPlan`, customer);
  }
  savePlannedData(id: string, customer: any) {
    return this.http.post(`/api/projectPlan/assignHours`, customer);
  }
  PlannedAllDataSubmit(customer: any) {
    return this.http.post(`/api/projectPlan/getProjectPlan`, customer);//dummy
    // return this.http.post(`/api/projectPlan/getPlanningData`, customer);//original
  }
  
  getAdminSummaryReport(jsonObj: any) {
    return this.http.post(`/api/report/getAdminSummaryReport`, jsonObj);
  }
  getAdminDetailedReport(jsonObj: any) {
    return this.http.post(`/api/report/getAdminDetailedReport`, jsonObj);
  }  
  getAdminAvailableReport(jsonObj: any) {
    return this.http.post(`/api/report/getAdminAvailableReport`, jsonObj);
  }
  getUserSummaryReport(jsonObj: any) {
    return this.http.post(`/api/report/getUserTimesheetSummary`, jsonObj);
  }
  getUserProjectReport(jsonObj: any) {
    return this.http.post(`/api/report/getUserProjectSummary`, jsonObj);
  }
  getManagerReport(jsonObj: any) {
    return this.http.post(`/api/report/getManagerReport`, jsonObj);
  }
}
