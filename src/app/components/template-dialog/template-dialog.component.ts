import {Component, Inject, OnInit, ViewChild, ElementRef} from '@angular/core';

import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatButtonModule} from '@angular/material';
@Component({
  selector: 'app-template-dialog',
  templateUrl: './template-dialog.component.html',
  styleUrls: ['./template-dialog.component.scss']
})
export class TemplateDialogComponent implements OnInit {

@ViewChild('templateName') templateName: ElementRef;
@ViewChild('templateDescription') templateDescription: ElementRef;


  constructor(
    public dialogRef: MatDialogRef<TemplateDialogComponent>, 
    @Inject(MAT_DIALOG_DATA) public message: string
    ) {
    this.dialogRef.disableClose = true;
  }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    const elemTemplateName = this.templateName.nativeElement;
    const elemTemplateDesc = this.templateDescription.nativeElement;
    this.dialogRef.close({result:true,name:elemTemplateName.value,desc:elemTemplateDesc.value});
  }

  disableSaveTemplate() {
    const elemTemplateName = this.templateName.nativeElement;
    const elemTemplateDesc = this.templateDescription.nativeElement;
    if ((elemTemplateName.value.trim() === "") || (elemTemplateDesc.value.trim() ==="") ) {
        return true;
    } else {
        return false;
    }
}
}
