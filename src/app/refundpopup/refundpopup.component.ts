import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-refundpopup',
  templateUrl: './refundpopup.component.html',
  styleUrls: ['./refundpopup.component.scss']
})
export class RefundpopupComponent implements OnInit {

  @ViewChild("refundAmount") refundAmount: ElementRef;
  @ViewChild("refundReason") refundReason: ElementRef;

  constructor(public dialogRef: MatDialogRef<RefundpopupComponent>
    , @Inject(MAT_DIALOG_DATA) public message: any) { }

  ngOnInit() {
  }

  onYesClick() {
    this.dialogRef.close({ status: true, amount: this.refundAmount.nativeElement.value, reason: this.refundReason.nativeElement.value });
  }

  onNoClick() {
    this.dialogRef.close({ status: false });
  }
}
