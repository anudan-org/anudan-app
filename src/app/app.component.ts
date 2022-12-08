import { UtilsService } from './utils.service';
import { GrantClosure } from './model/closures';
import { AfterViewChecked, ChangeDetectorRef, Component, ApplicationRef } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { User } from './model/user';
import { Report, ReportTemplate } from './model/report';
import { Release } from './model/release';
import { ToastrService, IndividualConfig } from 'ngx-toastr';
import { AppConfig } from './model/app-config';
import { WorkflowStatus, Tenant, GrantTemplate, Grant, GrantType } from "./model/dahsboard";
import { WorkflowTransition } from "./model/workflow-transition";
import { interval, BehaviorSubject } from 'rxjs';
import { GrantDataService } from './grant.data.service';
import { UpdateService } from './update.service';
import { environment } from '../environments/environment';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar, MatDialog } from '@angular/material';
import { SingleReportDataService } from './single.report.data.service';
import { DisbursementDataService } from './disbursement.data.service';

//App Component
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [UpdateService]
})
export class AppComponent implements AfterViewChecked {



  loggedIn: boolean;
  cookieEnabled: boolean;

  title = 'anudan.org';
  profile = "";
  public logo = "";
  loggedInUser: User;
  autosave: boolean = false;
  autosaveDisplay = '';
  currentView = 'grants';
  sectionAdded = false;
  sectionUpdated = false;
  notifications = [];
  hasUnreadMessages = false;
  showSaving = false;
  unreadMessages = 0;
  selectedTemplate: GrantTemplate;
  selectedReportTemplate: ReportTemplate;
  sectionInModification = false;
  currentTenant: Tenant;
  grantSaved = false;
  reportSaved = true;
  closureSaved = false;
  confgSubscription: any;
  public grantTypes: GrantType[];
  originalGrant: Grant;
  originalClosure: GrantClosure;
  originalReport: Report;
  action: string;
  createNewSection = new BehaviorSubject<boolean>(false);
  createNewReportSection = new BehaviorSubject<boolean>(false);
  createNewClosureSection = new BehaviorSubject<boolean>(false);
  grantRemoteUpdate = new BehaviorSubject<boolean>(false);
  failedAttempts = 0;
  parameters: any;
  tenantUsers: User[];
  reportWorkflowStatuses: WorkflowStatus[];
  closureWorkflowStatuses: WorkflowStatus[];
  grantWorkflowStatuses: WorkflowStatus[];
  disbursementWorkflowStatuses: WorkflowStatus[];
  reportTransitions: WorkflowTransition[];
  closureTransitions: WorkflowTransition[];
  releaseVersion: string;
  acceptedFileTypes = [".pdf", ".xls", ".xlsx", ".doc", ".docx", ".ppt", ".pptx", ".txt"]
  public appConfig: AppConfig = {
    appName: '',
    logoUrl: '',
    navbarColor: '#e3f2fd;',
    navbarTextColor: '#222',
    tenantCode: '',
    defaultSections: [],
    //submissionInitialStatus: new WorkflowStatus(),
    granteeOrgs: [],
    workflowStatuses: [],
    reportWorkflowStatuses: [],
    closureWorkflowStatuses: [],
    grantWorkflowStatuses: [],
    transitions: [],
    reportTransitions: [],
    closureTransitions: [],
    tenantUsers: [],
    daysBeforePublishingReport: 30,
    templateLibrary: []
  };

  reportUpdated = new BehaviorSubject<any>({ status: false, reportId: 0 });
  closureUpdated = new BehaviorSubject<any>({ status: false, closureId: 0 });

  subMenu = {};

  org: string;
  public defaultClass = '';
  currentDashboard: number;

  constructor(private toastr: ToastrService,
    private httpClient: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private cdRef: ChangeDetectorRef,
    private grantService: GrantDataService,
    private singleReportService: SingleReportDataService,
    private disbursementDataService: DisbursementDataService,
    private updateService: UpdateService,
    private appRef: ApplicationRef,
    private updates: SwUpdate,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private utils: UtilsService) {

    this.route.queryParamMap.subscribe(params => {
      console.log(params.get('q'));
    });

    this.updates.available.subscribe(event => {
      const snack = this.snackbar.open('A newer version of the Anudan app is now available. Please save your work and refresh the page.', 'Dismiss', { 'verticalPosition': 'top' });

      snack
        .onAction()
        .subscribe(() => {
          snack.dismiss();
        });
    });

  }

  ngOnInit() {

    this.cookieEnabled = navigator.cookieEnabled;
    if (!this.cookieEnabled) {
      this.router.navigate(['/nocookie']);
    }
    this.loggedIn = localStorage.getItem('AUTH_TOKEN') === null ? false : true;

    if ('serviceWorker' in navigator && environment.production) {
      navigator.serviceWorker.register('/ngsw-worker.js')
      console.log('Registered as service worker');
    }

    this.httpClient.get("/api/public/release").subscribe((release: Release) => {
      this.releaseVersion = release.version;
    });

    this.getTenantCode();


    this.loggedInUser = localStorage.getItem('USER') === 'undefined' ? {} : JSON.parse(localStorage.getItem('USER'));
    interval(10000).subscribe(t => {
      console.log('checking updates');
      if (environment.production) {
        this.updates.checkForUpdate();
      }
    });

    this.getGrantTypes();

    if (this.loggedInUser) {
      this.profile = "/api/public/images/profile/" + this.loggedInUser.id + "?" + (new Date().getTime()).toString();
    }

  }

  getGrantTypes() {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    if (this.loggedInUser) {
      const url = "/api/user/" + this.loggedInUser.id + "/grant/grantTypes";
      this.httpClient.get(url, httpOptions).subscribe((result: GrantType[]) => {
        this.grantTypes = result;
        this.utils.setGrantTypes(this.grantTypes);
      });
    }
  }



  ngAfterViewChecked(): void {
    this.cdRef.detectChanges();
  }

  isLocalhost() {
    return (location.hostname.endsWith('.localhost') || location.hostname === '127.0.0.1')
  }

  initAppUI() {
    const hostName = this.isLocalhost() ? this.queryParam() : this.subdomain();
    this.getAppUI(hostName);
  }

  getTenantCode() {
    let hostName = this.isLocalhost() ? this.queryParam() : this.subdomain();
    if (!hostName) {
      hostName = 'anudan';
    }
    localStorage.setItem('X-TENANT-CODE', hostName.toUpperCase());

    if (this.loggedInUser && this.loggedInUser.organization.organizationType === 'GRANTER') {
      this.logo = "/api/public/images/" + localStorage.getItem("X-TENANT-CODE") + '/logo?' + (new Date().getTime()).toString();
    } else if (this.loggedInUser && this.loggedInUser.organization.organizationType === 'GRANTEE') {
      this.logo = "/api/public/images/" + localStorage.getItem("X-TENANT-CODE") + '/' + this.loggedInUser.organization.id + '/logo?' + (new Date().getTime()).toString();
    } else {
      this.logo = "/api/public/images/" + localStorage.getItem("X-TENANT-CODE") + '/logo?' + (new Date().getTime()).toString();
    }

  }

  subdomain(): string {
    const hostName = location.hostname;
    let subDomain = '';
    if (hostName !== '127.0.0.1') {
      const arr = hostName.split('.');
      if (arr.length === 4) {
        subDomain = arr[0];
      } else if (arr.length === 3 && (arr[0] === 'dev' || arr[0] === 'qa' || arr[0] === 'uat' || arr[0] === 'hotfix')) {
        subDomain = arr[1];
      } else if (arr.length === 3 && (arr[0] !== 'dev' && arr[0] !== 'qa' && arr[0] !== 'uat' && arr[0] !== 'hotfix')) {
        subDomain = arr[0];
      }
    }
    return subDomain;
  }

  getAppUI(hostName) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    const url = '/api/app/config/user/' + JSON.parse(localStorage.getItem("USER")).id + "/" + (hostName === '' ? 'anudan' : hostName);
    this.confgSubscription = this.httpClient.get<AppConfig>(url, httpOptions).subscribe((response) => {
      this.appConfig = response;
      if (this.appConfig.tenantUsers) {
        this.tenantUsers = this.appConfig.tenantUsers;
      }
      if (this.appConfig.reportWorkflowStatuses) {
        this.reportWorkflowStatuses = this.appConfig.reportWorkflowStatuses;
      }
      if (this.appConfig.closureWorkflowStatuses) {
        this.closureWorkflowStatuses = this.appConfig.closureWorkflowStatuses;
      }
    }, error => {
      const errorMsg = error as HttpErrorResponse;
      const y = { 'enableHtml': true, 'preventDuplicates': true, 'positionClass': 'toast-top-right', 'progressBar': true } as Partial<IndividualConfig>;
      const config: Partial<IndividualConfig> = y;
      if (errorMsg.error && errorMsg.error.message === 'Token Expired') {
        alert("Your session has timed out. Please sign in again.")
        this.logout();
      } else if (errorMsg.error) {
        this.toastr.error(errorMsg.error.message, "1 We encountered an error", config);
      }


    });
    if (!hostName) {
      this.defaultClass = ' navbar fixed-top navbar-expand-lg navbar-light';

    }
  }

  queryParam() {
    return location.hostname.split('.')[0];
  }

  getQueryStringValue(key: string): string {
    return decodeURIComponent(location.search.replace(new RegExp('^(?:.*[&\\?]' + encodeURIComponent(key).replace(/[\.\+\*]/g, '\\$&') + '(?:\\=([^&]*))?)?.*$', 'i'), '$1'));
  }

  grateeRegistration() {
    console.log('grantee login');
    this.router.navigate(['/grantee/registration']);
  }

  logout() {
    localStorage.removeItem('AUTH_TOKEN');
    localStorage.removeItem('USER');
    localStorage.removeItem('MESSAGE_COUNT');
    localStorage.removeItem('CM');
    localStorage.removeItem('TM');
    this.notifications = [];

    this.grantService.changeMessage(null, 0);
    this.singleReportService.changeMessage(null);
    this.disbursementDataService.changeMessage(null);
    if (this.confgSubscription) {
      this.confgSubscription.unsubscribe();
    }
    let navToLogin = false;
    if (this.loggedInUser.organization.organizationType === 'GRANTER') {
      navToLogin = true;
    }
    this.loggedInUser = null;
    this.currentView = 'grants';
    this.loggedIn = false;

    if (navToLogin) {
      this.router.navigate(['login']);
    } else {
      this.router.navigate(['login']);
    }

  }

  goToHome() {
    this.router.navigate(['grants']);
  }

  goToGrantSummary() {
    this.router.navigate(['grant']);
  }

}
