import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatBottomSheetRef, MatDialogRef } from '@angular/material';
import { Grant, AttachmentTemplates, Doc, Note, GrantNote, Template, GrantDiff, SectionDiff, AttributeDiff, GrantSnapshot } from '../../model/dahsboard';
import { Report, ReportNote, ReportDiff, ReportSnapshot } from '../../model/report';
import { User } from "../../model/user";
import { diff, addedDiff, deletedDiff, updatedDiff, detailedDiff } from 'deep-object-diff';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import * as inf from 'indian-number-format';
import { DisbursementNote, DisbursementSnapshot, DisbursementDiff, Disbursement } from 'app/model/disbursement';
import { DisbursementDataService } from 'app/disbursement.data.service';
import { CurrencyService } from 'app/currency-service';


@Component({
    selector: 'app-disbursementnotes',
    templateUrl: './disbursementNotes.component.html',
    styleUrls: ['./disbursementNotes.component.scss'],
    styles: [`
    ::ng-deep .grant-notes-class .mat-dialog-container{
            overflow-y: auto !important;
            border-radius: 0 !important;
        }
    `]
})
export class DisbursementNotesComponent implements OnInit {

    passedNotesInfo: DisbursementNote;
    changes: any[] = [];
    disbursementDiff: DisbursementDiff;
    original: any;
    current: any;
    validationResult: any;

    @ViewChild("scrollContainer") scrollContainer: ElementRef;
    @ViewChild("inputMessage") inputMessage: ElementRef;
    hasChanges = false;

    constructor(
        private _bottomSheetRef: MatDialogRef<DisbursementNotesComponent>
        , @Inject(MAT_DIALOG_DATA) public data: DisbursementNote, private http: HttpClient,
        private disbursementDataService: DisbursementDataService,
        private currencyService: CurrencyService) {
        this.validationResult = data.validationResult;
        _bottomSheetRef.disableClose = true;

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
        };

        this.disbursementDataService.getHistory(data.currentDisbursement)
            .then(snapshot => {
                this.original = snapshot;
                this.disbursementDataService.getPlainDisbursement(data.currentDisbursement)
                    .then((curr) => {
                        this.current = curr;
                    });
            });
    }

    ngOnInit() {
        console.log(this.data);
    }

    openLink(event: MouseEvent): void {
        this._bottomSheetRef.close();
        event.preventDefault();
    }

    close(status) {
        this._bottomSheetRef.close({ 'message': this.inputMessage ? this.inputMessage.nativeElement.value : '', 'result': status });
    }

    _diff(newDisbursement: Disbursement, olddisbursement: DisbursementSnapshot): any[] {
        const resultHeader = [];
        const resultSections = [];

        if (olddisbursement.requestedAmount !== newDisbursement.requestedAmount) {
            this._getDisbursementDiff();
            resultHeader.push({ 'order': 1, 'category': 'Approval Request', 'name': 'Requested Amount changed', 'change': [{ 'old': olddisbursement.requestedAmount, 'new': newDisbursement.requestedAmount }] });
            this.disbursementDiff.oldRequestedAmount = olddisbursement.requestedAmount;
            this.disbursementDiff.newRequestedAmount = newDisbursement.requestedAmount;
        }
        if (olddisbursement.reason !== newDisbursement.reason) {
            this._getDisbursementDiff();
            resultHeader.push({ 'order': 2, 'category': 'Approval Request', 'name': 'Approval Request Reason changed', 'change': [{ 'old': olddisbursement.reason, 'new': newDisbursement.reason }] });
            this.disbursementDiff.oldReason = olddisbursement.reason;
            this.disbursementDiff.newReason = newDisbursement.reason;
        }




        this.changes.push(resultHeader);
        return this.changes;
    }

    _getDisbursementDiff() {
        if (!this.disbursementDiff) {
            this.disbursementDiff = new DisbursementDiff();
        }
    }

    checkIfHasDifferences(val) {
        this.hasChanges = val;
    }
}
