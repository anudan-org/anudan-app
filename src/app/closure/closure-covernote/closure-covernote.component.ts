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
  divWidth: number;

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
        if ( attribute.inputType ==="text"){
          this.addInputElement(elem, attribute, attributeMap);

        }
        if ( attribute.inputType ==='textarea'){
          this.addTextAreaElement(elem, attribute, attributeMap);
        }
      }
    }
    
    this.elementupdated=true;
  }

  addInputElement(elem, attribute, attributeMap) {
    let node = this.renderer.createElement('input');
    this.renderer.setAttribute(node, 'placeholder', attribute.placeholder);
    this.renderer.setAttribute(node, 'id', attribute.id);
    this.renderer.addClass(node, attribute.className);
    this.renderer.setAttribute(node, 'name', attribute.fieldName);
    this.renderer.listen(node, 'input', (event) => this.setTextWidth(event));
    let textlen =0;
    let elementlength=parseInt(attribute.placeholder.length) + 1;
    if (attributeMap.has(attribute.fieldName)) {
      textlen = attributeMap.get(attribute.fieldName).length;
      this.renderer.setAttribute(node, 'value', attributeMap.get(attribute.fieldName));
     }
      elementlength = textlen === 0 ? elementlength : textlen + 2;
      this.renderer.setStyle(node, 'width', elementlength +'ch');
      this.renderer.setStyle(node, 'minWidth', elementlength +'ch');
     
    
    this.renderer.appendChild(elem, node);
  }

  addTextAreaElement(elem, attribute, attributeMap){
      let node = this.renderer.createElement('textarea');
      this.renderer.setAttribute(node, 'placeholder', attribute.placeholder);
      this.renderer.setAttribute(node, 'id', attribute.id);
      this.renderer.addClass(node, attribute.className);
      this.renderer.setAttribute(node, 'name', attribute.fieldName);
      this.renderer.listen(node, 'input', (event) => this.setTextWidth(event));

      this.renderer.appendChild(elem, node);
      this.divWidth = document.getElementById('contentId').getBoundingClientRect().width;

      let el = document.getElementById(attribute.id);
      el.style.width= this.divWidth + 'px';
      if (attributeMap.has(attribute.fieldName)) {
      el.innerHTML=attributeMap.get(attribute.fieldName);
      }
      el.style.height =(el.scrollHeight +10) + 'px';
      
       
  }

  setTextWidth(event) {
   
    let textlen =  parseInt(event.target.value.length ) === 0 ? parseInt(event.target.placeholder.length) + 1 : parseInt(event.target.value.length) + 2;
    
    if ( event.target.localName ==="textarea"){
        let element = event.currentTarget.id;
        let el = document.getElementById(element);
        el.style.height =el.scrollHeight + 'px';
     
    } else {
    event.target.style.width= textlen + "ch";
    event.target.style.minWidth= textlen + "ch";

      }



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
