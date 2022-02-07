import { ReturnsPopupComponent } from './../../../returns-popup/returns-popup.component';
import { DocManagementService } from './../../../doc-management.service';
import { DomSanitizer } from '@angular/platform-browser';
import { DocpreviewService } from './../../../docpreview.service';
import { DocpreviewComponent } from './../../../docpreview/docpreview.component';
import { AttachmentDownloadRequest } from 'app/model/dahsboard';
import { WfvalidationService } from './../../../wfvalidation.service';
import { AdminService } from './../../../admin.service';
import { GrantTagsComponent } from './../../../grant-tags/grant-tags.component';
import { Grant, OrgTag } from './../../../model/dahsboard';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { SingleReportDataService } from '../../../single.report.data.service'
import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts';
import { Report, ReportSectionInfo, ReportWorkflowAssignmentModel, ReportWorkflowAssignment } from '../../../model/report'
import { ReportNotesComponent } from '../../../components/reportNotes/reportNotes.component';
import { MatDialog } from '@angular/material';
import { Section, WorkflowStatus, TableData, Attribute } from '../../../model/dahsboard';
import { Configuration } from '../../../model/app-config';
import { User } from '../../../model/user';
import { FieldDialogComponent } from '../../../components/field-dialog/field-dialog.component';
import { AppComponent } from '../../../app.component';
import { TemplateDialogComponent } from '../../../components/template-dialog/template-dialog.component';
import { WfassignmentComponent } from '../../../components/wfassignment/wfassignment.component';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ToastrService, IndividualConfig } from 'ngx-toastr';
import { ActivatedRoute, Router, NavigationStart, NavigationEnd, ActivationEnd, RouterEvent } from '@angular/router';
import { PDFExportComponent } from '@progress/kendo-angular-pdf-export'
import { PDFMarginComponent } from '@progress/kendo-angular-pdf-export'
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { AdminLayoutComponent } from '../../../layouts/admin-layout/admin-layout.component'
import { saveAs } from 'file-saver';
import { TitleCasePipe } from '@angular/common';
import * as indianCurrencyInWords from 'indian-currency-in-words';
import * as inf from 'indian-number-format';
import { WorkflowValidationService } from 'app/workflow-validation-service';
import { ReportValidationService } from 'app/report-validation-service';
import { MessagingComponent } from 'app/components/messaging/messaging.component';
import { CurrencyService } from 'app/currency-service';



@Component({
    selector: 'app-report-preview',
    templateUrl: './report-preview.component.html',
    styleUrls: ['./report-preview.component.scss'],
    providers: [PDFExportComponent, SidebarComponent, TitleCasePipe],
    styles: [`
    ::ng-deep .wf-assignment-class .mat-dialog-container{
        overflow: scroll !important;
    height: calc(100vh - 114px) !important;
    padding-top: 10px !important;
    }
  `]
})
export class ReportPreviewComponent implements OnInit {

    currentReport: Report;
    originalReport: Report;
    langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
    humanizer: HumanizeDuration = new HumanizeDuration(this.langService);
    logoUrl: string;
    reportWorkflowStatuses: WorkflowStatus[];
    tenantUsers: User[];
    wfDisabled: boolean = false;

    @ViewChild('pdf') pdf;
    @ViewChild('createSectionModal') createSectionModal: ElementRef;

    constructor(private singleReportDataService: SingleReportDataService,
        private dialog: MatDialog,
        public appComp: AppComponent,
        private http: HttpClient,
        private toastr: ToastrService,
        private router: Router,
        public adminComp: AdminLayoutComponent,
        private sidebar: SidebarComponent,
        private titlecasePipe: TitleCasePipe,
        private workflowValidationService: WorkflowValidationService,
        private reportValidationService: ReportValidationService,
        private currencyService: CurrencyService,
        private adminService: AdminService,
        private wfValidationService: WfvalidationService,
        private docPreviewService: DocpreviewService,
        private sanitizer: DomSanitizer,
        private docManagementService: DocManagementService
    ) {

        this.singleReportDataService.currentMessage.subscribe((report) => {
            this.currentReport = report;
            this.setDateDuration();
            console.log(this.currentReport);
        });

        if (!this.currentReport) {
            this.router.navigate(['dashboard']);
        }

        this.appComp.reportUpdated.subscribe((statusUpdate) => {
            if (statusUpdate.status && statusUpdate.reportId && this.appComp.loggedInUser !== undefined) {
                let url =
                    "/api/user/" + this.appComp.loggedInUser.id + "/report/" + statusUpdate.reportId;
                const httpOptions = {
                    headers: new HttpHeaders({
                        "Content-Type": "application/json",
                        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
                        Authorization: localStorage.getItem("AUTH_TOKEN"),
                    }),
                };

                this.http.get(url, httpOptions).subscribe((report: Report) => {
                    if (report) {
                        if (this.currentReport && this.currentReport.id === Number(report.id)) {
                            this.singleReportDataService.changeMessage(report);
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
        let url = '/api/app/config/report/' + this.currentReport.id;

        this.http.get(url, httpOptions).subscribe((config: Configuration) => {
            this.reportWorkflowStatuses = config.reportWorkflowStatuses;
            this.appComp.reportWorkflowStatuses = config.reportWorkflowStatuses;
            this.tenantUsers = config.tenantUsers;
            this.appComp.tenantUsers = config.tenantUsers;
            this.appComp.reportTransitions = config.reportTransitions;
        });
    }



    ngOnInit() {

        this.originalReport = JSON.parse(JSON.stringify(this.currentReport));

        const tenantCode = localStorage.getItem('X-TENANT-CODE');
        this.logoUrl = "/api/public/images/" + this.currentReport.grant.grantorOrganization.code + "/logo";

        this.appComp.createNewReportSection.subscribe((val) => {
            if (val) {
                $('.modal-backdrop').remove();

                this.addNewSection();
                this.appComp.createNewReportSection.next(false);
            }
        });
    }

    setDateDuration() {
        if (this.currentReport.startDate && this.currentReport.endDate) {
            var time = new Date(this.currentReport.endDate).getTime() - new Date(this.currentReport.startDate).getTime();
            time = time + 86400001;
            this.currentReport.duration = this.humanizer.humanize(time, { largest: 2, units: ['y', 'mo'], round: true });
        } else {
            this.currentReport.duration = 'Not set';
        }
    }

    submitReport(toStateId: number, transitionTitle: string) {

        /* if ((this.workflowValidationService.getStatusByStatusIdForReport(toStateId, this.appComp).internalStatus === 'ACTIVE' || this.workflowValidationService.getStatusByStatusIdForReport(toStateId, this.appComp).internalStatus === 'CLOSED') && this.reportValidationService.checkIfHeaderHasMissingEntries(this.currentReport)) {
            const dialogRef = this.dialog.open(MessagingComponent, {
                data: "Report has missing header information.",
                panelClass: 'center-class'
            });
            return;
        } */

        for (let assignment of this.currentReport.workflowAssignments) {
            const status1 = this.reportWorkflowStatuses.filter((status) => status.id === assignment.stateId);
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

        this.wfValidationService.validateGrantWorkflow(this.currentReport.id, 'REPORT', this.appComp.loggedInUser.id, this.currentReport.status.id, toStateId).then(result => {
            this.openBottomSheetForReportNotes(toStateId, result, transitionTitle);
            this.wfDisabled = true;
        });

    }

    openBottomSheetForReportNotes(toStateId: number, result, transitionTitle: string): void {

        const _bSheet = this.dialog.open(ReportNotesComponent, {
            hasBackdrop: true,
            data: { canManage: true, currentReport: this.currentReport, originalReport: this.appComp.originalReport, validationResult: result, tTitle: transitionTitle },
            panelClass: 'grant-notes-class'
        });

        _bSheet.afterClosed().subscribe(result => {
            if (result.result) {
                this.submitAndSaveReport(toStateId, result.message);
            } else {
                this.wfDisabled = false;
            }
        });
    }

    showWorkflowAssigments(toStateId) {
        const wfModel = new ReportWorkflowAssignmentModel();
        wfModel.users = this.tenantUsers;
        wfModel.granteeUsers = this.currentReport.granteeUsers;
        wfModel.workflowStatuses = this.reportWorkflowStatuses;
        wfModel.workflowAssignments = this.currentReport.workflowAssignments;
        wfModel.type = this.appComp.currentView;
        wfModel.grantTypes = this.appComp.grantTypes;
        wfModel.report = this.currentReport;
        wfModel.report.grant.isInternal = this.appComp.grantTypes.filter(gt => this.currentReport.grant.grantTypeId)[0].internal;
        wfModel.canManage = this.currentReport.flowAuthorities && this.currentReport.canManage;
        const dialogRef = this.dialog.open(WfassignmentComponent, {
            data: { model: wfModel, userId: this.appComp.loggedInUser.id, appComp: this.appComp, adminComp: this.adminComp },
            panelClass: 'wf-assignment-class'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result.result) {
                const ass: ReportWorkflowAssignment[] = [];
                for (let data of result.data) {
                    const wa = new ReportWorkflowAssignment();
                    wa.id = data.id;
                    wa.stateId = data.stateId;
                    wa.assignmentId = data.userId;
                    wa.customAssignments = data.customAssignments;
                    wa.reportId = data.reportId;
                    ass.push(wa);
                }

                const httpOptions = {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                        'Authorization': localStorage.getItem('AUTH_TOKEN')
                    })
                };

                let url = '/api/user/' + this.appComp.loggedInUser.id + '/report/'
                    + this.currentReport.id + '/assignment';
                this.http.post(url, { report: this.currentReport, assignments: ass }, httpOptions).subscribe((report: Report) => {
                    this.singleReportDataService.changeMessage(report);
                    this.currentReport = report;

                    const toState = this.currentReport.flowAuthorities.filter(a => a.toStateId === toStateId)[0].toName;
                    const toStateOwner = this.currentReport.workflowAssignments.filter(a => a.stateId === toStateId)[0].assignmentUser;
                    this.submitReport(toStateId, "Progessing for " + toState + "<span class='text-subheader'> [" + toStateOwner.firstName + " " + toStateOwner.lastName + "]</span>");
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

    submitAndSaveReport(toStateId: number, message: String) {

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

        const origStatus = this.currentReport.status.name;
        let url = '/api/user/' + this.appComp.loggedInUser.id + '/report/'
            + this.currentReport.id + '/flow/'
            + this.currentReport.status.id + '/' + toStateId;
        this.http.post(url, { report: this.currentReport, note: message }, httpOptions).subscribe((report: Report) => {

            this.singleReportDataService.changeMessage(report);
            this.wfDisabled = false;

            if (report.status.internalStatus === 'DRAFT' || report.status.internalStatus === 'ACTIVE') {
                this.appComp.subMenu = { name: 'Upcoming Reports', action: 'ur' };
            } else if (report.status.internalStatus === 'REVIEW') {
                this.appComp.subMenu = { name: 'Submitted Reports', action: 'sr' };
            } else if (report.status.internalStatus === 'CLOSED') {
                this.appComp.subMenu = { name: 'Approved Reports', action: 'ar' };
            }
            if (!report.template.published && this.appComp.loggedInUser.organization.organizationType !== 'GRANTEE') {
                const dialogRef = this.dialog.open(TemplateDialogComponent, {
                    data: this.currentReport.template.name,
                    panelClass: 'grant-notes-class'
                });

                dialogRef.afterClosed().subscribe(result => {
                    if (result.result) {
                        let url = '/api/user/' + this.appComp.loggedInUser.id + '/report/' + this.currentReport.id + '/template/' + this.currentReport.template.id + '/' + result.name;
                        this.http.put(url, { description: result.desc, publish: true, privateToGrant: false }, httpOptions).subscribe((report: Report) => {
                            this.singleReportDataService.changeMessage(report);
                            //this.appComp.selectedTemplate = grant.grantTemplate;
                            this.fetchCurrentReport();
                        });

                    } else {
                        let url = '/api/user/' + this.appComp.loggedInUser.id + '/report/' + this.currentReport.id + '/template/' + this.currentReport.template.id + '/' + result.name;
                        this.http.put(url, { description: result.desc, publish: true, privateToGrant: true }, httpOptions).subscribe((report: Report) => {
                            this.singleReportDataService.changeMessage(report);
                            //this.appComp.selectedTemplate = grant.grantTemplate;
                            dialogRef.close();
                            this.fetchCurrentReport();
                        });

                    }
                });
            } else {
                this.fetchCurrentReport();
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


    fetchCurrentReport() {

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
        };

        const url = '/api/user/' + this.appComp.loggedInUser.id + '/report/' + this.currentReport.id;
        this.http.get(url, httpOptions).subscribe((updatedReport: Report) => {
            this.singleReportDataService.changeMessage(updatedReport);
            this.currentReport = updatedReport;

            if (this.currentReport.workflowAssignments.filter((a) => a.assignmentId === this.appComp.loggedInUser.id && a.anchor).length === 0) {
                this.appComp.currentView = 'upcoming';
                this.router.navigate(['reports/upcoming']);
            }
        });
    }

    saveAs(filename) {
        this.pdf.saveAs(filename);
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

        const url = '/api/user/' + this.appComp.loggedInUser.id + '/report/' + this.currentReport.id + '/template/' + this.currentReport.template.id + '/section/' + sectionName.val();

        this.http.post<ReportSectionInfo>(url, this.currentReport, httpOptions).subscribe((info: ReportSectionInfo) => {
            this.singleReportDataService.changeMessage(info.report);

            sectionName.val('');
            //$('#section_' + newSection.id).css('display', 'block');
            $(createSectionModal).modal('hide');
            this.appComp.sectionAdded = true;
            this.sidebar.buildSectionsSideNav(null);
            this.appComp.sectionInModification = false;
            //  this.appComp.selectedTemplate = info.report.template;
            this.router.navigate(['report/section/' + this.getCleanText(info.report.reportDetails.sections.filter((a) => a.id === info.sectionId)[0])]);
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

    addNewSection() {
        this.appComp.sectionInModification = true;
        const createSectionModal = this.createSectionModal.nativeElement;
        const titleElem = $(createSectionModal).find('#createSectionLabel');
        $(titleElem).html('Add new section');
        $(createSectionModal).modal('show');
    }

    getCleanText(section: Section): string {
        if (section.sectionName === '') {
            return String(section.id);
        }
        return section.sectionName.replace(/[^_0-9a-z]/gi, '');
    }

    showHistory(type, obj) {
        this.adminComp.showHistory(type, obj);
    }

    showWFAssigments() {
        this.adminComp.showWorkflowAssigments();
    }

    getDocumentName(val: string): any[] {
        let obj;
        if (val !== undefined && val !== "") {
            obj = JSON.parse(val);
        }
        return obj;
    }

    downloadAttachment(reportId: number, fileId: number, docName: string, docType: string) {

        const httpOptions = {
            responseType: 'blob' as 'json',
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
        };

        let url = '/api/user/' + this.appComp.loggedInUser.id + '/report/'
            + reportId + '/file/' + fileId;

        this.http.get(url, httpOptions).subscribe((data) => {
            saveAs(data, docName + "." + docType);
        });

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
        return '₹ ' + String(inf.format(total, 2));
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
        /*for(let row of this.getGrantDisbursementAttribute().fieldTableValue){
            let i=0;
            for(let col of row.columns){
                if(i===idx){
                    total+=(col.value!==undefined && col.value!==null && col.value!=='null')?Number(col.value):0;
                }
                i++;
            }
        }*/
        return String('₹ ' + inf.format(total, 2));
    }

    manageGrant() {
        this.adminComp.manageGrant(null, this.currentReport.grant.id);
    }

    getGrantDisbursementAttribute(): Attribute {
        for (let section of this.currentReport.grant.grantDetails.sections) {
            if (section.attributes) {
                for (let attr of section.attributes) {
                    if (attr.fieldType === 'disbursement') {
                        return attr;
                    }
                }
            }
        }
        return null;
    }

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
        if (!grantType.internal) {
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


    showUnapprovedIndicator(attr: Attribute) {

        if (attr.fieldTableValue) {
            let indicator: string[] = [];
            for (let row of attr.fieldTableValue) {
                if (row.enteredByGrantee && row.status && row.reportId === this.currentReport.id) {
                    if (indicator.findIndex(a => a === '* Indicates unapproved project funds, will be considered as approved project funds on approval of this report.') < 0) {
                        indicator.push("* Indicates unapproved project funds, will be considered as approved project funds on approval of this report.");
                    }
                } else if (row.enteredByGrantee && row.status && row.reportId !== this.currentReport.id) {
                    if (indicator.findIndex(a => a === '') < 0) {
                        indicator.push("");
                    }
                }
            }
            return indicator.join("<br>");
        }
        return null;
    }

    previewDocument(_for, attach) {
        this.docPreviewService.previewDoc(_for, this.appComp.loggedInUser.id, this.currentReport.id, attach.id).then((result: any) => {
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

    downloadSingleDoc(attachmentId: number) {
        const selectedAttachments = new AttachmentDownloadRequest();
        selectedAttachments.attachmentIds = [];
        selectedAttachments.attachmentIds.push(attachmentId);
        this.docManagementService.callReportDocDownload(selectedAttachments, this.appComp, this.currentReport);
    }

    getForwardFlow() {
        const forwardStates = this.currentReport.flowAuthorities.filter(a => a.forwardDirection === true);
        return forwardStates;
    }

    getSingleBackwardFlow() {
        const backwardState = this.currentReport.flowAuthorities.filter(a => a.forwardDirection === false)[0];
        return backwardState;
    }

    hasMultipleBackwardFlow() {
        const backwardFlows = this.currentReport.flowAuthorities.filter(a => a.forwardDirection === false);
        return (backwardFlows && backwardFlows.length > 1);
    }

    hasSingleBackwardFlow() {
        const backwardFlows = this.currentReport.flowAuthorities.filter(a => a.forwardDirection === false);
        return (backwardFlows && backwardFlows.length === 1);
    }

    returnReport() {
        const dg = this.dialog.open(ReturnsPopupComponent, {
            data: { paths: this.currentReport.flowAuthorities.filter(a => a.forwardDirection === false), workflows: this.currentReport.workflowAssignments },
            panelClass: "center-class",
        });

        dg.afterClosed().subscribe(response => {
            if (response.toStateId !== 0) {
                const toState = this.currentReport.flowAuthorities.filter(a => a.fromStateId === response.toStateId)[0].fromName;
                const toStateOwner = this.currentReport.workflowAssignments.filter(a => a.stateId === response.toStateId)[0].assignmentUser;

                this.submitReport(response.toStateId, "<span class='text-light-red'>Returning to </span>" + toState + "<span class='text-subheader'> [" + toStateOwner.firstName + " " + toStateOwner.lastName + "]</span>");
            }
        });
    }

    getStateNameAndOwner(toStateId, forward) {
        let toState;
        if (forward) {
            toState = this.currentReport.flowAuthorities.filter(a => a.toStateId === toStateId)[0].toName;
        } else {
            toState = this.currentReport.flowAuthorities.filter(a => a.fromStateId === toStateId)[0].fromName;
        }
        const toStateOwner = this.currentReport.workflowAssignments.filter(a => a.stateId === toStateId)[0].assignmentUser;

        return toStateOwner ? (toState + "<span class='text-subheader'> [" + toStateOwner.firstName + " " + toStateOwner.lastName + "]</span>") : "";
    }
}
