import { AdminService } from './../../../admin.service';
import { GrantTagsComponent } from './../../../grant-tags/grant-tags.component';
import { Grant, OrgTag } from './../../../model/dahsboard';
import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { SingleReportDataService } from "../../../single.report.data.service";
import { Report, ReportSectionInfo } from "../../../model/report";
import {
  CustomDateAdapter,
  Section,
  WorkflowStatus,
} from "../../../model/dahsboard";
import {
  MatBottomSheet,
  MatDatepicker,
  MatDatepickerInputEvent,
  MatDialog,
  MAT_DATE_FORMATS,
  DateAdapter,
} from "@angular/material";
import {
  HumanizeDurationLanguage,
  HumanizeDuration,
} from "humanize-duration-ts";
import {
  ActivatedRoute,
  Router,
  NavigationStart,
  NavigationEnd,
  ActivationEnd,
  RouterEvent,
} from "@angular/router";
import { AppComponent } from "../../../app.component";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { ToastrService, IndividualConfig } from "ngx-toastr";
import { SidebarComponent } from "../../../components/sidebar/sidebar.component";
import { AdminLayoutComponent } from "../../../layouts/admin-layout/admin-layout.component";
import { Configuration } from "../../../model/app-config";
import { User } from "../../../model/user";
import { DatePipe, TitleCasePipe } from "@angular/common";
import * as indianCurrencyInWords from "indian-currency-in-words";
import * as inf from "indian-number-format";

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
  selector: "app-report-header",
  templateUrl: "./report-header.component.html",
  styleUrls: ["./report-header.component.scss"],
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
export class ReportHeaderComponent implements OnInit {
  currentReport: Report;
  action: string;
  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService);
  subscribers: any = {};
  reportWorkflowStatuses: WorkflowStatus[];
  tenantUsers: User[];

  @ViewChild("pickerStart") pickerStart: MatDatepicker<Date>;
  @ViewChild("pickerEnd") pickerEnd: MatDatepicker<Date>;
  @ViewChild("pickerDue") pickerDue: MatDatepicker<Date>;
  @ViewChild("createSectionModal") createSectionModal: ElementRef;

  constructor(
    private singleReportDataService: SingleReportDataService,
    private route: ActivatedRoute,
    public appComp: AppComponent,
    private router: Router,
    private adminComp: AdminLayoutComponent,
    private http: HttpClient,
    private toastr: ToastrService,
    private sidebar: SidebarComponent,
    private titlecasePipe: TitleCasePipe,
    private datePipe: DatePipe,
    private dialog: MatDialog,
    private adminService: AdminService
  ) {
    this.route.params.subscribe((p) => {
      this.action = p["action"];
      this.appComp.action = this.action;
    });

    this.subscribers = this.router.events.subscribe((val) => {
      if (
        val instanceof NavigationStart &&
        val.url === "/report/report-preview"
      ) {
        this.appComp.action = "report-preview";
      } else if (
        val instanceof NavigationStart &&
        val.url !== "/report/report-preview"
      ) {
        this.appComp.action = "";
      }

      if (val instanceof NavigationStart) {
        this.saveReport();
        if (val.url === "/grants") {
          this.subscribers.unsubscribe();
        }
      }
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
  }

  ngOnInit() {
    this.appComp.reportSaved = false;

    this.appComp.createNewReportSection.subscribe((val) => {
      if (val) {
        $(".modal-backdrop").remove();

        this.addNewSection();
        this.appComp.createNewReportSection.next(false);
      }
    });

    this.sidebar.buildSectionsSideNav(null);
  }

  openStartDate() {
    const stDateElem = this.pickerStart;
    if (!stDateElem.opened) {
      stDateElem.open();
    } else {
      stDateElem.close();
    }
  }

  openEndDate() {
    const enDateElem = this.pickerEnd;
    if (!enDateElem.opened) {
      enDateElem.open();
    } else {
      enDateElem.close();
    }
  }

  openDueDate() {
    const dDateElem = this.pickerDue;
    if (!dDateElem.opened) {
      dDateElem.open();
    } else {
      dDateElem.close();
    }
  }
  datePickerSelected(event: Event) {
    //Fo nothing
  }

  manageDate(type: string, ev: Event, dt: string) {
    if (type === "start") {
      this.currentReport.startDate = new Date(ev.toString());
    } else if (type === "end") {
      this.currentReport.endDate = new Date(ev.toString());
    } else if (type === "due") {
      this.currentReport.dueDate = new Date(ev.toString());
    }
    this.setDateDuration();
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
      this.currentReport.duration = "Not set";
    }
  }

  saveReport() {
    if (!this.currentReport.canManage) {
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
      "/report/" +
      this.currentReport.id;

    this.http
      .put(url, this.currentReport, httpOptions)
      .subscribe((report: Report) => {
        this.singleReportDataService.changeMessage(report);
        this.appComp.autosaveDisplay =
          "Last saved @ " +
          this.datePipe.transform(new Date(), "hh:mm:ss a") +
          "     ";
        //this.appComp.showSaving = false;
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
          //$('#section_' + newSection.id).css('display', 'block');
          $(createSectionModal).modal("hide");
          this.appComp.sectionAdded = true;
          this.sidebar.buildSectionsSideNav(null);
          this.appComp.sectionInModification = false;
          //  this.appComp.selectedTemplate = info.report.template;
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
              "26 We encountered an error",
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

  showHistory(type, obj) {
    this.adminComp.showHistory(type, obj);
  }

  showWorkflowAssigments() {
    this.adminComp.showWorkflowAssigments();
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

  manageGrant() {
    this.adminComp.manageGrant(null, this.currentReport.grant.id);
  }

  clearStartDate() {
    this.currentReport.startDate = null;
    this.currentReport.stDate = "";
    this.setDateDuration();
  }

  clearEndDate() {
    this.currentReport.endDate = null;
    this.currentReport.enDate = "";
    this.setDateDuration();
  }

  clearDueDate() {
    this.currentReport.dueDate = null;
    this.currentReport.dDate = "";
  }

  startDateFilter = (d: Date | null): boolean => {
    const today = new Date();
    const day = d || today;
    if (day < new Date(this.currentReport.grant.startDate)) {
      return false;
    }
    if (this.currentReport.endDate && !this.currentReport.dueDate) {
      return day <= new Date(this.currentReport.endDate);
    } else if (this.currentReport.dueDate) {
      return (
        day <= new Date(this.currentReport.dueDate) &&
        day <= new Date(this.currentReport.endDate)
      );
    } else if (this.currentReport.dueDate) {
      return day <= new Date(this.currentReport.dueDate);
    }
    return true;
  };

  endDateFilter = (d: Date | null): boolean => {
    const today = new Date();
    const day = d || today;

    if (day > new Date(this.currentReport.grant.endDate)) {
      return false;
    }
    if (this.currentReport.startDate && !this.currentReport.dueDate) {
      return day >= new Date(this.currentReport.startDate);
    } else if (this.currentReport.startDate && this.currentReport.dueDate) {
      return (
        day >= new Date(this.currentReport.startDate) &&
        day < new Date(this.currentReport.dueDate)
      );
    } else if (!this.currentReport.startDate && this.currentReport.dueDate) {
      return day < new Date(this.currentReport.dueDate);
    }
    return true;
  };

  dueDateFilter = (d: Date | null): boolean => {
    const today = new Date();
    const day = d || today;
    if (this.currentReport.endDate && !this.currentReport.startDate) {
      return day >= new Date(this.currentReport.endDate);
    } else if (this.currentReport.endDate && this.currentReport.startDate) {
      return (
        day > new Date(this.currentReport.endDate) &&
        day > new Date(this.currentReport.startDate)
      );
    } else if (!this.currentReport.endDate && this.currentReport.startDate) {
      return day > new Date(this.currentReport.startDate);
    }
    return true;
  };


  public getGrantTypeName(typeId): string {
    return this.appComp.grantTypes.filter(t => t.id === typeId)[0].name;
  }

  public getGrantTypeColor(typeId): any {
    return this.appComp.grantTypes.filter(t => t.id === typeId)[0].colorCode;
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

  showGrantTags() {
    this.adminService.getOrgTags(this.appComp.loggedInUser).then((tags: OrgTag[]) => {

      const dg = this.dialog.open(GrantTagsComponent, {
        data: { orgTags: tags, grantTags: this.currentReport.grant.tags, grant: this.currentReport.grant, appComp: this.appComp, type: 'report' },
        panelClass: "grant-template-class"
      });

    });

  }
}
