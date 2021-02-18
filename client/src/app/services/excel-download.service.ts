import { Injectable } from '@angular/core';
import { TimesheetService } from './timesheet.service';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';
@Injectable()
@Injectable({
  providedIn: 'root'
})
export class ExcelDownloadService {
  date: string;
  constructor(private timesheetService: TimesheetService) {
    this.getServerTime();
  }
  public exportAsExcelFile(json: any[], excelFileName: string): void {
    var tempName=excelFileName.split(' ').join('')
    var sheetsJson:any={},sheetNamesjSON:any=[]    
    sheetNamesjSON.push(''+tempName)
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    sheetsJson[''+tempName]=worksheet
    const workbook: XLSX.WorkBook = { Sheets: sheetsJson, SheetNames: sheetNamesjSON };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }
  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, fileName + '_' + this.date + EXCEL_EXTENSION);
  }
  getServerTime() {
    this.timesheetService.getServerTime().subscribe(
      res => {
        this.date = res['datevalue']
      },
      err => console.log(err)
    );
  }
}
