import { Grant } from './../../model/dahsboard';
import { UiUtilService } from './../../ui-util.service';
import { Component, OnInit } from '@angular/core';
import { ReportDataService } from '../../report.data.service'
import { SingleReportDataService } from '../../single.report.data.service'
import { Report } from '../../model/report'
import { AppComponent } from '../../app.component';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import * as indianCurrencyInWords from 'indian-currency-in-words';
import * as inf from 'indian-number-format';


@Component({
    selector: 'app-submitted-reports',
    templateUrl: './submitted-reports.component.html',
    styleUrls: ['./submitted-reports.component.scss'],
    providers: [TitleCasePipe]
})
export class SubmittedReportsComponent implements OnInit {
    reports: Report[];
    submittedReports: Report[];
    subscribers: any = {};
    filteredSubmittedReports: Report[];
    searchClosed = true;
    filterReady = false;
    filterCriteria: any;

    constructor(
        private reportService: ReportDataService,
        private singleReportService: SingleReportDataService,
        private http: HttpClient,
        private router: Router,
        public appComp: AppComponent,
        private titlecasePipe: TitleCasePipe,
        public uiService: UiUtilService) {

        this.appComp.reportUpdated.subscribe((statusUpdate) => {
            if (statusUpdate.status && statusUpdate.reportId) {
                let url =
                    "/api/user/" + this.appComp.loggedInUser.id + "/report/" + statusUpdate.reportId;
                const httpOptions = {
                    headers: new HttpHeaders({
                        "Content-Type": "application/json",
                        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
                        Authorization: localStorage.getItem("AUTH_TOKEN"),
                    }),
                };

                this.http.get(url, httpOptions).subscribe((report: Report) => {
                    if (report) {
                        let idx = this.submittedReports.findIndex((x) => x.id === Number(report.id));
                        if (idx >= 0) {
                            this.submittedReports[idx] = report;
                        }
                    }
                });
            }
        });
    }

    ngOnInit() {
        this.appComp.subMenu = { name: 'Submitted Reports', action: 'sr' };
        this.reportService.currentMessage.subscribe(r => {
            this.reports = r;
        });
        this.getReports();
    }

    getReports() {
        const queryParams = new HttpParams().set('q', 'submitted');
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                'Authorization': localStorage.getItem('AUTH_TOKEN')
            }),
            params: queryParams
        };

        const user = JSON.parse(localStorage.getItem('USER'));
        const url = '/api/user/' + user.id + '/report/';
        this.http.get<Report[]>(url, httpOptions).subscribe((reports: Report[]) => {
            reports.sort((a, b) => a.endDate > b.endDate ? 1 : -1);
            this.reportService.changeMessage(reports);
            this.submittedReports = reports;
            this.filteredSubmittedReports = this.submittedReports;

        });
    }

    manageReport(report: Report) {


        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
        };

        const user = JSON.parse(localStorage.getItem('USER'));
        let url = '/api/user/' + user.id + '/report/' + report.id;
        this.http.get<Report>(url, httpOptions).subscribe((report: Report) => {
            this.appComp.currentView = 'report';
            this.singleReportService.changeMessage(report);
            if (report.canManage && report.status.internalStatus != 'CLOSED') {
                this.router.navigate(['report/report-header']);
            } else {
                this.appComp.action = 'report';
                this.router.navigate(['report/report-preview']);
            }
        });

    }

    getGrantAmountInWords(amount: number) {
        let amtInWords = '-';
        if (amount) {
            amtInWords = indianCurrencyInWords(amount).replace("Rupees", "").replace("Paisa", "");
            return 'Rs. ' + this.titlecasePipe.transform(amtInWords);
        }
        return amtInWords;
    }

    getFormattedGrantAmount(amount: number): string {
        return inf.format(amount, 2);
    }

    public getGrantTypeName(typeId): string {
        return this.appComp.grantTypes.filter(t => t.id === typeId)[0].name;
    }

    public getGrantTypeColor(typeId): any {
        return this.appComp.grantTypes.filter(t => t.id === typeId)[0].colorCode;
    }

    /*  startFilter(val) {
         this.filteredSubmittedReports = this.submittedReports.filter(g => ((g.name && g.name.toLowerCase().includes(val)) || (g.grant.name.toLowerCase().includes(val)) || (g.grant.organization && g.grant.organization.name && g.grant.organization.name.toLowerCase().includes(val))));
     } */

    isExternalGrant(grant: Grant): boolean {
        const grantType = this.appComp.grantTypes.filter(gt => gt.id === grant.grantTypeId)[0];
        if (!grantType || !grantType.internal) {
            return true;
        } else {
            return false;
        }
    }

    startFilter(val) {
        val = val.toLowerCase();
        this.filterCriteria = val;
        this.filteredSubmittedReports = this.submittedReports.filter(g => {
            return (g.name && g.name.trim() !== '' && g.name.toLowerCase().includes(val)) ||
                (g.grant.name.toLowerCase().includes(val)) ||
                (g.grant.organization && g.grant.organization.name && g.grant.organization.name.toLowerCase().includes(val)) ||
                (g.grant.referenceNo && g.grant.referenceNo.toLowerCase().includes(val))
        });

        this.filterReady = true;

    }

    resetFilterFlag(val) {
        this.filterReady = val;
    }


    closeSearch(ev: any) {
        this.searchClosed = ev;
    }

    openSearch() {
        if (this.searchClosed) {
            this.searchClosed = false;
        } else {
            this.searchClosed = true;
        }
    }
}
