import { FieldDialogComponent } from './../../components/field-dialog/field-dialog.component';
import { MatDialog } from '@angular/material';
import {Component, OnInit} from '@angular/core';
import { Disbursement } from 'app/model/disbursement';
import { AppComponent } from 'app/app.component';
import { DisbursementDataService } from 'app/disbursement.data.service';
import { Router } from '@angular/router';
import { CurrencyService } from 'app/currency-service';


@Component({
  selector: 'approved-disbursements-dashboard',
  templateUrl: './approved-disbursements.component.html',
  styleUrls: ['./approved-disbursements.component.css']
})
export class ApprovedDisbursementsComponent implements OnInit {

  disbursements: Disbursement[];

  constructor(
    public appComponent: AppComponent,
    public disbursementDataService: DisbursementDataService,
    private router: Router,
    public currencyService: CurrencyService,
    private dialog: MatDialog
  ){}

  ngOnInit() {
    this.appComponent.currentView = 'disbursements';
    this.appComponent.subMenu = {name:'Approvals Active',action:'ad'};
    this.fetchActiveDisbursements();
  }

  fetchActiveDisbursements() {
    this.disbursementDataService.fetchActiveDisbursements().then(list =>{
      this.disbursements = list;
      console.log(this.disbursements)
    });
  }

  manageDisbursement(disbursement:Disbursement){
    this.disbursementDataService.changeMessage(disbursement);
    this.router.navigate(['disbursement/preview']);
  }

  deleteDisbursement(disbursement: Disbursement) {

    
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: 'Are you sure you want to delete this disbursement?',btnMain:"Delete Disbursement",btnSecondary:"Not Now" },
      panelClass: 'center-class'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.disbursementDataService.deleteDisbursement(disbursement)
          .then(disbs => {
            this.disbursements = disbs;
          })
      } else {
        dialogRef.close();
      }
    });
  }
}
