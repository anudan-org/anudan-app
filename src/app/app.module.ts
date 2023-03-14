import { DocpreviewComponent } from './docpreview/docpreview.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, NO_ERRORS_SCHEMA, ErrorHandler } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app.routing';
import { ComponentsModule } from './components/components.module';
import { AppComponent } from './app.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { LoginComponent } from './login/login.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { MessagingComponent } from './components/messaging/messaging.component';
import { HomeComponent } from './home/home.component';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { WfassignmentComponent } from './components/wfassignment/wfassignment.component';
import { GranthistoryComponent } from './components/granthistory/granthistory.component';
import { NotificationspopupComponent } from './components/notificationspopup/notificationspopup.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgCircleProgressModule } from 'ng-circle-progress';
import {
  AgmCoreModule
} from '@agm/core';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { RegistrationComponent } from './registration/registration.component';
import { SocialLoginModule, AuthServiceConfig, GoogleLoginProvider, LinkedinLoginProvider } from 'ng-social-login-module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { ToastrModule } from 'ngx-toastr';
import { MatBottomSheet, MatDatepickerModule, MatNativeDateModule, MatIconModule, MatExpansionModule, MatBadgeModule, MatMenuModule, MatSelectModule, MatListModule, MatButtonModule } from '@angular/material';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { Colors } from './model/app-config';
import { ExportAsModule } from 'ngx-export-as';
import { RecaptchaModule } from 'ng-recaptcha';
import { NgxSpinnerModule } from "ngx-spinner";
import { FieldDialogComponent } from './components/field-dialog/field-dialog.component';
import { OwnersPopupComponent } from './components/owners-popup/owners-popup.component';
import { ProjectDocumentsComponent } from './components/project-documents/project-documents.component';
import { NocookieComponent } from './nocookie/nocookie.component';
import { NgxMarkjsModule } from 'ngx-markjs';
import { ClosureSelectionComponent } from './components/closure-selection/closure-selection.component';
import { ReturnsPopupComponent } from './returns-popup/returns-popup.component';
import { RefundpopupComponent } from './refundpopup/refundpopup.component';
import { ProjectFundSummaryComponent } from './project-fund-summary/project-fund-summary.component';
import { LandingComponent } from './landing/landing.component';
import { AutosizeModule } from 'ngx-autosize';
import { ClosureCovernoteComponent} from './closure/closure-covernote/closure-covernote.component';

export class AnudanErrorHandler implements ErrorHandler {
  constructor() {
    // This is intentional
  }
  handleError(error: Error) {
    if (Error) {
      console.log(error);
      return true;
    } else console.log("hello");
  }
}


const config = new AuthServiceConfig([
  {
    id: GoogleLoginProvider.PROVIDER_ID,
    provider: new GoogleLoginProvider('671926612888-d9f3pqqmirp56sf6b5ott27eb1ebdrd3.apps.googleusercontent.com')
  },
  {
    id: LinkedinLoginProvider.PROVIDER_ID,
    provider: new LinkedinLoginProvider('LinkedIn-client-Id')
  }
], true);

export function provideConfig() {
  return config;
}


@NgModule({
  declarations: [
    AppComponent,
    AdminLayoutComponent,
    LoginComponent,
    PasswordResetComponent,
    ChangePasswordComponent,
    HomeComponent,
    WelcomeComponent,
    RegistrationComponent,
    WfassignmentComponent,
    GranthistoryComponent,
    MessagingComponent,
    FieldDialogComponent,
    DocpreviewComponent,
    ClosureSelectionComponent,
    ProjectDocumentsComponent,
    OwnersPopupComponent,
    NotificationspopupComponent,
    NocookieComponent,
    ReturnsPopupComponent,
    RefundpopupComponent,
    ProjectFundSummaryComponent,
    LandingComponent,
    ClosureCovernoteComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    ReactiveFormsModule,
    HttpModule,
    ComponentsModule,
    RouterModule,
    MatTooltipModule,
    MatExpansionModule,
    MatListModule,
    MatBadgeModule,
    AppRoutingModule,
    MatSelectModule,
    HttpClientModule,
    RecaptchaModule,
    MatMenuModule,
    AutosizeModule,
    MDBBootstrapModule.forRoot(),
    ExportAsModule,
    AgmCoreModule.forRoot({
      apiKey: 'YOUR_GOOGLE_MAPS_API_KEY'
    }),
    NgCircleProgressModule.forRoot({
      // set defaults here
      radius: 100,
      outerStrokeWidth: 16,
      innerStrokeWidth: 8,
      outerStrokeColor: '#78C000',
      innerStrokeColor: '#C7E596',
      animationDuration: 300
    }),
    SocialLoginModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    ToastrModule.forRoot({
      autoDismiss: false,
      enableHtml: true
    }),
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatIconModule,
    NgxSpinnerModule,
    NgxMarkjsModule,
    MatButtonModule
  ],
  providers: [
    {
      provide: AuthServiceConfig,
      useFactory: provideConfig,
    },
    MatDatepickerModule,
    MatBottomSheet,
    MatExpansionModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    DatePipe,
    Colors,
    MatMenuModule,
    { provide: ErrorHandler, useClass: AnudanErrorHandler }
  ],
  entryComponents: [WfassignmentComponent, GranthistoryComponent, NotificationspopupComponent, MessagingComponent, FieldDialogComponent, OwnersPopupComponent, ProjectDocumentsComponent, ClosureSelectionComponent, DocpreviewComponent, ReturnsPopupComponent, RefundpopupComponent, ProjectFundSummaryComponent,ClosureCovernoteComponent],
  schemas: [NO_ERRORS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule {
}
