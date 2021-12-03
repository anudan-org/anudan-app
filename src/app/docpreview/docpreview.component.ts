import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Component, OnInit, Inject } from '@angular/core';

@Component({
  selector: 'app-docpreview',
  templateUrl: './docpreview.component.html',
  styleUrls: ['./docpreview.component.scss']
})
export class DocpreviewComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<DocpreviewComponent>
    , @Inject(MAT_DIALOG_DATA) public message: any) {
    console.log(message.url)
  }

  ngOnInit() {
    //Intentionally left bblank
  }

  onNoClick() {
    this.dialogRef.close(false);
  }
}


