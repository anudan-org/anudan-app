import { BehaviorSubject } from 'rxjs';
import { OrgTag, TemplateLibrary } from './../../model/dahsboard';
import { AdminService } from './../../admin.service';
import { Role, User } from './../../model/user';
import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../../app.component';
import { MatTabChangeEvent } from '@angular/material';


@Component({
    selector: 'organization-admin-dashboard',
    templateUrl: './orgadmin.component.html',
    styleUrls: ['./orgadmin.component.css'],
    styles: [`
        ::ng-deep .org-tab .mat-tab-header{
            position: static;
            top: 80px;
            z-index: 1040;
            background: #fff;
        },

        :: ng-deep .org-tab .mat-tab-body-content{
            overflow: hidden !important;
        }
    `]
})
export class OrgadminComponent implements OnInit {

    roles: Role[];
    users: User[];
    docs: TemplateLibrary[];
    tags: OrgTag[];
    selectedMenu: BehaviorSubject<any> = new BehaviorSubject({ item: "config", title: "Application Settings" });

    constructor(
        public appComp: AppComponent,
        private adminService: AdminService
    ) { }

    ngOnInit() {
        this.appComp.subMenu = { name: 'Organization Admin' };

        this.selectedMenu.subscribe(val => {
            if (val.item === 'roles') {
                this.adminService.getOrgRoles(this.appComp.loggedInUser).then((data: Role[]) => {
                    this.roles = data;
                });
            } else if (val.item === 'users') {
                this.adminService.getOrgUsers(this.appComp.loggedInUser).then((data: User[]) => {
                    this.users = data;
                    this.adminService.getOrgRoles(this.appComp.loggedInUser).then((data: Role[]) => {
                        this.roles = data;
                    });
                });
            } else if (val.item === 'library') {
                this.adminService.getLibraryDocs(this.appComp.loggedInUser).then((data: TemplateLibrary[]) => {
                    this.docs = data;
                });
            } else if (val.item === 'tags') {
                this.adminService.getOrgTags(this.appComp.loggedInUser).then((data: OrgTag[]) => {
                    this.tags = data;
                });
            }
        });

        this.adminService.getOrgRoles(this.appComp.loggedInUser).then((data: Role[]) => {
            this.roles = data;
        });

        if (this.appComp.loggedInUser.organization.organizationType !== 'GRANTEE') {
            this.selectedMenu.next({ item: "config", title: "Application Settings" });
        } else {
            this.selectedMenu.next({ item: "roles", title: "Roles" });
        }
    }

    tabSelected(ev: MatTabChangeEvent) {
        if (ev.tab.textLabel === 'Roles') {
            this.adminService.getOrgRoles(this.appComp.loggedInUser).then((data: Role[]) => {
                this.roles = data;
            });
        } else if (ev.tab.textLabel === 'Users') {
            this.adminService.getOrgUsers(this.appComp.loggedInUser).then((data1: User[]) => {
                this.users = data1;
                this.adminService.getOrgRoles(this.appComp.loggedInUser).then((data: Role[]) => {
                    this.roles = data;
                });
            });
        } else if (ev.tab.textLabel === 'Library') {
            this.adminService.getLibraryDocs(this.appComp.loggedInUser).then((data: TemplateLibrary[]) => {
                this.docs = data;
            });
        } else if (ev.tab.textLabel === 'Tags') {
            this.adminService.getOrgTags(this.appComp.loggedInUser).then((data: OrgTag[]) => {
                this.tags = data;
            });
        }
    }

    switchMenu(item, title) {
        this.selectedMenu.next({ item: item, title: title });
    }
}
