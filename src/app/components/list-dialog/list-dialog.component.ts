import { DisbursementDataService } from 'app/disbursement.data.service';
import { Disbursement } from 'app/model/disbursement';
import { SingleReportDataService } from './../../single.report.data.service';
import { Router } from '@angular/router';
import { DataService } from './../../data.service';
import { ClosureDataService } from 'app/closure.data.service';
import { SearchFilterComponent } from 'app/layouts/admin-layout/search-filter/search-filter.component';
import { GrantDataService } from './../../grant.data.service';
import { UiUtilService } from '../../ui-util.service';
import { UpdateService } from '../../update.service';
import { AppComponent } from 'app/app.component';
import { ReportDataService } from '../../report.data.service';
import { FieldDialogComponent } from '../field-dialog/field-dialog.component';
import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatButtonModule } from '@angular/material';
import { Report, AdditionReportsModel } from '../../model/report';
import { Grant } from '../../model/dahsboard';
import { GrantClosure } from 'app/model/closures';

import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { CurrencyService } from 'app/currency-service';
import { MatDialog } from '@angular/material';
@Component({
  selector: 'app-list-dialog',
  templateUrl: './list-dialog.component.html',
  styleUrls: ['./list-dialog.component.scss'],
  providers: [AppComponent, UpdateService],
  styles: [`
    ::ng-deep .addnl-report-class{
      overflow: hidden !important;
    }
  `, `
    ::ng-deep .addnl-report-class .mat-dialog-container{
      border-radius: 0 !important;
      overflow: hidden !important;
      padding-top: 0 !important;
      height: calc(100vh - 114px);
    }
  `, `
    ::ng-deep .addnl-report-class .mat-form-field-wrapper{
      padding: 0 !important;
    }
  `, `
    ::ng-deep .addnl-report-class .mat-form-field-infix{
      border-top: none !important;
    }
  `, `
    ::ng-deep .addnl-report-class app-search-filter .mat-form-field-suffix{
      top: 0 !important;
    }
  `]
})
export class ListDialogComponent implements OnInit {

  _for: any;
  data: AdditionReportsModel
  appComp: AppComponent
  disbursements: any;
  reports: any;
  grants: any;
  closures: any;
  title; any;
  searchClosed = true;
  filterReady = false;
  filterCriteria: any;
  @ViewChild("appSearchFilter1") appSearchFilter1: SearchFilterComponent;
  filteredGrants: any;
  filteredClosures: any;
  deleteDisbursementEvent: boolean = false;

  otherReportsClicked: boolean = false;
  deleteReportsClicked: boolean = false;
  filteredReports: any;
  filteredDisbursements: any;
  deleteGrantEvent: boolean = false;
  deleteClosureClicked: boolean = false;

  subtitle: any;

  constructor(private dialog: MatDialog,
    private reportService: ReportDataService,
    public dialogRef: MatDialogRef<ListDialogComponent>
    , @Inject(MAT_DIALOG_DATA) public listMetaData: any
    , private http: HttpClient,
    public currenyService: CurrencyService,
    public uiService: UiUtilService,
    public grantService: GrantDataService,
    public dataService: DataService,
    public router: Router,
    private singleReportService: SingleReportDataService,
    private disbursementDataService: DisbursementDataService,
    public closureService: ClosureDataService
  ) {

    this.appComp = listMetaData.appComp;
    this._for = listMetaData._for;
    this.title = listMetaData.title;
    this.subtitle = listMetaData.subtitle;
    if (listMetaData._for === 'grant') {
      this.grants = listMetaData.grants;
      /* if (this.grants && this.grants.length > 0) {
        for (let g of this.grants) {
          grantService.changeMessage(g, this.appComp.loggedInUser.id);
        }
      } */
      this.filteredGrants = this.grants;
    } else if (listMetaData._for === 'closure') {
      this.closures = listMetaData.closures;
      this.filteredClosures = this.closures;
    }
    else if (listMetaData._for === 'report') {
      this.reports = listMetaData.reports;
      this.filteredReports = this.reports;
    } else if (listMetaData._for === 'disbursement') {
      this.disbursements = listMetaData.disbursements;
      this.filteredDisbursements = this.disbursements;
    }


    //this.selectedReports = this.futureReports.filter(r => r.grant.id===this.grantId);
  }

  ngOnInit() {

  }


  onNoClick(): void {
    this.dialogRef.close();
  }

  onYesClick(): void {
    this.dialogRef.close({ result: false });
  }


  getFormattedGrantAmount(amount: number) {
    let amtInWords = '-';
    if (amount) {
      amtInWords = this.currenyService.getFormattedAmount(amount);
    }
    return amtInWords;
  }

  getGrantAmountInWords(amount: number) {
    let amtInWords = '-';
    if (amount) {
      amtInWords = this.currenyService.getAmountInWords(amount);
    }
    return amtInWords;
  }



  public getGrantTypeName(typeId): string {
    return this.appComp.grantTypes.filter(t => t.id === typeId)[0].name;
  }

  public getGrantTypeColor(typeId): any {
    return this.appComp.grantTypes.filter(t => t.id === typeId)[0].colorCode;
  }

  isExternalGrant(grant: Grant): boolean {
    const grantType = this.appComp.grantTypes.filter(gt => gt.id === grant.grantTypeId)[0];
    if (!grantType.internal) {
      return true;
    } else {
      return false;
    }
  }

  openSearch() {
    if (this.searchClosed) {
      this.searchClosed = false;
    } else {
      this.searchClosed = true;
      this.appSearchFilter1.closeSearch();
    }
  }

  startFilter(val) {
    val = val.toLowerCase();
    this.filterCriteria = val;
    if (this._for === 'grant') {
      this.filteredGrants = this.grants.filter(g => {
        this.filterReady = true;
        return (
          (g.name && g.name.trim() !== '' && g.name.toLowerCase().includes(val)) ||
          //(g.organization && g.organization.name && g.organization.name.toLowerCase().includes(val)) ||
          (g.referenceNo && g.referenceNo.toLowerCase().includes(val)) ||
          (g.ownerName && g.ownerName.toLowerCase().includes(val))
        )
      });
    } else if (this._for === 'closure') {
      this.filteredClosures = this.closures.filter(g => {
        this.filterReady = true;
        return (
          (g.grant.name && g.grant.name.trim() !== '' && g.grant.name.toLowerCase().includes(val)) ||
          (g.grant.referenceNo && g.grant.referenceNo.toLowerCase().includes(val)) ||
          (g.ownerName && g.ownerName.toLowerCase().includes(val))
        )
      });
    } else if (this._for === 'report') {
      this.filteredReports = this.reports.filter(g => {
        this.filterReady = true;
        return (g.name && g.name.trim() !== '' && g.name.toLowerCase().includes(val)) ||
          (g.grant.name.toLowerCase().includes(val)) ||
          (g.grant.organization && g.grant.organization.name && g.grant.organization.name.toLowerCase().includes(val)) ||
          (g.grant.referenceNo && g.grant.referenceNo.toLowerCase().includes(val)) ||
          (g.ownerName && g.ownerName.toLowerCase().includes(val))
      });
    } else if (this._for === 'disbursement') {
      this.filteredDisbursements = this.disbursements.filter(g => {
        this.filterReady = true;
        return (g.grant.name.toLowerCase().includes(val)) ||
          (g.grant.organization && g.grant.organization.name && g.grant.organization.name.toLowerCase().includes(val)) ||
          (g.grant.referenceNo && g.grant.referenceNo.toLowerCase().includes(val)) ||
          (g.ownerName && g.ownerName.toLowerCase().includes(val))
      });
    }




  }

  closeSearch(ev: any) {
    this.searchClosed = ev;
  }

  resetFilterFlag(val) {
    this.filterReady = val;
  }

  manageGrant(grant: Grant) {
    if (this.deleteGrantEvent) {
      return;
    }

    this.appComp.subMenu = { name: "In-progress Grants", action: "dg" };
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      })
    };

    this.appComp.loggedIn = true;

    const url = "/api/user/" + this.appComp.loggedInUser.id + "/grant/" + grant.id;

    this.http.get(url, httpOptions).subscribe((grant: Grant) => {
      if (
        grant.workflowAssignments.filter(
          (wf) =>
            wf.stateId === grant.grantStatus.id &&
            wf.assignments === this.appComp.loggedInUser.id
        ).length > 0 &&
        this.appComp.loggedInUser.organization.organizationType !==
        "GRANTEE" &&
        grant.grantStatus.internalStatus !== "ACTIVE" &&
        grant.grantStatus.internalStatus !== "CLOSED"
      ) {
        grant.canManage = true;
      } else {
        grant.canManage = false;
      }
      this.dataService.changeMessage(grant.id);
      this.grantService.changeMessage(grant, this.appComp.loggedInUser.id);
      this.appComp.originalGrant = JSON.parse(JSON.stringify(grant));
      this.appComp.currentView = "grant";

      this.appComp.selectedTemplate = grant.grantTemplate;

      this.dialogRef.close();

      if (grant.canManage) {
        this.router.navigate(["grant/basic-details"]);
      } else {
        this.appComp.action = "preview";
        this.router.navigate(["grant/preview"]);
      }
    });

  }


  manageClosure(closure: GrantClosure) {
    if (this.deleteClosureClicked) {
      return;
    }
    this.appComp.subMenu = { name: "Active Grants", action: "ag" };
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    const user = JSON.parse(localStorage.getItem('USER'));
    let url = '/api/user/' + user.id + '/closure/' + closure.id;
    this.http.get<GrantClosure>(url, httpOptions).subscribe((closure1: GrantClosure) => {
      this.appComp.currentView = 'grant-closure';
      this.closureService.changeMessage(closure1, this.appComp.loggedInUser.id);
      this.dialogRef.close();
      if (closure1.canManage && closure1.status.internalStatus != 'CLOSED') {
        this.appComp.action = 'grant-closure';
        this.router.navigate(['grant-closure/header']);
      } else {
        this.appComp.action = 'grant-closure';
        this.router.navigate(['grant-closure/preview']);
      }
    });
  }

  getGrantsUnderClosure() {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    this.appComp.loggedIn = true;

    const url = "/api/user/" + this.appComp.loggedInUser.id + "/closure/";
    this.http.get<GrantClosure[]>(url, httpOptions).subscribe((closures: GrantClosure[]) => {
      this.closures = closures;
      this.filteredClosures = closures;
    });
  }

  deleteClosure(closure: GrantClosure) {
    this.deleteClosureClicked = true;
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: 'Are you sure you want to delete this closure request?', btnMain: "Delete Closure Request", btnSecondary: "Not Now" },
      panelClass: 'center-class'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.closureService.deleteClosure(closure)
          .then(() => {
            const index = this.closures.findIndex(r => r.id === closure.id);
            if (index >= 0) {
              this.closures.splice(index, 1);
            }
            this.filteredClosures = this.closures;
            if (this.closures && this.closures.length === 0) {
              this.onNoClick();
            }
          })
      } else {
        
        dialogRef.close();
      }
    });
  }

  manageReport(report: Report) {
    if (this.otherReportsClicked || this.deleteReportsClicked) {
      return;
    }
    this.appComp.subMenu = { name: 'Submitted Reports', action: 'sr' };

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    const user = JSON.parse(localStorage.getItem('USER'));
    let url = '/api/user/' + user.id + '/report/' + report.id;
    this.http.get<Report>(url, httpOptions).subscribe((report: Report) => {
      this.appComp.currentView = 'report';
      this.singleReportService.changeMessage(report);
      this.dialogRef.close();
      if (report.canManage && report.status.internalStatus != 'CLOSED') {
        this.appComp.action = 'report';
        this.router.navigate(['report/report-header']);
      } else {
        this.appComp.action = 'report';
        this.router.navigate(['report/report-preview']);
      }
    });
  }

  manageDisbursement(disbursement: Disbursement) {
    if (this.deleteDisbursementEvent) {
      return;
    }

    this.appComp.subMenu = { name: 'Approvals In-progress', action: 'id' };

    this.disbursementDataService.changeMessage(disbursement);
    this.dialogRef.close();
    if (disbursement.canManage) {
      this.router.navigate(['disbursement/approval-request']);
    } else {
      this.router.navigate(['disbursement/preview']);
    }
  }

  deleteReport(report: Report) {
    this.deleteReportsClicked = true;
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: 'Are you sure you want to delete this report?', btnMain: "Delete Report", btnSecondary: "Not Now" },
      panelClass: 'center-class'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reportService.deleteReport(report)
          .then(() => {
            let index = -1;
            if (this.reports !== undefined && this.reports !== null) {
              index = this.reports.findIndex(r => r.id === report.id);
              if (index >= 0) {
                this.reports.splice(index, 1);
              }
              this.filteredReports = this.reports;

              /* if (this.filteredToSetupReports && this.filteredToSetupReports.length > 0) {
                  this.filteredToSetupReportD = this.filteredToSetupReports.filter(r => moment(new Date()).diff(moment(r.dueDate), 'days') <= 0);
                  this.filteredToSetupReportOD = this.filteredToSetupReports.filter(r => moment(new Date()).diff(moment(r.dueDate), 'days') > 0);
                  this.filteredToSetupReportDOrig = this.filteredToSetupReportD;
                  this.filteredToSetupReportODOrig = this.filteredToSetupReportOD;
              } else {
                  this.filteredToSetupReportD = [];
                  this.filteredToSetupReportOD = [];
                  this.filteredToSetupReportDOrig = this.filteredToSetupReportD;
                  this.filteredToSetupReportODOrig = this.filteredToSetupReportOD;
              } */
            }

            this.deleteReportsClicked = false;
            if (this.disbursements && this.disbursements.length === 0) {
              this.onNoClick();
            }
          })
      } else {
        this.deleteReportsClicked = false;
        dialogRef.close();
      }
    });
  }

  deleteGrant(grant: Grant) {
    this.deleteGrantEvent = true;
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: "Are you sure you want to delete this grant?", btnMain: "Delete Grant", btnSecondary: "Not Now" },
      panelClass: "center-class",
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.deleteGrantEvent = false;
      if (result) {
        const httpOptions = {
          headers: new HttpHeaders({
            "Content-Type": "application/json",
            "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
            Authorization: localStorage.getItem("AUTH_TOKEN"),
          }),
        };

        const url =
          "/api/user/" +
          this.appComp.loggedInUser.id +
          "/grant/" +
          grant.id;

        this.http.delete(url, httpOptions).subscribe((val: any) => {
          const user = JSON.parse(localStorage.getItem("USER"));
          const index = this.grants.findIndex(r => r.id === grant.id);
          if (index >= 0) {
            this.grants.splice(index, 1);
          }
          this.filteredGrants = this.grants;
          if (this.grants && this.grants.length === 0) {
            this.onNoClick();
          }
        });
      } else {
        dialogRef.close();
      }
    });
  }

  deleteDisbursement(disbursement: Disbursement) {

    this.deleteDisbursementEvent = true;
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: 'Are you sure you want to delete this disbursement?', btnMain: "Delete Disbursement", btnSecondary: "Not Now" },
      panelClass: 'center-class'
    });

    dialogRef.afterClosed().subscribe(result => {
      this.deleteDisbursementEvent = false;
      if (result) {
        this.disbursementDataService.deleteDisbursement(disbursement)
          .then(disbs => {
            const index = this.disbursements.findIndex(r => r.id === disbursement.id);
            if (index >= 0) {
              this.disbursements.splice(index, 1);
            }
            this.filteredDisbursements = this.disbursements;
            if (this.disbursements && this.disbursements.length === 0) {
              this.onNoClick();
            }
          })
      } else {
        dialogRef.close();
      }
    });
  }
}
