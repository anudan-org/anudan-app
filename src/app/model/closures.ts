import { User } from './user';
import { Section, Grant, WorkflowStatus, FlowAuthority, SectionDiff, GrantType } from './dahsboard';

export class GrantClosure {
  id: number;
  reason: Reason;
  description: string;
  template: any;
  grant: Grant;
  movedOn: Date;
  createBy: number;
  createdAt: Date;
  updatedBy: number;
  updateAt: Date;
  status: WorkflowStatus;
  workflowAssignment: ClosureAssignment[];
  closureDetails: ClosureDetails;
  canManage: boolean;
  forGranteeUse: boolean;
  granteeUsers: User[];
  flowAuthorities: FlowAuthority[];
  ownerId: number;
  ownerName: string;
  disabledByAmendment: boolean;
}

export class ClosureDetails {
  sections: Section[];
}

export class ClosureAssignment {
  id: number;
  closureId: number;
  stateId: number;
  stateName: WorkflowStatus;
  assignmentId: number;
  assignmentUser: User;
  anchor: boolean;
  constructor() { }
}

export class ClosureTemplate {
  id: number;
  name: string;
  description: string;
  published: boolean;
  _private: boolean;
  defaultTemplate: boolean;
  sections: Section[];
}

export class ClosureSectionInfo {
  sectionId: number;
  sectionName: string;
  closure: GrantClosure;
}

export class ClosureFieldInfo {
  attributeId: number;
  stringAttributeId: number;
  closure: GrantClosure;
}

export class ClosureWorkflowAssignmentModel {
  users: User[];
  workflowStatuses: WorkflowStatus[];
  workflowAssignments: ClosureAssignment[];
  customAssignments: string;
  type: string;
  granteeUsers: User[];
  closure: GrantClosure;
  canManage: boolean;
  grantTypes: GrantType[];
  constructor() { }
}
export class ClosureWorkflowAssignment {
  id: number;
  closureId: number;
  stateName: WorkflowStatus;
  stateId: number;
  assignmentId: number;
  customAssignments: string;
  assignmentUser: User;
  anchor: boolean;
  constructor() { }
}

export class ClosureDocInfo {
  attachmentId: number;
  closure: GrantClosure;
}

export class ClosureSnapshot {
  id: number;
  assignedToId: number;
  closureId: number;
  stringAttributes: string;
  reason: string;
  description: string;
  statusId: number;
  closureDetails: ClosureDetails;
}

export class ClosureNote {
  currentClosure: GrantClosure;
  originalClosure: GrantClosure;
  canManage: boolean;
  validationResult: any;
  tTitle: string;

}



export class Reason {
  id: number;
  reason: string;
  organizationId: number;
  enabled: boolean;
  deleted: boolean;
}

export class ClosureHistory {
  seqid: number;
  id: number;
  reason: string;
  description: string;
  status: WorkflowStatus;
  grant: Grant;
  assignments: ClosureAssignment[];
  flowPermissions: FlowAuthority;
  note: string;
  noteAddedByUser: User;
  noteAdded: Date;
  canManage: boolean;
}

export class ClosureDiff {
  oldClosureReason: string;
  newClosureReason: string;
  oldClosureDescription: string;
  newClosureDescription: string;
  sectionDiffs: SectionDiff[];
  orderDiffs: any[];
}