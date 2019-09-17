import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef} from '@angular/core';
import {AppComponent} from '../../app.component';
import {Router, ActivatedRoute} from '@angular/router';
import {GrantDataService} from '../../grant.data.service';
import {Grant} from '../../model/dahsboard';
import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts';


declare const $: any;
declare interface RouteInfo {
    path: string;
    title: string;
    icon: string;
    class: string;
}

export const ROUTES: RouteInfo[] = [
  { path: '/organization', title: 'Organization',  icon: 'account_balance', class: '' },
  { path: '/rfps', title: 'RFPs',  icon: 'description', class: '' },
  { path: '/applications', title: 'Applications',  icon: 'inbox', class: '' },
  { path: '/grants', title: 'Grants',  icon: 'list', class: '' },
  { path: '/reports', title: 'Reports',  icon: 'bar_chart', class: '' },
  { path: '/submissions', title: 'Submissions',  icon: 'assignment_returned', class: '' },
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
    { path: '/grant/basic-details', title: 'Grant Header',  icon: 'description', class: '' },
    { path: '/grant/sections', title: 'Grant Details',  icon: 'view_agenda', class: '' },
    { path: '/grant/preview', title: 'Preview & Submit',  icon: 'done', class: '' }
];

export const ORGANIZATION_ROUTES: RouteInfo[] = [
  { path: '/organization/details', title: 'Details',  icon: 'stop', class: '' },
  { path: '/organization/administration', title: 'Administration',  icon: 'stop', class: '' },
];
export let SECTION_ROUTES: RouteInfo[] = [];

export const ADMIN_ROUTES: RouteInfo[] = [
    { path: '/workflow-management', title: 'Manage Workflows',  icon:'person', class: '' }
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  menuItems: any[];
  grantMenuItems: any[];
  sectionMenuItems: any[];
  adminMenuItems: any[];
  orgMenuItems: any[];
  currentGrant: Grant;
  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService);


  action: number;
  sub: any;


  constructor(public appComponent: AppComponent, private router: Router, private activatedRoute: ActivatedRoute, private grantData: GrantDataService, private ref:ChangeDetectorRef, private elRef: ElementRef) {

    
  }

  ngOnInit() {
    this.menuItems = ROUTES.filter(menuItem => menuItem);
    this.grantMenuItems = GRANT_ROUTES.filter(menuItem => menuItem);
    this.adminMenuItems = ADMIN_ROUTES.filter(menuItem => menuItem);
    this.orgMenuItems = ORGANIZATION_ROUTES.filter(menuItem => menuItem);
    this.ref.detectChanges();
    this.grantData.currentMessage.subscribe((grant) => {
      this.currentGrant = grant;
      this.buildSectionsSideNav();
    });
    
  }


  showMessages(){
  $("#messagepopover").html('');
  if(this.appComponent.notifications.length === 0){
    $("#messagepopover").append('<p>No messages</p>');
  }else{
    for(let i=0; i< this.appComponent.notifications.length;i++){
      
        const posted = this.appComponent.notifications[i].postedOn;
       
        var time = new Date().getTime() - new Date(posted).getTime();
        
        
        $("#messagepopover").append('<div class="row"><div class="col-8"><p>'+this.appComponent.notifications[i].message+'</p><small>'+this.humanizer.humanize(time, { largest: 1, round: true}) + ' ago</small></div><div class="col-4"><button id="notificationBtn_' + this.appComponent.notifications[i].id + '" class="btn btn-sm">Mark as read</button></div></div>');
    }

    $('[id^="notificationBtn_"]').on('click',function(ev){
      console.log($(this).attr('id'));
    });

  }
  
  
  if($("#messagepopover").css('display')==='none'){
    $("#messagepopover").css('display','block');
  }else{
    $("#messagepopover").css('display','none');
  }
  
  }

  messageRead() {
    console.log("Read");
  }

  buildSectionsSideNav(): string {
  this.grantData.currentMessage.subscribe(grant => this.currentGrant = grant);
  SECTION_ROUTES = [];
  if(this.appComponent.currentView === 'grant' && this.currentGrant && (SECTION_ROUTES.length === 0 || this.appComponent.sectionAdded === true || this.appComponent.sectionUpdated === true)){
      this.sectionMenuItems = [];
      SECTION_ROUTES = [];
      for (let section of this.currentGrant.grantDetails.sections){
        SECTION_ROUTES.push({path: '/grant/section/' + section.sectionName.replace(/[^0-9a-z]/gi, ''),title: section.sectionName, icon: 'stop', class:''});
      }

      this.sectionMenuItems = SECTION_ROUTES.filter(menuItem => menuItem);
      this.appComponent.sectionAdded = false;
      return SECTION_ROUTES[0].path;
    }
  }


  isMobileMenu() {
      if ($(window).width() > 6000) {
          return false;
      }
      return true;
  };

  showProfile() {
    this.router.navigate(['user-profile']);
  }
}




