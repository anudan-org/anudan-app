import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ClosureReason } from '../../model/user'
import { AppComponent } from '../../app.component';
import { AppSetting } from '../../model/setting';
import { MatDialog } from '@angular/material';
import { FieldDialogComponent } from 'app/components/field-dialog/field-dialog.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-closure-reasons',
  templateUrl: './closure-reasons.component.html',
  styleUrls: ['./closure-reasons.component.scss']
})
export class ClosureReasonsComponent implements OnInit {

  @Input('reasons') reasons: ClosureReason[];
  focusField: any;
  reasonName: string;
  roleDescription: string;
  reasonExists: boolean = false;
  existingReason: ClosureReason;


  appSettings: AppSetting[]
  @ViewChild('createClosureReasonBtn') createClosureReasonBtn: ElementRef;
  constructor(
    private http: HttpClient,
    private appComponent: AppComponent,
    private dialog: MatDialog,
    private toastr: ToastrService,
  ) { }

  ngOnInit() {
    console.log("ngOnit");
  }

  canCreateRole() {
    if ((this.reasonName !== undefined && this.reasonName.trim() !== '') && !this.existingReason) {
      return false;
    } else {
      return true;
    }

  }

  createNewReason() {

    if (!this.reasons) {
      this.reasons = [];
    }
    const reason = new ClosureReason();
    reason.id = 0;
    reason.reason = '';
    reason.editMode = true;
    this.reasons.unshift(reason);
    this.toggleCreateClosureReason();
    this.focusField = '#reason_' + reason.id;
  }

  toggleCreateClosureReason() {
    const createClosureReasonButton = this.createClosureReasonBtn.nativeElement;
    if (createClosureReasonButton.disabled) {
      createClosureReasonButton.disabled = false;
    } else if (!createClosureReasonButton.disabled) {
      createClosureReasonButton.disabled = true;
    }
  }

  saveReason() {

    const reasonName = $("#reasonName");
    if (reasonName.val().trim() === "") {
      this.toastr.error("Closure Reason cannot be left blank", "Warning");
      reasonName.focus();
      return;
    }
    let repeatName = false;
    for (let reasonRecord of this.reasons) {
      if (reasonRecord.reason.replace(' ', '').toLowerCase() === reasonName.val().trim().replace(' ', '').toLowerCase()) {
        repeatName = true;
        break;
      }
    }
    if (repeatName) {
      this.toastr.error("Closure Reason already exists, Please select a different Reason", "Warning");
      reasonName.focus();
      return;
    }


    if (!this.reasons) {
      this.reasons = [];
    }
    let reason = new ClosureReason();
    reason.id = 0;
    reason.reason = this.reasonName;
    reason.editMode = true;
    reason.editMode = false;

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    const user = this.appComponent.loggedInUser;
    const url =
      "/api/admin/user/" + user.id + "/reason";
    this.http.put(url, reason, httpOptions).subscribe((reasonReturned: ClosureReason) => {
      reason = reasonReturned;
      this.reasons.unshift(reason);
      this.reasonName = undefined;
    });
  }

  cancelEdit(reason: ClosureReason) {
    reason.editMode = false;
    if (reason.id === 0) {
      const index = this.reasons.findIndex(r => r.id === reason.id);
      this.reasons.splice(index, 1);
    }
    $('#closure_' + reason.id).css('background', '#fff');
    this.toggleCreateClosureReason();
  }

  deleteReason(reason) {
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: 'Are you sure you want to delete Closure Reason ' + reason.reason, btnMain: "Delete Closure Reason", btnSecondary: "Not Now" }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const httpOptions = {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
            'Authorization': localStorage.getItem('AUTH_TOKEN')
          })
        };
        const user = this.appComponent.loggedInUser;
        const url = "/api/admin/user/" + user.id + "/reason/" + reason.id;
        this.http.delete(url, httpOptions).subscribe((updatedList: ClosureReason[]) => {
          this.reasons = updatedList;
        });
      }
    });
  }

  updateReason(reason: ClosureReason) {
    if (!this.reasons) {
      this.reasons = [];
    }


    const reasonName = reason.reason;
    const id = reason.id;

    if (reasonName.trim() === "") {
      this.toastr.error("Closure Reason cannot be left blank", "Warning");
      return;
    }
    let repeatName = false;
    for (let reasonRecord of this.reasons) {
      if (reasonRecord.reason.replace(' ', '').toLowerCase() === reasonName.trim().replace(' ', '').toLowerCase() && id != reasonRecord.id) {
        repeatName = true;
        break;
      }
    }
    if (repeatName) {
      this.toastr.error("Closure Reason already exists, Please select a different Reason", "Warning");
      return;
    }


    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    const user = this.appComponent.loggedInUser;
    const url =
      "/api/admin/user/" + user.id + "/reason";
    this.http.put(url, reason, httpOptions).subscribe((reasonReturned: ClosureReason) => {
      reason = reasonReturned;
      reason.editMode = false;
      const index = this.reasons.findIndex(r => r.id === reasonReturned.id);
      this.reasons[index] = reason;
      this.reasonName = undefined;
    });
  }

  editReason(reason: ClosureReason, evt: Event) {
    reason.editMode = true;
    $('#closure_' + reason.id).css('background', '#f6f6f6')
  }




}
