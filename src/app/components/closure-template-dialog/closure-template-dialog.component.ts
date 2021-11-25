import { ClosureTemplate } from './../../model/closures';
import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ReportTemplate } from '../../model/report';
import { MatCheckboxChange } from '@angular/material/checkbox';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatButtonModule } from '@angular/material';

@Component({
  selector: 'app-closure-template-dialog',
  templateUrl: './closure-template-dialog.component.html',
  styleUrls: ['./closure-template-dialog.component.scss']
})

export class ClosureTemplateDialogComponent implements OnInit {

  @ViewChild('templateHolder') templateHolder: ElementRef;
  selected: any;
  selectedTemplate: any;

  constructor(public dialogRef: MatDialogRef<ClosureTemplateDialogComponent>
    , @Inject(MAT_DIALOG_DATA) public templates: ClosureTemplate[]) {
    this.dialogRef.disableClose = true;
    this.selected = String(this.templates[0].id);
  }

  ngOnInit() {
    this.selected = this.templates.filter(r => r.defaultTemplate === true)[0].id;
    this.selectedTemplate = this.templates.filter(r => r.defaultTemplate === true)[0];
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    let selectedTemplate;
    for (let template of this.templates) {
      if (template.id === Number(this.selected)) {
        this.selectedTemplate = template;
        break;
      }
    }
    this.dialogRef.close({ result: true, selectedTemplate: this.selectedTemplate });
  }

  showDesc() {
    console.log('here');
  }

  setSelectedTemplate(id, ev: MatCheckboxChange) {
    if (ev.checked) {
      this.selected = id;
      this.selectedTemplate = this.templates.filter(t => t.id === id)[0];
    } else {
      this.selected = 0;
      this.selectedTemplate = null;
    }
  }

}
