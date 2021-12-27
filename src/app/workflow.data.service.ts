import { AppComponent } from 'app/app.component';
import { Injectable } from "@angular/core";
import { HttpHeaders, HttpClient } from "@angular/common/http";
import { WorkflowTransition } from "./model/workflow-transition";
import { Disbursement } from "./model/disbursement";
import { WorkflowStatus } from "./model/dahsboard";
import { Configuration } from "./model/app-config";

@Injectable({
    providedIn: 'root'
})
export class WorkflowDataService {

    url = '/api/admin/workflow';
    user = JSON.parse(localStorage.getItem('USER'));
    httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
            'Authorization': localStorage.getItem('AUTH_TOKEN')
        })
    };

    constructor(
        private httpClient: HttpClient
    ) { }

    getDisbursementWorkflow(disbursement: Disbursement): Promise<WorkflowTransition[]> {
        return this.httpClient.get(this.url + '/disbursement/' + disbursement.id + '/user/' + this.user.id, this.httpOptions)
            .toPromise()
            .then<WorkflowTransition[]>()
            .catch(err => {
                return Promise.reject<WorkflowTransition[]>("Could not retrieve workflow");
            });
    }

    getDisbursementWorkflowStatuses(disbursement: Disbursement, appComp: AppComponent): Promise<WorkflowStatus[]> {
        return this.httpClient.get('/api/app/config/disbursement/' + disbursement.id, this.httpOptions)
            .toPromise()
            .then<WorkflowStatus[]>((config: Configuration) => {
                appComp.tenantUsers = config.tenantUsers;
                return Promise.resolve<WorkflowStatus[]>(config.disbursementWorkflowStatuses);
            })
            .catch(err => {
                return Promise.reject<WorkflowStatus[]>('Could not retrieve workflow stauses');
            });
    }
}