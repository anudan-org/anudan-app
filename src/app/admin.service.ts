import { TemplateLibrary, AttachmentDownloadRequest, Organization, OrgTag } from './model/dahsboard';
import { User, Role, ClosureReasonsOrg } from './model/user';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";

@Injectable(
  {
    providedIn: 'root'
  }
)
export class AdminService {

  constructor(private http: HttpClient) { }

  public getOrgRoles(user: User): Promise<Role[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    const url = 'api/admin/user/' + user.id + '/role';
    return this.http.get(url, httpOptions).toPromise().then<Role[]>().catch(err => {
      return Promise.reject('Error retreiving roles');
    });
  }

  public getclosurereason(user: User): Promise<ClosureReasonsOrg[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    const url = 'api/admin/user/' + user.id + '/closureReasons';
    return this.http.get(url, httpOptions).toPromise().then<ClosureReasonsOrg[]>().catch(err => {
      return Promise.reject('Error retreiving reasons');
    });
  }

  public getOrgUsers(user: User): Promise<User[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    const url = 'api/admin/user/' + user.id + '/user';

    return this.http.get(url, httpOptions).toPromise().then<User[]>().catch(err => {
      return Promise.reject('Could not retreive users');
    });
  }

  public getLibraryDocs(user: User): Promise<TemplateLibrary[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    const url = 'api/admin/user/' + user.id + '/document-library';

    return this.http.get(url, httpOptions).toPromise().then<TemplateLibrary[]>().catch(err => {
      return Promise.reject('Could not retreive library docs');
    });
  }

  public getOrgTags(user: User): Promise<OrgTag[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    const url = 'api/admin/user/' + user.id + '/tags';

    return this.http.get(url, httpOptions).toPromise().then<OrgTag[]>().catch(err => {
      return Promise.reject('Could not retreive library docs');
    });
  }

  public saveLibraryDoc(user: User, formData: any): Promise<TemplateLibrary> {
    const httpOptions = {
      headers: new HttpHeaders({
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    const url = 'api/admin/user/' + user.id + '/document-library';

    return this.http.post(url, formData, httpOptions).toPromise().then<TemplateLibrary>().catch(err => {
      return Promise.reject('Could not retreive library docs');
    });
  }

  public downloadSelectedLibraryDocs(user: User, selectedAttachments: AttachmentDownloadRequest): Promise<void> {
    const httpOptions = {
      responseType: "blob" as "json",
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    const url = 'api/admin/user/' + user.id + '/document-library/download';

    return this.http.post(url, selectedAttachments, httpOptions).toPromise().then<void>().catch(err => {
      return Promise.reject('Could not retreive library docs');
    });
  }

  public deleteSelectedLibraryDocs(user: User, selectedAttachments: AttachmentDownloadRequest): Promise<void> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    const url = 'api/admin/user/' + user.id + '/document-library/delete';

    return this.http.post(url, selectedAttachments, httpOptions).toPromise().then<void>().catch(err => {
      return Promise.reject('Could not retreive library docs');
    });
  }

  public deleteUser(user: User, loggedInUser: User): Promise<User[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    const url = 'api/admin/user/' + loggedInUser.id + '/user/' + user.id;
    return this.http.delete(url, httpOptions).toPromise().then<User[]>().catch(err => {
      return Promise.reject('Could not delete user');
    });
  }

  public unDeleteUser(user: User, loggedInUser: User): Promise<User[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    const url = 'api/admin/user/' + loggedInUser.id + '/user/' + user.id + '/undelete';
    return this.http.get(url, httpOptions).toPromise().then<User[]>().catch(err => {
      return Promise.reject('Could not undelete user');
    });
  }

  public getReferenceOrgs(user: User): Promise<Organization[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    const url = 'api/admin/user/' + user.id + '/reference-orgs';

    return this.http.get(url, httpOptions).toPromise().then<Organization[]>().catch(err => {
      return Promise.reject('Could not retreive reference orgs');
    });
  }
}