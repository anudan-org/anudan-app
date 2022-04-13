import { Component, Inject, OnInit, ElementRef, Renderer2, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Notifications } from '../../model/dahsboard';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts';
import { Router } from '@angular/router';
import { GrantDataService } from '../../grant.data.service';



declare var $: any;
declare var jsPlumb: any;


@Component({
  selector: 'app-notificationspopup-dialog',
  templateUrl: './notificationspopup.component.html',
  styleUrls: ['./notificationspopup.component.scss']
})
export class NotificationspopupComponent implements OnInit, AfterViewInit {

  messages: Notifications[] = [];
  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService);
  expanded: boolean = false;
  notifications: Notifications[];

  constructor(
    public dialogRef: MatDialogRef<NotificationspopupComponent>
    , @Inject(MAT_DIALOG_DATA) public notificationsData: any
    , private http: HttpClient
    , private renderer: Renderer2
    , @Inject(ElementRef) er: ElementRef
    , private router: Router
    , private grantData: GrantDataService
  ) {
    this.notifications = notificationsData.notifs;
    this.dialogRef.disableClose = false;
    this.messages = this.notifications;
  }


  ngAfterViewInit() {
    const clickableGrantLinks = document.getElementsByClassName("go-to-grant-class");
    if (clickableGrantLinks.length > 0) {
      for (let i = 0; i < clickableGrantLinks.length; i++) {
        clickableGrantLinks[i].addEventListener('click', (e: MouseEvent) => {
          const elem = e.target as HTMLElement;
          const notificationId = elem.parentElement.parentElement.id;
          const notif: Notifications = this.messages.filter(m => m.id === Number(notificationId))[0];
          e.preventDefault();
          this.manageGrant(notif);
          return false;
        });
      }
    }

    const clickableDisbursementLinks = document.getElementsByClassName("go-to-disbursement-class");
    if (clickableDisbursementLinks.length > 0) {
      for (let i = 0; i < clickableDisbursementLinks.length; i++) {
        clickableDisbursementLinks[i].addEventListener('click', (e: MouseEvent) => {
          const elem = e.target as HTMLElement;
          const notificationId = elem.parentElement.parentElement.id;
          const notif: Notifications = this.messages.filter(m => m.id === Number(notificationId))[0];
          e.preventDefault();
          this.manageDisbursement(notif);
          return false;
        });
      }
    }

    const clickableReportLinks = document.getElementsByClassName("go-to-report-class");
    if (clickableReportLinks.length > 0) {
      for (let i = 0; i < clickableReportLinks.length; i++) {
        clickableReportLinks[i].addEventListener('click', (e: MouseEvent) => {
          const elem = e.target as HTMLElement;
          const notificationId = elem.parentElement.parentElement.id;
          const notif: Notifications = this.messages.filter(m => m.id === Number(notificationId))[0];
          e.preventDefault();
          this.manageReport(notif);
          return false;
        });
      }
    }

    const clickableClosureLinks = document.getElementsByClassName("go-to-closure-class");
    if (clickableClosureLinks.length > 0) {
      for (let i = 0; i < clickableClosureLinks.length; i++) {
        clickableClosureLinks[i].addEventListener('click', (e: MouseEvent) => {
          const elem = e.target as HTMLElement;
          const notificationId = elem.parentElement.parentElement.id;
          const notif: Notifications = this.messages.filter(m => m.id === Number(notificationId))[0];
          e.preventDefault();
          this.manageClosure(notif);
          return false;
        });
      }
    }
  }
  ngOnInit() {
    //do nothing
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(false);
  }

  getHumanTime(notification): string {
    var time = new Date().getTime() - new Date(notification.postedOn).getTime();
    return this.humanizer.humanize(time, { largest: 1, round: true })
  }

  manageGrant(notification: Notifications) {
    this.dialogRef.close({ result: true, notificationFor: 'GRANT', data: notification });
  }

  manageReport(notification: Notifications) {
    this.dialogRef.close({ result: true, notificationFor: 'REPORT', data: notification });
  }

  manageClosure(notification: Notifications) {
    this.dialogRef.close({ result: true, notificationFor: 'CLOSURE', data: notification });
  }

  manageDisbursement(notification: Notifications) {
    this.dialogRef.close({ result: true, notificationFor: 'DISBURSEMENT', data: notification });
  }

  markAsRead(ev: any, notification: Notifications) {
    this.expanded = !this.expanded;

    if (this.expanded) {
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
          'Authorization': localStorage.getItem('AUTH_TOKEN')
        })
      };
      let url = '/api/user/' + this.notificationsData.user.id + '/notifications/markread/'
        + notification.id;

      this.http.put<Notifications>(url, {}, httpOptions).subscribe((notif: Notifications) => {
        notification.read = true;// = notif;
      });
    }
  }
}
