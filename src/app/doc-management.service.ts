import { GrantClosure } from 'app/model/closures';
import { Disbursement } from 'app/model/disbursement';
import { Report } from './model/report';
import { GrantDataService } from './grant.data.service';
import { AppComponent } from 'app/app.component';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AttachmentDownloadRequest, Grant } from 'app/model/dahsboard';
import { Injectable } from '@angular/core';
import { saveAs } from "file-saver";

@Injectable({
  providedIn: 'root'
})
export class DocManagementService {

  constructor(private http: HttpClient, private grantData: GrantDataService) { }

  callGrantDocDownload(selectedAttachments: AttachmentDownloadRequest, appComp: AppComponent, currentGrant: Grant) {
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
      appComp.loggedInUser.id +
      "/grant/" +
      currentGrant.id +
      "/attachments";
    this.http
      .post(url, selectedAttachments, httpOptions)
      .subscribe((data) => {
        saveAs(data, currentGrant.name + ".zip");
      });
  }

  callReportDocDownload(selectedAttachments: AttachmentDownloadRequest, appComp: AppComponent, currentReport: Report) {
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
      appComp.loggedInUser.id +
      "/report/" +
      currentReport.id +
      "/attachments";
    this.http
      .post(url, selectedAttachments, httpOptions)
      .subscribe((data) => {
        saveAs(
          data,
          currentReport.grant.name +
          "_" +
          currentReport.name +
          ".zip"
        );
      });
  }

  deleteGrantAttachment(attributeId, attachmentId, appComp: AppComponent, currentGrant: Grant): Promise<Grant> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url =
      "/api/user/" +
      appComp.loggedInUser.id +
      "/grant/" +
      currentGrant.id +
      "/attribute/" +
      attributeId +
      "/attachment/" +
      attachmentId;
    return this.http
      .post<Grant>(url, currentGrant, httpOptions)
      .toPromise().then();
  }

  deleteReportAttachment(attributeId, attachmentId, appComp: AppComponent, currentReport: Report): Promise<Report> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url =
      "/api/user/" +
      appComp.loggedInUser.id +
      "/report/" +
      currentReport.id +
      "/attribute/" +
      attributeId +
      "/attachment/" +
      attachmentId;
    return this.http
      .post<Report>(url, currentReport, httpOptions)
      .toPromise().then();
  }

  callDisbursementDocDownload(selectedAttachments: AttachmentDownloadRequest, appComp: AppComponent, currentDisbursement: Disbursement) {
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
      appComp.loggedInUser.id +
      "/disbursements/" +
      currentDisbursement.id +
      "/documents/download";
    this.http
      .post(url, selectedAttachments, httpOptions)
      .subscribe((data) => {
        saveAs(data, currentDisbursement.grant.name + "_disbursement_docs.zip");
      });
  }

  callProjectDocDownload(selectedAttachments: AttachmentDownloadRequest, userId: number, grantId: number, grantName: string) {
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
      userId +
      "/grant/" +
      grantId +
      "/documents/download";
    this.http
      .post(url, selectedAttachments, httpOptions)
      .subscribe((data) => {
        saveAs(data, grantName + ".zip");
      });
  }

  deleteDisbursementAttachment(attachmentId, appComp: AppComponent, currentDisbursement: Disbursement): Promise<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url =
      "/api/user/" +
      appComp.loggedInUser.id +
      "/disbursements/" +
      currentDisbursement.id +
      "/document/" +
      attachmentId;
    return this.http
      .delete(url, httpOptions)
      .toPromise().then();
  }

  deleteProjectAttachment(attachmentId, userId: number, grantId: number): Promise<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url =
      "/api/user/" +
      userId +
      "/grant/" +
      grantId +
      "/document/" +
      attachmentId;
    return this.http
      .delete(url, httpOptions)
      .toPromise().then();
  }


  callClosureDocDownload(selectedAttachments: AttachmentDownloadRequest, appComp: AppComponent, currentClosure: GrantClosure) {
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
      appComp.loggedInUser.id +
      "/closure/" +
      currentClosure.id +
      "/attachments";
    this.http
      .post(url, selectedAttachments, httpOptions)
      .subscribe((data) => {
        saveAs(
          data,
          currentClosure.grant.name +
          "_closure" +
          ".zip"
        );
      });
  }

  callClosureDocsDownload(selectedAttachments: AttachmentDownloadRequest, appComp: AppComponent, currentClosure: GrantClosure) {
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
      appComp.loggedInUser.id +
      "/closure/" +
      currentClosure.id +
      "/docs/download";
    this.http
      .post(url, selectedAttachments, httpOptions)
      .subscribe((data) => {
        saveAs(
          data,
          currentClosure.grant.name +
          "_closure_documents" +
          ".zip"
        );
      });
  }

  deleteClosureAttachment(attachmentId, userId: number, attributeId: number, closureId: number, currentClosure: GrantClosure): Promise<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url =
      "/api/user/" +
      userId +
      "/closure/" +
      closureId +
      "/attribute/" +
      attributeId +
      "/attachment/" +
      attachmentId;
    return this.http
      .post<GrantClosure>(url, currentClosure, httpOptions)
      .toPromise().then();
  }

  deleteClosureDocsAttachment(attachmentId, userId: number, closureId: number, currentClosure: GrantClosure): Promise<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url =
      "/api/user/" +
      userId +
      "/closure/" +
      closureId +
      "/docs/" +
      "/delete/" +
      attachmentId;
    return this.http
      .post<GrantClosure>(url, currentClosure, httpOptions)
      .toPromise().then();
  }
}
