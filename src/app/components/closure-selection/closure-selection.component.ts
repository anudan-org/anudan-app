import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-closure-selection',
  templateUrl: './closure-selection.component.html',
  styleUrls: ['./closure-selection.component.scss']
})
export class ClosureSelectionComponent implements OnInit {

  @ViewChild("closureSelection") closureSelection: ElementRef;

  constructor(public dialogRef: MatDialogRef<ClosureSelectionComponent>
    , @Inject(MAT_DIALOG_DATA) public message: any) {
    dialogRef.disableClose = true;
  }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }



}
