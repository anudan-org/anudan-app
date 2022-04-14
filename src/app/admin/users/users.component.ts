import { MessagingComponent } from './../../components/messaging/messaging.component';
import { AdminService } from './../../admin.service';
import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User, Role, UserRole } from '../../model/user'
import { AppComponent } from '../../app.component'
import { FieldDialogComponent } from '../../components/field-dialog/field-dialog.component';
import { MatDialog } from '@angular/material';
import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatAutocomplete } from '@angular/material/autocomplete';

@Component({
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss'],
    styles: [
        `
        ::ng-deep .user-edit-class .mat-form-field-wrapper {
          padding-bottom: 0 !important;
        },
      `,
        `
        ::ng-deep .user-edit-class .mat-form-field-infix {
            border-top: 0 !important;
          }
        `,
        `
        ::ng-deep .user-list-item-class .mat-list-item-content {
            padding: 0 !important;
          }
        `
    ],

})
export class UsersComponent implements OnInit {

    @Input("users") users: User[];
    newEmail: string;
    newRole: Role;
    focusField: any;
    @Input("roles") roles: Role[];
    filteredOptions: Observable<Role[]>;
    userFilteredOptions: Observable<Role[]>;
    myControl: FormControl;
    myNewControl: FormControl;
    separatorKeysCodes: number[] = [ENTER, COMMA];
    existingUser: boolean = false;


    @ViewChild('createRoleBtn') createRoleBtn: ElementRef;
    @ViewChild('email') emailInput: ElementRef;
    @ViewChild('roleInput') roleInput: ElementRef<HTMLInputElement>;
    @ViewChild('auto') matAutocomplete: MatAutocomplete;

    constructor(private appComponent: AppComponent, private http: HttpClient, private dialog: MatDialog, private adminService: AdminService) { }

    ngOnInit() {
        this.myControl = new FormControl();
        this.myNewControl = new FormControl();
    }


    createNewUser() {

        const newUser = new User();
        newUser.emailId = this.newEmail;

        const userRoles: UserRole[] = [];

        const userRole = new UserRole();
        userRole.role = this.newRole;
        userRoles.push(userRole);

        newUser.userRoles = userRoles;

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
        };
        const url = 'api/admin/user/' + this.appComponent.loggedInUser.id + '/user';
        this.http.post(url, newUser, httpOptions).subscribe((user: User) => {
            this.users.unshift(user);
            this.appComponent.tenantUsers = this.users;
            this.toggleCreateUser();
            this.newEmail = undefined;
            this.newRole = undefined;
        });

    }



    deleteUser(user) {
        const adminUsers = this.users.filter(u => (u.admin && !u.deleted));
        if (user.admin && adminUsers.length === 1) {
            this.dialog.open(MessagingComponent, {
                data: "At least one active administrator is required",
                panelClass: "center-class"
            })
            return;
        }
        const dialogRef = this.dialog.open(FieldDialogComponent, {
            data: { title: 'Are you sure you want to disable ' + (user.firstName !== undefined ? user.firstName : 'Unregistered User') + ' ' + (user.lastName !== undefined ? user.lastName : ''), btnMain: "Delete User", btnSecondary: "Not Now" }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.adminService.deleteUser(user, this.appComponent.loggedInUser).then((data: User[]) => {
                    this.users = data;
                    this.appComponent.tenantUsers = this.users;
                });
            }
        });
    }

    unDeleteUser(user) {

        this.adminService.unDeleteUser(user, this.appComponent.loggedInUser).then((data: User[]) => {
            this.users = data;
            this.appComponent.tenantUsers = this.users;
        });
    }

    saveUser(user: User) {

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
        };
        const url = 'api/admin/user/' + this.appComponent.loggedInUser.id + '/user';
        this.http.put(url, user, httpOptions).subscribe((userReturned: User) => {
            user = userReturned;
            user.editMode = false;
            const index = this.users.findIndex(u => u.id === user.id);
            this.users[index] = user;
            this.appComponent.tenantUsers = this.users;
        });
    }

    toggleCreateUser() {
        const createRoleButton = this.createRoleBtn.nativeElement;
        if (createRoleButton.disabled) {
            createRoleButton.disabled = false;
        } else if (!createRoleButton.disabled) {
            createRoleButton.disabled = true;
        }
    }


    private _filter(value: any): Role[] {
        let filterValue;
        if (typeof value === 'string') {
            filterValue = value.toLowerCase();
        } else {
            filterValue = value.name;
        }

        return this.roles.filter(option => option.name.toLowerCase().includes(filterValue));
    }


    canSendInvite() {
        if ((this.newEmail !== undefined && this.newEmail.trim() !== '') && (this.newRole !== undefined) && !this.existingUser) {
            return false;
        } else {
            return true;
        }
    }

    getRoles(user: User) {
        const roles = [];
        for (let userRole of user.userRoles) {
            roles.push(userRole.role);
        }
        if (roles.length === 0) {
            return null;
        }
        return roles;
    }

    getRoleId(user: User) {
        const roles = [];
        for (let userRole of user.userRoles) {
            roles.push(userRole.role);
        }
        if (roles.length === 0) {
            return null;
        }
        return roles[0].id;
    }

    getRolesArray(user: User) {
        const roles = [];
        for (let userRole of user.userRoles) {
            roles.push(userRole.role.name);
        }
        return roles[0];
    }

    editUserRoles(user: User, evt: Event) {
        user.editMode = true;

        const roles1 = [];
        for (let role of user.userRoles) {
            roles1.push(role);
        }
        this.userFilteredOptions = this.myNewControl.valueChanges
            .pipe(
                startWith(''),
                map(value => typeof value === 'string' ? value : ''),
                map(name => name ? this._filter(name) : roles1)
            );
    }

    cancelUserUpdate(user: User) {
        user.editMode = false;
    }

    editUser(user: User, ev) {
        user.editMode = true;
    }

    cancelEdit(user: User) {
        user.editMode = false;
    }

    setNewRole(user: User, ev) {
        console.log(ev);
        const newRole: Role = this.roles.filter(r => r.id === Number(ev.value))[0];
        if (user.userRoles.length === 0) {
            user.userRoles.push(new UserRole());
        }
        user.userRoles[0].role = newRole;

    }

    validateEmail(ev) {
        const emailId = ev.target.value;
        if (emailId === undefined || emailId === null || (emailId !== null && emailId.trim() === '')) {
            return;
        }
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
        };
        const user = this.appComponent.loggedInUser;
        const url = 'api/admin/user/' + user.id + '/validate/' + emailId;

        this.http.get(url, httpOptions).subscribe((result: any) => {
            this.existingUser = result.exists;
        });
    }

    reInviteUser(user: User, ev) {
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
        };
        const url = 'api/admin/user/' + this.appComponent.loggedInUser.id + '/reinvite/' + user.id;

        this.http.get(url, httpOptions).subscribe((result: any) => {
            this.dialog.open(MessagingComponent, {
                data: 'This user has been re-invited to register with ' + user.organization.name,
                panelClass: 'center-class'
            });
        });
    }
}
