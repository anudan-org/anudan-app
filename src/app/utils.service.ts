import { GrantType } from './model/dahsboard';
import { AppComponent } from './app.component';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  grantTypes: GrantType[];
  constructor() { }

  setGrantTypes(grantTypes: GrantType[]) {
    this.grantTypes = grantTypes;
  }

  getGrantTypeName(grantTypeId: number): string {
    const gtIdx = this.grantTypes.findIndex(gt => gt.id === grantTypeId);
    return (!gtIdx || gtIdx === -1) ? "External Workflow" : this.grantTypes[gtIdx].name;
  }
}
