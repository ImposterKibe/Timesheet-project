import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
export interface Data {
  id: number;
  name: string;
}
@Component({
  selector: 'app-confirm-message',
  templateUrl: './confirm-message.component.html',
  styleUrls: ['./confirm-message.component.scss']
})
export class ConfirmMessageComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ConfirmMessageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Data) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    document.getElementById("ans").innerHTML =
      "Do you want to Delete " + this.data.name + " ?";
  }

}
