import {NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AdminLayoutRoutes} from './admin-layout.routing';
import {GrantComponent} from '../../grant/grant.component';
import {DashboardComponent} from '../../dashboard/dashboard.component';
import {UserProfileComponent} from '../../user-profile/user-profile.component';
import {TableListComponent} from '../../table-list/table-list.component';
import {TypographyComponent} from '../../typography/typography.component';
import {IconsComponent} from '../../icons/icons.component';
import {MapsComponent} from '../../maps/maps.component';
import {NotificationsComponent} from '../../notifications/notifications.component';
import {UpgradeComponent} from '../../upgrade/upgrade.component';
import {NgxGraphModule} from '@swimlane/ngx-graph';
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
    MatListModule,
    MatBadgeModule,
    MatChipsModule,
    MatSidenavModule,
    MatRadioModule,
    MatTableModule,
    MatProgressSpinnerModule
} from '@angular/material';
import {FieldDialogComponent} from '../../components/field-dialog/field-dialog.component';
import {BottomsheetComponent} from '../../components/bottomsheet/bottomsheet.component';
import {BottomsheetAttachmentsComponent} from '../../components/bottomsheetAttachments/bottomsheetAttachments.component';
import {BottomsheetNotesComponent} from '../../components/bottomsheetNotes/bottomsheetNotes.component';
import {WorkflowManagementComponent} from '../../workflow-management/workflow-management.component';


@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(AdminLayoutRoutes),
        FormsModule,
        MatButtonModule,
        MatRippleModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTooltipModule,
        MatDatepickerModule,
        MatExpansionModule,
        MatIconModule,
        MatDialogModule,
        MatCheckboxModule,
        MatCardModule,
        MatBottomSheetModule,
        MatListModule,
        MatBadgeModule,
        MatChipsModule,
        MatSidenavModule,
        MatRadioModule,
        MatTableModule,
        MatProgressSpinnerModule,
        NgxGraphModule
    ],
    declarations: [
        GrantComponent,
        DashboardComponent,
        UserProfileComponent,
        TableListComponent,
        TypographyComponent,
        IconsComponent,
        MapsComponent,
        NotificationsComponent,
        UpgradeComponent,
        FieldDialogComponent,
        BottomsheetComponent,
        BottomsheetAttachmentsComponent,
        BottomsheetNotesComponent,
        WorkflowManagementComponent
    ],
    entryComponents: [FieldDialogComponent, BottomsheetComponent, BottomsheetAttachmentsComponent, BottomsheetNotesComponent],
    schemas: [NO_ERRORS_SCHEMA]
})

export class AdminLayoutModule {
}
