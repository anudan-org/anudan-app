import { GrantType } from './../../model/dahsboard';
import { CurrencyService } from "./../../currency-service";
import { Component, OnInit, DoCheck, AfterViewChecked } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HTTP_INTERCEPTORS,
} from "@angular/common/http";
import { User } from "../../model/user";
import { SerializationHelper, Tenant, Tenants } from "../../model/dahsboard";
import { AppComponent } from "../../app.component";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { GrantDataService } from "../../grant.data.service";
import { DataService } from "../../data.service";
import { GrantUpdateService } from "../../grant.update.service";
import { Grant, GrantTemplate } from "../../model/dahsboard";
import * as $ from "jquery";
import { ToastrService, IndividualConfig } from "ngx-toastr";
import { GrantComponent } from "../../grant/grant.component";
import {
  MatBottomSheet,
  MatDatepickerInputEvent,
  MatDialog,
} from "@angular/material";
import { GrantTemplateDialogComponent } from "../../components/grant-template-dialog/grant-template-dialog.component";
import { FieldDialogComponent } from "../../components/field-dialog/field-dialog.component";
import { TitleCasePipe } from "@angular/common";
import * as indianCurrencyInWords from "indian-currency-in-words";
import * as inf from "indian-number-format";
import {
  HumanizeDurationLanguage,
  HumanizeDuration,
} from "humanize-duration-ts";
import { GranttypeSelectionDialogComponent } from 'app/components/granttype-selection-dialog/granttype-selection-dialog.component';

class Timer {
  readonly start = performance.now();

  constructor(private readonly name: string) { }

  stop() {
    const time = performance.now() - this.start;
    console.log("Timer:", this.name, "finished in", Math.round(time), "ms");
  }
}

@Component({
  selector: "app-draft-grants",
  templateUrl: "./draft-grants.component.html",
  styleUrls: ["./draft-grants.component.css"],
  providers: [GrantComponent, TitleCasePipe],
  styles: [
    `
      ::ng-deep .specific-class > .mat-expansion-indicator:after {
        color: black;
      }

      ::ng-deep .mat-tooltip {
        color: #fff;
        opacity: 1;
      }

      ::ng-deep .mat-checkbox-checked.mat-accent .mat-checkbox-background {
        background-color: #39743c !important;
      }

      ::ng-deep
        .mat-checkbox:not(.mat-checkbox-disabled).mat-accent
        .mat-checkbox-ripple
        .mat-ripple-element {
        background-color: #39743c !important;
      }
    `,
  ],
})
export class DraftGrantsComponent implements OnInit {
  user: User;
  tenants: Tenants;
  currentTenant: Tenant;
  hasTenant = false;
  hasKpisToSubmit: boolean;
  kpiSubmissionDate: Date;
  kpiSubmissionTitle: string;
  currentGrant: Grant;
  currentGrantId: number;
  grantsDraft = [];
  grantsActive = [];
  grantsClosed = [];
  logoURL: string;
  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService);
  deleteGrantEvent: boolean = false;
  private t: Timer;

  constructor(
    private http: HttpClient,
    public appComponent: AppComponent,
    private router: Router,
    private route: ActivatedRoute,
    private data: GrantDataService,
    private toastr: ToastrService,
    public grantComponent: GrantComponent,
    private dataService: DataService,
    private grantUpdateService: GrantUpdateService,
    private dialog: MatDialog,
    private titlecasePipe: TitleCasePipe,
    private currencyService: CurrencyService,
  ) { }

  ngOnInit() {
    this.appComponent.subMenu = { name: "In-progress Grants", action: "dg" };
    const user = JSON.parse(localStorage.getItem("USER"));
    this.appComponent.loggedInUser = user;
    console.log(this.appComponent.loggedInUser.permissions);

    this.dataService.currentMessage.subscribe(
      (id) => (this.currentGrantId = id)
    );
    this.data.currentMessage.subscribe((grant) => (this.currentGrant = grant));

    this.appComponent.grantRemoteUpdate.subscribe((val) => {
      if (val) {
        this.segregateGrantData();
        this.appComponent.grantRemoteUpdate.next(false);
      }
    });

    this.fetchDashboard(user.id, this.currentGrant);
    this.getGrantTypes();
    this.grantUpdateService.currentMessage.subscribe((id) => {
      if (id) {
        //this.fetchDashboard(user.id);
      }
    });

    const tenantCode = localStorage.getItem("X-TENANT-CODE");
    this.logoURL = "/api/public/images/" + tenantCode + "/logo";
  }

  getGrantTypes() {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url = "/api/user/" + this.appComponent.loggedInUser.id + "/grant/grantTypes";
    this.http.get(url, httpOptions).subscribe((result: GrantType[]) => {
      this.appComponent.grantTypes = result;
    });
  }

  createGrant() {

    if (this.appComponent.grantTypes.length > 1) {
      const dg = this.dialog.open(GranttypeSelectionDialogComponent, {
        data: this.appComponent.grantTypes,
        panelClass: 'grant-template-class'
      });

      dg.afterClosed().subscribe(result => {
        if (result && result.result) {
          this.selectTemplateAndCreateGrant(result.selectedGrantType.id);
        }
      });
    } else {
      this.selectTemplateAndCreateGrant(this.appComponent.grantTypes[0].id)
    }
  }

  selectTemplateAndCreateGrant(grantType) {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };
    const user = JSON.parse(localStorage.getItem("USER"));
    const url = "/api/user/" + user.id + "/grant/templates";
    this.http
      .get<GrantTemplate[]>(url, httpOptions)
      .subscribe((templates: GrantTemplate[]) => {
        const dialogRef = this.dialog.open(GrantTemplateDialogComponent, {
          data: templates,
          panelClass: "grant-template-class",
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result.result) {
            this.grantComponent.createGrant(result.selectedTemplate, grantType);
            this.appComponent.selectedTemplate = result.selectedTemplate;
          } else {
            dialogRef.close();
          }
        });
      });
  }

  fetchDashboard(userId: string, grant: Grant) {
    grant = null;
    if (grant) {
      this.saveGrant(grant);
    } else {
      console.log(">>>>GRANT RETRIEVAL INITIATED>>>>" + new Date());
      const httpOptions = {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
          "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
          Authorization: localStorage.getItem("AUTH_TOKEN"),
        }),
      };

      this.appComponent.loggedIn = true;

      const url = "/api/users/" + userId + "/dashboard";

      this.http.get<Tenants>(url, httpOptions).subscribe(
        (tenants: Tenants) => {
          // this.tenants = new Tenants();
          this.tenants = tenants;
          console.log(">>>>  GRANT RETRIEVAL END  >>>>" + new Date());
          // this.tenants = tenants;
          if (
            this.tenants &&
            this.tenants.tenants &&
            this.tenants.tenants.length > 0
          ) {
            this.currentTenant = this.tenants.tenants[0];
            this.appComponent.currentTenant = this.currentTenant;
            this.hasTenant = true;
            localStorage.setItem("X-TENANT-CODE", this.currentTenant.name);
            this.segregateGrantData();
            this.grantUpdateService.changeMessage(false);
          }
        },
        (error) => {
          const errorMsg = error as HttpErrorResponse;
          const x = {
            enableHtml: true,
            preventDuplicates: true,
            positionClass: "toast-top-full-width",
            progressBar: true,
          } as Partial<IndividualConfig>;
          const y = {
            enableHtml: true,
            preventDuplicates: true,
            positionClass: "toast-top-right",
            progressBar: true,
          } as Partial<IndividualConfig>;
          const errorconfig: Partial<IndividualConfig> = x;
          const config: Partial<IndividualConfig> = y;
          if (errorMsg.error.message === "Token Expired") {
            //this.toastr.error('Logging you out now...',"Your session has expired", errorconfig);
            alert("Your session has timed out. Please sign in again.");
            this.appComponent.logout();
          } else {
            this.toastr.error(
              errorMsg.error.message,
              "15 We encountered an error",
              config
            );
          }
        }
      );
    }
  }

  segregateGrantData() {
    this.grantsDraft = [];
    this.grantsActive = [];
    this.grantsClosed = [];
    for (const grant of this.appComponent.currentTenant.grants) {
      if (
        grant.grantStatus.internalStatus === "DRAFT" ||
        grant.grantStatus.internalStatus === "REVIEW"
      ) {
        this.grantsDraft.push(grant);
      } else if (grant.grantStatus.internalStatus === "ACTIVE") {
        this.grantsActive.push(grant);
      } else if (grant.grantStatus.internalStatus === "CLOSED") {
        this.grantsClosed.push(grant);
      }

      if (
        grant.workflowAssignment.filter(
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
      for (const submission of grant.submissions) {
        if (submission.flowAuthorities) {
          this.hasKpisToSubmit = true;
          this.kpiSubmissionTitle = submission.title;
          // this.kpiSubmissionDate = submission.submitBy;
          break;
        }
      }
      if (this.hasKpisToSubmit) {
        break;
      }
    }
  }

  manageGrant(grant: Grant) {
    if (this.deleteGrantEvent) {
      return;
    }
    if (
      grant.workflowAssignment.filter(
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
    this.dataService.changeMessage(grant.id);
    this.data.changeMessage(grant, this.appComponent.loggedInUser.id);
    this.appComponent.originalGrant = JSON.parse(JSON.stringify(grant));
    this.appComponent.currentView = "grant";

    this.appComponent.selectedTemplate = grant.grantTemplate;

    if (grant.canManage) {
      this.router.navigate(["grant/basic-details"]);
    } else {
      this.appComponent.action = "preview";
      this.router.navigate(["grant/preview"]);
    }
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
          this.appComponent.loggedInUser.id +
          "/grant/" +
          grant.id;

        this.http.delete(url, httpOptions).subscribe((val: any) => {
          const user = JSON.parse(localStorage.getItem("USER"));
          this.fetchDashboard(user.id, null);
        });
      } else {
        dialogRef.close();
      }
    });
  }

  saveGrant(grant: Grant) {
    if (!grant.canManage) {
      return;
    }

    this.appComponent.autosaveDisplay = "Saving changes...     ";
    /*const errors = this.validateFields();
    if (errors) {
        this.toastr.error($(this.erroredElement).attr('placeholder') + ' is required', 'Missing entries');
        $(this.erroredElement).focus();
    } else {*/
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url =
      "/api/user/" + this.appComponent.loggedInUser.id + "/grant/" + grant.id;

    this.http.put<Grant>(url, grant, httpOptions).subscribe(
      (grant: Grant) => {
        //this.originalGrant = JSON.parse(JSON.stringify(grant));
        this.data.changeMessage(grant, this.appComponent.loggedInUser.id);
        //this.setDateDuration();
        //this.dataService.changeMessage(grant.id);
        //this.currentGrant = grant;
        //this._setEditMode(false);
        //this.currentSubmission = null;
        //this.checkGrantPermissions();

        this.appComponent.autosave = false;
        //this.appComponent.autosaveDisplay = 'Last saved @ ' + this.datepipe.transform(new Date(), 'hh:mm:ss a') + '     ';
        this.fetchDashboard(String(this.appComponent.loggedInUser.id), null);
      },
      (error) => {
        const errorMsg = error as HttpErrorResponse;
        //console.log(error);
        const x = { enableHtml: true, preventDuplicates: true } as Partial<
          IndividualConfig
        >;
        const config: Partial<IndividualConfig> = x;
        if (errorMsg.error.message === "Token Expired") {
          this.toastr.error(
            "Your session has expired",
            "Logging you out now...",
            config
          );
          setTimeout(() => {
            this.appComponent.logout();
          }, 4000);
        } else {
          this.toastr.error(
            errorMsg.error.message,
            "16 We encountered an error",
            config
          );
        }
      }
    );
    // }
  }

  getGrantAmountInWords(amount: number) {
    let amtInWords = "-";
    if (amount) {
      amtInWords = indianCurrencyInWords(amount)
        .replace("Rupees", "")
        .replace("Paisa", "");
      return "Rs. " + this.titlecasePipe.transform(amtInWords);
    }
    return amtInWords;
  }

  getFormattedGrantAmount(amount: number): string {
    return inf.format(amount, 2);
  }


  getGrantTypeName(typeId): string {
    return this.appComponent.grantTypes.filter(t => t.id === typeId)[0].name;
  }

  public getGrantTypeColor(typeId): any {
    return this.appComponent.grantTypes.filter(t => t.id === typeId)[0].colorCode;
  }

  isExternalGrant(grant: Grant): boolean {
    const grantType = this.appComponent.grantTypes.filter(gt => gt.id === grant.grantTypeId)[0];
    if (!grantType.internal) {
      return true;
    } else {
      return false;
    }
  }
}
