import { MessagingComponent } from 'app/components/messaging/messaging.component';
import { DocpreviewComponent } from './../../docpreview/docpreview.component';
import { DomSanitizer } from '@angular/platform-browser';
import { DocpreviewService } from './../../docpreview.service';
import { DocManagementService } from './../../doc-management.service';
import { AdminService } from './../../admin.service';
import { TemplateLibrary, AttachmentDownloadRequest } from './../../model/dahsboard';
import { FieldDialogComponent } from './../../components/field-dialog/field-dialog.component';
import { MatDialog } from '@angular/material';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from 'app/app.component';
import { Role } from './../../model/user';
import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { saveAs } from "file-saver";

@Component({
  selector: 'app-document-library',
  templateUrl: './document-library.component.html',
  styleUrls: ['./document-library.component.scss']
})
export class DocumentLibraryComponent implements OnInit {

  @Input('docs') docs: TemplateLibrary[];
  focusField: any;
  roleName: string;
  roleDescription: string;
  roleExists: boolean = false;
  existingRole: Role;
  docNameText: any;
  docName: string;
  docDescription: string;
  itemsSelected: boolean = false;
  noSingleDocAction: boolean = false;
  downloadAndDeleteAllowed: boolean = false;
  @ViewChild("uploadFile") uploadFile: ElementRef;


  @ViewChild('createRoleBtn') createRoleBtn: ElementRef;

  constructor(public appComponent: AppComponent,
    private http: HttpClient,
    private dialog: MatDialog,
    private adminService: AdminService,
    private elem: ElementRef,
    private docPreviewService: DocpreviewService,
    private sanitizer: DomSanitizer,) { }

  ngOnInit() {
    console.log(this.docs);
  }
  handleSelection(doc) {
    const docElems = this.elem.nativeElement.querySelectorAll(
      '[id^="attachment_"]'
    );
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

      this.adminService.downloadSelectedLibraryDocs(this.appComponent.loggedInUser, selectedAttachments).then((data) => {
        saveAs(data, "document-library.zip");
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

          this.deleteDocumentLibrary(selectedAttachments);
        }
      } else {
        dReg.close();
      }
    });


  }

  private deleteDocumentLibrary(selectedAttachments: AttachmentDownloadRequest) {
    this.adminService.deleteSelectedLibraryDocs(this.appComponent.loggedInUser, selectedAttachments).then(() => {
      for (let a of selectedAttachments.attachmentIds) {
        const index = this.docs.findIndex(d => d.id === Number(a));
        this.docs.splice(index, 1);
        this.appComponent.currentTenant.templateLibrary = this.docs;
      }
    });
  }

  canCreateDoc() {
    if (this.docName && this.docName.trim() != "" && this.docNameText && this.docNameText.trim() != "") {
      return false;
    } else {
      return true;
    }
  }

  editDoc(doc: TemplateLibrary, $event) {
    doc.editMode = true;
    $('#role_' + doc.id).css('background', '#f6f6f6')
  }

  cancelEdit(doc: TemplateLibrary) {
    doc.editMode = false;
  }

  processSelectedFile(ev) {

    const file: File = ev.target.files[0];

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      if (file.size === 0) {
        this.dialog.open(MessagingComponent, {
          data: 'Detected a file with no content. Unable to upload.',
          panelClass: "center-class"
        });
        ev.target.value = "";
        return;
      }

      const ext = file.name.substr(file.name.lastIndexOf('.'));
      if (this.appComponent.acceptedFileTypes.filter(d => d === ext).length === 0) {
        this.dialog.open(MessagingComponent, {
          data: 'Detected an unsupported file type. Supported file types are ' + this.appComponent.acceptedFileTypes.toString() + '. Unable to upload.',
          panelClass: "center-class"
        });
        ev.target.value = "";
        return;
      }
      this.saveDoc(file);
    };
    reader.onerror = function (error) {
      console.log('Error: ', error);
    };

  }

  saveDoc(file: File) {
    const files = this.uploadFile.nativeElement.files;
    let formData = new FormData();
    formData.append("file", file);

    formData.append("docName", file.name);
    formData.append("docDescription", file.name);

    this.adminService.saveLibraryDoc(this.appComponent.loggedInUser, formData).then((result: TemplateLibrary) => {
      this.docs.unshift(result);
      this.appComponent.currentTenant.templateLibrary = this.docs;
    });

  }
  previewDocument(_for, attach) {
    this.docPreviewService.previewDoc(_for, this.appComponent.loggedInUser.id, attach.id, 0).then((result: any) => {
      let docType = result.url.substring(result.url.lastIndexOf(".") + 1);

      this.dialog.open(DocpreviewComponent, {
        data: {
          url: result.url,
          type: docType,
          title: attach.name + '.' + attach.fileType,
          userId: this.appComponent.loggedInUser.id,
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
    this.adminService.downloadSelectedLibraryDocs(this.appComponent.loggedInUser, selectedAttachments).then((data) => {
      saveAs(data, "document-library.zip");
    });
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
        const selectedAttachments = new AttachmentDownloadRequest();
        selectedAttachments.attachmentIds = [];
        selectedAttachments.attachmentIds.push(attachmentId);

        this.deleteDocumentLibrary(selectedAttachments);
      }
    });
  }
}
