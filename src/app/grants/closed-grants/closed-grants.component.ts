import { UiUtilService } from './../../ui-util.service';
import { CurrencyService } from "./../../currency-service";
import { Component, OnInit, ViewChild } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
  HTTP_INTERCEPTORS,
} from "@angular/common/http";
import { User } from "../../model/user";
import { GrantType, SerializationHelper, Tenant, Tenants } from "../../model/dahsboard";
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
import { GranttypeSelectionDialogComponent } from "app/components/granttype-selection-dialog/granttype-selection-dialog.component";
import { SearchFilterComponent } from "app/layouts/admin-layout/search-filter/search-filter.component";

@Component({
  selector: "app-closed-grants",
  templateUrl: "./closed-grants.component.html",
  styleUrls: ["./closed-grants.component.css"],
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
export class ClosedGrantsComponent implements OnInit {
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
  grantsClosed: Grant[] = [];
  grantsClosedForAmendment: Grant[] =[];
  logoURL: string;
  filteredGrants: Grant[] = [];
  searchClosed = true;
  filterReady = false;
  filterCriteria: any;
  selectedTab: any;
  @ViewChild("appSearchFilter") appSearchFilter: SearchFilterComponent;


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
    public currencyService: CurrencyService,
    public uiService: UiUtilService
  ) { }

  ngOnInit() {
    this.appComponent.subMenu = { name: "Closed Grants", action: "cg" };
    const user = JSON.parse(localStorage.getItem("USER"));
    this.appComponent.loggedInUser = user;
    console.log(this.appComponent.loggedInUser.permissions);

    this.dataService.currentMessage.subscribe(
      (id) => (this.currentGrantId = id)
    );
    this.data.currentMessage.subscribe((grant) => (this.currentGrant = grant));
    this.fetchDashboard(user.id, this.currentGrant, 'Closed');
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

  fetchDashboard(userId: string, grant: Grant, closedStatus: string) {
    grant = null;
    if (grant) {
      this.saveGrant(grant);
    } else {
      console.log("dashboard");
      const queryParams1 = new HttpParams().set('forStatus', 'closed');
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
          // this.tenants = new Tenants();
          this.tenants = tenants;
          console.log(this.tenants);
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
            this.grantsDraft = [];
            this.grantsActive = [];
            this.grantsClosed = [];
            this.grantsClosedForAmendment =[];

            this.getFilteredGrants(this.currentTenant.grants, closedStatus);
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

  getFilteredGrants(grants, closedStatus) {
    if (closedStatus==='Closed' ||closedStatus===''){
    for (const grant of grants) {
          
      if (grant.grantStatus.internalStatus === "CLOSED" && grant.amended !==true ) {
        this.grantsClosed.push(grant);
      }
    }
    this.filteredGrants = this.grantsClosed;
    } else {
      for (const grant of grants) {
          
      if (grant.grantStatus.internalStatus === "CLOSED" && grant.amended ===true ) {
        this.grantsClosedForAmendment.push(grant);
      }
    }
    this.filteredGrants = this.grantsClosedForAmendment;
    }
    
  }

  tabClicked(ev) {
    this.selectedTab = ev.index;
    if (ev.index === 0) {
      this.hasTenant = false;
      this.fetchDashboard(String(this.appComponent.loggedInUser.id), this.currentGrant, 'Closed');
    } else if (ev.index === 1) {
      this.hasTenant = false;
      this.fetchDashboard(String(this.appComponent.loggedInUser.id), this.currentGrant, 'ClosedForAmendment');
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

    this.http.get(url, httpOptions).subscribe((grant: Grant) => {
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
          this.fetchDashboard(user.id, null,null);
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
      
        this.data.changeMessage(grant, this.appComponent.loggedInUser.id);
  

        this.appComponent.autosave = false;
        //this.appComponent.autosaveDisplay = 'Last saved @ ' + this.datepipe.transform(new Date(), 'hh:mm:ss a') + '     ';
        this.fetchDashboard(String(this.appComponent.loggedInUser.id), null,null);
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
  getCleanClosureNote(grant) {
    if (this.appComponent.loggedInUser.organization.organizationType !== 'GRANTEE') {
      return grant.note.substr(grant.note.lastIndexOf('</i>') + 4);
    } else {
      return 'This Grant has been closed.'
    }
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
    this.filteredGrants = this.grantsClosed.filter(g => {
      return (
        (g.name && g.name.trim() !== '' && g.name.toLowerCase().includes(val)) ||
        (g.organization && g.organization.name && g.organization.name.toLowerCase().includes(val)) ||
        (g.referenceNo && g.referenceNo.toLowerCase().includes(val)) ||
        (g.ownerName && g.ownerName.toLowerCase().includes(val))
      )
    });

    this.filterReady = true;

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
}
