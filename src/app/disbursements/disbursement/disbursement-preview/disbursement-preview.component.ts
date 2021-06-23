import { WfvalidationService } from './../../../wfvalidation.service';
import { AdminService } from './../../../admin.service';
import { GrantTagsComponent } from './../../../grant-tags/grant-tags.component';
import { Grant, OrgTag, ColumnData } from './../../../model/dahsboard';
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from "@angular/core";
import {
  Disbursement,
  DisbursementWorkflowAssignmentModel,
  DisbursementWorkflowAssignment,
  ActualDisbursement,
} from "app/model/disbursement";
import { DisbursementDataService } from "app/disbursement.data.service";
import { AppComponent } from "app/app.component";
import * as indianCurrencyInWords from "indian-currency-in-words";
import { TitleCasePipe, DatePipe } from "@angular/common";
import * as inf from "indian-number-format";
import { Attribute, TableData, CustomDateAdapter } from "app/model/dahsboard";
import { AdminLayoutComponent } from "app/layouts/admin-layout/admin-layout.component";
import { Router, NavigationStart } from "@angular/router";
import { WorkflowValidationService } from "app/workflow-validation-service";
import {
  MatDialog,
  MatDatepicker,
  MatDatepickerInputEvent,
  DateAdapter,
  MAT_DATE_FORMATS,
} from "@angular/material";
import { MessagingComponent } from "app/components/messaging/messaging.component";
import { FieldDialogComponent } from "app/components/field-dialog/field-dialog.component";
import { WfassignmentComponent } from "app/components/wfassignment/wfassignment.component";
import { WorkflowDataService } from "app/workflow.data.service";
import { DisbursementNotesComponent } from "app/components/disbursementNotes/disbursementNotes.component";
import { CurrencyService } from "app/currency-service";
import { AmountValidator } from "app/amount-validator";

export const APP_DATE_FORMATS = {
  parse: {
    dateInput: { month: "short", year: "numeric", day: "numeric" },
  },
  display: {
    dateInput: "input",
    monthYearLabel: { year: "numeric", month: "short" },
    dateA11yLabel: { year: "numeric", month: "long", day: "numeric" },
    monthYearA11yLabel: { year: "numeric", month: "long" },
  },
};

@Component({
  selector: "disbursement-preview-dashboard",
  templateUrl: "./disbursement-preview.component.html",
  styleUrls: ["./disbursement-preview.component.css"],
  providers: [
    TitleCasePipe,
    {
      provide: DateAdapter,
      useClass: CustomDateAdapter,
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: APP_DATE_FORMATS,
    },
  ],
  styles: [
    `
      ::ng-deep
        .disbursements-class
        .mat-form-field-appearance-legacy
        .mat-form-field-infix {
        padding: 0 !important;
      }
    `,
    `
      ::ng-deep
        .disbursements-class
        .mat-form-field-appearance-legacy
        .mat-form-field-wrapper {
        padding-bottom: 0 !important;
      }
    `,
    `
      ::ng-deep .disbursements-class .mat-form-field-infix {
        border-top: 0 !important;
      }
    `,
  ],
})
export class DisbursementPreviewComponent implements OnInit, OnDestroy {
  currentDisbursement: Disbursement;
  logoUrl: string;
  subscribers: any = {};
  wfDisabled: boolean = false;

  @ViewChild("pdf") pdf;
  @ViewChild("datePicker") datePicker: MatDatepicker<any>;
  @ViewChild("tablePlaceholder") tablePlaceholder: ElementRef;

  originalDisbursement: any;
  selectedDateField: any;
  selectedField: ActualDisbursement;
  disableRecordButton = false;

  constructor(
    public disbursementService: DisbursementDataService,
    public appComponent: AppComponent,
    private titlecasePipe: TitleCasePipe,
    private adminComp: AdminLayoutComponent,
    private router: Router,
    private workflowValidationService: WorkflowValidationService,
    private dialog: MatDialog,
    private workflowDataService: WorkflowDataService,
    private datepipe: DatePipe,
    public currencyService: CurrencyService,
    public amountValidator: AmountValidator,
    private adminService: AdminService,
    private wfValidationService: WfvalidationService
  ) {
    this.disbursementService.currentMessage.subscribe(
      (disbursement) => (this.currentDisbursement = disbursement)
    );

    this.subscribers = this.router.events.subscribe((val) => {
      if (val instanceof NavigationStart && this.currentDisbursement) {
        this.disbursementService
          .saveDisbursement(this.currentDisbursement)
          .then((d) => {
            this.disbursementService.changeMessage(d);
          });
      }
    });
  }

  ngOnInit() {
    this.originalDisbursement = JSON.parse(
      JSON.stringify(this.currentDisbursement)
    );
    this.appComponent.currentView = "disbursement";

    if (
      this.currentDisbursement === undefined ||
      this.currentDisbursement === null
    ) {
      this.appComponent.currentView = "dashboard";
      this.router.navigate(["dashboard"]);
    }
    this.logoUrl =
      "/api/public/images/" +
      this.currentDisbursement.grant.grantorOrganization.code +
      "/logo";

    console.log(this.currentDisbursement);
  }

  ngOnDestroy() {
    this.subscribers.unsubscribe();
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

  getGrantDisbursementAttribute(): Attribute {
    for (let section of this.currentDisbursement.grant.grantDetails.sections) {
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

  getTotals(): number {
    let total = 0;
    for (let ad of this.currentDisbursement.actualDisbursements) {
      total += ad.actualAmount === undefined ? 0 : Number(ad.actualAmount);
    }

    return total;
  }

  getApprovedActualTotals(): number {
    let total = 0;
    if (
      this.currentDisbursement.approvedActualsDibursements &&
      this.currentDisbursement.approvedActualsDibursements.length > 0
    ) {
      for (let ad of this.currentDisbursement.approvedActualsDibursements) {
        total += ad.actualAmount === undefined ? 0 : ad.actualAmount;
      }
    }
    return total;
  }

  getGrantTotals(idx: number, fieldTableValue: TableData[]): string {
    let total = 0;
    for (let row of fieldTableValue) {
      let i = 0;
      for (let col of row.columns) {
        if (i === idx) {
          total += Number(col.value === undefined ? 0 : col.value);
        }
        i++;
      }
    }
    return this.currencyService.getFormattedAmount(total);
  }

  getFormattedCurrency(amount: string): string {
    if (!amount || amount === "") {
      return inf.format(Number("0"), 2);
    }
    return inf.format(Number(amount), 2);
  }

  saveAs(filename) {
    this.pdf.saveAs(filename);
  }

  showHistory(type, obj) {
    this.adminComp.showHistory(type, obj);
  }

  showWorkflowAssigments() {
    this.adminComp.showWorkflowAssigments();
  }

  showWorkflowAssigmentAndSubmit(toState: number) {
    this.workflowDataService
      .getDisbursementWorkflowStatuses(this.currentDisbursement)
      .then((workflowStatuses) => {
        const wfModel = new DisbursementWorkflowAssignmentModel();
        wfModel.users = this.appComponent.tenantUsers;
        wfModel.workflowStatuses = workflowStatuses;
        wfModel.workflowAssignments = this.currentDisbursement.assignments;
        wfModel.type = this.appComponent.currentView;
        wfModel.disbursement = this.currentDisbursement;
        wfModel.disbursement.grant.isInternal = this.appComponent.grantTypes.filter(gt => this.currentDisbursement.grant.grantTypeId)[0].internal;
        wfModel.canManage = this.currentDisbursement.canManage;
        const dialogRef = this.dialog.open(WfassignmentComponent, {
          data: { model: wfModel, userId: this.appComponent.loggedInUser.id },
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
                this.submitDisbursement(toState);
              });
          } else {
            dialogRef.close();
          }
        });
      });
  }

  submitDisbursement(toState: number) {
    this.disableRecordButton = true;
    /* if (this.currentDisbursement.requestedAmount < this.getTotals()) {
      this.dialog.open(FieldDialogComponent, {
        data: {
          title:
            "The disbursed total cannot be greater than the approved amount of " +
            this.currencyService.getFormattedAmount(
              this.currentDisbursement.requestedAmount
            ),
          type: "simple",
        },
        panelClass: "center-class",
      });
      this.disableRecordButton = false;
      return;
    } */

    /* this.workflowDataService
      .getDisbursementWorkflowStatuses(this.currentDisbursement)
      .then((workflowStatuses) => {
        this.appComponent.disbursementWorkflowStatuses = workflowStatuses;
        if (
          (this.workflowValidationService.getStatusByStatusIdForDisbursement(
            toState,
            this.appComponent
          ).internalStatus === "ACTIVE" ||
            this.workflowValidationService.getStatusByStatusIdForDisbursement(
              toState,
              this.appComponent
            ).internalStatus === "CLOSED") &&
          this.disbursementService.checkIfHeaderHasMissingEntries(
            this.currentDisbursement
          )
        ) {
          const dialogRef = this.dialog.open(MessagingComponent, {
            data: "Approval Request has missing header information.",
            panelClass: "center-class",
          });
          this.disableRecordButton = false;
          return;
        } */

    this.workflowDataService
      .getDisbursementWorkflowStatuses(this.currentDisbursement)
      .then((workflowStatuses) => {
        this.appComponent.disbursementWorkflowStatuses = workflowStatuses;

        for (let assignment of this.currentDisbursement.assignments) {
          const status1 = this.appComponent.disbursementWorkflowStatuses.filter(
            (status) => status.id === assignment.stateId
          );
          if (
            (assignment.owner === null ||
              assignment.owner === undefined ||
              (assignment.owner === 0 && !status1[0].terminal) || (assignment.assignmentUser.deleted))
          ) {
            const dialogRef = this.dialog.open(FieldDialogComponent, {
              data: {
                title: "Would you like to assign users responsible for this workflow?",
                btnMain: "Assign Users",
                btnSecondary: "Not Now"
              },
              panelClass: "center-class",
            });
            dialogRef.afterClosed().subscribe((result) => {
              if (result) {
                this.showWorkflowAssigmentAndSubmit(toState);
              }
            });
            this.disableRecordButton = false;
            return;
          }
        }


        const params = new ColumnData();
        params.name = "amount_to_record";
        params.value = String(this.getTotals());

        const paramsList: ColumnData[] = [];
        paramsList.push(params);

        this.wfValidationService.validateGrantWorkflow(this.currentDisbursement.id, 'DISBURSEMENT', this.appComponent.loggedInUser.id, this.currentDisbursement.status.id, toState, paramsList).then(result => {
          this.openBottomSheetForReportNotes(toState, result);
          this.wfDisabled = true;
        });
      });



    /* for (let i = 0; i < this.appComponent.disbursementWorkflowStatuses.length; i++) {
      if (i < this.appComponent.disbursementWorkflowStatuses.length - 1) {
        const prev = this.currentDisbursement.assignments.filter(a => (a.stateId === this.appComponent.disbursementWorkflowStatuses[i].id))[0];
        const next = this.currentDisbursement.assignments.filter(a => (a.stateId === this.appComponent.disbursementWorkflowStatuses[i + 1].id))[0];
        if (prev && next && (prev.owner === next.owner)) {
          const dialogRef = this.dialog.open(MessagingComponent, {
            data: "Workflow Assignemnts do not look right. Please review and fix before proceeding.",
            panelClass: "center-class",
          });
          return;
        }
      }
    } */
  }

  openBottomSheetForReportNotes(toStateId: number, result): void {
    /* if(
      this.workflowValidationService.getStatusByStatusIdForDisbursement(
        toStateId,
        this.appComponent
      ).internalStatus === "ACTIVE" &&
        this.currentDisbursement.requestedAmount +
        this.getApprovedActualTotals() >
        this.currentDisbursement.grant.amount
      ) {
    const dialogRef = this.dialog.open(MessagingComponent, {
      data:
        "Total requested funds for grant cannot exceed " +
        this.currencyService.getFormattedAmount(
          this.currentDisbursement.grant.amount
        ),
      panelClass: "center-class",
    });
    this.disableRecordButton = false;
    return;
  } */

    const _bSheet = this.dialog.open(DisbursementNotesComponent, {
      hasBackdrop: true,
      data: {
        canManage: true,
        currentDisbursement: this.currentDisbursement,
        originalDisbursement: this.originalDisbursement,
        validationResult: result
      },
      panelClass: "grant-notes-class",
    });

    _bSheet.afterClosed().subscribe((result) => {
      if (result.result) {
        this.submitAndSaveDisbursement(toStateId, result.message);
      } else {
        this.wfDisabled = false;
      }
      this.disableRecordButton = false;
    });
  }

  submitAndSaveDisbursement(toStateId: number, message: string) {
    this.disbursementService
      .submitDisbursement(
        this.currentDisbursement,
        message,
        this.currentDisbursement.status.id,
        toStateId
      )
      .then((d) => {
        this.disbursementService.changeMessage(d);
        this.wfDisabled = false;
        if (
          d.status.internalStatus === "DRAFT" ||
          d.status.internalStatus === "REVIEW"
        ) {
          this.appComponent.subMenu = {
            name: "Approvals In-progress",
            action: "di",
          };
        } else if (d.status.internalStatus === "ACTIVE") {
          this.appComponent.subMenu = {
            name: "Approvals Active",
            action: "ad",
          };
        } else if (d.status.internalStatus === "CLOSED") {
          this.appComponent.subMenu = {
            name: "Approvals Closed",
            action: "cd",
          };
        }
      });
  }

  manageGrant() {
    this.adminComp.manageGrant(null, this.currentDisbursement.grant.id);
  }

  openDate(actual: ActualDisbursement, ev: MouseEvent) {
    if (this.currentDisbursement.disabledByAmendment) {
      return;
    }
    const stDateElem = this.datePicker;
    this.selectedDateField = ev;
    this.selectedField = actual;
    if (!stDateElem.opened) {
      stDateElem.open();
    } else {
      stDateElem.close();
    }
  }

  setDate(ev: MatDatepickerInputEvent<any>) {
    const trgt = ev.target;
    this.selectedDateField.target.value = this.datepipe.transform(
      trgt.value,
      "dd-MMM-yyyy"
    );
    this.selectedField.disbursementDate = this.selectedDateField.target.value;
    this.disbursementService.saveDisbursement(this.currentDisbursement);

  }

  clearDate(actual: ActualDisbursement) {
    actual.disbursementDate = null;
  }

  showAmountInput(evt: any) {
    if (this.currentDisbursement.disabledByAmendment) {
      return;
    }
    evt.currentTarget.style.visibility = "hidden";
    const id = evt.target.attributes.id.value.replace("label_", "");
    const inputElem = this.tablePlaceholder.nativeElement.querySelectorAll(
      "#date_" + id
    );
    inputElem[0].style.visibility = "visible";
  }

  showFormattedAmount(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    const id = evt.target.attributes.id.value.replace("date_", "");
    const inputElem = this.tablePlaceholder.nativeElement.querySelectorAll(
      "#label_" + id
    );
    inputElem[0].style.visibility = "visible";
  }

  addDisbursementRow() {
    this.disbursementService
      .addNewDisbursementRow(this.currentDisbursement)
      .then((ad: ActualDisbursement) => {
        this.currentDisbursement.actualDisbursements.push(ad);
      });
  }

  deleteDisbursementRow(actual: ActualDisbursement, index: number) {
    this.disbursementService
      .deleteDisbursementRow(this.currentDisbursement, actual)
      .then(() => {
        this.currentDisbursement.actualDisbursements.splice(index, 1);
      });
  }

  dateFilter = (d: Date | null): boolean => {
    const today = new Date();
    const day = d || today;
    return (
      day <= today && day >= new Date(this.currentDisbursement.grant.startDate)
    );
  };

  public getGrantTypeName(typeId): string {
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

  showGrantTags() {
    this.adminService.getOrgTags(this.appComponent.loggedInUser).then((tags: OrgTag[]) => {

      const dg = this.dialog.open(GrantTagsComponent, {
        data: { orgTags: tags, grantTags: this.currentDisbursement.grant.tags, grant: this.currentDisbursement.grant, appComp: this.appComponent, type: 'disbursement' },
        panelClass: "grant-template-class"
      });

    });

  }
}
