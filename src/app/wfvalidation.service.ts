import { ColumnData } from './model/dahsboard';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WfvalidationService {

  constructor(private http: HttpClient) { }

  private getHeader() {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };
    return httpOptions;
  }


  validateGrantWorkflow(id: number, _for: string, userId: number, fromStateId: number, toStateId: number, params?: ColumnData[], direction?: boolean): Promise<any> {
    return this.http.post('/api/admin/' + id + '/workflow/validate/' + _for + '/' + fromStateId + '/' + toStateId + "/" + direction, params ? params : null, this.getHeader())
      .toPromise().then((result: any) => {
        if (result && Object.keys(result).length === 0 && result.constructor === Object) {
          result.canMove = true;
          result.messages = [];
        }
        let canMove = result.canMove;
        const infoMessages = result.messages.filter(m => m.type === 'INFO');
        const errorMessages = result.messages.filter(m => m.type === 'WARN');


        return { canMove: canMove, info: infoMessages, error: errorMessages };

      });
  }
}
