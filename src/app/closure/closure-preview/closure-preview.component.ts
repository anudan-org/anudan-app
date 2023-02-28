import { MessagingComponent } from './../../components/messaging/messaging.component';
import { ReturnsPopupComponent } from './../../returns-popup/returns-popup.component';
import { DomSanitizer } from '@angular/platform-browser';
import { DocManagementService } from './../../doc-management.service';
import { DocpreviewService } from './../../docpreview.service';
import { DocpreviewComponent } from './../../docpreview/docpreview.component';
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
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { AppComponent } from 'app/app.component';
import { WorkflowStatus, Grant, TableData, Attribute, Section, AttachmentDownloadRequest } from './../../model/dahsboard';
import { ClosureWorkflowAssignmentModel, GrantClosure } from 'app/model/closures';
import { ClosureDataService } from './../../closure.data.service';
import { Component, OnInit, ViewChild, ElementRef, Renderer2, AfterViewChecked } from '@angular/core';
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
      overflow: scroll !important;
    height: calc(100vh - 114px) !important;
    padding-top: 10px !important;
    }
  `]
})
export class ClosurePreviewComponent implements OnInit, AfterViewChecked {

  @ViewChild('pdf') pdf;
  @ViewChild('createSectionModal') createSectionModal: ElementRef;
  
  currentClosure: GrantClosure;
  wfDisabled: boolean = false;
  closureWorkflowStatuses: WorkflowStatus[];
  tenantUsers: User[];
  logoUrl: string;
  actualSpent: number;
  unspentAmount: string;
  refundRequested: string;
  refundReceived: string;
  pendingRefund: string;
  grantAmount: string;
  spentAmount: string;
  interestEarned: number;
  interestAmount: string;
  disbursedAmount: string;

  @ViewChild("grantRefundFormatted") grantRefundFormatted: ElementRef;
  @ViewChild("refundAmount") refundAmount: ElementRef;
  covertext: any;
  attributes: any;
  elementupdated: any;
  @ViewChild("covernoteSection") covernoteSection: ElementRef;
 

  covernoteVisible:any;

  constructor(private closureService: ClosureDataService,
    public appComp: AppComponent,
    private http: HttpClient,
    private dialog: MatDialog,
    private wfvalidationService: WfvalidationService,
    private router: Router,
    private toastr: ToastrService,
    public adminComp: AdminLayoutComponent,
    private currencyService: CurrencyService,
    private titlecasePipe: TitleCasePipe,
    private sidebar: SidebarComponent,
    private docPreviewService: DocpreviewService,
    private docManagementService: DocManagementService,
    private renderer: Renderer2,
    private sanitizer: DomSanitizer) {

    this.closureService.currentMessage.subscribe((closure) => {
      this.currentClosure = closure;


    });

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    this.appComp.closureUpdated.subscribe((statusUpdate) => {
      if (statusUpdate.status && statusUpdate.closureId && this.appComp.loggedInUser !== undefined) {
        let urlNew =
          "/api/user/" + this.appComp.loggedInUser.id + "/closure/" + statusUpdate.closureId;


        this.http.get(urlNew, httpOptions).subscribe((closure: GrantClosure) => {
          if (closure) {
            if (this.currentClosure && this.currentClosure.id === Number(closure.id)) {
              this.closureService.changeMessage(closure, appComp.loggedInUser.id);
            }
          }
        });
      }
    });

    if (!this.currentClosure) {
      this.appComp.currentView = 'dashboard';
      this.router.navigate(['dashboard']);
    }

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
    this.setGrantAmount();
    this.getRefundAmount();
    this.getRefundReceived();
    this.setSpendSumamry();
    this.attributes=JSON.parse(this.closureService.getCoverNoteAttributes(this.currentClosure.grant.organization.id, this.appComp.loggedInUser.id)); 
    this.covertext= this.sanitizer.bypassSecurityTrustHtml(this.currentClosure.covernoteContent); 
  }

  setGrantAmount() {
    const grantAmount = this.currentClosure.grant.amount ? this.currentClosure.grant.amount : 0;
    this.grantAmount = this.currencyService.getFormattedAmount(grantAmount);
  }
  setSpendSumamry() {

    var disbursement: number = this.currentClosure.grant.approvedDisbursementsTotal ? this.currentClosure.grant.approvedDisbursementsTotal : 0;
    const spent = this.currentClosure.actualSpent ? this.currentClosure.actualSpent : 0;
    this.spentAmount = this.currencyService.getFormattedAmount(spent);

    var interest: number = this.currentClosure.interestEarned ? this.currentClosure.interestEarned : 0;
    this.interestAmount = this.currencyService.getFormattedAmount(interest);
    this.disbursedAmount = this.currencyService.getFormattedAmount(Number(disbursement));
    this.unspentAmount = this.currencyService.getFormattedAmount(Number(disbursement) + Number(interest) - spent);
  }

  ngAfterViewChecked(){
    if (!this.elementupdated) {
    this.populateAttributes();
    }
  }
  
  showCovernote(event){

    var anchor = event.target.closest('a');
  
   if ( this.covernoteSection.nativeElement.style.display==='none' ) {
  
    this.covernoteSection.nativeElement.style.display='block';
     anchor.childNodes[0].textContent ="Hide Cover Note";
     anchor.childNodes[1].className="fa fa-eye-slash ml-2";
    this.covernoteVisible = true;
    } else {
      this.covernoteSection.nativeElement.style.display='none';
      anchor.childNodes[0].textContent ="Show Cover Note";
      anchor.childNodes[1].className="fa fa-eye ml-2";
      this.covernoteVisible = false;
    }

  }

  
  populateAttributes(){
  
    let attributeMap = new Map();
    let currentAttributes;
    if (this.currentClosure.covernoteAttributes!==undefined && this.currentClosure.covernoteAttributes!=="" ) {
      currentAttributes = JSON.parse(this.currentClosure.covernoteAttributes);
     }
    
    if ( currentAttributes !== undefined ) {
      for(let currentAttribute of currentAttributes ) {
    
       let name = currentAttribute.fieldName;
       let value = currentAttribute.fieldValue;
       attributeMap.set(name,value);
      }
     
    }

 
    for (let attribute of this.attributes) {
  
      let referenceId = document.getElementById(attribute.parentId);  
      if (referenceId !== null) {
         const elem = this.renderer.createElement('span');
       let fieldValue;
        if (attributeMap.has(attribute.fieldName) && attributeMap.get(attribute.fieldName) !=="") {
            fieldValue = this.renderer.createText( attributeMap.get(attribute.fieldName));
          } else {
            fieldValue = this.renderer.createText( attribute.placeholder);
        }
        
        this.renderer.appendChild(elem, fieldValue);
        this.renderer.appendChild(referenceId, elem);
      
      }
    }
   
    this.elementupdated=true;
  }
    

  submitClosure(toStateId: number, transitionTitle: string, direction: boolean) {

    for (let assignment of this.currentClosure.workflowAssignment) {
      const status1 = this.closureWorkflowStatuses.filter((status) => status.id === assignment.stateId);
      if (((assignment.assignmentId === null || assignment.assignmentId === undefined || assignment.assignmentId === 0) && !status1[0].terminal) || (assignment && assignment.assignmentUser && assignment.assignmentUser.deleted)) {
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

    this.wfvalidationService.validateGrantWorkflow(this.currentClosure.id, 'CLOSURE', this.appComp.loggedInUser.id, this.currentClosure.status.id, toStateId, null, direction).then(result => {
      this.openBottomSheetForClosureNotes(toStateId, result, transitionTitle);
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
    wfModel.grantTypes = this.appComp.grantTypes;
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
          const toState = this.currentClosure.flowAuthorities.filter(a => a.toStateId === toStateId)[0].toName;
          const toStateOwner = this.currentClosure.workflowAssignment.filter(a => a.stateId === toStateId)[0].assignmentUser;
          this.submitClosure(toStateId, "Progressing for " + toState + "<span class='text-subheader'> [" + toStateOwner.firstName + " " + toStateOwner.lastName + "]</span>", true);
        }, error => {
          const errorMsg = error as HttpErrorResponse;

          const config: Partial<IndividualConfig> = { 'enableHtml': true, 'preventDuplicates': true, 'positionClass': 'toast-top-right', 'progressBar': true } as Partial<IndividualConfig>;
          if (errorMsg.error.message === 'Token Expired') {
            const dg = this.dialog.open(MessagingComponent, {
              data: "Your session has timed out. Please sign in again.",
              panelClass: "center-class"
            })
            dg.afterClosed().subscribe(() => {

              this.appComp.logout();

            });

          } else {
            this.toastr.error(errorMsg.error.message, "We encountered an error", config);
          }
        });
      } else {
        dialogRef.close();
      }
    });
  }

  openBottomSheetForClosureNotes(toStateId: number, result, transitionTitle: string): void {

    const _bSheet = this.dialog.open(ClosureNotesComponent, {
      hasBackdrop: true,
      data: { canManage: true, currentClosure: this.currentClosure, originalClosure: this.appComp.originalClosure, validationResult: result, tTitle: transitionTitle },
      panelClass: 'grant-notes-class'
    });

    _bSheet.afterClosed().subscribe(resultx => {
      if (resultx.result) {
        this.submitAndSaveClosure(toStateId, resultx.message);
      } else {
        this.wfDisabled = false;
      }
    });
  }

  submitAndSaveClosure(toStateId: number, message: string) {

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
          data: "Closure Template",
          panelClass: 'grant-notes-class'
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result.result) {
            let url1 = '/api/user/' + this.appComp.loggedInUser.id + '/closure/' + this.currentClosure.id + '/template/' + this.currentClosure.template.id + '/' + result.name;
            this.http.put(url1, { description: result.desc, publish: true, privateToGrant: false }, httpOptions).subscribe((closureA: GrantClosure) => {
              this.closureService.changeMessage(closureA, this.appComp.loggedInUser.id);
              this.fetchCurrentClosure();
            });

          } else {
            let url2 = '/api/user/' + this.appComp.loggedInUser.id + '/closure/' + this.currentClosure.id + '/template/' + this.currentClosure.template.id + '/' + result.name;
            this.http.put(url2, { description: result.desc, publish: true, privateToGrant: true }, httpOptions).subscribe((closureB: GrantClosure) => {
              this.closureService.changeMessage(closureB, this.appComp.loggedInUser.id);
              dialogRef.close();
              this.fetchCurrentClosure();
            });

          }
        });
      } else {
        this.fetchCurrentClosure();
      }

    }, error => {
      this.showError(error);
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


      this.appComp.currentView = 'grants';
      this.appComp.subMenu = { name: "Active Grants", action: "ag" };
      this.router.navigate(['grants/active']);

    });
  }
  checkIfGrantHasRefundAmount() {
    const refundDetailsSection = this.currentClosure.closureDetails.sections.filter(a => a.sectionName === "Project Refund Details" && a.systemGenerated);
    return refundDetailsSection.length > 0;
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
      this.router.navigate(['grant-closure/section/' + this.getCleanText(info.closure.closureDetails.sections.filter((a) => a.id === info.sectionId)[0])]);
    }, error => {
      this.showError(error);
    });
  }

  showError(error) {
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
  }

  getCleanText(section: Section): string {
    if (section.sectionName === '') {
      return String(section.id);
    }
    return section.sectionName.replace(/[^_0-9a-z]/gi, '');
  }

  previewDocument(_for, attach) {
    this.docPreviewService.previewDoc(_for, this.appComp.loggedInUser.id, this.currentClosure.id, attach.id).then((result: any) => {
      let docType = result.url.substring(result.url.lastIndexOf(".") + 1);
      this.dialog.open(DocpreviewComponent, {
        data: {
          url: result.url,
          type: docType,
          title: attach.name + '.' + attach.type,
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

  getForwardFlow() {
    return this.currentClosure.flowAuthorities.filter(a => a.forwardDirection === true);
  }

  getSingleBackwardFlow() {

    if (this.appComp.loggedInUser.organization.organizationType === 'GRANTEE') {
      return this.currentClosure.flowAuthorities.filter(a => a.forwardDirection === false)[0];
    }
    return this.currentClosure.flowAuthorities.filter(a => a.forwardDirection === false)[0];
  }

  hasMultipleBackwardFlow() {
    if (this.appComp.loggedInUser.organization.organizationType === 'GRANTEE') {
      return false;
    }
    const backwardFlows = this.currentClosure.flowAuthorities.filter(a => a.forwardDirection === false);
    return (backwardFlows && backwardFlows.length > 1);
  }

  hasSingleBackwardFlow() {

    if (this.appComp.loggedInUser.organization.organizationType === 'GRANTEE') {
      return true;
    }
    const backwardFlows = this.currentClosure.flowAuthorities.filter(a => a.forwardDirection === false);
    return (backwardFlows && backwardFlows.length === 1);
  }

  returnClosure() {
    let flows = this.currentClosure.flowAuthorities.filter(a => a.forwardDirection === false).filter((v, i, a) => a.findIndex(t => (t.toStateId === v.toStateId)) === i);
    flows.sort((a, b) => {
      if (a.seqOrder > b.seqOrder) {
        return -1;
      }
      if (b.seqOrder > a.seqOrder) {
        return 1;
      } else {
        return 0
      }
    });

    const gtIdx = this.appComp.grantTypes.findIndex(gt => gt.id === this.currentClosure.grant.grantTypeId);
    const grantType = (!gtIdx || gtIdx === -1) ? "External Workflow" : this.appComp.grantTypes[gtIdx].name;
    const title = `<p class="mb-0  text-subheader">Grant Closure Workflow Return | ` + grantType + `<p class='text-header text-center'>` + ((this.currentClosure.grant.grantStatus.internalStatus === 'ACTIVE' || this.currentClosure.grant.grantStatus.internalStatus === 'CLOSED') ? `<span class="text-subheader">[` + this.currentClosure.grant.referenceNo + `] </span>` : ``) + this.currentClosure.grant.name + `</p>`;

    const dg = this.dialog.open(ReturnsPopupComponent, {
      data: { paths: flows, workflows: this.currentClosure.workflowAssignment, title: title },
      panelClass: "center-class",
    });

    dg.afterClosed().subscribe(response => {
      if (response.toStateId !== 0) {
        const toState = this.currentClosure.flowAuthorities.filter(a => a.fromStateId === response.toStateId)[0].fromName;
        const toStateOwner = this.currentClosure.workflowAssignment.filter(a => a.stateId === response.toStateId)[0].assignmentUser;

        this.submitClosure(response.toStateId, "<span class='text-light-red'>Returning to </span>" + toState + "<span class='text-subheader'> [" + toStateOwner.firstName + " " + toStateOwner.lastName + "]</span>", false);
      }
    });
  }

  getStateNameAndOwner(toStateId, forward) {
    let toState;
    if (forward) {
      toState = this.currentClosure.flowAuthorities.filter(a => a.toStateId === toStateId)[0].toName;
    } else {
      toState = this.currentClosure.flowAuthorities.filter(a => a.fromStateId === toStateId)[0].fromName;
    }
    const toStateOwner = this.currentClosure.workflowAssignment.filter(a => a.stateId === toStateId)[0].assignmentUser;

    if (toStateOwner) {
      let activeuser = toStateOwner.active;
      let username = (!activeuser ? ('Unregistered: ' + toStateOwner.emailId) : toStateOwner.firstName + ' ' + toStateOwner.lastName);

      if (activeuser) {
        return toStateOwner ? (toState + "<span class='text-subheader'> [ " + username + " ]</span>") : "";
      } else {
        return toStateOwner ? (toState + "<span class='text-subheader-red' > [ " + username + " ]</span>") : "";
      }
    }

  }

  getFormattedRefundAmount(amount: number): string {

    if (amount) {
      return this.currencyService.getFormattedAmount(amount);
    } else {
      return this.currencyService.getFormattedAmount(0);
    }

  }

  downloadSingleClosureDoc(attachmentId: number) {
    const selectedAttachments = new AttachmentDownloadRequest();
    selectedAttachments.attachmentIds = [];
    selectedAttachments.attachmentIds.push(attachmentId);
    this.docManagementService.callClosureDocsDownload(selectedAttachments, this.appComp, this.currentClosure);
  }

  getReceivedFunds(i) {
    const funds = document.getElementsByClassName('rf');
    return (funds && funds.length) > 0 ? funds[i].innerHTML : this.currencyService.getFormattedAmount(0);
  }

  getPlannedFunds(i) {
    const funds = document.getElementsByClassName('pf');
    return (funds && funds.length) > 0 ? funds[i].innerHTML : '';
  }

  getPlannedDiff(i) {
    let p = 0;
    let r = 0;

    const pf = $('.pf');
    if (!pf || pf.length === 0) {
      return this.currencyService.getFormattedAmount(0);
    }
    const pieces1 = $(pf[i]).html().replace('₹ ', '').split(",")
    p = Number(pieces1.join(""));//.replaceAll(',', ''));

    const rf = $('.rf');
    if (!rf || rf.length === 0) {
      return this.currencyService.getFormattedAmount(p);
    }
    const pieces2 = $(rf[i]).html().replace('₹ ', '').split(",")
    r = Number(pieces2.join(""));//.replaceAll(',', ''));

    return this.currencyService.getFormattedAmount(p - r);
  }
  setUnspentAmount() {

    const disbursement = this.currentClosure.grant.approvedDisbursementsTotal ? this.currentClosure.grant.approvedDisbursementsTotal : 0;
    const spent = this.currentClosure.actualSpent ? this.currentClosure.actualSpent : 0;
    this.unspentAmount = this.currencyService.getFormattedAmount(disbursement - spent);
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


  showFormattedActualSpent(evt: any) {
    this.currentClosure.actualSpent = this.actualSpent;
    evt.currentTarget.style.visibility = "hidden";
    this.grantRefundFormatted.nativeElement.style.visibility = "visible";
  }

  showActualSpentInput(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    this.refundAmount.nativeElement.style.visibility = "visible";
  }


  getRefundAmount() {
    if (this.currentClosure.refundAmount) {
      this.refundRequested = this.currencyService.getFormattedAmount(this.currentClosure.refundAmount);
    } else {
      this.refundRequested = this.currencyService.getFormattedAmount(0);
    }
  }

  getRefundReceived() {
    let total = 0;
    if (this.currentClosure.grant.actualRefunds && this.currentClosure.grant.actualRefunds.length > 0) {
      for (let rf of this.currentClosure.grant.actualRefunds) {
        total += rf.amount ? rf.amount : 0;
      }
      this.refundReceived = this.currencyService.getFormattedAmount(total);
    } else {
      this.refundReceived = this.currencyService.getFormattedAmount(0);
    }
    let refund = this.currentClosure.refundAmount ? this.currentClosure.refundAmount : 0;
    this.pendingRefund = this.currencyService.getFormattedAmount(refund - total);

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

  captureRefund() {
    this.callCreateSectionAPI("Project Refund Details", true);
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

  getActualRefundsTotal() {
    let total = 0;
    if (this.currentClosure.grant.actualRefunds && this.currentClosure.grant.actualRefunds.length > 0) {
      for (let af of this.currentClosure.grant.actualRefunds) {
        total += af.amount ? af.amount : 0
      }
    }
    return this.currencyService.getFormattedAmount(total);
  }
}
