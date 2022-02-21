import { GrantClosure } from 'app/model/closures';
import { User } from "./user";
import * as moment from "moment";
import _date = moment.unitOfTime._date;
import { NativeDateAdapter } from "@angular/material";
import { Report } from "./report";

export class Organization {
  id: number;
  name: string;
  code: string;
  organizationType: string;
  type: string;
  createdAt: Date;
  createdBy: string;
  description: string;
  website: string;
  twitter: string;
  facebook: string;
  linkedin: string;
  instagram: string;
}

export class GrantorOrganization {
  id: number;
  name: string;
  code: string;
  createdAt: Date;
  createdBy: string;
  hostUrl: string;
  imageName: string;
  navbarColor: string;
  navbarTextColor: string;
  rfps: any[];
  type: string;
}

export class StatePermission {
  id: number;
  permission: string;
  createdAt: Date;
  createdBy: string;
}

export class WorkflowStatus {
  id: number;
  name: string;
  displayName: string;
  terminal: boolean;
  internalStatus: string;
  verb: string;
  statePermissions: StatePermission[];
  createdAt: Date;
  createdBy: string;
}

export class SubmissionStatus {
  id: number;
  name: string;
  displayName: string;
  terminal: boolean;
  statePermissions: any[];
  createdAt: Date;
  createdBy: string;
}

export class GrantKpi {
  id: number;
  title: string;
  description: string;
  scheduled: boolean;
  periodicity: number;
  frequency: string;
  kpiType: string;
  kpiReportingType: string;
  createdAt: Date;
  createdBy: string;
  templates: Template[];
}

export class Template {
  description: string;
  id: number;
  location: string;
  name: string;
  type: string;
  version: number;
  fileType: string;
  data: string;
}

export class Note {
  id: number;
  message: string;
  postedOn: Date;
  postedBy: User;
}

export class QuantitiaveKpisubmission {
  id: number;
  goal: number;
  actuals: number;
  grantKpi: GrantKpi;
  note: string;
  notesHistory: Note[];
  submissionDocs: Doc[];
  toReport: boolean;
  submission: Submission;
}

export class QualitativeKpiSubmission {
  id: number;
  goal: string;
  actuals: string;
  grantKpi: GrantKpi;
  note: string;
  notesHistory: Note[];
  submissionDocs: Doc[];
  toReport: boolean;
  submission: Submission;
}

export class Doc {
  id: number;
  fileName: string;
  fileType: string;
  version: number;
  data: string;
}

export class DocumentKpiSubmission {
  id: number;
  goal: string;
  actuals: string;
  grantKpi: GrantKpi;
  type: string;
  note: string;
  notesHistory: Note[];
  submissionDocs: Doc[];
  toReport: boolean;
  submission: Submission;
}

export class FlowAuthority {
  id: number;
  fromStateId: number;
  fromName: string;
  toStateId: number;
  toName: string;
  action: string;
  noteRequired: boolean;
  seqOrder: number;
  tTitle: string;
  forwardDirection: boolean;
}

export class Submission {
  id: number;
  grant: Grant;
  title: string;
  submitBy: Date;
  submitDateStr: string;
  submissionStatus: SubmissionStatus;
  quantitiaveKpisubmissions: QuantitiaveKpisubmission[];
  qualitativeKpiSubmissions: QualitativeKpiSubmission[];
  documentKpiSubmissions: DocumentKpiSubmission[];
  createdAt: Date;
  createdBy: string;
  flowAuthorities: FlowAuthority[];
  actionAuthorities: ActionAuthorities;
  submissionNotes: Note[];
  openForReporting: boolean;

  getQuantitativeKpiById(id: number) {
    for (const q of this.quantitiaveKpisubmissions) {
      if (q.id === id) {
        return q;
      }
    }
  }
}

export class ActionAuthorities {
  permissions: string[];
  id: number;
}

export class Attribute {
  id: number;
  fieldName: string;
  fieldType: string;
  attributeOrder: number;
  fieldValue: string = null;
  fieldTableValue: TableData[] = null;
  docs: TemplateLibrary[];
  attachments: Attachment[];
  target: string;
  actualTarget: string;
  cumulativeActuals: number;
  frequency: string;
  deletable: boolean;
  required: boolean;
  canEdit: boolean;
}

export class Attachment {
  id: number;
  name: string;
  description: string;
  location: string;
  version: number;
  title: string;
  type: string;
  createdOn: Date;
  createdBy: string;
  updatedOn: Date;
  updatedBy: string;
}

export class Section {
  id: number;
  sectionName: string;
  attributes: Attribute[];
  deletable: boolean;
  order: number;
}

export class GrantDetails {
  sections: Section[];
}

export class Kpi {
  id: number;
  title: string;
  description: string;
  scheduled: boolean;
  periodicity: number;
  frequency: string;
  kpiType: string;
  kpiReportingType: string;
  createdAt: Date;
  createdBy: string;
  templates: Template[];
}
export class Grant {
  id: number;
  organization: Organization;
  grantorOrganization: GrantorOrganization;
  name: string;
  description: string;
  grantStatus: WorkflowStatus;
  substatus: WorkflowStatus;
  statusName: string;
  startDate: Date;
  stDate: string;
  endDate: Date;
  duration: string;
  amount: number;
  enDate: string;
  submissions: Submission[];
  actionAuthorities: ActionAuthorities;
  flowAuthorities: FlowAuthority[];
  grantDetails: GrantDetails;
  kpis: Kpi[];
  representative: string;
  templateId: number;
  grantTemplate: GrantTemplate;
  createdAt: Date;
  createdBy: string;
  currentAssignment: number;
  workflowAssignment: WorkflowAssignments[];
  workflowAssignments: WorkflowAssignments[];
  note: string;
  noteAdded: Date;
  noteAddedBy: string;
  noteAddedByUser: User;
  securityCode: string;
  canManage: boolean;
  approvedReportsDisbursements: TableData[];
  referenceNo: string;
  hasOngoingDisbursement: boolean;
  projectDocumentsCount: number;
  approvedDisbursementsTotal: number;
  approvedReportsForGrant: number;
  origGrantId: number;
  amendGrantId: number;
  amended: boolean;
  origGrantRefNo: string;
  minEndEndate: Date;
  grantTypeId: number;
  isInternal: boolean;
  grantTags: GrantTag[];
  tags: GrantTag[];
  ownerName: string;
  ownerId: number;
  closureInProgress: boolean;
  hashClosure: boolean;
  closureId: number;
  refundAmount: number;
  refundReason: string;
  ongoingDisbursementAmount: number;
}

export class GrantTag {
  id: number;
  tagName: string;
  grantId: number;
  orgTagId: number;
}

export class GrantSnapshot {
  id: number;
  assignedToId: number;
  grantId: number;
  grantee: string;
  stringAttributes: string;
  name: string;
  description: string;
  amount: number;
  startDate: Date;
  endDate: Date;
  representative: string;
  grantStatusId: number;
  grantDetails: GrantDetails;
}

export class GrantHistory {
  seqid: number;
  id: number;
  organization: Organization;
  grantorOrganization: GrantorOrganization;
  name: string;
  description: string;
  grantStatus: WorkflowStatus;
  substatus: WorkflowStatus;
  statusName: string;
  startDate: Date;
  stDate: string;
  endDate: Date;
  duration: string;
  amount: number;
  enDate: string;
  submissions: Submission[];
  actionAuthorities: ActionAuthorities;
  flowAuthorities: FlowAuthority[];
  grantDetails: GrantDetails;
  kpis: Kpi[];
  representative: string;
  templateId: number;
  grantTemplate: GrantTemplate;
  createdAt: Date;
  createdBy: string;
  currentAssignment: User[];
  workflowAssignment: WorkflowAssignments[];
  note: string;
  noteAdded: Date;
  noteAddedBy: string;
  noteAddedByUser: User;
}

export class WorkflowAssignments {
  id: number;
  grantId: number;
  stateName: WorkflowStatus;
  stateId: number;
  assignments: number;
  assignmentUser: User;
  anchor: boolean;
  history: any[];
  constructor() { }
}
export class GrantTemplate {
  id: number;
  name: string;
  description: string;
  published: boolean;
  _private: boolean;
  sections: Section[];
  defaultTemplate: boolean;
}

export class Tenant {
  name: string;
  grants: Grant[];
  grantTemplates: GrantTemplate[];
  templateLibrary: TemplateLibrary[];
}

export class Tenants {
  tenants: Tenant[];
}

export class FileTemplates {
  kpiId: number;
  title: string;
  grantId: number;
  subTitle: string;
  templates: Template[];
  type: string;
  canManage: boolean;
}

export class AttachmentTemplates {
  kpiDataId: number;
  kpiDataType: string;
  grantId: number;
  title: string;
  subTitle: string;
  docs: Doc[];
  type: string;
  canManage: boolean;
}

export class NoteTemplates {
  kpiDataId: number;
  kpiDataType: string;
  grantId: number;
  title: string;
  subTitle: string;
  notes: Note[];
  canManage: boolean;
}

export class GrantNote {
  currentGrant: Grant;
  originalGrant: Grant;
  canManage: boolean;
  canMove: boolean;
  messages: any;
  validationResult: any;
  tTitle: string;
}

export class SerializationHelper {
  static toInstance<T>(obj: T, json: string): T {
    const jsonObj = JSON.parse(json);

    if (typeof obj["fromJSON"] === "function") {
      obj["fromJSON"](jsonObj);
    } else {
      for (const propName of jsonObj) {
        obj[propName] = jsonObj[propName];
      }
    }

    return obj;
  }
}

export class Notifications {
  id: number;
  message: string;
  title: string;
  read: boolean;
  postedOn: Date;
  grantId: number;
  reportId: number;
  notificationFor;
  disbursementId: number;
}

export class ColumnData {
  id: number;
  name: string;
  value: string;
  dataType: string;
}

export class TableData {
  name: string;
  header: string;
  columns: ColumnData[];
  enteredByGrantee: boolean;
  status: boolean;
  saved: boolean;
  actualDisbursementId: number;
  disbursementId: number;
  reportId: number;
  showForGrantee: boolean;
}

export class TemplateLibrary {
  id: number;
  name: string;
  description: string;
  location: string;
  version: number;
  granterId: number;
  editMode: boolean = false;
  fileType: string;
}

export class FieldInfo {
  attributeId: number;
  stringAttributeId: number;
  grant: Grant;
}

export class DocInfo {
  attachmentId: number;
  grant: Grant;
}

export class SectionInfo {
  sectionId: number;
  sectionName: string;
  grant: Grant;
}

export class WorkflowAssignmentModel {
  users: User[];
  workflowStatuses: WorkflowStatus[];
  workflowAssignment: WorkflowAssignments[];
  grant: Grant;
  type: string;
  canManage: boolean;
  grantTypes: GrantType[];
  constructor() { }
}

export class AttachmentDownloadRequest {
  attachmentIds: number[];
}

export class GrantDiff {
  oldGrantName: string;
  newGrantName: string;
  oldGrantStartDate: Date;
  newGrantStartDate: Date;
  oldGrantEndDate: Date;
  newGrantEndDate: Date;
  oldGrantAmount: number;
  newGrantAmount: number;
  oldGrantee: string;
  newGrantee: string;
  oldRep: string;
  newRep: string;
  sectionDiffs: SectionDiff[];
  orderDiffs: any[];
  //attributeOrderDiffs: any[];
}

export class SectionDiff {
  hasSectionLevelChanges = false;
  order: number;
  oldSection: any;
  newSection: any;
  attributesDiffs: AttributeDiff[];
  attributeOrderDiffs: any[] = [];
}
export class AttributeDiff {
  section: string;
  oldAttribute: any;
  newAttribute: any;
}

export class CustomDateAdapter extends NativeDateAdapter {
  format(date: Date, displayFormat: Object): string {
    if (displayFormat === "input") {
      const day = date.getDate();
      const month = moment(date).format("MMM"); //date.getUTCMonth() + 1;
      const year = date.getFullYear();
      // Return the format as per your requirement
      return `${day}-${month}-${year}`;
    } else {
      return date.toDateString();
    }
  }
}


export class GrantType {
  id: number;
  name: string;
  description: string;
  internal: boolean;
  granterId: number;
  colorCode: string;
}

export class OrgTag {
  id: number;
  name: string;
  disabled: boolean;
  used: boolean;
}