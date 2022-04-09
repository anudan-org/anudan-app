import { takeUntil } from 'rxjs/operators';
import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import {
  Disbursement,
  DisbursementWorkflowAssignment,
  ActualDisbursement,
} from "./model/disbursement";
import { HttpHeaders, HttpClient } from "@angular/common/http";
import { Grant, TableData } from "./model/dahsboard";
import { UserService } from "./user.service";
import { CurrencyService } from "./currency-service";
import { Report } from "./model/report";
import { DatePipe } from "@angular/common";
import { saveAs } from "file-saver";

@Injectable({
  providedIn: "root",
})
export class DisbursementDataService {
  private messageSource = new BehaviorSubject<Disbursement>(null);
  private ngUnsubscribe = new Subject();
  public initiateDisbursement = new BehaviorSubject<Grant>(new Grant());

  url: string = "/api/user/%USERID%/disbursements";
  months: string[] = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  currentMessage = this.messageSource.asObservable();

  constructor(
    private httpClient: HttpClient,
    public userService: UserService,
    public currencyService: CurrencyService,
    private dp: DatePipe,
  ) { }

  startDisbursement(val) {
    this.initiateDisbursement.next(val);
  }

  changeMessage(message: Disbursement) {
    if (message !== undefined && message !== null) {
      this.setPermission(message);

      if (message.actualDisbursements && message.actualDisbursements.length > 0) {
        for (let ad of message.actualDisbursements) {
          ad.stDisbursementDate = this.dp.transform(ad.disbursementDate, 'dd-MMM-yyyy');
        }
      }
      this.messageSource.next(message);
    }
  }

  private getUrl(): string {
    const user = this.userService.getUser();
    if (user !== undefined) {
      return this.url.replace("%USERID%", user.id);
    }
  }

  private getHeader() {
    return {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };
  }

  saveDisbursement(currentDisbursement: Disbursement): Promise<Disbursement> {
    const tmpDisbursement = JSON.parse(JSON.stringify(currentDisbursement));
    if (tmpDisbursement !== undefined && tmpDisbursement !== null) {
      if (tmpDisbursement.approvedActualsDibursements) {
        tmpDisbursement.approvedActualsDibursements = null;
      }

      if (tmpDisbursement.actualDisbursements) {
        for (let ad of tmpDisbursement.actualDisbursements) {
          if (ad.disbursementDate && (typeof ad.disbursementDate === 'string') && !String(ad.disbursementDate).includes('T')) {
            const dateParts = String(ad.disbursementDate).split("-");
            const dt = new Date();
            dt.setFullYear(Number(dateParts[2]));
            const idx = this.months.indexOf(dateParts[1]);
            dt.setMonth(idx != -1 ? idx : Number(dateParts[1]));
            dt.setDate(Number(dateParts[0].substring(0, 2)));
            ad.disbursementDate = dt;
          } else if (ad.disbursementDate && (typeof ad.disbursementDate === 'string') && String(ad.disbursementDate).includes('T')) {
            const dateParts = String(ad.disbursementDate).split("-");
            const dt = new Date();
            dt.setFullYear(Number(dateParts[0]));
            const idx = this.months.indexOf(dateParts[1]);
            dt.setMonth(idx != -1 ? idx : Number(dateParts[1]) - 1);
            dt.setDate(Number(dateParts[2].substring(0, 2)));
            ad.disbursementDate = dt;
          }
        }
      }
      return this.httpClient
        .post(this.getUrl() + "/", tmpDisbursement, this.getHeader())
        .toPromise()
        .then<Disbursement>()
        .catch((err) => {
          return Promise.reject<Disbursement>(
            "Error creating the disbursement"
          );
        });
    } else {
      return Promise.resolve(null);
    }
  }

  fetchInprogressDisbursements(): Promise<Disbursement[]> {
    return this.httpClient
      .get(this.getUrl() + "/status/DRAFT", this.getHeader())
      .toPromise()
      .then<Disbursement[]>((d: Disbursement[]) => {
        if (d && d.length > 0) {
          for (let disb of d) {
            this.setPermission(disb);
          }
        }
        return Promise.resolve<Disbursement[]>(d);
      })
      .catch((err) => {
        return Promise.reject<Disbursement[]>(
          "Could not retrieve disbursements"
        );
      });
  }

  fetchActiveDisbursements(): Promise<Disbursement[]> {
    return this.httpClient
      .get(this.getUrl() + "/status/ACTIVE", this.getHeader())
      .toPromise()
      .then<Disbursement[]>((d2: Disbursement[]) => {
        if (d2 && d2.length > 0) {
          for (let disb of d2) {
            this.setPermission(disb);
          }
        }
        return Promise.resolve<Disbursement[]>(d2);
      });
  }

  fetchClosedDisbursements(): Promise<Disbursement[]> {
    return this.httpClient
      .get(this.getUrl() + "/status/CLOSED", this.getHeader())
      .toPromise()
      .then<Disbursement[]>((d1: Disbursement[]) => {
        if (d1 && d1.length > 0) {
          for (let disb of d1) {
            this.setPermission(disb);
          }
        }
        return Promise.resolve<Disbursement[]>(d1);
      });
  }

  showOwnedActiveGrants(): Promise<Grant[]> {
    return this.httpClient
      .get(this.getUrl() + "/active-grants", this.getHeader())
      .toPromise()
      .then<Grant[]>()
      .catch((err) => {
        return Promise.reject<Grant[]>("Could not retrieve Active grants");
      });
  }

  createNewDisbursement(selectedGrant: Grant): Promise<Disbursement> {
    const disbursement: Disbursement = new Disbursement();
    return this.httpClient
      .post<Disbursement>(
        this.getUrl() + "/grant/" + selectedGrant.id,
        disbursement,
        this.getHeader()
      )
      .toPromise()
      .then<Disbursement>()
      .catch((err) => {
        return Promise.reject<Disbursement>();
      });
  }

  deleteDisbursement(disbursement: Disbursement): Promise<Disbursement[]> {
    if (disbursement !== undefined && disbursement !== null) {
      return this.httpClient
        .delete(
          this.getUrl() + "/" + disbursement.id + "/DRAFT",
          this.getHeader()
        )
        .toPromise()
        .then<Disbursement[]>((d: Disbursement[]) => {
          if (d && d.length > 0) {
            for (let disb1 of d) {
              this.setPermission(disb1);
            }
          }
          return Promise.resolve<Disbursement[]>(d);
        })
        .catch((err) => {
          return Promise.reject<Disbursement[]>(
            "Unable to delete the disbursement"
          );
        });
    } else {
      return Promise.resolve(null);
    }
  }

  setPermission(disbursement: Disbursement): Disbursement {
    if (disbursement !== undefined && disbursement !== null) {
      const disb = disbursement.assignments.filter(
        (a) =>
          a.owner === this.userService.getUser().id &&
          a.stateId == disbursement.status.id
      );
      if (
        disb &&
        disb.length > 0 &&
        disbursement.status.internalStatus !== "ACTIVE" &&
        disbursement.status.internalStatus !== "CLOSED"
      ) {
        disbursement.canManage = true;
      } else {
        disbursement.canManage = false;
      }

      if (
        disb &&
        disb.length > 0 &&
        disbursement.status.internalStatus === "ACTIVE"
      ) {
        disbursement.canRecordActuals = true;
      } else {
        disbursement.canRecordActuals = false;
      }

      return disbursement;
    } else {
      return null;
    }
  }

  getPermission(disbursement: Disbursement): Disbursement {
    this.setPermission(disbursement);
    return disbursement;
  }

  saveAssignments(
    disbursement: Disbursement,
    assignment: DisbursementWorkflowAssignment[]
  ): Promise<Disbursement> {
    if (disbursement !== undefined && disbursement !== null) {
      return this.httpClient
        .post(
          this.getUrl() + "/" + disbursement.id + "/assignment",
          { disbursement: disbursement, assignments: assignment },
          this.getHeader()
        )
        .toPromise()
        .then((d: Disbursement) => {
          this.setPermission(d);
          return Promise.resolve<Disbursement>(d);
        })
        .catch((err) => {
          return Promise.reject<Disbursement>("Could not save assignments");
        });
    } else {
      return Promise.resolve(null);
    }
  }

  getDisbursement(disbursementId: number): Promise<Disbursement> {
    if (disbursementId !== undefined && disbursementId !== null) {
      return this.httpClient
        .get(this.getUrl() + "/" + disbursementId, this.getHeader())
        .toPromise()
        .then((d: Disbursement) => {
          this.setPermission(d);
          return Promise.resolve<Disbursement>(d);
        })
        .catch((err) => {
          return Promise.reject<Disbursement>(
            "Could not retrieve disbursement"
          );
        });
    } else {
      return Promise.resolve(null);
    }
  }

  checkIfHeaderHasMissingEntries(disbursement: Disbursement): boolean {
    if (
      !disbursement.requestedAmount ||
      !disbursement.reason ||
      disbursement.reason.trim() === ""
    ) {
      return true;
    } else {
      return false;
    }
  }

  getHistory(disbursement: Disbursement): Promise<any> {
    if (disbursement !== undefined && disbursement !== null) {
      return this.httpClient
        .get(
          this.getUrl() + "/" + disbursement.id + "/changeHistory",
          this.getHeader()
        )
        .toPromise()
        .then<any>()
        .catch((err) => {
          return Promise.reject<any>(
            "Could not retieve Disbursement snapshot"
          );
        });
    } else {
      return Promise.resolve(null);
    }
  }

  getPlainDisbursement(disbursement: Disbursement): Promise<any> {
    if (disbursement !== undefined && disbursement !== null) {
      return this.httpClient
        .get(
          this.getUrl() + "/compare/" + disbursement.id,
          this.getHeader()
        )
        .toPromise()
        .then<any>();
    } else {
      return Promise.resolve(null);
    }
  }

  submitDisbursement(
    disbursement: Disbursement,
    message: string,
    fromStateId: number,
    toStateId: number
  ): Promise<Disbursement> {
    if (disbursement !== undefined && disbursement !== null) {
      if (disbursement.approvedActualsDibursements) {
        disbursement.approvedActualsDibursements = null;
      }
      if (disbursement.actualDisbursements) {
        for (let ad of disbursement.actualDisbursements) {
          if (ad.disbursementDate) {
            const dateParts = String(ad.disbursementDate).split("-");
            const dt = new Date();
            dt.setFullYear(Number(dateParts[2]));
            dt.setMonth(this.months.indexOf(dateParts[1]));
            dt.setDate(Number(dateParts[0]));
            ad.disbursementDate = dt;
          }
        }
      }
      return this.httpClient
        .post(
          this.getUrl() +
          "/" +
          disbursement.id +
          "/flow/" +
          fromStateId +
          "/" +
          toStateId,
          { disbursement: disbursement, note: message },
          this.getHeader()
        )
        .toPromise()
        .then((d: Disbursement) => {
          this.setPermission(d);
          return Promise.resolve<Disbursement>(d);
        })
        .catch((err) => {
          return Promise.reject<Disbursement>("Could not move disbursement");
        });
    } else {
      return Promise.resolve(null);
    }
  }

  addNewDisbursementRow(
    disbursement: Disbursement
  ): Promise<ActualDisbursement> {
    if (disbursement !== undefined && disbursement !== null) {
      return this.httpClient
        .get(
          this.getUrl() + "/" + disbursement.id + "/actual",
          this.getHeader()
        )
        .toPromise()
        .then<ActualDisbursement>()
        .catch((err) => {
          return Promise.reject<ActualDisbursement>(
            "Unable to reate new actual disbursement entry"
          );
        });
    } else {
      return Promise.resolve(null);
    }
  }

  deleteDisbursementRow(
    disbursement: Disbursement,
    actualDisbursement: ActualDisbursement
  ): Promise<any> {
    if (disbursement !== undefined && disbursement !== null) {
      return this.httpClient
        .delete(
          this.getUrl() +
          "/" +
          disbursement.id +
          "/actual/" +
          actualDisbursement.id,
          this.getHeader()
        )
        .toPromise()
        .then()
        .catch((err) => {
          return Promise.reject(
            "Unable to reate new actual disbursement entry"
          );
        });
    } else {
      return Promise.resolve();
    }
  }

  checkIfActiveOrClosed(disbursement: Disbursement): boolean {
    if (
      disbursement.status.internalStatus === "ACTIVE" ||
      disbursement.status.internalStatus === "CLOSED"
    ) {
      return true;
    } else {
      return false;
    }
  }

  checkIfClosed(disbursement: Disbursement): boolean {
    if (disbursement.status.internalStatus === "CLOSED") {
      return true;
    } else {
      return false;
    }
  }

  checkIfDisbursementHasActualDisbursements(
    disbursement: Disbursement
  ): boolean {
    if (disbursement.actualDisbursements) {
      for (let d of disbursement.actualDisbursements) {
        if (
          d.actualAmount === undefined ||
          d.actualAmount === null ||
          String(d.actualAmount).trim() === "" ||
          d.disbursementDate === undefined ||
          d.disbursementDate === null ||
          String(d.disbursementDate).trim() === ""
        ) {

          return false;
        }
      }
    }
    return true;
  }

  getActualDisbursementsTotal(disbursement: Disbursement): number {
    let total = 0;
    if (disbursement.approvedActualsDibursements) {
      for (let ad of disbursement.approvedActualsDibursements) {
        total += ad.actualAmount === undefined ? 0 : ad.actualAmount;
      }
    }
    return total;
  }

  getFFOSTotal(disbursement: Disbursement): number {
    let total = 0;
    for (let ad of disbursement.approvedActualsDibursements) {
      total += ad.otherSources ? ad.otherSources : 0;
    }
    return total;
  }

  addNewDisbursementRowByGrantee(report: Report): Promise<TableData> {
    if (report !== undefined && report !== null) {
      return this.httpClient
        .post(
          this.getUrl() +
          "/grant/" +
          report.grant.id +
          "/report/" +
          report.id +
          "/record",
          {},
          this.getHeader()
        )
        .toPromise()
        .then<TableData>()
        .catch((err) => {
          return Promise.reject<TableData>(
            "Unable to create new actual disbursement entry"
          );
        });
    } else {
      return Promise.resolve(null);
    }
  }

  removeDisbursementRowByGrantee(actualDisbursementId: number): Promise<void> {
    return this.httpClient
      .delete(
        this.getUrl() + "/remove/" + actualDisbursementId,
        this.getHeader()
      )
      .toPromise()
      .then<void>()
      .catch((err) => {
        return Promise.reject<void>(
          "Unable to create new actual disbursement entry"
        );
      });
  }

  downloadAttachment(userId: number, disbursementId: number, docName: string, docId: number, docLoc: string): void {

    const httpOptions = {
      responseType: "blob" as "json",
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    let url =
      "/api/user/" +
      userId +
      "/disbursements/" +
      disbursementId +
      "/file/" + docId;

    this.httpClient
      .get(url, httpOptions)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data) => {
        saveAs(data, docName + '.' + docLoc.substring(docLoc.lastIndexOf(".") + 1));
      });
  }
}
