import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { COMMA } from '@angular/cdk/keycodes';
import { ENTER } from '@angular/cdk/keycodes';
import { AdminService } from './../../admin.service';
import { FormControl } from '@angular/forms';
import { Grant, TemplateLibrary, AttachmentDownloadRequest } from './../../model/dahsboard';
import { FieldDialogComponent } from './../../components/field-dialog/field-dialog.component';
import { MessagingComponent } from './../../components/messaging/messaging.component';
import { SectionEditComponent } from './../../components/section-edit/section-edit.component';
import { ClosureFieldInfo, ClosureDocInfo, ClosureSectionInfo } from './../../model/closures';
import { AmountValidator } from './../../amount-validator';
import { DisbursementDataService } from './../../disbursement.data.service';
import { CurrencyService } from './../../currency-service';
import { AttributeService } from './../../attribute-validation-service';
import { AdminLayoutComponent } from 'app/layouts/admin-layout/admin-layout.component';
import { ActivatedRoute, Router } from '@angular/router';
import { APP_DATE_FORMATS } from './../../reports/report/report-sections/report-sections.component';

import { DatePipe } from '@angular/common';
import { MatDatepicker, MatDialog, DateAdapter, MAT_DATE_FORMATS, MatDatepickerInputEvent, MatAutocompleteSelectedEvent } from '@angular/material';
import { ToastrService, IndividualConfig } from 'ngx-toastr';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

import { AppComponent } from 'app/app.component';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { SidebarComponent } from 'app/components/sidebar/sidebar.component';
import { Attribute, ColumnData, CustomDateAdapter, Section, TableData } from 'app/model/dahsboard';
import { GrantClosure } from 'app/model/closures';
import { ClosureDataService } from 'app/closure.data.service';
import { saveAs } from "file-saver";

@Component({
  selector: 'app-closure-sections',
  templateUrl: './closure-sections.component.html',
  styleUrls: ['./closure-sections.component.scss'],
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
export class ClosureSectionsComponent implements OnInit, AfterViewInit {

  @ViewChild("createSectionModal") createSectionModal: ElementRef;
  @ViewChild("datePicker") datePicker: MatDatepicker<any>;
  @ViewChild("dataColumns") dataColumns: ElementRef;
  @ViewChild("auto") matAutocomplete: MatAutocomplete;
  @ViewChild("fruitInput") fruitInput: ElementRef<HTMLInputElement>;

  currentClosure: GrantClosure;
  action: string;
  newField: any;
  selectedDateField: any;
  selectedColumn: ColumnData;
  myControl: FormControl;
  options: TemplateLibrary[];
  filteredOptions: Observable<TemplateLibrary[]>;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  fruitCtrl = new FormControl();
  allowScroll = true;


  constructor(public appComp: AppComponent,
    private closureService: ClosureDataService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private router: Router,
    private sidebar: SidebarComponent,
    private adminComp: AdminLayoutComponent,
    private attributeService: AttributeService,
    private currencyService: CurrencyService,
    private disbursementService: DisbursementDataService,
    private datepipe: DatePipe,
    public amountValidator: AmountValidator,
    private adminService: AdminService,
    private elem: ElementRef,) {
    this.route.params.subscribe((p) => {
      this.action = p["action"];
      this.appComp.action = this.action;
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
    this.appComp.createNewClosureSection.subscribe((val) => {
      if (val) {
        $(".modal-backdrop").remove();

        this.addNewSection();
        this.appComp.createNewClosureSection.next(false);
      }
    });

    this.closureService.currentMessage.subscribe((closure) => {
      this.currentClosure = closure;

      console.log(this.currentClosure);
    });
  }

  ngAfterViewInit() {
    if (this.newField) {
      this.scrollTo(this.newField);
    }
  }

  scrollTo(uniqueID) {
    const elmnt = document.getElementById(uniqueID); // let if use typescript

    if (elmnt) {
      const elementRect = elmnt.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const middle = absoluteElementTop - window.innerHeight / 2;
      window.scrollTo(0, middle);
      elmnt.focus();
    }
    this.newField = null;
  }

  addNewSection() {
    this.appComp.sectionInModification = true;
    const createSectionModal = this.createSectionModal.nativeElement;
    const titleElem = $(createSectionModal).find("#createSectionLabel");
    $(titleElem).html("Add new section");
    $(createSectionModal).modal("show");
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
      "/closure/" +
      this.currentClosure.id +
      "/section/" +
      Number(sectionId) +
      "/field";

    this.http
      .post<ClosureFieldInfo>(url, this.currentClosure, httpOptions)
      .subscribe(
        (info: ClosureFieldInfo) => {
          this.closureService.changeMessage(info.closure, this.appComp.loggedInUser.id);
          this.currentClosure = info.closure;
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
      this.closureService.changeMessage(this.currentClosure, this.appComp.loggedInUser.id);
      this.router.navigate(["grant-closure/section/" + this.getCleanText(section)]);
      this.sidebar.buildSectionsSideNav(null);
    });
  }

  deleteSection(secId: number, title: string) {

    if (this.currentClosure.closureDetails.sections.length === 1) {
      const dg = this.dialog.open(MessagingComponent, {
        data: "<p>At least one section is required for a closure.</p><p><small>Please rename the current section or create an additional section before deleteing this one.</small></p>",
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
          "/closure/" +
          this.currentClosure.id +
          "/template/" +
          this.currentClosure.template.id +
          "/section/" +
          secId;

        this.http.put<GrantClosure>(url, this.currentClosure, httpOptions).subscribe(
          (closure: GrantClosure) => {
            this.closureService.changeMessage(closure, this.appComp.loggedInUser.id);
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

  showWorkflowAssigments() {
    this.adminComp.showWorkflowAssigments();
  }

  showHistory(type, obj) {
    this.adminComp.showHistory(type, obj);
  }

  manageGrant() {
    this.adminComp.manageGrant(null, this.currentClosure.grant.id);
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
      "/closure/" +
      this.currentClosure.id +
      "/section/" +
      sec.id +
      "/field/" +
      attr.id;
    this.http
      .put<ClosureFieldInfo>(
        url,
        { closure: this.currentClosure, attr: attr },
        httpOptions
      )
      .subscribe(
        (info: ClosureFieldInfo) => {
          this.closureService.changeMessage(info.closure, this.appComp.loggedInUser.id);
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

  checkAbilityToAddDisbursements(): boolean {
    for (let sec of this.currentClosure.closureDetails.sections) {
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
    for (let i = 0; i < row.columns.length; i++) {
      row.columns[i].value = "";
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
        for (let section of this.currentClosure.closureDetails.sections) {
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
        for (let section of this.currentClosure.closureDetails.sections) {
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

  moveColsLeft() {
    $("#tableArea").animate(
      {
        scrollLeft: "+=200px",
      },
      "100",
      "linear",
      function () { }
    );
  }

  moveColsRight() {
    $("#tableArea").animate(
      {
        scrollLeft: "-=200px",
      },
      "100",
      "linear",
      function () { }
    );
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

  deleteDisbursementRow(sectionId, attributeId, rowIndex) {
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: "Delete selected disbursement row?", btnMain: "Delete Disbursement", btnSecondary: "Not Now" },
      panelClass: "center-class",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        for (let section of this.currentClosure.closureDetails.sections) {
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

  dateFilter = (d: Date | null): boolean => {
    const today = new Date();
    const day = d || today;
    return (
      day <= today && day >= new Date(this.currentClosure.grant.startDate)
    );
  };

  showFormattedAmount(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    const id = evt.target.attributes.id.value.replace("data_", "");
    const inputElem = this.dataColumns.nativeElement.querySelectorAll(
      "#label_" + id
    );
    inputElem[0].style.visibility = "visible";
  }

  clearDate(column) {
    column.value = "";
  }

  showAmountInput(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    const id = evt.target.attributes.id.value.replace("label_", "");
    const inputElem = this.dataColumns.nativeElement.querySelectorAll(
      "#data_" + id
    );
    inputElem[0].style.visibility = "visible";
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

  private _filter(value: any): TemplateLibrary[] {
    let filterValue;
    if (typeof value === "string") {
      filterValue = value.toLowerCase();
    } else {
      filterValue = value.name;
    }

    const selectedDoc = this.options.filter((option) =>
      option.name.toLowerCase().includes(filterValue)
    );
    return selectedDoc;
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
      "/closure/" +
      this.currentClosure.id +
      "/field/" +
      attribute.id +
      "/template/" +
      event.option.value.id;

    this.http
      .post<ClosureDocInfo>(url, this.currentClosure, httpOptions)
      .subscribe((info: ClosureDocInfo) => {
        this.closureService.changeMessage(info.closure, this.appComp.loggedInUser.id);

        this.currentClosure = info.closure;
        this.newField =
          "attriute_" + attribute.id + "_attachment_" + info.attachmentId;
        this.allowScroll = false;
        attribute.fieldValue = JSON.stringify(attribute.docs);
        this.fruitInput.nativeElement.value = "";
        this.fruitCtrl.setValue(null);
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

  checkIfSelected(doc): boolean {
    for (let section of this.currentClosure.closureDetails.sections) {
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
      "/closure/" +
      this.currentClosure.id +
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

    formData.append("closureToSave", JSON.stringify(this.currentClosure));
    const httpOptions = {
      headers: new HttpHeaders({
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
      reportProgress: true,
    };

    this.http
      .post<ClosureDocInfo>(endpoint, formData, httpOptions)
      .subscribe((info: ClosureDocInfo) => {
        this.closureService.changeMessage(info.closure, this.appComp.loggedInUser.id);
        this.currentClosure = info.closure;
        this.newField =
          "attriute_" + attribute.id + "_attachment_" + info.attachmentId;
      });
  }

  handleSelection(attribId, attachmentId) {
    const elems = this.elem.nativeElement.querySelectorAll(
      '[id^="attriute_' + attribId + '_attachment_"]'
    );
    if (elems.length > 0) {
      for (let singleElem of elems) {
        if (singleElem.checked) {
          this.elem.nativeElement.querySelector(
            '[id^="attachments_download_' + attribId + '"]'
          ).disabled = false;
          this.elem.nativeElement.querySelector(
            '[id^="attachments_delete_' + attribId + '"]'
          ).disabled = false;
          return;
        }
        this.elem.nativeElement.querySelector(
          '[id^="attachments_download_' + attribId + '"]'
        ).disabled = true;
        this.elem.nativeElement.querySelector(
          '[id^="attachments_delete_' + attribId + '"]'
        ).disabled = true;
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
        "/closure/" +
        this.currentClosure.id +
        "/attachments";
      this.http
        .post(url, selectedAttachments, httpOptions)
        .subscribe((data) => {
          saveAs(
            data,
            this.currentClosure.grant.name +
            "_closure" +
            ".zip"
          );
        });
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
      "/attribute/" +
      attributeId +
      "/attachment/" +
      attachmentId;
    this.http
      .post<GrantClosure>(url, this.currentClosure, httpOptions)
      .subscribe((closure: GrantClosure) => {
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
          "/closure/" +
          this.currentClosure.id +
          "/section/" +
          sectionId +
          "/field/" +
          attributeId;

        this.http.post<GrantClosure>(url, this.currentClosure, httpOptions).subscribe(
          (closure: GrantClosure) => {
            this.closureService.changeMessage(closure, this.appComp.loggedInUser.id);
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
          //$('#section_' + newSection.id).css('display', 'block');
          $(createSectionModal).modal("hide");
          this.appComp.sectionAdded = true;
          this.sidebar.buildSectionsSideNav(null);
          this.appComp.sectionInModification = false;
          //  this.appComp.selectedTemplate = info.report.template;
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
}