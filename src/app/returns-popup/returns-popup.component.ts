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

  close() {
    const returnStateId = Number(this.returnState.nativeElement.value);
    if (returnStateId !== 0) {
      const toName = this.message.paths.filter(a => a.toStateId === returnStateId)[0].toName;
      const dialogRef = this.dialog.open(FieldDialogComponent, {
        data: { title: "Return to <strong>" + toName + "</strong>", btnMain: "Continue", btnSecondary: "Not Now" },
        panelClass: "center-class",
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.dialogRef.close({ toStateId: returnStateId });
        } else {
          this.dialogRef.close({ toStateId: 0 });
        }
      });
    } else {
      this.dialogRef.close({ toStateId: 0 });
    }

  }
}
