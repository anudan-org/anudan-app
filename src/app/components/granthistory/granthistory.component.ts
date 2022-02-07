import { UtilsService } from './../../utils.service';
import { WorkflowDataService } from 'app/workflow.data.service';
import { WorkflowStatus } from './../../model/dahsboard';
import { ClosureHistory } from './../../model/closures';
import { Component, Inject, OnInit, ViewChild, ElementRef, Renderer2, HostListener } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatButtonModule } from '@angular/material';
import { Grant, GrantHistory } from '../../model/dahsboard';
import { ReportHistory } from '../../model/report';
import { WorkflowTransition } from '../../model/workflow-transition';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { DisbursementHistory } from 'app/model/disbursement';

declare var $: any;
declare var jsPlumb: any;


@Component({
  selector: 'app-granthistory-dialog',
  templateUrl: './granthistory.component.html',
  styleUrls: ['./granthistory.component.scss'],
  styles: [`
      ::ng-deep .grant-notes-class .mat-dialog-container{
          overflow-y: hidden !important;
          border-radius: 0 !important;
          height: calc(100vh - 114px) !important;
      }
  `]
})
export class GranthistoryComponent implements OnInit {

  grantHistory: GrantHistory[] = [];
  reportHistory: ReportHistory[] = [];
  disbursementHistory: DisbursementHistory[] = [];
  closureHistory: ClosureHistory[] = [];
  transitions: WorkflowTransition[];
  title: string;

  constructor(
    public dialogRef: MatDialogRef<GranthistoryComponent>
    , @Inject(MAT_DIALOG_DATA) public data: any
    , private http: HttpClient
    , private renderer: Renderer2
    , @Inject(ElementRef) er: ElementRef
    , private workflowDataService: WorkflowDataService
    , private utils: UtilsService
  ) {
    this.dialogRef.disableClose = true;
  }

  ngOnInit() {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    if (this.data.type === 'grant') {
      let url = '/api/user/' + JSON.parse(localStorage.getItem('USER')).id + '/grant/' + this.data.data.id + '/history/';

      this.http.get<GrantHistory[]>(url, httpOptions).subscribe((history: GrantHistory[]) => {

        url = '/api/admin/workflow/grant/' + this.data.data.id + '/user/' + JSON.parse(localStorage.getItem('USER')).id;

        this.http.get<WorkflowTransition[]>(url, httpOptions).subscribe((transitions: WorkflowTransition[]) => {
          this.transitions = transitions;
          this.grantHistory = history;
          this.title = `<p class="mb-0 text-subheader text-center">Grant Workflow Notes | ` + this.utils.getGrantTypeName(this.data.data.grantTypeId) + `<p class='text-header text-center'>` + ((this.data.data.grantStatus.internalStatus === 'ACTIVE' || this.data.data.grantStatus.internalStatus === 'CLOSED') ? `<span class="text-subheader">[` + this.data.data.referenceNo + `] </span>` : ``) + this.data.data.name + `</p>`;
        });


      });
    } else if (this.data.type === 'report') {
      let url = '/api/user/' + JSON.parse(localStorage.getItem('USER')).id + '/report/' + this.data.data.id + '/history/';

      this.http.get<ReportHistory[]>(url, httpOptions).subscribe((history: ReportHistory[]) => {

        url = '/api/admin/workflow/report/' + this.data.data.id + '/user/' + JSON.parse(localStorage.getItem('USER')).id;

        this.http.get<WorkflowTransition[]>(url, httpOptions).subscribe((transitions: WorkflowTransition[]) => {
          this.transitions = transitions;
          this.reportHistory = history;
          this.title = `<p class="mb-0 text-subheader text-center">Report Workflow Notes | ` + this.utils.getGrantTypeName(this.data.data.grant.grantTypeId) + `<p class="mb-0 lh-12 text-center"><span class='text-header'>` + this.data.data.name + `</span></p><p class="mb-1 lh-20 text-center"><span class="text-subheader">` + ((this.data.data.grant.grantStatus.internalStatus === 'ACTIVE' || this.data.data.grant.grantStatus.internalStatus === 'CLOSED') ? `<span class="text-subheader">[` + this.data.data.grant.referenceNo + `] </span>` : ``) + this.data.data.grant.name + `</span></p>`;
        });

      });
    } else if (this.data.type === 'disbursement') {
      const url = '/api/user/' + JSON.parse(localStorage.getItem('USER')).id + '/disbursements/' + this.data.data.id + '/history/';

      this.http.get<DisbursementHistory[]>(url, httpOptions).subscribe((history: DisbursementHistory[]) => {

        this.workflowDataService.getDisbursementWorkflow(this.data.data).then(transitions => {

          this.transitions = transitions;
          this.disbursementHistory = history;
          this.title = `<p class="mb-0 text-subheader text-center">Disbursement Approval Workflow Notes | ` + this.utils.getGrantTypeName(this.data.data.grant.grantTypeId) + `</p><p class="mb-1 lh-20 text-center"><span class="text-header text-center">` + ((this.data.data.grant.grantStatus.internalStatus === 'ACTIVE' || this.data.data.grant.grantStatus.internalStatus === 'CLOSED') ? `<span class="text-subheader">[` + this.data.data.grant.referenceNo + `] </span>` : ``) + this.data.data.grant.name + `</span></p>`;
        });

      });
    } else if (this.data.type === 'grant-closure') {
      let url = '/api/user/' + JSON.parse(localStorage.getItem('USER')).id + '/closure/' + this.data.data.id + '/history/';

      this.http.get<ClosureHistory[]>(url, httpOptions).subscribe((history: ClosureHistory[]) => {
        url = '/api/admin/workflow/closure/' + this.data.data.id + '/user/' + JSON.parse(localStorage.getItem('USER')).id;
        this.http.get<WorkflowTransition[]>(url, httpOptions).subscribe((transitions: WorkflowTransition[]) => {
          this.closureHistory = history;
          this.transitions = transitions;
          this.title = `<p class="mb-0 text-subheader text-center">Disbursement Approval Workflow Notes | ` + this.utils.getGrantTypeName(this.data.data.grant.grantTypeId) + `</p><p class="mb-1 lh-20 text-center"><span class="text-header text-center">` + ((this.data.data.grant.grantStatus.internalStatus === 'ACTIVE' || this.data.data.grant.grantStatus.internalStatus === 'CLOSED') ? `<span class="text-subheader">[` + this.data.data.grant.referenceNo + `] </span>` : ``) + this.data.data.grant.name + `</span></p>`;

        });

      });
    }


  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(false);
  }
  ngAfterViewInit() {
    //Added new comment again
  }

  getPreviousStatus(idx, _for) {
    let status;
    if (_for === 'grant') {
      status = this.grantHistory[idx - 1];
      if (status) {
        return status.grantStatus;
      } else {
        const newStatus = new WorkflowStatus();
        newStatus.name = this.data.data.grantStatus.name;
        newStatus.internalStatus = this.data.data.grantStatus.internalStatus;
        return newStatus;
      }
    } else if (_for === 'report') {
      status = this.reportHistory[idx - 1];
      if (status) {
        return status.status;
      } else {
        const newStatus = new WorkflowStatus();
        newStatus.name = this.data.data.status.name;
        newStatus.internalStatus = this.data.data.status.internalStatus;
        return newStatus;
      }
    } else if (_for === 'disbursement') {
      status = this.disbursementHistory[idx - 1];
      if (status) {
        return status.status;
      } else {
        const newStatus = new WorkflowStatus();
        newStatus.name = this.data.data.status.name;
        newStatus.internalStatus = this.data.data.status.internalStatus;
        return newStatus;
      }
    } else if (_for === 'closure') {
      status = this.closureHistory[idx - 1];
      if (status) {
        return status.status;
      } else {
        const newStatus = new WorkflowStatus();
        newStatus.name = this.data.data.status.name;
        newStatus.internalStatus = this.data.data.status.internalStatus;
        return newStatus;
      }
    }
  }

  getDirection(fromId, toId, _for) {
    if (!toId) {
      if (_for === 'grant') {
        toId = this.data.data.grantStatus.id
      } else if (_for === 'report') {
        toId = this.data.data.status.id
      } if (_for === 'disbursement') {
        toId = this.data.data.status.id
      } else if (_for === 'closure') {
        toId = this.data.data.status.id
      }

    }
    const entry = this.transitions.filter(a => a.fromStateId === fromId && a.toStateId === toId);
    return entry.length > 0 ? 'fas fa-long-arrow-alt-right text-light-green' : 'fas fa-long-arrow-alt-right text-light-red';
  }

  getPreviousOwner(idx, _for) {
    if (_for === 'grant') {
      const status = this.grantHistory[idx];
      if (status) {
        const ass = this.data.data.workflowAssignments.filter(a => a.stateId === status.grantStatus.id)[0];
        if (ass) {
          return '&nbsp;';//ass.assignmentUser.firstName + ' ' + ass.assignmentUser.lastName;
        } else {
          return '&nbsp;';
        }

      } else {
        const currentAss = this.data.data.workflowAssignments.filter(a => a.stateId === this.data.data.grantStatus.id)[0].assignmentUser;
        return '&nbsp;';//currentAss.firstName + ' ' + currentAss.lastName;
      }
    } else if (_for === 'report') {
      const status = this.reportHistory[idx];
      if (status) {
        const ass = this.data.data.workflowAssignments.filter(a => a.stateId === status.status.id)[0];
        if (ass) {
          return '&nbsp;';//ass.assignmentUser.firstName + ' ' + ass.assignmentUser.lastName;
        } else {
          return '&nbsp;';
        }

      } else {

        const currentAss = this.data.data.workflowAssignments.filter(a => a.stateId === this.data.data.status.id)[0].assignmentUser;
        return '&nbsp;';//currentAss.firstName + ' ' + currentAss.lastName;
      }
    } else if (_for === 'disbursement') {
      const status = this.disbursementHistory[idx];
      if (status) {
        const ass = this.data.data.assignments.filter(a => a.stateId === status.status.id)[0];
        if (ass) {
          return '&nbsp;';//ass.assignmentUser.firstName + ' ' + ass.assignmentUser.lastName;
        } else {
          return '&nbsp;';
        }

      } else {

        const currentAss = this.data.data.assignments.filter(a => a.stateId === this.data.data.status.id)[0].assignmentUser;
        return '&nbsp;';//currentAss.firstName + ' ' + currentAss.lastName;
      }
    } else if (_for === 'closure') {
      const status = this.closureHistory[idx];
      if (status) {
        const ass = this.data.data.workflowAssignment.filter(a => a.stateId === status.status.id)[0];
        if (ass) {
          return '&nbsp;';//ass.assignmentUser.firstName + ' ' + ass.assignmentUser.lastName;
        } else {
          return '&nbsp;';
        }

      } else {

        const currentAss = this.data.data.workflowAssignment.filter(a => a.stateId === this.data.data.status.id)[0].assignmentUser;
        return '&nbsp;';//currentAss.firstName + ' ' + currentAss.lastName;
      }
    }

  }
}
