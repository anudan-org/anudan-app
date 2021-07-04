import { FieldDialogComponent } from './../../components/field-dialog/field-dialog.component';
import { DisbursementtDoc } from './../../model/disbursement-doc';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material';
import { GrantTagsComponent } from './../../grant-tags/grant-tags.component';
import { AdminService } from './../../admin.service';
import { Grant, OrgTag, AttachmentDownloadRequest } from './../../model/dahsboard';
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from "@angular/core";
import { Disbursement } from "app/model/disbursement";
import { DisbursementDataService } from "app/disbursement.data.service";
import { AppComponent } from "app/app.component";
import * as indianCurrencyInWords from "indian-currency-in-words";
import { TitleCasePipe } from "@angular/common";
import * as inf from "indian-number-format";
import { Attribute, TableData } from "app/model/dahsboard";
import { Router, NavigationStart } from "@angular/router";
import { CurrencyService } from "app/currency-service";
import { AdminLayoutComponent } from "app/layouts/admin-layout/admin-layout.component";
import { AmountValidator } from "app/amount-validator";
import { saveAs } from "file-saver";

@Component({
  selector: "disbursement-dashboard",
  templateUrl: "./disbursement.component.html",
  styleUrls: ["./disbursement.component.css"],
  providers: [TitleCasePipe],
})
export class DisbursementComponent implements OnInit, OnDestroy {
  currentDisbursement: Disbursement;
  subscribers: any = {};

  @ViewChild("disbursementAmountFormatted")
  disbursementAmountFormatted: ElementRef;
  @ViewChild("disbursementAmount") disbursementAmount: ElementRef;
  disbursementDocs: DisbursementtDoc[] = [];

  constructor(
    public disbursementService: DisbursementDataService,
    public appComponent: AppComponent,
    private titlecasePipe: TitleCasePipe,
    private router: Router,
    public currencyService: CurrencyService,
    private adminComp: AdminLayoutComponent,
    public amountValidator: AmountValidator,
    private adminService: AdminService,
    private dialog: MatDialog,
    private http: HttpClient,
    private elem: ElementRef,
  ) {
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
    this.appComponent.currentView = "disbursement";

    this.disbursementService.currentMessage.subscribe(
      (disbursement) => (this.currentDisbursement = disbursement)
    );
    if (
      this.currentDisbursement === undefined ||
      this.currentDisbursement === null
    ) {
      this.router.navigate(["dashboard"]);
    }
  }

  ngOnDestroy() {
    this.subscribers.unsubscribe();
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

  getTotals(idx: number, fieldTableValue: TableData[]): string {
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

  showAmountInput(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    this.disbursementAmount.nativeElement.style.visibility = "visible";
  }

  showFormattedAmount(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    this.disbursementAmountFormatted.nativeElement.style.visibility = "visible";
  }

  showWorkflowAssigments() {
    this.adminComp.showWorkflowAssigments();
  }

  showHistory(type, obj) {
    this.adminComp.showHistory(type, obj);
  }

  manageGrant() {
    this.adminComp.manageGrant(null, this.currentDisbursement.grant.id);
  }

  getGrantAmountAvailable() {

    return this.currencyService.getFormattedAmount(this.currentDisbursement.grant.amount - this.disbursementService.getActualDisbursementsTotal(this.currentDisbursement));
  }

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

  processSelectedFiles(ev) {
    const files = ev.target.files;

    const endpoint =
      "/api/user/" +
      this.appComponent.loggedInUser.id +
      "/disbursements/" +
      this.currentDisbursement.id +
      "/documents/upload";
    let formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("file", files.item(i));
    }

    //console.log(">>>>" + JSON.stringify(this.message.currentGrant));

    const httpOptions = {
      headers: new HttpHeaders({
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    this.http
      .post<DisbursementtDoc[]>(endpoint, formData, httpOptions)
      .subscribe((info: DisbursementtDoc[]) => {
        for (let pDoc of info) {
          this.disbursementDocs.push(pDoc);
        }
      });
  }

  handleSelection(attachmentId) {
    const elems = this.elem.nativeElement.querySelectorAll(
      '[id^="attachment_' + attachmentId + '"]'
    );
    if (elems.length > 0) {
      for (let singleElem of elems) {
        if (singleElem.checked) {
          this.elem.nativeElement.querySelector(
            '[id="downloadBtn"]'
          ).disabled = false;
          this.elem.nativeElement.querySelector(
            '[id="deleteBtn"]'
          ).disabled = false;
          return;
        }
        this.elem.nativeElement.querySelector(
          '[id="downloadBtn"]'
        ).disabled = true;
        this.elem.nativeElement.querySelector(
          '[id="deleteBtn"]'
        ).disabled = true;
      }
    }
  }

  downloadSelection() {
    const elems = this.elem.nativeElement.querySelectorAll(
      '[id^="attachment_"]'
    );
    const selectedAttachments = new AttachmentDownloadRequest();
    if (elems.length > 0) {
      selectedAttachments.attachmentIds = [];
      for (let singleElem of elems) {
        if (singleElem.checked) {
          selectedAttachments.attachmentIds.push(singleElem.id.split("_")[1]);
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
        this.appComponent.loggedInUser.id +
        "/disbursements/" +
        this.currentDisbursement.id +
        "/documents/download";
      this.http
        .post(url, selectedAttachments, httpOptions)
        .subscribe((data) => {
          saveAs(data, this.currentDisbursement.grant.name + "_disbursement_docs.zip");
        });
    }
  }

  deleteSelection() {

    const dReg = this.dialog.open(FieldDialogComponent, {
      data: { title: 'Are you sure you want to delete the selected document(s)?', btnMain: "Delete Document(s)", btnSecondary: "Not Now" },
      panelClass: 'center-class'
    });

    dReg.afterClosed().subscribe(result => {
      if (result) {
        const elems = this.elem.nativeElement.querySelectorAll(
          '[id^="attachment_"]'
        );
        const selectedAttachments = new AttachmentDownloadRequest();
        if (elems.length > 0) {
          selectedAttachments.attachmentIds = [];
          for (let singleElem of elems) {
            if (singleElem.checked) {
              selectedAttachments.attachmentIds.push(singleElem.id.split("_")[1]);
            }
          }
        }
        for (let item of selectedAttachments.attachmentIds) {
          this.deleteAttachment(item);
        }
      } else {
        dReg.close();
      }
    });

  }

  deleteAttachment(attachmentId) {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url =
      "/api/user/" +
      this.appComponent.loggedInUser.id +
      "/disbursements/" +
      this.currentDisbursement.id +
      "/document/" +
      attachmentId;
    this.http
      .delete(url, httpOptions)
      .subscribe(() => {
        const index = this.disbursementDocs.findIndex(a => a.id === Number(attachmentId));
        this.disbursementDocs.splice(index, 1);
      });
  }
}
