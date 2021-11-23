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

  constructor(
    public dialogRef: MatDialogRef<GranthistoryComponent>
    , @Inject(MAT_DIALOG_DATA) public data: any
    , private http: HttpClient
    , private renderer: Renderer2
    , @Inject(ElementRef) er: ElementRef
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
      const url = '/api/user/' + JSON.parse(localStorage.getItem('USER')).id + '/grant/' + this.data.data.id + '/history/';

      this.http.get<GrantHistory[]>(url, httpOptions).subscribe((history: GrantHistory[]) => {
        this.grantHistory = history;
      });
    } else if (this.data.type === 'report') {
      const url = '/api/user/' + JSON.parse(localStorage.getItem('USER')).id + '/report/' + this.data.data.id + '/history/';

      this.http.get<ReportHistory[]>(url, httpOptions).subscribe((history: ReportHistory[]) => {
        this.reportHistory = history;
      });
    } else if (this.data.type === 'disbursement') {
      const url = '/api/user/' + JSON.parse(localStorage.getItem('USER')).id + '/disbursements/' + this.data.data.id + '/history/';

      this.http.get<DisbursementHistory[]>(url, httpOptions).subscribe((history: DisbursementHistory[]) => {
        this.disbursementHistory = history;
      });
    } else if (this.data.type === 'grant-closure') {
      const url = '/api/user/' + JSON.parse(localStorage.getItem('USER')).id + '/closure/' + this.data.data.id + '/history/';

      this.http.get<ClosureHistory[]>(url, httpOptions).subscribe((history: ClosureHistory[]) => {
        this.closureHistory = history;
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
}
