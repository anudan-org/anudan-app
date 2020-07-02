import { Component, Inject, OnInit, AfterViewInit, ViewChild, ElementRef, Renderer2, HostListener } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatButtonModule, MatDialog } from '@angular/material';
import { WorkflowAssignmentModel } from '../../model/dahsboard';
import { WorkflowTransition } from '../../model/workflow-transition';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { WorkflowDataService } from 'app/workflow.data.service';
import { User } from 'app/model/user';
import { MessagingComponent } from '../messaging/messaging.component';
import { FieldDialogComponent } from '../field-dialog/field-dialog.component';
import { OwnersPopupComponent } from '../owners-popup/owners-popup.component';

declare var $: any;
declare var jsPlumb: any;

@Component({
    selector: 'app-wfassignment-dialog',
    templateUrl: './wfassignment.component.html',
    styleUrls: ['./wfassignment.component.scss']
})
export class WfassignmentComponent implements OnInit, AfterViewInit {

    assignmentData: any;
    transitions: WorkflowTransition[];
    elemRef: ElementRef;
    jsPlumbInstance;
    scrollListener;
    canManage: boolean = true;
    @ViewChild("flowContainer") flowContainer: ElementRef;
    title: string;
    previousUser;
    previousNodeOwner;

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
            this.data.model.users.sort(function (a, b) { return (a.firstName.toLowerCase() > b.firstName.toLowerCase()) ? 1 : ((b.firstName.toLowerCase() > a.firstName.toLowerCase()) ? -1 : 0); });
        }
        if (this.data.model.granteeUsers) {
            this.data.model.granteeUsers.sort(function (a, b) { return (a.firstName.toLowerCase() > b.firstName.toLowerCase()) ? 1 : ((b.firstName.toLowerCase() > a.firstName.toLowerCase()) ? -1 : 0); });
        }

        window.addEventListener('scroll', this.redrawOnScroll.bind(this), true);
        if (this.data.model.type === 'grant') {
            this.title = this.data.model.grant.name;
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
                        const historyNode = this.renderer.createElement('div');
                        this.renderer.addClass(historyNode, 'col-3');
                        const assForHistory = this.data.model.workflowAssignment.filter(a => a.stateId === transition.fromStateId);
                        if (assForHistory && assForHistory.length > 0 && assForHistory[0].history && assForHistory[0].history.length > 0) {
                            const histLink = this.renderer.createElement('a');
                            this.renderer.setAttribute(histLink, 'style', 'font-size: 9px; color: #000; border-radius: 3px; padding: 4px 6px; box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.5); font-weight: 400; background: rgba(200,200,200,0.95); text-transform: initial;');
                            this.renderer.appendChild(histLink, this.renderer.createText("Past Approver(s)"));
                            this.renderer.listen(histLink, 'click', (event) => this.showOwners(event, assForHistory[0].history, 'Past Approver(s)'));
                            this.renderer.appendChild(historyNode, histLink);
                        }
                        this.renderer.appendChild(node, historyNode);
                        const stateNode = this.renderer.createElement('div');
                        this.renderer.addClass(stateNode, 'col-3');
                        this.renderer.addClass(stateNode, 'p-0');
                        this.renderer.addClass(stateNode, 'text-right');
                        const nodeStateName = this.renderer.createText(transition._from);
                        this.renderer.appendChild(stateNode, nodeStateName);
                        this.renderer.appendChild(node, stateNode);

                        const ownerNode = this.renderer.createElement('div');
                        this.renderer.addClass(ownerNode, 'col-6');
                        const nodeOwner = this.renderer.createElement('select');
                        this.renderer.addClass(nodeOwner, 'anu-input');
                        this.renderer.addClass(nodeOwner, 'anu-select');


                        this.renderer.setAttribute(nodeOwner, 'style', 'max-width: 240px;');
                        const currentUserAssignment = this.data.model.workflowAssignment.filter((assignment) => assignment.assignments === JSON.parse(localStorage.getItem('USER')).id && assignment.stateId === this.data.model.grant.grantStatus.id);
                        const ownerUser = this.data.model.workflowAssignment.filter((assignment) => assignment.assignments === JSON.parse(localStorage.getItem('USER')).id && assignment.anchor);
                        if ((currentUserAssignment.length > 0 || (ownerUser.length > 0)) && this.data.model.grant.grantStatus.internalStatus !== 'ACTIVE') {
                        } else {
                            this.canManage = false;
                            this.renderer.setAttribute(nodeOwner, 'disabled', 'disabled');
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

                            this.renderer.appendChild(nodeOwnerOptions, document.createTextNode(username));
                            this.renderer.appendChild(nodeOwner, nodeOwnerOptions);

                        }

                        //this.renderer.addClass(nodeOwner,'anu-input');
                        this.renderer.appendChild(ownerNode, nodeOwner);
                        this.renderer.appendChild(node, ownerNode);

                        this.previousNodeOwner = nodeOwner;



                        this.renderer.setAttribute(node, 'id', nodeId);
                        this.renderer.addClass(node, 'state-node');
                        if (transition.fromStateId === this.data.model.grant.grantStatus.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fa');
                            this.renderer.addClass(indicator, 'fa-arrow-circle-right');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(node, indicator);
                        }
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
                        this.renderer.setAttribute(node, 'id', nodeId);
                        this.renderer.addClass(node, 'state-node');
                        this.renderer.addClass(node, 'my-5');
                        this.renderer.appendChild(this.flowContainer.nativeElement, node);

                        if (transition.toStateId === this.data.model.grant.grantStatus.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fa');
                            this.renderer.addClass(indicator, 'fa-arrxow-circle-right');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(node, indicator);
                        }
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
                    console.log(error);
                    this.toastr.error(errorMsg.error.message, errorMsg.error.messageTitle, {
                        enableHtml: true
                    });
                    this.dialogRef.close(false);
                });
        } else if (this.data.model.type === 'report') {
            this.title = this.data.model.report.name;
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
                        this.renderer.addClass(node, this.getColorCodeByStatus(this.data.model.workflowStatuses.filter((status) => status.id === transition.fromStateId)[0].internalStatus));

                        const historyNode = this.renderer.createElement('div');
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
                        this.renderer.appendChild(node, historyNode);

                        const stateNode = this.renderer.createElement('div');
                        this.renderer.addClass(stateNode, 'col-3');
                        this.renderer.addClass(stateNode, 'p-0');
                        this.renderer.addClass(stateNode, 'text-right');
                        let nodeStateName;
                        if (transition.internalStatus !== 'ACTIVE') {
                            nodeStateName = this.renderer.createText(transition._from);
                        } else {
                            nodeStateName = this.renderer.createText(this.data.model.report.grant.organization.name);
                        }
                        this.renderer.appendChild(stateNode, nodeStateName);
                        this.renderer.appendChild(node, stateNode);

                        const ownerNode = this.renderer.createElement('div');
                        this.renderer.addClass(ownerNode, 'col-6');
                        const nodeOwner = this.renderer.createElement('select');
                        this.renderer.setAttribute(nodeOwner, 'style', 'max-width: 240px;');
                        this.renderer.addClass(nodeOwner, 'anu-input');
                        this.renderer.addClass(nodeOwner, 'anu-select');
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

                                this.renderer.appendChild(nodeOwnerOptions, document.createTextNode(username));
                                this.renderer.appendChild(nodeOwner, nodeOwnerOptions);

                            }
                        } else {
                            if (this.canManage) {
                                const nodeInvite = this.renderer.createElement('input');
                                this.renderer.setAttribute(nodeInvite, 'placeholder', 'Invite Grantee/Partner User');
                                this.renderer.addClass(nodeInvite, 'anu-input');
                                this.renderer.addClass(nodeOwner, 'anu-select');
                                this.renderer.setAttribute(nodeInvite, 'style', 'width: 100%; text-align: center;');
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

                                        this.renderer.appendChild(nodeOwnerOptions, document.createTextNode(username));
                                        this.renderer.appendChild(nodeOwner, nodeOwnerOptions);
                                    }
                                }

                            }
                        }

                        //this.renderer.addClass(nodeOwner,'anu-input');
                        this.renderer.appendChild(ownerNode, nodeOwner);
                        this.renderer.appendChild(node, ownerNode);




                        this.renderer.setAttribute(node, 'id', nodeId);
                        this.renderer.addClass(node, 'state-node');
                        if (transition.fromStateId === this.data.model.report.status.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fa');
                            this.renderer.addClass(indicator, 'fa-arrow-circle-right');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(node, indicator);
                        }
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
                        this.renderer.setAttribute(node, 'id', nodeId);
                        this.renderer.addClass(node, 'state-node');
                        this.renderer.addClass(node, 'my-5');
                        this.renderer.addClass(node, 'text-center');
                        this.renderer.appendChild(this.flowContainer.nativeElement, node);

                        if (transition.toStateId === this.data.model.report.status.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fa');
                            this.renderer.addClass(indicator, 'fa-arrow-circle-right');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(node, indicator);
                        }
                    }
                }

                jsPlumb.Defaults.Endpoint = "Blank";
                this.jsPlumbInstance = jsPlumb.getInstance(jsPlumb.Defaults);

                this.showFlow(this.transitions);

                $('.owner-class').on('change', function () {
                    this.onYesClick();
                });
                this.updateReportUsers();
            },
                error => {
                    const errorMsg = error as HttpErrorResponse;
                    console.log(error);
                    this.toastr.error(errorMsg.error.message, errorMsg.error.messageTitle, {
                        enableHtml: true
                    });
                    this.dialogRef.close(false);
                });
        } else if (this.data.model.type === 'disbursement') {
            this.title = 'Disbursement Approval Request Workflow';
            this.workflowDataService.getDisbursementWorkflow(this.data.model.disbursement).then(transitions => {

                this.transitions = transitions;

                let counter = 1;
                for (let transition of transitions) {
                    const nodeId = 'state_' + transition.fromStateId;
                    if (this.elemRef.nativeElement.querySelector('#' + nodeId) === null) {
                        const node = this.renderer.createElement('div');
                        this.renderer.addClass(node, this.getColorCodeByStatus(this.data.model.workflowStatuses.filter((status) => status.id === transition.fromStateId)[0].internalStatus));
                        const historyNode = this.renderer.createElement('div');
                        this.renderer.addClass(historyNode, 'col-3');
                        const assForHistory = this.data.model.workflowAssignments.filter(a => a.stateId === transition.fromStateId);
                        if (assForHistory && assForHistory.length > 0 && assForHistory[0].history && assForHistory[0].history.length > 0) {
                            const histLink = this.renderer.createElement('a');
                            this.renderer.setAttribute(histLink, 'style', 'font-size: 9px; color: #000; border-radius: 3px; padding: 4px 6px; box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.5); font-weight: 400; background: rgba(200,200,200,0.95); text-transform: initial;');
                            this.renderer.appendChild(histLink, this.renderer.createText("Past Approver(s)"));
                            this.renderer.listen(histLink, 'click', (event) => this.showOwners(event, assForHistory[0].history, 'Past Approver(s)'));
                            this.renderer.appendChild(historyNode, histLink);
                        }
                        this.renderer.appendChild(node, historyNode);
                        const stateNode = this.renderer.createElement('div');
                        this.renderer.addClass(stateNode, 'col-3');
                        this.renderer.addClass(stateNode, 'p-0');
                        this.renderer.addClass(stateNode, 'text-right');
                        const nodeStateName = this.renderer.createText(transition._from);
                        this.renderer.appendChild(stateNode, nodeStateName);
                        this.renderer.appendChild(node, stateNode);

                        const ownerNode = this.renderer.createElement('div');
                        this.renderer.addClass(ownerNode, 'col-6');
                        const nodeOwner = this.renderer.createElement('select');
                        this.renderer.setAttribute(nodeOwner, 'style', 'max-width: 240px;');
                        this.renderer.addClass(nodeOwner, "anu-input");
                        this.renderer.addClass(nodeOwner, 'anu-select');
                        const currentUserAssignment = this.data.model.workflowAssignments.filter((assignment) => assignment.owner === JSON.parse(localStorage.getItem('USER')).id && assignment.stateId === this.data.model.disbursement.status.id);
                        const ownerUser = this.data.model.workflowAssignments.filter((assignment) => assignment.owner === JSON.parse(localStorage.getItem('USER')).id && assignment.anchor);
                        if ((currentUserAssignment.length > 0 || (ownerUser.length > 0)) && this.data.model.disbursement.status.internalStatus !== 'ACTIVE') {
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

                            this.renderer.appendChild(nodeOwnerOptions, document.createTextNode(username));
                            this.renderer.appendChild(nodeOwner, nodeOwnerOptions);

                        }

                        //this.renderer.addClass(nodeOwner,'anu-input');
                        this.renderer.appendChild(ownerNode, nodeOwner);
                        this.renderer.appendChild(node, ownerNode);




                        this.renderer.setAttribute(node, 'id', nodeId);
                        this.renderer.addClass(node, 'state-node');
                        if (transition.fromStateId === this.data.model.disbursement.status.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fa');
                            this.renderer.addClass(indicator, 'fa-arrow-circle-right');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(node, indicator);
                        }
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
                        this.renderer.setAttribute(node, 'id', nodeId);
                        this.renderer.addClass(node, 'state-node');
                        this.renderer.addClass(node, 'my-5');
                        this.renderer.appendChild(this.flowContainer.nativeElement, node);

                        if (transition.toStateId === this.data.model.disbursement.status.id) {
                            const indicator = this.renderer.createElement('i');
                            this.renderer.addClass(indicator, 'fa');
                            this.renderer.addClass(indicator, 'fa-arrxow-circle-right');
                            this.renderer.addClass(indicator, 'status-indicator');
                            this.renderer.addClass(node, 'node-highight');
                            this.renderer.appendChild(node, indicator);
                        }
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

        const options = (<HTMLOptionElement>event.currentTarget).parentElement.parentElement.nextElementSibling.firstElementChild.nextElementSibling.nextElementSibling.firstElementChild;
        const previousOptions = (<HTMLOptionElement>event.currentTarget).parentElement.parentElement.previousElementSibling.firstElementChild.nextElementSibling.nextElementSibling.firstElementChild;

        if (previousOptions !== null && previousOptions.children.length > 0) {
            for (var i = 0; i < previousOptions.children.length; i++) {
                if (event.currentTarget.value === (<HTMLOptionElement>previousOptions[i]).value && event.currentTarget.value !== "0") {
                    previousOptions[i].setAttribute("disabled", "disabled");
                    //options[i].setAttribute("selected", "selected");
                } /* else {
                    previousOptions[i].removeAttribute("disabled");
                } */

            }
        }

        if (options !== null && options.children.length > 0) {
            for (var i = 0; i < options.children.length; i++) {
                if (event.currentTarget.value === (<HTMLOptionElement>options[i]).value && event.currentTarget.value !== "0") {
                    options[i].setAttribute("disabled", "disabled");
                    //options[i].setAttribute("selected", "selected");
                    /* if (event.currentTarget.parentElement.parentElement.nextElementSibling.firstElementChild.nextElementSibling.firstElementChild.value === event.currentTarget.value) {
                        event.currentTarget.parentElement.parentElement.nextElementSibling.firstElementChild.nextElementSibling.firstElementChild.value = "0";
                    } */

                } else {
                    options[i].removeAttribute("disabled");
                }
            }
        }
    }

    ngOnDestroy() {
        window.removeEventListener('scroll', this.scroll, true);
    }


    ngAfterViewInit() {
        //this.showFlow(this.transitions);
    }


    showFlow(transitions) {
        const curves = [30, 40, 50, 60, 70, 80, 90, 100];
        const labelPositions = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
        let curvesCnt = 0;
        let posCnt = 0;

        this.jsPlumbInstance.Defaults.Overlays = [];
        for (let transition of transitions) {

            if (Number(transition.seqOrder) === 0) {
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
                }, 150);


            } else {
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
            }


        }

    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.jsPlumbInstance.repaintEverything();
    }

    @HostListener('window:scroll', ['$event']) getScrollHeight(event) {
        console.log(window.pageYOffset, event);
    }

    redrawOnScroll() {
        //this.showFlow(this.transitions);
    }

    onNoClick(): void {
        if (this.verifyChanges()) {
            const d = this.dialog.open(FieldDialogComponent, {
                data: { title: "Assignments have changed.", btnMain: "Save Assignments", btnSecondary: "Discard Changes" },
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
                    if (assignmentTokens.length === 4) {
                        assignMentResult.push({ 'id': assignmentTokens[1], 'stateId': assignmentTokens[2], 'userId': $(assignmentElems[i]).val(), 'reportId': assignmentTokens[3], 'customAssignments': $(customAssignmentElem).val() });
                    } else {
                        assignMentResult.push({ 'id': '', 'stateId': assignmentTokens[1], 'userId': $(assignmentElems[i]).val(), 'reportId': assignmentTokens[2], 'customAssignments': $(customAssignmentElem).val() });
                    }
                }
                this.dialogRef.close({ 'result': true, data: assignMentResult });
            }

        } else if (this.data.model.type === 'disbursement') {
            const assignmentElems = $('[id^="assignment_"]');
            const assignMentResult = [];
            for (let i = 0; i < assignmentElems.length; i++) {
                var assignmentTokens = $(assignmentElems[i]).attr('id').split('_');
                if (assignmentTokens.length === 4) {
                    assignMentResult.push({ 'id': assignmentTokens[1], 'stateId': assignmentTokens[2], 'userId': $(assignmentElems[i]).val(), 'disbursementId': assignmentTokens[3] });
                } else {
                    assignMentResult.push({ 'id': '', 'stateId': assignmentTokens[1], 'userId': $(assignmentElems[i]).val(), 'disbursementId': assignmentTokens[2] });
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
            if (assignmentTokens.length === 4) {
                assignMentResult.push({ 'id': assignmentTokens[1], 'stateId': assignmentTokens[2], 'userId': $(assignmentElems[i]).val(), 'grantId': assignmentTokens[3] });
            } else {
                assignMentResult.push({ 'id': '', 'stateId': assignmentTokens[1], 'userId': $(assignmentElems[i]).val(), 'grantId': assignmentTokens[2] });
            }
        }
        this.dialogRef.close({ 'result': true, data: assignMentResult });
    }

    getRoles(user): string {
        return ' [' + user.userRoles.map(ur => ur.role.name).join(', ') + ']';
    }

    scroll() {
        console.log('scrolled');
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

    zoomOut() {

        const container = this.flowContainer.nativeElement;
        $(container).animate({ 'zoom': 0.8 }, 400, () => {
            console.log('zommed out');
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
        console.log('popup');
    }

    updateGrantAndDisbursementUsers() {
        const assignmentElems = $('[id^="assignment_"]');
        for (let i = 0; i < assignmentElems.length; i++) {
            console.log(assignmentElems[i].getAttribute('data-counter'));

            const prev = assignmentElems[i - 1] ? assignmentElems[i - 1].value : "-1";
            const next = assignmentElems[i + 1] ? assignmentElems[i + 1].value : "-1";

            const arr = [];
            arr.push(prev);
            arr.push(next);

            for (let child of assignmentElems[i].children) {
                if (arr.includes(child.value)) {
                    child.setAttribute('disabled', 'disabled');
                } else {
                    child.removeAttribute('disabled');
                }
            }

        }
    }

    updateReportUsers() {
        const assignmentElems = $('[id^="assignment_"]');
        for (let i = 2; i < assignmentElems.length; i++) {
            console.log(assignmentElems[i].getAttribute('data-counter'));

            const prev = assignmentElems[i - 1] ? assignmentElems[i - 1].value : "-1";
            const next = assignmentElems[i + 1] ? assignmentElems[i + 1].value : "-1";

            const arr = [];
            arr.push(prev);
            arr.push(next);

            for (let child of assignmentElems[i].children) {
                if (arr.includes(child.value)) {
                    child.setAttribute('disabled', 'disabled');
                } else {
                    child.removeAttribute('disabled');
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
                if (orgAss.assignmentId == undefined) {
                    orgAss.assignmentId = 0;
                }
                if (orgAss.assignmentId !== undefined && orgAss.assignmentId !== null && orgAss.assignmentId !== Number(ass.value)) {
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
                if (orgAss.assignments == undefined) {
                    orgAss.assignments = 0;
                }
                if (orgAss.assignments !== undefined && orgAss.assignments !== Number(ass.value)) {
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
            panelClass: 'center-class'
        });


    }

    triggerDrowpDown(event, node) {
        node.click();
    }
}
