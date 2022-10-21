import {Organization} from './dahsboard';

export class Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  editMode: boolean = false;
  hasUsers: boolean = false;
  linkedUsers: number;
}

export class UserRole {
  id: number;
  role: Role;
}

export class Permission {
  id: number;
  permission: string;
}

export class User {
  id?: number;
  firstName?: string;
  lastName?: string;
  emailId?: string;
  username?: string;
  password?: string;
  organization?: Organization;
  userRoles?: UserRole[];
  permissions: string[];
  recaptchaToken: string;
  userProfile: string;
  editMode: boolean = false;
  admin:boolean;
  deleted: boolean;
  active: boolean;
}
