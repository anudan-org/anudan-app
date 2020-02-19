import { Component, OnInit } from '@angular/core';
import {ReportDataService} from '../../report.data.service'
import {SingleReportDataService} from '../../single.report.data.service'
import {Report} from '../../model/report'
import {AppComponent} from '../../app.component';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Router, ActivatedRoute, ParamMap} from '@angular/router';
import {TitleCasePipe} from '@angular/common';
import * as indianCurrencyInWords from 'indian-currency-in-words';


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

    constructor(
        private reportService: ReportDataService,
        private singleReportService: SingleReportDataService,
        private http: HttpClient,
        private router: Router,
        private appComp: AppComponent,
        private titlecasePipe: TitleCasePipe){
        }

  ngOnInit() {
    this.reportService.currentMessage.subscribe(r => {
        this.reports = r;
     });

     this.getReports();
  }

  getReports(){
    const httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
            'Authorization': localStorage.getItem('AUTH_TOKEN')
        })};

    const user = JSON.parse(localStorage.getItem('USER'));
    const url = '/api/user/' + user.id + '/report/';
    this.http.get<Report[]>(url, httpOptions).subscribe((reports: Report[]) => {
        reports.sort((a,b) => a.endDate>b.endDate?1:-1);
        this.reportService.changeMessage(reports);
        this.submittedReports = this.reports.filter(a => a.status.internalStatus=='REVIEW');

    });
  }

  manageReport(report:Report){
    this.appComp.currentView = 'report';
    this.singleReportService.changeMessage(report);

    if(report.canManage && report.status.internalStatus!='CLOSED'){
        this.router.navigate(['report/report-header']);
    } else{
        this.appComp.action = 'report';
        this.router.navigate(['report/report-preview']);
    }
  }

    getGrantAmountInWords(amount:number){
        let amtInWords = '-';
        if(amount){
            amtInWords = indianCurrencyInWords(amount).replace("Rupees","").replace("Paisa","").replace("only","");
            return 'Rs. ' + this.titlecasePipe.transform(amtInWords);
        }
        return amtInWords;
    }
}
