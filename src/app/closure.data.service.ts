import { AppComponent } from 'app/app.component';
import { HttpHeaders } from '@angular/common/http';
import { UserService } from './user.service';
import { HttpClient } from '@angular/common/http';
import { GrantClosure } from './model/closures';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Grant } from './model/dahsboard';
import {
  HumanizeDurationLanguage,
  HumanizeDuration,
} from "humanize-duration-ts";
@Injectable({
  providedIn: 'root',
})
export class ClosureDataService {

  private messageSource = new BehaviorSubject<GrantClosure>(null);
  currentMessage = this.messageSource.asObservable();
  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService);
  url: string = "/api/user/%USERID%/closure";

  constructor(private httpClient: HttpClient,
    private userService: UserService) {


  }

  changeMessage(message: GrantClosure, userId: number) {

    if (message !== null) {
      const user = JSON.parse(localStorage.getItem('USER'));
      if ((message.workflowAssignment.filter(wf => wf.stateId === message.status.id && wf.assignmentId === userId).length > 0) && user.organization.organizationType !== 'GRANTEE' && (message.status.internalStatus !== 'ACTIVE' && message.status.internalStatus !== 'CLOSED')) {
        message.canManage = true
      } else {
        message.canManage = false;
      }
    }
    this.messageSource.next(message)
  }

  private getUrl(): string {
    const user = this.userService.getUser();
    if (user !== undefined) {
      return this.url.replace("%USERID%", user.id);
    }
  }

  private getHeader() {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };
    return httpOptions;
  }

  deleteClosure(closure: GrantClosure): Promise<void> {
    if (closure !== undefined && closure !== null) {
      return this.httpClient
        .delete(
          this.getUrl() + "/" + closure.id,
          this.getHeader()
        )
        .toPromise()
        .then<void>(() => {
          return Promise.resolve();
        })
        .catch((err) => {
          return Promise.reject(
            "Unable to delete the disbursement"
          );
        });
    } else {
      return Promise.resolve(null);
    }
  }

  updateClosure(appComp: AppComponent): GrantClosure {
    let grantClosure: GrantClosure;
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };
    appComp.closureUpdated.subscribe((statusUpdate) => {
      if (statusUpdate.status && statusUpdate.closureId && appComp.loggedInUser !== undefined) {
        let urlNew =
          "/api/user/" + appComp.loggedInUser.id + "/closure/" + statusUpdate.closureId;


        this.httpClient.get(urlNew, httpOptions).subscribe((closure: GrantClosure) => {
          if (closure) {
            this.changeMessage(closure, appComp.loggedInUser.id);
            grantClosure = closure;
          }
        });
      }
    });
    return grantClosure;
  }
}
