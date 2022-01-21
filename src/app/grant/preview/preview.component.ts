import { ReturnsPopupComponent } from './../../returns-popup/returns-popup.component';
import { DomSanitizer } from '@angular/platform-browser';
import { DocpreviewService } from './../../docpreview.service';
import { DocpreviewComponent } from './../../docpreview/docpreview.component';
import { DocManagementService } from './../../doc-management.service';
import { TableData, AttachmentDownloadRequest } from 'app/model/dahsboard';
import { ClosureDataService } from './../../closure.data.service';
import { ClosureTemplateDialogComponent } from './../../components/closure-template-dialog/closure-template-dialog.component';
import { ClosureTemplate, GrantClosure } from './../../model/closures';
import { ListDialogComponent } from './../../components/list-dialog/list-dialog.component';
import { Disbursement } from 'app/model/disbursement';
import { GrantCompareComponent } from './../../grant-compare/grant-compare.component';
import { GrantApiService } from './../../grant-api.service';
import { WfvalidationService } from './../../wfvalidation.service';
import { WorkflowValidationService } from './../../workflow-validation-service';
import { OrgTag } from './../../model/dahsboard';
import { GrantTagsComponent } from './../../grant-tags/grant-tags.component';
import { AdminService } from './../../admin.service';
import { GranttypeSelectionDialogComponent } from 'app/components/granttype-selection-dialog/granttype-selection-dialog.component';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from "@angular/core";
import {
  Attribute,
  Grant,
  Section,
  Submission,
  TemplateLibrary,
  WorkflowStatus,
  WorkflowAssignmentModel,
  WorkflowAssignments,
  SectionInfo,
} from "../../model/dahsboard";
import { Report } from "../../model/report";
import { GrantDataService } from "../../grant.data.service";
import { SubmissionDataService } from "../../submission.data.service";
import { ActivatedRoute, Router, NavigationStart } from "@angular/router";
import { AppComponent } from "../../app.component";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { ToastrService, IndividualConfig } from "ngx-toastr";
import {
  MatBottomSheet,
  MatDatepickerInputEvent,
  MatDialog,
} from "@angular/material";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { Colors, Configuration } from "../../model/app-config";
import { User } from "../../model/user";
import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import { Subject } from "rxjs";
import { FieldDialogComponent } from "../../components/field-dialog/field-dialog.component";
import { InviteDialogComponent } from "../../components/invite-dialog/invite-dialog.component";
import { WfassignmentComponent } from "../../components/wfassignment/wfassignment.component";
import { GrantNotesComponent } from "../../components/grantNotes/grantNotes.component";
import { TemplateDialogComponent } from "../../components/template-dialog/template-dialog.component";
import {
  HumanizeDurationLanguage,
  HumanizeDuration,
} from "humanize-duration-ts";
import { PDFExportComponent } from "@progress/kendo-angular-pdf-export";
import { AdminLayoutComponent } from "../../layouts/admin-layout/admin-layout.component";
import { saveAs } from "file-saver";
import { GrantComponent } from "../grant.component";
import * as indianCurrencyInWords from "indian-currency-in-words";
import * as inf from "indian-number-format";
import { Subscription } from "rxjs/Subscription";
import { takeUntil } from "rxjs/operators";
import { GrantValidationService } from "app/grant-validation-service";
import { CurrencyService } from "app/currency-service";
import { ProjectDocumentsComponent } from "app/components/project-documents/project-documents.component";
import { ClosureSelectionComponent } from 'app/components/closure-selection/closure-selection.component';

@Component({
  selector: "app-preview",
  templateUrl: "./preview.component.html",
  styleUrls: ["./preview.component.scss"],
  providers: [
    SidebarComponent,
    PDFExportComponent,
    GrantComponent,
    TitleCasePipe,
  ],
  styles: [
    `
      ::ng-deep .cdk-global-overlay-wrapper {
        justify-content: center !important;
      }

      .k-pdf-export .bolded {
        border: 2px dashed #aaa;
        padding: 10px;
      }
    `,
  ],
})
export class PreviewComponent implements OnInit {
  hasKpisToSubmit: boolean;
  kpiSubmissionTitle: string;
  currentGrant: Grant;
  originalGrant: Grant;
  editMode = false;
  firstColumnInitialPosition: number;
  currentSubmission: Submission;
  canManage = false;
  attachmentsSideNavOpened = true;
  schedule = 3;
  currentKPIType = "Quantitative";
  currentKPIReportingType = "Activity";
  timer: any;
  grantToUpdate: Grant;
  erroredElement: ElementRef;
  erroredField: string;
  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService);
  action: string;
  logoUrl: string;
  tenantUsers: User[];
  docsUpdated = false;
  grantWorkflowStatuses: WorkflowStatus[];
  dialogSubscription: Subscription;
  private ngUnsubscribe = new Subject();
  approvedReports: Report[];
  hasApprovedReports: boolean;
  disbursements: Disbursement[];
  hasDisbursements: boolean;
  wfDisabled: boolean = false;
  subscribers: any = {};

  public pdfExport: PDFExportComponent;

  @ViewChild("editFieldModal") editFieldModal: ElementRef;
  @ViewChild("createFieldModal") createFieldModal: ElementRef;
  @ViewChild("createSectionModal") createSectionModal: ElementRef;
  @ViewChild("createKpiModal") createKpiModal: ElementRef;
  @ViewChild("addKpiButton") addKpiButton: ElementRef;
  @ViewChild("actionBlock") actionBlock: ElementRef;
  @ViewChild("saveGrantButton") saveGrantButton: ElementRef;
  @ViewChild("kpiTypeElem") kpiTypeElem: ElementRef;
  @ViewChild("kpiDescriptionElem") kpiDescriptionelem: ElementRef;
  @ViewChild("kpiBlock") kpiBlock: ElementRef;
  @ViewChild("sidenav") attachmentsSideNav: any;
  @ViewChild("selectScheduleModal") selectScheduleModal: ElementRef;
  @ViewChild("container") container: ElementRef;
  @ViewChild("grantSummary") grantSummary: ElementRef;
  @ViewChild("previewarea") previewArea: ElementRef;
  @ViewChild("pdf") pdf;
  @ViewChild("pdf2") pdf2;
  orgTags: OrgTag[] = [];
  currentClosure: GrantClosure;

  constructor(
    private grantData: GrantDataService,
    private closureData: ClosureDataService,
    private submissionData: SubmissionDataService,
    private route: ActivatedRoute,
    private router: Router,
    private submissionDataService: SubmissionDataService,
    public appComp: AppComponent,
    private adminComp: AdminLayoutComponent,
    private http: HttpClient,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private _bottomSheet: MatBottomSheet,
    private elem: ElementRef,
    private datepipe: DatePipe,
    public colors: Colors,
    private sidebar: SidebarComponent,
    public grantComponent: GrantComponent,
    private titlecasePipe: TitleCasePipe,
    private grantValidationService: GrantValidationService,
    private workflowValidationService: WorkflowValidationService,
    public currencyService: CurrencyService,
    private adminService: AdminService,
    private wfValidationService: WfvalidationService,
    private grantApiService: GrantApiService,
    private closureService: ClosureDataService,
    private docManagementService: DocManagementService,
    private docPreviewService: DocpreviewService,
    private sanitizer: DomSanitizer
  ) {
    this.colors = new Colors();

    this.grantData.currentMessage
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((grant) => (this.currentGrant = grant));
    if (!this.currentGrant) {
      this.router.navigate(["dashboard"]);
    }

    this.subscribers.name = this.router.events.subscribe((val) => {
      if (val instanceof NavigationStart && val.url === "/grant/preview") {
        this.appComp.action = "preview";
      } else if (
        val instanceof NavigationStart &&
        val.url !== "/grant/preview"
      ) {
        this.appComp.action = "";
      }

      if (
        val instanceof NavigationStart &&
        this.currentGrant &&
        !this.appComp.grantSaved
      ) {
        this.saveGrant();
        this.appComp.grantSaved = false;
      }
    });

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };
    let url = "/api/app/config/grant/" + this.currentGrant.id;

    this.http
      .get(url, httpOptions)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((config: Configuration) => {
        this.grantWorkflowStatuses = config.grantWorkflowStatuses;
        this.appComp.grantWorkflowStatuses = config.grantWorkflowStatuses;
        this.tenantUsers = config.tenantUsers;
        this.appComp.tenantUsers = config.tenantUsers;
      });

    this.getApprovedReports();
    this.getDisbursements();
  }

  ngOnInit() {
    this.appComp.sectionUpdated = false;

    this.appComp.createNewSection
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((val) => {
        if (val) {
          $(".modal-backdrop").remove();

          this.addNewSection();
          this.appComp.createNewSection.next(false);
        }
      });

    this.logoUrl =
      "/api/public/images/" +
      this.currentGrant.grantorOrganization.code +
      "/logo";

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
      this.currentGrant.duration = "Not set";
    }

    for (let section of this.currentGrant.grantDetails.sections) {
      if (section.attributes) {
        for (let attribute of section.attributes) {
          if (attribute.fieldType === "document") {
            let docs;
            try {
              docs = JSON.parse(attribute.fieldValue);
            } catch (e) {
              docs = [];
            }
            if (docs.length > 0) {
              attribute.docs = new Array<TemplateLibrary>();
              for (let d of docs) {
                attribute.docs.push(d);
              }
            }
          }
        }
      }
    }

    this.grantData.changeMessage(
      this.currentGrant,
      this.appComp.loggedInUser.id
    );
    console.log(this.currentGrant);

    this.originalGrant = JSON.parse(JSON.stringify(this.currentGrant));

    $("#editFieldModal").on("shown.bs.modal", function (event) {
      $("#editFieldInput").focus();
    });

    $("#createFieldModal").on("shown.bs.modal", function (event) {
      $("#fieldTitleInput").focus();
    });

    $("#createSectionModal").on("shown.bs.modal", function (event) {
      $("#sectionTitleInput").focus();
    });

    $("#createKpiModal").on("shown.bs.modal", function (event) {
      $("#kpiDescription").focus();
    });


    this.adminService.getOrgTags(this.appComp.loggedInUser).then((tags: OrgTag[]) => {
      this.orgTags = tags;
    });
  }

  getDocumentName(val: string): any[] {
    if (this.docsUpdated) {
      return;
    }
    this.docsUpdated = true;
    let obj;
    if (val !== "") {
      obj = JSON.parse(val);
    }
    return obj;
  }

  private checkGrantPermissions() {
    if (
      this.currentGrant.workflowAssignments.filter(
        (wf) =>
          wf.stateId === this.currentGrant.grantStatus.id &&
          wf.assignments === this.appComp.loggedInUser.id
      ).length > 0 &&
      this.appComp.loggedInUser.organization.organizationType !== "GRANTEE" &&
      this.currentGrant.grantStatus.internalStatus !== "ACTIVE" &&
      this.currentGrant.grantStatus.internalStatus !== "CLOSED"
    ) {
      this.canManage = true;
    } else {
      this.canManage = false;
    }
  }

  private checkCurrentSubmission() {
    for (const submission of this.currentGrant.submissions) {
      if (submission.flowAuthorities) {
        this.hasKpisToSubmit = true;
        this.kpiSubmissionTitle = submission.title;
        this.currentSubmission = submission;
        break;
      }
    }
  }

  rememberScrollPosition(event: Event) {
    console.log(event);
  }

  viewKpisToSubmit(submissionId: number) {
    for (const submission of this.currentGrant.submissions) {
      if (submission.id === submissionId) {
        this.submissionDataService.changeMessage(submission);
        break;
      }
    }
    this.router.navigate(["kpisubmission"]);
  }

  editFieldEntry(identifier: string) {
    console.log(this.currentGrant);
    this._setEditMode(true);
    const editFieldModal = this.editFieldModal.nativeElement;

    const modalTitle = $(editFieldModal).find("#editFieldLabel");
    const modalValue = $(editFieldModal).find("#editFieldInput");
    const modalIdHolder = $(editFieldModal).find("#editFieldIdHolder");
    $(modalTitle).html($("#attribute_name_id_" + identifier).html());
    $(modalValue).val($("#attribute_value_id_" + identifier).html());
    $(modalIdHolder).val(identifier);

    $(modalValue).focus();
    $(editFieldModal).modal("show");
  }

  confirm(
    sectionId: number,
    attributeId: number,
    kpiId: number,
    func: string,
    title: string,
    btnSecondary: string,
    btnMain: string
  ) {
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: title, btnMain: btnMain, btnSecondary: btnSecondary },
      panelClass: "center-class",
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((result) => {
        if (result) {
          switch (func) {
            case "field":
              this.deleteFieldEntry(sectionId, attributeId);
              break;
            case "section":
              this.deleteSection(Number(sectionId));
              break;
            case "wfassignment":
              this.showWorkflowAssigments(sectionId);
              break;
          }
        } else {
          dialogRef.close();
        }
      });
  }

  deleteFieldEntry(sectionId: number, attributeId: number) {
    for (const section of this.currentGrant.grantDetails.sections) {
      if (section.id === sectionId) {
        const index = section.attributes.findIndex(
          (attr) => attr.id === attributeId
        );
        section.attributes.splice(index, 1);
        this.checkGrant();
      }
    }
  }


  saveField() {
    const identifier = $("#editFieldIdHolder").val();
    const inputField = $("#editFieldInput");

    if (inputField.val().trim() === "") {
      this.toastr.warning("Field value cannot be left blank", "Warning");
      inputField.focus();
      return;
    }
    console.log(">>>>>> " + identifier);
    $("#attribute_value_id_" + identifier).html($("#editFieldInput").val());
    $("#attribute_value_id_" + identifier).addClass("bg-warning");
    const editFieldModal = this.editFieldModal.nativeElement;
    const sectionId = $("#attribute_value_id_" + identifier).attr(
      "data-section"
    );
    const attributeId = $("#attribute_value_id_" + identifier).attr(
      "data-attribute"
    );
    console.log(sectionId + "   " + attributeId);

    const grant = this.currentGrant;
    for (const section of grant.grantDetails.sections) {
      if (section.id === Number(sectionId)) {
        console.log(section);
        for (const attrib of section.attributes) {
          if (attrib.id === Number(attributeId)) {
            console.log(attrib);
            attrib.fieldValue = inputField.val();
            this.grantData.changeMessage(grant, this.appComp.loggedInUser.id);
          }
        }
      }
    }

    $(editFieldModal).modal("hide");
  }


  saveGrant() {
    if (!this.currentGrant.canManage) {
      return;
    }


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
      this.currentGrant.id;

    this.http
      .put(url, this.currentGrant, httpOptions)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (grant: Grant) => {
          this.originalGrant = JSON.parse(JSON.stringify(grant));
          if (
            this.currentGrant.workflowAssignments.filter(
              (wf) =>
                wf.stateId === this.currentGrant.grantStatus.id &&
                wf.assignments === this.appComp.loggedInUser.id
            ).length > 0 &&
            this.appComp.loggedInUser.organization.organizationType !==
            "GRANTEE" &&
            this.currentGrant.grantStatus.internalStatus !== "ACTIVE" &&
            this.currentGrant.grantStatus.internalStatus !== "CLOSED"
          ) {
            grant.canManage = true;
          } else {
            grant.canManage = false;
          }
          this.grantData.changeMessage(grant, this.appComp.loggedInUser.id);
          this.currentGrant = grant;
          this._setEditMode(false);
          this.currentSubmission = null;
          this.checkCurrentSubmission();
          this.appComp.autosave = false;
        },
        (error) => {
          const errorMsg = error as HttpErrorResponse;
          console.log(error);
          this.toastr.error(
            errorMsg.error.message,
            errorMsg.error.messageTitle,
            {
              enableHtml: true,
            }
          );
        }
      );
  }


  addNewFieldToSection(sectionId: string, sectionName: string) {
    for (const section of this.currentGrant.grantDetails.sections) {
      if (section.id === Number(sectionId)) {
        const newAttr = new Attribute();
        newAttr.fieldType = "string";
        newAttr.fieldName = "";
        newAttr.fieldValue = "";
        newAttr.deletable = true;
        newAttr.required = false;
        newAttr.id = 0 - Math.round(Math.random() * 1000000000);
        section.attributes.push(newAttr);
        break;
      }
    }
    this.checkGrant();
  }

  addField() {
    const fieldName = $("#fieldTitleInput");
    const fieldType = $("#fieldValueInput");
    if (fieldName.val().trim() === "") {
      this.toastr.warning("Field Name cannot be left blank", "Warning");
      fieldName.focus();
      return;
    }
    const createFieldModal = this.createFieldModal.nativeElement;
    const idHolderElem = $(createFieldModal).find("#sectionIdHolder");
    const grant = this.currentGrant;
    for (const section of grant.grantDetails.sections) {
      if (section.id === Number($(idHolderElem).val())) {
        console.log("found it");
        const attribute = new Attribute();
        attribute.fieldName = fieldName.val();
        attribute.fieldType = fieldType.val();
        attribute.fieldValue = "";
        attribute.id = 0 - Math.round(Math.random() * 10000000000);
        section.attributes.push(attribute);
        break;
      }
    }
    this.grantData.changeMessage(grant, this.appComp.loggedInUser.id);
    fieldName.val("");
    this._setEditMode(true);
    $(createFieldModal).modal("hide");
  }

  addNewSection() {
    this.appComp.sectionInModification = true;
    const createSectionModal = this.createSectionModal.nativeElement;
    const titleElem = $(createSectionModal).find("#createSectionLabel");
    $(titleElem).html("Add new section");
    $(createSectionModal).modal("show");
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
      "/grant/" +
      this.currentGrant.id +
      "/template/" +
      this.currentGrant.templateId +
      "/section/" +
      sectionName.val();

    this.http
      .post<SectionInfo>(url, this.currentGrant, httpOptions)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (info: SectionInfo) => {
          this.grantData.changeMessage(
            info.grant,
            this.appComp.loggedInUser.id
          );

          sectionName.val("");
          this._setEditMode(true);
          $(createSectionModal).modal("hide");
          this.appComp.sectionAdded = true;
          this.sidebar.buildSectionsSideNav(null);
          this.appComp.sectionInModification = false;
          this.appComp.selectedTemplate = info.grant.grantTemplate;

          this.router.navigate([
            "grant/section/" +
            this.getCleanText(
              info.grant.grantDetails.sections.filter(
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
              "6 We encountered an error",
              config
            );
          }
        }
      );
  }

  saveSectionAndAddNew() {
    const sectionName = $("#sectionTitleInput");
    if (sectionName.val().trim() === "") {
      this.toastr.warning("Section name cannot be left blank", "Warning");
      sectionName.focus();
      return;
    }

    const currentSections = this.currentGrant.grantDetails.sections;
    const newSection = new Section();
    newSection.attributes = [];
    newSection.id = 0 - Math.round(Math.random() * 10000000000);
    newSection.sectionName = sectionName.val();

    currentSections.push(newSection);

    this.grantData.changeMessage(
      this.currentGrant,
      this.appComp.loggedInUser.id
    );

    sectionName.val("");
    this.addNewSection();
    sectionName.focus();
  }

  toggleSection(event: Event, sectionId: string) {
    const trgt = $("#section_" + sectionId);
    const trgtIcon = $(event.target);
    trgt.toggle("slow");

    console.log(trgtIcon.hasClass("fa-chevron-down"));
    if (trgtIcon.hasClass("fa-chevron-down")) {
      trgtIcon.removeClass("fa-chevron-down").addClass("fa-chevron-right");
    } else if (trgtIcon.hasClass("fa-chevron-right")) {
      trgtIcon.removeClass("fa-chevron-right").addClass("fa-chevron-down");
    }
  }


  submitGrant(toStateId: number, transitionTitle: string) {

    if (this.currentGrant.grantStatus.internalStatus === 'ACTIVE') {
      const dialogRef = this.dialog.open(ClosureSelectionComponent, {
        data: {
          title: "Important!",
          content:
            '<p class="x_MsoNormal">You are about to close an active Grant. This action will create a new &lsquo;Grant closure request&rsquo; with a separate closure workflow.</p> <p class="x_MsoNormal">The &lsquo;Grant closure request&rsquo; will be placed in a "Draft" stage with you as the owner of this state.&nbsp; You will need to add appropriate assignments to progress the Grant closure through the current organizational workflow.&nbsp;</p> <p class="x_MsoNormal">All reports and disbursements that were in progress when the grant closure request was initiated will be available until the grant closure workflow is completed. On completion of the grant closure workflow, the Grant will be marked as "Closed" and while you and others in your organization can view it, it will be unavailable for future disbursements or project progress reports against it.</p>',
          grant: this.currentGrant,
          userId: this.appComp.loggedInUser.id
        },
        panelClass: "grant-notes-class",
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          const httpOptions = {
            headers: new HttpHeaders({
              'Content-Type': 'application/json',
              'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
              'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
          };

          const user = JSON.parse(localStorage.getItem('USER'));
          let url = '/api/user/' + user.id + '/closure/templates';
          this.http.get<ClosureTemplate[]>(url, httpOptions).subscribe((templates: ClosureTemplate[]) => {
            if (templates.length === 1) {
              this.createClosure(templates[0]);
            } else {
              let dialogRef2 = this.dialog.open(ClosureTemplateDialogComponent, {
                data: templates,
                panelClass: 'grant-template-class'
              });

              dialogRef2.afterClosed().subscribe(result1 => {
                if (result1.result) {
                  this.createClosure(result1.selectedTemplate);

                } else {
                  dialogRef.close();
                }
              });
            }

          });

        } else {
          dialogRef.close();
        }
      });
      return;
    }

    for (let assignment of this.currentGrant.workflowAssignments) {
      const status1 = this.appComp.grantWorkflowStatuses.filter(
        (status) => status.id === assignment.stateId
      );
      if (
        (assignment.assignments === null ||
          assignment.assignments === undefined ||
          (assignment.assignments === 0 && !status1[0].terminal) || assignment.assignmentUser.deleted)
      ) {
        this.confirm(
          toStateId,
          0,
          0,
          "wfassignment",
          "Would you like to assign users responsible for this workflow?",
          "Not Now",
          "Assign Users"
        );
        return;
      }
    }

    this.wfValidationService.validateGrantWorkflow(this.currentGrant.id, 'GRANT', this.appComp.loggedInUser.id, this.currentGrant.grantStatus.id, toStateId).then(result => {
      this.openBottomSheetForGrantNotes(toStateId, result, transitionTitle);
      this.wfDisabled = true;
    });
  }

  createClosure(template: any) {
    this.appComp.currentView = "grant-closure";

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
      this.currentGrant.id +
      "/" + template.id;

    this.http.get<GrantClosure>(url, httpOptions).subscribe((closure: GrantClosure) => {
      if (
        closure.workflowAssignment.filter(
          (wf) =>
            wf.stateId === closure.status.id &&
            wf.assignmentId === this.appComp.loggedInUser.id
        ).length > 0 &&
        this.appComp.loggedInUser.organization.organizationType !==
        "GRANTEE" &&
        closure.status.internalStatus !== "ACTIVE" &&
        closure.status.internalStatus !== "CLOSED"
      ) {
        closure.canManage = true;
      } else {
        closure.canManage = false;
      }

      this.appComp.originalClosure = JSON.parse(JSON.stringify(closure));
      this.currentClosure = closure;
      this.closureData.changeMessage(closure, this.appComp.loggedInUser.id);
      this.appComp.currentView = "grant-closure";
      this.appComp.subMenu = { name: "In-progress Closures", action: "dgc" };

      this.router.navigate(["grant-closure/header"]);
    });
  }

  submitAndSaveGrant(toStateId: number, message: String) {
    if (!this.currentGrant.canManage) {
      return;
    }
    this.wfDisabled = true;
    if (!message) {
      message = "";
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
      this.appComp.loggedInUser.id +
      "/grant/" +
      this.currentGrant.id +
      "/flow/" +
      this.currentGrant.grantStatus.id +
      "/" +
      toStateId;
    this.http
      .post(url, { grant: this.currentGrant, note: message }, httpOptions)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (grant: Grant) => {
          this.grantData.changeMessage(grant, this.appComp.loggedInUser.id);
          this.wfDisabled = false;
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

          if (grant.grantStatus.internalStatus === "ACTIVE") {
            this.appComp.subMenu = { name: "Active Grants", action: "ag" };
          } else if (grant.grantStatus.internalStatus === "CLOSED") {
            this.appComp.subMenu = { name: "Closed Grants", action: "cg" };
          }

          if (!grant.grantTemplate.published) {
            const dialogRef = this.dialog.open(TemplateDialogComponent, {
              data: this.currentGrant.grantTemplate.name,
              panelClass: "grant-notes-class",
            });

            dialogRef
              .afterClosed()
              .pipe(takeUntil(this.ngUnsubscribe))
              .subscribe((result) => {
                if (result.result) {
                  let url1 =
                    "/api/user/" +
                    this.appComp.loggedInUser.id +
                    "/grant/" +
                    this.currentGrant.id +
                    "/template/" +
                    this.currentGrant.templateId +
                    "/" +
                    result.name;
                  this.http
                    .put(
                      url1,
                      {
                        description: result.desc,
                        publish: true,
                        privateToGrant: false,
                      },
                      httpOptions
                    )
                    .pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((grant1: Grant) => {
                      this.grantData.changeMessage(
                        grant1,
                        this.appComp.loggedInUser.id
                      );
                      this.appComp.selectedTemplate = grant1.grantTemplate;
                      this.fetchCurrentGrant();
                    });
                } else {
                  let url1 =
                    "/api/user/" +
                    this.appComp.loggedInUser.id +
                    "/grant/" +
                    this.currentGrant.id +
                    "/template/" +
                    this.currentGrant.templateId +
                    "/" +
                    result.name;
                  this.http
                    .put(
                      url1,
                      {
                        description: result.desc,
                        publish: true,
                        privateToGrant: true,
                      },
                      httpOptions
                    )
                    .pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe((grant1: Grant) => {
                      this.grantData.changeMessage(
                        grant1,
                        this.appComp.loggedInUser.id
                      );
                      this.appComp.selectedTemplate = grant1.grantTemplate;
                      dialogRef.close();
                      this.fetchCurrentGrant();
                    });
                }
              });
          } else {
            this.fetchCurrentGrant();
          }
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
              "7 We encountered an error",
              config
            );
          }
        }
      );
  }

  fetchCurrentGrant() {
    this.appComp.currentView = "grants";
    this.router.navigate(["grants/draft"]);
  }

  private _setEditMode(state: boolean) {
    this.editMode = state;
  }

  updateSubmission(event: Event, kpiType: string, kpiDataId: number) {
    console.log(
      (<HTMLInputElement>event.target).value + "  " + kpiType + "  " + kpiDataId
    );
    switch (kpiType) {
      case "QUANTITATIVE":
        for (const kpiData of this.currentSubmission
          .quantitiaveKpisubmissions) {
          if (kpiData.id === kpiDataId) {
            kpiData.actuals = Number((<HTMLInputElement>event.target).value);
          }
        }
        break;
      case "QUALITATIVE":
        for (const kpiData of this.currentSubmission
          .qualitativeKpiSubmissions) {
          if (kpiData.id === kpiDataId) {
            kpiData.actuals = (<HTMLInputElement>event.target).value;
          }
        }
        break;
    }

    this.submissionData.changeMessage(this.currentSubmission);
    console.log(this.currentSubmission);
  }


  private _setFlowButtonColors() {
    const flowActionBtns = $('[name="flowActionBtn"]');
    for (let elem = 0; elem < flowActionBtns.length; elem++) {
      const color = this.colors.colorArray[elem];
      $(flowActionBtns[elem]).css("background-color", color);
    }
  }

  checkGrant() {
    if (
      JSON.stringify(this.currentGrant) === JSON.stringify(this.originalGrant)
    ) {
      this._setEditMode(false);
    } else {
      this._setEditMode(true);
    }
  }

  openBottomSheetForGrantNotes(toStateId: number, result, transitionTitle: string): void {
    const _bSheet = this.dialog.open(GrantNotesComponent, {
      hasBackdrop: true,
      data: {
        canManage: true,
        currentGrant: this.currentGrant,
        originalGrant: this.appComp.originalGrant,
        validationResult: result,
        tTitle: transitionTitle
      },
      panelClass: "grant-notes-class",
    });

    _bSheet
      .afterClosed()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((result1) => {
        if (result1.result) {
          this.submitAndSaveGrant(toStateId, result1.message);
        } else {
          this.wfDisabled = false;
        }
      });
  }


  deleteSection(secId: number) {
    const index = this.currentGrant.grantDetails.sections.findIndex(
      (section) => section.id === Number(secId)
    );
    this.currentGrant.grantDetails.sections.splice(index, 1);
    this.checkGrant();
  }

  handleSpacebar(ev: Event) {
    console.log(ev);
    ev.stopImmediatePropagation();
  }

  setSubmissionDate(sub: Submission, event: MatDatepickerInputEvent<any>) {
    sub.submitBy = event.value;
    sub.submitDateStr = this.datepipe.transform(event.value, "yyyy-MM-dd");
    this.checkGrant();
  }

  setKpiTypeSection(event) {
    this.currentKPIType = event.value;
    if (this.currentKPIReportingType != "Quantitative") {
      this.currentKPIReportingType = null;
    } else {
      this.currentKPIReportingType = "Activity";
    }
  }

  setKpiReportingTypeSection(event) {
    this.currentKPIReportingType = event.value;

    console.log(this.currentKPIType + " - " + this.currentKPIReportingType);
  }

  saveAs(filename) {
    this.pdf.saveAs(filename);
  }

  saveAsPrintable(filename) {
    this.pdf2.saveAs(filename);
  }

  getTabularData(elemId: number, data: TableData[]) {
    let html = '<table width="100%" border="1"><tr>';
    const tabData = data;
    html += "<td>&nbsp;</td>";
    for (let i of tabData[0].columns) {
      html +=
        '<td style="padding:5px;font-weight:600px;">' +
        i.name +
        "</td>";
    }
    html += "</tr>";
    for (let i of tabData) {
      html += '<tr><td style="padding:5px;">' + i.name + "</td>";
      for (let j of i.columns) {
        html +=
          '<td style="padding:5px;">' + j.value + "</td>";
      }
      html += "</tr>";
    }

    html += "</table>";
    return html;
  }

  showWorkflowAssigments(toStateId) {
    const wfModel = new WorkflowAssignmentModel();
    wfModel.users = this.appComp.tenantUsers;
    wfModel.workflowStatuses = this.appComp.grantWorkflowStatuses;
    wfModel.workflowAssignment = this.currentGrant.workflowAssignments;
    wfModel.type = this.appComp.currentView;
    wfModel.grant = this.currentGrant;
    wfModel.grantTypes = this.appComp.grantTypes;
    wfModel.grant.isInternal = this.appComp.grantTypes.filter(gt => this.currentGrant.grantTypeId)[0].internal;
    wfModel.canManage =
      this.appComp.loggedInUser.organization.organizationType === "GRANTEE"
        ? false
        : this.currentGrant.workflowAssignments.filter(
          (wf) =>
            wf.stateId === this.currentGrant.grantStatus.id &&
            wf.assignments === this.appComp.loggedInUser.id
        ).length > 0 &&
        this.appComp.loggedInUser.organization.organizationType !==
        "GRANTEE" &&
        this.currentGrant.grantStatus.internalStatus !== "ACTIVE" &&
        this.currentGrant.grantStatus.internalStatus !== "CLOSED";
    const dialogRef = this.dialog.open(WfassignmentComponent, {
      data: { model: wfModel, userId: this.appComp.loggedInUser.id, appComp: this.appComp, adminComp: this.adminComp },
      panelClass: "wf-assignment-class",
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((result) => {
        if (result.result) {
          const ass: WorkflowAssignments[] = [];
          for (let data of result.data) {
            const wa = new WorkflowAssignments();
            wa.id = data.id;
            wa.assignments = data.userId;
            wa.stateId = data.stateId;
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
            this.appComp.loggedInUser.id +
            "/grant/" +
            this.currentGrant.id +
            "/assignment";
          this.http
            .post(
              url,
              { grant: this.currentGrant, assignments: ass },
              httpOptions
            )
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
              (grant: Grant) => {
                this.grantData.changeMessage(
                  grant,
                  this.appComp.loggedInUser.id
                );
                this.currentGrant = grant;
                const toState = this.currentGrant.flowAuthorities.filter(a => a.toStateId === toStateId)[0].toName;
                const toStateOwner = this.currentGrant.workflowAssignments.filter(a => a.stateId === toStateId)[0].assignmentUser;

                this.submitGrant(toStateId, "Progessing for " + toState + "<span class='text-subheader'> [" + toStateOwner.firstName + " " + toStateOwner.lastName + "]</span>");
              },
              (error) => {
                const errorMsg = error as HttpErrorResponse;
                console.log(error);
                this.toastr.error(
                  errorMsg.error.message,
                  errorMsg.error.messageTitle,
                  {
                    enableHtml: true,
                  }
                );
                dialogRef.close(false);
              }
            );
        } else {
          dialogRef.close();
        }
      });
  }

  getCleanText(section: Section): string {
    if (section.sectionName === "") {
      return String(section.id);
    }
    return section.sectionName.replace(/[^_0-9a-z]/gi, "");
  }

  showHistory(type, obj) {
    this.adminComp.showHistory(type, obj);
  }

  showWFAssigments() {
    this.adminComp.showWorkflowAssigments();
  }

  inviteGrantee() {
    const dialogRef = this.dialog.open(InviteDialogComponent, {
      data: "hello",
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((result) => {
        if (result.result) {
          const httpOptions = {
            headers: new HttpHeaders({
              "Content-Type": "application/json",
              "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
              Authorization: localStorage.getItem("AUTH_TOKEN"),
            }),
          };

          let url =
            "/api/user/" +
            this.appComp.loggedInUser.id +
            "/grant/" +
            this.currentGrant.id +
            "/invite";
          this.http
            .post(
              url,
              { grant: this.currentGrant, invites: result.value },
              httpOptions
            )
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((grant: Grant) => {
              //do nothing
            });
        }
      });
  }

  downloadAttachment(
    grantId: number,
    fileId: number,
    docName: string,
    docType: string
  ) {
    const httpOptions = {
      responseType: "blob" as "json",
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    let url =
      "/api/user/" +
      this.appComp.loggedInUser.id +
      "/grant/" +
      grantId +
      "/file/" +
      fileId;

    this.http
      .get(url, httpOptions)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data) => {
        saveAs(data, docName + "." + docType);
      });
  }

  showActiveReports(grant: Grant) {
    this.grantComponent.showActiveReports(grant, this.approvedReports);
  }

  showDisbursements() {
    this.dialog.open(ListDialogComponent, {
      data: { _for: 'disbursement', disbursements: this.disbursements, appComp: this.appComp, title: 'Disbursements for', subtitle: (this.currentGrant.referenceNo ? '[' + this.currentGrant.referenceNo + ']' : '') + ' ' + this.currentGrant.name },
      panelClass: "addnl-report-class"
    });

  }

  getGrantAmountInWords(amount: number) {
    let amtInWords = "Not set";
    if (amount) {
      amtInWords = indianCurrencyInWords(amount)
        .replace("Rupees", "")
        .replace("Paisa", "");
      return "Rs. " + this.titlecasePipe.transform(amtInWords);
    }
    return amtInWords;
  }

  getFormattedCurrency(amount: number): string {
    return inf.format(!amount ? 0 : amount, 2);
  }

  copyGrant(grantId: number) {

    if (this.appComp.grantTypes.length > 1) {
      const dg = this.dialog.open(GranttypeSelectionDialogComponent, {
        data: this.appComp.grantTypes,
        panelClass: 'grant-template-class'
      });

      dg.afterClosed().subscribe(result => {
        if (result && result.result) {
          this.grantComponent.copyGrant(grantId, result.selectedGrantType.id);
        }
      });
    } else {
      this.grantComponent.copyGrant(grantId, this.appComp.grantTypes[0].id);
    }

  }

  getTotals(idx: number, fieldTableValue: TableData[]): string {
    let total = 0;
    for (let row of fieldTableValue) {
      let i = 0;
      for (let col of row.columns) {
        if (i === idx) {
          total += col.value ? Number(col.value) : 0;
        }
        i++;
      }
    }
    return "₹ " + String(inf.format(total, 2));
  }

  getGrantPlannedDisbursementTotals(): number {
    if (this.currentGrant.grantDetails.sections) {
      for (let sec of this.currentGrant.grantDetails.sections) {
        if (sec.attributes) {
          for (let attr of sec.attributes) {
            if (attr.fieldType === "disbursement") {
              let total = 0;
              for (let row of attr.fieldTableValue) {
                let i = 0;
                for (let col of row.columns) {
                  if (i === 1) {
                    total += !col.value ? 0 : Number(col.value);
                  }
                  i++;
                }
              }
              return total;
            }
          }
        }
      }
    }
    return 0;
  }

  trackChange(ev: Event) {
    console.log(ev);
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.subscribers.name.unsubscribe();
  }

  public getApprovedReports() {
    console.log(this);
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const user = JSON.parse(localStorage.getItem("USER"));
    const url =
      "/api/user/" + user.id + "/report/" + this.currentGrant.id + "/approved";
    this.http.get<Report[]>(url, httpOptions).subscribe((reports: Report[]) => {
      reports.sort((a, b) => (a.endDate > b.endDate ? 1 : -1));

      this.approvedReports = reports.filter(
        (a) => a.status.internalStatus == "CLOSED"
      );
      if (this.approvedReports && this.approvedReports.length > 0) {
        this.hasApprovedReports = true;
      }
    });
  }

  public getDisbursements() {
    console.log(this);
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const user = JSON.parse(localStorage.getItem("USER"));
    const url =
      "/api/user/" + user.id + "/disbursements/grant/" + this.currentGrant.id + "/approved";
    this.http.get<Disbursement[]>(url, httpOptions).subscribe((disbs: Disbursement[]) => {
      this.disbursements = disbs.filter(
        (a) => a.status.internalStatus == "CLOSED"
      );
      if (this.disbursements && this.disbursements.length > 0) {
        this.hasDisbursements = true;
      }
    });
  }

  showProjectDocuments() {
    this.dialog.open(ProjectDocumentsComponent, {
      data: {
        title: "Project Documents",
        loggedInUser: this.appComp.loggedInUser,
        currentGrant: this.currentGrant,
        acceptedFileTypes: this.appComp.acceptedFileTypes
      },
      panelClass: "project-document-class",
    });
  }

  amendGrant(grantId: number) {
    this.grantComponent.amendGrant(grantId);
  }

  manageGrant(grantId) {
    this.adminComp.manageGrant(null, grantId);
  }

  getCleanClosureNote() {
    if (this.appComp.loggedInUser.organization.organizationType !== 'GRANTEE') {
      return this.currentGrant.note.substr(this.currentGrant.note.lastIndexOf('</i>') + 4);
    } else {
      return 'This grant has been closed.'
    }
  }

  public getGrantTypeName(typeId): string {
    return this.appComp.grantTypes.filter(t => t.id === typeId)[0].name;
  }

  public getGrantTypeColor(typeId): any {
    return this.appComp.grantTypes.filter(t => t.id === typeId)[0].colorCode;
  }

  isExternalGrant(): boolean {
    if (this.appComp.loggedInUser.organization.organizationType === 'GRANTEE') {
      return true;
    }
    const grantType = this.appComp.grantTypes.filter(gt => gt.id === this.currentGrant.grantTypeId)[0];
    if (!grantType.internal) {
      return true;
    } else {
      return false;
    }
  }

  showGrantTags() {
    this.adminService.getOrgTags(this.appComp.loggedInUser).then((tags: OrgTag[]) => {

      this.dialog.open(GrantTagsComponent, {
        data: { orgTags: tags, grantTags: this.currentGrant.tags, grant: this.currentGrant, appComp: this.appComp, type: 'grant' },
        panelClass: "grant-template-class"
      });
    });

  }

  compareGrants(currentGrantId, origGrantId) {
    this.grantApiService.compareGrants(currentGrantId, origGrantId, this.appComp.loggedInUser.id).then((grantsToCompare: any) => {
      console.log(grantsToCompare);
      this.dialog.open(GrantCompareComponent, {
        data: { checkType: grantsToCompare.checkType, compareItems: grantsToCompare.grants },
        panelClass: "wf-assignment-class",
      });
    });
  }

  showClosure(closureId: number) {


    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    const user = JSON.parse(localStorage.getItem('USER'));
    let url = '/api/user/' + user.id + '/closure/' + closureId;
    this.http.get<GrantClosure>(url, httpOptions).subscribe((closure: GrantClosure) => {
      this.appComp.currentView = 'grant-closure';
      this.closureService.changeMessage(closure, this.appComp.loggedInUser.id);
      if (closure.canManage && closure.status.internalStatus != 'CLOSED') {
        this.appComp.action = 'grant-closure';
        this.router.navigate(['grant-closure/header']);
      } else {
        this.appComp.action = 'grant-closure';
        this.router.navigate(['grant-closure/preview']);
      }
    });
  }


  downloadSingleDoc(attachmentId: number) {
    const selectedAttachments = new AttachmentDownloadRequest();
    selectedAttachments.attachmentIds = [];
    selectedAttachments.attachmentIds.push(attachmentId);
    this.docManagementService.callGrantDocDownload(selectedAttachments, this.appComp, this.currentGrant);
  }

  previewDocument(_for, attach) {

    this.docPreviewService.previewDoc(_for, this.appComp.loggedInUser.id, this.currentGrant.id, attach.id).then((result: any) => {
      let docType = result.url.substring(result.url.lastIndexOf(".") + 1);
      let docUrl;
      if (docType === 'doc' || docType === 'docx' || docType === 'xls' || docType === 'xlsx' || docType === 'ppt' || docType === 'pptx') {
        docUrl = this.sanitizer.bypassSecurityTrustResourceUrl("https://view.officeapps.live.com/op/view.aspx?src=" + location.origin + "/api/public/doc/" + result.url);
      } else if (docType === 'pdf' || docType === 'txt') {
        docUrl = this.sanitizer.bypassSecurityTrustResourceUrl(location.origin + "/api/public/doc/" + result.url);
      }
      this.dialog.open(DocpreviewComponent, {
        data: {
          url: docUrl,
          type: docType,
          title: attach.name + "." + attach.type,
          userId: this.appComp.loggedInUser.id,
          tempFileName: result.url
        },
        panelClass: "wf-assignment-class"
      });
    });
  }

  getForwardFlow() {
    const forwardStates = this.currentGrant.flowAuthorities.filter(a => a.forwardDirection === true);
    return forwardStates;
  }

  getSingleBackwardFlow() {
    const backwardState = this.currentGrant.flowAuthorities.filter(a => a.forwardDirection === false)[0];
    return backwardState;
  }

  hasMultipleBackwardFlow() {
    const backwardFlows = this.currentGrant.flowAuthorities.filter(a => a.forwardDirection === false);
    return (backwardFlows && backwardFlows.length > 1);
  }

  hasSingleBackwardFlow() {
    const backwardFlows = this.currentGrant.flowAuthorities.filter(a => a.forwardDirection === false);
    return (backwardFlows && backwardFlows.length === 1);
  }

  returnGrant() {
    const dg = this.dialog.open(ReturnsPopupComponent, {
      data: { paths: this.currentGrant.flowAuthorities.filter(a => a.forwardDirection === false), workflows: this.currentGrant.workflowAssignments },
      panelClass: "center-class",
    });

    dg.afterClosed().subscribe(response => {
      if (response.toStateId !== 0) {
        const toState = this.currentGrant.flowAuthorities.filter(a => a.fromStateId === response.toStateId)[0].fromName;
        const toStateOwner = this.currentGrant.workflowAssignments.filter(a => a.stateId === response.toStateId)[0].assignmentUser;

        this.submitGrant(response.toStateId, "Returning to " + toState + "<span class='text-subheader'> [" + toStateOwner.firstName + " " + toStateOwner.lastName + "]</span>");
      }
    });
  }

  getStateNameAndOwner(toStateId, forward) {
    let toState;
    if (forward) {
      toState = this.currentGrant.flowAuthorities.filter(a => a.toStateId === toStateId)[0].toName;
    } else {
      toState = this.currentGrant.flowAuthorities.filter(a => a.fromStateId === toStateId)[0].fromName;

    }
    const toStateOwner = this.currentGrant.workflowAssignments.filter(a => a.stateId === toStateId)[0].assignmentUser;

    return toStateOwner ? (toState + "<span class='text-subheader'> [" + toStateOwner.firstName + " " + toStateOwner.lastName + "]</span>") : "";
  }
}
