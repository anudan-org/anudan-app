import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { FooterComponent } from './footer/footer.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { EditorComponent } from './editor/editor.component';
import { MatProgressSpinnerModule, MatExpansionModule, MatBadgeModule, MatIconModule, MatSelectModule, MatDividerModule, MatAutocompleteModule, MatFormFieldModule, MatRadioModule } from "@angular/material";
import { DragDropModule } from '@angular/cdk/drag-drop';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatBadgeModule,
    MatIconModule,
    DragDropModule,
    MatSelectModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatRadioModule
  ],
  declarations: [
    FooterComponent,
    NavbarComponent,
    SidebarComponent,
    EditorComponent,
  ],
  exports: [
    FooterComponent,
    NavbarComponent,
    SidebarComponent
  ]
})
export class ComponentsModule {
}
