import { ClosureNotesComponent } from './../../components/closureNotes/closureNotes.component';
import { ClosureComponent } from './../../closure/closure.component';
import { ClosureTemplateDialogComponent } from './../../components/closure-template-dialog/closure-template-dialog.component';
import { GrantCompareComponent } from './../../grant-compare/grant-compare.component';
import { GranteeProgressSummaryComponent } from './../../dashboard/grantee-progress-summary/grantee-progress-summary.component';
import { GranteeSummaryCenteredComponent } from './../../dashboard/grantee-summary-centered/grantee-summary-centered.component';
import { GranteeChartSummaryComponent } from './../../dashboard/grantee-chart-summary/grantee-chart-summary.component';
import { GranteePortfolioSummaryComponent } from '../../dashboard/grantee-portfolio-summary/grantee-portfolio-summary.component';
import { ListDialogComponent } from './../../components/list-dialog/list-dialog.component';
import { MyChartSummaryComponent } from './../../dashboard/mychart-summary/mychart-summary.component';
import { MyPortfolioSummaryComponent } from './../../dashboard/myportfolio-summary/myportfolio-summary.component';
import { OrgTagsComponent } from './../../org-tags/org-tags.component';
import { GrantTagsComponent } from './../../grant-tags/grant-tags.component';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminLayoutRoutes } from './admin-layout.routing';
import { GrantComponent } from '../../grant/grant.component';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { SummaryComponent } from '../../dashboard/summary/summary.component';
import { PortfolioSummaryComponent } from '../../dashboard/portfolio-summary/portfolio-summary.component';
import { ProgressSummaryComponent } from '../../dashboard/progress-summary/progress-summary.component';
import { SummaryCenteredComponent } from '../../dashboard/summary-centered/summary-centered.component';
import { ChartSummaryComponent } from '../../dashboard/chart-summary/chart-summary.component';
import { UserProfileComponent } from '../../user-profile/user-profile.component';
import { TableListComponent } from '../../table-list/table-list.component';
import { TypographyComponent } from '../../typography/typography.component';
import { IconsComponent } from '../../icons/icons.component';
import { MapsComponent } from '../../maps/maps.component';
import { NotificationsComponent } from '../../notifications/notifications.component';
import { UpgradeComponent } from '../../upgrade/upgrade.component';
import { NgxGraphModule } from '@swimlane/ngx-graph';

import {
    MatButtonModule,
    MatInputModule,
    MatRippleModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatSelectModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatIconModule,
    MatDialogModule,
    MatCheckboxModule,
    MatCardModule,
    MatBottomSheetModule,
    MatBadgeModule,
    MatChipsModule,
    MatSidenavModule,
    MatRadioModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatProgressBarModule,
    MatListModule,
    MAT_FORM_FIELD_DEFAULT_OPTIONS
} from '@angular/material';
import { MatTabsModule } from '@angular/material/tabs';
import { WelcomePopupComponent } from '../../components/welcome-popup/welcome-popup.component';
import { AddnlreportsDialogComponent } from '../../components/addnlreports-dialog/addnlreports-dialog.component';
import { InviteDialogComponent } from '../../components/invite-dialog/invite-dialog.component';
import { GrantTemplateDialogComponent } from '../../components/grant-template-dialog/grant-template-dialog.component';
import { ReportTemplateDialogComponent } from '../../components/report-template-dialog/report-template-dialog.component';
import { GrantSelectionDialogComponent } from '../../components/grant-selection-dialog/grant-selection-dialog.component';
import { GranttypeSelectionDialogComponent } from '../../components/granttype-selection-dialog/granttype-selection-dialog.component';
import { TemplateDialogComponent } from '../../components/template-dialog/template-dialog.component';
import { BottomsheetComponent } from '../../components/bottomsheet/bottomsheet.component';
import { BottomsheetAttachmentsComponent } from '../../components/bottomsheetAttachments/bottomsheetAttachments.component';
import { BottomsheetNotesComponent } from '../../components/bottomsheetNotes/bottomsheetNotes.component';
import { GrantNotesComponent } from '../../components/grantNotes/grantNotes.component';
import { ReportNotesComponent } from '../../components/reportNotes/reportNotes.component';
import { WorkflowManagementComponent } from '../../workflow-management/workflow-management.component';
import { GrantsComponent } from '../../grants/grants.component';
import { DraftGrantsComponent } from '../../grants/draft-grants/draft-grants.component';
import { ActiveGrantsComponent } from '../../grants/active-grants/active-grants.component';
import { ClosedGrantsComponent } from '../../grants/closed-grants/closed-grants.component';
import { ApplicationsComponent } from '../../applications/applications.component';
import { ReportsComponent } from '../../reports/reports.component';
import { DisbursementsComponent } from '../../disbursements/disbursements.component';
import { DetailsComponent } from '../../organization/details/details.component';
import { OrgadminComponent } from '../../organization/orgadmin/orgadmin.component';
import { OrganizationComponent } from '../../organization/organization.component';
import { RfpsComponent } from '../../rfps/rfps.component';
import { BasicComponent } from '../../grant/basic/basic.component';
import { SectionsComponent } from '../../grant/sections/sections.component';
import { ReportingComponent } from '../../grant/reporting/reporting.component';
import { PreviewComponent } from '../../grant/preview/preview.component';
import { TenantsComponent } from '../../admin/tenants/tenants.component';
import { SettingsComponent } from '../../admin/settings/settings.component';
import { PDFExportModule } from '@progress/kendo-angular-pdf-export';
import { UpcomingReportsComponent } from '../../reports/upcoming-reports/upcoming-reports.component';
import { SubmittedReportsComponent } from '../../reports/submitted-reports/submitted-reports.component';
import { ApprovedReportsComponent } from '../../reports/approved-reports/approved-reports.component';
import { SectionEditComponent } from '../../components/section-edit/section-edit.component';
import { ReportComponent } from '../../reports/report/report.component';
import { ReportHeaderComponent } from '../../reports/report/report-header/report-header.component';
import { ReportSectionsComponent } from '../../reports/report/report-sections/report-sections.component';
import { ReportPreviewComponent } from '../../reports/report/report-preview/report-preview.component';
import { TemplatesComponent } from '../../admin/templates/templates.component';
import { RolesComponent } from '../../admin/roles/roles.component';
import { UsersComponent } from '../../admin/users/users.component';
import { DocumentLibraryComponent } from '../../admin/document-library/document-library.component';
import { InprogressDisbursementsComponent } from '../../disbursements/inprogress-disbursements/inprogress-disbursements.component'
import { ApprovedDisbursementsComponent } from 'app/disbursements/approved-disbursements/approved-disbursements.component';
import { ClosedDisbursementsComponent } from 'app/disbursements/closed-disbursements/closed-disbursements.component';
import { DisbursementComponent } from 'app/disbursements/disbursement/disbursement.component';
import { DisbursementPreviewComponent } from 'app/disbursements/disbursement/disbursement-preview/disbursement-preview.component';
import { DisbursementNotesComponent } from 'app/components/disbursementNotes/disbursementNotes.component';
import { DataApiComponent } from 'app/data-api/data-api.component';
import { SearchFilterComponent } from './search-filter/search-filter.component';
import { ClosureHeaderComponent } from 'app/closure/closure-header/closure-header.component';
import { ClosureSectionsComponent } from 'app/closure/closure-sections/closure-sections.component';
import { ClosurePreviewComponent } from 'app/closure/closure-preview/closure-preview.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(AdminLayoutRoutes),
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatRippleModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTooltipModule,
        MatMenuModule,
        MatProgressBarModule,
        MatDatepickerModule,
        MatExpansionModule,
        MatIconModule,
        MatDialogModule,
        MatCheckboxModule,
        MatCardModule,
        MatBottomSheetModule,
        MatBadgeModule,
        MatChipsModule,
        MatListModule,
        MatSidenavModule,
        MatRadioModule,
        MatTableModule,
        MatProgressSpinnerModule,
        NgxGraphModule,
        MatAutocompleteModule,
        MatTabsModule,
        PDFExportModule,
        MatRadioModule
    ],
    declarations: [
        GrantComponent,
        ClosureComponent,
        ClosureHeaderComponent,
        ClosureSectionsComponent,
        ClosurePreviewComponent,
        DashboardComponent,
        SummaryComponent,
        SummaryCenteredComponent,
        GranteeSummaryCenteredComponent,
        ProgressSummaryComponent,
        GranteeProgressSummaryComponent,
        ChartSummaryComponent,
        PortfolioSummaryComponent,
        MyPortfolioSummaryComponent,
        GranteePortfolioSummaryComponent,
        MyChartSummaryComponent,
        GranteeChartSummaryComponent,
        GrantsComponent,
        DraftGrantsComponent,
        ActiveGrantsComponent,
        ClosedGrantsComponent,
        BasicComponent,
        SectionsComponent,
        ReportingComponent,
        PreviewComponent,
        UserProfileComponent,
        TableListComponent,
        TypographyComponent,
        IconsComponent,
        MapsComponent,
        NotificationsComponent,
        UpgradeComponent,
        WelcomePopupComponent,
        AddnlreportsDialogComponent,
        InviteDialogComponent,
        GrantNotesComponent,
        ReportNotesComponent,
        ClosureNotesComponent,
        DisbursementNotesComponent,
        GrantTemplateDialogComponent,
        ReportTemplateDialogComponent,
        ClosureTemplateDialogComponent,
        GrantSelectionDialogComponent,
        ListDialogComponent,
        GranttypeSelectionDialogComponent,
        TemplateDialogComponent,
        BottomsheetComponent,
        BottomsheetAttachmentsComponent,
        BottomsheetNotesComponent,
        WorkflowManagementComponent,
        ApplicationsComponent,
        RfpsComponent,
        DetailsComponent,
        OrgadminComponent,
        OrganizationComponent,
        ReportsComponent,
        DisbursementsComponent,
        TenantsComponent,
        SettingsComponent,
        UpcomingReportsComponent,
        SubmittedReportsComponent,
        ApprovedReportsComponent,
        SectionEditComponent,
        ReportComponent,
        ReportHeaderComponent,
        ReportSectionsComponent,
        ReportPreviewComponent,
        TemplatesComponent,
        RolesComponent,
        UsersComponent,
        DocumentLibraryComponent,
        InprogressDisbursementsComponent,
        ApprovedDisbursementsComponent,
        ClosedDisbursementsComponent,
        DisbursementComponent,
        DisbursementPreviewComponent,
        DataApiComponent,
        GrantTagsComponent,
        OrgTagsComponent,
        SearchFilterComponent,
        GrantCompareComponent
    ],
    entryComponents: [WelcomePopupComponent, AddnlreportsDialogComponent, InviteDialogComponent, BottomsheetComponent, BottomsheetAttachmentsComponent, BottomsheetNotesComponent, GrantTemplateDialogComponent, ReportTemplateDialogComponent, ClosureTemplateDialogComponent, GrantSelectionDialogComponent, ListDialogComponent, TemplateDialogComponent, GrantNotesComponent, SectionEditComponent, ReportNotesComponent, ClosureNotesComponent, DisbursementNotesComponent, GranttypeSelectionDialogComponent, GrantTagsComponent, GrantCompareComponent],
    schemas: [NO_ERRORS_SCHEMA],

})

export class AdminLayoutModule {
}
