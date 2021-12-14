import { HttpHeaders, HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Component, OnInit, Inject } from '@angular/core';

@Component({
  selector: 'app-docpreview',
  templateUrl: './docpreview.component.html',
  styleUrls: ['./docpreview.component.scss']
})
export class DocpreviewComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<DocpreviewComponent>
    , @Inject(MAT_DIALOG_DATA) public message: any, private http: HttpClient) {
    console.log(message.url)
  }

  ngOnInit() {
    //Intentionally left bblank
  }

  onNoClick() {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url = "/api/user/" + this.message.userId + "/grant/attachments/delete/preview/file/" + this.message.tempFileName;
    this.http.get(url, httpOptions).subscribe(() => {
      this.dialogRef.close(false);
    });


  }
}


