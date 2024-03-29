import { ClosureDataService } from 'app/closure.data.service';
import { GrantClosure } from 'app/model/closures';
import { UiUtilService } from './../../ui-util.service';
import { CurrencyService } from "./../../currency-service";
import { Component, OnInit, ViewChild } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from "@angular/common/http";
import { User } from "../../model/user";
import { GrantType, Tenant, Tenants } from "../../model/dahsboard";
import { AppComponent } from "../../app.component";
import { Router } from "@angular/router";
import { GrantDataService } from "../../grant.data.service";
import { DataService } from "../../data.service";
import { GrantUpdateService } from "../../grant.update.service";
import { Grant, GrantTemplate } from "../../model/dahsboard";
import { ToastrService, IndividualConfig } from "ngx-toastr";
import { GrantComponent } from "../../grant/grant.component";
import {
  MatDialog,
} from "@angular/material";
import { GrantTemplateDialogComponent } from "../../components/grant-template-dialog/grant-template-dialog.component";
import { FieldDialogComponent } from "../../components/field-dialog/field-dialog.component";
import * as indianCurrencyInWords from "indian-currency-in-words";
import { TitleCasePipe } from "@angular/common";
import * as inf from "indian-number-format";
import { GranttypeSelectionDialogComponent } from "app/components/granttype-selection-dialog/granttype-selection-dialog.component";
import { SearchFilterComponent } from 'app/layouts/admin-layout/search-filter/search-filter.component';

@Component({
  selector: "app-active-grants",
  templateUrl: "./active-grants.component.html",
  styleUrls: ["./active-grants.component.css"],
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
export class ActiveGrantsComponent implements OnInit {
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
  grantsActive: Grant[] = [];
  grantsClosed = [];
  logoURL: string;
  filteredGrants: Grant[] = [];
  filteredClosures: GrantClosure[] = [];
  searchClosed = true;
  filterReady = false;
  filterCriteria: any;
  @ViewChild("appSearchFilter") appSearchFilter: SearchFilterComponent;
  closures: GrantClosure[];
  deleteClosureClicked: boolean = false;
  selectedTab: any;

  constructor(
    private http: HttpClient,
    public appComponent: AppComponent,
    private router: Router,
    public data: GrantDataService,
    private toastr: ToastrService,
    public grantComponent: GrantComponent,
    private dataService: DataService,
    private grantUpdateService: GrantUpdateService,
    private dialog: MatDialog,
    private titlecasePipe: TitleCasePipe,
    public currencyService: CurrencyService,
    public uiService: UiUtilService,
    public closureService: ClosureDataService
  ) { }

  ngOnInit() {
    this.appComponent.subMenu = { name: "Active Grants", action: "ag" };
    const user = JSON.parse(localStorage.getItem("USER"));
    this.appComponent.loggedInUser = user;
    console.log(this.appComponent.loggedInUser.permissions);

    this.dataService.currentMessage.subscribe(
      (id) => (this.currentGrantId = id)
    );
    this.data.currentMessage.subscribe((grant) => (this.currentGrant = grant));
    this.fetchDashboard(user.id, this.currentGrant);
    this.getGrantsUnderClosure();
    this.grantUpdateService.currentMessage.subscribe((id) => {
      //do nothing
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

  getGrantsUnderClosure() {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    this.appComponent.loggedIn = true;

    const url = "/api/user/" + this.appComponent.loggedInUser.id + "/closure/";
    this.http.get<GrantClosure[]>(url, httpOptions).subscribe((closures: GrantClosure[]) => {
      this.closures = closures;
      this.filteredClosures = closures;
    });
  }
  fetchDashboard(userId: string, grant: Grant) {
    grant = null;
    if (grant) {
      this.saveGrant(grant);
    } else {
      console.log("dashboard");
      const queryParams1 = new HttpParams().set('forStatus', 'active');
      const httpOptions = {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
          "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
          Authorization: localStorage.getItem("AUTH_TOKEN"),
        }),
        params: queryParams1
      };

      this.appComponent.loggedIn = true;

      const url = "/api/users/" + userId + "/dashboard";
      this.http.get<Tenants>(url, httpOptions).subscribe(
        (tenants: Tenants) => {
          this.tenants = tenants;
          console.log(this.tenants);
          if (
            this.tenants &&
            this.tenants.tenants &&
            this.tenants.tenants.length > 0
          ) {
            this.currentTenant = this.tenants.tenants[0];
            this.appComponent.currentTenant = this.currentTenant;
            this.hasTenant = true;
            localStorage.setItem("X-TENANT-CODE", this.currentTenant.name);
            this.grantsDraft = [];
            this.grantsActive = [];
            this.grantsClosed = [];
            for (const grant1 of this.currentTenant.grants) {
              if (
                grant1.grantStatus.internalStatus === "DRAFT" ||
                grant1.grantStatus.internalStatus === "REVIEW"
              ) {
                this.grantsDraft.push(grant1);
              } else if (grant1.grantStatus.internalStatus === "ACTIVE") {
                this.grantsActive.push(grant1);
              } else if (grant1.grantStatus.internalStatus === "CLOSED") {
                this.grantsClosed.push(grant1);
              }

              if (
                grant1.workflowAssignment.filter(
                  (wf) =>
                    wf.stateId === grant1.grantStatus.id &&
                    wf.assignments === this.appComponent.loggedInUser.id
                ).length > 0 &&
                this.appComponent.loggedInUser.organization.organizationType !==
                "GRANTEE" &&
                grant1.grantStatus.internalStatus !== "ACTIVE" &&
                grant1.grantStatus.internalStatus !== "CLOSED"
              ) {
                grant1.canManage = true;
              } else {
                grant1.canManage = false;
              }
              for (const submission of grant1.submissions) {
                if (submission.flowAuthorities) {
                  this.hasKpisToSubmit = true;
                  this.kpiSubmissionTitle = submission.title;
                  break;
                }
              }
              if (this.hasKpisToSubmit) {
                break;
              }
            }
            this.filteredGrants = this.grantsActive;
            this.grantUpdateService.changeMessage(false);
          }
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
              "15 We encountered an error",
              config
            );
          }
        }
      );
    }
  }

  manageGrant(grant: Grant) {

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      })
    };

    this.appComponent.loggedIn = true;

    const url = "/api/user/" + this.appComponent.loggedInUser.id + "/grant/" + grant.id;

    this.http.get(url, httpOptions).subscribe((grant1: Grant) => {
      if (
        grant1.workflowAssignments.filter(
          (wf) =>
            wf.stateId === grant1.grantStatus.id &&
            wf.assignments === this.appComponent.loggedInUser.id
        ).length > 0 &&
        this.appComponent.loggedInUser.organization.organizationType !==
        "GRANTEE" &&
        grant1.grantStatus.internalStatus !== "ACTIVE" &&
        grant1.grantStatus.internalStatus !== "CLOSED"
      ) {
        grant1.canManage = true;
      } else {
        grant1.canManage = false;
      }
      this.dataService.changeMessage(grant1.id);
      this.data.changeMessage(grant1, this.appComponent.loggedInUser.id);
      this.appComponent.originalGrant = JSON.parse(JSON.stringify(grant1));
      this.appComponent.currentView = "grant";

      this.appComponent.selectedTemplate = grant1.grantTemplate;

      if (grant1.canManage) {
        this.router.navigate(["grant/basic-details"]);
      } else {
        this.appComponent.action = "preview";
        this.router.navigate(["grant/preview"]);
      }
    });

  }

  deleteGrant(grant: Grant) {
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: "Are you sure you want to delete this grant?", btnMain: "Delete Grant", btnSecondary: "Not Now" },
      panelClass: "center-class",
    });

    dialogRef.afterClosed().subscribe((result) => {
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
        this.data.changeMessage(grant, this.appComponent.loggedInUser.id);
        this.appComponent.autosave = false;
        this.fetchDashboard(String(this.appComponent.loggedInUser.id), null);
      },
      (error) => {
        const errorMsg = error as HttpErrorResponse;
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
    if (this.appComponent.loggedInUser.organization.organizationType === 'GRANTEE') {
      return true;
    }
    const grantType = this.appComponent.grantTypes.filter(gt => gt.id === grant.grantTypeId)[0];
    if (!grantType.internal) {
      return true;
    } else {
      return false;
    }
  }

  startFilter(val) {
    val = val.toLowerCase();
    this.filterCriteria = val;
    if (this.selectedTab === 0) {
      this.filteredGrants = this.grantsActive.filter(g => {
        return (
          (g.name && g.name.trim() !== '' && g.name.toLowerCase().includes(val)) ||
          (g.organization && g.organization.name && g.organization.name.toLowerCase().includes(val)) ||
          (g.referenceNo && g.referenceNo.toLowerCase().includes(val)) ||
          (g.ownerName && g.ownerName.toLowerCase().includes(val))
        )
      });

      this.filterReady = true;
    } else {
      this.filteredClosures = this.closures.filter(g => {
        return (
          (g.grant.name && g.grant.name.trim() !== '' && g.grant.name.toLowerCase().includes(val)) ||
          (g.grant.grantorOrganization && g.grant.grantorOrganization.name && g.grant.grantorOrganization.name.toLowerCase().includes(val)) ||
          (g.grant.referenceNo && g.grant.referenceNo.toLowerCase().includes(val)) ||
          (g.ownerName && g.ownerName.toLowerCase().includes(val))
        )
      });

      this.filterReady = true;
    }

  }

  resetFilterFlag(val) {
    this.filterReady = val;
  }


  closeSearch(ev: any) {
    this.searchClosed = ev;
  }

  openSearch() {
    if (this.searchClosed) {
      this.searchClosed = false;
    } else {
      this.searchClosed = true;
      this.appSearchFilter.closeSearch();
    }
  }

  getRoundedFigure(grant) {
    return Math.round(((grant.approvedDisbursementsTotal / grant.amount) * 100))
  }

  otherFundsPercentage(grant) {
    if (grant.plannedFundOthers > 0 ) {
      return Math.round(((grant.actualFundOthers / grant.plannedFundOthers) * 100))
    } else {
      return null;
    }
    
  }
  manageClosure(closure: GrantClosure) {
    if (this.deleteClosureClicked) {
      return;
    }

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
      this.appComponent.currentView = 'grant-closure';
      this.closureService.changeMessage(closure1, this.appComponent.loggedInUser.id);
      if (closure1.canManage && closure1.status.internalStatus != 'CLOSED') {
        this.appComponent.action = 'grant-closure';
        this.router.navigate(['grant-closure/header']);
      } else {
        this.appComponent.action = 'grant-closure';
        this.router.navigate(['grant-closure/preview']);
      }
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
            this.getGrantsUnderClosure();
            this.deleteClosureClicked = false;
          })
      } else {
        this.deleteClosureClicked = false;
        dialogRef.close();
      }
    });
  }

  tabClicked(ev) {
    this.selectedTab = ev.index;
    if (ev.index === 0) {
      this.hasTenant = false;
      this.fetchDashboard(String(this.appComponent.loggedInUser.id), this.currentGrant);
    } else if (ev.index === 1) {
      this.getGrantsUnderClosure();
    }
  }
}
