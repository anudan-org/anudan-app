import { Component, Inject, OnInit } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material';
import { AttachmentTemplates, Doc, Template } from '../../model/dahsboard';

@Component({
    selector: 'app-bottomsheetattachments',
    templateUrl: './bottomsheetAttachments.component.html',
    styleUrls: ['./bottomsheetAttachments.component.scss']
})
export class BottomsheetAttachmentsComponent implements OnInit {

    passedDocsInfo: AttachmentTemplates;

    constructor(
        private _bottomSheetRef: MatBottomSheetRef<BottomsheetAttachmentsComponent>
        , @Inject(MAT_BOTTOM_SHEET_DATA) public data: AttachmentTemplates) {
        this.passedDocsInfo = this.data;
    }

    ngOnInit() {
        console.log(this.data);
    }

    openLink(event: MouseEvent): void {
        this._bottomSheetRef.dismiss();
        event.preventDefault();
    }

    close() {
        this._bottomSheetRef.dismiss();
    }

    processFile(event) {
        const files = event.target.files;

        for (const file of files) {

            const reader: FileReader = new FileReader();

            const newDoc = new Doc();
            const id = 0 - window.crypto.getRandomValues(new Uint32Array(10))[0];
            newDoc.id = id;
            newDoc.fileName = file.name;
            newDoc.fileType = file.name.substr(file.name.lastIndexOf('.') + 1);
            this.passedDocsInfo.docs.push(newDoc);

            reader.onloadend = () => {
                const data = reader.result.toString();
                setTimeout(() => {
                    for (const tmplt of this.passedDocsInfo.docs) {
                        if (tmplt.id === newDoc.id) {
                            tmplt.data = data;
                            console.log(data);
                        }
                    }
                }, 3000);

            }

            reader.readAsDataURL(file);
        }
    }

}
