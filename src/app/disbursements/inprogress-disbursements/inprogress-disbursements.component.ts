import { SearchFilterComponent } from './../../layouts/admin-layout/search-filter/search-filter.component';
import { UiUtilService } from './../../ui-util.service';
import { Component, OnInit, ViewChild } from '@angular/core';
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
  filteredDisbursements: Disbursement[] = [];
  searchClosed = true;
  filterReady = false;
  filterCriteria: any;
  @ViewChild("appSearchFilter") appSearchFilter: SearchFilterComponent;

  public constructor(
    public appComponent: AppComponent,
    private dialog: MatDialog,
    public disbursementDataService: DisbursementDataService,
    private router: Router,
    public currencyService: CurrencyService,
    public uiService: UiUtilService,
  ) {

    disbursementDataService.initiateDisbursement.subscribe((val) => {
      if (val == true) {
        this.showOwnedActiveGrants();
      }
    });
  };


  ngOnInit() {
    this.appComponent.currentView = 'disbursements';
    this.appComponent.subMenu = { name: 'Approvals In-progress', action: 'id' };
    this.fetchInprogressDisbursements();
  }

  fetchInprogressDisbursements() {
    this.disbursementDataService.fetchInprogressDisbursements().then(list => {
      this.disbursements = list;
      this.filteredDisbursements = this.disbursements;
      console.log(this.disbursements)
    });
  }


  showOwnedActiveGrants() {
    this.disbursementDataService.startDisbursement(false);
    this.disbursementDataService.showOwnedActiveGrants()
      .then(ownedGrants => {
        if (ownedGrants !== null) {
          const dialogRef = this.dialog.open(GrantSelectionDialogComponent, {
            data: ownedGrants,
            panelClass: 'grant-template-class'
          });
          /* this.searchClosed = true;
          if (this.appSearchFilter) {
            this.appSearchFilter.closeSearch();
          } */
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
      data: { title: 'Are you sure you want to delete this disbursement?', btnMain: "Delete Disbursement", btnSecondary: "Not Now" },
      panelClass: 'center-class'
    });

    dialogRef.afterClosed().subscribe(result => {
      this.deleteDisbursementEvent = false;
      if (result) {
        this.disbursementDataService.deleteDisbursement(disbursement)
          .then(disbs => {
            this.disbursements = disbs;
            this.filteredDisbursements = this.disbursements;
          })
      } else {
        dialogRef.close();
      }
    });
  }

  public getGrantTypeName(typeId): string {
    return this.appComponent.grantTypes.filter(t => t.id === typeId)[0].name;
  }

  public getGrantTypeColor(typeId): any {
    return this.appComponent.grantTypes.filter(t => t.id === typeId)[0].colorCode;
  }

  isExternalGrant(grant: Grant): boolean {
    if (this.appComponent.loggedInUser.organization.organizationType === 'GRANTEE') {
      return true;
    }

    const grantType = this.appComponent.grantTypes.filter(gt => gt.id === grant.grantTypeId)[0];
    if (!grantType.internal) {
      return true;
    } else {
      return false;
    }
  }

  /* startFilter(val) {
    this.filteredDisbursements = this.disbursements.filter(g => ((g.grant.name.toLowerCase().includes(val)) || (g.grant.organization && g.grant.organization.name && g.grant.organization.name.toLowerCase().includes(val))));
  } */

  startFilter(val) {
    val = val.toLowerCase();
    this.filterCriteria = val;
    this.filteredDisbursements = this.disbursements.filter(g => {
      return (g.grant.name.toLowerCase().includes(val)) ||
        (g.grant.organization && g.grant.organization.name && g.grant.organization.name.toLowerCase().includes(val)) ||
        (g.grant.referenceNo && g.grant.referenceNo.toLowerCase().includes(val)) ||
        (g.ownerName && g.ownerName.toLowerCase().includes(val))
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
      this.appSearchFilter.closeSearch();
    }
  }

}
