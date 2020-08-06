import { Component, OnInit } from '@angular/core';
import { AppComponent } from 'app/app.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Grant } from 'app/model/dahsboard';
import { MatDialog } from '@angular/material';
import { GrantSelectionDialogComponent } from 'app/components/grant-selection-dialog/grant-selection-dialog.component';
import { Disbursement } from 'app/model/disbursement';
import { DisbursementDataService } from 'app/disbursement.data.service';
import { Router, NavigationStart } from '@angular/router';
import { CurrencyService } from 'app/currency-service';
import { DisbursementsComponent } from '../disbursements.component';
import { FieldDialogComponent } from 'app/components/field-dialog/field-dialog.component';


@Component({
  selector: 'inprogress-disbursements-dashboard',
  templateUrl: './inprogress-disbursements.component.html',
  styleUrls: ['./inprogress-disbursements.component.css']
})
export class InprogressDisbursementsComponent implements OnInit {

  disbursements: Disbursement[];
  deleteDisbursementEvent: boolean = false;


  public constructor(
    public appComponent: AppComponent,
    private httpClient: HttpClient,
    private dialog: MatDialog,
    public disbursementDataService: DisbursementDataService,
    private router: Router,
    public currencyService: CurrencyService
  ) { };


  ngOnInit() {
    this.appComponent.currentView = 'disbursements';
    this.appComponent.subMenu = { name: 'Approvals In-progress', action: 'id' };
    this.fetchInprogressDisbursements();
  }

  fetchInprogressDisbursements() {
    this.disbursementDataService.fetchInprogressDisbursements().then(list => {
      this.disbursements = list;
      console.log(this.disbursements)
    });
  }


  showOwnedActiveGrants() {

    this.disbursementDataService.showOwnedActiveGrants()
      .then(ownedGrants => {
        if (ownedGrants !== null) {
          const dialogRef = this.dialog.open(GrantSelectionDialogComponent, {
            data: ownedGrants,
            panelClass: 'grant-template-class'
          });

          dialogRef.afterClosed().subscribe((result) => {
            if (result.result) {
              this.createDisbursement(result.selectedGrant);
            } else {
              dialogRef.close();
            }
          });
        }
      });



  }


  createDisbursement(selectedGrant: Grant) {
    this.disbursementDataService.createNewDisbursement(selectedGrant)
      .then(d => {
        this.disbursementDataService.changeMessage(d);
        this.router.navigate(['disbursement/approval-request']);
      })

  }

  manageDisbursement(disbursement: Disbursement) {
    if (this.deleteDisbursementEvent) {
      return;
    }
    this.disbursementDataService.changeMessage(disbursement);
    if (disbursement.canManage) {
      this.router.navigate(['disbursement/approval-request']);
    } else {
      this.router.navigate(['disbursement/preview']);
    }
  }

  deleteDisbursement(disbursement: Disbursement) {

    this.deleteDisbursementEvent = true;
    const dialogRef = this.dialog.open(FieldDialogComponent, {
      data: { title: 'Are you sure you want to delete this disbursement?' },
      panelClass: 'center-class'
    });

    dialogRef.afterClosed().subscribe(result => {
      this.deleteDisbursementEvent = false;
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
