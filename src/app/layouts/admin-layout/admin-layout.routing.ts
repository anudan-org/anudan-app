import { Routes } from '@angular/router';

import { DashboardComponent } from '../../dashboard/dashboard.component';
import { UserProfileComponent } from '../../user-profile/user-profile.component';
import { TableListComponent } from '../../table-list/table-list.component';
import { TypographyComponent } from '../../typography/typography.component';
import { IconsComponent } from '../../icons/icons.component';
import { MapsComponent } from '../../maps/maps.component';
import { NotificationsComponent } from '../../notifications/notifications.component';
import { UpgradeComponent } from '../../upgrade/upgrade.component';
import { GrantComponent } from '../../grant/grant.component';
import { ApplicationsComponent } from '../../applications/applications.component';
import { ReportsComponent } from '../../reports/reports.component';
import { DisbursementsComponent } from '../../disbursements/disbursements.component';
import { DetailsComponent } from '../../organization//details/details.component';
import { OrgadminComponent } from '../../organization//orgadmin/orgadmin.component';
import { RfpsComponent } from '../../rfps/rfps.component';
import { WorkflowManagementComponent } from "../../workflow-management/workflow-management.component";
import { GrantsComponent } from '../../grants/grants.component';
import { DraftGrantsComponent } from '../../grants/draft-grants/draft-grants.component';
import { ActiveGrantsComponent } from '../../grants/active-grants/active-grants.component';
import { ClosedGrantsComponent } from '../../grants/closed-grants/closed-grants.component';
import { BasicComponent } from '../../grant/basic/basic.component';
import { SectionsComponent } from '../../grant/sections/sections.component';
import { ReportingComponent } from '../../grant/reporting/reporting.component';
import { PreviewComponent } from '../../grant/preview/preview.component';
import { TenantsComponent } from '../../admin/tenants/tenants.component';
import { SettingsComponent } from '../../admin/settings/settings.component';
import { UpcomingReportsComponent } from '../../reports/upcoming-reports/upcoming-reports.component';
import { SubmittedReportsComponent } from '../../reports/submitted-reports/submitted-reports.component';
import { ApprovedReportsComponent } from '../../reports/approved-reports/approved-reports.component';
import { ReportHeaderComponent } from '../../reports/report/report-header/report-header.component';
import { ReportSectionsComponent } from '../../reports/report/report-sections/report-sections.component';
import { ReportPreviewComponent } from '../../reports/report/report-preview/report-preview.component';
import { InprogressDisbursementsComponent } from '../../disbursements/inprogress-disbursements/inprogress-disbursements.component';
import { ApprovedDisbursementsComponent } from 'app/disbursements/approved-disbursements/approved-disbursements.component';
import { ClosedDisbursementsComponent } from 'app/disbursements/closed-disbursements/closed-disbursements.component';
import { DisbursementComponent } from 'app/disbursements/disbursement/disbursement.component';
import { DisbursementPreviewComponent } from 'app/disbursements/disbursement/disbursement-preview/disbursement-preview.component';
import { DataApiComponent } from 'app/data-api/data-api.component';
import { ClosureHeaderComponent } from 'app/closure/closure-header/closure-header.component';
import { ClosureSectionsComponent } from 'app/closure/closure-sections/closure-sections.component';
import { ClosurePreviewComponent } from 'app/closure/closure-preview/closure-preview.component';
export const AdminLayoutRoutes: Routes = [
  // {
  //   path: '',
  //   children: [ {
  //     path: 'dashboard',
  //     component: DashboardComponent
  // }]}, {
  // path: '',
  // children: [ {
  //   path: 'userprofile',
  //   component: UserProfileComponent
  // }]
  // }, {
  //   path: '',
  //   children: [ {
  //     path: 'icons',
  //     component: IconsComponent
  //     }]
  // }, {
  //     path: '',
  //     children: [ {
  //         path: 'notifications',
  //         component: NotificationsComponent
  //     }]
  // }, {
  //     path: '',
  //     children: [ {
  //         path: 'maps',
  //         component: MapsComponent
  //     }]
  // }, {
  //     path: '',
  //     children: [ {
  //         path: 'typography',
  //         component: TypographyComponent
  //     }]
  // }, {
  //     path: '',
  //     children: [ {
  //         path: 'upgrade',
  //         component: UpgradeComponent
  //     }]
  // }
  { path: 'dashboard', component: DashboardComponent },
  { path: 'grants/draft', component: DraftGrantsComponent },
  { path: 'grants/active', component: ActiveGrantsComponent },
  { path: 'grants/closed', component: ClosedGrantsComponent },
  { path: 'applications', component: ApplicationsComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'disbursements', component: DisbursementsComponent },
  { path: 'organization/details', component: DetailsComponent },
  { path: 'organization/administration', component: OrgadminComponent },
  { path: 'rfps', component: RfpsComponent },
  { path: 'grant/basic-details', component: BasicComponent },
  { path: 'grant-closure/header', component: ClosureHeaderComponent },
  { path: 'grant/sections', component: SectionsComponent },
  { path: 'grant/section/:action', component: SectionsComponent },
  { path: 'grant-closure/section/:action', component: ClosureSectionsComponent },
  { path: 'grant/reporting', component: ReportingComponent },
  { path: 'grant/preview', component: PreviewComponent },
  { path: 'grant-closure/preview', component: ClosurePreviewComponent },
  { path: 'reports/upcoming', component: UpcomingReportsComponent },
  { path: 'reports/submitted', component: SubmittedReportsComponent },
  { path: 'reports/approved', component: ApprovedReportsComponent },
  { path: 'report/report-header', component: ReportHeaderComponent },
  { path: 'report/section/:action', component: ReportSectionsComponent },
  { path: 'report/report-preview', component: ReportPreviewComponent },
  { path: 'disbursements/in-progress', component: InprogressDisbursementsComponent },
  { path: 'disbursements/approved', component: ApprovedDisbursementsComponent },
  { path: 'disbursements/closed', component: ClosedDisbursementsComponent },
  { path: 'disbursement/approval-request', component: DisbursementComponent },
  { path: 'disbursement/preview', component: DisbursementPreviewComponent },
  { path: 'section', component: GrantComponent },
  { path: 'user-profile', component: UserProfileComponent },
  { path: 'table-list', component: TableListComponent },
  { path: 'typography', component: TypographyComponent },
  { path: 'icons', component: IconsComponent },
  { path: 'maps', component: MapsComponent },
  { path: 'notifications', component: NotificationsComponent },
  { path: 'upgrade', component: UpgradeComponent },
  { path: 'workflow-management', component: WorkflowManagementComponent },
  { path: 'admin/tenants', component: TenantsComponent },
  { path: 'admin/settings', component: SettingsComponent },
  { path: 'organization/data', component: DataApiComponent },
];