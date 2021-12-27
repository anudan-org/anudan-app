import { MessagingComponent } from 'app/components/messaging/messaging.component';
import { DocManagementService } from './../../doc-management.service';
import { DocpreviewService } from './../../docpreview.service';
import { DocpreviewComponent } from './../../docpreview/docpreview.component';
import { GrantCompareComponent } from './../../grant-compare/grant-compare.component';
import { GrantApiService } from './../../grant-api.service';
import { OrgTag, Attribute } from './../../model/dahsboard';
import { GrantTagsComponent } from './../../grant-tags/grant-tags.component';
import { AdminService } from "./../../admin.service";
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewChecked,
  AfterViewInit,
  HostListener,
} from "@angular/core";
import {
  AttachmentTemplates,
  Doc,
  FileTemplates,
  Grant,
  Note,
  NoteTemplates,
  Section,
  Submission,
  SubmissionStatus,
  Template,
  TableData,
  ColumnData,
  TemplateLibrary,
  FieldInfo,
  SectionInfo,
  DocInfo,
  AttachmentDownloadRequest,
  WorkflowStatus,
} from "../../model/dahsboard";
import { GrantDataService } from "../../grant.data.service";
import { DataService } from "../../data.service";
import { SubmissionDataService } from "../../submission.data.service";
import {
  ActivatedRoute,
  Router,
  NavigationStart,
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
  MatDatepickerInputEvent,
  MatDialog,
} from "@angular/material";
import { DatePipe } from "@angular/common";
import { Colors, Configuration } from "../../model/app-config";
import { Observable, Subject } from "rxjs";
import { FieldDialogComponent } from "../../components/field-dialog/field-dialog.component";
import { SectionEditComponent } from "../../components/section-edit/section-edit.component";
import { BottomsheetComponent } from "../../components/bottomsheet/bottomsheet.component";
import { BottomsheetAttachmentsComponent } from "../../components/bottomsheetAttachments/bottomsheetAttachments.component";
import { BottomsheetNotesComponent } from "../../components/bottomsheetNotes/bottomsheetNotes.component";
import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import { FormControl } from "@angular/forms";
import { map, startWith } from "rxjs/operators";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import {
  MatAutocompleteSelectedEvent,
  MatAutocomplete,
} from "@angular/material/autocomplete";
import { MatChipInputEvent } from "@angular/material/chips";
import { saveAs } from "file-saver";
import { AdminLayoutComponent } from "../../layouts/admin-layout/admin-layout.component";
import { User } from "../../model/user";

import * as inf from "indian-number-format";
import { AttributeService } from "app/attribute-validation-service";
import { AmountValidator } from "app/amount-validator";
import { ProjectDocumentsComponent } from "app/components/project-documents/project-documents.component";
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: "app-sections",
  templateUrl: "./sections.component.html",
  styleUrls: ["./sections.component.scss"],
  providers: [SidebarComponent, DataService],
  styles: [
    `
      ::ng-deep .cdk-overlay-pane {
        width: auto !important;
      }
    `,
  ],
})
export class SectionsComponent
  implements OnInit, AfterViewChecked, AfterViewInit {
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
  action: string;
  newField: any;
  allowScroll = true;
  filesToUpload = FileList;
  grantWorkflowStatuses: WorkflowStatus[];
  tenantUsers: User[];
  noSingleDocAction: boolean = false;
  downloadAndDeleteAllowed: boolean = false;
  myControl: FormControl;
  options: TemplateLibrary[];
  filteredOptions: Observable<TemplateLibrary[]>;

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  fruitCtrl = new FormControl();
  filteredFruits: Observable<string[]>;
  fruits: TemplateLibrary[] = [];
  allFruits: string[] = ["Apple", "Lemon", "Lime", "Orange", "Strawberry"];
  subscribers: any = {};
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
  @ViewChild("fruitInput") fruitInput: ElementRef<HTMLInputElement>;
  @ViewChild("auto") matAutocomplete: MatAutocomplete;
  @ViewChild("downloadSelected") downloadSelected: ElementRef;
  @ViewChild("committedAmount") committedAmount: ElementRef;
  @ViewChild("amountFormatted") amountFormatted: ElementRef;
  @ViewChild("otherSourcesAmount") otherSourcesAmount: ElementRef;
  @ViewChild("otherSourcesAmountFormatted")
  otherSourcesAmountFormatted: ElementRef;
  @ViewChild("dataColumns") dataColumns: ElementRef;
  orgTags: OrgTag[] = [];

  constructor(
    private grantData: GrantDataService,
    private submissionData: SubmissionDataService,
    private route: ActivatedRoute,
    private router: Router,
    private submissionDataService: SubmissionDataService,
    public appComp: AppComponent,
    private http: HttpClient,
    private adminComp: AdminLayoutComponent,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private _bottomSheet: MatBottomSheet,
    private elem: ElementRef,
    private datepipe: DatePipe,
    public colors: Colors,
    private sidebar: SidebarComponent,
    private attributeService: AttributeService,
    public amountValidator: AmountValidator,
    private adminService: AdminService,
    private grantApiService: GrantApiService,
    private sanitizer: DomSanitizer,
    private docPreviewService: DocpreviewService,
    private docManagementService: DocManagementService
  ) {
    this.colors = new Colors();

    this.route.params.subscribe((p) => {
      this.action = p["action"];
      this.appComp.action = this.action;
    });

    this.grantData.currentMessage.subscribe((grant) => {
      this.currentGrant = grant;
    });

    if (!this.currentGrant) {
      this.router.navigate(["dashboard"]);
    }

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

    this.myControl = new FormControl();
    this.adminService
      .getLibraryDocs(this.appComp.loggedInUser)
      .then((data: TemplateLibrary[]) => {
        this.options = data;
        const docs = this.options ? this.options.slice() : [];
        this.filteredOptions = this.myControl.valueChanges.pipe(
          startWith(""),
          map((value) => (typeof value === "string" ? value : '')),
          map((name) => (name ? this._filter(name) : docs))
        );
      });
  }

  ngOnDestroy() {
    if (this.subscribers.name) {
      this.subscribers.name.unsubscribe();
    }
  }

  ngOnInit() {
    this.setTimeout();
    this.userInactive.subscribe(() =>
      console.log("user has been inactive for 3s")
    );

    this.appComp.createNewSection.subscribe((val) => {
      if (val) {
        $(".modal-backdrop").remove();

        this.addNewSection();
        this.appComp.createNewSection.next(false);
      }
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
        !this.appComp.grantSaved &&
        !this.appComp.sectionUpdated
      ) {
        this.saveGrant(false);
        this.appComp.grantSaved = false;
      }
    });

    for (let section of this.currentGrant.grantDetails.sections) {
      if (section.attributes) {
        for (let attribute of section.attributes) {
          if (attribute.fieldType === "document") {
            attribute.docs = [];
            if (attribute.fieldValue !== "") {
              let frt = JSON.parse(attribute.fieldValue);
              if (frt.length > 0) {
                for (let f of frt) {
                  attribute.docs.push(f);
                }
              }
            }
          }
        }
      }
    }

    this.originalGrant = JSON.parse(JSON.stringify(this.currentGrant));
    this.submissionData.currentMessage.subscribe(
      (submission) => (this.currentSubmission = submission)
    );

    this.checkGrantPermissions();

    $("#stDateIcon").on("click", function (event) {
      console.log("PICKER CLICKED");
    });

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

  ngAfterViewChecked() {
    if (this.newField) {
      this.scrollTo(this.newField);
    }
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
    this._setFlowButtonColors();
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



  deleteFieldEntry(sectionId: number, attributeId: number, title: string) {

    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: title, btnMain: "Delete Field", btnSecondary: "Not Now" },
      panelClass: "grant-template-class",
    });

    dialogRef.afterClosed().subscribe(result => {
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
          this.appComp.loggedInUser.id +
          "/grant/" +
          this.currentGrant.id +
          "/section/" +
          sectionId +
          "/field/" +
          attributeId;

        this.http.post<Grant>(url, this.currentGrant, httpOptions).subscribe(
          (grant: Grant) => {
            this.grantData.changeMessage(grant, this.appComp.loggedInUser.id);
            this.sidebar.buildSectionsSideNav(null);
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
                "8 We encountered an error",
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


  saveGrant(compare: boolean) {
    if (!this.canManage) {
      return;
    }

    this.appComp.autosaveDisplay = "";
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
      "/grant/" +
      this.currentGrant.id;

    this.http.put(url, this.currentGrant, httpOptions).subscribe(
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
        this._setEditMode(false);
        this.currentSubmission = null;
        this.checkGrantPermissions();
        if (grant.submissions && grant.submissions.length > 0) {
          this.checkCurrentSubmission();
        }
        this.appComp.autosave = false;
        this.appComp.grantSaved = false;
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
            "9 We encountered an error",
            config
          );
        }
      }
    );
  }

  saveSubmissionAndMove(toStateId: number) {
    for (const sub of this.currentGrant.submissions) {
      if (sub.id === this.currentSubmission.id) {
        const subStatus = new SubmissionStatus();
        subStatus.id = toStateId;
        sub.submissionStatus = subStatus;
      }
    }
  }

  addNewFieldToSection(sectionId: string, sectionName: string) {
    this.appComp.sectionInModification = true;

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
      "/section/" +
      Number(sectionId) +
      "/field";

    this.http.post<FieldInfo>(url, this.currentGrant, httpOptions).subscribe(
      (info: FieldInfo) => {
        this.grantData.changeMessage(info.grant, this.appComp.loggedInUser.id);
        this.currentGrant = info.grant;
        this.appComp.sectionInModification = false;
        this.appComp.selectedTemplate = info.grant.grantTemplate;
        this.newField = "field_" + info.stringAttributeId;
      },
      (error) => {
        const errorMsg = error as HttpErrorResponse;
        console.log(error);
        this.toastr.error(errorMsg.error.message, errorMsg.error.messageTitle, {
          enableHtml: true,
        });
      }
    );
  }

  scrollTo(uniqueID) {
    const elmnt = document.getElementById(uniqueID);
    if (elmnt) {
      const elementRect = elmnt.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const middle = absoluteElementTop - window.innerHeight / 2;
      window.scrollTo(0, middle);
      elmnt.focus();
    }
    this.newField = null;
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

    this.http.post<SectionInfo>(url, this.currentGrant, httpOptions).subscribe(
      (info: SectionInfo) => {
        this.grantData.changeMessage(info.grant, this.appComp.loggedInUser.id);

        sectionName.val("");
        this._setEditMode(true);
        $(createSectionModal).modal("hide");
        this.appComp.sectionAdded = true;
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
        this.sidebar.buildSectionsSideNav(null);
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
            "10 We encountered an error",
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


  submitGrant(toStateId: number) {
    console.log(toStateId);

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
            this.currentGrant = updatedGrant;
            this.checkGrantPermissions();
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
                "11 We encountered an error",
                config
              );
            }
          }
        );
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
            "12 We encountered an error",
            config
          );
        }
      }
    );
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

  checkGrant(ev: Event) {
    this.appComp.sectionInModification = true;

    console.log(ev);

    if (
      JSON.stringify(this.currentGrant) === JSON.stringify(this.originalGrant)
    ) {
      this._setEditMode(false);
    } else {
      this.appComp.sectionInModification = false;
      this._setEditMode(true);
    }
  }

  verifyGrant(section: Section, ev: Event) {
    this.appComp.sectionInModification = true;

    console.log(ev);

    if (
      JSON.stringify(this.currentGrant) === JSON.stringify(this.originalGrant)
    ) {
      this._setEditMode(false);
    } else {
      if (ev !== null || ev !== undefined) {
        this.grantData.changeMessage(
          this.currentGrant,
          this.appComp.loggedInUser.id
        );
        this.appComp.sectionUpdated = true;
        this.sidebar.buildSectionsSideNav(null);
        this.appComp.sectionInModification = false;
        if (ev.toString() !== "") {
          this.router.navigate(["grant/section/" + this.getCleanText(section)]);
        } else {
          this.router.navigate(["grant/section/" + section.id]);
        }
      }

      this.appComp.sectionInModification = false;
      this._setEditMode(true);
    }
  }

  changeFieldType() {
    this.appComp.sectionInModification = true;
  }

  selectionClosed() {
    console.log("Closed");
  }

  handleTypeChange(ev, attr: Attribute, sec: Section) {
    const isEmpty = this.attributeService.checkIfEmpty(attr);
    if (!isEmpty) {
      const dialogRef = this.dialog.open(FieldDialogComponent, {
        data: {
          title:
            "You will lose all data for " + attr.fieldName + " Are you sure?", btnMain: 'Change Field Type', btnSecondary: 'Not Now'
        },
        panelClass: "grant-template-class",
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.carryOutChange(attr, ev, sec);
        } else {
          ev.source.value = attr.fieldType;
          return;
        }
      });
    } else {
      this.carryOutChange(attr, ev, sec);
    }
  }

  carryOutChange(attr: Attribute, ev, sec) {
    attr.fieldType = ev.source.value;
    attr.fieldValue = "";
    if (attr.fieldTableValue) {
      attr.fieldTableValue = null;
    }
    if (attr.target) {
      attr.target = null;
    }
    if (attr.frequency) {
      attr.frequency = null;
    }

    if (ev.source.value.toString() === "table") {
      if (attr.fieldValue.trim() === "") {
        attr.fieldTableValue = [];
        const data = new TableData();
        data.name = "";
        data.header = "";
        data.columns = [];

        for (let i = 0; i < 5; i++) {
          const col = new ColumnData();
          col.name = "";
          col.value = "";
          data.columns.push(col);
        }

        attr.fieldTableValue.push(JSON.parse(JSON.stringify(data)));
      }
    } else if (ev.source.value.toString() === "disbursement") {
      if (attr.fieldValue.trim() === "") {
        attr.fieldTableValue = [];
        const data = new TableData();
        data.name = "1";
        data.header = "";
        data.columns = [];

        const colHeaders = [
          "Date/Period",
          "Amount",
          "Funds from other Sources",
          "Notes",
        ];
        for (let i = 0; i < 4; i++) {
          const col = new ColumnData();
          col.name = colHeaders[i];
          col.value = "";
          if (i === 1 || i === 2) {
            col.dataType = "currency";
          }
          data.columns.push(col);
        }

        attr.fieldTableValue.push(JSON.parse(JSON.stringify(data)));
      }
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
      "/section/" +
      sec.id +
      "/field/" +
      attr.id;
    this.http
      .put<FieldInfo>(
        url,
        { grant: this.currentGrant, attr: attr },
        httpOptions
      )
      .subscribe(
        (info: FieldInfo) => {
          this.grantData.changeMessage(
            info.grant,
            this.appComp.loggedInUser.id
          );
          this.appComp.sectionInModification = false;
          this.appComp.selectedTemplate = info.grant.grantTemplate;
          this.newField = "field_" + info.stringAttributeId;
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
              "13 We encountered an error",
              config
            );
          }
        }
      );
  }

  addColumn(attr: Attribute) {
    for (let row of attr.fieldTableValue) {
      const col = new ColumnData();
      col.id = Math.round(Math.random() * 1000000000);
      col.name = "";
      col.value = "";
      row.columns.push(col);
    }
    this.newField =
      "column_" +
      attr.fieldTableValue[0].columns[
        attr.fieldTableValue[0].columns.length - 1
      ].id;
  }

  addRow(attr: Attribute) {
    const row = new TableData();
    row.name = "";
    row.header = attr.fieldTableValue[0].header;
    row.columns = JSON.parse(JSON.stringify(attr.fieldTableValue[0].columns));
    for (let i = 0; i < row.columns.length; i++) {
      row.columns[i].value = "";
    }

    attr.fieldTableValue.push(row);
  }

  addDisbursementRow(attr: Attribute) {
    const row = new TableData();
    row.name = String(
      Number(attr.fieldTableValue[attr.fieldTableValue.length - 1].name) + 1
    );
    row.header = attr.fieldTableValue[0].header;
    row.columns = JSON.parse(JSON.stringify(attr.fieldTableValue[0].columns));
    for (let i of row.columns) {
      i.value = "";
    }

    attr.fieldTableValue.push(row);
  }

  deleteRow(sectionId, attributeId, rowIndex, msg: string) {

    const dg = this.dialog.open(FieldDialogComponent, {
      data: { title: msg, btnMain: "Delete Row", btnSecondary: "Not Now" },
      panelClass: "grant-template-class"
    });

    dg.afterClosed().subscribe((result) => {
      if (result) {
        console.log(sectionId + " " + attributeId + " " + rowIndex);
        for (let section of this.currentGrant.grantDetails.sections) {
          if (section.id === sectionId) {
            for (let attrib of section.attributes) {
              if (attrib.id == attributeId) {
                console.log(attrib.fieldTableValue);
                const tableData = attrib.fieldTableValue;
                tableData.splice(rowIndex, 1);
              }
            }
          }
        }
      } else {
        dg.close();
      }
    });

  }

  deleteDisbursementRow(sectionId, attributeId, rowIndex) {
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: "Delete the selected planned disbursement row?", btnMain: "Delete Planned Disbursement", btnSecondary: "Not Now" },
      panelClass: "grant-template-class",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        for (let section of this.currentGrant.grantDetails.sections) {
          if (section.id === sectionId) {
            for (let attrib of section.attributes) {
              if (attrib.id == attributeId) {
                console.log(attrib.fieldTableValue);
                const tableData = attrib.fieldTableValue;
                tableData.splice(rowIndex, 1);
                for (let i = 0; i < tableData.length; i++) {
                  tableData[i].name = String(i + 1);
                }
              }
            }
          }
        }
      } else {
        dialogRef.close();
      }
    });
  }

  deleteColumn(sectionId, attributeId, colIndex, msg: string) {
    const dg = this.dialog.open(FieldDialogComponent, {
      data: { title: msg, btnMain: "Delete Column", btnSecondary: "Not Now" },
      panelClass: "grant-template-class"
    });

    dg.afterClosed().subscribe((result) => {
      if (result) {
        for (let section of this.currentGrant.grantDetails.sections) {
          if (section.id === sectionId) {
            for (let attrib of section.attributes) {
              if (attrib.id == attributeId) {
                console.log(attrib.fieldTableValue);
                for (let row of attrib.fieldTableValue) {
                  row.columns.splice(colIndex, 1);
                }
              }
            }
          }
        }
      } else {
        dg.close();
      }
    });
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
      console.log(this.currentGrant);
      this.checkGrant(null);
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
      console.log(this.currentGrant);
      this.checkGrant(null);
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
      console.log(this.currentGrant);
      this.checkGrant(null);
    });
  }

  deleteSection(secId: number, title: string) {

    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: title, btnMain: "Delete Section", btnSecondary: "Not Now" },
      panelClass: "grant-template-class",
    });

    dialogRef.afterClosed().subscribe(result => {
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
          this.appComp.loggedInUser.id +
          "/grant/" +
          this.currentGrant.id +
          "/template/" +
          this.currentGrant.templateId +
          "/section/" +
          secId;

        this.http.put<Grant>(url, this.currentGrant, httpOptions).subscribe(
          (grant: Grant) => {
            this.grantData.changeMessage(grant, this.appComp.loggedInUser.id);
            const path = this.sidebar.buildSectionsSideNav(null);
            this.router.navigate([path]);
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
                "14 We encountered an error",
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

  handleSpacebar(ev: Event) {
    console.log(ev);
    ev.stopImmediatePropagation();
  }

  setSubmissionDate(sub: Submission, event: MatDatepickerInputEvent<any>) {
    sub.submitBy = event.value;
    sub.submitDateStr = this.datepipe.transform(event.value, "yyyy-MM-dd");
    this.checkGrant(null);
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

  getCleanText(section: Section): string {
    if (section.sectionName === "") {
      return String(section.id);
    }
    return section.sectionName.replace(/[^_0-9a-z]/gi, "");
  }

  getTabularData(elemId: number, data: string) {
    let html = '<table width="100%" border="1"><tr>';
    const tabData = JSON.parse(data);
    html += "<td>&nbsp;</td>";
    for (let c of tabData[0].columns) {
      html += "<td>" + c.name + "</td>";
    }
    html += "</tr>";
    for (let c of tabData) {
      html += "<tr><td>" + c.name + "</td>";
      for (let j of c.columns) {
        html += "<td>" + j.value + "</td>";
        //}
      }
      html += "</tr>";
    }

    html += "</table>";
    return html;
  }

  setTimeout() {
    this.userActivity = setTimeout(() => {
      this.grantToUpdate = JSON.parse(JSON.stringify(this.currentGrant));
    }, 3000);
  }

  @HostListener("window:keyup", ["$event"])
  @HostListener("document:click", ["$event"])
  refreshUserState(): void {
    clearTimeout(this.userActivity);
    this.setTimeout();
  }


  private _filter(value: any): TemplateLibrary[] {
    let filterValue;
    if (typeof value === "string") {
      filterValue = value.toLowerCase();
    } else {
      filterValue = value.name;
    }

    return this.options.filter((option) =>
      option.name.toLowerCase().includes(filterValue)
    );
  }

  displayFn = (doc) => {
    return doc ? doc.name : undefined;
  };

  ////////////////////////
  add(attribute: Attribute, event: MatChipInputEvent): void {
    // Add fruit only when MatAutocomplete is not open
    // To make sure this does not conflict with OptionSelected Event
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value = event.value;

      // Add our fruit
      if (value || "") {
        const index = attribute.docs.findIndex((a) => a.name === value);
        attribute.docs.push(this.options[index]);
      }

      // Reset the input value
      if (input) {
        input.value = "";
      }

      this.myControl.setValue(null);
    }
  }

  remove(attribute: Attribute, fruit: TemplateLibrary) {
    const index = attribute.docs.findIndex((a) => a.id === fruit.id);

    if (index >= 0) {
      attribute.docs.splice(index, 1);
      attribute.fieldValue = JSON.stringify(attribute.docs);
      console.log(this.currentGrant);
    }
  }

  selected(attribute: Attribute, event: MatAutocompleteSelectedEvent): void {
    const fileExistsCheck = this._checkAttachmentExists(
      event.option.value.name
    );
    if (fileExistsCheck.status) {
      alert(
        "Document " +
        event.option.value.name +
        " is already attached under " +
        fileExistsCheck.message
      );
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
      this.currentGrant.id +
      "/field/" +
      attribute.id +
      "/template/" +
      event.option.value.id;

    this.http
      .post<DocInfo>(url, this.currentGrant, httpOptions)
      .subscribe((info: DocInfo) => {
        this.grantData.changeMessage(info.grant, this.appComp.loggedInUser.id);

        this.currentGrant = info.grant;
        this.newField =
          "attriute_" + attribute.id + "_attachment_" + info.attachmentId;
        this.allowScroll = false;
        attribute.fieldValue = JSON.stringify(attribute.docs);
        this.fruitInput.nativeElement.value = "";
        this.fruitCtrl.setValue(null);
        this.noSingleDocAction = false;
      });
  }

  getDocumentName(val: string): any[] {
    let obj;
    if (val !== "") {
      obj = JSON.parse(val);
    }
    return obj;
  }

  handleSelection(attribId, attachmentId) {
    const docElems = this.elem.nativeElement.querySelectorAll('[id^=attriute_' + attribId + '_attachment_]');
    if (docElems.length > 0) {
      let found = false;
      for (let docElem of docElems) {
        if (docElem.checked) {
          found = true;
        }
      }

      if (found) {
        this.noSingleDocAction = true;
        this.downloadAndDeleteAllowed = true;
      } else {
        this.noSingleDocAction = false;
        this.downloadAndDeleteAllowed = false;
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
      this.docManagementService.callGrantDocDownload(selectedAttachments, this.appComp, this.currentGrant);
    }
  }

  downloadSingleDoc(attachmentId: number) {
    const selectedAttachments = new AttachmentDownloadRequest();
    selectedAttachments.attachmentIds = [];
    selectedAttachments.attachmentIds.push(attachmentId);
    this.docManagementService.callGrantDocDownload(selectedAttachments, this.appComp, this.currentGrant);
  }



  deleteSelection(attribId, msg: string) {
    const dReg = this.dialog.open(FieldDialogComponent, {
      data: {
        title: "Are you sure you want to delete the selected document(s)?",
        btnMain: "Delete Document(s)",
        btnSecondary: "Not Now"
      },
      panelClass: "grant-template-class",
    });

    dReg.afterClosed().subscribe((result) => {
      if (result) {
        const elems = this.elem.nativeElement.querySelectorAll(
          '[id^="attriute_' + attribId + '_attachment_"]'
        );
        const selectedAttachments = new AttachmentDownloadRequest();
        if (elems.length > 0) {
          selectedAttachments.attachmentIds = [];
          for (let singleElem of elems) {
            if (singleElem.checked) {
              selectedAttachments.attachmentIds.push(
                singleElem.id.split("_")[3]
              );
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

  deleteSingleDoc(attributeId, attachmentId) {
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
        this.deleteAttachment(attributeId, attachmentId);
      }
    });
  }


  deleteAttachment(attributeId, attachmentId) {
    this.docManagementService.deleteGrantAttachment(attributeId, attachmentId, this.appComp, this.currentGrant)
      .then((grant: Grant) => {
        this.grantData.changeMessage(grant, this.appComp.loggedInUser.id);
        this.currentGrant = grant;
        for (let section of this.currentGrant.grantDetails.sections) {
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

  checkIfSelected(doc): boolean {
    for (let section of this.currentGrant.grantDetails.sections) {
      if (section && section.attributes) {
        for (let attr of section.attributes) {
          if (
            attr.fieldType === "document" &&
            attr.attachments &&
            attr.attachments.length > 0
          ) {
            for (let attach of attr.attachments) {
              if (attach.name === doc.name) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  processSelectedFiles(section, attribute, event) {
    const files = event.target.files;

    const endpoint =
      "/api/user/" +
      this.appComp.loggedInUser.id +
      "/grant/" +
      this.currentGrant.id +
      "/section/" +
      section.id +
      "/attribute/" +
      attribute.id +
      "/upload";
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
        alert(
          "Document " +
          files.item(i).name +
          " is already attached under " +
          fileExistsCheck.message
        );
        event.target.value = "";
        return;
      }
    }

    console.log(">>>>" + JSON.stringify(this.currentGrant));
    formData.append("grantToSave", JSON.stringify(this.currentGrant));

    const httpOptions = {
      headers: new HttpHeaders({
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    this.http
      .post<DocInfo>(endpoint, formData, httpOptions)
      .subscribe((info: DocInfo) => {
        this.grantData.changeMessage(info.grant, this.appComp.loggedInUser.id);
        this.noSingleDocAction = false;
        this.currentGrant = info.grant;
        this.newField =
          "attriute_" + attribute.id + "_attachment_" + info.attachmentId;
      });
  }

  _checkAttachmentExists(filename): any {
    for (let section of this.currentGrant.grantDetails.sections) {
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

  moveColsLeft() {
    $("#tableArea").animate(
      {
        scrollLeft: "+=200px",
      },
      "100",
      "linear"
    );
  }

  moveColsRight() {
    $("#tableArea").animate(
      {
        scrollLeft: "-=200px",
      },
      "100",
      "linear"
    );
  }

  moveTo(section, fromAttr, toAttr) {
    if (toAttr === null) {
      return;
    }
    const from = fromAttr.attributeOrder;
    fromAttr.attributeOrder = toAttr.attributeOrder;
    toAttr.attributeOrder = from;
    section.attributes.sort((a, b) =>
      a.attributeOrder > b.attributeOrder ? 1 : -1
    );
    this.newField = "fieldBlock_" + fromAttr.id;
  }

  editSection(section) {
    const dialogRef = this.dialog.open(SectionEditComponent, {
      data: section,
      panelClass: "grant-template-class",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === undefined || result.trim() === "") {
        return;
      }
      section.sectionName = result;
      this.grantData.changeMessage(
        this.currentGrant,
        this.appComp.loggedInUser.id
      );
      this.router.navigate(["grant/section/" + this.getCleanText(section)]);
      this.sidebar.buildSectionsSideNav(null);
    });
  }

  showHistory(type, obj) {
    this.adminComp.showHistory(type, obj);
  }

  showWorkflowAssigments() {
    this.adminComp.showWorkflowAssigments();
  }

  getFormattedCurrency(amount: string): string {
    if (!amount || amount === "") {
      return inf.format(Number("0"), 2);
    }
    return inf.format(Number(amount), 2);
  }

  showAmountInput(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    const id = evt.target.attributes.id.value.replace("label_", "");
    const inputElem = this.dataColumns.nativeElement.querySelectorAll(
      "#data_" + id
    );
    inputElem[0].style.visibility = "visible";
  }

  showFormattedAmount(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    const id = evt.target.attributes.id.value.replace("data_", "");
    const inputElem = this.dataColumns.nativeElement.querySelectorAll(
      "#label_" + id
    );
    inputElem[0].style.visibility = "visible";
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
    return String("₹ " + inf.format(total, 2));
  }

  getCommittedGrantTotals(idx: number): string {
    let total = 0;
    if (idx !== 1) {
      return "";
    }

    return String("₹ " + inf.format(this.currentGrant.amount, 2));
  }

  checkAbilityToAddDisbursements(): boolean {
    for (let sec of this.currentGrant.grantDetails.sections) {
      if (sec.attributes) {
        for (let attr of sec.attributes) {
          if (attr.fieldType === "disbursement") {
            return true;
          }
        }
      }
    }
    return false;
  }

  manageChange(ev): boolean {
    ev.preventDefault();
    ev.stopPropagation();
    return false;
  }

  showProjectDocuments() {
    this.dialog.open(ProjectDocumentsComponent, {
      data: {
        title: "Project Documents",
        loggedInUser: this.appComp.loggedInUser,
        currentGrant: this.currentGrant,
        acceptedFileTypes: this.appComp.acceptedFileTypes
      },
      panelClass: "wf-assignment-class",
    });
  }

  manageGrant() {
    this.adminComp.manageGrant(null, this.currentGrant.origGrantId);
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
          title: attach.name + '.' + attach.type,
          userId: this.appComp.loggedInUser.id,
          tempFileName: result.url
        },
        panelClass: "wf-assignment-class"
      });
    });
  }
}
