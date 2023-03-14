import { GrantClosure } from 'app/model/closures';
import { ClosureDataService } from 'app/closure.data.service';
import { ListDialogComponent } from './../components/list-dialog/list-dialog.component';
import { MyCategory } from '../model/mydashboard';
import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { User } from '../model/user';
import { Tenant, Tenants, Grant } from '../model/dahsboard';
import { AppComponent } from '../app.component';
import { Router, ActivatedRoute } from '@angular/router';
import { GrantDataService } from '../grant.data.service';
import { SingleReportDataService } from '../single.report.data.service';
import { DataService } from '../data.service';
import { Report } from '../model/report'
import { ToastrService } from 'ngx-toastr';
import { GrantComponent } from "../grant/grant.component";
import { MatDialog, MatTabGroup } from '@angular/material';
import { GrantTemplateDialogComponent } from '../components/grant-template-dialog/grant-template-dialog.component';
import { WelcomePopupComponent } from '../components/welcome-popup/welcome-popup.component';
import * as inf from 'indian-number-format';
import { Disbursement } from 'app/model/disbursement';
import { DisbursementDataService } from 'app/disbursement.data.service';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [GrantComponent],
  styles: [`
     ::ng-deep .mat-card-header-text {
        width:100% !important;
     }
    `, `
     ::ng-deep .mat-tab-body-content{
       overflow-x: hidden !important;
     }
    `]
})
export class DashboardComponent implements OnInit {

  user: User;
  tenants: Tenants;
  currentTenant: Tenant;
  hasTenant = false;
  hasKpisToSubmit: boolean;
  kpiSubmissionDate: Date;
  kpiSubmissionTitle: string;
  currentGrantId: number;
  parameters: any;
  grantInProgressCount: number;
  grantActiveCount: number;
  grantClosedCount: number;
  myCategory: MyCategory = new MyCategory();
  @ViewChild("DashboardTabGroup") DashboardTabGroup: MatTabGroup;

  //Retain this
  totalGrantsIssued: number = 0;
  totalGrantees: number = 0;
  totalGrantAmount: string = '-';
  totalActiveUsers: number = 0;
  portfolioData: any;

  constructor(private http: HttpClient,
    public appComponent: AppComponent,
    private router: Router,
    private route: ActivatedRoute,
    private data: GrantDataService,
    private toastr: ToastrService,
    public grantComponent: GrantComponent,
    private dataService: DataService,
    private dialog: MatDialog,
    private singleReportDataService: SingleReportDataService,
    private disbursementService: DisbursementDataService,
    private closureDataService: ClosureDataService) {

    this.route.queryParams.subscribe(params => {
      this.parameters = params;
    });
  }

  ngOnInit() {

    this.appComponent.subMenu = { name: '' };
    if (!this.parameters.status || (this.parameters.status && this.parameters.status === 'd')) {
      if (this.appComponent.loggedInUser.organization.organizationType === 'GRANTER') {
        this.getDashboardSummary();
      } else if (this.appComponent.loggedInUser.organization.organizationType === 'GRANTEE') {
        this.getGranteeDashboardSummary();
      }
      this.getMyDashboardSummary();
    } else if (this.parameters.status && this.parameters.status === 'n' && this.appComponent.loggedInUser.organization.type !== 'PLATFORM') {

      const dialogRef = this.dialog.open(WelcomePopupComponent, {
        data: this.appComponent.loggedInUser.firstName,
        panelClass: 'welcome-popup-class'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.fetchReportOrGrantOrDisbursement();
        }
      });

    } else if (this.parameters.status && this.parameters.status === 'e' && this.appComponent.loggedInUser.organization.type !== 'PLATFORM') {
      this.fetchReportOrGrantOrDisbursement();
    } else {
      const user = JSON.parse(localStorage.getItem('USER'));
      this.appComponent.loggedInUser = user;
      this.fetchDashboard(user.id);
      this.dataService.currentMessage.subscribe(id => this.currentGrantId = id);
    }

  }


  fetchDashboard(userId: number) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    this.appComponent.loggedIn = true;

    let url = '/api/users/' + userId + '/dashboard/in-progress';
    this.http.get<number>(url, httpOptions).subscribe((count: number) => {

      this.grantInProgressCount = count;
    },
      error1 => {
        const errorMsg = error1 as HttpErrorResponse;
        this.toastr.error(errorMsg.error.message, errorMsg.error.messageTitle, {
          enableHtml: true,
          positionClass: 'toast-top-center'
        });
      });

    url = '/api/users/' + userId + '/dashboard/active';
    this.http.get<number>(url, httpOptions).subscribe((count: number) => {

      this.grantActiveCount = count;
    });

    url = '/api/users/' + userId + '/dashboard/closed';
    this.http.get<number>(url, httpOptions).subscribe((count: number) => {

      this.grantClosedCount = count;
    });
  }

  manageGrant(grant: Grant) {


    const dialogRef = this.dialog.open(GrantTemplateDialogComponent, {
      data: ""
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataService.changeMessage(grant.id);
        this.data.changeMessage(grant, this.appComponent.loggedInUser.id);
        this.router.navigate(['grant']);
      } else {
        dialogRef.close();
      }
    });

  }

  fetchReportOrGrantOrDisbursement() {
    const type = this.parameters.type;
    if (type === 'grant') {
      const grantCode = this.parameters.g;
      const queryParams = new HttpParams().set('g', grantCode)
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE')
        }),
        params: queryParams
      };
      const url = '/api/user/' + this.appComponent.loggedInUser.id + '/grant/resolve';


      this.http.get(url, httpOptions).subscribe((grant: Grant) => {
        this.data.changeMessage(grant, this.appComponent.loggedInUser.id);
        this.appComponent.originalGrant = JSON.parse(JSON.stringify(grant));
        this.appComponent.currentView = 'grant';

        this.appComponent.selectedTemplate = grant.grantTemplate;

        if ((grant.workflowAssignments.filter(wf => wf.stateId === grant.grantStatus.id && wf.assignments === this.appComponent.loggedInUser.id).length > 0) && this.appComponent.loggedInUser.organization.organizationType !== 'GRANTEE' && (grant.grantStatus.internalStatus !== 'ACTIVE' && grant.grantStatus.internalStatus !== 'CLOSED')) {
          grant.canManage = true;
        } else {
          grant.canManage = false;
        }
        if (grant.canManage && grant.grantStatus.internalStatus != 'ACTIVE' && grant.grantStatus.internalStatus != 'CLOSED') {
          this.appComponent.subMenu = { name: 'In-progress Grants', action: 'dg' };
          this.router.navigate(['grant/basic-details']);
        } else {
          if (grant.grantStatus.internalStatus === 'ACTIVE') {
            this.appComponent.subMenu = { name: 'Active Grants', action: 'ag' };
          } else if (grant.grantStatus.internalStatus === 'CLOSED') {
            this.appComponent.subMenu = { name: 'Closed Grants', action: 'cg' };
          }
          this.appComponent.action = 'preview';
          this.router.navigate(['grant/preview']);
        }
      });
    } else if (type === 'report') {
      const reportCode = this.parameters.r;
      const queryParams = new HttpParams().set('r', reportCode)
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
          'Authorization': localStorage.getItem('AUTH_TOKEN')
        }),
        params: queryParams
      };
      const url = '/api/user/' + this.appComponent.loggedInUser.id + '/report/resolve';


      this.http.get(url, httpOptions).subscribe((report: Report) => {
        this.appComponent.currentView = 'report';
        this.singleReportDataService.changeMessage(report);

        if (report.status.internalStatus === 'DRAFT' || report.status.internalStatus === 'ACTIVE') {
          this.appComponent.subMenu = { name: 'Upcoming Reports', action: 'ur' };
        } else if (report.status.internalStatus === 'REVIEW') {
          this.appComponent.subMenu = { name: 'Submitted Reports', action: 'sr' };
        } else if (report.status.internalStatus === 'CLOSED') {
          this.appComponent.subMenu = { name: 'Approved Reports', action: 'ar' };
        }
        if (report.canManage) {
          this.router.navigate(['report/report-header']);
        } else {
          this.router.navigate(['report/report-preview']);
        }
      });
    } else if (type === 'disbursement') {
      const disbursementCode = this.parameters.d;
      const queryParams = new HttpParams().set('d', disbursementCode)
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
          'Authorization': localStorage.getItem('AUTH_TOKEN')
        }),
        params: queryParams
      };
      const url = '/api/user/' + this.appComponent.loggedInUser.id + '/disbursements/resolve';


      this.http.get(url, httpOptions).subscribe((disbursement: Disbursement) => {
        this.appComponent.currentView = 'disbursement';
        this.disbursementService.changeMessage(disbursement)

        this.disbursementService.getPermission(disbursement);
        if (disbursement.status.internalStatus === 'DRAFT' || disbursement.status.internalStatus === 'REVIEW') {
          this.appComponent.subMenu = { name: 'Approvals In-progress', action: 'id' };
        } else if (disbursement.status.internalStatus === 'ACTIVE') {
          this.appComponent.subMenu = { name: 'Approvals Active', action: 'ad' };
        } else if (disbursement.status.internalStatus === 'CLOSED') {
          this.appComponent.subMenu = { name: 'Approvals Closed', action: 'cd' };
        }
        if (disbursement.canManage) {
          this.router.navigate(['disbursement/approval-request']);
        } else {
          this.router.navigate(['disbursement/preview']);
        }
      });
    } else if (type === 'closure') {
      const closureCode = this.parameters.r;
      const queryParams = new HttpParams().set('r', closureCode)
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
          'Authorization': localStorage.getItem('AUTH_TOKEN')
        }),
        params: queryParams
      };
      const url = '/api/user/' + this.appComponent.loggedInUser.id + '/closure/resolve';


      this.http.get(url, httpOptions).subscribe((closure: GrantClosure) => {
        this.appComponent.currentView = 'grant-closure';
        this.closureDataService.changeMessage(closure, this.appComponent.loggedInUser.id);
        if (closure.canManage) {
          this.appComponent.action = 'grant-closure';
          this.router.navigate(['grant-closure/header']);
        } else {
          this.appComponent.action = 'grant-closure';
          this.router.navigate(['grant-closure/preview']);
        }
      });
    } else {
      this.fetchDashboard(this.appComponent.loggedInUser.id);
    }
  }

  viewInProgressGrants() {
    this.router.navigate(['grants/draft']);
  }

  viewActiveGrants() {
    this.router.navigate(['grants/active']);
  }

  viewClosedGrants() {
    this.router.navigate(['grants/closed']);
  }

  getDashboardSummary() {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    this.appComponent.loggedIn = true;

    let url = '/api/users/' + this.appComponent.loggedInUser.id + '/dashboard/summary';

    this.http.get(url, httpOptions).subscribe((data: any) => {
      this.updateTotals(data);
    });
  }


  getGranteeDashboardSummary() {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    this.appComponent.loggedIn = true;

    let url = '/api/users/' + this.appComponent.loggedInUser.id + '/dashboard/summary/grantee/' + this.appComponent.loggedInUser.organization.id;

    this.http.get(url, httpOptions).subscribe((data: any) => {
      this.updateTotals(data);
    });
  }

  private updateTotals(data: any) {
    console.log(data);
    this.totalGrantsIssued = data.summary.totalGrants;
    this.totalGrantees = data.summary.grantees;
    this.totalGrantAmount = '₹' + inf.format(Number(data.summary.totalGrantAmount), 2);
    this.totalActiveUsers = data.summary.activeUsers;
    this.portfolioData = data.filters;
  }

  getMyDashboardSummary() {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    this.appComponent.loggedIn = true;

    let url = '/api/users/' + this.appComponent.loggedInUser.id + '/dashboard/mysummary';

    this.http.get(url, httpOptions).subscribe((data: any) => {
      this.myCategory = data;

    });
  }

  getFormattedGrantAmount(amount: number) {
    return '₹' + inf.format(amount, 2);
  }

  getName(): string {
    const name = this.appComponent.loggedInUser.firstName;

    return name.trim();
  }

  tabSelectionChange(ev) {
    this.appComponent.currentDashboard = ev.index;
  }

  showpendingGrants() {
    if (this.myCategory.summary.ActionsPending.Grants === 0) {
      return;
    }

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };
   
    this.http.get<Tenants[]>('/api/users/' + this.appComponent.loggedInUser.id + '/dashboard?forStatus=inprogress', httpOptions)
      .subscribe((results) => {
        const dg = this.dialog.open(ListDialogComponent, {
          data: { _for: 'grants-inprogress', grants: results, appComp: this.appComponent, title: 'Actions Pending | Grants' },
          panelClass: "addnl-report-class"
        });

        dg.afterClosed().subscribe(() => {
          this.getMyDashboardSummary();
        });
      });
  }

  showpendingClosures() {
    if (this.myCategory.summary.ActionsPending.Closures === 0) {
      return;
    }

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };
  
  //  this.http.get<GrantClosure[]>('/api/users/' + this.appComponent.loggedInUser.id + '/dashboard/mysummary/pendingclosures', httpOptions)
  this.http.get<GrantClosure[]>('/api/user/' + this.appComponent.loggedInUser.id + '/closure/pendingclosures', httpOptions)
      .subscribe((results) => {
        const dg = this.dialog.open(ListDialogComponent, {
          data: { _for: 'closure', closures: results, appComp: this.appComponent, title: 'Actions Pending | Closures' },
          panelClass: "addnl-report-class"
        });

        dg.afterClosed().subscribe(() => {
          this.getMyDashboardSummary();
        });
      });
  }

  showpendingReports() {
    if (this.myCategory.summary.ActionsPending.Reports === 0) {
      return;
    }

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    this.http.get<Report[]>('/api/users/' + this.appComponent.loggedInUser.id + '/dashboard/mysummary/pendingreports', httpOptions)
      .subscribe((results) => {
        const dg = this.dialog.open(ListDialogComponent, {
          data: { _for: 'report', reports: results, appComp: this.appComponent, title: 'Actions Pending | Progress Reports' },
          panelClass: "addnl-report-class"
        });

        dg.afterClosed().subscribe(() => {
          this.getMyDashboardSummary();
        });
      });
  }

  showpendingDisbursements() {

    if (this.myCategory.summary.ActionsPending.DisbursementApprovals === 0) {
      return;
    }

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    this.http.get<Disbursement[]>('/api/users/' + this.appComponent.loggedInUser.id + '/dashboard/mysummary/pendingdisbursements', httpOptions)
      .subscribe((results) => {
        if (results && results.length > 0) {
          for (let disb of results) {
            disb = this.disbursementService.setPermission(disb);
          }
        }
        const dg = this.dialog.open(ListDialogComponent, {
          data: { _for: 'disbursement', disbursements: results, appComp: this.appComponent, title: 'Actions Pending - Disbursement Requests' },
          panelClass: "addnl-report-class"
        });
        dg.afterClosed().subscribe(() => {
          this.getMyDashboardSummary();
        });
      });
  }

  showupcomingGrants() {

    if (this.myCategory.summary.UpcomingGrants.DraftGrants === 0) {
      return;
    }

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };
    this.http.get<Tenants[]>('/api/users/' + this.appComponent.loggedInUser.id + '/dashboard?forStatus=inprogress', httpOptions)
        .subscribe((results) => {
        const dg = this.dialog.open(ListDialogComponent, {
          data: { _for: 'grants-draft', grants: results, appComp: this.appComponent, title: 'Upcoming | Grants | Drafts' },
          panelClass: "addnl-report-class"
        });
        dg.afterClosed().subscribe(() => {
          this.getMyDashboardSummary();
        });
      });
  }

  showupcomingClosures() {

    if (this.myCategory.summary.UpcomingClosures.DraftClosures === 0) {
      return;
    }

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    this.http.get<GrantClosure[]>('/api/users/' + this.appComponent.loggedInUser.id + '/dashboard/mysummary/upcomingdraftclosures', httpOptions)
      .subscribe((results) => {
        const dg = this.dialog.open(ListDialogComponent, {
          data: { _for: 'closure', closures: results, appComp: this.appComponent, title: 'Upcoming | Closures | Drafts' },
          panelClass: "addnl-report-class"
        });
        dg.afterClosed().subscribe(() => {
          this.getMyDashboardSummary();
        });
      });
  }

  showupcomingReports() {

    if (this.myCategory.summary.UpcomingReports.DraftReports === 0) {
      return;
    }
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    this.http.get<Report[]>('/api/users/' + this.appComponent.loggedInUser.id + '/dashboard/mysummary/upcomingdraftreports', httpOptions)
      .subscribe((results) => {
        const dg = this.dialog.open(ListDialogComponent, {
          data: { _for: 'report', reports: results, appComp: this.appComponent, title: 'Upcoming | Progrss Reports | Drafts' },
          panelClass: "addnl-report-class"
        });

        dg.afterClosed().subscribe(() => {
          this.getMyDashboardSummary();
        });
      });
  }

  showupcomingDisbursements() {

    if (this.myCategory.summary.upcomingDisbursements.DraftDisbursements === 0) {
      return;
    }

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    this.http.get<Disbursement[]>('/api/users/' + this.appComponent.loggedInUser.id + '/dashboard/mysummary/upcomingdraftdisbursements', httpOptions)
      .subscribe((results) => {
        if (results && results.length > 0) {
          for (let disb of results) {
            disb = this.disbursementService.setPermission(disb);
          }
        }
        const dg = this.dialog.open(ListDialogComponent, {
          data: { _for: 'disbursement', disbursements: results, appComp: this.appComponent, title: 'Upcoming | Disbursement Requests | Drafts' },
          panelClass: "addnl-report-class"
        });

        dg.afterClosed().subscribe(() => {
          this.getMyDashboardSummary();
        });
      });
  }
}
