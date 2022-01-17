import { GrantCompareComponent } from './../../grant-compare/grant-compare.component';
import { GrantApiService } from './../../grant-api.service';
import { GrantTag, OrgTag } from './../../model/dahsboard';
import { AdminService } from './../../admin.service';
import { GrantTagsComponent } from './../../grant-tags/grant-tags.component';
import { MessagingComponent } from "./../../components/messaging/messaging.component";
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  Input,
  HostListener,
} from "@angular/core";
import {
  ActionAuthorities,
  AttachmentTemplates,
  Attribute,
  Doc,
  DocumentKpiSubmission,
  FileTemplates,
  Grant,
  GrantDetails,
  GrantKpi,
  Kpi,
  Note,
  NoteTemplates,
  QualitativeKpiSubmission,
  QuantitiaveKpisubmission,
  Section,
  Submission,
  SubmissionStatus,
  Template,
  CustomDateAdapter,
  Organization,
  SectionInfo,
  WorkflowStatus,
} from "../../model/dahsboard";
import { GrantDataService } from "../../grant.data.service";
import { SubmissionDataService } from "../../submission.data.service";
import {
  ActivatedRoute,
  Router,
  NavigationStart,
  NavigationEnd,
  ActivationEnd,
  RouterEvent,
} from "@angular/router";
import { AppComponent } from "../../app.component";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { ToastrService, IndividualConfig } from "ngx-toastr";
import {
  MatBottomSheet,
  MatDatepicker,
  MatDatepickerInputEvent,
  MatDialog,
  MAT_DATE_FORMATS,
  DateAdapter,
} from "@angular/material";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { Colors, Configuration } from "../../model/app-config";
import { interval, Observable, Subject } from "rxjs";
import { FieldDialogComponent } from "../../components/field-dialog/field-dialog.component";
import { BottomsheetComponent } from "../../components/bottomsheet/bottomsheet.component";
import { BottomsheetAttachmentsComponent } from "../../components/bottomsheetAttachments/bottomsheetAttachments.component";
import { BottomsheetNotesComponent } from "../../components/bottomsheetNotes/bottomsheetNotes.component";
import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import {
  HumanizeDurationLanguage,
  HumanizeDuration,
} from "humanize-duration-ts";
import { FormControl } from "@angular/forms";
import { SectionsComponent } from "../sections/sections.component";
import { map, startWith } from "rxjs/operators";
import { AdminLayoutComponent } from "../../layouts/admin-layout/admin-layout.component";
import { User } from "../../model/user";
import * as indianCurrencyInWords from "indian-currency-in-words";
import * as inf from "indian-number-format";
import { AmountValidator } from "../../amount-validator";
import { ProjectDocumentsComponent } from "app/components/project-documents/project-documents.component";

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
  selector: "app-basic",
  templateUrl: "./basic.component.html",
  styleUrls: ["./basic.component.scss"],
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
    SectionsComponent,
    TitleCasePipe,
  ],
  styles: [
    `
      ::ng-deep .amountPlaceholder {
        color: #9c9c9c !important;
        font-stretch: 100%;
        -webkit-font-smoothing: antialiased !important;
        font-weight: 400 !important;
        font-family: Lato !important;
        line-height: 23.1px !important;
      }
    `,
  ],
})
export class BasicComponent implements OnInit {
  hasKpisToSubmit: boolean;
  kpiSubmissionTitle: string;
  @Input() currentGrant: Grant;
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
  action: string;
  grantToUpdate: Grant;
  erroredElement: ElementRef;
  erroredField: string;
  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService);
  subscribers: any = {};
  myControl: FormControl;
  options: Organization[];
  filteredOptions: Observable<Organization[]>;
  grantWorkflowStatuses: WorkflowStatus[];
  tenantUsers: User[];
  grantAmountFormattedValue: string;
  orgTags: OrgTag[] = [];

  userActivity;
  userInactive: Subject<any> = new Subject();

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
  @ViewChild("pickerStart") pickerStart: MatDatepicker<Date>;
  @ViewChild("pickerEnd") pickerEnd: MatDatepicker<Date>;
  @ViewChild("grantAmount") grantAmount: ElementRef;
  @ViewChild("grantAmountFormatted") grantAmountFormatted: ElementRef;

  constructor(
    private grantData: GrantDataService,
    private submissionData: SubmissionDataService,
    private route: ActivatedRoute,
    private router: Router,
    private adminComp: AdminLayoutComponent,
    private submissionDataService: SubmissionDataService,
    public appComp: AppComponent,
    private http: HttpClient,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private _bottomSheet: MatBottomSheet,
    private elem: ElementRef,
    private datepipe: DatePipe,
    public colors: Colors,
    public sidebar: SidebarComponent,
    private sectionsRef: SectionsComponent,
    private titlecasePipe: TitleCasePipe,
    public amountValidator: AmountValidator,
    private adminService: AdminService,
    private grantApiService: GrantApiService,

  ) {
    this.colors = new Colors();
    this.route.params.subscribe((p) => {
      this.action = p["action"];
      this.appComp.action = this.action;
    });

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
        this.saveGrant(false);
        this.appComp.grantSaved = false;
      }
    });

    this.grantData.currentMessage.subscribe(
      (grant) => {
        this.currentGrant = grant;
      }
    );

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };
    let url = "/api/app/config/grant/" + this.currentGrant.id;

    this.http.get(url, httpOptions).subscribe((config: Configuration) => {
      this.grantWorkflowStatuses = config.grantWorkflowStatuses;
      this.appComp.grantWorkflowStatuses = config.grantWorkflowStatuses;
      this.tenantUsers = config.tenantUsers;
      this.appComp.tenantUsers = config.tenantUsers;
    });
  }

  ngOnDestroy() {
    this.subscribers.name.unsubscribe();
  }

  ngOnInit() {
    this.appComp.createNewSection.subscribe((val) => {
      if (val) {
        $(".modal-backdrop").remove();

        this.addNewSection();
        this.appComp.createNewSection.next(false);
      }
    });
    this.appComp.sectionUpdated = false;
    this.userInactive.subscribe(() =>
      console.log("user has been inactive for 3s")
    );

    this.myControl = new FormControl(this.currentGrant.organization);
    if (this.currentGrant.origGrantId) {
      this.myControl.disable();
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
      "/grant/granteeOrgs";

    this.http.get(url, httpOptions).subscribe((granteeOrgs: Organization[]) => {
      this.options = granteeOrgs;
      const orgs = this.options ? this.options.slice() : [];
      this.filteredOptions = this.myControl.valueChanges.pipe(
        startWith(""),
        map((value) => (typeof value === "string" ? value : value.name)),
        map((name) => (name ? this._filter(name) : orgs))
      );
    });




    this.setDateDuration();

    this.originalGrant = JSON.parse(JSON.stringify(this.currentGrant));
    this.submissionData.currentMessage.subscribe(
      (submission) => (this.currentSubmission = submission)
    );

    this.checkGrantPermissions();
    //this.checkCurrentSubmission();

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

  private checkGrantPermissions() {
    this.canManage = this.currentGrant.canManage;
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

  ngAfterViewInit(): void {
    const firstCol = $(".first-column");
    if (firstCol.length) {
      this.firstColumnInitialPosition = firstCol.position().left;
    }
  }

  ngAfterContentChecked(): void {
    this._adjustHeights();
    this._setFlowButtonColors();
  }

  rememberScrollPosition(event: Event) {
    //console.log(event);
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
    //console.log(this.currentGrant);
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
    submissios: Submission[],
    kpiId: number,
    func: string,
    title: string
  ) {
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: title },
      panelClass: 'center-class'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        switch (func) {
          case "field":
            this.deleteFieldEntry(sectionId, attributeId);
            break;
          case "section":
            this.deleteSection(Number(sectionId));
            break;
          case "clearSubmissions":
            this.clearSubmissions();
            break;

          case "kpi":
            this.deleteKpi(kpiId);
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

  deleteKpi(kpiId: number) {
    for (const kpi of this.currentGrant.kpis) {
      if (kpi.id === kpiId) {
        const index = this.currentGrant.kpis.findIndex((k) => k.id === kpiId);
        this.currentGrant.kpis.splice(index, 1);
      }
    }

    for (const sub of this.currentGrant.submissions) {
      for (const kpiData of sub.quantitiaveKpisubmissions) {
        if (kpiData.grantKpi.id === kpiId) {
          const index = sub.quantitiaveKpisubmissions.findIndex(
            (k) => k.grantKpi.id === kpiId
          );
          sub.quantitiaveKpisubmissions.splice(index, 1);
        }
      }
      for (const kpiData of sub.qualitativeKpiSubmissions) {
        if (kpiData.grantKpi.id === kpiId) {
          const index = sub.qualitativeKpiSubmissions.findIndex(
            (k) => k.grantKpi.id === kpiId
          );
          sub.qualitativeKpiSubmissions.splice(index, 1);
        }
      }
      for (const kpiData of sub.documentKpiSubmissions) {
        if (kpiData.grantKpi.id === kpiId) {
          const index = sub.documentKpiSubmissions.findIndex(
            (k) => k.grantKpi.id === kpiId
          );
          sub.qualitativeKpiSubmissions.splice(index, 1);
        }
      }
    }

    this.checkGrant();
  }

  saveField() {
    const identifier = $("#editFieldIdHolder").val();
    const inputField = $("#editFieldInput");

    if (inputField.val().trim() === "") {
      this.toastr.warning("Field value cannot be left blank", "Warning");
      inputField.focus();
      return;
    }
    //console.log('>>>>>> ' + identifier);
    $("#attribute_value_id_" + identifier).html($("#editFieldInput").val());
    $("#attribute_value_id_" + identifier).addClass("bg-warning");
    const editFieldModal = this.editFieldModal.nativeElement;
    const sectionId = $("#attribute_value_id_" + identifier).attr(
      "data-section"
    );
    const attributeId = $("#attribute_value_id_" + identifier).attr(
      "data-attribute"
    );
    //console.log(sectionId + '   ' + attributeId);

    const grant = this.currentGrant;
    for (const section of grant.grantDetails.sections) {
      if (section.id === Number(sectionId)) {
        //console.log(section);
        for (const attrib of section.attributes) {
          if (attrib.id === Number(attributeId)) {
            //console.log(attrib);
            attrib.fieldValue = inputField.val();
            this.grantData.changeMessage(grant, this.appComp.loggedInUser.id);
            this.setDateDuration();
          }
        }
      }
    }

    $(editFieldModal).modal("hide");
  }

  updateGrant(event: any) {
    /*console.log(this.currentGrant);
    const fieldElem = event.targetElement;
    const fielId = fieldElem.id;
    const fieldVal = fieldElem.value;
    switch (fielId) {
      case 'grantName':
        this.currentGrant.name = fieldVal;
        break;
      case 'grantDesc':
        this.currentGrant.description = fieldVal;
        break;
      case 'grantStart':
        this.currentGrant.startDate = new Date(fieldVal);
        break;
      case 'grantEnd':
        this.currentGrant.endDate = new Date(fieldVal);
        break;
    }
    this._setEditMode(true);
    this.grantData.changeMessage(this.currentGrant);
    console.log(this.currentGrant);*/
  }

  saveGrant(compare: boolean) {
    if (!this.canManage) {
      return;
    }

    this.appComp.autosaveDisplay = "";
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
      "/api/user/" +
      this.appComp.loggedInUser.id +
      "/grant/" +
      this.currentGrant.id;
    this.appComp.showSaving = true;
    this.http
      .put(url, this.currentGrant, httpOptions)
      .toPromise()
      .then(
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
            this.currentGrant.canManage = true;
          } else {
            this.currentGrant.canManage = false;
          }
          this.grantData.changeMessage(grant, this.appComp.loggedInUser.id);
          this.setDateDuration();
          //this.dataService.changeMessage(grant.id);
          //this.currentGrant = grant;
          this._setEditMode(false);
          this.currentSubmission = null;
          //this.checkGrantPermissions();
          if (grant.submissions && grant.submissions.length > 0) {
            this.checkCurrentSubmission();
          }
          this.appComp.autosave = false;
          this.appComp.autosaveDisplay =
            "Last saved @ " +
            this.datepipe.transform(new Date(), "hh:mm:ss a") +
            "     ";

          if (compare) {
            this.compareGrants(this.currentGrant.id, this.currentGrant.origGrantId);
          }
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
              this.appComp.logout();
            }, 4000);
          } else {
            this.toastr.error(
              errorMsg.error.message,
              "2 We encountered an error",
              config
            );
          }
        }
      );
    // }
  }

  private validateFields() {
    const containerFormLements = this.container.nativeElement.querySelectorAll(
      "input[required]:not(:disabled):not([readonly]):not([type=hidden])" +
      ",select[required]:not(:disabled):not([readonly])" +
      ",textarea[required]:not(:disabled):not([readonly])"
    );
    for (const elem of containerFormLements) {
      if (elem.value.trim() === "") {
        this.erroredElement = elem;
        /*switch ($(this.erroredElement).attr('placeholder')) {
          case 'Field Value':

        }*/
        return true;
      }
    }
    return false;
  }

  /*saveSubmissionAndMove(toStateId: number) {

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    for (const sub of this.currentGrant.submissions) {
      if (sub.id === this.currentSubmission.id) {
        const subStatus = new SubmissionStatus();
        subStatus.id = toStateId;
        sub.submissionStatus = subStatus;
      }
    }

    this.saveGrant();

    let url = '/api/user/' + this.appComp.loggedInUser.id + '/grant/'
        + this.currentGrant.id + '/submission/flow/'
        + this.currentSubmission.submissionStatus.id + '/' + toStateId;

    this.http.put(url, this.currentSubmission, httpOptions).subscribe((submission: Submission) => {
          this.submissionData.changeMessage(submission);

          url = '/api/user/' + this.appComp.loggedInUser.id + '/grant/' + this.currentGrant.id;
          this.http.get(url, httpOptions).subscribe((updatedGrant: Grant) => {
            this.grantData.changeMessage(updatedGrant);
            this.editMode = false;
            this.toastr.info('Submission saved with status <b>'
                + this.currentSubmission.submissionStatus.displayName
                + '</b>', 'Submission Saved')
          });
        },
        error => {
          const errorMsg = error as HttpErrorResponse;
          console.log(error);
          this.toastr.error(errorMsg.error.message, errorMsg.error.messageTitle, {
            enableHtml: true
          });
        });
  }*/

  addNewFieldToSection(sectionId: string, sectionName: string) {
    /*const createFieldModal = this.createFieldModal.nativeElement;
    const titleElem = $(createFieldModal).find('#createFieldLabel');
    const idHolderElem = $(createFieldModal).find('#sectionIdHolder');
    $(titleElem).html(sectionName + ' - Create new field');
    $(idHolderElem).val(sectionId);
    $(createFieldModal).modal('show');*/
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
        //console.log('found it');
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
    this.setDateDuration();
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

    this.http.post<SectionInfo>(url, this.currentGrant, httpOptions).subscribe(
      (info: SectionInfo) => {
        this.grantData.changeMessage(info.grant, this.appComp.loggedInUser.id);

        sectionName.val("");
        //$('#section_' + newSection.id).css('display', 'block');
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
            "3 We encountered an error",
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

    const createSectionModal = this.createSectionModal.nativeElement;
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
    this.setDateDuration();

    sectionName.val("");
    this.addNewSection();
    sectionName.focus();
  }

  toggleSection(event: Event, sectionId: string) {
    const trgt = $("#section_" + sectionId);
    const trgtIcon = $(event.target);
    trgt.toggle("slow");

    //console.log(trgtIcon.hasClass('fa-chevron-down'));
    if (trgtIcon.hasClass("fa-chevron-down")) {
      trgtIcon.removeClass("fa-chevron-down").addClass("fa-chevron-right");
    } else if (trgtIcon.hasClass("fa-chevron-right")) {
      trgtIcon.removeClass("fa-chevron-right").addClass("fa-chevron-down");
    }
  }

  addNewKpi() {
    const kpiModal = this.createKpiModal.nativeElement;
    $(kpiModal).modal("show");
  }

  saveKpi() {
    const kpiModal = this.createKpiModal.nativeElement;
    const kpiDesc = $(this.kpiDescriptionelem.nativeElement);
    const id = 0 - Math.round(Math.random() * 10000000000);

    const kpi = new Kpi();
    kpi.id = id;
    kpi.kpiType = this.currentKPIType.toUpperCase();
    kpi.kpiReportingType =
      this.currentKPIReportingType === null
        ? null
        : this.currentKPIReportingType.toUpperCase();
    kpi.description = kpiDesc.val();
    kpi.templates = [];
    kpi.title = kpiDesc.val();

    this.currentGrant.kpis.push(kpi);

    const submissions = this.currentGrant.submissions;
    const grantKpi = new GrantKpi();

    grantKpi.id = id;
    grantKpi.kpiType = this.currentKPIType.toUpperCase();
    grantKpi.kpiReportingType =
      this.currentKPIReportingType === null
        ? null
        : this.currentKPIReportingType.toUpperCase();
    grantKpi.title = kpiDesc.val();
    grantKpi.description = kpiDesc.val();
    grantKpi.frequency = "YEARLY";
    grantKpi.periodicity = 0;
    grantKpi.scheduled = true;

    for (const sub of this.currentGrant.submissions) {
      if (this.currentKPIType === "Quantitative") {
        const quantKpi = new QuantitiaveKpisubmission();
        quantKpi.goal = 0;
        quantKpi.toReport = true;
        quantKpi.id = 0 - Math.round(Math.random() * 10000000000);
        quantKpi.grantKpi = grantKpi;

        sub.quantitiaveKpisubmissions.push(quantKpi);
      } else if (this.currentKPIType === "Qualitative") {
        const qualKpi = new QualitativeKpiSubmission();
        qualKpi.goal = "";
        qualKpi.toReport = true;
        qualKpi.id = 0 - Math.round(Math.random() * 10000000000);
        qualKpi.grantKpi = grantKpi;

        sub.qualitativeKpiSubmissions.push(qualKpi);
      } else if (this.currentKPIType === "Document") {
        const docKpi = new DocumentKpiSubmission();
        docKpi.goal = "";
        docKpi.toReport = true;
        docKpi.id = 0 - Math.round(Math.random() * 10000000000);
        docKpi.grantKpi = grantKpi;

        sub.documentKpiSubmissions.push(docKpi);
      }
    }
    this.grantData.changeMessage(
      this.currentGrant,
      this.appComp.loggedInUser.id
    );

    this._setEditMode(true);
    kpiDesc.val("");
    $(kpiModal).modal("hide");
  }

  toggleCheckBox(
    event: Event,
    type: string,
    submissionId: number,
    kpiDataId: number
  ) {
    this._setEditMode(true);
    const checkBoxVal = (<HTMLInputElement>event.currentTarget).checked;
    const submissions = this.currentGrant.submissions;
    switch (type) {
      case "quantitative":
        for (const submission of submissions) {
          if (submissionId === submission.id) {
            const quantitativeKpis = submission.quantitiaveKpisubmissions;
            for (const quantKpiData of quantitativeKpis) {
              if (kpiDataId === quantKpiData.id) {
                quantKpiData.toReport = checkBoxVal;
              }
            }
          }
        }
        break;
      case "qualitative":
        for (const submission of submissions) {
          if (submissionId === submission.id) {
            const qualitativeKpis = submission.qualitativeKpiSubmissions;
            for (const qualKpiData of qualitativeKpis) {
              if (kpiDataId === qualKpiData.id) {
                qualKpiData.toReport = checkBoxVal;
              }
            }
          }
        }
        break;
      case "document":
        for (const submission of submissions) {
          if (submissionId === submission.id) {
            const docKpis = submission.documentKpiSubmissions;
            for (const docKpiData of docKpis) {
              if (kpiDataId === docKpiData.id) {
                docKpiData.toReport = checkBoxVal;
              }
            }
          }
        }
        break;
    }

    this.grantData.changeMessage(
      this.currentGrant,
      this.appComp.loggedInUser.id
    );
    this.setDateDuration();
    //console.log();
  }

  updateGoal(
    event: Event,
    type: string,
    submissionId: number,
    kpiDataId: number
  ) {
    this._setEditMode(true);
    const submissions = this.currentGrant.submissions;

    for (const submission of submissions) {
      if (submissionId === submission.id) {
        const quantitativeKpis = submission.quantitiaveKpisubmissions;
        for (const quantKpiData of quantitativeKpis) {
          if (kpiDataId === quantKpiData.id) {
            quantKpiData.goal = Number(
              (<HTMLInputElement>event.currentTarget).value
            );
          }
        }
      }
    }
  }

  submitGrant(toStateId: number) {
    //console.log(toStateId);

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
    this.http.post(url, this.currentGrant, httpOptions).subscribe(
      (grant: Grant) => {
        /*this.loading = false;
      this.grantDataService.changeMessage(grant);
      this.router.navigate(['grant']);*/

        url =
          "/api/user/" +
          this.appComp.loggedInUser.id +
          "/grant/" +
          this.currentGrant.id;
        this.http.get(url, httpOptions).subscribe(
          (updatedGrant: Grant) => {
            this.grantData.changeMessage(
              updatedGrant,
              this.appComp.loggedInUser.id
            );
            this.setDateDuration();
            this.currentGrant = updatedGrant;
            this.checkGrantPermissions();
            // this.router.navigate(['grant']);
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
                this.appComp.logout();
              }, 4000);
            } else {
              this.toastr.error(
                errorMsg.error.message,
                "4 We encountered an error",
                config
              );
            }
          }
        );
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
            this.appComp.logout();
          }, 4000);
        } else {
          this.toastr.error(
            errorMsg.error.message,
            "5 We encountered an error",
            config
          );
        }
      }
    );
  }

  private _setEditMode(state: boolean) {
    this.editMode = state;
    /*if (state) {
      $(this.actionBlock.nativeElement).prop('disabled', true);
    } else {
      $(this.actionBlock.nativeElement).prop('disabled', false);
    }*/
  }

  updateSubmission(event: Event, kpiType: string, kpiDataId: number) {
    //console.log((<HTMLInputElement>event.target).value + '  ' + kpiType + '  ' + kpiDataId);
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
    this.setDateDuration();
    //console.log(this.currentSubmission);
  }

  updateTitle(event: Event, kpiId: number, kpiType: string) {
    const kpiTitleElem = event.target;
    for (const kpi of this.currentGrant.kpis) {
      if (kpi.id === kpiId) {
        kpi.title = (<HTMLInputElement>kpiTitleElem).value;
        kpi.description = (<HTMLInputElement>kpiTitleElem).value;
      }
    }
    switch (kpiType) {
      case "QUANTITATIVE":
        for (const sub of this.currentGrant.submissions) {
          for (const quantKpi of sub.quantitiaveKpisubmissions) {
            if (quantKpi.grantKpi.id === kpiId) {
              quantKpi.grantKpi.title = (<HTMLInputElement>kpiTitleElem).value;
              quantKpi.grantKpi.description = (<HTMLInputElement>(
                kpiTitleElem
              )).value;
            }
          }
        }
        break;

      case "QUALITATIVE":
        for (const sub of this.currentGrant.submissions) {
          for (const qualKpi of sub.qualitativeKpiSubmissions) {
            if (qualKpi.grantKpi.id === kpiId) {
              qualKpi.grantKpi.title = (<HTMLInputElement>kpiTitleElem).value;
              qualKpi.grantKpi.description = (<HTMLInputElement>(
                kpiTitleElem
              )).value;
            }
          }
        }
        break;

      case "DOCUMENT":
        for (const sub of this.currentGrant.submissions) {
          for (const docKpi of sub.documentKpiSubmissions) {
            if (docKpi.grantKpi.id === kpiId) {
              docKpi.grantKpi.title = (<HTMLInputElement>kpiTitleElem).value;
              docKpi.grantKpi.description = (<HTMLInputElement>(
                kpiTitleElem
              )).value;
            }
          }
        }
        break;
    }
    this._setEditMode(true);
    this.grantData.changeMessage(
      this.currentGrant,
      this.appComp.loggedInUser.id
    );
    this.setDateDuration();
    //console.log(this.currentGrant);
  }

  selectGrantSchedule() {
    const scheduleModal = this.selectScheduleModal.nativeElement;
    $(scheduleModal).modal("show");
  }


  private _adjustHeights() {
    /*  const allElems = $('[data-id]');
    for (const elem of allElems) {
      $(elem).css('height', $('#kpi_title_' + $(elem).attr('data-id')).outerHeight() + 'px');
      // console.log($(elem).css('height'));
    }*/
  }

  private _setFlowButtonColors() {
    const flowActionBtns = $('[name="flowActionBtn"]');
    for (let elem = 0; elem < flowActionBtns.length; elem++) {
      // this.colors = new Colors();
      const color = this.colors.colorArray[elem];
      $(flowActionBtns[elem]).css("background-color", color);
    }
  }

  checkGrant() {
    //console.log('basic');

    if (
      JSON.stringify(this.currentGrant) === JSON.stringify(this.originalGrant)
    ) {
      this._setEditMode(false);
    } else {
      this._setEditMode(true);
      this.grantData.changeMessage(
        this.currentGrant,
        this.appComp.loggedInUser.id
      );
      this.setDateDuration();
    }
    this.setDateDuration();
  }

  openBottomSheet(
    kpiId: number,
    title: string,
    templates: Template[],
    canManage: boolean
  ): void {
    const fileTemplates = new FileTemplates();
    fileTemplates.kpiId = kpiId;
    fileTemplates.subTitle = title;
    fileTemplates.grantId = this.currentGrant.id;
    fileTemplates.title = "Template Library";
    fileTemplates.templates = templates;
    fileTemplates.canManage = canManage;

    const _bSheet = this._bottomSheet.open(BottomsheetComponent, {
      hasBackdrop: false,
      data: fileTemplates,
    });

    _bSheet.afterDismissed().subscribe((result) => {
      //console.log(this.currentGrant);
      this.checkGrant();
    });
  }

  openBottomSheetForSubmittionAttachments(
    kpiDataId: number,
    kpiDataType: string,
    title: string,
    attachments: Doc[],
    canManage: boolean
  ): void {
    const attachmentTemplates = new AttachmentTemplates();
    attachmentTemplates.kpiDataId = kpiDataId;
    attachmentTemplates.kpiDataType = kpiDataType;
    attachmentTemplates.subTitle = title;
    attachmentTemplates.grantId = this.currentGrant.id;
    attachmentTemplates.title = "KPI Attachments";
    attachmentTemplates.docs = attachments;
    attachmentTemplates.canManage = canManage;

    const _bSheet = this._bottomSheet.open(BottomsheetAttachmentsComponent, {
      hasBackdrop: false,
      data: attachmentTemplates,
    });

    _bSheet.afterDismissed().subscribe((result) => {
      //console.log(this.currentGrant);
      this.checkGrant();
    });
  }

  openBottomSheetForSubmittionNotes(
    kpiDataId: number,
    kpiDataType: string,
    title: string,
    notes: Note[],
    canManage: boolean
  ): void {
    const noteTemplates = new NoteTemplates();
    noteTemplates.kpiDataId = kpiDataId;
    noteTemplates.kpiDataType = kpiDataType;
    noteTemplates.subTitle = title;
    noteTemplates.grantId = this.currentGrant.id;
    noteTemplates.title = "KPI Notes";
    noteTemplates.notes = notes;
    noteTemplates.canManage = canManage;

    const _bSheet = this._bottomSheet.open(BottomsheetNotesComponent, {
      hasBackdrop: false,
      data: noteTemplates,
    });

    _bSheet.afterDismissed().subscribe((result) => {
      //console.log(this.currentGrant);
      this.checkGrant();
    });
  }



  clearSubmissions() {
    this.currentGrant.submissions = [];
  }

  openAttachmentsNav() {
    const attachmentsSN = this.attachmentsSideNav._elementRef.nativeElement;
    this.attachmentsSideNavOpened = true;
  }

  closeAttachmentsSideNav() {
    this.attachmentsSideNavOpened = false;
  }

  setOrg(event: Event) {
    //console.log(event);
  }

  deleteSection(secId: number) {
    const index = this.currentGrant.grantDetails.sections.findIndex(
      (section) => section.id === Number(secId)
    );
    this.currentGrant.grantDetails.sections.splice(index, 1);
    this.checkGrant();
  }

  handleSpacebar(ev: Event) {
    //console.log(ev);
    ev.stopImmediatePropagation();
  }

  setSubmissionDate(sub: Submission, event: MatDatepickerInputEvent<any>) {
    sub.submitBy = event.value;
    sub.submitDateStr = this.datepipe.transform(event.value, "yyyy-MM-dd");
    this.checkGrant();
  }

  setKpiTypeSection(event) {
    this.currentKPIType = event.value;
    if (this.currentKPIReportingType !== "Quantitative") {
      this.currentKPIReportingType = null;
    } else {
      this.currentKPIReportingType = "Activity";
    }
  }

  setKpiReportingTypeSection(event) {
    this.currentKPIReportingType = event.value;

    //console.log(this.currentKPIType + ' - ' + this.currentKPIReportingType);
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
      this.currentGrant.duration = "Not set";
    }
  }

  manageDate(type: string, ev: Event, dt: string) {
    //const dtParsed = ev.split('/');
    console.log(ev);
    if (type === "start") {
      const std = new Date(ev.toString());
      this.currentGrant.startDate = std;
      //this.currentGrant.stDate = std.getFullYear() + '-' + std.getMonth() + '-' + std.getDate();
    } else if (type === "end") {
      const end = new Date(ev.toString());
      if (
        this.currentGrant.minEndEndate &&
        end < new Date(this.currentGrant.minEndEndate)
      ) {
        this.dialog.open(MessagingComponent, {
          data:
            "The Grant's end date cannot be lesser than the end date of the most recent approved report of the original grant.",
          panelClass: "center-class",
        });
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }
      this.currentGrant.endDate = end;
    }
    this.setDateDuration();
  }

  datePickerSelected(event: Event) {
    this.appComp.sectionInModification = false;
  }

  private _filter(value: string): Organization[] {
    const filterValue = value.toLowerCase();
    const selectedOrg = this.options.filter((option) =>
      option.name.toLowerCase().includes(filterValue)
    );
    if (selectedOrg.length === 0) {
      const newOrg = new Organization();
      newOrg.id = 0 - Math.round(Math.random() * 1000000000);
      newOrg.organizationType = "GRANTEE";
      newOrg.type = "GRANTEE";
      newOrg.name = 'Add a new Organisation: "' + value + '"';
      //this.currentGrant.organization = newOrg;
      selectedOrg.push(newOrg);
    }

    return selectedOrg;
  }

  displayFn = (org) => {
    if (org) {
      if (org.name.startsWith("Add a new Organisation: ")) {
        org.name = org.name.replace("Add a new Organisation: ", "");
        org.name = org.name.replace('"', "");
        org.name = org.name.replace('"', "");
      }
      this.currentGrant.organization = org;
    }
    return org ? org.name : undefined;
  };

  setTimeout() {
    this.userActivity = setTimeout(() => {
      this.userInactive.next(undefined);

      this.grantToUpdate = JSON.parse(JSON.stringify(this.currentGrant));
      if (this.currentGrant !== null) {
        //this.grantComponent.checkGrantPermissions();
      }
      if (
        this.currentGrant !== null &&
        this.currentGrant.name !== undefined &&
        !this.appComp.sectionInModification
      ) {
        //this.grantToUpdate.id = this.currentGrantId;
        //this.saveGrant(this.grantToUpdate);
      }
    }, 3000);
  }

  //@HostListener('window:mousemove')
  @HostListener("window:keyup", ["$event"])
  //@HostListener('window:scroll', ['$event'])
  @HostListener("document:click", ["$event"])
  refreshUserState() {
    clearTimeout(this.userActivity);
    this.setTimeout();
  }

  openStartDate() {
    const stDateElem = this.pickerStart;
    if (!stDateElem.opened) {
      this.appComp.sectionInModification = true;
      stDateElem.open();
    } else {
      this.appComp.sectionInModification = false;
      stDateElem.close();
    }
  }

  openEndDate() {
    const stDateElem = this.pickerEnd;
    if (!stDateElem.opened) {
      this.appComp.sectionInModification = true;
      stDateElem.open();
    } else {
      this.appComp.sectionInModification = false;
      stDateElem.close();
    }
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

  showWorkflowAssigments() {
    this.adminComp.showWorkflowAssigments();
  }

  getGrantAmountInWords(amount: number) {
    let amtInWords = '<span class="amountPlaceholder">Not set</span>';
    if (amount) {
      amtInWords = indianCurrencyInWords(
        amount.toString().replace(/[^0-9.]/g, "")
      )
        .replace("Rupees", "")
        .replace("Paisa", "");
      return "Rs. " + this.titlecasePipe.transform(amtInWords);
    }
    return amtInWords;
  }

  getFormattedGrantAmount(amount: number): string {
    if (amount) {
      return inf.format(amount, 2);
    }
    return "<div class='amountPlaceholder'>Enter grant amount</div>";
  }

  showGrantAmountInput(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    this.grantAmount.nativeElement.style.visibility = "visible";
  }

  showFormattedGrantAmount(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    this.grantAmountFormatted.nativeElement.style.visibility = "visible";
  }

  clearStartDate() {
    if (this.currentGrant.origGrantId) {
      return;
    }
    this.currentGrant.startDate = null;
    this.currentGrant.stDate = "";
    this.setDateDuration();
  }

  clearEndDate() {
    this.currentGrant.endDate = null;
    this.currentGrant.enDate = "";
    this.setDateDuration();
  }

  startDateFilter = (d: Date | null): boolean => {
    const today = new Date();
    const day = d || today;
    if (this.currentGrant.endDate) {
      return day <= new Date(this.currentGrant.endDate);
    }
    return true;
  };

  endDateFilter = (d: Date | null): boolean => {
    const today = new Date();
    const day = d || today;
    if (this.currentGrant.startDate) {
      return (
        day >=
        (this.currentGrant.minEndEndate
          ? new Date(this.currentGrant.minEndEndate)
          : new Date(this.currentGrant.startDate))
      );
    }
    return true;
  };

  showProjectDocuments() {
    const dgRef = this.dialog.open(ProjectDocumentsComponent, {
      data: {
        title: "Project Documents",
        loggedInUser: this.appComp.loggedInUser,
        currentGrant: this.currentGrant,
        acceptedFileTypes: this.appComp.acceptedFileTypes
      },
      panelClass: "project-document-class",
    });
  }

  manageGrant() {
    this.adminComp.manageGrant(null, this.currentGrant.origGrantId);
  }

  doZoom = () => (function () {

    var $section = $('#zoomImageContainer')
    $section
      .find(
        '.panzoom')
      .panzoom(
        {
          $zoomIn: $section
            .find(".zoom-in"),
          $zoomOut: $section
            .find(".zoom-out"),
          $zoomRange: $section
            .find(".zoom-range"),
          $reset: $section
            .find(".reset")
        });
    var deg = 0;
    $(".rotateBtn").on("click", function () {
      if ($(this).is("#left")) {
        deg = deg - 90;
      } else {
        deg = deg + 90;
      }
      $("#imgToRotate").css({
        "-webkit-transform": "rotate(" + deg + "deg)",
        "-moz-transform": "rotate(" + deg + "deg)",
        transform: "rotate(" + deg + "deg)"
      });
    });

    // $('#ex1').zoom({
    //   onZoomIn:true,
    // });
    // $('#ex1').zoom({ on:'hover' });
    //$('#ex1').zoom({ on:'click' });			 
    // $('#ex4').zoom({ on:'toggle' });
  })();


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

      const dg = this.dialog.open(GrantTagsComponent, {
        data: { orgTags: tags, grantTags: this.currentGrant.tags, grant: this.currentGrant, appComp: this.appComp, type: 'grant' },
        panelClass: "grant-template-class"
      });

    });
  }

  validateAmountForAmendedGrant(ev) {
    if (this.currentGrant.origGrantId && ev.target.value < this.currentGrant.approvedDisbursementsTotal) {
      const dg = this.dialog.open(MessagingComponent, {
        data:
          "Grant amount cannot be lesser than previously approved disbursement of ₹" + this.currentGrant.approvedDisbursementsTotal,
        panelClass: "center-class",
      });
    }
  }

  compareGrants(currentGrantId, origGrantId) {
    this.grantApiService.compareGrants(currentGrantId, origGrantId, this.appComp.loggedInUser.id).then((grantsToCompare: any) => {
      console.log(grantsToCompare);
      const dg = this.dialog.open(GrantCompareComponent, {
        data: { checkType: grantsToCompare.checkType, compareItems: grantsToCompare.grants },
        panelClass: "wf-assignment-class",
      });
    });
  }
}
