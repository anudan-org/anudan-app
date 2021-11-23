import { GrantClosure } from 'app/model/closures';
import { Disbursement } from 'app/model/disbursement';
import { Report } from './model/report';
import { AppComponent } from 'app/app.component';
import { Grant } from 'app/model/dahsboard';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiUtilService {


  constructor() { }

  public getGrantCardStyle(grant: Grant, appComp: AppComponent) {
    if (Number(appComp.loggedInUser.id) === Number(grant.ownerId) && (grant.grantStatus.internalStatus === 'DRAFT' || grant.grantStatus.internalStatus === 'REVIEW')) {
      return this.ownerWithEdit();
    } else if (Number(appComp.loggedInUser.id) === Number(grant.ownerId) && (grant.grantStatus.internalStatus === 'ACTIVE' || grant.grantStatus.internalStatus === 'CLOSED')) {
      return this.ownerWithNoEdit();
    } else if (grant.workflowAssignment.findIndex(g => Number(g.assignments) === Number(appComp.loggedInUser.id)) >= 0) {
      return this.inWorkflow();
    } else {
      return this.notInWorkflow();
    }
  }

  public getDisbursementCardStyle(disbursement: Disbursement, appComp: AppComponent) {
    if (Number(appComp.loggedInUser.id) === Number(disbursement.ownerId) && (disbursement.status.internalStatus === 'DRAFT' || disbursement.status.internalStatus === 'ACTIVE' || disbursement.status.internalStatus === 'REVIEW')) {
      return this.ownerWithEdit();
    } else if (Number(appComp.loggedInUser.id) === Number(disbursement.ownerId) && (disbursement.status.internalStatus === 'CLOSED')) {
      return this.ownerWithNoEdit();
    } else if (disbursement.assignments.findIndex(g => Number(g.owner) === Number(appComp.loggedInUser.id)) >= 0) {
      return this.inWorkflow();
    } else {
      return this.notInWorkflow();
    }
  }

  public getReportCardStyle(report: Report, appComp: AppComponent) {

    if (Number(appComp.loggedInUser.id) === Number(report.ownerId) && (report.status.internalStatus === 'DRAFT' || report.status.internalStatus === 'REVIEW')) {
      return this.ownerWithEdit();
    } else if (Number(appComp.loggedInUser.id) === Number(report.ownerId) && (report.status.internalStatus === 'ACTIVE' || report.status.internalStatus === 'CLOSED')) {
      return this.ownerWithNoEdit();
    } else if (report.workflowAssignments && report.workflowAssignments.findIndex(g => Number(g.assignmentId) === Number(appComp.loggedInUser.id)) >= 0) {
      return this.inWorkflow();
    } else {
      return this.notInWorkflow();
    }
  }

  public getClosureCardStyle(closure: GrantClosure, appComp: AppComponent) {

    if (Number(appComp.loggedInUser.id) === Number(closure.ownerId) && (closure.status.internalStatus === 'DRAFT' || closure.status.internalStatus === 'REVIEW')) {
      return this.ownerWithEdit();
    } else if (Number(appComp.loggedInUser.id) === Number(closure.ownerId) && (closure.status.internalStatus === 'ACTIVE' || closure.status.internalStatus === 'CLOSED')) {
      return this.ownerWithNoEdit();
    } else if (closure.workflowAssignment && closure.workflowAssignment.findIndex(g => Number(g.assignmentId) === Number(appComp.loggedInUser.id)) >= 0) {
      return this.inWorkflow();
    } else {
      return this.notInWorkflow();
    }
  }

  public ownerWithEdit() {
    return [
      'row',
      'w-100',
      'pl-1',
      'pt-1',
      'mb-4',
      'mx-0',
      'grants-section',
      'owner-highlight'
    ];
  }

  public ownerWithNoEdit() {
    return [
      'row',
      'w-100',
      'pl-1',
      'pt-1',
      'mb-4',
      'mx-0',
      'grants-section',
      'owner-highlight-noedit'
    ];
  }

  public inWorkflow() {
    return [
      'row',
      'w-100',
      'pl-1',
      'pt-1',
      'mb-4',
      'mx-0',
      'grants-section',
      'owner-highlight-wf'
    ];
  }

  public notInWorkflow() {
    return [
      'row',
      'w-100',
      'pl-1',
      'pt-1',
      'mb-4',
      'mx-0',
      'grants-section',
      'owner-highlight-nowf'
    ];
  }


  public getCardStyle(flag: boolean) {
    if (flag) {
      return [
        'row',
        'w-100',
        'pl-1',
        'pt-1',
        'mb-4',
        'mx-0',
        'grants-section',
        'owner-highlight'
      ];
    } else {
      return ['row', 'w-100', 'pl-1', 'pt-1', 'mb-4', 'mx-0', 'grants-section', 'owner-no-highlight']
    }
  }
}
