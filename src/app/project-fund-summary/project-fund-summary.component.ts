import { GrantClosure } from './../model/closures';
import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as inf from "indian-number-format";


@Component({
  selector: 'app-project-fund-summary',
  templateUrl: './project-fund-summary.component.html',
  styleUrls: ['./project-fund-summary.component.scss']
})
export class ProjectFundSummaryComponent implements OnInit {

  @Input("currentClosure") currentClosure: GrantClosure;
  @Input("plannedFunds") plannedFunds: any;
  @Input("receivedFunds") receivedFunds: any;
  @Input("plannedDiff") plannedDiff: any;
  @Input("plannedOSFunds") plannedOSFunds: any;
  @Input("receivedOSFunds") receivedOSFunds: any;
  @Input("plannedOSDiff") plannedOSDiff: any;
  @Input("receivedDiff") receivedDiff: any;





  @ViewChild("grantRefundFormatted") grantRefundFormatted: ElementRef;
  @ViewChild("refundAmount") refundAmount: ElementRef;


  constructor() { }

  ngOnInit() {
  }

  showFormattedActualSpent(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    this.grantRefundFormatted.nativeElement.style.visibility = "visible";
  }

  showActualSpentInput(evt: any) {
    evt.currentTarget.style.visibility = "hidden";
    this.refundAmount.nativeElement.style.visibility = "visible";
  }

  getFormattedRefundAmount(amount: number): string {
    if (amount) {
      return inf.format(amount, 2);
    }
    return "<div class='amountPlaceholder'>Enter grant amount</div>";
  }

  captureRefund() {

  }
}
