import { UtilsService } from './../utils.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
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
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.sass'],
  styles: [`
       ::ng-deep .mat-tooltip  {
           white-space: pre-line    !important;
           text-align: left;
           font-size: 12px;
       }
  `]
})
export class RegistrationComponent implements OnInit {

  provider: string;
  socialUser: SocialUser;
  logoURL: string;
  orgName: string;
  parameters: any;
  currentEmail: string = '';
  userOrg: string = '';
  recaptchaToken: string;
  user: User;
  reCaptchaResolved: boolean = false;
  sentStatus = 'notsent';
  registrationStatusMessage;
  passwordsMatch: boolean = false;

  registrationForm = this.fb.group({
    emailId: new FormControl('', Validators.email),
    pwd1: new FormControl('', [Validators.pattern(this.util.getEmailPattern())]),
    pwd2: new FormControl('', [Validators.pattern(this.util.getEmailPattern())]),
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
  }, { validator: this.passwordsMatch });


  @ViewChild("emailId") emailIdElem: ElementRef;
  @ViewChild("firstName") firstNameElem: ElementRef;
  @ViewChild("lastName") lastNameElem: ElementRef;
  @ViewChild("password") passwordElem: ElementRef;
  @ViewChild("confirmPassword") confirmPasswordElem: ElementRef;

  constructor(private activatedRoute: ActivatedRoute, private fb: FormBuilder, private http: HttpClient, private router: Router, public appComponent: AppComponent, private authService: AuthService, private toastr: ToastrService, private dialog: MatDialog, private util: UtilsService) {
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

    this.registrationForm.valueChanges.subscribe(data => {
      if (data.emailId === null || data.firstName === null || data.lastName === null || data.emailId.trim() === "" || data.firstName.trim() === "" || data.lastName.trim() === "" || data.pwd1 === null || data.pwd1.trim() === "" || data.pwd2 === null || data.pwd2.trim() === "") {
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

    if (this.parameters.email) {
      this.currentEmail = this.parameters.email;
      this.currentEmail = this.currentEmail.replace(/ /g, "+");
      this.registrationForm.setValue({
        emailId: this.currentEmail,
        pwd1: '',
        pwd2: '',
        firstName: '',
        lastName: ''
      });
    }
    if (this.parameters.org) {
      this.userOrg = this.parameters.org;
    }

    if (this.currentEmail) {
      if (this.parameters.type === 'grant') {
        this.checkIfUserIsRegistered(this.currentEmail, this.parameters.g, this.parameters.type);
      } else if (this.parameters.type === 'report') {
        this.checkIfUserIsRegistered(this.currentEmail, this.parameters.r, this.parameters.type);
      }
    }

  }

  onSubmit() {
    // TODO: Use EventEmitter with form value
    //console.warn(this.granteeRegisteationForm.value);
    this.submit();
  }

  submit() {
    this.sentStatus = 'sending';
    const user = new RegistrationCredentials();
    user.emailId = this.registrationForm.get('emailId').value;
    user.password = this.registrationForm.get('pwd1').value;
    user.firstName = this.registrationForm.get('firstName').value;
    user.lastName = this.registrationForm.get('lastName').value;
    user.organizationName = this.userOrg;
    user.username = user.emailId;
    user.role = 'USER';
    user.organization = null;


    this.registerUser(user);
  }


  registerUser(user: RegistrationCredentials) {

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE')
      })
    };

    //const form = this.granteeRegisteationForm.value;

    const url = '/api/users/';
    this.http.post<User>(url, user, httpOptions).subscribe((response: User) => {

      this.sentStatus = 'sent';
      this.registrationStatusMessage = "Congratulations! Registration was successful."

      /*const user2Login: AccessCredentials = {
        username: response.emailId,
        password: user.password,
        provider: 'ANUDAN',
        role: 'user',
        recaptchaToken: this.recaptchaToken
      };
      const httpOptions = {
            headers: new HttpHeaders({
              'Content-Type': 'application/json',
              'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE') === 'undefined' ? 'ANUDAN' : localStorage.getItem('X-TENANT-CODE')
            }),
            observe: 'response' as 'body'
          };
  
          let url = '/api/authenticate';
  
          this.http.post<HttpResponse<User>>(url, user2Login, httpOptions).subscribe(resp => {
  
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
                this.router.navigate(['/dashboard'], { queryParams: { g: this.parameters.g, email: this.parameters.email,org:this.parameters.org,type:this.parameters.type,status:'n' } });
              } else {
                this.router.navigate(['/dashboard'], { queryParams: { g: this.parameters.g, email: this.parameters.email,org:this.parameters.org,type:this.parameters.type,status:this.parameters.status } });
              }
            },
            error => {
  
              const errorMsg = error as HttpErrorResponse;
              console.log(error);
              this.toastr.error(errorMsg.error.message, errorMsg.error.messageTitle, {
                enableHtml: true
              });
            });*/
      // ocalStorage.setItem('AUTH_TOKEN', resp.headers.get('Authorization'));
      /*localStorage.setItem('USER', JSON.stringify(response));
      this.appComponent.loggedIn = true;
      this.appComponent.loggedInUser = response;
      localStorage.setItem('AUTH_TOKEN', resp.headers.get('Authorization'));

      *//*if(this.parameters){
        this.router.navigate(['welcome'], { queryParams: { g: this.parameters.g, email: this.parameters.email,org:this.parameters.org,type:this.parameters.type } });
      }else{*//*
        this.router.navigate(['dashboard'], { queryParams: { g: this.parameters.g, email: this.parameters.email,org:this.parameters.org,type:this.parameters.type,status:'n' } });*/
      /*}*/
    });
  }

  signUpWithGoogle(): void {

    this.provider = GoogleLoginProvider.PROVIDER_ID;
    this.authService.signIn(GoogleLoginProvider.PROVIDER_ID).then((userData) => {
      this.socialUser = userData;
      const user: RegistrationCredentials = {
        emailId: this.socialUser.email,
        password: this.passwordElem.nativeElement.value,
        confirmPassword: this.confirmPasswordElem.nativeElement.value,
        firstName: this.socialUser.name,
        lastName: '',
        organizationName: this.userOrg,
        username: this.socialUser.email,
        role: 'USER',
        organization: null
      };
      this.registerUser(user);
    });
    /*this.authService.authState.subscribe((socialUser) => {
      console.log(socialUser);
      t
    });*/
  }

  signup() {
  }


  resolved(evt) {
    this.recaptchaToken = evt;
    if (evt != null) {
      this.reCaptchaResolved = true;
    } else {
      this.reCaptchaResolved = false;
    }
  }

  checkIfUserIsRegistered(emailId: string, objectToCheck: string, type: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE')
      })
    };

    //const form = this.granteeRegisteationForm.value;

    const url = '/api/users/check';
    this.http.post<boolean>(url, { email: emailId, object: objectToCheck, type }, httpOptions).subscribe((response: boolean) => {
      if (response) {
        const dialogRef = this.dialog.open(MessagingComponent, {
          data: "Looks like you've registered earlier on Anudan. Please sign in."
        });

        dialogRef.afterClosed().subscribe(result => {
          this.router.navigate(['login']);
        });

      }
    });
  }


  validate() {
    console.log('validate');
  }

  public noWhitespaceValidator(control: FormControl) {
    let isWhitespace = (control.value || '').trim().length === 0;
    let isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true }
  }


  goBackToLogin() {
    this.router.navigate(['/login']);
  }
}
