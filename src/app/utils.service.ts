import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GrantType } from './model/dahsboard';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  grantTypes: GrantType[];
  constructor(private httpClient: HttpClient) {

    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const loggedInUser = JSON.parse(localStorage.getItem('USER'));
    if (loggedInUser) {
      const url = "/api/user/" + loggedInUser.id + "/grant/grantTypes";
      this.httpClient.get(url, httpOptions).subscribe((result: GrantType[]) => {
        this.grantTypes = result;
        this.setGrantTypes(this.grantTypes);
      });
    }
  }

  setGrantTypes(grantTypes: GrantType[]) {
    this.grantTypes = grantTypes;
  }

  getGrantTypeName(grantTypeId: number): string {
    const gtIdx = this.grantTypes.findIndex(gt => gt.id === grantTypeId);
    return (!gtIdx || gtIdx === -1) ? "External Workflow" : this.grantTypes[gtIdx].name;
  }
}
