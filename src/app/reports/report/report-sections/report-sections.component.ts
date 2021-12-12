import { DocManagementService } from './../../../doc-management.service';
import { DomSanitizer } from '@angular/platform-browser';
import { DocpreviewService } from './../../../docpreview.service';
import { DocpreviewComponent } from './../../../docpreview/docpreview.component';
import { OrgTag, Grant } from './../../../model/dahsboard';
import { GrantTagsComponent } from './../../../grant-tags/grant-tags.component';
import { MessagingComponent } from 'app/components/messaging/messaging.component';
import { AdminService } from './../../../admin.service';
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import {
  ActivatedRoute,
  Router,
} from "@angular/router";
import { AppComponent } from "../../../app.component";
import {
  Report,
  ReportFieldInfo,
  ReportDocInfo,
  ReportSectionInfo,
} from "../../../model/report";
import {
  Section,
  TableData,
  ColumnData,
  Attribute,
  TemplateLibrary,
  AttachmentDownloadRequest,
  WorkflowStatus,
  CustomDateAdapter,
} from "../../../model/dahsboard";
import { SingleReportDataService } from "../../../single.report.data.service";
import {
  HumanizeDurationLanguage,
  HumanizeDuration,
} from "humanize-duration-ts";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { ToastrService, IndividualConfig } from "ngx-toastr";
import { DatePipe } from "@angular/common";
import { FormControl } from "@angular/forms";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { MatChipInputEvent } from "@angular/material/chips";
import {
  MatAutocompleteSelectedEvent,
  MatAutocomplete,
} from "@angular/material/autocomplete";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { SidebarComponent } from "../../../components/sidebar/sidebar.component";
import { SectionEditComponent } from "../../../components/section-edit/section-edit.component";
import {
  MatDatepickerInputEvent,
  MatDialog,
  MatDatepicker,
  DateAdapter,
  MAT_DATE_FORMATS,
} from "@angular/material";
import { FieldDialogComponent } from "../../../components/field-dialog/field-dialog.component";
import { AdminLayoutComponent } from "../../../layouts/admin-layout/admin-layout.component";
import { saveAs } from "file-saver";
import { Configuration } from "../../../model/app-config";
import { User } from "../../../model/user";
import * as inf from "indian-number-format";
import { AttributeService } from "app/attribute-validation-service";
import { CurrencyService } from "app/currency-service";
import { AmountValidator } from "app/amount-validator";
import { DisbursementDataService } from "app/disbursement.data.service";

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
  selector: "app-report-sections",
  templateUrl: "./report-sections.component.html",
  styleUrls: ["./report-sections.component.scss"],
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
  ],
  styles: [
    `
      ::ng-deep
        .dibursements-class
        .mat-form-field-appearance-legacy
        .mat-form-field-infix {
        padding: 0 !important;
      }
    `,
    `
      ::ng-deep
        .dibursements-class
        .mat-form-field-appearance-legacy
        .mat-form-field-wrapper {
        padding-bottom: 0 !important;
      }
    `,
    `
      ::ng-deep .dibursements-class .mat-form-field-infix {
        border-top: 0 !important;
      }
    `,
  ],
})
export class ReportSectionsComponent implements OnInit {
  @ViewChild("auto") matAutocomplete: MatAutocomplete;
  @ViewChild("fruitInput") fruitInput: ElementRef<HTMLInputElement>;
  @ViewChild("createSectionModal") createSectionModal: ElementRef;
  @ViewChild("dataColumns") dataColumns: ElementRef;
  @ViewChild("otherSourcesAmount") otherSourcesAmount: ElementRef;
  @ViewChild("otherSourcesAmountFormatted")
  otherSourcesAmountFormatted: ElementRef;
  @ViewChild("datePicker") datePicker: MatDatepicker<any>;

  action: string;
  currentReport: Report;
  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService);
  newField: any;
  myControl: FormControl;
  options: TemplateLibrary[];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  fruitCtrl = new FormControl();
  filteredOptions: Observable<TemplateLibrary[]>;
  allowScroll = true;
  reportWorkflowStatuses: WorkflowStatus[];
  tenantUsers: User[];
  selectedDateField: any;
  selectedColumn: ColumnData;
  noSingleDocAction: boolean = false;
  downloadAndDeleteAllowed: boolean = false;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public appComp: AppComponent,
    private singleReportDataService: SingleReportDataService,
    private http: HttpClient,
    private toastr: ToastrService,
    private adminComp: AdminLayoutComponent,
    private sidebar: SidebarComponent,
    private dialog: MatDialog,
    private elem: ElementRef,
    private datepipe: DatePipe,
    private attributeService: AttributeService,
    private currencyService: CurrencyService,
    public amountValidator: AmountValidator,
    private disbursementService: DisbursementDataService,
    private adminService: AdminService,
    private docPreviewService: DocpreviewService,
    private sanitizer: DomSanitizer,
    private docManagementService: DocManagementService,
  ) {
    this.route.params.subscribe((p) => {
      this.action = p["action"];
      this.appComp.action = this.action;
    });

    this.singleReportDataService.currentMessage.subscribe((report) => {
      this.currentReport = report;
      this.setDateDuration();
      console.log(this.currentReport);
    });
    if (!this.currentReport) {
      this.router.navigate(["dashboard"]);
    }
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };
    let url = "/api/app/config/report/" + this.currentReport.id;

    this.http.get(url, httpOptions).subscribe((config: Configuration) => {
      this.reportWorkflowStatuses = config.reportWorkflowStatuses;
      this.appComp.reportWorkflowStatuses = config.reportWorkflowStatuses;
      this.tenantUsers = config.tenantUsers;
      this.appComp.tenantUsers = config.tenantUsers;
      this.appComp.reportTransitions = config.reportTransitions;
    });

    this.adminService.getLibraryDocs(this.appComp.loggedInUser).then((data: TemplateLibrary[]) => {
      this.options = data;

      const docs = this.options.slice();

      this.filteredOptions = this.myControl.valueChanges.pipe(
        startWith(""),
        map((value) => (typeof value === "string" ? value : '')),
        map((name) => (name ? this._filter(name) : docs))
      );
    });
  }

  ngOnInit() {
    this.myControl = new FormControl();



    this.appComp.createNewReportSection.subscribe((val) => {
      if (val) {
        $(".modal-backdrop").remove();

        this.addNewSection();
        this.appComp.createNewReportSection.next(false);
      }
    });
  }

  ngAfterViewChecked() {
    if (this.newField) {
      this.scrollTo(this.newField);
    }
  }

  setDateDuration() {
    if (this.currentReport.startDate && this.currentReport.endDate) {
      var time =
        new Date(this.currentReport.endDate).getTime() -
        new Date(this.currentReport.startDate).getTime();
      time = time + 86400001;
      this.currentReport.duration = this.humanizer.humanize(time, {
        largest: 2,
        units: ["y", "mo"],
        round: true,
      });
    } else {
      this.currentReport.duration = "No end date";
    }
  }

  getCleanText(section: Section): string {
    if (section.sectionName === "") {
      return String(section.id);
    }
    return section.sectionName.replace(/[^_0-9a-z]/gi, "");
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
      "/report/" +
      this.currentReport.id +
      "/section/" +
      Number(sectionId) +
      "/field";

    this.http
      .post<ReportFieldInfo>(url, this.currentReport, httpOptions)
      .subscribe(
        (info: ReportFieldInfo) => {
          this.singleReportDataService.changeMessage(info.report);
          this.currentReport = info.report;
          this.appComp.sectionInModification = false;
          this.newField = "field_" + info.stringAttributeId;
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

  handleTypeChange(ev, attr: Attribute, sec: Section) {
    const isEmpty = this.attributeService.checkIfEmpty(attr);

    if (!isEmpty) {
      const dialogRef = this.dialog.open(FieldDialogComponent, {
        data: {
          title:
            "You will lose all data for " + attr.fieldName + " Are you sure?",
          btnSecondary: "Not Now",
          btnMain: "Change Field Type"
        },
        panelClass: "center-class",
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.processFieldTypeChange(ev, sec, attr);
        } else {
          ev.source.value = attr.fieldType;
          return;
        }
      });
    } else {
      this.processFieldTypeChange(ev, sec, attr);
    }
  }

  processFieldTypeChange(ev: any, sec: Section, attr: Attribute) {
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
        data.name = "";
        data.header = "";
        data.columns = [];

        const colHeaders = [
          "Disbursement Date",
          "Actual Disbursement",
          "Funds from Other Sources",
          "Notes",
        ];
        for (let i = 0; i < 4; i++) {
          const col = new ColumnData();
          col.name = colHeaders[i];
          col.value = "";
          if (i === 0) {
            col.dataType = "date";
          }
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
      "/report/" +
      this.currentReport.id +
      "/section/" +
      sec.id +
      "/field/" +
      attr.id;
    this.http
      .put<ReportFieldInfo>(
        url,
        { report: this.currentReport, attr: attr },
        httpOptions
      )
      .subscribe(
        (info: ReportFieldInfo) => {
          this.singleReportDataService.changeMessage(info.report);
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
              "22 We encountered an error",
              config
            );
          }
        }
      );
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

  add(attribute: Attribute, event: MatChipInputEvent): void {
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value = event.value;

      if (value || "") {
        const index = attribute.docs.findIndex((a) => a.name === value);
        attribute.docs.push(this.options[index]);
      }

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
      "/report/" +
      this.currentReport.id +
      "/field/" +
      attribute.id +
      "/template/" +
      event.option.value.id;

    this.http
      .post<ReportDocInfo>(url, this.currentReport, httpOptions)
      .subscribe((info: ReportDocInfo) => {
        this.singleReportDataService.changeMessage(info.report);

        this.currentReport = info.report;
        this.newField =
          "attriute_" + attribute.id + "_attachment_" + info.attachmentId;
        this.allowScroll = false;
        attribute.fieldValue = JSON.stringify(attribute.docs);
        this.fruitInput.nativeElement.value = "";
        this.fruitCtrl.setValue(null);
        this.noSingleDocAction = false;
      });
  }

  _checkAttachmentExists(filename): any {
    for (let section of this.currentReport.reportDetails.sections) {
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

  checkIfSelected(doc): boolean {
    for (let section of this.currentReport.reportDetails.sections) {
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
      "/report/" +
      this.currentReport.id +
      "/section/" +
      section.id +
      "/attribute/" +
      attribute.id +
      "/upload";
    let formData = new FormData();
    for (let i = 0; i < files.length; i++) {
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

    formData.append("reportToSave", JSON.stringify(this.currentReport));
    const httpOptions = {
      headers: new HttpHeaders({
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
      reportProgress: true,
    };

    this.http
      .post<ReportDocInfo>(endpoint, formData, httpOptions)
      .subscribe((info: ReportDocInfo) => {
        this.noSingleDocAction = false;
        this.singleReportDataService.changeMessage(info.report);
        this.currentReport = info.report;
        this.newField =
          "attriute_" + attribute.id + "_attachment_" + info.attachmentId;
      });
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
      "/report/" +
      this.currentReport.id +
      "/template/" +
      this.currentReport.template.id +
      "/section/" +
      sectionName.val();

    this.http
      .post<ReportSectionInfo>(url, this.currentReport, httpOptions)
      .subscribe(
        (info: ReportSectionInfo) => {
          this.singleReportDataService.changeMessage(info.report);

          sectionName.val("");
          $(createSectionModal).modal("hide");
          this.appComp.sectionAdded = true;
          this.sidebar.buildSectionsSideNav(null);
          this.appComp.sectionInModification = false;
          this.router.navigate([
            "report/section/" +
            this.getCleanText(
              info.report.reportDetails.sections.filter(
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

  editSection(section) {
    const dialogRef = this.dialog.open(SectionEditComponent, {
      data: section,
      panelClass: "center-class",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === undefined || result.trim() === "") {
        return;
      }
      section.sectionName = result;
      this.singleReportDataService.changeMessage(this.currentReport);
      this.router.navigate(["report/section/" + this.getCleanText(section)]);
      this.sidebar.buildSectionsSideNav(null);
    });
  }

  deleteSection(secId: number, title: string) {

    if (this.currentReport.reportDetails.sections.length === 1) {
      this.dialog.open(MessagingComponent, {
        data: "<p>At least one section is required for a report.</p><p><small>Please rename the current section or create an additional section before deleteing this one.</small></p>",
        panelClass: "center-class"
      });
      return;
    }

    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: title, btnMain: "Delete Section", btnSecondary: "Not Now" },
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
          this.appComp.loggedInUser.id +
          "/report/" +
          this.currentReport.id +
          "/template/" +
          this.currentReport.template.id +
          "/section/" +
          secId;

        this.http.put<Report>(url, this.currentReport, httpOptions).subscribe(
          (report: Report) => {
            this.singleReportDataService.changeMessage(report);
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
                "24 We encountered an error",
                config
              );
            }
          }
        );
      }
    });
  }

  showHistory(type, obj) {
    this.adminComp.showHistory(type, obj);
  }

  showWorkflowAssigments() {
    this.adminComp.showWorkflowAssigments();
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

  deleteFieldEntry(
    sectionId: number,
    attributeId: number,
    attributeName: string
  ) {
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: "Are you sure you want to delete " + attributeName, btnMain: 'Delete Field', btnSecondary: 'Not Now' },
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
          this.appComp.loggedInUser.id +
          "/report/" +
          this.currentReport.id +
          "/section/" +
          sectionId +
          "/field/" +
          attributeId;

        this.http.post<Report>(url, this.currentReport, httpOptions).subscribe(
          (report: Report) => {
            this.singleReportDataService.changeMessage(report);
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
                "25 We encountered an error",
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
      this.docManagementService.callReportDocDownload(selectedAttachments, this.appComp, this.currentReport);
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

  deleteAttachment(attributeId, attachmentId) {
    this.docManagementService.deleteReportAttachment(attributeId, attachmentId, this.appComp, this.currentReport)
      .then((report: Report) => {
        this.singleReportDataService.changeMessage(report);
        this.currentReport = report;
        for (let section of this.currentReport.reportDetails.sections) {
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

    row.columns = JSON.parse(JSON.stringify(attr.fieldTableValue[0].columns));
    for (let i of row.columns) {
      i.value = "";
    }

    attr.fieldTableValue.push(row);
  }

  deleteRow(sectionId, attributeId, rowIndex) {
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: "Delete the selected row?", btnMain: "Delete Row", btnSecondary: "Not Now" },
      panelClass: "center-class"
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        for (let section of this.currentReport.reportDetails.sections) {
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
      }
    });
  }

  deleteColumn(sectionId, attributeId, colIndex) {
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: "Delete the selected column?", btnMain: "Delete Column", btnSecondary: "Not Now" },
      panelClass: "center-class"
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        for (let section of this.currentReport.reportDetails.sections) {
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
      }
    });
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

  getDisbursementTotals(idx: number, fieldTableValue: TableData[]): string {
    let total = 0;
    if (fieldTableValue) {
      for (let row of fieldTableValue) {
        let i = 0;
        for (let col of row.columns) {
          if (i === idx) {
            total +=
              col.value !== undefined &&
                col.value !== null &&
                col.value !== "null"
                ? Number(col.value)
                : 0;
          }
          i++;
        }
      }
    }
    for (let row of this.getGrantDisbursementAttribute().fieldTableValue) {
      let i = 0;
      for (let col of row.columns) {
        if (i === idx) {
          total +=
            col.value !== undefined &&
              col.value !== null &&
              col.value !== "null"
              ? Number(col.value)
              : 0;
        }
        i++;
      }
    }
    return this.currencyService.getFormattedAmount(total);
  }

  getFundsFromOtherSourceTotals(): number {
    let total = 0;

    for (let row of this.getGrantDisbursementAttribute().fieldTableValue) {
      let i = 0;
      for (let col of row.columns) {
        if (i === 2) {
          total +=
            col.value !== undefined &&
              col.value !== null &&
              col.value !== "null"
              ? Number(col.value)
              : 0;
        }
        i++;
      }
    }
    return total;
  }

  deleteDisbursementRow(sectionId, attributeId, rowIndex) {
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: "Delete selected disbursement row?", btnMain: "Delete Disbursement", btnSecondary: "Not Now" },
      panelClass: "center-class",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        for (let section of this.currentReport.reportDetails.sections) {
          if (section.id === sectionId) {
            for (let attrib of section.attributes) {
              if (attrib.id == attributeId) {
                console.log(attrib.fieldTableValue);
                const tableData = attrib.fieldTableValue;

                this.disbursementService
                  .removeDisbursementRowByGrantee(
                    tableData[rowIndex].actualDisbursementId
                  )
                  .then(() => {
                    tableData.splice(rowIndex, 1);
                    const starCounter = tableData ? tableData.length : 0;
                    for (let i = 0; i < starCounter; i++) {
                      tableData[i].name = String(i + 1);
                    }
                  });
              }
            }
          }
        }
      } else {
        dialogRef.close();
      }
    });
  }

  addDisbursementRow(attr: Attribute) {
    this.disbursementService
      .addNewDisbursementRowByGrantee(this.currentReport)
      .then((td) => {
        const row = td;
        row.name = String(
          Number(
            attr.fieldTableValue && attr.fieldTableValue.length > 0
              ? attr.fieldTableValue[attr.fieldTableValue.length - 1].name
              : "0"
          ) + 1
        );

        if (
          attr.fieldTableValue === undefined ||
          attr.fieldTableValue === null
        ) {
          attr.fieldTableValue = [];
        }
        attr.fieldTableValue.push(row);
      });
  }

  getCommittedGrantTotals(idx: number): string {
    let total = 0;
    if (idx !== 1) {
      return "";
    }

    return String("₹ " + inf.format(this.currentReport.grant.amount, 2));
  }

  getGrantDisbursementAttribute(): Attribute {
    for (let section of this.currentReport.grant.grantDetails.sections) {
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

  checkAbilityToAddDisbursements(): boolean {
    for (let sec of this.currentReport.reportDetails.sections) {
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

  openDate(column: ColumnData, ev: MouseEvent) {
    const stDateElem = this.datePicker;
    this.selectedDateField = ev;
    this.selectedColumn = column;
    if (!stDateElem.opened) {
      this.appComp.sectionInModification = true;
      stDateElem.open();
    } else {
      this.appComp.sectionInModification = false;
      stDateElem.close();
    }
  }

  setDate(ev: MatDatepickerInputEvent<any>) {
    const trgt = ev.target;
    this.selectedDateField.target.value = this.datepipe.transform(
      trgt.value,
      "dd-MMM-yyyy"
    );
    this.selectedColumn.value = this.selectedDateField.target.value;
  }

  manageGrant() {
    this.adminComp.manageGrant(null, this.currentReport.grant.id);
  }

  manageTypeChange(attr: string) {
    console.log(attr);
  }

  _checkIfFieldHasData(attr: Attribute): boolean {
    let hasData = false;
    if (attr.fieldType === "multiline" && attr.fieldName.trim() !== "" || attr.fieldValue.trim() !== "") {
      hasData = true;
    }
    return hasData;
  }

  clearDate(column) {
    column.value = "";
  }

  dateFilter = (d: Date | null): boolean => {
    const today = new Date();
    const day = d || today;
    return (
      day <= today && day >= new Date(this.currentReport.grant.startDate)
    );
  };

  showGrantTags() {
    this.adminService.getOrgTags(this.appComp.loggedInUser).then((tags: OrgTag[]) => {

      this.dialog.open(GrantTagsComponent, {
        data: { orgTags: tags, grantTags: this.currentReport.grant.tags, grant: this.currentReport.grant, appComp: this.appComp, type: 'report' },
        panelClass: "grant-template-class"
      });

    });

  }

  isExternalGrant(grant: Grant): boolean {
    if (this.appComp.loggedInUser.organization.organizationType === 'GRANTEE') {
      return true;
    }

    const grantType = this.appComp.grantTypes.filter(gt => gt.id === grant.grantTypeId)[0];
    if (!grantType.internal) {
      return true;
    } else {
      return false;
    }
  }

  showUnapprovedIndicator(attr: Attribute) {

    if (attr.fieldTableValue) {
      let indicator: string[] = [];
      for (let row of attr.fieldTableValue) {
        if (row.enteredByGrantee && row.status && row.reportId === this.currentReport.id) {
          if (indicator.findIndex(a => a === '* Indicates unapproved project funds, will be considered as approved project funds on approval of this report.') < 0) {
            indicator.push("* Indicates unapproved project funds, will be considered as approved project funds on approval of this report.");
          }
        } else if (row.enteredByGrantee && row.status && row.reportId !== this.currentReport.id) {
          if (indicator.findIndex(a => a === '** Indicates unapproved project funds from another report, will be considered as approved project funds on approval of that report. Will not be considered as project funds on approval of this report.') < 0) {
            indicator.push("** Indicates unapproved project funds from another report, will be considered as approved project funds on approval of that report. Will not be considered as project funds on approval of this report.");
          }
        }
      }
      return indicator.join("<br>");
    }
    return null;
  }

  getDocumentName(val: string): any[] {
    let obj;
    if (val !== undefined && val !== "") {
      obj = JSON.parse(val);
    }
    return obj;
  }

  getTabularData(elemId: number, data: string) {
    let html = '<table width="100%" border="1"><tr>';
    const tabData = JSON.parse(data);
    html += "<td>&nbsp;</td>";
    for (let c of tabData[0].columns) {
      html += "<td>" + c.name + "</td>";
    }
    html += "</tr>";
    for (let i of tabData) {
      html += "<tr><td>" + i.name + "</td>";
      for (let j of i.columns) {
        html += "<td>" + j.value + "</td>";
      }
      html += "</tr>";
    }

    html += "</table>";
    return html;
  }

  previewDocument(_for, attach) {
    this.docPreviewService.previewDoc(_for, this.appComp.loggedInUser.id, this.currentReport.id, attach).then((result: any) => {
      let docType = result.url.substring(result.url.lastIndexOf(".") + 1);
      let docUrl;
      if (docType === 'doc' || docType === 'docx' || docType === 'xls' || docType === 'xlsx' || docType === 'ppt' || docType === 'pptx') {
        docUrl = this.sanitizer.bypassSecurityTrustResourceUrl("https://view.officeapps.live.com/op/embed.aspx?src=" + location.origin + "/api/public/doc/" + result.url);
      } else if (docType === 'pdf' || docType === 'txt') {
        docUrl = this.sanitizer.bypassSecurityTrustResourceUrl(location.origin + "/api/public/doc/" + result.url);
      }
      this.dialog.open(DocpreviewComponent, {
        data: {
          url: docUrl,
          type: docType
        },
        panelClass: "wf-assignment-class"
      });
    });
  }

  downloadSingleDoc(attachmentId: number) {
    const selectedAttachments = new AttachmentDownloadRequest();
    selectedAttachments.attachmentIds = [];
    selectedAttachments.attachmentIds.push(attachmentId);
    this.docManagementService.callReportDocDownload(selectedAttachments, this.appComp, this.currentReport);
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
}
