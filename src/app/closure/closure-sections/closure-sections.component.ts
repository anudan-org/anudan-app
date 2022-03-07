import { RefundpopupComponent } from './../../refundpopup/refundpopup.component';
import { DomSanitizer } from '@angular/platform-browser';
import { DocpreviewComponent } from './../../docpreview/docpreview.component';
import { DocpreviewService } from './../../docpreview.service';
import { DocManagementService } from './../../doc-management.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { COMMA } from '@angular/cdk/keycodes';
import { ENTER } from '@angular/cdk/keycodes';
import { AdminService } from './../../admin.service';
import { FormControl } from '@angular/forms';
import { Grant, TemplateLibrary, AttachmentDownloadRequest, ActualRefund } from './../../model/dahsboard';
import { FieldDialogComponent } from './../../components/field-dialog/field-dialog.component';
import { MessagingComponent } from './../../components/messaging/messaging.component';
import { SectionEditComponent } from './../../components/section-edit/section-edit.component';
import { ClosureFieldInfo, ClosureDocInfo, ClosureSectionInfo } from './../../model/closures';
import { AmountValidator } from './../../amount-validator';
import { DisbursementDataService } from './../../disbursement.data.service';
import { CurrencyService } from './../../currency-service';
import { AttributeService } from './../../attribute-validation-service';
import { AdminLayoutComponent } from 'app/layouts/admin-layout/admin-layout.component';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
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
import * as inf from "indian-number-format";


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
        .refunds-holder
        .mat-form-field-appearance-legacy
        .mat-form-field-infix {
        padding: 0 !important;
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
    `,
  ],
})
export class ClosureSectionsComponent implements OnInit, AfterViewInit {

  @ViewChild("createSectionModal") createSectionModal: ElementRef;
  @ViewChild("datePicker") datePicker: MatDatepicker<any>;
  @ViewChild("datePicker2") datePicker2: MatDatepicker<any>;
  @ViewChild("dataColumns") dataColumns: ElementRef;
  @ViewChild("auto") matAutocomplete: MatAutocomplete;
  @ViewChild("fruitInput") fruitInput: ElementRef<HTMLInputElement>;
  @ViewChild("refundRequested") refundRequested: ElementRef;
  @ViewChild("ongoingDisbursementAmount") ongoingDisbursementAmount: ElementRef;
  @ViewChild("grantRefundFormatted") grantRefundFormatted: ElementRef;
  @ViewChild("refundAmount") refundAmount: ElementRef;


  currentClosure: GrantClosure;
  action: string;
  newField: any;
  selectedDateField: any;
  selectedColumn: ColumnData;
  selectedARDateField: any;
  selectedARColumn: ActualRefund;
  myControl: FormControl;
  options: TemplateLibrary[];
  filteredOptions: Observable<TemplateLibrary[]>;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  fruitCtrl = new FormControl();
  allowScroll = true;
  noSingleDocAction: boolean = false;
  noSingleClosureDocAction: boolean = false;
  downloadAndDeleteAllowed: boolean = false;
  downloadAndDeleteClosureDocsAllowed: boolean = false;
  subscribers: any = {};

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
    private elem: ElementRef,
    private docManagementService: DocManagementService,
    private docPreviewService: DocpreviewService,
    private sanitizer: DomSanitizer,
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
        if (this.currentClosure) {
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
      if (!this.currentClosure) {
        this.appComp.currentView = 'dashboard';
        this.router.navigate(['dashboard']);
      }
      if (this.currentClosure.grant.actualRefunds.length === 0) {
        //this.addActualRefunds();
      }

      console.log(this.currentClosure);
    });
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

        if (this.currentClosure.closureDetails.sections.filter(a => a.id === secId)[0] && this.currentClosure.closureDetails.sections.filter(a => a.id === secId)[0].sectionName === 'Refund') {
          this.currentClosure.grant.refundAmount = null;
          this.currentClosure.grant.refundReason = null;
        }
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

  getReceivedFunds(i) {
    const funds = document.getElementsByClassName('rf');
    return (funds && funds.length) > 0 ? funds[i].innerHTML : '';
  }

  getPlannedFunds(i) {
    const funds = document.getElementsByClassName('pf');
    return (funds && funds.length) > 0 ? funds[i].innerHTML : '';
  }

  getPlannedDiff(i) {
    const pf = $('.pf');
    if (!pf || pf.length === 0) {
      return '';
    }

    const pieces = $(pf[i]).html().replace('₹ ', '').split(",")

    const p = Number(pieces.join(""));//.replaceAll(',', ''));

    return this.currencyService.getFormattedAmount(p - 0 + this.getActualRefundsForGrant());
  }



  getRecievedDiff(i) {
    const pf = $('.rf');
    if (!pf || pf.length === 0) {
      return '';
    }

    const peices = $(pf[i]).html().replace('₹ ', '').split(',');
    const p = Number(peices.join(""));
    return this.currencyService.getFormattedAmount(p - 0 - this.getActualRefundsForGrant());
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

  deleteActualRefundRow(actualRefund, rowIndex) {
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: "Delete selected Actual Refund row?", btnMain: "Delete Actual Refund", btnSecondary: "Not Now" },
      panelClass: "center-class",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        //
        this.closureService.deleteActualRefund(actualRefund, this.currentClosure.id, this.appComp)
          .then(() => {
            const idx = this.currentClosure.grant.actualRefunds.findIndex(g => g.id === actualRefund.id);
            this.currentClosure.grant.actualRefunds.splice(idx, 1);
          });
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

  openARDate(af: ActualRefund, ev: MouseEvent) {
    const stDateElem = this.datePicker2;
    this.selectedARDateField = ev;
    this.selectedARColumn = af;
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

  setARDate(ev: MatDatepickerInputEvent<any>) {
    this.selectedARDateField.target.value = this.datepipe.transform(
      ev.value,
      "dd-MMM-yyyy"
    );
    //this.selectedARColumn.refundDate = this.selectedARDateField.target.value;
    this.selectedARColumn.refundDateStr = this.selectedARDateField.target.value.toString();

    this.updateRefundLineItem(this.selectedARColumn);
  }

  updateRefundLineItem(af) {
    this.closureService.saveActualRefund(af, this.currentClosure.id, this.appComp).then((response: ActualRefund) => {
      this.selectedARColumn = response;
      const idx = this.currentClosure.grant.actualRefunds.findIndex(a => a.id === this.selectedARColumn.id);
      this.currentClosure.grant.actualRefunds[idx] = this.selectedARColumn;
      //this.currentClosure.grant.actualRefunds.push(af);
    });
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
    let files = event.target.files;

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
        //this.currentClosure = info.closure;

      });
  }

  handleSelection(attribId, attachmentId) {
    const docElems = this.elem.nativeElement.querySelectorAll(
      '[id^="attriute_' + attribId + '_attachment_"]'
    );
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
        if (this.currentClosure.closureDetails.sections.filter(a => a.id === sectionId)[0] && this.currentClosure.closureDetails.sections.filter(a => a.id === sectionId)[0].sectionName === 'Refund') {
          this.currentClosure.grant.refundAmount = null;
          this.currentClosure.grant.refundReason = null;
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
    this.callCreateSectionAPI(sectionName.val(), false)
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


  previewDocument(_for, attach) {
    this.docPreviewService.previewDoc(_for, this.appComp.loggedInUser.id, this.currentClosure.id, attach.id).then((result: any) => {
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

  downloadSingleDoc(attachmentId: number) {
    const selectedAttachments = new AttachmentDownloadRequest();
    selectedAttachments.attachmentIds = [];
    selectedAttachments.attachmentIds.push(attachmentId);
    this.docManagementService.callClosureDocDownload(selectedAttachments, this.appComp, this.currentClosure);
  }

  downloadSingleClosureDoc(attachmentId: number) {
    const selectedAttachments = new AttachmentDownloadRequest();
    selectedAttachments.attachmentIds = [];
    selectedAttachments.attachmentIds.push(attachmentId);
    this.docManagementService.callClosureDocsDownload(selectedAttachments, this.appComp, this.currentClosure);
  }

  deleteSingleDoc(attributeId, attachmentId) {
    const dReg = this.dialog.open(FieldDialogComponent, {
      data: {
        title: "Are you sure you want to delete the selected document?",
        btnMain: "Delete Document",
        btnSecondary: "Not Now"
      },
      panelClass: "field-delete-class",
    });

    dReg.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteAttachment(attributeId, attachmentId);
      }
    });
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

  captureRefund() {
    /*  const dg = this.dialog.open(RefundpopupComponent, {
       data: { title: `<p class='text-header'>Refund Request<p><p class='text-subheader'>` + (this.currentClosure.grant.referenceNo ? '[' + this.currentClosure.grant.referenceNo + '] ' : '') + this.currentClosure.grant.name + `</p>` },
       panelClass: "center-class",
     }); */

    /* dg.afterClosed().subscribe(result => {
      if (result.status) { */
    //this.refundRequested.nativeElement.innerHTML = this.currencyService.getFormattedAmount(Number(result.amount));
    this.callCreateSectionAPI("Project Refund Details", true);
    /* }
  }); */
  }

  getOngoingDisbursementAmount() {
    return this.currentClosure.grant.ongoingDisbursementAmount ? this.currencyService.getFormattedAmount(this.currentClosure.grant.ongoingDisbursementAmount) : ''
  }

  getRefundAmount() {
    if (this.currentClosure.grant.refundAmount) {
      return this.currencyService.getFormattedAmount(this.currentClosure.grant.refundAmount);
    }
  }

  addActualRefunds() {
    console.log(this.currentClosure);
    let af = new ActualRefund();
    af.createdDate = new Date();
    af.amount = null;
    af.createdBy = this.appComp.loggedInUser.id;
    af.note = '';
    af.refundDate = null;
    af.associatedGrantId = this.currentClosure.grant.id;
    this.closureService.saveActualRefund(af, this.currentClosure.id, this.appComp).then((response: ActualRefund) => {
      af = response;
      this.currentClosure.grant.actualRefunds.push(af);
    });
  }

  getFormattedARAmount(amount) {
    if (!amount) {
      return '';
    }

    return this.currencyService.getFormattedAmount(amount);
  }

  toggleARAmountInput(ev) {
    const inputId = 'afinput_' + ev.currentTarget.id.split("_")[1];
    $(ev.currentTarget).css('visibility', 'hidden');
    $('#' + inputId).css('visibility', 'visible');
    $('#' + inputId).focus();
  }

  toggleARInput(ev, af) {
    const inputDisplay = 'afp_' + ev.currentTarget.id.split("_")[1];
    $(ev.currentTarget).css('visibility', 'hidden');
    $('#' + inputDisplay).css('visibility', 'visible');
    this.updateRefundLineItem(af);
  }

  getRedundDate(dt) {
    return this.datepipe.transform(
      dt,
      "dd-MMM-yyyy"
    );
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

  showFormattedRefundAmount(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    this.grantRefundFormatted.nativeElement.style.visibility = "visible";
  }

  showRefundAmountInput(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    this.refundAmount.nativeElement.style.visibility = "visible";
  }

  getFormattedGrantAmount(amount: number): string {
    if (amount) {
      return inf.format(amount, 2);
    }
    return "<div class='amountPlaceholder'>Enter grant amount</div>";
  }

  getFormattedRefundAmount(amount: number): string {
    if (amount) {
      return inf.format(amount, 2);
    }
    return "<div class='amountPlaceholder'>Enter grant amount</div>";
  }

  getPlannedTotal() {
    const pf = $('.pf');
    if (!pf || pf.length === 0) {
      return '';
    }

    const internalDisbursement = $(pf[0]).html().replace('₹ ', '').split(",")
    const externalDisbursement = $(pf[1]).html().replace('₹ ', '').split(",")

    const i = Number(internalDisbursement.join(""));//.replaceAll(',', ''));
    const e = Number(externalDisbursement.join(""));//.replaceAll(',', ''));

    return this.currencyService.getFormattedAmount(i + e);
  }

  getReceivedTotal() {
    const pf = $('.rf');
    if (!pf || pf.length === 0) {
      return '';
    }

    const internalDisbursement = $(pf[0]).html().replace('₹ ', '').split(",")
    const externalDisbursement = $(pf[1]).html().replace('₹ ', '').split(",")

    const i = Number(internalDisbursement.join(""));//.replaceAll(',', ''));
    const e = Number(externalDisbursement.join(""));//.replaceAll(',', ''));

    return this.currencyService.getFormattedAmount(i + e);
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

  getPlannedDiffTotal() {
    const pf = $('.pf');
    if (!pf || pf.length === 0) {
      return '';
    }

    const pieces1 = $(pf[0]).html().replace('₹ ', '').split(",")
    const p1 = Number(pieces1.join(""));
    const pieces2 = $(pf[1]).html().replace('₹ ', '').split(",")
    const p2 = Number(pieces2.join(""));

    return this.currencyService.getFormattedAmount((p1 - 0 + this.getActualRefundsForGrant()) + (p2));
  }

  getRecievedDiffTotals() {
    const pf = $('.rf');
    if (!pf || pf.length === 0) {
      return '';
    }

    const peices1 = $(pf[0]).html().replace('₹ ', '').split(',');
    const p1 = Number(peices1.join(""));
    const peices2 = $(pf[1]).html().replace('₹ ', '').split(',');
    const p2 = Number(peices1.join(""));
    return this.currencyService.getFormattedAmount(p1 - 0 - this.getActualRefundsForGrant() + p2);
  }

}
