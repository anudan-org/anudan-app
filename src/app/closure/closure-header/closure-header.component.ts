import { DocpreviewComponent } from './../../docpreview/docpreview.component';
import { DocpreviewService } from './../../docpreview.service';
import { FieldDialogComponent } from './../../components/field-dialog/field-dialog.component';
import { DocManagementService } from './../../doc-management.service';
import { MessagingComponent } from './../../components/messaging/messaging.component';
import { DisbursementDataService } from 'app/disbursement.data.service';
import { CurrencyService } from './../../currency-service';
import { User } from './../../model/user';
import { Configuration } from './../../model/app-config';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Grant, WorkflowStatus, Section, Attribute, TableData, AttachmentDownloadRequest } from './../../model/dahsboard';
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
import { DateAdapter, MAT_DATE_FORMATS, MatDialog } from '@angular/material';
import { CustomDateAdapter } from 'app/model/dahsboard';
import { ClosureCovernoteComponent } from '../closure-covernote/closure-covernote.component';


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
  styles: [
    `
      ::ng-deep 
        .refunds-holder
        .mat-form-field-appearance-legacy
        .mat-form-field-infix {
        padding: 0 !important;
      }
      
      ::ng-deep .amountPlaceholder {
        text-align: left !important;
        color: #b1b0b0 !important;
      }
    
      ::ng-deep
        .refunds-holder
        .mat-form-field-appearance-legacy
        .mat-form-field-wrapper {
        padding-bottom: 0 !important;
      }
    
      ::ng-deep .refunds-holder .mat-form-field-infix {
        border-top: 0 !important;
      }

      ::ng-deep .unspent-class .mat-form-field-wrapper{
        padding: 0 !important;
      }

      ::ng-deep .unspent-class .mat-form-field-infix{
        border: 0 !important;
      }
    `,
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
  actualSpent: number;
  unspentAmount: string;
  grantAmount: string;
  spentAmount: string;
  interestEarned: number;
  interestAmount: string;
  disbursedAmount: string;


  @ViewChild("createSectionModal") createSectionModal: ElementRef;
  @ViewChild("grantActualSpentFormatted") grantActualSpentFormatted: ElementRef;
  @ViewChild("spentAmt") spentAmt: ElementRef;
  @ViewChild("plannedProjectFundsModal") plannedProjectFundsModal: ElementRef;
  @ViewChild("receivedProjectFundsModal") receivedProjectFundsModal: ElementRef;
  @ViewChild("popupcontainer") popupcontainer: ElementRef;
  @ViewChild("grantInterestFormatted") grantInterestFormatted: ElementRef;
  @ViewChild("intAmount") intAmount: ElementRef;

  plannedModal: any;
  receivedModal: any;
  noSingleClosureDocAction: boolean = false;
  downloadAndDeleteClosureDocsAllowed: boolean = false;
  newField: any;


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
    private datePipe: DatePipe,
    private currencyService: CurrencyService,
    private disbursementDataService: DisbursementDataService,
    private dialog: MatDialog,
    private elem: ElementRef,
    private docManagementService: DocManagementService,
    private docPreviewService: DocpreviewService,

  ) {

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
      if (!this.currentClosure) {
        this.appComp.currentView = 'dashboard';
        this.router.navigate(['dashboard']);
      }
      let url = '/api/app/config/closure/' + this.currentClosure.id;

      this.http.get(url, httpOptions).subscribe((config: Configuration) => {
        this.closureWorkflowStatuses = config.closureWorkflowStatuses;
        this.appComp.closureWorkflowStatuses = config.closureWorkflowStatuses;
        this.tenantUsers = config.tenantUsers;
        this.appComp.tenantUsers = config.tenantUsers;
        this.appComp.closureTransitions = config.reportTransitions;
        this.interestEarned = this.currentClosure.interestEarned;
      });
    });

    this.getClosureReasons();

    this.setSpendSumamry();
    this.setGrantAmount();


    this.appComp.createNewClosureSection.subscribe((val) => {
      if (val) {
        $(".modal-backdrop").remove();

        this.addNewSection();
        this.appComp.createNewClosureSection.next(false);
      }
    });

    this.closureService.currentMessage.subscribe((closure) => {
      this.currentClosure = closure;
      this.actualSpent = this.currentClosure.actualSpent;
      this.myControl = new FormControl(this.currentClosure.reason);
      if (this.appComp.loggedInUser.organization.organizationType === 'GRANTEE') {
        this.myControl.disable();
      }
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

  

  editCoverNote() {
    
    if ( this.currentClosure.covernoteContent === undefined ) {
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
      "/covernote" ;

    this.http
      .post(url, this.currentClosure, httpOptions)
      .subscribe(
        (closure: GrantClosure) => {
        console.log(closure);
        this.closureService.changeMessage(closure, this.appComp.loggedInUser.id);

        this.appComp.closureSaved = false;
        this.appComp.autosaveDisplay =
          "Last saved @ " +
          this.datePipe.transform(new Date(), "hh:mm:ss a") +
          "     ";

        this.openCovernote();
      
      });
    } else {
      this.openCovernote();
    }
  }
  
  openCovernote(){
    const dgRef = this.dialog.open(ClosureCovernoteComponent, {
      data: {
        title: "Closure Cover Note",
        loggedInUser: this.appComp.loggedInUser,
        appComp: this.appComp,
        currentClosure: this.currentClosure,
      },
      panelClass: "closure-covernote-class",
    });
    dgRef.afterClosed().subscribe(result => {
      if (result.result) {
        console.log(result);
      }
    });
  }

  clearCovernote(){
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: "Clear Cover Note?", btnMain: "Clear Cover Note", btnSecondary: "Not Now" },
      panelClass: "center-class",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
      this.currentClosure.covernoteContent=null;
      this.currentClosure.covernoteAttributes=null;
      this.saveClosure();
    }

    });
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
      this.toastr.error("Section name cannot be left blank", "Warning");
      sectionName.focus();
      return;
    }
    let repeatName = false;
    for (let section of this.currentClosure.closureDetails.sections) {
      if (section.sectionName.replace(' ', '').toLowerCase() === sectionName.val().trim().replace(' ', '').toLowerCase()) {
        repeatName = true;
        break;
      }
    }
    if (repeatName) {
      this.toastr.error("Section name already exists, Please select a different name", "Warning");
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
      sectionName.val() +
      "/false";

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
      newReason.id = 0 - window.crypto.getRandomValues(new Uint32Array(10))[0];
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
  }

  getReceivedFunds(i) {
    const funds = document.getElementsByClassName('rf');
    return (funds && funds.length) > 0 ? funds[i].innerHTML : this.currencyService.getFormattedAmount(0);
  }

  setGrantAmount() {
    const _grantAmount = this.currentClosure.grant.amount ? this.currentClosure.grant.amount : 0;
    this.grantAmount = this.currencyService.getFormattedAmount(_grantAmount);
  }
  getPlannedFunds(i) {
    const funds = document.getElementsByClassName('pf');
    return (funds && funds.length) > 0 ? funds[i].innerHTML : '';
  }

  getPlannedDiff(i) {
    let p = 0;
    let r = 0;

    const pf = $('.pf');
    if (!pf || pf.length === 0) {
      return this.currencyService.getFormattedAmount(0);
    }
    const pieces1 = $(pf[i]).html().replace('₹ ', '').split(",")
    p = Number(pieces1.join(""));//.replaceAll(',', ''));

    const rf = $('.rf');
    if (!rf || rf.length === 0) {
      return this.currencyService.getFormattedAmount(p);
    }
    const pieces2 = $(rf[i]).html().replace('₹ ', '').split(",")
    r = Number(pieces2.join(""));//.replaceAll(',', ''));

    return this.currencyService.getFormattedAmount(p - r);
  }

  setSpendSumamry() {

    var disbursement: number = this.currentClosure.grant.approvedDisbursementsTotal ? this.currentClosure.grant.approvedDisbursementsTotal : 0;
    const spent = this.currentClosure.actualSpent ? this.currentClosure.actualSpent : 0;
    this.spentAmount = this.currencyService.getFormattedAmount(spent);

    var interest: number = this.currentClosure.interestEarned ? this.currentClosure.interestEarned : 0;
    this.interestAmount = this.currencyService.getFormattedAmount(interest);
    this.disbursedAmount = this.currencyService.getFormattedAmount(disbursement);
    this.unspentAmount = this.currencyService.getFormattedAmount(Number(disbursement) + Number(interest) - spent);
  }

  getActualRefundsForGrant() {
    let actualRfundsTotal = 0;
    if (this.currentClosure.grant.actualRefunds && this.currentClosure.grant.actualRefunds.length > 0) {
      for (let rf of this.currentClosure.grant.actualRefunds) {
        actualRfundsTotal += (rf.amount ? rf.amount : 0);
      }
    }
    return actualRfundsTotal;
  }


  showFormattedActualSpent(evt: any) {
    this.currentClosure.actualSpent = this.actualSpent;
    evt.currentTarget.style.visibility = "hidden";
    this.grantActualSpentFormatted.nativeElement.style.visibility = "visible";
  }

  showActualSpentInput(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    this.spentAmt.nativeElement.style.visibility = "visible";
  }

  showFormattedInterestEarned(evt: any) {
    this.currentClosure.interestEarned = this.interestEarned;
    evt.currentTarget.style.visibility = "hidden";
    this.grantInterestFormatted.nativeElement.style.visibility = "visible";
  }

  showInterestEarned(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    this.intAmount.nativeElement.style.visibility = "visible";
  }



  getFormattedActualSpent(amount: number): string {
    if (amount) {
      return this.currencyService.getFormattedAmount(amount);
    }
    return "<div class='amountPlaceholder'>Enter Spent Amount</div>";
  }

  getFormattedInterestEarned(amount: number): string {
    if (amount) {
      return this.currencyService.getFormattedAmount(amount);
    }
    return "<div class='amountPlaceholder'>Enter Interest Earned</div>";
  }

  captureRefund() {
    this.callCreateSectionAPI("Project Refund Details", true);
  }

  callCreateSectionAPI(nameOfSection, isRefund) {

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
      nameOfSection + "/" + isRefund;

    this.http
      .post<ClosureSectionInfo>(url, this.currentClosure, httpOptions)
      .subscribe(
        (info: ClosureSectionInfo) => {
          this.closureService.changeMessage(info.closure, this.appComp.loggedInUser.id);
          this.appComp.sectionAdded = true;
          this.sidebar.buildSectionsSideNav(null);
          this.appComp.sectionInModification = false;
          this.router.navigate([
            "grant-closure/section/" +
            this.getCleanText(
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
              "23 We encountered an error",
              config
            );
          }
        }
      );
  }

  getCleanText(section: Section): string {
    if (section.sectionName === "") {
      return String(section.id);
    }
    return section.sectionName.replace(/[^_0-9a-z]/gi, "");
  }

  getRefundAmount() {
    if (this.currentClosure.refundAmount) {
      return this.currencyService.getFormattedAmount(this.currentClosure.refundAmount);
    } else {
      return this.currencyService.getFormattedAmount(0);
    }
  }

  getRefundReceived() {
    if (this.currentClosure.grant.actualRefunds && this.currentClosure.grant.actualRefunds.length > 0) {
      let total = 0;
      for (let rf of this.currentClosure.grant.actualRefunds) {
        total += rf.amount ? rf.amount : 0;
      }
      return this.currencyService.getFormattedAmount(total);
    }
    return this.currencyService.getFormattedAmount(0);
  }

  getGrantDisbursementAttribute(): Attribute {
    for (let section of this.currentClosure.grant.grantDetails.sections) {
      if (section.attributes) {
        for (let attr of section.attributes) {
          if (attr.fieldType === "disbursement") {
            return attr;
          }
        }
      }
    }
    return null;
  }

  getFormattedCurrency(amount: string): string {
    if (
      amount === undefined ||
      amount === null ||
      amount === "null" ||
      amount === ""
    ) {
      amount = "0";
    }
    return this.currencyService.getFormattedAmount(Number(amount));
  }

  getTotals(idx: number, fieldTableValue: TableData[]): string {
    let total = 0;
    for (let row of fieldTableValue) {
      let i = 0;
      for (let col of row.columns) {
        if (i === idx) {
          total += Number(
            col.value !== undefined &&
              col.value !== null &&
              col.value !== "null"
              ? col.value
              : "0"
          );
        }
        i++;
      }
    }
    return this.currencyService.getFormattedAmount(total);
  }

  getFieldTypeDisplayValue(type: string): string {
    if (type === "multiline") {
      return "Descriptive";
    } else if (type === "kpi") {
      return "Measurement/KPI";
    } else if (type === "table") {
      return "Tablular";
    } else if (type === "document") {
      return "Document";
    } else if (type === "disbursement") {
      return "Disbursement";
    }
    return "";
  }

  showPlannedCommitmentDetails() {
    this.plannedModal = $(this.plannedProjectFundsModal.nativeElement).modal('show');
  }

  showReceivedFundsDetails() {

    this.receivedModal = $(this.receivedProjectFundsModal.nativeElement).modal('show');
  }

  hidePlannedCommitmentDetails() {
    $(this.plannedModal).modal('hide');
  }
  hideReceivedFundsDetails() {
    $(this.receivedModal).modal('hide');
  }

  initiateDisbursement() {
    this.disbursementDataService.startDisbursement(this.currentClosure.grant);
    this.router.navigate(['disbursements/in-progress'])
  }

  grantOwner() {
    const grantActiveStateUser: User = this.currentClosure.grant.workflowAssignments.filter(a => a.stateId === this.currentClosure.grant.grantStatus.id)[0].assignmentUser;

    if (grantActiveStateUser.id === this.appComp.loggedInUser.id) {
      return true;
    } else {
      return false;
    }
  }

  processSelectedClosureDocFiles(event) {
    let files = event.target.files;

    const endpoint =
      "/api/user/" +
      this.appComp.loggedInUser.id +
      "/closure/" +
      this.currentClosure.id +
      "/upload/docs";
    let formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      if (files.item(i).size === 0) {
        this.dialog.open(MessagingComponent, {
          data: 'Detected a file with no content. Unable to upload.',
          panelClass: "center-class"
        });
        event.target.value = "";
        break;
      }

      const ext = files.item(i).name.substr(files.item(i).name.lastIndexOf('.'));
      if (this.appComp.acceptedFileTypes.filter(d => d === ext).length === 0) {
        this.dialog.open(MessagingComponent, {
          data: 'Detected an unsupported file type. Supported file types are ' + this.appComp.acceptedFileTypes.toString() + '. Unable to upload.',
          panelClass: "center-class"
        });
        event.target.value = "";
        break;
      }
      formData.append("file", files.item(i));
      const fileExistsCheck = this._checkAttachmentExists(
        files.item(i).name.substring(0, files.item(i).name.lastIndexOf("."))
      );
      if (fileExistsCheck.status) {
        this.dialog.open(MessagingComponent, {
          data: "Document " +
            files.item(i).name +
            " is already attached under " +
            fileExistsCheck.message
          ,
          panelClass: 'center-class'
        });


        event.target.value = "";
        return;
      }
    }

    const httpOptions = {
      headers: new HttpHeaders({
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
      reportProgress: true,
    };

    this.http
      .post<any>(endpoint, formData, httpOptions)
      .subscribe((info: GrantClosure) => {
        this.closureService.changeMessage(info, this.appComp.loggedInUser.id);

      });
  }

  handleClosureDocSelection(attachmentId) {
    const docElems = this.elem.nativeElement.querySelectorAll(
      '[id^="closure_attachment_' + attachmentId + '"]'
    );
    if (docElems.length > 0) {
      let found = false;
      for (let docElem of docElems) {
        if (docElem.checked) {
          found = true;
        }
      }

      if (found) {
        this.noSingleClosureDocAction = true;
        this.downloadAndDeleteClosureDocsAllowed = true;
      } else {
        this.noSingleClosureDocAction = false;
        this.downloadAndDeleteClosureDocsAllowed = false;
      }
    }
  }

  downloadSelection(attribId) {
    const elems = this.elem.nativeElement.querySelectorAll(
      '[id^="attriute_' + attribId + '_attachment_"]'
    );
    const selectedAttachments = new AttachmentDownloadRequest();
    if (elems.length > 0) {
      selectedAttachments.attachmentIds = [];
      for (let singleElem of elems) {
        if (singleElem.checked) {
          selectedAttachments.attachmentIds.push(singleElem.id.split("_")[3]);
        }
      }
      this.docManagementService.callClosureDocDownload(selectedAttachments, this.appComp, this.currentClosure);
    }
  }

  downloadClosureDocsSelection(attachmentId) {
    const elems = this.elem.nativeElement.querySelectorAll(
      '[id^="closure_attachment_"]'
    );
    const selectedClosureDocsAttachments = new AttachmentDownloadRequest();
    if (elems.length > 0) {
      selectedClosureDocsAttachments.attachmentIds = [];
      for (let singleElem of elems) {
        if (singleElem.checked) {
          selectedClosureDocsAttachments.attachmentIds.push(singleElem.id.split("_")[2]);
        }
      }
      this.docManagementService.callClosureDocsDownload(selectedClosureDocsAttachments, this.appComp, this.currentClosure);
    }
  }

  deleteSelection(attribId) {

    const dReg = this.dialog.open(FieldDialogComponent, {
      data: { title: 'Are you sure you want to delete the selected document(s)?', btnMain: "Delete Document(s)", btnSecondary: "Not Now" },
      panelClass: 'center-class'
    });

    dReg.afterClosed().subscribe(result => {
      if (result) {
        const elems = this.elem.nativeElement.querySelectorAll(
          '[id^="attriute_' + attribId + '_attachment_"]'
        );
        const selectedAttachments = new AttachmentDownloadRequest();
        if (elems.length > 0) {
          selectedAttachments.attachmentIds = [];
          for (let singleElem of elems) {
            if (singleElem.checked) {
              selectedAttachments.attachmentIds.push(singleElem.id.split("_")[3]);
            }
          }
        }
        for (let item of selectedAttachments.attachmentIds) {
          this.deleteAttachment(attribId, item);
        }
      } else {
        dReg.close();
      }
    });
  }

  deleteClosureDocsSelection(attachmentId) {

    const dReg = this.dialog.open(FieldDialogComponent, {
      data: { title: 'Are you sure you want to delete the selected document(s)?', btnMain: "Delete Document(s)", btnSecondary: "Not Now" },
      panelClass: 'center-class'
    });

    dReg.afterClosed().subscribe(result => {
      if (result) {
        const elems = this.elem.nativeElement.querySelectorAll(
          '[id^="closure_attachment_"]'
        );
        const selectedClosureDocsAttachments = new AttachmentDownloadRequest();
        if (elems.length > 0) {
          selectedClosureDocsAttachments.attachmentIds = [];
          for (let singleElem of elems) {
            if (singleElem.checked) {
              selectedClosureDocsAttachments.attachmentIds.push(singleElem.id.split("_")[2]);
            }
          }
        }
        for (let item of selectedClosureDocsAttachments.attachmentIds) {
          this.deleteClosureDocsAttachment(item);
        }
      } else {
        dReg.close();
      }
    });
  }

  deleteAttachment(attributeId, attachmentId) {
    this.docManagementService.deleteClosureAttachment(attachmentId, this.appComp.loggedInUser.id, attributeId, this.currentClosure.id, this.currentClosure)
      .then((closure: GrantClosure) => {
        this.closureService.changeMessage(closure, this.appComp.loggedInUser.id);
        this.currentClosure = closure;
        for (let section of this.currentClosure.closureDetails.sections) {
          if (section && section.attributes) {
            for (let attr of section.attributes) {
              if (attributeId === attr.id) {
                if (attr.attachments && attr.attachments.length > 0) {
                  this.newField =
                    "attriute_" +
                    attributeId +
                    "_attachment_" +
                    attr.attachments[attr.attachments.length - 1].id;
                }
              }
            }
          }
        }
      });
  }

  deleteClosureDocsAttachment(attachmentId) {
    this.docManagementService.deleteClosureDocsAttachment(attachmentId, this.appComp.loggedInUser.id, this.currentClosure.id, this.currentClosure)
      .then((closure: GrantClosure) => {
        this.closureService.changeMessage(closure, this.appComp.loggedInUser.id);
        this.currentClosure = closure;

      });
  }

  _checkAttachmentExists(filename): any {
    for (let section of this.currentClosure.closureDetails.sections) {
      if (section && section.attributes) {
        for (let attr of section.attributes) {
          if (attr && attr.fieldType === "document") {
            if (attr.attachments && attr.attachments.length > 0) {
              for (let attach of attr.attachments) {
                if (attach.name === filename) {
                  return {
                    status: true,
                    message: section.sectionName + " | " + attr.fieldName,
                  };
                }
              }
            }
          }
        }
      }
    }
    return { status: false, message: "" };
  }

  previewDocument(_for, attach) {
    this.docPreviewService.previewDoc(_for, this.appComp.loggedInUser.id, this.currentClosure.id, attach.id).then((result: any) => {
      let docType = result.url.substring(result.url.lastIndexOf(".") + 1);

      this.dialog.open(DocpreviewComponent, {
        data: {
          url: result.url,
          type: docType,
          title: attach.name + "." + attach.type,
          userId: this.appComp.loggedInUser.id,
          tempFileName: result.url
        },
        panelClass: "wf-assignment-class"
      });
    });
  }

  downloadSingleClosureDoc(attachmentId: number) {
    const selectedAttachments = new AttachmentDownloadRequest();
    selectedAttachments.attachmentIds = [];
    selectedAttachments.attachmentIds.push(attachmentId);
    this.docManagementService.callClosureDocsDownload(selectedAttachments, this.appComp, this.currentClosure);
  }

  deleteSingleClosureDoc(attachmentId) {
    const dReg = this.dialog.open(FieldDialogComponent, {
      data: {
        title: "Are you sure you want to delete the selected document?",
        btnMain: "Delete Document",
        btnSecondary: "Not Now"
      },
      panelClass: "grant-template-class",
    });

    dReg.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteClosureDocsAttachment(attachmentId);
      }
    });
  }

  getPendingAmount() {
    let p = 0;
    let r = 0;
    if (this.currentClosure.refundAmount) {
      p = this.currentClosure.refundAmount;
    }

    if (this.currentClosure.grant.actualRefunds && this.currentClosure.grant.actualRefunds.length > 0) {
      let total = 0;
      for (let rf of this.currentClosure.grant.actualRefunds) {
        total += rf.amount ? rf.amount : 0;
      }
      r = total;
    }

    return this.currencyService.getFormattedAmount(p - r);

  }

  checkIfGrantHasRefundAmount() {
    const refundDetailsSection = this.currentClosure.closureDetails.sections.filter(a => a.sectionName === "Project Refund Details" && a.systemGenerated);
    return refundDetailsSection.length > 0;
  }
}
