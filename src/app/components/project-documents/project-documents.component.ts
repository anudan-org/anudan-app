import { MessagingComponent } from 'app/components/messaging/messaging.component';
import { DocManagementService } from './../../doc-management.service';
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
        overflow: scroll !important;
    height: calc(100vh - 114px) !important;
    padding-top: 10px !important;
      }
  `]
})
export class ProjectDocumentsComponent implements OnInit {


  projectDocs: ProjectDoc[] = [];
  noSingleDocAction: boolean = false;
  downloadAndDeleteAllowed: boolean = false;

  constructor(public dialogRef: MatDialogRef<ProjectDocumentsComponent>
    , @Inject(MAT_DIALOG_DATA) public message: any,
    private http: HttpClient,
    private elem: ElementRef,
    private dialog: MatDialog,
    private docPreviewService: DocpreviewService,
    private sanitizer: DomSanitizer,
    private docManagementService: DocManagementService) {
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
      if (files.item(i).size === 0) {
        this.dialog.open(MessagingComponent, {
          data: 'Detected a file with no content. Unable to upload.',
          panelClass: "center-class"
        });
        ev.target.value = "";
        break;
      }

      const ext = files.item(i).name.substr(files.item(i).name.lastIndexOf('.'));
      if (this.message.acceptedFileTypes.filter(d => d === ext).length === 0) {
        this.dialog.open(MessagingComponent, {
          data: 'Detected an unsupported file type. Supported file types are ' + this.message.acceptedFileTypes.toString() + '. Unable to upload.',
          panelClass: "center-class"
        });
        ev.target.value = "";
        break;
      }
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

    const docElems = this.elem.nativeElement.querySelectorAll('[id^="attachment_' + attachmentId + '"]');
    if (docElems.length > 0) {
      let found = false;
      for (let docElem of docElems) {
        if (docElem.checked) {
          found = true;
        }
      }

      if (found) {
        this.noSingleDocAction = true;
        this.downloadAndDeleteAllowed = true;
      } else {
        this.noSingleDocAction = false;
        this.downloadAndDeleteAllowed = false;
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
      this.docManagementService.callProjectDocDownload(selectedAttachments, this.message.loggedInUser.id, this.message.currentGrant.id, this.message.currentGrant.name);

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
    this.docManagementService.deleteProjectAttachment(attachmentId, this.message.loggedInUser.id, this.message.currentGrant.id)
      .then(() => {
        const index = this.projectDocs.findIndex(a => a.id === Number(attachmentId));
        this.projectDocs.splice(index, 1);
      });
  }

  previewDocument(_for, attach) {
    this.docPreviewService.previewDoc(_for, this.message.loggedInUser.id, this.message.currentGrant.id, attach.id).then((result: any) => {
      let docType = result.url.substring(result.url.lastIndexOf(".") + 1);
      let docUrl;
      if (docType === 'doc' || docType === 'docx' || docType === 'xls' || docType === 'xlsx' || docType === 'ppt' || docType === 'pptx') {
        docUrl = this.sanitizer.bypassSecurityTrustResourceUrl("https://view.officeapps.live.com/op/view.aspx?src=" + location.origin + "/api/public/doc/" + result.url);
      } else if (docType === 'pdf' || docType === 'txt') {
        docUrl = this.sanitizer.bypassSecurityTrustResourceUrl(location.origin + "/api/public/doc/" + result.url);
      }
      this.dialog.open(DocpreviewComponent, {
        data: {
          url: docUrl,
          type: docType,
          title: attach.name + "." + attach.extension,
          userId: this.message.loggedInUser.id,
          tempFileName: result.url
        },
        panelClass: "wf-assignment-class"
      });
    });
  }

  downloadSingleDoc(attachmentId: number) {
    const selectedAttachments = new AttachmentDownloadRequest();
    selectedAttachments.attachmentIds = [];
    selectedAttachments.attachmentIds.push(attachmentId);
    this.docManagementService.callProjectDocDownload(selectedAttachments, this.message.loggedInUser.id, this.message.currentGrant.id, this.message.currentGrant.name);
  }

  deleteSingleDoc(attachmentId) {
    const dReg = this.dialog.open(FieldDialogComponent, {
      data: {
        title: "Are you sure you want to delete the selected document?",
        btnMain: "Delete Document",
        btnSecondary: "Not Now"
      },
      panelClass: "grant-template-class",
    });

    dReg.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteAttachment(attachmentId);
      }
    });
  }
}
