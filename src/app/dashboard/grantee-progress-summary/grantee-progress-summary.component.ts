import { Component, OnInit, Input, OnChanges, SimpleChanges, SimpleChange } from '@angular/core';

import { CurrencyService } from 'app/currency-service';


@Component({
    selector: 'app-granteeprogress-summary',
    templateUrl: './grantee-progress-summary.component.html',
    styleUrls: ['./grantee-progress-summary.component.css'],
    styles: [`
         ::ng-deep .progress-summary-class 
    `]
})
export class GranteeProgressSummaryComponent implements OnInit, OnChanges {

    @Input() data: any;
    @Input() display: boolean = false;

    heading: string;
    caption: string;
    actual: string;
    planned: string;
    isCurrency: boolean = true;
    percent: number;

    plannedFundOthers:string;
    actualFundOthers:string;
    percentFundOthers:number;

    constructor(
        public currencyService: CurrencyService
    ) {

    }

    ngOnInit() {

    }

    ngOnChanges(changes: SimpleChanges) {
        for (let property in changes) {
            if (property === 'data') {
                console.log('data changed');
                if (this.data) {
                    this.display = true;
                    this.heading = "Received";
                    this.caption = "Committed";
                    this.planned =  this.currencyService.getFormattedAmount(Number(this.data.committedAmount));
                    this.actual =  this.currencyService.getFormattedAmount(Number(this.data.disbursedAmount));
                    this.percent = Math.round(Number(this.data.disbursedAmount) / Number(this.data.committedAmount) * 100);
                
                    this.plannedFundOthers =  this.currencyService.getFormattedAmount(Number(this.data.plannedFundOthers)) ;
                    this.actualFundOthers  =this.currencyService.getFormattedAmount(Number(this.data.actualFundOthers));
                    this.percentFundOthers = Math.round(Number(this.data.actualFundOthers)/Number(this.data.plannedFundOthers)*100);
                }
            }
        }
    }

}
