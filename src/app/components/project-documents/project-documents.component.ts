import { DomSanitizer } from '@angular/platform-browser';
import { DocpreviewComponent } from './../../docpreview/docpreview.component';
import { DocpreviewService } from './../../docpreview.service';
import { Component, Inject, OnInit, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AttachmentDownloadRequest } from 'app/model/dahsboard';
import { ProjectDoc } from 'app/model/project-doc';
import { saveAs } from "file-saver";
import { FieldDialogComponent } from '../field-dialog/field-dialog.component';


@Component({
  selector: 'project-documents-dialog',
  templateUrl: './project-documents.component.html',
  styleUrls: ['./project-documents.component.scss'],
  styles: [`
      ::ng-deep .wf-assignment-class .mat-dialog-container{
          overflow: hidden !important;
          height: calc(100vh - 114px);
          padding-top: 10px !important;
      }
  `]
})
export class ProjectDocumentsComponent implements OnInit {


  projectDocs: ProjectDoc[] = [];

  constructor(public dialogRef: MatDialogRef<ProjectDocumentsComponent>
    , @Inject(MAT_DIALOG_DATA) public message: any,
    private http: HttpClient,
    private elem: ElementRef,
    private dialog: MatDialog,
    private docPreviewService: DocpreviewService,
    private sanitizer: DomSanitizer,) {
    this.dialogRef.disableClose = true;

    const endpoint =
      "/api/user/" +
      this.message.loggedInUser.id +
      "/grant/" +
      this.message.currentGrant.id +
      "/documents";

    const httpOptions = {
      headers: new HttpHeaders({
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    this.http
      .get(endpoint, httpOptions)
      .subscribe((info: ProjectDoc[]) => {
        this.projectDocs = info;
      });
  }

  ngOnInit() {
    //Left blank intentionally
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }

  processSelectedFiles(ev) {
    const files = ev.target.files;

    const endpoint =
      "/api/user/" +
      this.message.loggedInUser.id +
      "/grant/" +
      this.message.currentGrant.id +
      "/documents/upload";
    let formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("file", files.item(i));
    }

    console.log(">>>>" + JSON.stringify(this.message.currentGrant));

    const httpOptions = {
      headers: new HttpHeaders({
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    this.http
      .post<ProjectDoc[]>(endpoint, formData, httpOptions)
      .subscribe((info: ProjectDoc[]) => {
        for (let pDoc of info) {
          this.projectDocs.push(pDoc);
        }
      });
  }


  handleSelection(attachmentId) {
    const elems = this.elem.nativeElement.querySelectorAll(
      '[id^="attachment_' + attachmentId + '"]'
    );
    if (elems.length > 0) {
      for (let singleElem of elems) {
        if (singleElem.checked) {
          this.elem.nativeElement.querySelector(
            '[id="downloadBtn"]'
          ).disabled = false;
          this.elem.nativeElement.querySelector(
            '[id="deleteBtn"]'
          ).disabled = false;
          return;
        }
        this.elem.nativeElement.querySelector(
          '[id="downloadBtn"]'
        ).disabled = true;
        this.elem.nativeElement.querySelector(
          '[id="deleteBtn"]'
        ).disabled = true;
      }
    }
  }

  downloadSelection() {
    const elems = this.elem.nativeElement.querySelectorAll(
      '[id^="attachment_"]'
    );
    const selectedAttachments = new AttachmentDownloadRequest();
    if (elems.length > 0) {
      selectedAttachments.attachmentIds = [];
      for (let singleElem of elems) {
        if (singleElem.checked) {
          selectedAttachments.attachmentIds.push(singleElem.id.split("_")[1]);
        }
      }
      const httpOptions = {
        responseType: "blob" as "json",
        headers: new HttpHeaders({
          "Content-Type": "application/json",
          "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
          Authorization: localStorage.getItem("AUTH_TOKEN"),
        }),
      };

      let url =
        "/api/user/" +
        this.message.loggedInUser.id +
        "/grant/" +
        this.message.currentGrant.id +
        "/documents/download";
      this.http
        .post(url, selectedAttachments, httpOptions)
        .subscribe((data) => {
          saveAs(data, this.message.currentGrant.name + ".zip");
        });
    }
  }

  deleteSelection() {

    const dReg = this.dialog.open(FieldDialogComponent, {
      data: { title: 'Are you sure you want to delete the selected document(s)?', btnMain: "Delete Document(s)", btnSecondary: "Not Now" },
      panelClass: 'center-class'
    });

    dReg.afterClosed().subscribe(result => {
      if (result) {
        const elems = this.elem.nativeElement.querySelectorAll(
          '[id^="attachment_"]'
        );
        const selectedAttachments = new AttachmentDownloadRequest();
        if (elems.length > 0) {
          selectedAttachments.attachmentIds = [];
          for (let singleElem of elems) {
            if (singleElem.checked) {
              selectedAttachments.attachmentIds.push(singleElem.id.split("_")[1]);
            }
          }
        }
        for (let item of selectedAttachments.attachmentIds) {
          this.deleteAttachment(item);
        }
      } else {
        dReg.close();
      }
    });

  }

  deleteAttachment(attachmentId) {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url =
      "/api/user/" +
      this.message.loggedInUser.id +
      "/grant/" +
      this.message.currentGrant.id +
      "/document/" +
      attachmentId;
    this.http
      .delete(url, httpOptions)
      .subscribe(() => {
        const index = this.projectDocs.findIndex(a => a.id === Number(attachmentId));
        this.projectDocs.splice(index, 1);
      });
  }

  previewDocument(_for, attach) {

    this.docPreviewService.previewDoc(_for, this.message.loggedInUser.id, this.message.currentGrant.id, attach).then((result: any) => {
      this.dialog.open(DocpreviewComponent, {
        data: { url: this.sanitizer.bypassSecurityTrustResourceUrl("https://view.officeapps.live.com/op/embed.aspx?src=" + location.origin + "/api/public/doc/" + result.url) },
        panelClass: "wf-assignment-class"
      });
    });
  }

}
