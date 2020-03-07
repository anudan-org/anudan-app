import {Grant, WorkflowStatus,Section,WorkflowAssignment,FlowAuthority,SectionDiff} from './dahsboard';
import {User} from './user';

export class Report{
    id: number;
    name: string;
     startDate: Date;
     stDate: string;
     endDate: Date;
     enDate: string;
     dueDate: Date;
     dDate: string;
     type: String;
    status: WorkflowStatus;
    createdAt: Date;
    createdBy: User
    updatedAt: Date;
    updatedBy: User;
    template: any;
    granteeUsers: User[];
    reportDetails: ReportDetails;
    workflowAssignments:ReportAssignment[];
    duration: string;
    grant: Grant;
    canEdit: boolean;
    canManage: boolean;
    flowAuthorities: FlowAuthority;
    cumulativeActuals:number;
    linkedReports: number;
    forGranteeUse: boolean;
    futureReportsCount: number;
}

export class ReportHistory{
    seqid: number
    id: number;
    name: string;
     startDate: Date;
     endDate: Date;
     dueDate: Date;
     type: String;
    status: WorkflowStatus;
    createdAt: Date;
    createdBy: User
    updatedAt: Date;
    updatedBy: User;
    template: any;
    granteeUsers: User[];
    reportDetails: ReportDetails;
    workflowAssignments:ReportAssignment[];
    duration: string;
    grant: Grant;
    canEdit: boolean;
    canManage: boolean;
    flowAuthorities: FlowAuthority;
}

export class ReportDetails {
  sections: Section[];
}

export class ReportAssignment{
    id: number;
    reportId: number;
    stateId: number;
    assignmentId: number;
    anchor: boolean;
    constructor(){}
}

export class ReportFieldInfo{
    attributeId: number;
    stringAttributeId: number;
    report: Report;
}

export class ReportDocInfo{
    attachmentId: number;
    report: Report;
}

export class ReportSectionInfo{
    sectionId: number;
    sectionName: string;
    report: Report;
}

export class ReportWorkflowAssignmentModel{
 users: User[];
 workflowStatuses: WorkflowStatus[];
 workflowAssignments: ReportAssignment[];
 customAssignments: string;
 type:string;
 granteeUsers: User[];
 report: Report;
 canManage: boolean;
 constructor(){}
}

export class ReportWorkflowAssignment{
    id: number;
    reportId: number;
    stateName: WorkflowStatus;
    stateId: number;
    assignmentId: number;
    customAssignments: string;
    assignmentUser: User;
    anchor: boolean;
    constructor(){}
}

export class ReportNote{
    currentReport: Report;
    originalReport: Report;
    canManage: boolean;
}

export class ReportDiff{
    oldReportName: string;
    newReportName: string;
    oldReportStartDate: Date;
    newReportStartDate: Date;
    oldReportEndDate: Date;
    newReportEndDate: Date;
    oldReportDueDate: Date;
    newReportDueDate: Date;
    sectionDiffs: SectionDiff[];
}

export class ReportSnapshot {
  id: number;
  assignedToId: number;
  reportId: number;
  stringAttributes: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  dueDate: Date;
  statusId: number;
  reportDetails: ReportDetails;
}

export class ReportTemplate{
  id: number;
  name: string;
  description: string;
  published: boolean;
  _private: boolean;
  defaultTemplate: boolean;
  sections: Section[];
}

export class AdditionReportsModel{
    grant: number;
    report: number;
    grants: Grant[];
    futureReports: Report[];
}