import { ListDialogComponent } from './../../components/list-dialog/list-dialog.component';
import { MatDialog } from '@angular/material';
import { AppComponent } from 'app/app.component';
import { Grant } from 'app/model/dahsboard';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, Input, OnChanges, SimpleChanges, SimpleChange } from '@angular/core';


@Component({
    selector: 'app-myportfolio-summary',
    templateUrl: './myportfolio-summary.component.html',
    styleUrls: ['./myportfolio-summary.component.css']
})
export class MyPortfolioSummaryComponent implements OnInit, OnChanges {

    @Input() data: any;
    @Input() name: string;
    @Input() display: boolean;

    selected: any = { name: 'Loading...' };
    portfolioData: any;
    portfolioProgessData: any;
    portfolioDetailData: any;
    portfolioType: any;


    constructor(private http: HttpClient,
        public appComponent: AppComponent,
        private dialog: MatDialog) {

    }

    ngOnInit() {
        console.log('here');
    }

    ngOnChanges(changes: SimpleChanges) {
        for (let property in changes) {
            if (property === 'data') {
                console.log('data changed');
                if (this.data) {
                    this.display = true;
                    if (this.data[0]) {
                        this.selected = this.data[0];
                        this.portfolioData = this.data[0];
                        this.portfolioProgessData = this.data[0];
                        this.portfolioType = this.data[0].name;
                        this.portfolioDetailData = this.data[0].details;
                    }
                }
            }
        }
    }

    doSomething(ev: any) {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].name === ev.value) {
                this.display = true;
                this.selected = this.data[i];
                this.portfolioData = this.data[i];
                this.portfolioProgessData = this.data[i];
                this.portfolioType = this.data[i].name;
                this.portfolioDetailData = this.data[i].details;
            }
        }
    }

    showMyGrantsByStatus() {
        if (Number(this.selected.totalGrants) === 0) {
            return;
        } else {
            const status = this.selected.name === 'Active Grants' ? 'Active' : 'Closed';
            const httpOptions = {
                headers: new HttpHeaders({
                    "Content-Type": "application/json",
                    "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
                    Authorization: localStorage.getItem("AUTH_TOKEN"),
                }),
            };

            this.http.get<Grant[]>('/api/users/' + this.appComponent.loggedInUser.id + '/dashboard?forStatus='+ status, httpOptions).subscribe(result => {
                const dg = this.dialog.open(ListDialogComponent, {
                    data: { _for: status, grants: result, appComp: this.appComponent, title: (status + ' Grants') },
                    panelClass: "addnl-report-class"
                });


            });
        }
    }
}
