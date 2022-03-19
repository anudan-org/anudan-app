import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material';
import { AttachmentTemplates, Doc, Note, NoteTemplates, Template } from '../../model/dahsboard';
import { User } from "../../model/user";

@Component({
    selector: 'app-bottomsheetattachments',
    templateUrl: './bottomsheetNotes.component.html',
    styleUrls: ['./bottomsheetNotes.component.scss']
})
export class BottomsheetNotesComponent implements OnInit {

    passedNotesInfo: NoteTemplates;

    @ViewChild("scrollContainer") scrollContainer: ElementRef;

    constructor(
        private _bottomSheetRef: MatBottomSheetRef<BottomsheetNotesComponent>
        , @Inject(MAT_BOTTOM_SHEET_DATA) public data: NoteTemplates) {
        this.passedNotesInfo = this.data;
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

    processMessage(event: Event) {
        const msg = (<HTMLInputElement>event.srcElement);

        const note = new Note();
        note.message = msg.value;
        note.id = 0 - window.crypto.getRandomValues(new Uint32Array(10))[0];
        note.postedBy = (JSON.parse(localStorage.getItem('USER')));
        note.postedOn = new Date();
        this.passedNotesInfo.notes.push(note);
        msg.value = '';

        console.log(this.scrollContainer.nativeElement.scrollHeight);
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;

        /*const files = event.target.files;

        for (const file of files) {

            const reader: FileReader = new FileReader();

            const newDoc = new Doc();
            const id = 0 - window.crypto.getRandomValues(new Uint32Array(10))[0];
            newDoc.id = id;
            newDoc.fileName = file.name;
            newDoc.fileType = file.name.substr(file.name.lastIndexOf('.') + 1);
            this.passedNotesInfo.docs.push(newDoc);

            reader.onloadend = () => {
                const data = reader.result.toString();
                setTimeout(() => {
                    for (const tmplt of this.passedNotesInfo.docs) {
                        if (tmplt.id === newDoc.id) {
                            tmplt.data = data;
                            console.log(data);
                        }
                    }
                }, 3000);

            }

            reader.readAsDataURL(file);
        }*/
    }

}
