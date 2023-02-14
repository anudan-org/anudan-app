import { ActualRefund } from './model/dahsboard';
import { AppComponent } from 'app/app.component';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { GrantClosure } from './model/closures';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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
      if ((message.workflowAssignment.filter(wf => wf.stateId === message.status.id && wf.assignmentId === userId).length > 0) && (message.status.internalStatus !== 'CLOSED')) {
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
    return {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    }
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

  updateClosure(closureId: number, appComp: AppComponent): GrantClosure {
    let grantClosure: GrantClosure;
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };
    let urlNew =
      "/api/user/" + appComp.loggedInUser.id + "/closure/" + closureId;


    this.httpClient.get(urlNew, httpOptions).subscribe((closure: GrantClosure) => {
      if (closure) {
        grantClosure = closure;
      }
    });


    return grantClosure;
  }

  saveActualRefund(actualRefund, closureId, appComp: AppComponent): Promise<ActualRefund> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };
    let urlNew =
      "/api/user/" + appComp.loggedInUser.id + "/closure/" + closureId + "/actualRefund";


    return this.httpClient.put(urlNew, actualRefund, httpOptions).toPromise()
      .then<ActualRefund>()
      .catch((err) => {
        return Promise.reject(
          "Unable to save actual refund entry"
        );
      });
  }

  deleteActualRefund(actualRefund: ActualRefund, closureId, appComp: AppComponent): Promise<void> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };
    let urlNew =
      "/api/user/" + appComp.loggedInUser.id + "/closure/" + closureId + "/actualRefund/" + actualRefund.id;


    return this.httpClient.delete(urlNew, httpOptions).toPromise()
      .then<void>()
      .catch((err) => {
        return Promise.reject(
          "Unable to delete actual refund entry"
        );
      });
  }

 
  getCoverNoteAttributes(orgId, userId): string {
    return JSON.stringify(
      [
          {
              "parentId": "id1",
              "id": "id_1",
               "fieldName": "salutation",
               "inputType" :"text",
               "placeholder": "<Salutation>",
               "attributeStyle":"background:#ECF9FF;padding: 2px;margin: 2px 0;border-color: transparent;  border-bottom: thin red dotted;"
          },
          {
            "parentId": "id2",
            "id": "id_2",
            "fieldName": "name",
            "inputType" :"text",
            "placeholder": "<Name>",
            "attributeStyle":"background:#ECF9FF;padding: 2px;margin: 2px 0;border-color: transparent;  border-bottom: thin red dotted;"
          },
          {
            "parentId": "id3",
            "id": "id_3",
            "fieldName": "jobtitle",
            "inputType" :"text",
            "placeholder": "<Designation>",
            "attributeStyle":"background:#ECF9FF;padding: 2px;margin: 2px 0;border-color: transparent; border-bottom: thin red dotted;"
          },
          {
            "parentId": "id4",
            "id": "id_4",
            "fieldName": "address",
            "inputType" :"text",
            "placeholder": "<Address>",
            "attributeStyle":"background:#ECF9FF;padding: 2px;margin: 2px 0;border-color: transparent; border-bottom: thin red dotted;  "
          },
          {
            "parentId": "id5",
            "id": "id_5",
            "fieldName": "contactNumber",
            "inputType" :"text",
            "placeholder": "<Contact Number>",
            "attributeStyle":"background:#ECF9FF;padding: 2px;margin: 2px 0;border-color: transparent;  border-bottom: thin red dotted; "
          },
          {
            "parentId": "id6",
            "id": "id_6",
            "fieldName": "contactEmail",
            "inputType" :"email",
            "placeholder": "<Email Address>",
            "attributeStyle":"background:#ECF9FF;padding: 2px;margin: 2px 0;border-color: transparent;  border-bottom: thin red dotted; "
          },
          {
            "parentId": "id7",
            "id": "id_7",
            "fieldName": "greetingName",
            "inputType" :"text",
            "placeholder": "<Greeting>",
            "attributeStyle":"background:#ECF9FF;padding: 2px;margin: 2px 0;border-color: transparent;  border-bottom: thin red dotted; "
          },
          {
            "parentId": "id8",
            "id": "id_8",
            "fieldName": "yearEnded",
            "inputType" :"text",
            "placeholder": "<Year>",
            "attributeStyle":"background:#ECF9FF;padding: 2px;margin: 2px 0;border-color: transparent;  border-bottom: thin red dotted; "
          },
          {
            "parentId": "id9",
            "id": "id_9",
            "fieldName": "signeeName",
             "inputType" :"text",
            "placeholder": "<Signee Name>",
            "attributeStyle":"background:#ECF9FF;padding: 2px;margin: 2px 0;border-color: transparent;  border-bottom: thin red dotted; "
          },
          {
            "parentId": "id10",
            "id": "id_10",
            "fieldName": "signeeTitle",
            "inputType" :"text",
            "placeholder": "<Signee Title>",
            "attributeStyle":"background:#ECF9FF;padding: 2px;margin: 2px 0;border-color: transparent;   border-bottom: thin red dotted;"
          }
      ]);

      
  
    }

  
  
}
