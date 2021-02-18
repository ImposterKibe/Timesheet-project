import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApplicationStateService {

  private isMobileResolution: boolean;

  constructor() {
    //console.log(window.innerWidth)
    //this.isMobileResolution = false;
    //768
    if (window.innerWidth <= 768) {
      this.isMobileResolution = true;
    } else {
      this.isMobileResolution = false;
    }
  }

  public getIsMobileResolution(): boolean {
    //console.log(this.isMobileResolution)
    return this.isMobileResolution;
  }
}