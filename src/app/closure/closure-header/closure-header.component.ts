import { User } from './../../model/user';
import { Configuration } from './../../model/app-config';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Grant, WorkflowStatus } from './../../model/dahsboard';
import { APP_DATE_FORMATS } from './../../reports/report/report-sections/report-sections.component';
import { SectionUtilService } from './../../section-util.service';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { SidebarComponent } from './../../components/sidebar/sidebar.component';
import { ClosureDataService } from './../../closure.data.service';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ToastrService, IndividualConfig } from 'ngx-toastr';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { AdminLayoutComponent } from 'app/layouts/admin-layout/admin-layout.component';
import { GrantClosure, ClosureSectionInfo, Reason } from './../../model/closures';
import { AppComponent } from 'app/app.component';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import * as inf from "indian-number-format";
import * as indianCurrencyInWords from "indian-currency-in-words";
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material';
import { CustomDateAdapter } from 'app/model/dahsboard';


@Component({
  selector: 'app-closure-header',
  templateUrl: './closure-header.component.html',
  styleUrls: ['./closure-header.component.scss'],
  providers: [
    SidebarComponent,
    {
      provide: DateAdapter,
      useClass: CustomDateAdapter,
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: APP_DATE_FORMATS,
    },
    TitleCasePipe,
  ],
})
export class ClosureHeaderComponent implements OnInit {

  currentClosure: GrantClosure;
  canManage = false;
  action: string;
  subscribers: any = {};
  myControl: FormControl;
  options: Reason[];
  filteredOptions: Observable<Reason[]>;
  closureWorkflowStatuses: WorkflowStatus[];
  tenantUsers: User[];


  @ViewChild("createSectionModal") createSectionModal: ElementRef;




  constructor(public appComp: AppComponent,
    private adminComp: AdminLayoutComponent,
    private titlecasePipe: TitleCasePipe,
    private toastr: ToastrService,
    private http: HttpClient,
    private closureService: ClosureDataService,
    private sidebar: SidebarComponent,
    private router: Router,
    private sectionUtilService: SectionUtilService,
    private route: ActivatedRoute,
    private datePipe: DatePipe,) {

    this.route.params.subscribe((p) => {
      this.action = p["action"];
      this.appComp.action = this.action;
    });

    this.subscribers = this.router.events.subscribe((val) => {
      if (
        val instanceof NavigationStart &&
        val.url === "/grant-closure/preview"
      ) {
        this.appComp.action = "grant-closure-preview";
      } else if (
        val instanceof NavigationStart &&
        val.url !== "/grant-closure/preview"
      ) {
        this.appComp.action = "";
      }

      if (val instanceof NavigationStart) {
        if (this.currentClosure &&
          !this.appComp.closureSaved
        ) {
          this.appComp.closureSaved = true;
          this.saveClosure();

        }

        if (val.url === "/grants/active") {
          this.subscribers.unsubscribe();
        }
      }
    });


    this.appComp.closureUpdated.subscribe((statusUpdate) => {
      if (statusUpdate.status && statusUpdate.closureId && this.appComp.loggedInUser !== undefined) {
        let closure = closureService.updateClosure(statusUpdate.closureId, this.appComp);
        if (closure) {
          closureService.changeMessage(closure, this.appComp.loggedInUser.id);
        }
      }
    });



  }

  ngOnInit() {

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    this.closureService.currentMessage.subscribe((closure) => {
      this.currentClosure = closure;
      let url = '/api/app/config/closure/' + this.currentClosure.id;

      this.http.get(url, httpOptions).subscribe((config: Configuration) => {
        this.closureWorkflowStatuses = config.closureWorkflowStatuses;
        this.appComp.closureWorkflowStatuses = config.closureWorkflowStatuses;
        this.tenantUsers = config.tenantUsers;
        this.appComp.tenantUsers = config.tenantUsers;
        this.appComp.closureTransitions = config.reportTransitions;
      });
    });

    this.getClosureReasons();

    this.appComp.createNewClosureSection.subscribe((val) => {
      if (val) {
        $(".modal-backdrop").remove();

        this.addNewSection();
        this.appComp.createNewClosureSection.next(false);
      }
    });

    this.closureService.currentMessage.subscribe((closure) => {
      this.currentClosure = closure;
      this.myControl = new FormControl(this.currentClosure.reason);
      if (this.appComp.loggedInUser.organization.organizationType === 'GRANTEE') {
        this.myControl.disable();
      }
      console.log(this.currentClosure);
    });

  }

  getClosureReasons() {
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
      "/closure/reasons";

    this.http.get(url, httpOptions).subscribe((reasons: Reason[]) => {
      this.options = reasons;
      const r = this.options ? this.options.slice() : [];
      this.filteredOptions = this.myControl.valueChanges.pipe(
        startWith(""),
        map((value) => (typeof value === "string" ? value : value.name)),
        map((name) => (name ? this._filter(name) : r))
      );
    });
  }

  showWorkflowAssigments() {
    this.adminComp.showWorkflowAssigments();
  }

  showHistory(type, obj) {
    this.adminComp.showHistory(type, obj);
  }

  showClosureDocuments() {
    //Intentionally left blank
  }

  manageGrant() {
    this.adminComp.manageGrant(null, this.currentClosure.grant.id);
  }

  isExternalGrant(grant: Grant): boolean {

    if (this.appComp.loggedInUser.organization.organizationType === 'GRANTEE') {
      return true;
    }

    const grantType = this.appComp.grantTypes.filter(gt => gt.id === grant.grantTypeId)[0];
    if (!grantType || !grantType.internal) {
      return true;
    } else {
      return false;
    }
  }

  getFormattedGrantAmount(amount: number): string {
    return inf.format(amount, 2);
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

  public getGrantTypeColor(typeId): any {
    return this.appComp.grantTypes.filter(t => t.id === typeId)[0].colorCode;
  }

  saveSection() {
    const sectionName = $("#sectionTitleInput");
    if (sectionName.val().trim() === "") {
      this.toastr.warning("Section name cannot be left blank", "Warning");
      sectionName.focus();
      return;
    }

    const createSectionModal = this.createSectionModal.nativeElement;

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
      "/closure/" +
      this.currentClosure.id +
      "/template/" +
      this.currentClosure.template.id +
      "/section/" +
      sectionName.val();

    this.http
      .post<ClosureSectionInfo>(url, this.currentClosure, httpOptions)
      .subscribe(
        (info: ClosureSectionInfo) => {
          this.closureService.changeMessage(info.closure, this.appComp.loggedInUser.id);

          sectionName.val("");
          $(createSectionModal).modal("hide");
          this.appComp.sectionAdded = true;
          this.sidebar.buildSectionsSideNav(null);
          this.appComp.sectionInModification = false;
          this.router.navigate([
            "grant-closure/section/" +
            this.sectionUtilService.getCleanText(
              info.closure.closureDetails.sections.filter(
                (a) => a.id === info.sectionId
              )[0]
            ),
          ]);
        },
        (error) => {
          const errorMsg = error as HttpErrorResponse;
          console.log(error);
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
              this.appComp.logout();
            }, 4000);
          } else {
            this.toastr.error(
              errorMsg.error.message,
              "26 We encountered an error",
              config
            );
          }
        }
      );
  }

  public getGrantTypeName(typeId): string {
    return this.appComp.grantTypes.filter(t => t.id === typeId)[0].name;
  }

  addNewSection() {
    this.appComp.sectionInModification = true;
    const createSectionModal = this.createSectionModal.nativeElement;
    const titleElem = $(createSectionModal).find("#createSectionLabel");
    $(titleElem).html("Add new section");
    $(createSectionModal).modal("show");
  }


  saveClosure() {
    if (!this.currentClosure.canManage) {
      return;
    }

    this.appComp.showSaving = true;
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
      "/closure/" +
      this.currentClosure.id;

    this.http
      .put(url, this.currentClosure, httpOptions)
      .subscribe((closure: GrantClosure) => {
        this.closureService.changeMessage(closure, this.appComp.loggedInUser.id);
        this.appComp.closureSaved = false;
        this.appComp.autosaveDisplay =
          "Last saved @ " +
          this.datePipe.transform(new Date(), "hh:mm:ss a") +
          "     ";
      });
  }

  private _filter(value: string): Reason[] {
    const filterValue = value.toLowerCase();
    const selectedReason = this.options.filter((option) =>
      option.reason.toLowerCase().includes(filterValue)
    );
    if (selectedReason.length === 0) {
      const newReason = new Reason();
      newReason.id = 0 - Math.round(Math.random() * 1000000000);
      newReason.organizationId = this.appComp.loggedInUser.organization.id;
      newReason.reason = 'Add a new Closure Reason: "' + value + '"';
      selectedReason.push(newReason);
    }

    return selectedReason;
  }

  displayFn = (reason) => {
    if (reason) {
      if (reason.reason.startsWith("Add a new Closure Reason: ")) {
        reason.reason = reason.reason.replace("Add a new Closure Reason: ", "");
        reason.reason = reason.reason.replace('"', "");
        reason.reason = reason.reason.replace('"', "");
      }
      this.currentClosure.reason = reason;
    }
    return reason ? reason.reason : undefined;
  };
}
