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
export class GrantDataService {

  private messageSource = new BehaviorSubject<Grant>(null);
  currentMessage = this.messageSource.asObservable();
  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService);

  constructor() { }

  changeMessage(message: Grant, userId: number) {

    if (message !== null) {
      const user = JSON.parse(localStorage.getItem('USER'));
      if ((message.workflowAssignments.filter(wf => wf.stateId === message.grantStatus.id && wf.assignments === userId).length > 0) && user.organization.organizationType !== 'GRANTEE' && (message.grantStatus.internalStatus !== 'ACTIVE' && message.grantStatus.internalStatus !== 'CLOSED')) {
        message.canManage = true
      } else {
        message.canManage = false;
      }
    }
    if (message !== undefined && message !== null && (message.grantTags === undefined || message.grantTags === null)) {
      message.grantTags = [];
    }
    this.messageSource.next(message)
  }


  getDateDuration(grant: Grant) {
    if (grant.startDate && grant.endDate && grant.startDate !== null && grant.endDate !== null) {
      var time =
        new Date(grant.endDate).getTime() -
        new Date(grant.startDate).getTime();
      time = time + 86400001;
      return this.humanizer.humanize(time, {
        largest: 2,
        units: ["y", "mo"],
        round: true,
      });
    } else {
      return "Not set";
    }
  }
  grantPastEndDate(grant: Grant) {
   
    if (  new Date() >  new Date(grant.endDate) ){
        return true;
    } else {
      return false;
    }
  }

}
