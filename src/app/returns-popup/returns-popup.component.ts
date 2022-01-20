import { FieldDialogComponent } from './../components/field-dialog/field-dialog.component';
import { MatDialog } from '@angular/material';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-returns-popup',
  templateUrl: './returns-popup.component.html',
  styleUrls: ['./returns-popup.component.scss']
})
export class ReturnsPopupComponent implements OnInit {

  @ViewChild("returnState") returnState: ElementRef;
  prompt = false;
  selectedState = 0;
  title: string;

  constructor(public dialogRef: MatDialogRef<ReturnsPopupComponent>
    , @Inject(MAT_DIALOG_DATA) public message: any, private dialog: MatDialog) {
    this.dialogRef.disableClose = true;
  }

  ngOnInit() {
  }

  moveTo(stateId) {
    this.dialogRef.close({ toStateId: stateId });
  }

  getToStateOwner(stateId) {
    const user = this.message.workflows.filter(a => a.stateId === stateId)[0].assignmentUser;
    return user.firstName + ' ' + user.lastName;
  }

  dismiss() {
    this.selectedState = 0;
    this.close();
  }


  close() {
    if (this.selectedState !== 0) {
      this.prompt = true;
      this.dialogRef.close({ toStateId: this.selectedState });
    } else {
      this.dialogRef.close({ toStateId: 0 });
    }

  }

  selectionChanged(ev) {
    this.selectedState = Number(ev.currentTarget.value);
    this.prompt = (this.selectedState !== 0);
    if (this.prompt) {
      this.title = "Send modification request to <span class='text-header'>" + this.message.paths.filter(a => a.fromStateId === this.selectedState)[0].fromName + "</span><span class='text-subheader'> [" + this.getToStateOwner(this.selectedState) + "]";
    } else {
      this.title = undefined;
    }
  }
}
