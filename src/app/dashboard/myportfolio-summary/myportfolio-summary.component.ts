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


    constructor() {

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
}
