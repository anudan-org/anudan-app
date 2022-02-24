import { UiUtilService } from './../../ui-util.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ReportDataService } from '../../report.data.service'
import { SingleReportDataService } from '../../single.report.data.service'
import { Report, ReportTemplate } from '../../model/report'
import { Grant } from '../../model/dahsboard';
import { AppComponent } from '../../app.component';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MatDialog, MatTabGroup } from '@angular/material';
import { ReportTemplateDialogComponent } from '../../components/report-template-dialog/report-template-dialog.component';
import { GrantSelectionDialogComponent } from '../../components/grant-selection-dialog/grant-selection-dialog.component';
import { AddnlreportsDialogComponent } from '../../components/addnlreports-dialog/addnlreports-dialog.component';
import { ReportComponent } from '../report/report.component';
import { TitleCasePipe } from '@angular/common';
import * as indianCurrencyInWords from 'indian-currency-in-words';
import * as inf from 'indian-number-format';
import { Observable, BehaviorSubject } from 'rxjs';
import { FieldDialogComponent } from 'app/components/field-dialog/field-dialog.component';
import { SearchFilterComponent } from 'app/layouts/admin-layout/search-filter/search-filter.component';
import * as moment from "moment";


@Component({
    selector: 'app-upcoming-reports',
    templateUrl: './upcoming-reports.component.html',
    styleUrls: ['./upcoming-reports.component.scss'],
    providers: [ReportComponent, TitleCasePipe]
})
export class UpcomingReportsComponent implements OnInit {
    reports: Report[];
    reportStartDate: Date;
    reportEndDate: Date;
    reportsToSetup: Report[];
    reportsToSetupData: Report[];
    reportsReadyToSubmit: Report[];
    allReports: Report[];
    addnlReports: Report[];
    futureReportsToSetup: Report[];
    subscribers: any = {};
    grants: Grant[] = [];
    otherReportsClicked: boolean = false;
    deleteReportsClicked: boolean = false;
    upcomingSearchCriteria: string;
    filteredToSetupReports: Report[];
    filteredToSetupReportD: Report[];
    filteredToSetupReportDOrig: Report[];
    filteredToSetupReportOD: Report[];
    filteredToSetupReportODOrig: Report[];
    filteredReadyToSubmitReports: Report[];
    filteredReadyToSubmitReportsD: Report[];
    filteredReadyToSubmitReportsOD: Report[];
    filteredReadyToSubmitReportsDOrig: Report[];
    filteredReadyToSubmitReportsODOrig: Report[];
    filterAllReports: Report[];
    searchClosed = true;
    filterReady = false;
    filterCriteria: any;
    @ViewChild("appSearchFilter") appSearchFilter: SearchFilterComponent;
    @ViewChild("matTabGroup") matTabGroup: MatTabGroup;

    constructor(
        private reportService: ReportDataService,
        private singleReportService: SingleReportDataService,
        private http: HttpClient,
        private router: Router,
        public appComp: AppComponent,
        private dialog: MatDialog,
        public reportComponent: ReportComponent,
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
                        let idx = -1;
                        if (this.reportsToSetup !== undefined && this.reportsToSetup !== null) {
                            idx = this.reportsToSetup.findIndex((x) => x.id === Number(report.id));
                            if (idx >= 0) {
                                this.reportsToSetup[idx] = report;
                            }
                        }
                        if (this.reportsReadyToSubmit !== undefined && this.reportsReadyToSubmit !== null) {
                            idx = this.reportsReadyToSubmit.findIndex((x) => x.id === Number(report.id));
                            if (idx >= 0) {
                                this.reportsReadyToSubmit[idx] = report;
                            }
                        }
                        if (this.futureReportsToSetup !== undefined && this.futureReportsToSetup !== null) {
                            idx = this.futureReportsToSetup.findIndex((x) => x.id === Number(report.id));
                            if (idx >= 0) {
                                this.futureReportsToSetup[idx] = report;
                            }
                        }
                    }
                });
            }
        });
    }

    ngOnInit() {
        this.appComp.subMenu = { name: 'Upcoming Reports', action: 'ur' };
        this.reportService.currentMessage.subscribe(r => {
            this.reports = r;
        });

        /*if(!this.reports){
           this.getReports();
        }else{
           this.processReports(this.reports);
        }*/
        this.getReports();
    }

    getReports() {

        const queryParams1 = new HttpParams().set('q', 'upcoming');
        const httpOptions1 = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                'Authorization': localStorage.getItem('AUTH_TOKEN')
            }),
            params: queryParams1
        };


        const user = JSON.parse(localStorage.getItem('USER'));
        const url = '/api/user/' + user.id + '/report/';
        this.http.get<Report[]>(url, httpOptions1).subscribe((reports: Report[]) => {
            //this.processReports(reports);
            this.reportsToSetup = reports;
            this.reportsToSetupData = reports;
            this.filteredToSetupReports = this.reportsToSetupData;
            if (this.filteredToSetupReports && this.filteredToSetupReports.length > 0) {
                this.filteredToSetupReportD = this.filteredToSetupReports.filter(r => moment(new Date()).diff(moment(r.dueDate), 'days') <= 0);
                this.filteredToSetupReportOD = this.filteredToSetupReports.filter(r => moment(new Date()).diff(moment(r.dueDate), 'days') > 0);
                this.filteredToSetupReportDOrig = this.filteredToSetupReportD;
                this.filteredToSetupReportODOrig = this.filteredToSetupReportOD;
            } else {
                this.filteredToSetupReportD = [];
                this.filteredToSetupReportOD = [];
                this.filteredToSetupReportDOrig = this.filteredToSetupReportD;
                this.filteredToSetupReportODOrig = this.filteredToSetupReportOD;
            }

            this.processReports(reports);
        });

        const queryParams2 = new HttpParams().set('q', 'upcoming-due');
        const httpOptions2 = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                'Authorization': localStorage.getItem('AUTH_TOKEN')
            }),
            params: queryParams2
        };
        this.http.get<Report[]>(url, httpOptions2).subscribe((reports: Report[]) => {
            //this.processReports(reports);
            this.reportsReadyToSubmit = reports;
            this.filteredReadyToSubmitReports = this.reportsReadyToSubmit;
            if (this.appComp.loggedInUser.organization.organizationType === 'GRANTEE') {
                this.reportsReadyToSubmit.sort((a, b) => (a.dueDate <= b.dueDate) ? -1 : 1);
            }

            if (this.filteredReadyToSubmitReports && this.filteredReadyToSubmitReports.length > 0) {
                this.filteredReadyToSubmitReportsD = this.filteredReadyToSubmitReports.filter(r => moment(new Date()).diff(moment(r.dueDate), 'days') <= 0);
                this.filteredReadyToSubmitReportsOD = this.filteredReadyToSubmitReports.filter(r => moment(new Date()).diff(moment(r.dueDate), 'days') > 0);
                this.filteredReadyToSubmitReportsDOrig = this.filteredReadyToSubmitReportsD;
                this.filteredReadyToSubmitReportsODOrig = this.filteredReadyToSubmitReportsOD;
            } else {
                this.filteredReadyToSubmitReportsD = [];
                this.filteredReadyToSubmitReportsOD = [];
                this.filteredReadyToSubmitReportsDOrig = this.filteredReadyToSubmitReportsD;
                this.filteredReadyToSubmitReportsODOrig = this.filteredReadyToSubmitReportsOD;
            }
        });

        const queryParams3 = new HttpParams().set('q', 'upcoming-future');
        const httpOptions3 = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                'Authorization': localStorage.getItem('AUTH_TOKEN')
            }),
            params: queryParams3
        };
        this.http.get<Report[]>(url, httpOptions3).subscribe((reports: Report[]) => {
            //this.processReports(reports);
            this.allReports = reports;
            this.filterAllReports = this.allReports;
        });
    }

    processReports(reports: Report[]) {
        /*reports.sort((a,b) => a.endDate>b.endDate?1:-1);
        let reportStartDate = new Date();
        let reportEndDate = new Date();
        reportEndDate.setDate(reportEndDate.getDate()+30);
        reportStartDate.setHours(0);
        reportStartDate.setMinutes(0);
        reportStartDate.setSeconds(0);
        reportEndDate.setHours(23);
        reportEndDate.setMinutes(59);
        reportEndDate.setSeconds(59);
        this.reportService.changeMessage(reports);
        this.reportsToSetup = this.reports.filter(a => (new Date(a.endDate).getTime() < reportStartDate.getTime() || (new Date(a.endDate).getTime() >= reportStartDate.getTime() && new Date(a.endDate).getTime()<=reportEndDate.getTime())) && (a.status.internalStatus!=='ACTIVE' && a.status.internalStatus!=='CLOSED' && a.status.internalStatus!=='REVIEW'));
        */
        if (reports) {
            for (let i = 0; i < reports.length; i++) {
                if (this.grants.filter(g => g.id === reports[i].grant.id).length === 0) {
                    this.grants.push(reports[i].grant);
                }
            }
        }
        /*
        this.reportsReadyToSubmit = this.reports.filter(a => (new Date(a.endDate).getTime() < reportStartDate.getTime() || (new Date(a.endDate).getTime() >= reportStartDate.getTime() && new Date(a.endDate).getTime()<=reportEndDate.getTime())) && (a.status.internalStatus==='ACTIVE'));
        this.futureReportsToSetup = this.reports.filter(a => new Date(a.endDate).getTime() > reportEndDate.getTime() && (a.status.internalStatus!=='ACTIVE' && a.status.internalStatus!=='CLOSED' && a.status.internalStatus!=='REVIEW'));
  
        if(this.reportsToSetup && this.reportsToSetup.length>0){
            for(let i=0; i<this.reportsToSetup.length; i++){
                const linkedReports = this.futureReportsToSetup.filter(r => r.grant.id===this.reportsToSetup[i].grant.id);
                if(linkedReports && linkedReports.length>0){
                    this.reportsToSetup[i].linkedReports = linkedReports.length;
                }
            }
        }
        console.log(this.reportStartDate + "    " + this.reportEndDate);
        */
    }
    manageReport(report: Report) {
        if (this.otherReportsClicked || this.deleteReportsClicked) {
            return;
        }

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
                this.appComp.action = 'report';
                this.router.navigate(['report/report-header']);
            } else {
                this.appComp.action = 'report';
                this.router.navigate(['report/report-preview']);
            }
        });


    }

    selectReportTemplate() {

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
        };

        const user = JSON.parse(localStorage.getItem('USER'));
        let url = '/api/user/' + user.id + '/report/templates';
        this.http.get<ReportTemplate[]>(url, httpOptions).subscribe((templates: ReportTemplate[]) => {
            //this.searchClosed = true;
            /* if (this.appSearchFilter) {
                this.appSearchFilter.closeSearch();
            } */
            let dialogRef = this.dialog.open(ReportTemplateDialogComponent, {
                data: templates,
                panelClass: 'grant-template-class'
            });

            dialogRef.afterClosed().subscribe(result => {
                if (result.result) {
                    const template = result.selectedTemplate;

                    url = '/api/user/' + user.id + '/grant/active';
                    this.http.get<Grant[]>(url, httpOptions).subscribe((activeGrants: Grant[]) => {
                        let dialogRef1 = this.dialog.open(GrantSelectionDialogComponent, {
                            data: activeGrants,
                            panelClass: 'grant-template-class'
                        });

                        dialogRef1.afterClosed().subscribe(result => {
                            if (result.result) {
                                this.reportComponent.createReport(template, result.selectedGrant);
                                this.appComp.selectedReportTemplate = result.selectedTemplate;
                            }
                        });
                    });




                } else {
                    dialogRef.close();
                }
            });
        });
    }

    viewAddnlReports(reportId: number, grantId: number, forType: string) {
        this.otherReportsClicked = true
        let dialogRef1 = this.dialog.open(AddnlreportsDialogComponent, {
            data: { data: { report: reportId, grant: grantId, grants: this.grants, futureReports: this.futureReportsToSetup, single: false, type: forType }, appComp: this.appComp },
            panelClass: 'addnl-report-class'
        });

        dialogRef1.afterClosed().subscribe(result => {
            if (result && result.result) {
                this.otherReportsClicked = false;
                this.manageReport(result.selectedReport);
            } else {
                this.otherReportsClicked = false;
                if (result.deleted && result.deleted.length > 0) {
                    let idx = -1;
                    if (this.reportsToSetup !== undefined && this.reportsToSetup !== null) {
                        idx = this.reportsToSetup.findIndex(x => x.id === reportId);
                        if (idx !== -1) {
                            this.reportsToSetup[idx].futureReportsCount = this.reportsToSetup[idx].futureReportsCount - 1;
                        }
                    }

                    if (this.reportsReadyToSubmit !== undefined && this.reportsReadyToSubmit !== null) {
                        idx = this.reportsReadyToSubmit.findIndex(x => x.id === reportId);
                        if (idx !== -1) {
                            this.reportsReadyToSubmit[idx].futureReportsCount = this.reportsReadyToSubmit[idx].futureReportsCount - 1;
                        }
                    }

                    if (this.allReports !== undefined && this.allReports !== null) {
                        idx = this.allReports.findIndex(x => x.id === reportId);
                        if (idx !== -1) {
                            this.allReports[idx].futureReportsCount = this.allReports[idx].futureReportsCount - 1;
                        }
                    }
                }
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

    highlight(ev: Event, state: boolean) {
        const target = ev.target as HTMLElement;
        if (state) {
            target.style.fontWeight = 'bold';
        } else {
            target.style.fontWeight = 'normal';
        }
    }

    getFormattedGrantAmount(amount: number): string {
        return inf.format(amount, 2);
    }

    /* startFilter(_for: string, ev) {
        const searchCriteria = ev.target.value;
        if (_for === 'upcoming') {
            if (searchCriteria !== '') {
                this.reportsToSetupData = this.reportsToSetup.filter(r => r.grant.name.includes(searchCriteria) || r.name.includes(searchCriteria));
            } else {
                this.reportsToSetupData = this.reportsToSetup;
            }
        }
    } */

    deleteReport(report: Report) {
        this.deleteReportsClicked = true;
        const dialogRef = this.dialog.open(FieldDialogComponent, {
            data: { title: 'Are you sure you want to delete this report?', btnMain: "Delete Report", btnSecondary: "Not Now" },
            panelClass: 'center-class'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.reportService.deleteReport(report)
                    .then(() => {
                        this.getReports();
                        this.deleteReportsClicked = false;
                    })
            } else {
                this.deleteReportsClicked = false;
                dialogRef.close();
            }
        });
    }

    public getGrantTypeName(typeId): string {
        return this.appComp.grantTypes.filter(t => t.id === typeId)[0].name;
    }

    public getGrantTypeColor(typeId): any {
        return this.appComp.grantTypes.filter(t => t.id === typeId)[0].colorCode;
    }

    isExternalGrant(grant: Grant): boolean {
        const grantType = this.appComp.grantTypes.filter(gt => gt.id === grant.grantTypeId)[0];
        if (!grantType || !grantType.internal) {
            return true;
        } else {
            return false;
        }
    }

    /* startFilter(val) {
        this.filteredToSetupReports = this.reportsToSetupData.filter(g => ((g.name && g.name.toLowerCase().includes(val)) || (g.grant.name.toLowerCase().includes(val)) || (g.grant.organization && g.grant.organization.name && g.grant.organization.name.toLowerCase().includes(val))));
        this.filteredReadyToSubmitReports = this.reportsReadyToSubmit.filter(g => ((g.name && g.name.toLowerCase().includes(val)) || (g.grant.name.toLowerCase().includes(val)) || (g.grant.organization && g.grant.organization.name && g.grant.organization.name.toLowerCase().includes(val))));
        this.filterAllReports = this.allReports.filter(g => ((g.name && g.name.toLowerCase().includes(val)) || (g.grant.name.toLowerCase().includes(val)) || (g.grant.organization && g.grant.organization.name && g.grant.organization.name.toLowerCase().includes(val))));
    } */

    startFilter(val) {
        val = val.toLowerCase();
        this.filterCriteria = val;
        if (this.matTabGroup.selectedIndex === 0 && this.filteredToSetupReportDOrig) {
            this.filteredToSetupReportD = this.filteredToSetupReportDOrig.filter(g => {
                return (g.name && g.name.trim() !== '' && g.name.toLowerCase().includes(val)) ||
                    (g.grant.name.toLowerCase().includes(val)) ||
                    (g.grant.organization && g.grant.organization.name && g.grant.organization.name.toLowerCase().includes(val)) ||
                    (g.grant.referenceNo && g.grant.referenceNo.toLowerCase().includes(val)) ||
                    (g.ownerName && g.ownerName.toLowerCase().includes(val))
            });
        }
        if (this.matTabGroup.selectedIndex === 1 && this.filteredToSetupReportODOrig) {
            this.filteredToSetupReportOD = this.filteredToSetupReportODOrig.filter(g => {
                return (g.name && g.name.trim() !== '' && g.name.toLowerCase().includes(val)) ||
                    (g.grant.name.toLowerCase().includes(val)) ||
                    (g.grant.organization && g.grant.organization.name && g.grant.organization.name.toLowerCase().includes(val)) ||
                    (g.grant.referenceNo && g.grant.referenceNo.toLowerCase().includes(val)) ||
                    (g.ownerName && g.ownerName.toLowerCase().includes(val))
            });
        }
        if (this.matTabGroup.selectedIndex === 0 && this.filteredReadyToSubmitReportsDOrig) {
            this.filteredReadyToSubmitReportsD = this.filteredReadyToSubmitReportsDOrig.filter(g => {
                return (g.name && g.name.trim() !== '' && g.name.toLowerCase().includes(val)) ||
                    (g.grant.name.toLowerCase().includes(val)) ||
                    (g.grant.organization && g.grant.organization.name && g.grant.organization.name.toLowerCase().includes(val)) ||
                    (g.grant.referenceNo && g.grant.referenceNo.toLowerCase().includes(val)) ||
                    (g.ownerName && g.ownerName.toLowerCase().includes(val))
            });
        }
        if (this.matTabGroup.selectedIndex === 1 && this.filteredReadyToSubmitReportsODOrig) {
            this.filteredReadyToSubmitReportsOD = this.filteredReadyToSubmitReportsODOrig.filter(g => {
                return (g.name && g.name.trim() !== '' && g.name.toLowerCase().includes(val)) ||
                    (g.grant.name.toLowerCase().includes(val)) ||
                    (g.grant.organization && g.grant.organization.name && g.grant.organization.name.toLowerCase().includes(val)) ||
                    (g.grant.referenceNo && g.grant.referenceNo.toLowerCase().includes(val)) ||
                    (g.ownerName && g.ownerName.toLowerCase().includes(val))
            });
        }
        if (this.matTabGroup.selectedIndex === 2 && this.allReports) {
            if (this.allReports) {
                this.filterAllReports = this.allReports.filter(g => {
                    return (g.name && g.name.trim() !== '' && g.name.toLowerCase().includes(val)) ||
                        (g.grant.name.toLowerCase().includes(val)) ||
                        (g.grant.organization && g.grant.organization.name && g.grant.organization.name.toLowerCase().includes(val)) ||
                        (g.grant.referenceNo && g.grant.referenceNo.toLowerCase().includes(val)) ||
                        (g.ownerName && g.ownerName.toLowerCase().includes(val))
                });
            }
        }

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
            this.appSearchFilter.closeSearch();
        }
    }

    reloadReports(ev) {
        this.filteredToSetupReportD = undefined;
        this.filteredToSetupReportOD = undefined;
        this.filteredReadyToSubmitReportsD = undefined;
        this.filteredReadyToSubmitReportsOD = undefined;
        this.filterAllReports = undefined;
        this.getReports();

    }
}
