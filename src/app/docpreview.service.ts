import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AttachmentDownloadRequest } from './model/dahsboard';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DocpreviewService {

  constructor(private http: HttpClient) { }

  previewDoc(_for, userId, id, attachmentId): Promise<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    let url =
      "/api/user/" +
      userId +
      "/grant/" + _for + "/" +
      id +
      "/attachments/preview";

    const selectedAttachments = new AttachmentDownloadRequest();
    selectedAttachments.attachmentIds = [];
    selectedAttachments.attachmentIds.push(attachmentId);

    return this.http.post<any>(url, selectedAttachments, httpOptions).
      toPromise().then();
  }
}
