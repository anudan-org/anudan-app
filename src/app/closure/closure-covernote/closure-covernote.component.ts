import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AfterViewChecked,  Component, ElementRef, Inject, OnInit, Renderer2, ViewChild } from '@angular/core';
import {  MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { ClosureDataService } from 'app/closure.data.service';
import { FieldDialogComponent } from 'app/components/field-dialog/field-dialog.component';
import { GrantClosure } from 'app/model/closures';
import { AppSetting } from 'app/model/setting';

import { AppComponent } from 'app/app.component';


@Component({
  selector: 'app-closure-covernote',
  templateUrl: './closure-covernote.component.html',
  styleUrls: ['./closure-covernote.component.scss'],
  providers: [AppComponent]
})
export class ClosureCovernoteComponent implements OnInit, AfterViewChecked {
  currentClosure: GrantClosure;
  appSettings: AppSetting;
  doesNotHaveAllInputs: boolean;
  appComp: AppComponent;
  
  comment: string;
  covertext : SafeHtml;
  elementupdated: boolean = false;
  attributes: any;
  @ViewChild("flowContainer") flowContainer: ElementRef;
  
  cnvaluesetString: string;
  attributeValuePresent: boolean;

  constructor(public dialogRef: MatDialogRef<ClosureCovernoteComponent>
    , @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private closureService: ClosureDataService,
    private renderer: Renderer2
   ) {
    this.dialogRef.disableClose = true;
    this.currentClosure= this.data.currentClosure;
    this.appComp =this.data.appComp; 
  
    }

  ngOnInit() {
   
    this.attributes=JSON.parse(this.closureService.getCoverNoteAttributes(this.currentClosure.grant.organization.id, this.data.loggedInUser.id));
    this.covertext= this.sanitizer.bypassSecurityTrustHtml(this.currentClosure.covernoteContent);
   
  }

  ngAfterViewChecked(){
    if (!this.elementupdated) {
    this.populateAttributes();
    }
  }

  saveClosure() {
    if (!this.currentClosure.canManage) {
      return;
    }

    this.appComp.showSaving = true;
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "X-TENANT-CODE": localStorage.getItem("X-TENANT-CODE"),
        Authorization: localStorage.getItem("AUTH_TOKEN"),
      }),
    };

    const url =
      "/api/user/" +
      this.appComp.loggedInUser.id +
      "/closure/" +
      this.currentClosure.id;

    this.http
      .put(url, this.currentClosure, httpOptions)
      .subscribe((closure: GrantClosure) => {
        this.closureService.changeMessage(closure, this.appComp.loggedInUser.id);
        this.appComp.closureSaved = false;
        
      });
  }

populateAttributes(){
  
    let attributeMap = new Map();
  
    let currentAttributes;
    if (this.currentClosure.covernoteAttributes!==undefined && this.currentClosure.covernoteAttributes!=="" ) {
      currentAttributes = JSON.parse(this.currentClosure.covernoteAttributes);
    
      }
    
    if ( currentAttributes !== undefined ) {
      for (let currentAttribute of currentAttributes) {
       let name = currentAttribute.fieldName;
       let value = currentAttribute.fieldValue;
       attributeMap.set(name,value);
      }
     
    }

 
   for (let attribute of this.attributes) {
  
    let elem = document.getElementById(attribute.parentId);  
      if (elem !== null) {
      const nodeInvite = this.renderer.createElement('input');
      this.renderer.setAttribute(nodeInvite, 'placeholder', attribute.placeholder);
      this.renderer.setAttribute(nodeInvite, 'id', attribute.id);
      this.renderer.setAttribute(nodeInvite, 'style', attribute.attributeStyle);
      this.renderer.setAttribute(nodeInvite, 'name', attribute.fieldName);
      this.renderer.listen(nodeInvite, 'input', (event) => this.setTextWidth(event));
      let textlen =0;
      if (attributeMap.has(attribute.fieldName)) {
        this.renderer.setAttribute(nodeInvite, 'value', attributeMap.get(attribute.fieldName));
         textlen = attributeMap.get(attribute.fieldName).length;
      }
       textlen = textlen === 0 ? parseInt(attribute.placeholder.length) + 1 : textlen + 2;
     
       this.renderer.setStyle(nodeInvite, 'width', textlen +'ch');
       this.renderer.setStyle(nodeInvite, 'minWidth', textlen +'ch');
  
      this.renderer.appendChild(elem, nodeInvite);
      
      }
    }
    
    
    
    this.elementupdated=true;
  }

  setTextWidth(event) {
    console.log(event);
    
   
    let textlen =  parseInt(event.target.value.length ) === 0 ? parseInt(event.target.placeholder.length) + 1 : parseInt(event.target.value.length) + 2;
    event.target.style.width= textlen + "ch";
    event.target.style.minWidth= textlen + "ch";


  }
  updateModel() {
 
  let cnvaluesets:any [] =[];
   
    for (let attribute of this.attributes) {
      let id = $('#'+attribute.id);
   

      cnvaluesets.push( {
      "fieldName":$(id).attr('name'),
      "fieldValue":$(id).val()
      });
      if ($(id).val()!==undefined && $(id).val()!==null && $(id).val()!=='')  {
         this.attributeValuePresent = true;
      } 

    }
    this.cnvaluesetString = JSON.stringify(cnvaluesets);

    
  }

  contentModified(){
  
    if ( this.currentClosure.covernoteAttributes===undefined && !this.attributeValuePresent) {
      return false;
    } 
    if ( this.currentClosure.covernoteAttributes===undefined && this.attributeValuePresent )
    {
    return true;
    }
    if ( this.currentClosure.covernoteAttributes!==undefined && this.currentClosure.covernoteAttributes !==this.cnvaluesetString ) {
      return true;
    } 
  }


  onYesClick(): void {
   
    this.currentClosure.covernoteAttributes=this.cnvaluesetString;
    this.dialogRef.close({ 'result': true, data:this.currentClosure });
    
    this.saveClosure();

  }

  onNoClick(): void {
    this.updateModel();
    if (this.contentModified()) {
        const d = this.dialog.open(FieldDialogComponent, {
            data: { title: "Would you like to save the changes?", btnMain: "Save Cover Note", btnSecondary: "Not Now", subTitle: ((this.doesNotHaveAllInputs && this.doesNotHaveAllInputs === true) ? "<strong class='text-red'>Warning!</strong> Does not have all of the inputs filled." : "") },
            panelClass: "center-class"
        });

        d.afterClosed().subscribe(result => {
            if (result) {
                d.close();
                this.onYesClick();
            } else {
                d.close();
                this.dialogRef.close(false);
            }
        });

    } else {
        this.dialogRef.close(false);
    }

  }
}
