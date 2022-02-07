import { Grant } from './../../model/dahsboard';
import { Report } from './../../model/report';
import { Component, Inject, OnInit, AfterViewInit, ViewChild, ElementRef, Renderer2, HostListener } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatButtonModule, MatDialog } from '@angular/material';
import { WorkflowAssignmentModel } from '../../model/dahsboard';
import { WorkflowTransition } from '../../model/workflow-transition';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { WorkflowDataService } from 'app/workflow.data.service';
import { User, UserRole } from 'app/model/user';
import { MessagingComponent } from '../messaging/messaging.component';
import { FieldDialogComponent } from '../field-dialog/field-dialog.component';
import { OwnersPopupComponent } from '../owners-popup/owners-popup.component';
import { environment } from 'environments/environment';

declare var $: any;
declare var jsPlumb: any;

@Component({
    selector: 'app-wfassignment-dialog',
    templateUrl: './wfassignment.component.html',
    styleUrls: ['./wfassignment.component.scss'],
    styles: [`
        ::ng-deep .wf-assignment-class .mat-dialog-container{
            overflow: auto !important;
            height: calc(100vh - 114px) !important;
            padding-top: 10px !important;
        }

        ::ng-deep .wf-assignment-class .mat-dialog-container #flowContainer{
            overflow: hidden !important;
            padding-top: 10px !important;
        }
    `]
})
export class WfassignmentComponent implements OnInit, AfterViewInit {

    assignmentData: any;
    transitions: WorkflowTransition[];
    elemRef: ElementRef;
    jsPlumbInstance;
    connections: any[] = [];
    scrollListener;
    canManage: boolean = true;
    @ViewChild("flowContainer") flowContainer: ElementRef;
    title: string;
    previousUser;
    previousNodeOwner;
    activeStateOwnerChanged: boolean;
    grantType: string;
    toggle = false;

    constructor(
        public dialogRef: MatDialogRef<WfassignmentComponent>
        , @Inject(MAT_DIALOG_DATA) public data: any
        , private http: HttpClient
        , private renderer: Renderer2
        , @Inject(ElementRef) er: ElementRef
        , private toastr: ToastrService
        , private workflowDataService: WorkflowDataService
        , private dialog: MatDialog
    ) {
        this.dialogRef.disableClose = true;
        this.elemRef = er;
    }


    ngOnInit() {
        if (this.data.model.users) {
            this.data.model.users = this.data.model.users.filter(u => u.active);
            this.data.model.users.sort(function (a, b) { return (a.firstName.toLowerCase() > b.firstName.toLowerCase()) ? 1 : ((b.firstName.toLowerCase() > a.firstName.toLowerCase()) ? -1 : 0); });
        }
        if (this.data.model.granteeUsers) {
            this.data.model.granteeUsers.sort(function (a, b) {
                if (!a.firstName) {
                    a.firstName = 'Un-registered';
                }
                if (!b.firstName) {
                    b.firstName = 'Un-registered';
                }
                return (a.firstName.toLowerCase() > b.firstName.toLowerCase()) ? 1 : ((b.firstName.toLowerCase() > a.firstName.toLowerCase()) ? -1 : 0);
            });
        }

        window.addEventListener('scroll', this.redrawOnScroll.bind(this), true);
        if (this.data.model.type === 'grant') {
            const gtIdx = this.data.model.grantTypes.findIndex(gt => gt.id === this.data.model.grant.grantTypeId);
            this.grantType = (!gtIdx || gtIdx === -1) ? "External Workflow" : this.data.model.grantTypes[gtIdx].name;
            this.title = `<p class="mb-0  text-subheader">Grant Workflow | ` + this.grantType + `<p class='text-header'>` + ((this.data.model.grant.grantStatus.internalStatus === 'ACTIVE' || this.data.model.grant.grantStatus.internalStatus === 'CLOSED') ? `<span class="text-subheader">[` + this.data.model.grant.referenceNo + `] </span>` : ``) + this.data.model.grant.name + `</p>`;
            const httpOptions = {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                    'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                    'Authorization': localStorage.getItem('AUTH_TOKEN')
                })
            };
            const url = '/api/admin/workflow/grant/' + this.data.model.grant.id + '/user/' + this.data.userId;

            this.http.get<WorkflowTransition[]>(url, httpOptions).subscribe((transitions: WorkflowTransition[]) => {
                this.transitions = transitions;

                let counter = 1;

                for (let transition of transitions) {
                    const nodeId = 'state_' + transition.fromStateId;
                    if (this.elemRef.nativeElement.querySelector('#' + nodeId) === null) {
                        const node = this.renderer.createElement('div');
                        this.renderer.addClass(node, this.getColorCodeByStatus(this.data.model.workflowStatuses.filter((status) => status.id === transition.fromStateId)[0].internalStatus));
                        /* if (transition._from === 'GMT Review') {
                            this.renderer.setStyle(node, 'position', 'relative');
                            this.renderer.setStyle(node, 'left', '200px');
                        }
                        if (transition._from === 'GMT Review 2') {
                            this.renderer.setStyle(node, 'position', 'relative');
                            this.renderer.setStyle(node, 'left', '-200px');
                        } */
                        /* if (this.data.model.workflowStatuses.filter((status) => status.id === transition.fromStateId)[0].internalStatus === 'DRAFT') {
                            const notesNode = this.renderer.createElement('span');
                            this.renderer.appendChild(notesNode, this.renderer.createText('Workflow Note(s)'));
                            this.renderer.setAttribute(notesNode, 'style', 'position: absolute; right: 7px; cursor: pointer; box-shadow: 2px 2px 4px #d3d3d3; padding: 2px 4px; border-radius: 4px; font-size: 12px;text-transform: none; font-weight: 400;');
                            this.renderer.listen(notesNode, 'click', () => {
                                this.data.adminComp.showHistory('grant', this.data.model.grant);
                            });
                            this.renderer.appendChild(node, notesNode);
                        } */


                        const stateNode = this.renderer.createElement('div');
                        this.renderer.addClass(stateNode, 'col-12');
                        this.renderer.addClass(stateNode, 'p-0');
                        this.renderer.addClass(stateNode, 'text-center');
                        const nodeStateName = this.renderer.createText(transition._from);
                        this.renderer.appendChild(stateNode, nodeStateName);
                        this.renderer.appendChild(node, stateNode);
                        if (transition.fromStateId === this.data.model.grant.grantStatus.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fas');
                            this.renderer.addClass(indicator, 'fa-book-reader');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.listen(indicator, 'click', () => {
                                this.data.adminComp.showHistory('grant', this.data.model.grant);
                            });
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(stateNode, indicator);

                        }

                        const ownerNode = this.renderer.createElement('div');
                        //this.renderer.addClass(ownerNode, 'col-6');
                        this.renderer.addClass(ownerNode, 'mt-2');
                        this.renderer.setAttribute(ownerNode, 'style', 'position: absolute;right: -125px;top: 15px;');
                        //this.renderer.setStyle(ownerNode, 'right', '0');
                        const nodeOwner = this.renderer.createElement('select');
                        this.renderer.addClass(nodeOwner, 'anu-select');
                        this.renderer.addClass(nodeOwner, 'anu-wf-input');



                        this.renderer.setAttribute(nodeOwner, 'style', 'font-weight: 400;text-transform: initial;left: -95px;top: 23px;text-decoration: none;max-width: 125px;z-index: 1;background-color: rgba(200, 200, 200, 0.05) !important;border: none !important;');
                        const currentUserAssignment = this.data.model.workflowAssignment.filter((assignment) => assignment.assignments === JSON.parse(localStorage.getItem('USER')).id && assignment.stateId === this.data.model.grant.grantStatus.id);
                        const ownerUser = this.data.model.workflowAssignment.filter((assignment) => assignment.assignments === JSON.parse(localStorage.getItem('USER')).id && assignment.anchor);

                        const roles: UserRole[] = JSON.parse(localStorage.getItem('USER')).userRoles;
                        let isAdminRole: boolean = false;
                        if (roles.filter(a => a.role.name === 'Admin').length > 0) {
                            isAdminRole = true;
                        }

                        const loggedInUser: User = JSON.parse(localStorage.getItem('USER'));
                        if (((currentUserAssignment.length > 0 || (ownerUser.length > 0) || isAdminRole) && this.data.model.grant.grantStatus.internalStatus !== 'ACTIVE' && this.data.model.grant.grantStatus.internalStatus !== 'CLOSED') && loggedInUser.organization.organizationType !== 'GRANTEE') {
                        } else {


                            this.canManage = false;
                            this.renderer.setAttribute(nodeOwner, 'disabled', 'disabled');

                            if ((currentUserAssignment.length > 0 || isAdminRole) && this.data.model.grant.grantStatus.internalStatus === 'ACTIVE' && transition.internalStatus == 'ACTIVE' && loggedInUser.organization.organizationType !== 'GRANTEE') {
                                this.canManage = true;
                                this.renderer.removeAttribute(nodeOwner, 'disabled');
                            }
                        }

                        this.renderer.addClass(nodeOwner, 'ml-0');
                        this.renderer.addClass(nodeOwner, 'px-2');
                        this.renderer.addClass(nodeOwner, 'text-left');
                        //this.renderer.addClass(nodeOwner,'');
                        const assignment = this.data.model.workflowAssignment.filter((assignment) => assignment.stateId === transition.fromStateId);
                        if (assignment.length > 0) {
                            this.renderer.setAttribute(nodeOwner, 'value', assignment[0].assignmentUser ? String(assignment[0].assignmentUser.id) : String(0));
                            this.renderer.setAttribute(nodeOwner, 'id', 'assignment_' + assignment[0].id + '_' + transition.fromStateId + '_' + this.data.model.grant.id);
                            this.renderer.setAttribute(nodeOwner, 'data-counter', String(counter++));
                            if (assignment[0].assignments === 0) {
                                this.renderer.setStyle(nodeOwner, 'color', '#ffbf00');
                            }
                            this.renderer.listen(nodeOwner, 'change', (event) => this.handleSelection(event));
                        } else {
                            this.renderer.setAttribute(nodeOwner, 'id', 'assignment_' + transition.fromStateId + '_' + this.data.model.grant.id);
                            this.renderer.setAttribute(nodeOwner, 'data-counter', String(counter++));
                            this.renderer.listen(nodeOwner, 'change', (event) => this.handleSelection(event));
                        }
                        const nodeOwnerOptions = this.renderer.createElement('option');
                        this.renderer.setAttribute(nodeOwnerOptions, 'value', '0');
                        this.renderer.appendChild(nodeOwnerOptions, document.createTextNode('-- Assign Approver --'));
                        this.renderer.appendChild(nodeOwner, nodeOwnerOptions);
                        for (let option of this.data.model.users) {
                            const nodeOwnerOptions = this.renderer.createElement('option');
                            this.renderer.setAttribute(nodeOwnerOptions, 'value', String(option.id));


                            if (assignment.length > 0 && (assignment[0].assignmentUser ? Number(assignment[0].assignmentUser.id) : 0) === Number(option.id)) {
                                this.renderer.setAttribute(nodeOwnerOptions, 'selected', 'selected');
                            }
                            let username = option.firstName + ' ' + option.lastName + this.getRoles(option);

                            if (option.deleted) {
                                username = '[Disabled] ' + username;
                                this.renderer.setAttribute(nodeOwnerOptions, 'disabled', 'disabled');
                            } else {
                                this.renderer.setStyle(nodeOwnerOptions, 'color', 'initial');
                            }

                            this.renderer.appendChild(nodeOwnerOptions, document.createTextNode(username));
                            this.renderer.appendChild(nodeOwner, nodeOwnerOptions);

                        }

                        //this.renderer.addClass(nodeOwner,'anu-wf-input');
                        this.renderer.appendChild(ownerNode, nodeOwner);
                        this.renderer.appendChild(stateNode, ownerNode);

                        const assForHistory = this.data.model.workflowAssignment.filter(a => a.stateId === transition.fromStateId);
                        if (assForHistory && assForHistory.length > 0 && assForHistory[0].history && assForHistory[0].history.length > 0) {
                            const historyNode = this.renderer.createElement('div');
                            //this.renderer.addClass(historyNode, 'col-7');
                            this.renderer.addClass(historyNode, 'text-right');
                            const histLink = this.renderer.createElement('a');
                            this.renderer.setAttribute(histLink, 'style', 'font-size: 9px;color: #bbbbbb;padding: 4px 6px;font-weight: 400;text-transform: initial;right: 53px;border: 1px #e0dfdf solid;background: rgba(200, 200, 200, 0.05) !important;border-radius: 4px;top: 20px;');
                            this.renderer.appendChild(histLink, this.renderer.createText("Past Approver(s)"));
                            this.renderer.listen(histLink, 'click', (event) => this.showOwners(event, assForHistory[0].history, 'Past Approver(s)'));
                            this.renderer.appendChild(historyNode, histLink);
                            this.renderer.appendChild(ownerNode, historyNode);
                        } else {
                            const historyNode = this.renderer.createElement('div');
                            this.renderer.addClass(historyNode, 'col-7');
                            this.renderer.addClass(historyNode, 'text-right');
                            const histLink = this.renderer.createElement('a');
                            this.renderer.setAttribute(histLink, 'style', 'font-size: 9px;color: #535353;padding: 4px 6px;font-weight: 400;text-transform: initial;left: -45px;position: relative;border: 1px #e0dfdf solid;background: #f8f8f8;border-radius: 4px;top: 5px;visibility:hidden;');
                            this.renderer.appendChild(histLink, this.renderer.createText("Past Approver(s)"));
                            this.renderer.appendChild(historyNode, histLink);
                            this.renderer.appendChild(ownerNode, historyNode);
                        }

                        this.previousNodeOwner = nodeOwner;



                        this.renderer.setAttribute(node, 'id', nodeId);
                        this.renderer.addClass(node, 'state-node');

                        this.renderer.addClass(node, 'my-5');
                        this.renderer.appendChild(this.flowContainer.nativeElement, node);
                    }


                }
                for (let transition of transitions) {
                    const nodeId = 'state_' + transition.toStateId;
                    if (this.elemRef.nativeElement.querySelector('#' + nodeId) === null) {
                        const node = this.renderer.createElement('div');
                        const nodeStateName = this.renderer.createText(transition._to);
                        const stateNode = this.renderer.createElement('div');




                        this.renderer.addClass(stateNode, 'col-12');
                        this.renderer.addClass(stateNode, 'p-0');
                        this.renderer.addClass(stateNode, 'text-center');
                        this.renderer.addClass(node, this.getColorCodeByStatus(this.data.model.workflowStatuses.filter((status) => status.id === transition.toStateId)[0].internalStatus));
                        this.renderer.appendChild(stateNode, nodeStateName);
                        this.renderer.appendChild(node, stateNode);
                        if (transition.toStateId === this.data.model.grant.grantStatus.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fas');
                            this.renderer.addClass(indicator, 'fa-book-reader');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.listen(indicator, 'click', () => {
                                this.data.adminComp.showHistory('grant', this.data.model.grant);
                            });
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(stateNode, indicator);
                        }

                        if (this.data.model.grant.grantStatus.internalStatus === 'CLOSED') {
                            const ass = this.data.model.workflowAssignment.filter((assignment) => assignment.stateId === this.data.model.grant.grantStatus.id);
                            const ownerNodeHolder = this.renderer.createElement('div');
                            this.renderer.addClass(ownerNodeHolder, 'col-12');
                            const ownerNode = this.renderer.createElement('div');
                            this.renderer.addClass(ownerNode, 'px-2');
                            this.renderer.addClass(ownerNode, 'anu-wf-input');
                            this.renderer.addClass(ownerNode, 'closed-state-owner');
                            this.renderer.addClass(ownerNodeHolder, 'text-center');
                            const ownerName = this.renderer.createText(ass[0].assignmentUser.firstName + " " + ass[0].assignmentUser.lastName);
                            this.renderer.appendChild(ownerNode, ownerName);
                            this.renderer.appendChild(ownerNodeHolder, ownerNode);
                            this.renderer.appendChild(node, ownerNodeHolder);
                        }


                        this.renderer.setAttribute(node, 'id', nodeId);
                        this.renderer.addClass(node, 'state-node');
                        this.renderer.addClass(node, 'my-5');
                        this.renderer.appendChild(this.flowContainer.nativeElement, node);


                    }
                }

                jsPlumb.Defaults.Endpoint = "Blank";
                this.jsPlumbInstance = jsPlumb.getInstance(jsPlumb.Defaults);

                this.showFlow(this.transitions);

                $('.owner-class').on('change', function () {
                    this.onYesClick();
                });

                this.updateGrantAndDisbursementUsers();

            },
                error => {
                    const errorMsg = error as HttpErrorResponse;
                    //console.log(error);
                    this.toastr.error(errorMsg.error.message, errorMsg.error.messageTitle, {
                        enableHtml: true
                    });
                    this.dialogRef.close(false);
                });
        } else if (this.data.model.type === 'report') {

            const gtIdx = this.data.model.grantTypes.findIndex(gt => gt.id === this.data.model.report.grant.grantTypeId);
            this.grantType = (!gtIdx || gtIdx === -1) ? "External Workflow" : this.data.model.grantTypes[gtIdx].name;
            this.title = `<p class="mb-0 text-subheader">Report Workflow | ` + this.grantType + `<p class="mb-0 lh-12"><span class='text-header'>` + this.data.model.report.name + `</span></p><p class="mb-1 lh-20"><span class="text-subheader">` + ((this.data.model.report.grant.grantStatus.internalStatus === 'ACTIVE' || this.data.model.report.grant.grantStatus.internalStatus === 'CLOSED') ? `<span>[` + this.data.model.report.grant.referenceNo + `] </span>` : ``) + this.data.model.report.grant.name + `</span></p>`;
            const httpOptions = {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                    'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                    'Authorization': localStorage.getItem('AUTH_TOKEN')
                })
            };
            const url = '/api/admin/workflow/report/' + this.data.model.report.id + '/user/' + this.data.userId;

            this.http.get<WorkflowTransition[]>(url, httpOptions).subscribe((transitions: WorkflowTransition[]) => {
                this.transitions = transitions;

                for (let transition of transitions) {
                    const nodeId = 'state_' + transition.fromStateId;
                    if (this.elemRef.nativeElement.querySelector('#' + nodeId) === null) {
                        const node = this.renderer.createElement('div');

                        this.renderer.addClass(node, this.getColorCodeByStatusForReport(this.data.model.workflowStatuses.filter((status) => status.id === transition.fromStateId)[0].internalStatus, this.data.model.report));
                        /* if (this.data.model.workflowStatuses.filter((status) => status.id === transition.fromStateId)[0].internalStatus === 'DRAFT') {
                            const notesNode = this.renderer.createElement('span');
                            this.renderer.appendChild(notesNode, this.renderer.createText('Workflow Note(s)'));
                            this.renderer.setAttribute(notesNode, 'style', 'position: absolute; right: 7px; cursor: pointer; box-shadow: 2px 2px 4px #d3d3d3; padding: 2px 4px; border-radius: 4px; font-size: 12px;text-transform: none; font-weight: 400;');
                            this.renderer.listen(notesNode, 'click', () => {
                                this.data.adminComp.showHistory('report', this.data.model.report);
                            });
                            this.renderer.appendChild(node, notesNode);
                        } */

                        const stateNode = this.renderer.createElement('div');
                        this.renderer.addClass(stateNode, 'col-12');
                        this.renderer.addClass(stateNode, 'p-0');
                        this.renderer.addClass(stateNode, 'text-center');
                        let nodeStateName;
                        if (transition.internalStatus !== 'ACTIVE') {
                            nodeStateName = this.renderer.createText(transition._from);
                        } else {
                            nodeStateName = this.renderer.createText(this.data.model.report.grant.isInternal ? transition._from : this.data.model.report.grant.organization.name);
                        }
                        this.renderer.appendChild(stateNode, nodeStateName);
                        this.renderer.appendChild(node, stateNode);

                        if (transition.fromStateId === this.data.model.report.status.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fas');
                            this.renderer.addClass(indicator, 'fa-book-reader');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.listen(indicator, 'click', () => {
                                this.data.adminComp.showHistory('report', this.data.model.report);
                            });
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(stateNode, indicator);
                        }

                        const ownerNode = this.renderer.createElement('div');
                        //this.renderer.addClass(ownerNode, 'col-6');
                        this.renderer.addClass(ownerNode, 'mt-2');
                        this.renderer.setAttribute(ownerNode, 'style', 'position: absolute;right: -125px;top: 15px;display: flex;flex-direction: column;');
                        //this.renderer.setStyle(ownerNode, 'right', '0');
                        const nodeOwner = this.renderer.createElement('select');
                        this.renderer.setAttribute(nodeOwner, 'style', 'font-weight: 400;text-transform: initial;left: -95px;top: 23px;text-decoration: none;max-width: 125px;z-index: 1;background-color: rgba(200, 200, 200, 0.05) !important;border: none !important;');
                        this.renderer.addClass(nodeOwner, 'anu-select');
                        this.renderer.addClass(nodeOwner, 'anu-wf-input');
                        const currentUserAssignment = this.data.model.workflowAssignments.filter((assignment) => assignment.assignmentId === JSON.parse(localStorage.getItem('USER')).id && assignment.stateId === this.data.model.report.status.id && JSON.parse(localStorage.getItem('USER')).organization.organizationType !== 'GRANTEE');
                        const ownerUser = this.data.model.workflowAssignments.filter((assignment) => assignment.assignmentId === JSON.parse(localStorage.getItem('USER')).id && assignment.anchor);
                        if (currentUserAssignment.length > 0 || (ownerUser.length > 0)) {
                        } else {
                            this.canManage = false;
                            this.renderer.setAttribute(nodeOwner, 'disabled', 'disabled');
                        }
                        this.renderer.addClass(nodeOwner, 'ml-0');
                        this.renderer.addClass(nodeOwner, 'px-2');
                        this.renderer.addClass(nodeOwner, 'text-left');
                        //this.renderer.addClass(nodeOwner,'');
                        const assignment = this.data.model.workflowAssignments.filter((assignment) => assignment.stateId === transition.fromStateId);
                        if (assignment.length > 0) {
                            this.renderer.setAttribute(nodeOwner, 'value', assignment[0].assignmentUser ? String(assignment[0].assignmentUser.id) : String(0));
                            this.renderer.setAttribute(nodeOwner, 'id', 'assignment_' + assignment[0].id + '_' + transition.fromStateId + '_' + this.data.model.report.id);
                            this.renderer.listen(nodeOwner, 'change', (event) => this.handleSelection(event));
                            if (assignment[0].assignment === 0) {
                                this.renderer.setStyle(nodeOwner, 'color', '#ffbf00');
                            }
                        } else {
                            this.renderer.setAttribute(nodeOwner, 'id', 'assignment_' + transition.fromStateId + '_' + this.data.model.report.id);
                            this.renderer.listen(nodeOwner, 'change', (event) => this.handleSelection(event));
                        }
                        const nodeOwnerOptions = this.renderer.createElement('option');
                        this.renderer.setAttribute(nodeOwnerOptions, 'value', '0');

                        if (this.data.model.workflowStatuses.filter((status) => status.id === transition.fromStateId)[0].internalStatus !== 'ACTIVE') {
                            this.renderer.appendChild(nodeOwnerOptions, document.createTextNode('-- Assign Approver --'));
                            this.renderer.appendChild(nodeOwner, nodeOwnerOptions);
                            for (let option of this.data.model.users) {
                                const nodeOwnerOptions = this.renderer.createElement('option');
                                this.renderer.setAttribute(nodeOwnerOptions, 'value', String(option.id));


                                if (assignment.length > 0 && (assignment[0].assignmentUser ? Number(assignment[0].assignmentUser.id) : 0) === Number(option.id)) {
                                    this.renderer.setAttribute(nodeOwnerOptions, 'selected', 'selected');
                                }
                                let username = option.firstName + ' ' + option.lastName + this.getRoles(option);

                                if (option.deleted) {
                                    username = '[Disabled] ' + username;
                                    this.renderer.setAttribute(nodeOwnerOptions, 'disabled', 'disabled');
                                } else {
                                    this.renderer.setStyle(nodeOwnerOptions, 'color', 'initial');
                                }
                                this.renderer.appendChild(nodeOwnerOptions, document.createTextNode(username));
                                this.renderer.appendChild(nodeOwner, nodeOwnerOptions);

                            }
                        } else {
                            if (this.canManage) {
                                const nodeInvite = this.renderer.createElement('input');
                                this.renderer.setAttribute(nodeInvite, 'placeholder', 'Invite Grantee/Partner User');
                                this.renderer.addClass(nodeInvite, 'anu-wf-input');
                                this.renderer.addClass(nodeOwner, 'anu-select');
                                this.renderer.setAttribute(nodeInvite, 'style', 'width: 100%;text-align: center;max-width: 125px;');
                                this.renderer.setAttribute(nodeInvite, 'id', 'custom_assignment');
                                this.renderer.appendChild(ownerNode, nodeInvite);
                                if (this.data.model.granteeUsers) {
                                    this.renderer.appendChild(nodeOwnerOptions, document.createTextNode('-- Assign Grantee/Partner User --'));
                                    this.renderer.appendChild(nodeOwner, nodeOwnerOptions);
                                    for (let option of this.data.model.granteeUsers) {
                                        const nodeOwnerOptions = this.renderer.createElement('option');
                                        this.renderer.setAttribute(nodeOwnerOptions, 'value', String(option.id));
                                        if (assignment.length > 0 && (assignment[0].assignmentUser ? Number(assignment[0].assignmentUser.id) : 0) === Number(option.id)) {
                                            this.renderer.setAttribute(nodeOwnerOptions, 'selected', 'selected');
                                        }
                                        let username = (!option.active ? ('Unregistered: ' + option.emailId) : option.firstName + ' ' + option.lastName) + ' [' + option.organization.name + ']';
                                        if (option.deleted) {
                                            username = '[Disabled] ' + username;
                                            this.renderer.setAttribute(nodeOwnerOptions, 'disabled', 'disabled');
                                        }
                                        this.renderer.appendChild(nodeOwnerOptions, document.createTextNode(username));
                                        this.renderer.appendChild(nodeOwner, nodeOwnerOptions);
                                    }
                                }
                            } else {
                                if (this.data.model.granteeUsers) {
                                    for (let option of this.data.model.granteeUsers) {
                                        const nodeOwnerOptions = this.renderer.createElement('option');
                                        this.renderer.setAttribute(nodeOwnerOptions, 'value', String(option.id));
                                        if (assignment.length > 0 && (assignment[0].assignmentUser ? Number(assignment[0].assignmentUser.id) : 0) === Number(option.id)) {
                                            this.renderer.setAttribute(nodeOwnerOptions, 'selected', 'selected');
                                        }
                                        let username = (!option.active ? ('Unregistered: ' + option.emailId) : option.firstName + ' ' + option.lastName) + ' [' + option.organization.name + ']';
                                        if (option.deleted) {
                                            username = '[Disabled] ' + username;
                                            this.renderer.setAttribute(nodeOwnerOptions, 'disabled', 'disabled');
                                        }
                                        this.renderer.appendChild(nodeOwnerOptions, document.createTextNode(username));
                                        this.renderer.appendChild(nodeOwner, nodeOwnerOptions);
                                    }
                                }

                            }
                        }

                        //this.renderer.addClass(nodeOwner,'anu-wf-input');
                        this.renderer.appendChild(ownerNode, nodeOwner);
                        this.renderer.appendChild(stateNode, ownerNode);

                        const assForHistory = this.data.model.workflowAssignments.filter(a => a.stateId === transition.fromStateId);
                        if (assForHistory && assForHistory.length > 0 && assForHistory[0].history && assForHistory[0].history.length > 0) {
                            const historyNode = this.renderer.createElement('div');
                            //this.renderer.addClass(historyNode, 'col-7');
                            this.renderer.addClass(historyNode, 'text-right');
                            const histLink = this.renderer.createElement('a');
                            this.renderer.setAttribute(histLink, 'style', 'font-size: 9px;color: #bbbbbb;padding: 4px 6px;font-weight: 400;text-transform: initial;right: 53px;border: 1px #e0dfdf solid;background: rgba(200, 200, 200, 0.05) !important;border-radius: 4px;top: 20px;');
                            if (transition.internalStatus !== 'ACTIVE') {
                                this.renderer.appendChild(histLink, this.renderer.createText("Past Approver(s)"));
                                this.renderer.listen(histLink, 'click', (event) => this.showOwners(event, assForHistory[0].history, 'Past Approver(s)'));
                            } else {
                                this.renderer.appendChild(histLink, this.renderer.createText("Past Assignee(s)"));
                                this.renderer.listen(histLink, 'click', (event) => this.showOwners(event, assForHistory[0].history, 'Past Assignee(s)'));
                            }

                            this.renderer.appendChild(historyNode, histLink);
                            this.renderer.appendChild(ownerNode, historyNode);
                        } else {
                            const historyNode = this.renderer.createElement('div');
                            this.renderer.addClass(historyNode, 'col-7');
                            this.renderer.addClass(historyNode, 'text-right');
                            const histLink = this.renderer.createElement('a');
                            this.renderer.setAttribute(histLink, 'style', 'font-size: 9px;color: #535353;padding: 4px 6px;font-weight: 400;text-transform: initial;left: -45px;position: relative;border: 1px #e0dfdf solid;background: #f8f8f8;border-radius: 4px;top: 5px;visibility:hidden;');
                            this.renderer.appendChild(histLink, this.renderer.createText("Past Approver(s)"));
                            this.renderer.appendChild(historyNode, histLink);
                            this.renderer.appendChild(ownerNode, historyNode);
                        }





                        this.renderer.setAttribute(node, 'id', nodeId);
                        this.renderer.addClass(node, 'state-node');

                        this.renderer.addClass(node, 'my-5');
                        this.renderer.appendChild(this.flowContainer.nativeElement, node);
                    }

                }
                for (let transition of transitions) {
                    const nodeId = 'state_' + transition.toStateId;
                    if (this.elemRef.nativeElement.querySelector('#' + nodeId) === null) {
                        const node = this.renderer.createElement('div');
                        /* if (transition.toStateId === this.data.model.report.status.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'far');
                            this.renderer.addClass(indicator, 'fa-file-alt');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.listen(indicator, 'click', () => {
                                this.data.adminComp.showHistory('report', this.data.model.report);
                            });
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(node, indicator);
                        } */
                        const nodeStateName = this.renderer.createText(transition._to);
                        const stateNode = this.renderer.createElement('div');
                        this.renderer.addClass(stateNode, 'col-12');
                        this.renderer.addClass(stateNode, 'p-0');
                        this.renderer.addClass(stateNode, 'text-center');
                        this.renderer.addClass(node, this.getColorCodeByStatus(this.data.model.workflowStatuses.filter((status) => status.id === transition.toStateId)[0].internalStatus));
                        this.renderer.appendChild(stateNode, nodeStateName);

                        this.renderer.appendChild(node, stateNode);

                        if (transition.toStateId === this.data.model.report.status.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fas');
                            this.renderer.addClass(indicator, 'fa-book-reader');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.listen(indicator, 'click', () => {
                                this.data.adminComp.showHistory('report', this.data.model.report);
                            });
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(stateNode, indicator);
                        }
                        if (this.data.model.report.status.internalStatus === 'CLOSED') {
                            const ass = this.data.model.workflowAssignments.filter((assignment) => assignment.stateId === this.data.model.report.status.id);
                            const ownerNodeHolder = this.renderer.createElement('div');
                            this.renderer.addClass(ownerNodeHolder, 'col-6');
                            const ownerNode = this.renderer.createElement('div');
                            this.renderer.addClass(ownerNode, 'px-2');
                            this.renderer.addClass(ownerNode, 'anu-wf-input');
                            this.renderer.addClass(ownerNode, 'closed-state-owner');
                            this.renderer.addClass(ownerNodeHolder, 'text-center');
                            const ownerName = this.renderer.createText(ass[0].assignmentUser.firstName + " " + ass[0].assignmentUser.lastName);
                            this.renderer.appendChild(ownerNode, ownerName);
                            this.renderer.appendChild(ownerNodeHolder, ownerNode);
                            this.renderer.appendChild(node, ownerNodeHolder);
                        }
                        this.renderer.setAttribute(node, 'id', nodeId);
                        this.renderer.addClass(node, 'state-node');
                        this.renderer.addClass(node, 'my-5');
                        this.renderer.addClass(node, 'text-center');
                        this.renderer.appendChild(this.flowContainer.nativeElement, node);


                    }
                }

                jsPlumb.Defaults.Endpoint = "Blank";
                this.jsPlumbInstance = jsPlumb.getInstance(jsPlumb.Defaults);
                //this.jsPlumbInstance.setContainer($('#flowContainer'));
                this.showFlow(this.transitions);

                $('.owner-class').on('change', function () {
                    this.onYesClick();
                });
                this.updateReportUsers();
            },
                error => {
                    const errorMsg = error as HttpErrorResponse;
                    //console.log(error);
                    this.toastr.error(errorMsg.error.message, errorMsg.error.messageTitle, {
                        enableHtml: true
                    });
                    this.dialogRef.close(false);
                });
        } else if (this.data.model.type === 'grant-closure') {
            const gtIdx = this.data.model.grantTypes.findIndex(gt => gt.id === this.data.model.closure.grant.grantTypeId);
            this.grantType = (!gtIdx || gtIdx === -1) ? "External Workflow" : this.data.model.grantTypes[gtIdx].name;
            this.title = `<p class="mb-0  text-subheader">Grant Workflow | ` + this.grantType + `<p class='text-header'>` + ((this.data.model.closure.grant.grantStatus.internalStatus === 'ACTIVE' || this.data.model.grant.grantStatus.internalStatus === 'CLOSED') ? `<span class="text-subheader">[` + this.data.model.closure.grant.referenceNo + `] </span>` : ``) + this.data.model.closure.grant.name + `</p>`;

            //this.title = `<p class="mb-0 text-header">Closure Request Workflow for Grant ` + this.data.model.closure.grant.name + `</p>`;
            const httpOptions = {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                    'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                    'Authorization': localStorage.getItem('AUTH_TOKEN')
                })
            };
            const url = '/api/admin/workflow/closure/' + this.data.model.closure.id + '/user/' + this.data.userId;

            this.http.get<WorkflowTransition[]>(url, httpOptions).subscribe((transitions: WorkflowTransition[]) => {
                this.transitions = transitions;

                let counter = 0;
                for (let transition of transitions) {
                    const nodeId = 'state_' + transition.fromStateId;
                    if (this.elemRef.nativeElement.querySelector('#' + nodeId) === null) {
                        const node = this.renderer.createElement('div');
                        this.renderer.addClass(node, this.getColorCodeByStatusForClosure(this.data.model.workflowStatuses.filter((status) => status.id === transition.fromStateId)[0].internalStatus, this.data.model.closure));
                        /* if (transition.fromStateId === this.data.model.closure.status.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fas');
                            this.renderer.addClass(indicator, 'fa-book-reader');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(node, indicator);
                        } */
                        /* const historyNode = this.renderer.createElement('div');
                        this.renderer.addClass(historyNode, 'col-3');
                        const assForHistory = this.data.model.workflowAssignments.filter(a => a.stateId === transition.fromStateId);
                        if (assForHistory && assForHistory.length > 0 && assForHistory[0].history && assForHistory[0].history.length > 0) {
                            const histLink = this.renderer.createElement('a');
                            this.renderer.setAttribute(histLink, 'style', 'font-size: 9px; color: #000; border-radius: 3px; padding: 4px 6px; box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.5); font-weight: 400; background: rgba(200,200,200,0.95); text-transform: initial;');
                            if (transition.internalStatus !== 'ACTIVE') {
                                this.renderer.appendChild(histLink, this.renderer.createText("Past Approver(s)"));
                                this.renderer.listen(histLink, 'click', (event) => this.showOwners(event, assForHistory[0].history, 'Past Approver(s)'));
                            } else {
                                this.renderer.appendChild(histLink, this.renderer.createText("Past Assignee(s)"));
                                this.renderer.listen(histLink, 'click', (event) => this.showOwners(event, assForHistory[0].history, 'Past Assignee(s)'));
                            }

                            this.renderer.appendChild(historyNode, histLink);
                        }
                        this.renderer.appendChild(node, historyNode); */

                        const stateNode = this.renderer.createElement('div');
                        this.renderer.addClass(stateNode, 'col-12');
                        this.renderer.addClass(stateNode, 'p-0');
                        this.renderer.addClass(stateNode, 'text-center');
                        let nodeStateName;
                        if (transition.internalStatus !== 'ACTIVE') {
                            nodeStateName = this.renderer.createText(transition._from);
                        } else {
                            nodeStateName = this.renderer.createText(this.data.model.closure.grant.isInternal ? transition._from : this.data.model.closure.grant.organization.name);
                        }
                        this.renderer.appendChild(stateNode, nodeStateName);
                        this.renderer.appendChild(node, stateNode);

                        if (transition.fromStateId === this.data.model.closure.status.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fas');
                            this.renderer.addClass(indicator, 'fa-book-reader');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.listen(indicator, 'click', () => {
                                this.data.adminComp.showHistory('grant-closure', this.data.model.closure);
                            });
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(stateNode, indicator);
                        }

                        const ownerNode = this.renderer.createElement('div');
                        //this.renderer.addClass(ownerNode, 'col-6');
                        const nodeOwner = this.renderer.createElement('select');
                        this.renderer.setAttribute(ownerNode, 'style', 'position: absolute;right: -125px;top: 15px;display: flex;flex-direction: column;');
                        this.renderer.setAttribute(nodeOwner, 'style', 'font-weight: 400;text-transform: initial;left: -95px;top: 23px;text-decoration: none;max-width: 125px;z-index: 1;background-color: rgba(200, 200, 200, 0.05) !important;border: none !important;');

                        this.renderer.addClass(nodeOwner, 'anu-select');
                        this.renderer.addClass(nodeOwner, 'anu-wf-input');
                        //this.renderer.setAttribute(nodeOwner, 'style', 'font-weight: 400;text-transform: initial;left: -95px;top: 23px;text-decoration: none;max-width: 125px;z-index: 1;background-color: rgba(200, 200, 200, 0.05) !important;border: none !important;');

                        const currentUserAssignment = this.data.model.workflowAssignments.filter((assignment) => assignment.assignmentId === JSON.parse(localStorage.getItem('USER')).id && assignment.stateId === this.data.model.closure.status.id && JSON.parse(localStorage.getItem('USER')).organization.organizationType !== 'GRANTEE');
                        const ownerUser = this.data.model.workflowAssignments.filter((assignment) => assignment.assignmentId === JSON.parse(localStorage.getItem('USER')).id && assignment.anchor);
                        if (currentUserAssignment.length > 0 || (ownerUser.length > 0)) {
                        } else {
                            this.canManage = false;
                            this.renderer.setAttribute(nodeOwner, 'disabled', 'disabled');
                        }
                        this.renderer.addClass(nodeOwner, 'ml-0');
                        this.renderer.addClass(nodeOwner, 'px-2');
                        this.renderer.addClass(nodeOwner, 'text-left');
                        //this.renderer.addClass(nodeOwner,'');
                        const assignment = this.data.model.workflowAssignments.filter((assignment) => assignment.stateId === transition.fromStateId);
                        if (assignment.length > 0) {
                            this.renderer.setAttribute(nodeOwner, 'value', assignment[0].assignmentUser ? String(assignment[0].assignmentUser.id) : String(0));
                            this.renderer.setAttribute(nodeOwner, 'id', 'assignment_' + assignment[0].id + '_' + transition.fromStateId + '_' + this.data.model.closure.id);
                            this.renderer.listen(nodeOwner, 'change', (event) => this.handleSelection(event));
                            if (assignment[0].assignment === 0) {
                                this.renderer.setStyle(nodeOwner, 'color', '#ffbf00');
                            }
                        } else {
                            this.renderer.setAttribute(nodeOwner, 'id', 'assignment_' + transition.fromStateId + '_' + this.data.model.closure.id);
                            this.renderer.listen(nodeOwner, 'change', (event) => this.handleSelection(event));
                        }
                        const nodeOwnerOptions = this.renderer.createElement('option');
                        this.renderer.setAttribute(nodeOwnerOptions, 'value', '0');

                        if (this.data.model.workflowStatuses.filter((status) => status.id === transition.fromStateId)[0].internalStatus !== 'ACTIVE') {
                            this.renderer.appendChild(nodeOwnerOptions, document.createTextNode('-- Assign Approver --'));
                            this.renderer.appendChild(nodeOwner, nodeOwnerOptions);
                            for (let option of this.data.model.users) {
                                const nodeOwnerOptions = this.renderer.createElement('option');
                                this.renderer.setAttribute(nodeOwnerOptions, 'value', String(option.id));


                                if (assignment.length > 0 && (assignment[0].assignmentUser ? Number(assignment[0].assignmentUser.id) : 0) === Number(option.id)) {
                                    this.renderer.setAttribute(nodeOwnerOptions, 'selected', 'selected');
                                }
                                let username = option.firstName + ' ' + option.lastName + this.getRoles(option);

                                if (option.deleted) {
                                    username = '[Disabled] ' + username;
                                    this.renderer.setAttribute(nodeOwnerOptions, 'disabled', 'disabled');
                                }
                                this.renderer.appendChild(nodeOwnerOptions, document.createTextNode(username));
                                this.renderer.appendChild(nodeOwner, nodeOwnerOptions);

                            }
                        } else {
                            if (this.canManage) {
                                const nodeInvite = this.renderer.createElement('input');
                                this.renderer.setAttribute(nodeInvite, 'placeholder', 'Invite Grantee/Partner User');
                                this.renderer.addClass(nodeInvite, 'anu-wf-input');
                                this.renderer.addClass(nodeOwner, 'anu-select');
                                this.renderer.setAttribute(nodeInvite, 'style', 'width: 100%; text-align: center;;max-width: 125px;');
                                this.renderer.setAttribute(nodeInvite, 'id', 'custom_assignment');
                                this.renderer.appendChild(ownerNode, nodeInvite);
                                if (this.data.model.granteeUsers) {
                                    this.renderer.appendChild(nodeOwnerOptions, document.createTextNode('-- Assign Grantee/Partner User --'));
                                    this.renderer.appendChild(nodeOwner, nodeOwnerOptions);
                                    for (let option of this.data.model.granteeUsers) {
                                        const nodeOwnerOptions = this.renderer.createElement('option');
                                        this.renderer.setAttribute(nodeOwnerOptions, 'value', String(option.id));
                                        if (assignment.length > 0 && (assignment[0].assignmentUser ? Number(assignment[0].assignmentUser.id) : 0) === Number(option.id)) {
                                            this.renderer.setAttribute(nodeOwnerOptions, 'selected', 'selected');
                                        }
                                        let username = (!option.active ? ('Unregistered: ' + option.emailId) : option.firstName + ' ' + option.lastName) + ' [' + option.organization.name + ']';
                                        if (option.deleted) {
                                            username = '[Disabled] ' + username;
                                            this.renderer.setAttribute(nodeOwnerOptions, 'disabled', 'disabled');
                                        }
                                        this.renderer.appendChild(nodeOwnerOptions, document.createTextNode(username));
                                        this.renderer.appendChild(nodeOwner, nodeOwnerOptions);
                                    }
                                }
                            } else {
                                if (this.data.model.granteeUsers) {
                                    for (let option of this.data.model.granteeUsers) {
                                        const nodeOwnerOptions = this.renderer.createElement('option');
                                        this.renderer.setAttribute(nodeOwnerOptions, 'value', String(option.id));
                                        if (assignment.length > 0 && (assignment[0].assignmentUser ? Number(assignment[0].assignmentUser.id) : 0) === Number(option.id)) {
                                            this.renderer.setAttribute(nodeOwnerOptions, 'selected', 'selected');
                                        }
                                        let username = (!option.active ? ('Unregistered: ' + option.emailId) : option.firstName + ' ' + option.lastName) + ' [' + option.organization.name + ']';
                                        if (option.deleted) {
                                            username = '[Disabled] ' + username;
                                            this.renderer.setAttribute(nodeOwnerOptions, 'disabled', 'disabled');
                                        }
                                        this.renderer.appendChild(nodeOwnerOptions, document.createTextNode(username));
                                        this.renderer.appendChild(nodeOwner, nodeOwnerOptions);
                                    }
                                }

                            }
                        }

                        //this.renderer.addClass(nodeOwner,'anu-wf-input');
                        this.renderer.appendChild(ownerNode, nodeOwner);
                        this.renderer.appendChild(stateNode, ownerNode);

                        //this.renderer.addClass(historyNode, 'col-3');
                        const assForHistory = this.data.model.workflowAssignments.filter(a => a.stateId === transition.fromStateId);
                        if (assForHistory && assForHistory.length > 0 && assForHistory[0].history && assForHistory[0].history.length > 0) {
                            const historyNode = this.renderer.createElement('div');
                            this.renderer.addClass(historyNode, 'text-right');
                            const histLink = this.renderer.createElement('a');
                            this.renderer.setAttribute(histLink, 'style', 'font-size: 9px;color: #bbbbbb;padding: 4px 6px;font-weight: 400;text-transform: initial;right: 53px;border: 1px #e0dfdf solid;background: rgba(200, 200, 200, 0.05) !important;border-radius: 4px;top: 20px;');
                            if (transition.internalStatus !== 'ACTIVE') {
                                this.renderer.appendChild(histLink, this.renderer.createText("Past Approver(s)"));
                                this.renderer.listen(histLink, 'click', (event) => this.showOwners(event, assForHistory[0].history, 'Past Approver(s)'));
                            } else {
                                this.renderer.appendChild(histLink, this.renderer.createText("Past Assignee(s)"));
                                this.renderer.listen(histLink, 'click', (event) => this.showOwners(event, assForHistory[0].history, 'Past Assignee(s)'));
                            }

                            this.renderer.appendChild(historyNode, histLink);
                        } else {
                            const historyNode = this.renderer.createElement('div');
                            this.renderer.addClass(historyNode, 'col-7');
                            this.renderer.addClass(historyNode, 'text-right');
                            const histLink = this.renderer.createElement('a');
                            this.renderer.setAttribute(histLink, 'style', 'font-size: 9px;color: #535353;padding: 4px 6px;font-weight: 400;text-transform: initial;left: -45px;position: relative;border: 1px #e0dfdf solid;background: #f8f8f8;border-radius: 4px;top: 5px;visibility:hidden;');
                            this.renderer.appendChild(histLink, this.renderer.createText("Past Approver(s)"));
                            this.renderer.appendChild(historyNode, histLink);
                            this.renderer.appendChild(ownerNode, historyNode);
                        }
                        //this.renderer.appendChild(node, historyNode);



                        this.renderer.setAttribute(node, 'id', nodeId);
                        this.renderer.addClass(node, 'state-node');

                        this.renderer.addClass(node, 'my-5');
                        this.renderer.appendChild(this.flowContainer.nativeElement, node);

                        //debugger;
                        this.rePositionNode(transition);

                        /* if (transition._from === 'Grantee Sahara') {
                            this.renderer.setStyle(node, 'position', 'relative');
                            this.renderer.setStyle(node, 'left', '200px');
                        } */
                        counter++;
                    }


                }
                for (let transition of transitions) {
                    const nodeId = 'state_' + transition.toStateId;
                    if (this.elemRef.nativeElement.querySelector('#' + nodeId) === null) {
                        const node = this.renderer.createElement('div');
                        /* if (transition.toStateId === this.data.model.closure.status.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fas');
                            this.renderer.addClass(indicator, 'fa-book-reader');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(node, indicator);
                        } */
                        const nodeStateName = this.renderer.createText(transition._to);
                        const stateNode = this.renderer.createElement('div');
                        this.renderer.addClass(stateNode, 'col-12');
                        this.renderer.addClass(stateNode, 'p-0');
                        this.renderer.addClass(stateNode, 'text-center');
                        this.renderer.addClass(node, this.getColorCodeByStatus(this.data.model.workflowStatuses.filter((status) => status.id === transition.toStateId)[0].internalStatus));
                        this.renderer.appendChild(stateNode, nodeStateName);

                        this.renderer.appendChild(node, stateNode);

                        if (transition.toStateId === this.data.model.closure.status.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fas');
                            this.renderer.addClass(indicator, 'fa-book-reader');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.listen(indicator, 'click', () => {
                                this.data.adminComp.showHistory('grant-closure', this.data.model.closure);
                            });
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(stateNode, indicator);
                        }
                        if (this.data.model.closure.status.internalStatus === 'CLOSED') {
                            const ass = this.data.model.workflowAssignments.filter((assignment) => assignment.stateId === this.data.model.closure.status.id);
                            const ownerNodeHolder = this.renderer.createElement('div');
                            this.renderer.addClass(ownerNodeHolder, 'col-6');
                            const ownerNode = this.renderer.createElement('div');
                            this.renderer.addClass(ownerNode, 'px-2');
                            this.renderer.addClass(ownerNode, 'anu-wf-input');
                            this.renderer.addClass(ownerNode, 'closed-state-owner');
                            this.renderer.addClass(ownerNodeHolder, 'text-center');
                            const ownerName = this.renderer.createText(ass[0].assignmentUser.firstName + " " + ass[0].assignmentUser.lastName);
                            this.renderer.appendChild(ownerNode, ownerName);
                            this.renderer.appendChild(ownerNodeHolder, ownerNode);
                            this.renderer.appendChild(node, ownerNodeHolder);
                        }
                        this.renderer.setAttribute(node, 'id', nodeId);
                        this.renderer.addClass(node, 'state-node');
                        this.renderer.addClass(node, 'my-5');
                        this.renderer.addClass(node, 'text-center');
                        this.renderer.appendChild(this.flowContainer.nativeElement, node);


                    }
                }

                jsPlumb.Defaults.Endpoint = "Blank";
                this.jsPlumbInstance = jsPlumb.getInstance(jsPlumb.Defaults);

                this.showFlow(this.transitions);

                $('.owner-class').on('change', function () {
                    this.onYesClick();
                });
                this.updateClosureUsers();
            },
                error => {
                    const errorMsg = error as HttpErrorResponse;
                    //console.log(error);
                    this.toastr.error(errorMsg.error.message, errorMsg.error.messageTitle, {
                        enableHtml: true
                    });
                    this.dialogRef.close(false);
                });
        } else if (this.data.model.type === 'disbursement') {
            const gtIdx = this.data.model.grantTypes.findIndex(gt => gt.id === this.data.model.disbursement.grant.grantTypeId);
            this.grantType = this.data.model.grantTypes[gtIdx].name;
            this.title = `<p class="mb-0 text-subheader">Disbursement Approval Workflow | ` + this.grantType + `</p><p class="mb-1 lh-20"><span class="text-header">` + ((this.data.model.disbursement.grant.grantStatus.internalStatus === 'ACTIVE' || this.data.model.disbursement.grant.grantStatus.internalStatus === 'CLOSED') ? `<span class="text-subheader">[` + this.data.model.disbursement.grant.referenceNo + `] </span>` : ``) + this.data.model.disbursement.grant.name + `</span></p>`;
            this.workflowDataService.getDisbursementWorkflow(this.data.model.disbursement).then(transitions => {

                this.transitions = transitions;

                let counter = 1;
                for (let transition of transitions) {
                    const nodeId = 'state_' + transition.fromStateId;
                    if (this.elemRef.nativeElement.querySelector('#' + nodeId) === null) {
                        const node = this.renderer.createElement('div');
                        this.renderer.addClass(node, this.getColorCodeByStatus(this.data.model.workflowStatuses.filter((status) => status.id === transition.fromStateId)[0].internalStatus));

                        /* if (this.data.model.workflowStatuses.filter((status) => status.id === transition.fromStateId)[0].internalStatus === 'DRAFT') {
                            const notesNode = this.renderer.createElement('span');
                            this.renderer.appendChild(notesNode, this.renderer.createText('Workflow Note(s)'));
                            this.renderer.setAttribute(notesNode, 'style', 'position: absolute; right: 7px; cursor: pointer; box-shadow: 2px 2px 4px #d3d3d3; padding: 2px 4px; border-radius: 4px; font-size: 12px;text-transform: none; font-weight: 400;');
                            this.renderer.listen(notesNode, 'click', () => {
                                this.data.adminComp.showHistory('disbursement', this.data.model.disbursement);
                            });
                            this.renderer.appendChild(node, notesNode);
                        } */
                        //this.renderer.appendChild(node, historyNode);
                        const stateNode = this.renderer.createElement('div');
                        this.renderer.addClass(stateNode, 'col-12');
                        this.renderer.addClass(stateNode, 'p-0');
                        this.renderer.addClass(stateNode, 'text-center');
                        const nodeStateName = this.renderer.createText(transition._from);
                        this.renderer.appendChild(stateNode, nodeStateName);
                        this.renderer.appendChild(node, stateNode);

                        if (transition.fromStateId === this.data.model.disbursement.status.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fas');
                            this.renderer.addClass(indicator, 'fa-book-reader');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.listen(indicator, 'click', () => {
                                this.data.adminComp.showHistory('disbursement', this.data.model.disbursement);
                            });
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(stateNode, indicator);
                        }

                        const ownerNode = this.renderer.createElement('div');
                        this.renderer.addClass(ownerNode, 'mt-2');
                        this.renderer.setAttribute(ownerNode, 'style', 'position: absolute;right: -125px;top: 15px;');
                        const nodeOwner = this.renderer.createElement('select');
                        this.renderer.setAttribute(nodeOwner, 'style', 'font-weight: 400;text-transform: initial;left: -95px;top: 23px;text-decoration: none;max-width: 125px;z-index: 1;background-color: rgba(200, 200, 200, 0.05) !important;border: none !important;');
                        this.renderer.addClass(nodeOwner, 'anu-select');
                        this.renderer.addClass(nodeOwner, "anu-wf-input");
                        const currentUserAssignment = this.data.model.workflowAssignments.filter((assignment) => assignment.owner === JSON.parse(localStorage.getItem('USER')).id && assignment.stateId === this.data.model.disbursement.status.id);
                        const ownerUser = this.data.model.workflowAssignments.filter((assignment) => assignment.owner === JSON.parse(localStorage.getItem('USER')).id && assignment.anchor);

                        const roles: UserRole[] = JSON.parse(localStorage.getItem('USER')).userRoles;
                        let isAdminRole: boolean = false;
                        if (roles.filter(a => a.role.name === 'Admin')) {
                            isAdminRole = true;
                        }

                        if (((currentUserAssignment.length > 0 || (ownerUser.length > 0)) && this.data.model.disbursement.status.internalStatus !== 'ACTIVE' && this.data.model.disbursement.status.internalStatus !== 'CLOSED') || isAdminRole) {
                        } else {


                            this.canManage = false;
                            this.renderer.setAttribute(nodeOwner, 'disabled', 'disabled');

                            if ((currentUserAssignment.length > 0 || isAdminRole) && this.data.model.disbursement.status.internalStatus === 'ACTIVE' && transition.internalStatus == 'ACTIVE') {
                                this.canManage = true;
                                this.renderer.removeAttribute(nodeOwner, 'disabled');
                            }
                        }

                        this.renderer.addClass(nodeOwner, 'ml-0');
                        this.renderer.addClass(nodeOwner, 'px-2');
                        this.renderer.addClass(nodeOwner, 'text-left');
                        //this.renderer.addClass(nodeOwner,'');
                        const assignment = this.data.model.workflowAssignments.filter((assignment) => assignment.stateId === transition.fromStateId);
                        if (assignment.length > 0) {
                            this.renderer.setAttribute(nodeOwner, 'value', assignment[0].owner);
                            this.renderer.setAttribute(nodeOwner, 'id', 'assignment_' + assignment[0].id + '_' + transition.fromStateId + '_' + this.data.model.disbursement.id);
                            this.renderer.setAttribute(nodeOwner, 'data-counter', String(counter++));
                            this.renderer.listen(nodeOwner, 'change', (event) => this.handleSelection(event));
                        } else {
                            this.renderer.setAttribute(nodeOwner, 'id', 'assignment_' + transition.fromStateId + '_' + this.data.model.disbursement.id);
                            this.renderer.setAttribute(nodeOwner, 'data-counter', String(counter++));
                            this.renderer.listen(nodeOwner, 'change', (event) => this.handleSelection(event));
                        }
                        const nodeOwnerOptions = this.renderer.createElement('option');
                        this.renderer.setAttribute(nodeOwnerOptions, 'value', '0');
                        this.renderer.appendChild(nodeOwnerOptions, document.createTextNode('-- Assign Approver --'));
                        this.renderer.appendChild(nodeOwner, nodeOwnerOptions);
                        for (let option of this.data.model.users) {
                            const nodeOwnerOptions = this.renderer.createElement('option');
                            this.renderer.setAttribute(nodeOwnerOptions, 'value', String(option.id));


                            if (assignment.length > 0 && assignment[0].owner === Number(option.id)) {
                                this.renderer.setAttribute(nodeOwnerOptions, 'selected', 'selected');
                            }

                            let username = option.firstName + ' ' + option.lastName + this.getRoles(option);

                            if (option.deleted) {
                                username = '[Disabled] ' + username;
                                this.renderer.setAttribute(nodeOwnerOptions, 'disabled', 'disabled');
                            }

                            this.renderer.appendChild(nodeOwnerOptions, document.createTextNode(username));
                            this.renderer.appendChild(nodeOwner, nodeOwnerOptions);

                        }

                        //this.renderer.addClass(nodeOwner,'anu-wf-input');
                        this.renderer.appendChild(ownerNode, nodeOwner);
                        this.renderer.appendChild(stateNode, ownerNode);

                        const historyNode = this.renderer.createElement('div');
                        this.renderer.addClass(historyNode, 'text-right');
                        const assForHistory = this.data.model.workflowAssignments.filter(a => a.stateId === transition.fromStateId);
                        if (assForHistory && assForHistory.length > 0 && assForHistory[0].history && assForHistory[0].history.length > 0) {
                            const histLink = this.renderer.createElement('a');
                            this.renderer.setAttribute(histLink, 'style', 'font-size: 9px;color: #bbbbbb;padding: 4px 6px;font-weight: 400;text-transform: initial;right: 53px;border: 1px #e0dfdf solid;background: rgba(200, 200, 200, 0.05) !important;border-radius: 4px;top: 20px;');
                            this.renderer.appendChild(histLink, this.renderer.createText("Past Approver(s)"));
                            this.renderer.listen(histLink, 'click', (event) => this.showOwners(event, assForHistory[0].history, 'Past Approver(s)'));
                            this.renderer.appendChild(historyNode, histLink);
                            this.renderer.appendChild(ownerNode, historyNode);
                        } else {
                            const historyNode = this.renderer.createElement('div');
                            this.renderer.addClass(historyNode, 'col-7');
                            this.renderer.addClass(historyNode, 'text-right');
                            const histLink = this.renderer.createElement('a');
                            this.renderer.setAttribute(histLink, 'style', 'font-size: 9px;color: #535353;padding: 4px 6px;font-weight: 400;text-transform: initial;left: -45px;position: relative;border: 1px #e0dfdf solid;background: #f8f8f8;border-radius: 4px;top: 5px;visibility:hidden;');
                            this.renderer.appendChild(histLink, this.renderer.createText("Past Approver(s)"));
                            this.renderer.appendChild(historyNode, histLink);
                            this.renderer.appendChild(ownerNode, historyNode);
                        }




                        this.renderer.setAttribute(node, 'id', nodeId);
                        this.renderer.addClass(node, 'state-node');

                        this.renderer.addClass(node, 'my-5');
                        this.renderer.appendChild(this.flowContainer.nativeElement, node);
                    }

                }
                for (let transition of transitions) {
                    const nodeId = 'state_' + transition.toStateId;
                    if (this.elemRef.nativeElement.querySelector('#' + nodeId) === null) {
                        const node = this.renderer.createElement('div');

                        const nodeStateName = this.renderer.createText(transition._to);
                        const stateNode = this.renderer.createElement('div');
                        this.renderer.addClass(stateNode, 'col-12');
                        this.renderer.addClass(stateNode, 'p-0');
                        this.renderer.addClass(stateNode, 'text-center');
                        this.renderer.addClass(node, this.getColorCodeByStatus(this.data.model.workflowStatuses.filter((status) => status.id === transition.toStateId)[0].internalStatus));
                        this.renderer.appendChild(stateNode, nodeStateName);
                        this.renderer.appendChild(node, stateNode);

                        if (transition.toStateId === this.data.model.disbursement.status.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fas');
                            this.renderer.addClass(indicator, 'fa-book-reader');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.listen(indicator, 'click', () => {
                                this.data.adminComp.showHistory('disbursement', this.data.model.disbursement);
                            });
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(stateNode, indicator);
                        }

                        if (this.data.model.disbursement.status.internalStatus === 'CLOSED') {
                            const ass = this.data.model.workflowAssignments.filter((assignment) => assignment.stateId === this.data.model.disbursement.status.id);
                            const ownerNodeHolder = this.renderer.createElement('div');
                            this.renderer.addClass(ownerNodeHolder, 'col-12');
                            const ownerNode = this.renderer.createElement('div');
                            this.renderer.addClass(ownerNode, 'px-2');
                            this.renderer.addClass(ownerNode, 'anu-wf-input');
                            this.renderer.addClass(ownerNode, 'closed-state-owner');
                            this.renderer.setStyle(ownerNode, 'left', '0');
                            this.renderer.addClass(ownerNodeHolder, 'text-center');
                            const ownerName = this.renderer.createText(ass[0].assignmentUser.firstName + " " + ass[0].assignmentUser.lastName);
                            this.renderer.appendChild(ownerNode, ownerName);
                            this.renderer.appendChild(ownerNodeHolder, ownerNode);
                            this.renderer.appendChild(node, ownerNodeHolder);


                        }
                        this.renderer.setAttribute(node, 'id', nodeId);
                        this.renderer.addClass(node, 'state-node');
                        this.renderer.addClass(node, 'my-5');
                        this.renderer.appendChild(this.flowContainer.nativeElement, node);


                    }
                }

                jsPlumb.Defaults.Endpoint = "Blank";
                this.jsPlumbInstance = jsPlumb.getInstance(jsPlumb.Defaults);

                this.showFlow(this.transitions);

                $('.owner-class').on('change', function () {
                    this.onYesClick();
                });

                this.updateGrantAndDisbursementUsers();
            });



        }

    }
    handleSelection(event: any): boolean | void {

        this.updateGrantAndDisbursementUsers();
        if (event.target.value === "0") {
            event.target.style.color = '#ffbf00'
        } else {
            event.target.style.color = 'initial'
        }


        if (this.data.model.type === 'grant' && this.data.model.grant.grantStatus.internalStatus === 'ACTIVE') {
            const val = event.currentTarget.value;
            const orgAss = this.data.model.workflowAssignment.filter(a => a.stateId === this.data.model.grant.grantStatus.id)[0];
            if (orgAss.assignments !== Number(val)) {
                this.activeStateOwnerChanged = true;
            } else {
                this.activeStateOwnerChanged = false;
            }
        }
        /* if (!environment.production) {
            return;
        } */

        // const options = (<HTMLOptionElement>event.currentTarget).parentElement.parentElement.nextElementSibling.firstElementChild.nextElementSibling.nextElementSibling.firstElementChild;
        // const previousOptions = (<HTMLOptionElement>event.currentTarget).parentElement.parentElement.previousElementSibling.firstElementChild.nextElementSibling.nextElementSibling.firstElementChild;

        // if (previousOptions !== null && previousOptions.children.length > 0) {
        //     for (var i = 0; i < previousOptions.children.length; i++) {
        //         if (event.currentTarget.value === (<HTMLOptionElement>previousOptions[i]).value && event.currentTarget.value !== "0") {
        //             previousOptions[i].setAttribute("disabled", "disabled");
        //             //options[i].setAttribute("selected", "selected");
        //         } /* else {
        //             previousOptions[i].removeAttribute("disabled");
        //         } */

        //     }
        // }

        // if (options !== null && options.children.length > 0) {
        //     for (var i = 0; i < options.children.length; i++) {
        //         if (event.currentTarget.value === (<HTMLOptionElement>options[i]).value && event.currentTarget.value !== "0") {
        //             options[i].setAttribute("disabled", "disabled");
        //             //options[i].setAttribute("selected", "selected");
        //             /* if (event.currentTarget.parentElement.parentElement.nextElementSibling.firstElementChild.nextElementSibling.firstElementChild.value === event.currentTarget.value) {
        //                 event.currentTarget.parentElement.parentElement.nextElementSibling.firstElementChild.nextElementSibling.firstElementChild.value = "0";
        //             } */

        //         } else {
        //             options[i].removeAttribute("disabled");
        //         }
        //     }
        // }
    }

    ngOnDestroy() {
        window.removeEventListener('scroll', this.scroll, true);
    }


    ngAfterViewInit() {
        //this.showFlow(this.transitions);
    }


    showFlow(transitions: WorkflowTransition[]) {
        const curves = [30, 40, 50, 60, 70, 80, 90, 100];
        const labelPositions = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
        let curvesCnt = 0;
        let posCnt = 0;

        this.jsPlumbInstance.Defaults.Overlays = [];
        for (let transition of transitions) {

            if (Number(transition.seqOrder) < 50) {
                setTimeout(() => {
                    this.jsPlumbInstance.connect({
                        connector: ["Flowchart"],
                        overlays: [
                            ["Arrow", { width: 8, length: 8, location: 1 }],
                            ['Label', { label: transition.action, location: 0.5, cssClass: 'connectorLabel' }]
                        ],
                        source: 'state_' + transition.fromStateId, // it is the id of source div
                        target: 'state_' + transition.toStateId, // it is the id of target div
                        anchors: ["Bottom", "Top"]
                    });
                }, 50);


            } /* else {
                setTimeout(() => {
                    this.jsPlumbInstance.connect({
                        connector: ["Bezier", { curviness: curves[curvesCnt++] }],
                        overlays: [
                            ["Arrow", { width: 8, length: 8, location: 1 }],
                            ['Label', { label: transition.action, location: labelPositions[posCnt++], cssClass: 'connectorLabel' }]
                        ],
                        source: 'state_' + transition.fromStateId, // it is the id of source div
                        target: 'state_' + transition.toStateId, // it is the id of target div
                        anchors: ["Right", "Right"]
                    });
                }, 150);
            } */


        }

    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.jsPlumbInstance.repaintEverything();
    }

    @HostListener('window:scroll', ['$event']) getScrollHeight(event) {
        //console.log(window.pageYOffset, event);
    }

    redrawOnScroll(ev) {

        this.jsPlumbInstance.repaintEverything();
        /* //console.log(ev);
        const off = (ev.target.scrollTop);
        for (let e of $('.jtk-overlay')) {
            let pos = $(e).offset().top;
            $(e).offset({ top: pos - off });
        } */
        //$('.jtk-overlay').css('top', off * -1);
        /* $('.jtk-overlay').remove();
        $('.jtk-connector').remove(); */
        //this.showFlow(this.transitions);
    }

    onNoClick(): void {
        if (this.verifyChanges()) {
            const d = this.dialog.open(FieldDialogComponent, {
                data: { title: "Would you like to save the assignment changes?", btnMain: "Save Assignments", btnSecondary: "Not Now", subTitle: ((this.activeStateOwnerChanged && this.activeStateOwnerChanged === true) ? "<strong class='text-red'>Warning!</strong> Changing the Active State owner of this grant is likely to impact the workflow assignments for associated reports and disbursements.\nPlease review the workdlowflow assignments of the associated Reports and Disbursements." : "") },
                panelClass: "center-class"
            });

            d.afterClosed().subscribe(result => {
                if (result) {
                    d.close();
                    this.onYesClick();
                } else {
                    d.close();
                    this.dialogRef.close(false);
                }
            });

        } else {
            this.dialogRef.close(false);
        }

    }

    onYesClick(): void {
        if (this.data.model.type === 'grant') {
            /* const dg = this.dialog.open(FieldDialogComponent, {
                data: { title: "Would you like to save the assignment changes?", btnMain: "Save Assignments", btnSecondary: "Not Now" },
                panelClass: "center-class"
            }); */
            this.processGrantAssignments();

        } else if (this.data.model.type === 'report') {
            if (this.checkGranteeAssignment()) {
                const d = this.dialog.open(MessagingComponent, {
                    data: "Grantee email cannot be the same as an internal user",
                    panelClass: "center-class"
                });

                d.afterClosed().subscribe(result => {
                    return;
                });
            } else {
                const assignmentElems = $('[id^="assignment_"]');
                const customAssignmentElem = $('#custom_assignment');
                const assignMentResult = [];
                for (let i = 0; i < assignmentElems.length; i++) {
                    var assignmentTokens = $(assignmentElems[i]).attr('id').split('_');
                    let uid = $(assignmentElems[i]).val();
                    if (uid === null) {
                        uid = $(assignmentElems[i])[0].value;
                    }
                    if (assignmentTokens.length === 4) {
                        assignMentResult.push({ 'id': assignmentTokens[1], 'stateId': assignmentTokens[2], 'userId': uid, 'reportId': assignmentTokens[3], 'customAssignments': $(customAssignmentElem).val() });
                    } else {
                        assignMentResult.push({ 'id': '', 'stateId': assignmentTokens[1], 'userId': uid, 'reportId': assignmentTokens[2], 'customAssignments': $(customAssignmentElem).val() });
                    }
                }
                this.dialogRef.close({ 'result': true, data: assignMentResult });
            }

        } else if (this.data.model.type === 'grant-closure') {
            if (this.checkGranteeAssignment()) {
                const d = this.dialog.open(MessagingComponent, {
                    data: "Grantee email cannot be the same as an internal user",
                    panelClass: "center-class"
                });

                d.afterClosed().subscribe(result => {
                    return;
                });
            } else {
                const assignmentElems = $('[id^="assignment_"]');
                const customAssignmentElem = $('#custom_assignment');
                const assignMentResult = [];
                for (let i = 0; i < assignmentElems.length; i++) {
                    var assignmentTokens = $(assignmentElems[i]).attr('id').split('_');
                    let uid = $(assignmentElems[i]).val();
                    if (uid === null) {
                        uid = $(assignmentElems[i])[0].value;
                    }
                    if (assignmentTokens.length === 4) {
                        assignMentResult.push({ 'id': assignmentTokens[1], 'stateId': assignmentTokens[2], 'userId': uid, 'closureId': assignmentTokens[3], 'customAssignments': $(customAssignmentElem).val() });
                    } else {
                        assignMentResult.push({ 'id': '', 'stateId': assignmentTokens[1], 'userId': uid, 'closureId': assignmentTokens[2], 'customAssignments': $(customAssignmentElem).val() });
                    }
                }
                this.dialogRef.close({ 'result': true, data: assignMentResult });
            }

        } else if (this.data.model.type === 'disbursement') {
            const assignmentElems = $('[id^="assignment_"]');
            const assignMentResult = [];
            for (let i = 0; i < assignmentElems.length; i++) {
                var assignmentTokens = $(assignmentElems[i]).attr('id').split('_');
                let uid = $(assignmentElems[i]).val();
                if (uid === null) {
                    uid = $(assignmentElems[i])[0].value;
                }
                if (assignmentTokens.length === 4) {
                    assignMentResult.push({ 'id': assignmentTokens[1], 'stateId': assignmentTokens[2], 'userId': uid, 'disbursementId': assignmentTokens[3] });
                } else {
                    assignMentResult.push({ 'id': '', 'stateId': assignmentTokens[1], 'userId': uid, 'disbursementId': assignmentTokens[2] });
                }
            }
            this.dialogRef.close({ 'result': true, data: assignMentResult });
        }
    }

    processGrantAssignments() {
        const assignmentElems = $('[id^="assignment_"]');
        const assignMentResult = [];
        for (let i = 0; i < assignmentElems.length; i++) {
            var assignmentTokens = $(assignmentElems[i]).attr('id').split('_');
            let uid = $(assignmentElems[i]).val();
            if (uid === null) {
                uid = $(assignmentElems[i])[0].value;
            }
            if (assignmentTokens.length === 4) {
                assignMentResult.push({ 'id': assignmentTokens[1], 'stateId': assignmentTokens[2], 'userId': uid, 'grantId': assignmentTokens[3] });
            } else {
                assignMentResult.push({ 'id': '', 'stateId': assignmentTokens[1], 'userId': uid, 'grantId': assignmentTokens[2] });
            }
        }
        this.dialogRef.close({ 'result': true, data: assignMentResult });
    }

    getRoles(user): string {
        return ' [' + user.userRoles.map(ur => ur.role.name).join(', ') + ']';
    }

    scroll() {
        //console.log('scrolled');
    }

    getColorCodeByStatus(status): string {
        if (status === 'DRAFT') {
            return 'state-draft';
        } else if (status === 'ACTIVE') {
            return 'state-active';
        } else if (status === 'REVIEW') {
            return 'state-review';
        }
        return 'state-closed';
    }

    getColorCodeByStatusForReport(status, report: Report): string {
        if (status === 'DRAFT') {
            return 'state-draft';
        } else if (status === 'ACTIVE') {
            if (this.data.appComp.loggedInUser.organization.organizationType === 'GRANTER' && this.data.appComp.grantTypes.filter(gt => Number(gt.id) === Number(report.grant.grantTypeId))[0].internal) {
                return 'state-active';
            } else if (this.data.appComp.loggedInUser.organization.organizationType === 'GRANTEE') {
                return 'state-ext-active';
            } else {
                return 'state-ext-active';
            }
        } else if (status === 'REVIEW') {
            return 'state-review';
        } else {
            return "";
        }
    }

    getColorCodeByStatusForClosure(status, report: Report): string {
        if (status === 'DRAFT') {
            return 'state-draft';
        } else if (status === 'ACTIVE') {
            if (this.data.appComp.loggedInUser.organization.organizationType === 'GRANTER' && this.data.appComp.grantTypes.filter(gt => Number(gt.id) === Number(report.grant.grantTypeId))[0].internal) {
                return 'state-active';
            } else if (this.data.appComp.loggedInUser.organization.organizationType === 'GRANTEE') {
                return 'state-ext-active';
            } else {
                return 'state-ext-active';
            }
        } else if (status === 'REVIEW') {
            return 'state-review';
        } else {
            return "";
        }
    }

    zoomOut() {

        const container = this.flowContainer.nativeElement;
        $(container).animate({ 'zoom': 0.8 }, 400, () => {
            //console.log('zommed out');
            this.jsPlumbInstance.deleteEveryEndpoint();
            this.jsPlumbInstance.deleteEveryConnection();
            this.jsPlumbInstance.setZoom(1, true);
            this.showFlow(this.transitions);
        });

    }

    zoomIn() {

        const container = this.flowContainer.nativeElement;
        $(container).animate({ 'zoom': 1 }, 400, () => {
            jsPlumb.Defaults.Endpoint = "Blank";
            jsPlumb.Defaults.Zoom = "1";
            this.jsPlumbInstance = jsPlumb.getInstance(jsPlumb.Defaults);
            this.jsPlumbInstance.repaintEverything();
        });

    }

    showPopup() {
        //console.log('popup');
    }

    updateGrantAndDisbursementUsers() {
        /* if (!environment.production) {
            return;
        } */
        const assignmentElems = $('[id^="assignment_"]');
        for (let i = 0; i < assignmentElems.length; i++) {
            //console.log(assignmentElems[i].getAttribute('data-counter'));

            const prev = assignmentElems[i - 1] ? assignmentElems[i - 1].value : "-1";
            const next = assignmentElems[i + 1] ? assignmentElems[i + 1].value : "-1";

            const arr = [];
            arr.push(prev);
            arr.push(next);

            for (let child of assignmentElems[i].children) {
                const usr = this.data.model.users.filter(u => u.id === Number(child.value));
                if (usr.length > 0 && usr[0].deleted && child.value === assignmentElems[i].value) {
                    //////console.log(assignmentElems[i]);
                    assignmentElems[i].style.textDecoration = 'line-through';
                } else if (usr.length > 0 && !usr[0].deleted && child.value === assignmentElems[i].value) {
                    //////console.log(assignmentElems[i]);
                    assignmentElems[i].style.textDecoration = 'none';
                }

                if (arr.includes(child.value)) {
                    child.setAttribute('disabled', 'disabled');
                } else {

                    if (usr.length > 0 && !usr[0].deleted) {
                        child.removeAttribute('disabled');
                    }
                    //child.removeAttribute('disabled');
                }
            }

        }
    }

    updateReportUsers() {
        /* if (!environment.production) {
            return;
        } */
        const assignmentElems = $('[id^="assignment_"]');
        for (let i = 2; i < assignmentElems.length; i++) {
            //console.log(assignmentElems[i].getAttribute('data-counter'));

            const prev = assignmentElems[i - 1] ? assignmentElems[i - 1].value : "-1";
            const next = assignmentElems[i + 1] ? assignmentElems[i + 1].value : "-1";

            const arr = [];
            arr.push(prev);
            arr.push(next);

            for (let child of assignmentElems[i].children) {

                const usr = this.data.model.users.filter(u => u.id === Number(child.value));
                if (usr.length > 0 && usr[0].deleted && child.value === assignmentElems[i].value) {
                    ////console.log(assignmentElems[i]);
                    assignmentElems[i].style.textDecoration = 'line-through';
                } else if (usr.length > 0 && !usr[0].deleted && child.value === assignmentElems[i].value) {
                    ////console.log(assignmentElems[i]);
                    assignmentElems[i].style.textDecoration = 'none';
                }

                if (arr.includes(child.value)) {
                    child.setAttribute('disabled', 'disabled');
                } else {
                    if (usr.length > 0 && !usr[0].deleted) {
                        child.removeAttribute('disabled');
                    }
                }
            }

        }
    }

    updateClosureUsers() {
        /* if (!environment.production) {
            return;
        } */
        const assignmentElems = $('[id^="assignment_"]');
        for (let i = 2; i < assignmentElems.length; i++) {
            //console.log(assignmentElems[i].getAttribute('data-counter'));

            const prev = assignmentElems[i - 1] ? assignmentElems[i - 1].value : "-1";
            const next = assignmentElems[i + 1] ? assignmentElems[i + 1].value : "-1";

            const arr = [];
            arr.push(prev);
            arr.push(next);

            for (let child of assignmentElems[i].children) {

                const usr = this.data.model.users.filter(u => u.id === Number(child.value));
                if (usr.length > 0 && usr[0].deleted && child.value === assignmentElems[i].value) {
                    ////console.log(assignmentElems[i]);
                    assignmentElems[i].style.textDecoration = 'line-through';
                } else if (usr.length > 0 && !usr[0].deleted && child.value === assignmentElems[i].value) {
                    ////console.log(assignmentElems[i]);
                    assignmentElems[i].style.textDecoration = 'none';
                }

                if (arr.includes(child.value)) {
                    child.setAttribute('disabled', 'disabled');
                } else {
                    if (usr.length > 0 && !usr[0].deleted) {
                        child.removeAttribute('disabled');
                    }
                }
            }

        }
    }

    checkGranteeAssignment(): boolean {
        if (this.data.model.type === 'report') {
            const customAssignmentElem = $('#custom_assignment');
            if (customAssignmentElem.val() !== undefined && customAssignmentElem.val() !== null) {
                for (let u of this.data.model.users) {
                    if (u.emailId === customAssignmentElem.val().trim()) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    verifyChanges(): boolean {
        if (this.data.model.type === 'report') {
            const assignmentElems = $('[id^="assignment_"]');

            for (let ass of assignmentElems) {
                const assTokens = ass.id.split("_");
                const assId = assTokens[1];
                const orgAss = this.data.model.workflowAssignments.filter(a => a.id === Number(assId))[0];
                if (orgAss !== undefined && orgAss.assignmentId == undefined) {
                    orgAss.assignmentId = 0;
                }

                if (orgAss !== undefined && orgAss.assignmentId !== undefined && orgAss.assignmentId !== null && orgAss.assignmentId !== Number(ass.value)) {
                    return true;
                }
            }
            const customAssignmentElem = $('#custom_assignment');
            if (customAssignmentElem.val() !== undefined && customAssignmentElem.val() !== null && customAssignmentElem.val().trim() !== '') {
                return true;
            }
        } else if (this.data.model.type === 'grant-closure') {
            const assignmentElems = $('[id^="assignment_"]');

            for (let ass of assignmentElems) {
                const assTokens = ass.id.split("_");
                const assId = assTokens[1];
                const orgAss = this.data.model.workflowAssignments.filter(a => a.id === Number(assId))[0];
                if (orgAss !== undefined && orgAss.assignmentId == undefined) {
                    orgAss.assignmentId = 0;
                }

                if (orgAss !== undefined && orgAss.assignmentId !== undefined && orgAss.assignmentId !== null && orgAss.assignmentId !== Number(ass.value)) {
                    return true;
                }
            }
            const customAssignmentElem = $('#custom_assignment');
            if (customAssignmentElem.val() !== undefined && customAssignmentElem.val() !== null && customAssignmentElem.val().trim() !== '') {
                return true;
            }
        } else if (this.data.model.type === 'grant') {
            const assignmentElems = $('[id^="assignment_"]');

            for (let ass of assignmentElems) {
                const assTokens = ass.id.split("_");
                const assId = assTokens[1];
                const orgAss = this.data.model.workflowAssignment.filter(a => a.id === Number(assId))[0];
                if (orgAss && orgAss.assignments == undefined) {
                    orgAss.assignments = 0;
                }
                if (orgAss && orgAss.assignments !== undefined && orgAss.assignments !== Number(ass.value)) {
                    return true;
                }
            }
        } else if (this.data.model.type === 'disbursement') {
            const assignmentElems = $('[id^="assignment_"]');

            for (let ass of assignmentElems) {
                const assTokens = ass.id.split("_");
                const assId = assTokens[1];
                const orgAss = this.data.model.workflowAssignments.filter(a => a.id === Number(assId))[0];
                if (orgAss.owner == undefined) {
                    orgAss.owner = 0;
                }
                if (orgAss.owner !== undefined && orgAss.owner !== Number(ass.value)) {
                    return true;
                }
            }
        }

        return false;
    }

    showOwners(event, history, title) {
        const dgReg = this.dialog.open(OwnersPopupComponent, {
            data: { history: history, title: title },
            panelClass: 'center-class-long'
        });


    }

    triggerDrowpDown(event, node) {
        node.click();
    }

    public getGrantTypeName(typeId): string {
        return this.data.appComp.grantTypes.filter(t => t.id === typeId)[0].name;
    }

    hasSiblings(transition) {
        const parent = this.transitions.filter(t => t.toStateId === transition.fromStateId)[0];
        const siblings = this.transitions.filter(t => t.fromStateId === parent.fromStateId)
        return (siblings && siblings.length > 0) ? true : false;
    }

    getLastSiblingPosition(transition) {
        const parent = this.getParent(transition);
        if (!parent) {
            return 0;
        }
        const siblings = this.transitions.filter(t => t.fromStateId === parent.fromStateId && t.id !== parent.id);
        if (siblings && siblings.length > 0) {
            const lastSibling = $("#state_" + siblings[siblings.length - 1].toStateId)[0];
            if (lastSibling) {
                const t = $(lastSibling).css('left');
                return $("#state_" + (t ? Number(t.replace('px', '')) : 0) + 300);
            } else {
                const p = $("#state_" + parent.fromStateId).css('left');
                return (p ? Number(p.replace('px', '')) : 0) - 300;
            }
        }
        return 0;
    }

    isSiblingDrawn(transition: WorkflowTransition) {
        const sibglingElements = $("#state_" + transition.fromStateId);
        console.log(sibglingElements.length);
    }

    rePositionNode(transition: WorkflowTransition) {
        const parent = this.getParent(transition);
        this.position("state_" + transition.fromStateId,
            parent ? "state_" + parent.fromStateId : "_",
            this.getOffset(transition));
    }

    getParent(transition: WorkflowTransition) {
        const parents = this.transitions.filter(t => t.toStateId === transition.fromStateId);
        if (parents && parents.length > 1) {
            return parents[parents.length - 1];
        }
        return parents[0];
    }

    getOffset(transition: WorkflowTransition) {
        return this.getLastSiblingPosition(transition);
    }

    position(transitionNodeId: any, parentNodeId: any, offset: any) {

        const t = $("#" + parentNodeId).css('left');
        $("#" + transitionNodeId).css('position', 'relative').css('left', (t ? Number(t.replace('px', '')) : 0) + offset);
        /* let parentElement;
        const p = this.transitions.filter(t => t.toStateId === transition.fromStateId)[0];
        if (p) {
            parentElement = $("#state_" + p.fromStateId);
        }
        if (parentElement && parentElement.length > 0) {
            // $("state_" + transition.toStateId).css('posistion', 'relative').css('left', $(parentElement[0]).css('left'));
            this.renderer.setStyle($("#state_" + transition.fromStateId)[0], 'position', 'relative');
            this.renderer.setStyle($("#state_" + transition.fromStateId)[0], 'left', $(parentElement[0]).css('left'));
        } else {
            //$("state_" + transition.fromStateId).css('posistion', 'relative').css('left', '0px');
            this.renderer.setStyle($("#state_" + transition.fromStateId)[0], 'position', 'relative');
            this.renderer.setStyle($("#state_" + transition.fromStateId)[0], 'left', '0px');
        } */
    }
}