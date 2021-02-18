import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { Router } from '@angular/router'

import * as jwt_decode from 'jwt-decode'



export interface UserDetails {
  id: number
  first_name: string
  last_name: string
  email: string
  password: string
  exp: number
  iat: number
}

@Injectable()
export class AuthenticationService {
  private token: string
  public role: string

  constructor(private http: HttpClient, private router: Router) { }

  public getToken(): string {
    this.token = sessionStorage.getItem('token')
    return this.token
  }

  public getUserDetails(): UserDetails {
    const token = this.getToken()
    if (token == undefined) {
      return null
    }
    let payload
    if (token) {
      payload = token.split('.')[1]
      payload = window.atob(payload)
      return JSON.parse(payload)
    } else {
      return null
    }
  }

  public isLoggedIn(): boolean {
    const user = this.getUserDetails()
    if (user) {
      return user.exp > Date.now() / 1000
    } else {
      return false
    }
  }

  public getLocalStorage(): void {
    this.token = sessionStorage.getItem('token')
    if (this.token == undefined) {
      return
    }
    const decodedData = jwt_decode(this.token)
    sessionStorage.setItem('userid', decodedData['userid']);
    sessionStorage.setItem('uname', decodedData['uname']);
    sessionStorage.setItem('role', decodedData['role']);
    this.role = '' + decodedData['role']
  }

  public logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    const base = this.http.post('/api/common/logout', { tp: "user" })
      .subscribe(
        (data) => {
          //console.log("user logout succesfully")
        },
        (err) => {
          //console.log("logout error ",err)
        }
      );
    this.router.navigateByUrl('/')
  }

  public checkToken(token, urlContent): Observable<any> {
    return this.http.post(`/api/common/checkToken`, { "token": token, "urlContent": urlContent })
  }

  public getAllProjForReportOrPlanning(jsonObj:any): Observable<any> {
    return this.http.post(`/api/common/getAllProjForReportOrPlanning`, jsonObj)
  }

}
