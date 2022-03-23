import { UtilsService } from './../utils.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { User } from '../model/user';
import { RegistrationCredentials } from '../model/registration-credentials';
import { AppComponent } from '../app.component';
import { AuthService, GoogleLoginProvider, SocialUser } from 'ng-social-login-module';
import { AccessCredentials } from '../model/access-credentials';
import { register } from 'ts-node';
import { ToastrService } from 'ngx-toastr';
import { MessagingComponent } from '../components/messaging/messaging.component';
import { MatDialog } from '@angular/material';


@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.sass'],
  styles: [`
         ::ng-deep .mat-tooltip  {
             white-space: pre-line    !important;
             text-align: left;
             font-size: 12px;
         }
  `]
})
export class ChangePasswordComponent implements OnInit {

  provider: string;
  socialUser: SocialUser;
  hasEmailId: boolean = false;
  logoURL: string;
  orgName: string;
  parameters: any;
  currentEmail: string = '';
  userOrg: string = '';
  recaptchaToken: string;
  user: User;
  reCaptchaResolved: boolean = false;
  sentStatus: string = "notsent";
  sentEmailStatusMessage: string;
  email: string;
  key: string;
  passwordsMatch: boolean = false;
  hasError: boolean = false;
  errorMessage: String;
  org: string;

  changePasswordForm = new FormGroup({
    pwd1: new FormControl('', [Validators.required, Validators.pattern(this.util.getEmailPattern()), this.noWhitespaceValidator]),
    pwd2: new FormControl('', [Validators.required, Validators.pattern(this.util.getEmailPattern()), this.noWhitespaceValidator]),
  });


  constructor(private activatedRoute: ActivatedRoute, private http: HttpClient, private router: Router, public appComponent: AppComponent, private authService: AuthService, private toastr: ToastrService, private dialog: MatDialog, private util: UtilsService) {
    this.activatedRoute.queryParams.subscribe(params => {
      this.parameters = params;
    });
  }

  ngOnInit() {
    const tenantCode = localStorage.getItem('X-TENANT-CODE');
    this.logoURL = "/api/public/images/" + tenantCode + "/logo";

    const url = '/api/public/tenant/' + tenantCode;
    this.http.get(url, { responseType: 'text' }).subscribe((orgName) => {
      localStorage.setItem('ORG-NAME', orgName);
      this.orgName = localStorage.getItem('ORG-NAME');
    }, error => {
    });

    if (this.parameters.email && this.parameters.key) {
      this.currentEmail = this.parameters.email;
      this.currentEmail = this.currentEmail.replace(/ /g, "+");
      this.key = this.parameters.key;
      this.org = this.parameters.org;
    }

    this.changePasswordForm.valueChanges.subscribe(data => {
      if (data.pwd1 === null || data.pwd1.trim() === "" || data.pwd2 === null || data.pwd2.trim() === "") {
        this.reCaptchaResolved = false;
        this.passwordsMatch = false;
      } else {
        if (data.pwd1 === data.pwd2) {
          this.passwordsMatch = true;
        } else {
          this.passwordsMatch = false;
          this.reCaptchaResolved = false;
        }
      }
    });

  }
  onSubmit() {
    // TODO: Use EventEmitter with form value
    //console.warn(this.granteeRegisteationForm.value);
    this.submit();
  }

  submit() {
    this.changePassword();
  }

  changePassword() {

    this.sentStatus = 'sending';

    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE')
      })
    };

    //const form = this.granteeRegisteationForm.value;

    const pwd1 = this.changePasswordForm.get('pwd1').value;
    const pwd2 = this.changePasswordForm.get('pwd2').value;
    let url = '/api/users/set-password';
    this.http.post<User>(url, { pwd1: pwd1, pwd2: pwd2, key: this.key, email: this.currentEmail, org: this.org }, httpOptions).subscribe((result: User) => {
      this.sentStatus = 'sent';
      this.sentEmailStatusMessage = "Your password has been reset successfully.";

      /*const user2Login: AccessCredentials = {
            username: result.emailId,
            password: pwd1,
            provider: 'ANUDAN',
            role: 'user',
            recaptchaToken: this.recaptchaToken
          };
          const httpOptions2 = {
                headers: new HttpHeaders({
                  'Content-Type': 'application/json',
                  'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE') === 'undefined' ? 'ANUDAN' : localStorage.getItem('X-TENANT-CODE')
                }),
                observe: 'response' as 'body'
              };

              url = '/api/authenticate';

              this.http.post<HttpResponse<User>>(url, user2Login, httpOptions2).subscribe(resp => {

                  const keys = resp.headers.keys();
                  // console.log(keys);
                  this.user = resp.body;


                  localStorage.setItem('AUTH_TOKEN', resp.headers.get('Authorization'));

                  this.user.permissions = new Array();
                  for (const userRole of this.user.userRoles) {
                    if (userRole.role.permissions) {
                      for (const perm of userRole.role.permissions) {
                        this.user.permissions.push(perm.permission);
                      }
                    }
                  }
                    localStorage.setItem('USER', '' + JSON.stringify(this.user));
                    this.appComponent.loggedInUser = this.user;
                  console.log(this.user);

                  if (!this.user.organization || this.user.organization.type === 'GRANTEE') {
                    this.router.navigate(['/dashboard']);
                  } else {
                    this.router.navigate(['/dashboard']);
                  }
                },
                error => {

                  const errorMsg = error as HttpErrorResponse;
                  console.log(error);
                  this.toastr.error(errorMsg.error.message, errorMsg.error.messageTitle, {
                    enableHtml: true
                  });
                });*/
    }, error => {
      const errorMsg = error as HttpErrorResponse;
      this.hasError = true;
      this.sentStatus = 'notsent';
      this.errorMessage = "Password reset failed."
    });

  }


  resolved(evt) {
    this.recaptchaToken = evt;
    if (evt != null) {
      this.reCaptchaResolved = true;
    } else {
      this.reCaptchaResolved = false;
    }
  }

  goBackToLogin() {
    this.router.navigate(['/login']);
  }

  public noWhitespaceValidator(control: FormControl) {
    let isWhitespace = (control.value || '').trim().length === 0;
    let isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true }
  }
}
