import { PDFExportComponent } from '@progress/kendo-angular-pdf-export';
import { SidebarComponent } from './../../components/sidebar/sidebar.component';
import { CurrencyService } from './../../currency-service';
import { AdminLayoutComponent } from 'app/layouts/admin-layout/admin-layout.component';
import { IndividualConfig, ToastrService } from 'ngx-toastr';
import { ClosureWorkflowAssignment, ClosureSectionInfo } from './../../model/closures';
import { WfassignmentComponent } from 'app/components/wfassignment/wfassignment.component';
import { Router } from '@angular/router';
import { TemplateDialogComponent } from './../../components/template-dialog/template-dialog.component';
import { ClosureNotesComponent } from './../../components/closureNotes/closureNotes.component';
import { WfvalidationService } from './../../wfvalidation.service';
import { Configuration } from './../../model/app-config';
import { FieldDialogComponent } from './../../components/field-dialog/field-dialog.component';
import { MatDialog } from '@angular/material';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { AppComponent } from 'app/app.component';
import { WorkflowStatus, Grant, TableData, Attribute, Section } from './../../model/dahsboard';
import { ClosureWorkflowAssignmentModel, GrantClosure } from 'app/model/closures';
import { ClosureDataService } from './../../closure.data.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { User } from 'app/model/user';
import { saveAs } from 'file-saver';
import * as indianCurrencyInWords from 'indian-currency-in-words';
import * as inf from 'indian-number-format';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-closure-preview',
  templateUrl: './closure-preview.component.html',
  styleUrls: ['./closure-preview.component.scss'],
  providers: [PDFExportComponent, SidebarComponent, TitleCasePipe],
  styles: [`
    ::ng-deep .wf-assignment-class .mat-dialog-container{
        overflow: hidden !important;
    }
  `]
})
export class ClosurePreviewComponent implements OnInit {

  @ViewChild('pdf') pdf;
  @ViewChild('createSectionModal') createSectionModal: ElementRef;


  currentClosure: GrantClosure;
  wfDisabled: boolean = false;
  closureWorkflowStatuses: WorkflowStatus[];
  tenantUsers: User[];
  logoUrl: string;

  constructor(private closureService: ClosureDataService,
    private appComp: AppComponent,
    private http: HttpClient,
    private dialog: MatDialog,
    private wfvalidationService: WfvalidationService,
    private router: Router,
    private toastr: ToastrService,
    public adminComp: AdminLayoutComponent,
    private currencyService: CurrencyService,
    private titlecasePipe: TitleCasePipe,
    private sidebar: SidebarComponent,) {

    this.closureService.currentMessage.subscribe((closure) => {
      this.currentClosure = closure;

      console.log(this.currentClosure);
    });

    this.appComp.closureUpdated.subscribe((statusUpdate) => {
      if (statusUpdate.status && statusUpdate.closureId && this.appComp.loggedInUser !== undefined) {
        let url =
          "/api/user/" + this.appComp.loggedInUser.id + "/closure/" + statusUpdate.closureId;
        const httpOptions = {
          headers: new HttpHeaders({
            "Content-Type": "application/json",
            "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
            Authorization: localStorage.getItem("AUTH_TOKEN"),
          }),
        };

        this.http.get(url, httpOptions).subscribe((closure: GrantClosure) => {
          if (closure) {
            if (this.currentClosure && this.currentClosure.id === Number(closure.id)) {
              this.closureService.changeMessage(closure, appComp.loggedInUser.id);
            }
          }
        });
      }
    });

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    let url = '/api/app/config/closure/' + this.currentClosure.id;

    this.http.get(url, httpOptions).subscribe((config: Configuration) => {
      this.closureWorkflowStatuses = config.closureWorkflowStatuses;
      this.appComp.closureWorkflowStatuses = config.closureWorkflowStatuses;
      this.tenantUsers = config.tenantUsers;
      this.appComp.tenantUsers = config.tenantUsers;
      this.appComp.closureTransitions = config.reportTransitions;
    });
  }

  ngOnInit() {
    this.logoUrl = "/api/public/images/" + this.currentClosure.grant.grantorOrganization.code + "/logo";
  }

  submitClosure(toStateId: number) {

    for (let assignment of this.currentClosure.workflowAssignment) {
      const status1 = this.closureWorkflowStatuses.filter((status) => status.id === assignment.stateId);
      if ((assignment.assignmentId === null || assignment.assignmentId === undefined || assignment.assignmentId === 0 && !status1[0].terminal) || (assignment.assignmentUser.deleted)) {
        const dialogRef = this.dialog.open(FieldDialogComponent, {
          data: { title: "Would you like to assign users responsible for this workflow?", btnMain: "Assign Users", btnSecondary: "Not Now" },
          panelClass: 'center-class'
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.showWorkflowAssigments(toStateId);
          }
        });
        return;
      }
    }

    this.wfvalidationService.validateGrantWorkflow(this.currentClosure.id, 'CLOSURE', this.appComp.loggedInUser.id, this.currentClosure.status.id, toStateId).then(result => {
      this.openBottomSheetForClosureNotes(toStateId, result);
      this.wfDisabled = true;
    });

  }

  showWorkflowAssigments(toStateId) {
    const wfModel = new ClosureWorkflowAssignmentModel();
    wfModel.users = this.tenantUsers;
    wfModel.granteeUsers = this.currentClosure.granteeUsers;
    wfModel.workflowStatuses = this.closureWorkflowStatuses;
    wfModel.workflowAssignments = this.currentClosure.workflowAssignment;
    wfModel.type = this.appComp.currentView;
    wfModel.closure = this.currentClosure;
    wfModel.closure.grant.isInternal = this.appComp.grantTypes.filter(gt => this.currentClosure.grant.grantTypeId)[0].internal;
    wfModel.canManage = this.currentClosure.flowAuthorities && this.currentClosure.canManage;
    const dialogRef = this.dialog.open(WfassignmentComponent, {
      data: { model: wfModel, userId: this.appComp.loggedInUser.id, appComp: this.appComp },
      panelClass: 'wf-assignment-class'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.result) {
        const ass: ClosureWorkflowAssignment[] = [];
        for (let data of result.data) {
          const wa = new ClosureWorkflowAssignment();
          wa.id = data.id;
          wa.stateId = data.stateId;
          wa.assignmentId = data.userId;
          wa.customAssignments = data.customAssignments;
          wa.closureId = data.closureId;
          ass.push(wa);
        }

        const httpOptions = {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
            'Authorization': localStorage.getItem('AUTH_TOKEN')
          })
        };

        let url = '/api/user/' + this.appComp.loggedInUser.id + '/closure/'
          + this.currentClosure.id + '/assignment';
        this.http.post(url, { closure: this.currentClosure, assignments: ass }, httpOptions).subscribe((closure: GrantClosure) => {
          this.closureService.changeMessage(closure, this.appComp.loggedInUser.id);
          this.currentClosure = closure;
          this.submitClosure(toStateId);
        }, error => {
          const errorMsg = error as HttpErrorResponse;
          const x = { 'enableHtml': true, 'preventDuplicates': true, 'positionClass': 'toast-top-full-width', 'progressBar': true } as Partial<IndividualConfig>;
          const y = { 'enableHtml': true, 'preventDuplicates': true, 'positionClass': 'toast-top-right', 'progressBar': true } as Partial<IndividualConfig>;
          const errorconfig: Partial<IndividualConfig> = x;
          const config: Partial<IndividualConfig> = y;
          if (errorMsg.error.message === 'Token Expired') {
            //this.toastr.error('Logging you out now...',"Your session has expired", errorconfig);
            alert("Your session has timed out. Please sign in again.")
            this.appComp.logout();
          } else {
            this.toastr.error(errorMsg.error.message, "We encountered an error", config);
          }
        });
      } else {
        dialogRef.close();
      }
    });
  }

  openBottomSheetForClosureNotes(toStateId: number, result): void {

    const _bSheet = this.dialog.open(ClosureNotesComponent, {
      hasBackdrop: true,
      data: { canManage: true, currentClosure: this.currentClosure, originalClosure: this.appComp.originalClosure, validationResult: result },
      panelClass: 'grant-notes-class'
    });

    _bSheet.afterClosed().subscribe(result => {
      if (result.result) {
        this.submitAndSaveClosure(toStateId, result.message);
      } else {
        this.wfDisabled = false;
      }
    });
  }

  submitAndSaveClosure(toStateId: number, message: String) {

    if (!message) {
      message = '';
    }

    this.wfDisabled = true;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    const origStatus = this.currentClosure.status.name;
    let url = '/api/user/' + this.appComp.loggedInUser.id + '/closure/'
      + this.currentClosure.id + '/flow/'
      + this.currentClosure.status.id + '/' + toStateId;
    this.http.post(url, { closure: this.currentClosure, note: message }, httpOptions).subscribe((closure: GrantClosure) => {

      this.closureService.changeMessage(closure, this.appComp.loggedInUser.id);
      this.wfDisabled = false;
      if (closure.status.internalStatus === 'DRAFT' || closure.status.internalStatus === 'ACTIVE') {
        this.appComp.subMenu = { name: 'In-Progress Closures', action: 'urc' };
      } else if (closure.status.internalStatus === 'REVIEW') {
        this.appComp.subMenu = { name: 'In-Progress Closures', action: 'src' };
      } else if (closure.status.internalStatus === 'CLOSED') {
        this.appComp.subMenu = { name: 'Completed Closure', action: 'arc' };
      }
      if (!closure.template.published) {
        const dialogRef = this.dialog.open(TemplateDialogComponent, {
          data: this.currentClosure.template.name,
          panelClass: 'grant-notes-class'
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result.result) {
            let url = '/api/user/' + this.appComp.loggedInUser.id + '/closure/' + this.currentClosure.id + '/template/' + this.currentClosure.template.id + '/' + result.name;
            this.http.put(url, { description: result.desc, publish: true, privateToGrant: false }, httpOptions).subscribe((closure: GrantClosure) => {
              this.closureService.changeMessage(closure, this.appComp.loggedInUser.id);
              this.fetchCurrentClosure();
            });

          } else {
            let url = '/api/user/' + this.appComp.loggedInUser.id + '/closure/' + this.currentClosure.id + '/template/' + this.currentClosure.template.id + '/' + result.name;
            this.http.put(url, { description: result.desc, publish: true, privateToGrant: true }, httpOptions).subscribe((closure: GrantClosure) => {
              this.closureService.changeMessage(closure, this.appComp.loggedInUser.id);
              dialogRef.close();
              this.fetchCurrentClosure();
            });

          }
        });
      } else {
        this.fetchCurrentClosure();
      }

    }, error => {
      const errorMsg = error as HttpErrorResponse;
      console.log(error);
      const x = { 'enableHtml': true, 'preventDuplicates': true } as Partial<IndividualConfig>;
      const config: Partial<IndividualConfig> = x;
      if (errorMsg.error.message === 'Token Expired') {
        this.toastr.error("Your session has expired", 'Logging you out now...', config);
        setTimeout(() => { this.appComp.logout(); }, 4000);
      } else {
        this.toastr.error(errorMsg.error.message, "We encountered an error", config);
      }
    });
  }

  fetchCurrentClosure() {

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    const url = '/api/user/' + this.appComp.loggedInUser.id + '/closure/' + this.currentClosure.id;
    this.http.get(url, httpOptions).subscribe((updatedClosure: GrantClosure) => {
      this.closureService.changeMessage(updatedClosure, this.appComp.loggedInUser.id);
      this.currentClosure = updatedClosure;

      if (this.currentClosure.workflowAssignment.filter((a) => a.assignmentId === this.appComp.loggedInUser.id && a.anchor).length === 0) {
        this.appComp.currentView = 'upcoming';
        this.router.navigate(['grant-closures/in-progress']);
      }
    });
  }


  showWFAssigments() {
    this.adminComp.showWorkflowAssigments();
  }

  showHistory(type, obj) {
    this.adminComp.showHistory(type, obj);
  }

  manageGrant() {
    this.adminComp.manageGrant(null, this.currentClosure.grant.id);
  }

  saveAs(filename) {
    this.pdf.saveAs(filename);
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

  getGrantAmountInWords(amount: number) {
    let amtInWords = '-';
    if (amount) {
      amtInWords = indianCurrencyInWords(amount).replace("Rupees", "").replace("Paisa", "");
      return 'Rs. ' + this.titlecasePipe.transform(amtInWords);
    }
    return amtInWords;
  }

  getFormattedGrantAmount(amount: number): string {
    return this.currencyService.getFormattedAmount(amount);
  }


  getFormattedCurrency(amount: number): string {

    return this.currencyService.getFormattedAmount(amount);
  }

  getDocumentName(val: string): any[] {
    let obj;
    if (val !== undefined && val !== "") {
      obj = JSON.parse(val);
    }
    return obj;
  }

  getDisbursementTotals(idx: number, fieldTableValue: TableData[]): string {
    let total = 0;
    for (let row of fieldTableValue) {
      let i = 0;
      for (let col of row.columns) {
        if (i === idx) {
          total += (col.value !== undefined && col.value !== null && col.value !== 'null') ? Number(col.value) : 0;
        }
        i++;
      }
    }

    return String('₹ ' + inf.format(total, 2));
  }

  showUnapprovedIndicator(attr: Attribute) {

    if (attr.fieldTableValue) {
      let indicator: string[] = [];
      for (let row of attr.fieldTableValue) {
        if (row.enteredByGrantee && row.status && row.reportId === this.currentClosure.id) {
          if (indicator.findIndex(a => a === '* Indicates unapproved project funds, will be considered as approved project funds on approval of this closure request.') < 0) {
            indicator.push("* Indicates unapproved project funds, will be considered as approved project funds on approval of this closure request.");
          }
        } else if (row.enteredByGrantee && row.status && row.reportId !== this.currentClosure.id) {
          if (indicator.findIndex(a => a === '') < 0) {
            indicator.push("");
          }
        }
      }
      return indicator.join("<br>");
    }
    return null;
  }

  downloadAttachment(closureId: number, fileId: number, docName: string, docType: string) {

    const httpOptions = {
      responseType: 'blob' as 'json',
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    let url = '/api/user/' + this.appComp.loggedInUser.id + '/closure/'
      + closureId + '/file/' + fileId;

    this.http.get(url, httpOptions).subscribe((data) => {
      saveAs(data, docName + "." + docType);
    });
  }

  saveSection() {
    const sectionName = $('#sectionTitleInput');
    if (sectionName.val().trim() === '') {
      this.toastr.warning('Section name cannot be left blank', 'Warning');
      sectionName.focus();
      return;
    }

    const createSectionModal = this.createSectionModal.nativeElement;

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    const url = '/api/user/' + this.appComp.loggedInUser.id + '/closure/' + this.currentClosure.id + '/template/' + this.currentClosure.template.id + '/section/' + sectionName.val();

    this.http.post<ClosureSectionInfo>(url, this.currentClosure, httpOptions).subscribe((info: ClosureSectionInfo) => {
      this.closureService.changeMessage(info.closure, this.appComp.loggedInUser.id);

      sectionName.val('');
      $(createSectionModal).modal('hide');
      this.appComp.sectionAdded = true;
      this.sidebar.buildSectionsSideNav(null);
      this.appComp.sectionInModification = false;
      //  this.appComp.selectedTemplate = info.report.template;
      this.router.navigate(['grant-closure/section/' + this.getCleanText(info.closure.closureDetails.sections.filter((a) => a.id === info.sectionId)[0])]);
    }, error => {
      const errorMsg = error as HttpErrorResponse;
      console.log(error);
      const x = { 'enableHtml': true, 'preventDuplicates': true } as Partial<IndividualConfig>;
      const config: Partial<IndividualConfig> = x;
      if (errorMsg.error.message === 'Token Expired') {
        this.toastr.error("Your session has expired", 'Logging you out now...', config);
        setTimeout(() => { this.appComp.logout(); }, 4000);
      } else {
        this.toastr.error(errorMsg.error.message, "We encountered an error", config);
      }
    });
  }

  getCleanText(section: Section): string {
    if (section.sectionName === '') {
      return String(section.id);
    }
    return section.sectionName.replace(/[^_0-9a-z]/gi, '');
  }
}
