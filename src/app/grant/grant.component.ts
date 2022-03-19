import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  HostListener,
} from "@angular/core";
import { GrantDataService } from "../grant.data.service";
import { DataService } from "../data.service";
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
  Organization,
  Submission,
  SubmissionStatus,
  Template,
  WorkflowStatus,
  GrantTemplate,
} from "../model/dahsboard";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { SubmissionDataService } from "../submission.data.service";
import { AppComponent } from "../app.component";
import { FormControl } from "@angular/forms";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { ToastrService } from "ngx-toastr";
import { Colors } from "../model/app-config";
import * as moment from "moment";
import {
  MatInputModule,
  MatDatepickerModule,
  MatDialog,
  MatBottomSheet,
  MatDatepickerInputEvent,
} from "@angular/material";
import { FieldDialogComponent } from "../components/field-dialog/field-dialog.component";
import { BottomsheetComponent } from "../components/bottomsheet/bottomsheet.component";
import { DatePipe } from "@angular/common";
import { BottomsheetAttachmentsComponent } from "../components/bottomsheetAttachments/bottomsheetAttachments.component";
import { BottomsheetNotesComponent } from "../components/bottomsheetNotes/bottomsheetNotes.component";
import { interval, Subject } from "rxjs";
import { Report, ReportTemplate } from "../model/report";
import { ReportDataService } from "../report.data.service";
import { AddnlreportsDialogComponent } from "../components/addnlreports-dialog/addnlreports-dialog.component";
import { AdminLayoutComponent } from "../layouts/admin-layout/admin-layout.component";

declare var $: any;

@Component({
  selector: "app-grant",
  templateUrl: "./grant.component.html",
  styleUrls: ["./grant.component.scss"],
})
export class GrantComponent
  implements OnInit, AfterViewInit, AfterContentChecked {
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
  currentGrantId = 0;
  userActivity;
  userInactive: Subject<any> = new Subject();
  approvedReports: Report[];
  reports: Report[];

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

  constructor(
    private grantData: GrantDataService,
    private dataService: DataService,
    private submissionData: SubmissionDataService,
    private route: ActivatedRoute,
    private router: Router,
    private submissionDataService: SubmissionDataService,
    public appComp: AppComponent,
    private http: HttpClient,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private _bottomSheet: MatBottomSheet,
    private elem: ElementRef,
    private datepipe: DatePipe,
    public colors: Colors,
    private reportService: ReportDataService,
    public adminComp: AdminLayoutComponent
  ) {
    this.colors = new Colors();
  }

  ngOnInit() {
    this.setTimeout();
    this.userInactive.subscribe(() =>
      console.log("user has been inactive for 3s")
    );

    /*interval(3000).subscribe(t => {

            console.log('Came here');
            if (this.editMode) {
                this.appComp.autosave = true;
                this.grantToUpdate = JSON.parse(JSON.stringify(this.currentGrant));
                this.saveGrant();
            } else {
                this.appComp.autosave = false;
            }
        });*/

    this.grantData.currentMessage.subscribe(
      (grant) => (this.currentGrant = grant)
    );
    this.originalGrant = JSON.parse(JSON.stringify(this.currentGrant));
    this.submissionData.currentMessage.subscribe(
      (submission) => (this.currentSubmission = submission)
    );

    this.checkGrantPermissions();
    if (this.currentGrant.submissions) {
      this.checkCurrentSubmission();
    }

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
  }

  public checkGrantPermissions() {
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
    submissios: Submission[],
    kpiId: number,
    func: string,
    title: string
  ) {
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: title },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        switch (func) {
          case "field":
            this.deleteFieldEntry(sectionId, attributeId, "");
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

  deleteFieldEntry(sectionId: number, attributeId: number, msg: string) {
    const dg = this.dialog.open(FieldDialogComponent, {
      data: { title: msg, btnMain: "Delete Field", btnSecondary: "Not Now" },
      panelClass: "center-class"
    });

    dg.afterClosed().subscribe(result => {
      if (result) {
        for (const section of this.currentGrant.grantDetails.sections) {
          if (section.id === sectionId) {
            const index = section.attributes.findIndex(
              (attr) => attr.id === attributeId
            );
            section.attributes.splice(index, 1);
            this.checkGrant();
          }
        }
      } else {
        dg.close();
      }
    });
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

  saveGrant(grantToSave: Grant) {
    if (!grantToSave.canManage) {
      return;
    }

    this.appComp.autosaveDisplay = "Saving changes...     ";
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

    const url = "/api/user/" + this.appComp.loggedInUser.id + "/grant/";

    this.http.put(url, grantToSave, httpOptions).subscribe(
      (grant: Grant) => {
        this.originalGrant = JSON.parse(JSON.stringify(grant));
        this.grantData.changeMessage(grant, this.appComp.loggedInUser.id);
        this.dataService.changeMessage(grant.id);
        //this.currentGrant = grant;
        this._setEditMode(false);
        this.currentSubmission = null;
        this.checkGrantPermissions();
        if (grant.submissions && grant.submissions.length > 0) {
          this.checkCurrentSubmission();
        }
        this.appComp.autosave = false;
        this.appComp.autosaveDisplay =
          "Last saved @ " +
          this.datepipe.transform(new Date(), "hh:mm:ss a") +
          "     ";
      },
      (error) => {
        const errorMsg = error as HttpErrorResponse;
        console.log(error);
        this.toastr.error(errorMsg.error.message, errorMsg.error.messageTitle, {
          enableHtml: true,
        });
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
    for (let elem of containerFormLements) {
      if (elem.value.trim() === "") {
        this.erroredElement = elem;
        switch ($(this.erroredElement).attr("placeholder")) {
          case "Field Value":
        }
        return true;
      }
    }
    return false;
  }

  saveSubmissionAndMove(toStateId: number) {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    for (const sub of this.currentGrant.submissions) {
      if (sub.id === this.currentSubmission.id) {
        const subStatus = new SubmissionStatus();
        subStatus.id = toStateId;
        sub.submissionStatus = subStatus;
      }
    }

    this.saveGrant(this.currentGrant);

    /*let url = '/api/user/' + this.appComp.loggedInUser.id + '/grant/'
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
            });*/
  }

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
        newAttr.id = 0 - window.crypto.getRandomValues(new Uint32Array(10))[0];
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
        attribute.id = 0 - window.crypto.getRandomValues(new Uint32Array(10))[0];
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
    const currentSections = this.currentGrant.grantDetails.sections;
    const newSection = new Section();
    newSection.attributes = [];
    newSection.id = 0 - window.crypto.getRandomValues(new Uint32Array(10))[0];
    newSection.sectionName = sectionName.val();
    newSection.deletable = true;

    currentSections.push(newSection);

    this.grantData.changeMessage(
      this.currentGrant,
      this.appComp.loggedInUser.id
    );

    sectionName.val("");
    $("#section_" + newSection.id).css("display", "block");
    this._setEditMode(true);
    $(createSectionModal).modal("hide");
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
    newSection.id = 0 - window.crypto.getRandomValues(new Uint32Array(10))[0];
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

  addNewKpi() {
    const kpiModal = this.createKpiModal.nativeElement;
    $(kpiModal).modal("show");
  }

  saveKpi() {
    const kpiModal = this.createKpiModal.nativeElement;
    //const kpiTypeElem = $(this.kpiTypeElem.nativeElement);
    const kpiDesc = $(this.kpiDescriptionelem.nativeElement);
    const id = 0 - window.crypto.getRandomValues(new Uint32Array(10))[0];

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
        quantKpi.id = 0 - window.crypto.getRandomValues(new Uint32Array(10))[0];
        quantKpi.grantKpi = grantKpi;

        sub.quantitiaveKpisubmissions.push(quantKpi);
      } else if (this.currentKPIType === "Qualitative") {
        const qualKpi = new QualitativeKpiSubmission();
        qualKpi.goal = "";
        qualKpi.toReport = true;
        qualKpi.id = 0 - window.crypto.getRandomValues(new Uint32Array(10))[0];
        qualKpi.grantKpi = grantKpi;

        sub.qualitativeKpiSubmissions.push(qualKpi);
      } else if (this.currentKPIType === "Document") {
        const docKpi = new DocumentKpiSubmission();
        docKpi.goal = "";
        docKpi.toReport = true;
        docKpi.id = 0 - window.crypto.getRandomValues(new Uint32Array(10))[0];
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
    console.log();
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
    this.http
      .post(url, this.currentGrant, httpOptions)
      .subscribe((grant: Grant) => {
        /*this.loading = false;
            this.grantDataService.changeMessage(grant);
            this.router.navigate(['grant']);*/

        url =
          "/api/user/" +
          this.appComp.loggedInUser.id +
          "/grant/" +
          this.currentGrant.id;
        this.http.get(url, httpOptions).subscribe((updatedGrant: Grant) => {
          this.grantData.changeMessage(
            updatedGrant,
            this.appComp.loggedInUser.id
          );
          this.currentGrant = updatedGrant;
          this.checkGrantPermissions();
          // this.router.navigate(['grant']);
        });
      });
  }

  postionFirstColumn(event: Event) {
    const dist = event.srcElement.scrollLeft;
    $(".first-column").css("left", dist + "px");
  }

  private _setEditMode(state: boolean) {
    this.editMode = state;
    /*if (state) {
            $(this.actionBlock.nativeElement).prop('disabled',true);
        } else {
            $(this.actionBlock.nativeElement).prop('disabled',false);
        }*/
  }

  scrollHeaderContent(event: Event) {
    const dist = event.srcElement.scrollLeft;
    $(".kpi-block").scrollLeft(dist);
    /*const kpisBlocks = this.elem.nativeElement.querySelectorAll('.kpi-block');
        for (const singleBlock of kpisBlocks) {
          singleBlock.scrollLeft = dist;
        }
        $('.kpi-block').css('left', (0 - dist) + 'px');*/
  }

  scrollChildContent(event: Event) {
    const dist = event.srcElement.scrollLeft;
    const submissionBlock = this.elem.nativeElement.querySelector(
      ".submissions-block"
    );
    submissionBlock.scrollLeft = dist;
    const kpisBlocks = this.elem.nativeElement.querySelectorAll(".kpi-block");
    for (const singleBlock of kpisBlocks) {
      singleBlock.scrollLeft = dist;
    }
    $(".kpi-block").css("left", 0 - dist + "px");
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
    console.log(this.currentGrant);
  }

  selectGrantSchedule() {
    const scheduleModal = this.selectScheduleModal.nativeElement;
    $(scheduleModal).modal("show");
  }

  createGrant(template: GrantTemplate, typeId) {
    this.appComp.selectedTemplate = template;
    this.appComp.currentView = "grant";

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
      "/grant/create/" +
      template.id + "/" + typeId;

    this.http.get<Grant>(url, httpOptions).subscribe((grant: Grant) => {
      if (
        grant.workflowAssignments.filter(
          (wf) =>
            wf.stateId === grant.grantStatus.id &&
            wf.assignments === this.appComp.loggedInUser.id
        ).length > 0 &&
        this.appComp.loggedInUser.organization.organizationType !== "GRANTEE" &&
        grant.grantStatus.internalStatus !== "ACTIVE" &&
        grant.grantStatus.internalStatus !== "CLOSED"
      ) {
        grant.canManage = true;
      } else {
        grant.canManage = false;
      }

      grant.templateId = template.id;
      const savedgrant = grant;
      this.appComp.originalGrant = JSON.parse(JSON.stringify(grant));
      this.currentGrant = grant;
      this.grantData.changeMessage(grant, this.appComp.loggedInUser.id);
      this.appComp.currentView = "grant";

      this.router.navigate(["grant/basic-details"]);
    });
  }

  copyGrant(grantId: number, grantTypeId: number) {
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: {
        title: "Important!",
        content:
          '<p class="m-0"><strong>You are about to create a new grant (&lsquo;Draft&rsquo; state) with most of the contents from the original grant copied over.&nbsp; Please make sure that you review the new Grant for correctness and accuracy.&nbsp;</strong></p> <p class="m-0"><u>Grant Header</u></p> <p class="m-0">A temporary Grant Name with reference to the original Grant Name will appear in the new Grant Header.&nbsp; This will need to be replaced with a new relevant Grant Name.&nbsp; All other information in the Grant Header will be cleared and will need to be added for the new Grant.</p> <p class="m-0"><u>Grant Details</u></p> <p class="m-0">All content in the Grant Details except the Disbursement data will be copied over from the original Grant. &nbsp;Please do check to ensure that these are relevant to the new Grant.</p> <p class="m-0"><u>Workflow Assignments</u></p> <p class="m-0">All assignments from the original Grant will be cleared for this new Grant. The new Grant will be placed in a &lsquo;Draft&rsquo; stage with you as the owner of this state.&nbsp; You will need to add appropriate assignments to progress this Grant through the organizational workflow.</p> <p class="m-0"><u>Project Documents, Notes and History</u></p> <p class="m-0">All project related documents, notes and history from the original Grant will be cleared for this new Grant.</p>',
        btnMain: "Continue",
        btnSecondary: "Cancel",
      },
      panelClass: "grant-notes-class",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.appComp.currentView = "grant";

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
          grantId +
          "/copy/" + grantTypeId;

        this.http.get<Grant>(url, httpOptions).subscribe((grant: Grant) => {
          if (
            grant.workflowAssignments.filter(
              (wf) =>
                wf.stateId === grant.grantStatus.id &&
                wf.assignments === this.appComp.loggedInUser.id
            ).length > 0 &&
            this.appComp.loggedInUser.organization.organizationType !==
            "GRANTEE" &&
            grant.grantStatus.internalStatus !== "ACTIVE" &&
            grant.grantStatus.internalStatus !== "CLOSED"
          ) {
            grant.canManage = true;
          } else {
            grant.canManage = false;
          }

          //grant.templateId = template.id;
          const savedgrant = grant;
          this.appComp.originalGrant = JSON.parse(JSON.stringify(grant));
          this.currentGrant = grant;
          this.grantData.changeMessage(grant, this.appComp.loggedInUser.id);
          this.appComp.currentView = "grant";
          this.appComp.subMenu = { name: "In-progress Grants", action: "dg" };

          this.router.navigate(["grant/basic-details"]);
        });
      } else {
        dialogRef.close();
      }
    });
  }

  amendGrant(grantId: number) {
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: {
        title: "Important!",
        content:
          '<p><strong>You are about to amend an active Grant. This action will create a new amendment-in-progress Grant ("Draft" state) with all the contents from the original Grant copied over with the exception of workflow assignments, notes and audit history.</p><p>The amendment-in-progress Grant will be placed in a "Draft" stage with you as the owner of this state.  You will need to add appropriate assignments to progress this Grant through the current organizational workflow.  On reaching "Active" state, the original Grant will be marked as "Closed" and while you and others in your organization can view it, it will be unavailable for future disbursements or project progress reports against it.  All pending and new disbursements and project progress reports will need to be recorded against the newly amended grant in its “Active” state.</p><p>All reports and disbursements that were in progress when the “Closed” grant was amended will be moved over and placed under the newly amended Grant in its “Active” state. Project documents and previously approved reports and disbursements recorded with the “Closed” Grant will now also show up against the newly amended Grant in its “Active” state.</strong></p>',
        btnMain: "Amend Grant",
        btnSecondary: "Not Now",
      },
      panelClass: "grant-notes-class",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.appComp.currentView = "grant";

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
          grantId +
          "/amend";

        this.http.get<Grant>(url, httpOptions).subscribe((grant: Grant) => {
          if (
            grant.workflowAssignments.filter(
              (wf) =>
                wf.stateId === grant.grantStatus.id &&
                wf.assignments === this.appComp.loggedInUser.id
            ).length > 0 &&
            this.appComp.loggedInUser.organization.organizationType !==
            "GRANTEE" &&
            grant.grantStatus.internalStatus !== "ACTIVE" &&
            grant.grantStatus.internalStatus !== "CLOSED"
          ) {
            grant.canManage = true;
          } else {
            grant.canManage = false;
          }

          //grant.templateId = template.id;
          const savedgrant = grant;
          this.appComp.originalGrant = JSON.parse(JSON.stringify(grant));
          this.currentGrant = grant;
          this.grantData.changeMessage(grant, this.appComp.loggedInUser.id);
          this.appComp.currentView = "grant";
          this.appComp.subMenu = { name: "In-progress Grants", action: "dg" };

          this.router.navigate(["grant/basic-details"]);
        });
      } else {
        dialogRef.close();
      }
    });
  }

  private _adjustHeights() {
    /*for (const elem of $('[data-id]')) {
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
    if (
      JSON.stringify(this.currentGrant) === JSON.stringify(this.originalGrant)
    ) {
      this._setEditMode(false);
    } else {
      this._setEditMode(true);
    }
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
      console.log(this.currentGrant);
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
      console.log(this.currentGrant);
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

  setNewOrg(event: Event) {
    console.log(event);
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

  setTimeout() {
    this.userActivity = setTimeout(() => {
      this.userInactive.next(undefined);

      this.grantToUpdate = JSON.parse(JSON.stringify(this.currentGrant));
      if (this.currentGrant !== null) {
        this.checkGrantPermissions();
      }
      if (this.currentGrant !== null && this.currentGrant.name !== undefined) {
        this.grantToUpdate.id = this.currentGrantId;
        this.saveGrant(this.grantToUpdate);
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

  public showActiveReports(grant: Grant, reports: Report[]) {
    let dialogRef1 = this.dialog.open(AddnlreportsDialogComponent, {
      data: {
        data: {
          report: null,
          grant: grant,
          grants: [grant],
          futureReports: reports,
          single: true
        }, appComp: this.appComp
      },
      panelClass: "addnl-report-class",
    });

    dialogRef1.afterClosed().subscribe((result) => {
      if (result && result.result) {
        this.adminComp.manageReport(null, result.selectedReport.id);
      } else {
        //this.otherReportsClicked = false;
      }
    });
  }
}
