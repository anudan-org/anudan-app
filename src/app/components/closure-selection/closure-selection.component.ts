import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-closure-selection',
  templateUrl: './closure-selection.component.html',
  styleUrls: ['./closure-selection.component.scss']
})
export class ClosureSelectionComponent implements OnInit {

  @ViewChild("closureSelection") closureSelection: ElementRef;
  warnings: any;

  constructor(public dialogRef: MatDialogRef<ClosureSelectionComponent>
    , @Inject(MAT_DIALOG_DATA) public message: any
    , private httpClient: HttpClient) {
    dialogRef.disableClose = true;
  }

  ngOnInit() {

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    let url = "/api/user/" + this.message.userId + "/closure/" + this.message.grant.id + "/warnings";
    this.httpClient.get<any>(url, httpOptions).subscribe((response: any) => {
      this.warnings = response;
    });
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }



}
