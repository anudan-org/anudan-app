import { ClosureDataService } from './../../closure.data.service';
import { GrantClosure } from './../../model/closures';
import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { AppComponent } from '../../app.component';
import { Router, ActivatedRoute } from '@angular/router';
import { GrantDataService } from '../../grant.data.service';
import { SingleReportDataService } from '../../single.report.data.service';
import { Grant, Notifications } from '../../model/dahsboard';
import { Report } from '../../model/report';
import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts';
import { CdkDragDrop, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog, MatExpansionPanel, MatDivider } from '@angular/material';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Disbursement } from 'app/model/disbursement';
import { DisbursementDataService } from 'app/disbursement.data.service';


declare const $: any;
declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
  divide: boolean;
}

export const ROUTES: RouteInfo[] = [
  { path: '/dashboard', title: 'Dashboard', icon: 'dashboard.png', class: '', divide: false },
  { path: '/grants', title: 'Grants', icon: 'grant.svg', class: '', divide: false },
  { path: '/reports', title: 'Reports', icon: 'report.svg', class: '', divide: false },
  { path: '/disbursements', title: 'Disbursements', icon: 'disbursement.svg', class: '', divide: false },
  /*{ path: '/disbursements', title: 'Disbursements',  icon: 'disbursement.svg', class: '',divide:false },*/
  { path: '/organization', title: 'Organization', icon: 'organization.svg', class: '', divide: true },
  { path: '/rfps', title: 'RFPs', icon: 'rfp.svg', class: '', divide: false },
  { path: '/applications', title: 'Applications', icon: 'proposal.svg', class: '', divide: false }
  /*,
  { path: '/user-profile', title: 'Administration',  icon:'person', class: '' },
  { path: '/table-list', title: 'Table List',  icon:'content_paste', class: '' },
  { path: '/typography', title: 'Typography',  icon:'library_books', class: '' },
  { path: '/icons', title: 'Icons',  icon:'bubble_chart', class: '' },
  { path: '/maps', title: 'Maps',  icon:'location_on', class: '' },
  { path: '/notifications', title: 'Notifications',  icon:'notifications', class: '' },
  { path: '/upgrade', title: 'Upgrade to PRO',  icon:'unarchive', class: 'active-pro' },*/
];

export const GRANT_ROUTES: RouteInfo[] = [
  { path: '/grant/basic-details', title: 'Grant Header', icon: 'grant.svg', class: '', divide: false },
  { path: '/grant/sections', title: 'Grant Details', icon: 'view_agenda', class: '', divide: false },
  { path: '/grant/preview', title: 'Preview & Submit', icon: 'preview.svg', class: '', divide: false }
];

export const SINGLE_REPORT_ROUTES: RouteInfo[] = [
  { path: '/report/report-header', title: 'Report Header', icon: 'grant.svg', class: '', divide: false },
  { path: '/report/report-sections', title: 'Report Details', icon: 'view_agenda', class: '', divide: false },
  { path: '/report/report-preview', title: 'Preview & Submit', icon: 'preview.svg', class: '', divide: false }
];

export const REPORT_ROUTES: RouteInfo[] = [
  { path: '/reports/upcoming', title: 'Upcoming', icon: 'grant.svg', class: '', divide: false },
  { path: '/reports/submitted', title: 'In-Progress', icon: 'view_agenda', class: '', divide: false },
  { path: '/reports/approved', title: 'Approved', icon: 'preview.svg', class: '', divide: false }
];

export const GRANT_SUB_ROUTES: RouteInfo[] = [
  { path: '/grants/draft', title: 'In-progress', icon: 'grant.svg', class: '', divide: false },
  { path: '/grants/active', title: 'Active', icon: 'view_agenda', class: '', divide: false },
  { path: '/grants/closed', title: 'Closed', icon: 'preview.svg', class: '', divide: false }
];

export const DISBURSEMENT_SUB_ROUTES: RouteInfo[] = [
  { path: '/disbursements/in-progress', title: 'Requests', icon: 'disbursement.svg', class: '', divide: false },
  { path: '/disbursements/approved', title: 'Approved', icon: 'view_agenda', class: '', divide: false },
  { path: '/disbursements/closed', title: 'Disbursed', icon: 'preview.svg', class: '', divide: false }
];

export const SINGLE_DISBURSEMENT_SUB_ROUTES: RouteInfo[] = [
  { path: '/disbursement/approval-request', title: 'Approval Request Note', icon: 'grant.svg', class: '', divide: false },
  { path: '/disbursement/preview', title: 'Preview & Submit', icon: 'grant.svg', class: '', divide: false }
];

export const PLATFORM_ROUTES: RouteInfo[] = [
  { path: '/admin/tenants', title: 'Tenants', icon: 'grant.svg', class: '', divide: false },
  { path: '/admin/settings', title: 'Settings', icon: 'grant.svg', class: '', divide: false }
];


export const ORGANIZATION_ROUTES: RouteInfo[] = [
  { path: '/organization/details', title: 'About', icon: 'stop', class: '', divide: false },
  { path: '/organization/administration', title: 'Administration', icon: 'stop', class: '', divide: false },
  { path: '/organization/data', title: 'Export', icon: 'stop', class: '', divide: false },
];

export const SINGLE_CLOSURE_ROUTES: RouteInfo[] = [
  { path: '/grant-closure/header', title: 'Closure Header', icon: 'grant.svg', class: '', divide: false },
  { path: '/grant-closure/sections', title: 'Closure Details', icon: 'view_agenda', class: '', divide: false },
  { path: '/grant-closure/preview', title: 'Preview & Submit', icon: 'preview.svg', class: '', divide: false }
];



export let SECTION_ROUTES: RouteInfo[] = [];
export let REPORT_SECTION_ROUTES: RouteInfo[] = [];
export let CLOSURE_SECTION_ROUTES: RouteInfo[] = [];

export const ADMIN_ROUTES: RouteInfo[] = [
  { path: '/workflow-management', title: 'Manage Workflows', icon: 'person', class: '', divide: false }
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  styles: [`
        ::ng-deep .profilearea > .mat-expansion-indicator:after {
          transform: rotate(225deg) !important;
          border-width: 0 1px 1px 0 !important;
        }

        ::ng-deep .grant-expansion-panel-notifications > .mat-expansion-indicator::after {
            color: #424652 !important;
        }
      `]
})
export class SidebarComponent implements OnInit {
  menuItems: any[];
  grantMenuItems: any[];
  grantSubMenuItems: any[];
  disbursementSubMenuItems: any[];
  sectionMenuItems: any[];
  reportSectionMenuItems: any[];
  closureSectionMenuItems: any[];
  adminMenuItems: any[];
  platformMenuItems: any[];
  reportMenuItems: any[];
  singleReportMenuItems: any[];
  singleClosureMenuItems: any[];
  singleDisbursementMenuItems: any[];
  orgMenuItems: any[];
  currentGrant: Grant;
  currentReport: Report;
  currentClosure: GrantClosure;
  currentDisbursement: Disbursement;
  logoUrl: string;
  hasUnreadMessages = false;
  unreadMessages = 0;
  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService);
  canManageOrg: boolean = false;

  action: number;
  sub: any;

  @ViewChild('organization') organizationElem: MatExpansionPanel;
  @ViewChild('reports') reportsElem: MatExpansionPanel;
  @ViewChild('grants') grantsElem: MatExpansionPanel;
  @ViewChild('disbursements') disbursementsElem: MatExpansionPanel;


  constructor(public appComponent: AppComponent,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private grantData: GrantDataService,
    private closureService: ClosureDataService,
    private singleReportDataService: SingleReportDataService,
    private ref: ChangeDetectorRef,
    private elRef: ElementRef,
    private dialog: MatDialog,
    private http: HttpClient,
    private disbursementDataService: DisbursementDataService) {
    if (appComponent.loggedInUser.organization.organizationType === 'GRANTEE') {
      REPORT_ROUTES[0].title = 'Submissions Due'
    }
    if (!this.appComponent.loggedInUser) {
      this.appComponent.logout();
    }

    this.canManageOrg = this.appComponent.loggedInUser.userRoles.filter((ur) => ur.role.name === 'Admin').length > 0;
  }

  drop(event: CdkDragDrop<string[]>) {

    if (this.appComponent.currentView === 'grant' && this.currentGrant) {
      moveItemInArray(this.sectionMenuItems, event.previousIndex, event.currentIndex);
      event.item.element.nativeElement.classList.remove('section-dragging');
      for (let i = 0; i < this.sectionMenuItems.length; i++) {
        for (let section of this.currentGrant.grantDetails.sections) {
          if (section.sectionName === this.sectionMenuItems[i].title) {
            section.order = i + 1;
          }
        }
      }
      this.grantData.changeMessage(this.currentGrant, this.appComponent.loggedInUser.id);
    }
    if (this.appComponent.currentView === 'report' && this.currentReport) {
      moveItemInArray(this.reportSectionMenuItems, event.previousIndex, event.currentIndex);
      event.item.element.nativeElement.classList.remove('section-dragging');
      for (let i = 0; i < this.reportSectionMenuItems.length; i++) {
        for (let section of this.currentReport.reportDetails.sections) {
          if (section.sectionName === this.reportSectionMenuItems[i].title) {
            section.order = i + 1;
          }
        }
      }
      this.singleReportDataService.changeMessage(this.currentReport);
    }


  }
  dragStarted(event: CdkDragStart<String[]>) {
    event.source.element.nativeElement.style.zIndex = '1070';
  }

  ngOnInit() {
    this.menuItems = ROUTES.filter(menuItem => menuItem);
    this.grantMenuItems = GRANT_ROUTES.filter(menuItem => menuItem);
    this.adminMenuItems = ADMIN_ROUTES.filter(menuItem => menuItem);
    this.orgMenuItems = ORGANIZATION_ROUTES.filter(menuItem => menuItem);
    if (this.appComponent.loggedInUser.organization.organizationType === 'GRANTEE') {
      const idx = this.orgMenuItems.findIndex(o => o.title === 'Export');
      this.orgMenuItems.splice(idx, 1);
    }
    this.platformMenuItems = PLATFORM_ROUTES.filter(menuItem => menuItem);
    this.reportMenuItems = REPORT_ROUTES.filter(menuItem => menuItem);
    this.grantSubMenuItems = GRANT_SUB_ROUTES.filter(menuItem => menuItem);
    this.disbursementSubMenuItems = DISBURSEMENT_SUB_ROUTES.filter(menuItem => menuItem);
    this.singleReportMenuItems = SINGLE_REPORT_ROUTES.filter(menuItem => menuItem);
    this.singleClosureMenuItems = SINGLE_CLOSURE_ROUTES.filter(menuItem => menuItem);
    this.singleDisbursementMenuItems = SINGLE_DISBURSEMENT_SUB_ROUTES.filter(menuItem => menuItem);
    this.ref.detectChanges();

    this.grantData.currentMessage.subscribe((grant) => {
      this.currentGrant = grant;
      this.buildSectionsSideNav(null);
    });

    this.singleReportDataService.currentMessage.subscribe((report) => {
      this.currentReport = report;
      this.buildSectionsSideNav(null);
    });

    this.closureService.currentMessage.subscribe((closure) => {
      this.currentClosure = closure;
      //this.buildSectionsSideNav(null);
    });

    this.disbursementDataService.currentMessage.subscribe((d) => this.currentDisbursement = d);

    const tenantCode = localStorage.getItem('X-TENANT-CODE');
    this.logoUrl = this.appComponent.logo;


    /*if(this.currentGrant && (this.currentGrant.grantStatus.internalStatus=='ACTIVE' || this.currentGrant.grantStatus.internalStatus=='CLOSED')){
      this.appComponent.action = 'preview';
    }*/

  }




  messageRead() {
    console.log("Read");
  }

  manageGrant(notification: Notifications, grantId: number) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };
    let url = '/api/user/' + this.appComponent.loggedInUser.id + '/notifications/markread/'
      + notification.id;

    this.http.put<Notifications>(url, {}, httpOptions).subscribe((notif: Notifications) => {
      notification = notif;
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
          'Authorization': localStorage.getItem('AUTH_TOKEN')
        })
      };

      url = '/api/user/' + this.appComponent.loggedInUser.id + '/grant/' + grantId;
      this.http.get(url, httpOptions).subscribe((grant: Grant) => {
        let localgrant = this.appComponent.currentTenant.grants.filter(g => g.id = grantId)[0];
        if (localgrant) {
          localgrant = grant;
        } else {
          this.appComponent.currentTenant.grants.push(grant);
        }
        this.grantData.changeMessage(grant, this.appComponent.loggedInUser.id);
        this.appComponent.originalGrant = JSON.parse(JSON.stringify(grant));;
        this.appComponent.currentView = 'grant';

        this.appComponent.selectedTemplate = grant.grantTemplate;

        if ((grant.workflowAssignments.filter(wf => wf.stateId === grant.grantStatus.id && wf.assignments === this.appComponent.loggedInUser.id).length > 0) && this.appComponent.loggedInUser.organization.organizationType !== 'GRANTEE' && (grant.grantStatus.internalStatus !== 'ACTIVE' && grant.grantStatus.internalStatus !== 'CLOSED')) {
          grant.canManage = true;
        } else {
          grant.canManage = false;
        }
        if (grant.canManage && grant.grantStatus.internalStatus != 'ACTIVE' && grant.grantStatus.internalStatus != 'CLOSED') {
          this.router.navigate(['grant/basic-details']);
        } else {
          this.appComponent.action = 'preview';
          this.router.navigate(['grant/preview']);
        }
        $("#messagepopover").css('display', 'none');
      });
    });
  }

  buildSectionsSideNav(ev: Event): string {
    this.manageMenutItemsDisplay(ev);
    console.log('>>>>>>>>> ' + this.appComponent.currentView);
    this.grantData.currentMessage.subscribe(grant => this.currentGrant = grant);
    this.singleReportDataService.currentMessage.subscribe(report => this.currentReport = report);

    SECTION_ROUTES = [];
    REPORT_SECTION_ROUTES = [];
    CLOSURE_SECTION_ROUTES = [];
    if (this.appComponent.currentView === 'grant' && this.currentGrant && (SECTION_ROUTES.length === 0 || this.appComponent.sectionAdded === true || this.appComponent.sectionUpdated === true)) {
      this.sectionMenuItems = [];
      SECTION_ROUTES = [];
      this.currentGrant.grantDetails.sections.sort((a, b) => (a.order > b.order) ? 1 : -1)
      for (let section of this.currentGrant.grantDetails.sections) {
        if (section.sectionName !== '' && section.sectionName !== '_') {
          SECTION_ROUTES.push({ path: '/grant/section/' + section.sectionName.replace(/[^0-9a-z]/gi, ''), title: section.sectionName, icon: 'stop', class: '', divide: false });
        } else {
          SECTION_ROUTES.push({ path: '/grant/section/' + section.id, title: '_', icon: 'stop', class: '', divide: false });
        }
      }

      this.sectionMenuItems = SECTION_ROUTES.filter(menuItem => menuItem);
      this.appComponent.sectionAdded = false;
      return SECTION_ROUTES[0].path;
    }

    if (this.appComponent.currentView === 'report' && this.currentReport && (REPORT_SECTION_ROUTES.length === 0 || this.appComponent.sectionAdded === true || this.appComponent.sectionUpdated === true)) {
      this.reportSectionMenuItems = [];
      REPORT_SECTION_ROUTES = [];
      this.currentReport.reportDetails.sections.sort((a, b) => (a.order > b.order) ? 1 : -1)
      for (let section of this.currentReport.reportDetails.sections) {
        if (section.sectionName !== '' && section.sectionName !== '_') {
          REPORT_SECTION_ROUTES.push({ path: '/report/section/' + section.sectionName.replace(/[^0-9a-z]/gi, ''), title: section.sectionName, icon: 'stop', class: '', divide: false });
        } else {
          REPORT_SECTION_ROUTES.push({ path: '/grant/section/' + section.id, title: '_', icon: 'stop', class: '', divide: false });
        }
      }

      this.reportSectionMenuItems = REPORT_SECTION_ROUTES.filter(menuItem => menuItem);
      this.appComponent.sectionAdded = false;
      return REPORT_SECTION_ROUTES[0].path;
    }

    if (this.appComponent.currentView === 'grant-closure' && this.currentClosure && (CLOSURE_SECTION_ROUTES.length === 0 || this.appComponent.sectionAdded === true || this.appComponent.sectionUpdated === true)) {
      this.closureSectionMenuItems = [];
      CLOSURE_SECTION_ROUTES = [];
      this.currentClosure.closureDetails.sections.sort((a, b) => (a.order > b.order) ? 1 : -1)
      for (let section of this.currentClosure.closureDetails.sections) {
        if (section.sectionName !== '' && section.sectionName !== '_') {
          CLOSURE_SECTION_ROUTES.push({ path: '/grant-closure/section/' + section.sectionName.replace(/[^0-9a-z]/gi, ''), title: section.sectionName, icon: 'stop', class: '', divide: false });
        } else {
          CLOSURE_SECTION_ROUTES.push({ path: '/grant-closure/section/' + section.id, title: '_', icon: 'stop', class: '', divide: false });
        }
      }

      this.closureSectionMenuItems = CLOSURE_SECTION_ROUTES.filter(menuItem => menuItem);
      this.appComponent.sectionAdded = false;
      return CLOSURE_SECTION_ROUTES[0].path;
    }
  }


  isMobileMenu() {
    if ($(window).width() > 6000) {
      return false;
    }
    return true;
  };

  showProfile() {
    this.appComponent.currentView = 'user-profile';
    this.router.navigate(['user-profile']);
  }

  createNewSection() {
    this.appComponent.createNewSection.next(true);
  }

  createNewReportSection() {
    this.appComponent.createNewReportSection.next(true);
  }

  createNewClosureSection() {
    this.appComponent.createNewClosureSection.next(true);
  }

  manageMenutItemsDisplay(evt: Event) {
    if (evt === undefined || evt === null) {
      return;
    }
    const submenu = $(evt.srcElement).closest('.mat-expansion-panel');
    if (submenu.length > 0) {
      const thisMenu = $(submenu[0]).attr('id');
      if (thisMenu === 'organization') {
        this.reportsElem.close();
        this.grantsElem.close();
        this.disbursementsElem.close();
      } else if (thisMenu === 'reports') {
        if (this.organizationElem) {
          this.organizationElem.close();
        }
        this.grantsElem.close();
        if (this.disbursementsElem) {
          this.disbursementsElem.close();
        }
      } else if (thisMenu === 'grants') {
        if (this.organizationElem) {
          this.organizationElem.close();
        }
        this.reportsElem.close();
        if (this.disbursementsElem) {
          this.disbursementsElem.close();
        }
      } else if (thisMenu === 'disbursements') {
        if (this.organizationElem) {
          this.organizationElem.close();
        }
        this.reportsElem.close();
        this.grantsElem.close();
      }
    }
  }


}




