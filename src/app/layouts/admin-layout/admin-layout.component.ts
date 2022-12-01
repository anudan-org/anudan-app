import { ClosureDataService } from './../../closure.data.service';
import {
  Component,
  OnInit,
} from "@angular/core";
import {
  Location,
  PopStateEvent,
} from "@angular/common";
import "rxjs/add/operator/filter";
import { WfassignmentComponent } from "../../components/wfassignment/wfassignment.component";
import { GranthistoryComponent } from "../../components/granthistory/granthistory.component";
import {
  Router,
  NavigationEnd,
  NavigationStart,
} from "@angular/router";
import { MatDialog } from "@angular/material";
import { Subscription } from "rxjs/Subscription";
import PerfectScrollbar from "perfect-scrollbar";
import { GrantDataService } from "../../grant.data.service";
import { DataService } from "../../data.service";
import { GrantUpdateService } from "../../grant.update.service";
import {
  Grant,
  Notifications,
  WorkflowAssignmentModel,
  WorkflowAssignments,
} from "../../model/dahsboard";
import {
  Report,
  ReportWorkflowAssignmentModel,
  ReportWorkflowAssignment,
} from "../../model/report";
import { AppComponent } from "../../app.component";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { interval } from "rxjs";
import { ToastrService, IndividualConfig } from "ngx-toastr";
import {
  HumanizeDurationLanguage,
  HumanizeDuration,
} from "humanize-duration-ts";
import { NotificationspopupComponent } from "../../components/notificationspopup/notificationspopup.component";
import { SingleReportDataService } from "../../single.report.data.service";
import {
  Disbursement,
  DisbursementWorkflowAssignmentModel,
  DisbursementWorkflowAssignment,
} from "app/model/disbursement";
import { DisbursementDataService } from "app/disbursement.data.service";
import { WorkflowDataService } from "app/workflow.data.service";
import { ClosureWorkflowAssignment, ClosureWorkflowAssignmentModel, GrantClosure } from "app/model/closures";

@Component({
  selector: "app-admin-layout",
  templateUrl: "./admin-layout.component.html",
  styleUrls: ["./admin-layout.component.scss"],
  styles: [
    `
      ::ng-deep
        .notifications-panel
        > .mat-expansion-panel-content
        > .mat-expansion-panel-body {
        background: #f5f9ff !important;
        padding: 5px 20px !important;
      }
    `,
  ],
})
export class AdminLayoutComponent implements OnInit {
  private _router: Subscription;
  private lastPoppedUrl: string;
  currentGrant: Grant;
  currentReport: Report;
  currentClosure: GrantClosure;
  currentDisbursement: Disbursement;
  grantToUpdate: Grant;
  private yScrollStack: number[] = [];
  action: any;
  currentGrantId: number;
  subscription: any;
  intervalSubscription: any;
  msgCount: number = 0;
  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService);

  constructor(
    private grantData: GrantDataService,
    public appComponent: AppComponent,
    public location: Location,
    private router: Router,
    private dataService: DataService,
    private grantUpdateService: GrantUpdateService,
    private http: HttpClient,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private singleReportDataService: SingleReportDataService,
    private closureService: ClosureDataService,
    private disbursementService: DisbursementDataService,
    private workflowDataService: WorkflowDataService
  ) { }

  ngOnInit() {
    this.dataService.currentMessage.subscribe(
      (id) => (this.currentGrantId = id)
    );
    this.singleReportDataService.currentMessage.subscribe((report) => {
      this.currentReport = report;
    });

    this.closureService.currentMessage.subscribe((closure) => {
      this.currentClosure = closure;
    });

    this.grantData.currentMessage.subscribe(
      (grant) => (this.currentGrant = grant)
    );
    this.disbursementService.currentMessage.subscribe(
      (disbursement) => (this.currentDisbursement = disbursement)
    );
    let platform = navigator.userAgent;
    const isWindows = platform.toUpperCase().indexOf("WIN") > -1 ? true : false;

    if (
      isWindows &&
      !document
        .getElementsByTagName("body")[0]
        .classList.contains("sidebar-mini")
    ) {

      const scrollableHtmlColl = document
        .getElementsByClassName("anudan-scrollable");
      if (scrollableHtmlColl && scrollableHtmlColl.length > 0) {
        scrollableHtmlColl[0].classList.add("perfect-scrollbar-on");
      }

    } else {
      document
        .getElementsByTagName("body")[0]
        .classList.remove("perfect-scrollbar-off");
    }
    const elemMainPanel = <HTMLElement>document.querySelector(".main-panel");
    const elemSidebar = <HTMLElement>(
      document.querySelector(".sidebar .sidebar-wrapper")
    );

    this.location.subscribe((ev: PopStateEvent) => {
      this.lastPoppedUrl = ev.url;
    });
    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationStart) {
        if (event.url != this.lastPoppedUrl)
          this.yScrollStack.push(window.scrollY);
      } else if (event instanceof NavigationEnd) {
        if (event.url == this.lastPoppedUrl) {
          this.lastPoppedUrl = undefined;
          window.scrollTo(0, this.yScrollStack.pop());
        } else window.scrollTo(0, 0);
      }
    });
    this._router = this.router.events
      .filter((event) => event instanceof NavigationEnd)
      .subscribe((event: NavigationEnd) => {
        elemMainPanel.scrollTop = 0;
        elemSidebar.scrollTop = 0;
      });
    if (window.matchMedia(`(min-width: 960px)`).matches && !this.isMac()) {
      let ps = new PerfectScrollbar(elemMainPanel);
      ps = new PerfectScrollbar(elemSidebar);
    }

    this.appComponent.initAppUI();

    this.intervalSubscription = interval(15000).subscribe((t) => {
      if ($("#messagepopover").css("display") === "block") {
        return;
      }

      if (localStorage.getItem("USER")) {
        let url =
          "/api/user/" + this.appComponent.loggedInUser.id + "/notifications/";
        const httpOptions = {
          headers: new HttpHeaders({
            "Content-Type": "application/json",
            "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
            Authorization: localStorage.getItem("AUTH_TOKEN"),
          }),
        };

        this.http.get<Notifications[]>(url, httpOptions).subscribe(
          (notifications: Notifications[]) => {
            if (
              this.appComponent.notifications &&
              notifications &&
              this.appComponent.notifications.length !== notifications.length
            ) {
              if (this.appComponent.currentTenant) {
                for (let i = 0; i < 1; i++) {
                  if (
                    !notifications[i].read &&
                    notifications[i].notificationFor === "GRANT"
                  ) {
                    const idx = this.appComponent.currentTenant.grants.findIndex(
                      (g) => g.id === notifications[i].grantId
                    );
                    if (idx >= 0 && this.appComponent.loggedInUser) {
                      url =
                        "/api/user/" +
                        this.appComponent.loggedInUser.id +
                        "/grant/" +
                        notifications[i].grantId;
                      this.http
                        .get(url, httpOptions)
                        .subscribe((updatedGrant: Grant) => {
                          this.appComponent.currentTenant.grants[
                            idx
                          ] = updatedGrant;
                          this.appComponent.grantRemoteUpdate.next(true);
                        });
                    }
                  }

                }
              }

              for (let i = 0; i < 1; i++) {
                if (
                  !notifications[i].read &&
                  notifications[i].notificationFor === "REPORT"
                ) {
                  this.appComponent.reportUpdated.next({ status: true, reportId: notifications[i].reportId });
                }
              }

              if (this.currentGrant) {
                for (let i = 0; i < 1; i++) {
                  if (
                    !notifications[i].read &&
                    notifications[i].notificationFor === "GRANT" &&
                    notifications[i].grantId === this.currentGrant.id
                  ) {
                    url =
                      "/api/user/" +
                      this.appComponent.loggedInUser.id +
                      "/grant/" +
                      notifications[i].grantId;
                    if (this.appComponent.loggedInUser) {
                      this.http
                        .get(url, httpOptions)
                        .subscribe((updatedGrant: Grant) => {
                          this.grantData.changeMessage(
                            updatedGrant,
                            this.appComponent.loggedInUser.id
                          );

                          if (
                            this.currentGrant.startDate &&
                            this.currentGrant.endDate
                          ) {
                            var time =
                              new Date(this.currentGrant.endDate).getTime() -
                              new Date(this.currentGrant.startDate).getTime();
                            time = time + 86400001;
                            this.currentGrant.duration = this.humanizer.humanize(
                              time,
                              { largest: 2, units: ["y", "mo"], round: true }
                            );
                          } else {
                            this.currentGrant.duration = "No end date";
                          }
                        });
                    }
                  }
                }
              }
            }

            this.appComponent.notifications = notifications;
            this.appComponent.unreadMessages = 0;
            for (let notice of this.appComponent.notifications) {
              if (!notice.read) {
                this.appComponent.unreadMessages += 1;
              }
            }
            if (
              !JSON.parse(localStorage.getItem("MESSAGE_COUNT")) ||
              JSON.parse(localStorage.getItem("MESSAGE_COUNT")) !==
              this.appComponent.unreadMessages
            ) {
              localStorage.setItem(
                "MESSAGE_COUNT",
                String(this.appComponent.unreadMessages)
              );
              this.appComponent.hasUnreadMessages = true;
            }
            if (
              localStorage.getItem("TM") === undefined &&
              localStorage.getItem("CM") === undefined
            ) {
              localStorage.setItem("TM", "0");
              localStorage.setItem("CM", "0");
            }

            const urmVal = notifications.length;
            let tmVal = Number(JSON.parse(localStorage.getItem("TM")));
            let cmVal =
              Number(JSON.parse(localStorage.getItem("CM"))) < 0
                ? 0
                : Number(JSON.parse(localStorage.getItem("CM")));
            localStorage.setItem("CM", String(urmVal - tmVal + cmVal));
            localStorage.setItem("TM", String(urmVal));
            this.msgCount = cmVal;
            this.grantUpdateService.changeMessage(true);
          },
          (error) => {
            const errorMsg = error as HttpErrorResponse;

            const y = {
              enableHtml: true,
              preventDuplicates: true,
              positionClass: "toast-top-right",
              progressBar: true,
            } as Partial<IndividualConfig>;
            const config: Partial<IndividualConfig> = y;
            if (errorMsg.error && errorMsg.error.message === "Token Expired") {
              this.intervalSubscription.unsubscribe();
              alert("Your session has timed out. Please sign in again.");
              this.appComponent.logout();
            } else {
              this.toastr.error(
                errorMsg.error && errorMsg.error.message,
                "17 We encountered an error",
                config
              );
            }
          }
        );
      }
    });
  }

  ngAfterViewInit() {
    this.runOnRouteChange();
  }

  isMaps(path) {
    var titlee = this.location.prepareExternalUrl(this.location.path());
    titlee = titlee.slice(1);
    if (path == titlee) {
      return false;
    } else {
      return true;
    }
  }
  runOnRouteChange(): void {
    if (window.matchMedia(`(min-width: 960px)`).matches && !this.isMac()) {
      const elemMainPanel = <HTMLElement>document.querySelector(".main-panel");
      const ps = new PerfectScrollbar(elemMainPanel);
      ps.update();
    }
  }
  isMac(): boolean {
    let bool: boolean;
    let platform = navigator.userAgent;
    if (
      platform.toUpperCase().indexOf("MAC") >= 0 ||
      platform.toUpperCase().indexOf("IPAD") >= 0
    ) {
      bool = true;
    }
    return bool;
  }

  showAllGrants(grant: Grant, action: string) {
    this.appComponent.reportSaved = true;
    this.appComponent.showSaving = false;

    if (this.currentGrant !== null && this.currentGrant.name !== undefined) {
      this.grantToUpdate = JSON.parse(JSON.stringify(this.currentGrant));
      this.grantToUpdate.id = this.currentGrantId;
    }

    const orgType = this.appComponent.loggedInUser.organization
      .organizationType;

    this.appComponent.currentView = "grants";
    if (orgType === "GRANTER") {
      if (action === "dg") {
        this.router.navigate(["grants/draft"]);
      } else if (action === "ag") {
        this.router.navigate(["grants/active"]);
      } else if (action === "cg") {
        this.router.navigate(["grants/closed"]);
      } else if (action === "db") {
        this.router.navigate(["/dashboard"]);
      }
    } else if (orgType === "GRANTEE") {
      if (action === "ag") {
        this.router.navigate(["grants/active"]);
      } else if (action === "cg") {
        this.router.navigate(["grants/closed"]);
      } else if (action === "db") {
        this.router.navigate(["/dashboard"]);
      }
    }
  }

  showHistory(historyOf, what2Show) {
    this.dialog.open(GranthistoryComponent, {
      data: {
        type: historyOf,
        data: what2Show,
        currentUser: this.appComponent.loggedInUser,
      },
      panelClass: "grant-notes-class",
      disableClose: false,
    });
  }

  showWorkflowAssigments() {
    this.appComponent.initAppUI();
    if (this.appComponent.currentView === "grant") {
      const wfModel = new WorkflowAssignmentModel();
      wfModel.users = this.appComponent.tenantUsers;
      wfModel.workflowStatuses = this.appComponent.grantWorkflowStatuses;
      wfModel.workflowAssignment = this.currentGrant.workflowAssignments;
      wfModel.type = this.appComponent.currentView;
      wfModel.grant = this.currentGrant;
      wfModel.grantTypes = this.appComponent.grantTypes;
      if (this.appComponent.loggedInUser.organization.organizationType !== 'GRANTEE') {
        wfModel.grant.isInternal = this.appComponent.grantTypes.filter(gt => this.currentGrant.grantTypeId)[0].internal;
      }
      wfModel.canManage =
        this.appComponent.loggedInUser.organization.organizationType ===
          "GRANTEE"
          ? false
          : this.currentGrant.workflowAssignments.filter(
            (wf) =>
              wf.stateId === this.currentGrant.grantStatus.id &&
              wf.assignments === this.appComponent.loggedInUser.id
          ).length > 0 &&
          this.appComponent.loggedInUser.organization.organizationType !==
          "GRANTEE";
      const dialogRef = this.dialog.open(WfassignmentComponent, {
        data: { model: wfModel, userId: this.appComponent.loggedInUser.id, appComp: this.appComponent, adminComp: this },
        panelClass: "wf-assignment-class",
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result.result) {
          const ass: WorkflowAssignments[] = [];
          for (let data of result.data) {
            const wa = new WorkflowAssignments();
            wa.id = data.id;
            wa.stateId = data.stateId;
            wa.assignments = data.userId;
            wa.grantId = data.grantId;
            ass.push(wa);
          }

          const httpOptions = {
            headers: new HttpHeaders({
              "Content-Type": "application/json",
              "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
              Authorization: localStorage.getItem("AUTH_TOKEN"),
            }),
          };

          let url =
            "/api/user/" +
            this.appComponent.loggedInUser.id +
            "/grant/" +
            this.currentGrant.id +
            "/assignment";
          this.http
            .post(
              url,
              { grant: this.currentGrant, assignments: ass },
              httpOptions
            )
            .subscribe(
              (grant: Grant) => {
                this.grantData.changeMessage(
                  grant,
                  this.appComponent.loggedInUser.id
                );
                this.setDateDuration();
                this.currentGrant = grant;
                this.manageGrant(null, grant.id);
              },
              (error) => {
                const errorMsg = error as HttpErrorResponse;

                const y = {
                  enableHtml: true,
                  preventDuplicates: true,
                  positionClass: "toast-top-right",
                  progressBar: true,
                } as Partial<IndividualConfig>;
                const config: Partial<IndividualConfig> = y;
                if (errorMsg.error.message === "Token Expired") {
                  alert("Your session has timed out. Please sign in again.");
                  this.appComponent.logout();
                } else {
                  this.toastr.error(
                    errorMsg.error.message,
                    "18 We encountered an error",
                    config
                  );
                }
              }
            );
        } else {
          dialogRef.close();
        }
      });
    } else if (this.appComponent.currentView === "report") {
      const wfModel = new ReportWorkflowAssignmentModel();
      wfModel.users = this.appComponent.tenantUsers;
      wfModel.granteeUsers = this.currentReport.granteeUsers;
      wfModel.workflowStatuses = this.appComponent.reportWorkflowStatuses;
      wfModel.workflowAssignments = this.currentReport.workflowAssignments;
      wfModel.type = this.appComponent.currentView;
      wfModel.grantTypes = this.appComponent.grantTypes;
      wfModel.report = this.currentReport;
      if (this.appComponent.loggedInUser.organization.organizationType !== 'GRANTEE') {
        wfModel.report.grant.isInternal = this.appComponent.grantTypes.filter(gt => gt.id === this.currentReport.grant.grantTypeId)[0].internal;
      }
      wfModel.canManage =
        this.appComponent.loggedInUser.organization.organizationType ===
          "GRANTEE"
          ? false
          : this.currentReport.flowAuthorities && this.currentReport.canManage;
      const dialogRef = this.dialog.open(WfassignmentComponent, {
        data: { model: wfModel, userId: this.appComponent.loggedInUser.id, appComp: this.appComponent, adminComp: this },
        panelClass: "wf-assignment-class",
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result.result) {
          const ass: ReportWorkflowAssignment[] = [];
          for (let data of result.data) {
            const wa = new ReportWorkflowAssignment();
            wa.id = data.id;
            wa.stateId = data.stateId;
            wa.assignmentId = data.userId;
            wa.reportId = data.reportId;
            wa.customAssignments = data.customAssignments;
            ass.push(wa);
          }

          const httpOptions = {
            headers: new HttpHeaders({
              "Content-Type": "application/json",
              "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
              Authorization: localStorage.getItem("AUTH_TOKEN"),
            }),
          };

          let url =
            "/api/user/" +
            this.appComponent.loggedInUser.id +
            "/report/" +
            this.currentReport.id +
            "/assignment";
          this.http
            .post(
              url,
              { report: this.currentReport, assignments: ass },
              httpOptions
            )
            .subscribe(
              (report: Report) => {
                this.singleReportDataService.changeMessage(report);
                this.currentReport = report;
                this.setReportDateDuration();
                this.manageReport(null, report.id);
              },
              (error) => {
                const errorMsg = error as HttpErrorResponse;

                const y = {
                  enableHtml: true,
                  preventDuplicates: true,
                  positionClass: "toast-top-right",
                  progressBar: true,
                } as Partial<IndividualConfig>;
                const config: Partial<IndividualConfig> = y;
                if (errorMsg.error.message === "Token Expired") {
                  alert("Your session has timed out. Please sign in again.");
                  this.appComponent.logout();
                } else {
                  this.toastr.error(
                    errorMsg.error.message,
                    "19 We encountered an error",
                    config
                  );
                }
              }
            );
        } else {
          dialogRef.close();
        }
      });
    } else if (this.appComponent.currentView === "disbursement") {
      this.workflowDataService
        .getDisbursementWorkflowStatuses(this.currentDisbursement, this.appComponent)
        .then((workflowStatuses) => {
          const wfModel = new DisbursementWorkflowAssignmentModel();
          wfModel.users = this.appComponent.tenantUsers;
          wfModel.workflowStatuses = workflowStatuses;
          wfModel.workflowAssignments = this.currentDisbursement.assignments;
          wfModel.type = this.appComponent.currentView;
          wfModel.grantTypes = this.appComponent.grantTypes;
          wfModel.disbursement = this.currentDisbursement;
          if (this.appComponent.loggedInUser.organization.organizationType !== 'GRANTEE') {
            wfModel.disbursement.grant.isInternal = this.appComponent.grantTypes.filter(gt => this.currentDisbursement.grant.grantTypeId)[0].internal;
          }
          wfModel.canManage = this.currentDisbursement.canManage;
          const dialogRef = this.dialog.open(WfassignmentComponent, {
            data: { model: wfModel, userId: this.appComponent.loggedInUser.id, appComp: this.appComponent, adminComp: this },
            panelClass: "wf-assignment-class",
          });

          dialogRef.afterClosed().subscribe((result) => {
            if (result.result) {
              const ass: DisbursementWorkflowAssignment[] = [];
              for (let data of result.data) {
                const wa = new DisbursementWorkflowAssignment();
                wa.id = data.id;
                wa.stateId = data.stateId;
                wa.assignmentId = data.userId;
                wa.disbursementId = data.disbursementId;
                wa.customAssignments = data.customAssignments;
                ass.push(wa);
              }

              this.disbursementService
                .saveAssignments(this.currentDisbursement, ass)
                .then((disbursement) => {
                  this.disbursementService.changeMessage(disbursement);
                  this.currentDisbursement = disbursement;
                  this.manageDisbursement(null, disbursement.id);
                });
            } else {
              dialogRef.close();
            }
          });
        });
    } else if (this.appComponent.currentView === "grant-closure") {
      const wfModel = new ClosureWorkflowAssignmentModel();
      wfModel.users = this.appComponent.tenantUsers;
      wfModel.workflowStatuses = this.appComponent.closureWorkflowStatuses;
      wfModel.workflowAssignments = this.currentClosure.workflowAssignment;
      wfModel.type = this.appComponent.currentView;
      wfModel.grantTypes = this.appComponent.grantTypes;
      wfModel.closure = this.currentClosure;
      wfModel.granteeUsers = this.currentClosure.granteeUsers;
      if (this.appComponent.loggedInUser.organization.organizationType !== 'GRANTEE') {
        wfModel.closure.grant.isInternal = this.appComponent.grantTypes.filter(gt => gt.id === this.currentClosure.grant.grantTypeId)[0].internal;
      }
      wfModel.canManage =
        this.appComponent.loggedInUser.organization.organizationType ===
          "GRANTEE"
          ? false
          : this.currentClosure.flowAuthorities && this.currentClosure.canManage;
      const dialogRef = this.dialog.open(WfassignmentComponent, {
        data: { model: wfModel, userId: this.appComponent.loggedInUser.id, appComp: this.appComponent, adminComp: this },
        panelClass: "wf-assignment-class",
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result.result) {
          const ass: ClosureWorkflowAssignment[] = [];
          for (let data of result.data) {
            const wa = new ClosureWorkflowAssignment();
            wa.id = data.id;
            wa.stateId = data.stateId;
            wa.assignmentId = data.userId;
            wa.closureId = data.closureId;
            wa.customAssignments = data.customAssignments;
            ass.push(wa);
          }

          const httpOptions = {
            headers: new HttpHeaders({
              "Content-Type": "application/json",
              "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
              Authorization: localStorage.getItem("AUTH_TOKEN"),
            }),
          };

          let url =
            "/api/user/" +
            this.appComponent.loggedInUser.id +
            "/closure/" +
            this.currentClosure.id +
            "/assignment";
          this.http
            .post(
              url,
              { closure: this.currentClosure, assignments: ass },
              httpOptions
            )
            .subscribe(
              (closure: GrantClosure) => {
                this.closureService.changeMessage(this.currentClosure, this.appComponent.loggedInUser.id);
                this.currentClosure = closure;
                this.manageClosure(null, closure.id);
              },
              (error) => {
                const errorMsg = error as HttpErrorResponse;

                const y = {
                  enableHtml: true,
                  preventDuplicates: true,
                  positionClass: "toast-top-right",
                  progressBar: true,
                } as Partial<IndividualConfig>;
                const config: Partial<IndividualConfig> = y;
                if (errorMsg.error.message === "Token Expired") {
                  alert("Your session has timed out. Please sign in again.");
                  this.appComponent.logout();
                } else {
                  this.toastr.error(
                    errorMsg.error.message,
                    "19 We encountered an error",
                    config
                  );
                }
              }
            );
        } else {
          dialogRef.close();
        }
      });
    }
  }

  setDateDuration() {
    if (this.currentGrant.startDate && this.currentGrant.endDate) {
      var time =
        new Date(this.currentGrant.endDate).getTime() -
        new Date(this.currentGrant.startDate).getTime();
      time = time + 86400001;
      this.currentGrant.duration = this.humanizer.humanize(time, {
        largest: 2,
        units: ["y", "mo"],
        round: true,
      });
    } else {
      this.currentGrant.duration = "No end date";
    }
  }

  setReportDateDuration() {
    if (this.currentReport.startDate && this.currentReport.endDate) {
      var time =
        new Date(this.currentReport.endDate).getTime() -
        new Date(this.currentReport.startDate).getTime();
      time = time + 86400001;
      this.currentReport.duration = this.humanizer.humanize(time, {
        largest: 2,
        units: ["y", "mo"],
        round: true,
      });
    } else {
      this.currentReport.duration = "No end date";
    }
  }

  manageGrant(notification: Notifications, grantId: number) {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url =
      "/api/user/" + this.appComponent.loggedInUser.id + "/grant/" + grantId;
    this.http.get(url, httpOptions).subscribe((grant: Grant) => {
      if (this.appComponent.currentTenant) {
        let localgrant = this.appComponent.currentTenant.grants.filter(
          (g) => (g.id = grantId)
        )[0];
        if (localgrant) {
          localgrant = grant;
        } else {
          this.appComponent.currentTenant.grants.push(grant);
        }
      }

      this.grantData.changeMessage(grant, this.appComponent.loggedInUser.id);
      this.appComponent.originalGrant = JSON.parse(JSON.stringify(grant));
      this.appComponent.currentView = "grant";

      this.appComponent.selectedTemplate = grant.grantTemplate;

      if (
        grant.workflowAssignments.filter(
          (wf) =>
            wf.stateId === grant.grantStatus.id &&
            wf.assignments === this.appComponent.loggedInUser.id
        ).length > 0 &&
        this.appComponent.loggedInUser.organization.organizationType !==
        "GRANTEE" &&
        grant.grantStatus.internalStatus !== "ACTIVE" &&
        grant.grantStatus.internalStatus !== "CLOSED"
      ) {
        grant.canManage = true;
      } else {
        grant.canManage = false;
      }
      if (
        grant.grantStatus.internalStatus != "ACTIVE" &&
        grant.grantStatus.internalStatus != "CLOSED"
      ) {
        if (grant.canManage) {
          this.appComponent.subMenu = {
            name: "In-progress Grants",
            action: "dg",
          };
          this.router.navigate(["grant/basic-details"]);
        } else {
          this.appComponent.subMenu = {
            name: "In-progress Grants",
            action: "dg",
          };
          this.router.navigate(["grant/preview"]);
        }
      } else {
        if (grant.grantStatus.internalStatus === "ACTIVE") {
          this.appComponent.subMenu = { name: "Active Grants", action: "ag" };
        } else if (grant.grantStatus.internalStatus === "CLOSED") {
          this.appComponent.subMenu = { name: "Closed Grants", action: "cg" };
        }
        this.appComponent.action = "preview";
        this.router.navigate(["grant/preview"]);
      }
      $("#messagepopover").css("display", "none");
    });
  }

  manageDisbursement(notification: Notifications, disbursementId: number) {
    this.disbursementService
      .getDisbursement(disbursementId)
      .then((disbursement: Disbursement) => {
        this.disbursementService.changeMessage(disbursement);
        this.disbursementService.getPermission(disbursement);
        this.appComponent.currentView = "disbursement";

        if (
          disbursement.canManage &&
          disbursement.status.internalStatus != "ACTIVE" &&
          disbursement.status.internalStatus != "CLOSED"
        ) {
          this.appComponent.subMenu = {
            name: "Approvals In-progress",
            action: "id",
          };
          this.router.navigate(["disbursement/approval-request"]);
        } else {
          if (disbursement.status.internalStatus === "ACTIVE") {
            this.appComponent.subMenu = {
              name: "Approvals Active",
              action: "ad",
            };
          } else if (disbursement.status.internalStatus === "REVIEW") {
            this.appComponent.subMenu = {
              name: "Approvals In-progress",
              action: "id",
            };
          } else if (disbursement.status.internalStatus === "CLOSED") {
            this.appComponent.subMenu = {
              name: "Approvals Closed",
              action: "cd",
            };
          }
          this.appComponent.action = "preview";
          this.router.navigate(["disbursement/preview"]);
        }
        $("#messagepopover").css("display", "none");
      });
  }

  manageReport(notification: Notifications, reportId: number) {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url =
      "/api/user/" + this.appComponent.loggedInUser.id + "/report/" + reportId;
    this.http.get(url, httpOptions).subscribe((report: Report) => {
      this.singleReportDataService.changeMessage(report);
      this.appComponent.currentView = "report";

      if (
        report.status.internalStatus === "DRAFT" ||
        report.status.internalStatus === "ACTIVE"
      ) {
        this.appComponent.subMenu = { name: "Upcoming Reports", action: "ur" };
      } else if (report.status.internalStatus === "REVIEW") {
        this.appComponent.subMenu = { name: "Submitted Reports", action: "sr" };
      } else if (report.status.internalStatus === "CLOSED") {
        this.appComponent.subMenu = { name: "Approved Reports", action: "ar" };
      }
      if (
        report.workflowAssignments.filter(
          (wa) => wa.assignmentId === this.appComponent.loggedInUser.id
        ).length === 0
      ) {
        this.appComponent.currentView = "upcoming";
        this.router.navigate(["reports/upcoming"]);
      } else if (report.canManage && report.status.internalStatus != "CLOSED") {
        this.appComponent.action = "report";
        this.router.navigate(["report/report-header"]);
      } else {
        this.appComponent.action = "report";
        this.router.navigate(["report/report-preview"]);
      }

      $("#messagepopover").css("display", "none");
    });
  }

  manageClosure(notification: Notifications, closureId: number) {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url =
      "/api/user/" + this.appComponent.loggedInUser.id + "/closure/" + closureId;
    this.http.get(url, httpOptions).subscribe((closure: GrantClosure) => {
      this.closureService.changeMessage(closure, this.appComponent.loggedInUser.id);
      this.appComponent.currentView = "grant-closure";

      if (
        closure.status.internalStatus === "DRAFT" ||
        closure.status.internalStatus === "ACTIVE"
      ) {
        this.appComponent.subMenu = { name: "In-Progress Closures", action: "urc" };
      } else if (closure.status.internalStatus === "REVIEW") {
        this.appComponent.subMenu = { name: "In-Progress Closures", action: "src" };
      } else if (closure.status.internalStatus === "CLOSED") {
        this.appComponent.subMenu = { name: "Closed Requests", action: "arc" };
      }
      if (
        closure.workflowAssignment.filter(
          (wa) => wa.assignmentId === this.appComponent.loggedInUser.id
        ).length === 0
      ) {
        this.appComponent.currentView = "grant-closure";
        this.router.navigate(["grant-closure/in-progress"]);
      } else if (closure.canManage && closure.status.internalStatus != "CLOSED") {
        this.appComponent.action = "grant-closure";
        this.router.navigate(["grant-closure/header"]);
      } else {
        this.appComponent.action = "grant-closure";
        this.router.navigate(["grant-closure/preview"]);
      }

      $("#messagepopover").css("display", "none");
    });
  }

  getHumanTime(notification): string {
    var time = new Date().getTime() - new Date(notification.postedOn).getTime();
    return this.humanizer.humanize(time, { largest: 1, round: true });
  }

  closeMessagePopup() {
    $("#messagepopover").css("display", "none");
  }

  showMessages() {
    let notifs: Notifications[] = [];
    localStorage.setItem("CM", "0");
    for (let i = 0; i < this.appComponent.notifications.length; i++) {
      if (i < 15) {
        notifs.push(this.appComponent.notifications[i]);
      }
    }
    this.appComponent.notifications = notifs;
    const dialogRef = this.dialog.open(NotificationspopupComponent, {
      data: {
        notifs: this.appComponent.notifications,
        user: this.appComponent.loggedInUser,
      },
      panelClass: "notifications-class",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      if (result.result) {
        if (result.notificationFor === "GRANT") {
          this.manageGrant(result.data, result.data.grantId);
        } else if (result.notificationFor === "REPORT") {
          this.manageReport(result.data, result.data.reportId);
        } else if (result.notificationFor === "DISBURSEMENT") {
          this.manageDisbursement(result.data, result.data.disbursementId);
        } else if (result.notificationFor === "CLOSURE") {
          this.manageClosure(result.data, result.data.reportId);
        }
      }
    });
  }

  showAllReports(report: Report, action: string) {
    this.appComponent.showSaving = false;
    this.appComponent.currentView = "upcoming";
    if (action === "ur") {
      this.router.navigate(["reports/upcoming"]);
    } else if (action === "sr") {
      this.router.navigate(["reports/submitted"]);
    } else if (action === "ar") {
      this.router.navigate(["reports/approved"]);
    } else if (action === "db") {
      this.router.navigate(["/dashboard"]);
    }
  }

  showAllDisbursements(disbursement: Disbursement, action: string) {
    this.appComponent.showSaving = false;
    this.appComponent.currentView = "upcoming";
    if (action === "id") {
      this.router.navigate(["disbursements/in-progress"]);
    } else if (action === "ad") {
      this.router.navigate(["disbursements/approved"]);
    } else if (action === "cd") {
      this.router.navigate(["disbursements/closed"]);
    } else if (action === "db") {
      this.router.navigate(["/dashboard"]);
    }
  }

  showAllClosures(closure: GrantClosure, action: string) {
    this.appComponent.showSaving = false;
    this.appComponent.currentView = "upcoming";
    if (action === "id") {
      this.router.navigate(["disbursements/in-progress"]);
    } else if (action === "ad") {
      this.router.navigate(["disbursements/approved"]);
    } else if (action === "cd") {
      this.router.navigate(["disbursements/closed"]);
    } else if (action === "db") {
      this.router.navigate(["/dashboard"]);
    }
  }

  showProfile() {
    this.appComponent.currentView = "user-profile";
    this.router.navigate(["user-profile"]);
  }

  logout() {
    this.appComponent.logout();
  }

  navigateToGrants(sm: any) {
    this.appComponent.showSaving = false;
    this.showAllGrants(this.currentGrant, sm.action);
  }

  navigateToReports(sm: any) {
    this.appComponent.showSaving = false;
    this.showAllReports(this.currentReport, sm.action);
  }

  navigateToDisbursements(sm: any) {
    this.appComponent.showSaving = false;
    this.showAllDisbursements(this.currentDisbursement, sm.action);
  }

  goToDashboard(toSave: any, type: string) {
    this.appComponent.showSaving = false;
    if (type === "GRANT") {
      this.showAllGrants(toSave, "db");
    } else if (type === "REPORT") {
      this.showAllReports(toSave, "db");
    } else if (type === "DISBURSEMENT") {
      this.showAllDisbursements(toSave, "db");
    } else if (type === "CLOSURE") {
      this.showAllGrants(toSave, "db");
    }
  }
}
