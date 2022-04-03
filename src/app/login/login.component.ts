import { GrantType } from './../model/dahsboard';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

import { Role, User } from '../model/user';
import { AppComponent } from '../app.component';
import { AccessCredentials } from '../model/access-credentials';

import { AuthService } from 'ng-social-login-module';
import { GoogleLoginProvider, LinkedinLoginProvider } from 'ng-social-login-module';
import { SocialUser } from 'ng-social-login-module';
import { ToastrService } from 'ngx-toastr';
import { Notifications } from '../model/dahsboard'
import { interval } from 'rxjs';
import { RecaptchaComponent } from 'ng-recaptcha';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {

  user: User;
  signInUser: AccessCredentials;
  provider: string;
  socialUser: SocialUser;
  headers: HttpHeaders;
  loggedIn: boolean;
  parameters: any;
  logoURL: string;
  host: string;
  currentEmail: string = '';
  orgName: string;
  canSignIn: boolean = false;
  reCaptchaResolved: boolean = false;
  showPassword: boolean = false;
  recaptchaToken: string;
  //recaptchaVisible = false;
  loginForm = new FormGroup({
    emailId: new FormControl('', Validators.email),
    password: new FormControl('', [Validators.required, this.noWhitespaceValidator]),
  });

  @ViewChild('reCaptcha') reCaptcha: RecaptchaComponent;
  cookieEnabled: boolean;
  navbar: string;

  constructor(private http: HttpClient,
    private router: Router,
    public appComponent: AppComponent,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService) {


    this.cookieEnabled = navigator.cookieEnabled;
    if (!this.cookieEnabled) {
      this.router.navigate(['/nocookie']);
    }

    this.host = localStorage.getItem('X-TENANT-CODE');
    this.activatedRoute.queryParams.subscribe(params => {
      if (Object.keys(params).length !== 0) {
        this.parameters = params;
      }
    });
    const tenantCode = localStorage.getItem('X-TENANT-CODE');



    const url = '/api/public/tenant/' + tenantCode;
    this.http.get(url, { responseType: 'text' }).subscribe((orgName) => {
      localStorage.setItem('ORG-NAME', orgName);
      this.orgName = localStorage.getItem('ORG-NAME');
    });

    const url2 = '/api/public/tenant/' + tenantCode + "/navbar";
    this.http.get(url2, { responseType: 'text' }).subscribe((navbar) => {
      localStorage.setItem('NAV-BAR', navbar);
      this.navbar = localStorage.getItem('NAV-BAR');
    }, error => {
    });
  }

  signInWithGoogle(): void {

    this.provider = GoogleLoginProvider.PROVIDER_ID;
    this.authService.signIn(GoogleLoginProvider.PROVIDER_ID).then((userData) => {
      this.socialUser = userData;
      this.loggedIn = (this.socialUser != null);
      const user: AccessCredentials = {
        username: this.socialUser.email,
        password: '',
        provider: this.provider,
        role: 'user',
        recaptchaToken: ''
      };
      this.signIn(user);
    });
    /*this.authService.authState.subscribe((socialUser) => {
      console.log(socialUser);
      t
    });*/
  }

  ngOnInit() {

    this.appComponent.logo = "/api/public/images/" + localStorage.getItem("X-TENANT-CODE") + '/logo?' + (new Date().getTime()).toString();
    this.logoURL = this.appComponent.logo;

    if (this.appComponent.loggedInUser) {
      this.appComponent.logout();
    }
    this.loginForm.valueChanges.subscribe(data => {
      if (data.emailId === null || data.password === null || data.emailId.trim() === "" || data.password.trim() === "") {
        this.reCaptchaResolved = false;
      }
    });

    if (this.parameters && this.parameters.email) {
      this.currentEmail = this.parameters.email;
    }


  }

  onSubmit() {
    // TODO: Use EventEmitter with form value
    /*if(this.recaptchaToken===undefined){
        alert("Please tick on reCaptcha to let us know that you're not a bot.");
        return;
    }*/
    console.warn(this.loginForm.value);
    const email = (this.emailId.value !== null && this.emailId.value !== "") ? this.emailId.value : (this.currentEmail !== null && this.currentEmail !== "") ? this.currentEmail : "";
    const user: AccessCredentials = {
      username: email,
      password: this.password.value,
      provider: 'ANUDAN',
      role: 'user',
      recaptchaToken: this.recaptchaToken
    };
    this.signIn(user);
  }

  get emailId() {
    return this.loginForm.get('emailId');
  }

  get password() {
    return this.loginForm.get('password');
  }

  signIn(user: AccessCredentials) {
    //console.log(localStorage.getItem('X-TENANT-CODE'));
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE') === 'undefined' ? 'ANUDAN' : localStorage.getItem('X-TENANT-CODE')
      }),
      observe: 'response' as 'body'
    };

    let url = '/api/authenticate';

    this.http.post<HttpResponse<User>>(url, user, httpOptions).subscribe(resp => {

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


      this.appComponent.profile = "/api/public/images/profile/" + this.user.id + '?' + (new Date().getTime()).toString();
      localStorage.setItem('USER', '' + JSON.stringify(this.user));
      this.appComponent.loggedInUser = this.user;

      if (this.appComponent.loggedInUser && this.appComponent.loggedInUser.organization.organizationType === 'GRANTER') {
        this.appComponent.logo = "/api/public/images/" + localStorage.getItem("X-TENANT-CODE") + '/logo?' + (new Date().getTime()).toString();
      } else if (this.appComponent.loggedInUser && this.appComponent.loggedInUser.organization.organizationType === 'GRANTEE') {
        this.appComponent.logo = "/api/public/images/" + localStorage.getItem("X-TENANT-CODE") + '/' + this.appComponent.loggedInUser.organization.id + '/logo?' + (new Date().getTime()).toString();
      } else {
        this.appComponent.logo = "/api/public/images/" + localStorage.getItem("X-TENANT-CODE") + '/logo?' + (new Date().getTime()).toString();
      }

      this.logoURL = this.appComponent.logo;
      console.log(this.user);

      this.getGrantTypes();

      if (this.user.organization.type === 'GRANTEE' || this.user.organization.type === 'GRANTER') {
        if (this.parameters) {
          if (this.parameters.g || this.parameters.r || this.parameters.d) {
            this.router.navigate(['/dashboard'], { queryParams: { g: this.parameters.g, r: this.parameters.r, d: this.parameters.d, email: this.parameters.email, org: this.parameters.org, type: this.parameters.type, status: 'e' } });
          } else {
            this.router.navigate(['/dashboard'], { queryParams: { g: this.parameters.g, r: this.parameters.r, d: this.parameters.d, email: this.parameters.email, org: this.parameters.org, type: this.parameters.type, status: 'd' } });
          }
        } else {
          this.router.navigate(['/dashboard']);
        }
      } else {
        this.router.navigate(['/admin/tenants'], { queryParams: { g: this.parameters.g, r: this.parameters.r, d: this.parameters.d, email: this.parameters.email, org: this.parameters.org, type: this.parameters.type, status: 'e' } });
      }
    },
      error => {

        const errorMsg = error as HttpErrorResponse;
        console.log(error);
        this.toastr.error(errorMsg.error.message, errorMsg.error.messageTitle, {
          enableHtml: true
        });
        this.reCaptcha.reset();
      });
  }

  showPopover(message: string) {
    console.log(message);
  }

  signup() {
    this.router.navigate(['registration'])
  }

  resolved(evt) {
    this.recaptchaToken = evt;
    if (evt != null) {
      this.reCaptchaResolved = true;
    } else {
      this.reCaptchaResolved = false;
    }
  }

  togglePassword(action: string) {
    if (action === 'show') {
      this.showPassword = true;
    } else if (action === 'hide') {
      this.showPassword = false;
    }
  }


  public noWhitespaceValidator(control: FormControl) {
    let isWhitespace = (control.value || '').trim().length === 0;
    let isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true }
  }

  requestPasswordReset() {
    this.router.navigate(['/passwordreset'], { queryParams: { mail: this.loginForm.get('emailId').value } });
  }

  getGrantTypes() {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    if (this.appComponent.loggedInUser) {
      const url = "/api/user/" + this.appComponent.loggedInUser.id + "/grant/grantTypes";
      this.http.get(url, httpOptions).subscribe((result: GrantType[]) => {
        this.appComponent.grantTypes = result;
      });
    }
  }

}
