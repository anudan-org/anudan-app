import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {ActivatedRoute, Router, NavigationStart,ActivationEnd,RouterEvent} from '@angular/router';
import {AppComponent} from '../../../app.component';
import {Report, ReportFieldInfo, ReportDocInfo, ReportSectionInfo} from '../../../model/report'
import {Section, TableData, ColumnData, Attribute, TemplateLibrary,AttachmentDownloadRequest,WorkflowStatus} from '../../../model/dahsboard'
import {SingleReportDataService} from '../../../single.report.data.service'
import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {ToastrService,IndividualConfig} from 'ngx-toastr';
import {FormControl} from '@angular/forms';
import {interval, Observable, Subject} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatAutocompleteSelectedEvent, MatAutocomplete} from '@angular/material/autocomplete';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {SidebarComponent} from '../../../components/sidebar/sidebar.component';
import {SectionEditComponent} from '../../../components/section-edit/section-edit.component';
import {MatBottomSheet, MatDatepickerInputEvent, MatDialog} from '@angular/material';
import {FieldDialogComponent} from '../../../components/field-dialog/field-dialog.component';
import {AdminLayoutComponent} from '../../../layouts/admin-layout/admin-layout.component'
import { saveAs } from 'file-saver';
import {Configuration} from '../../../model/app-config';
import {User} from '../../../model/user';

@Component({
  selector: 'app-report-sections',
  templateUrl: './report-sections.component.html',
  styleUrls: ['./report-sections.component.scss'],
  providers: [SidebarComponent]
})
export class ReportSectionsComponent implements OnInit {

    @ViewChild('auto') matAutocomplete: MatAutocomplete;
    @ViewChild('fruitInput') fruitInput: ElementRef<HTMLInputElement>;
    @ViewChild('createSectionModal') createSectionModal: ElementRef;

    action: string;
    currentReport: Report;
    langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
    humanizer: HumanizeDuration = new HumanizeDuration(this.langService);
    newField: any;
    myControl: FormControl;
    options: TemplateLibrary[];
    separatorKeysCodes: number[] = [ENTER, COMMA];
    fruitCtrl = new FormControl();
    filteredOptions: Observable<TemplateLibrary[]>;
    allowScroll = true;
    reportWorkflowStatuses:WorkflowStatus[];
    tenantUsers: User[];

    constructor(private router: Router,
        private route: ActivatedRoute,
        public appComp: AppComponent,
        private singleReportDataService: SingleReportDataService,
        private http: HttpClient,
        private toastr: ToastrService,
        private adminComp: AdminLayoutComponent,
        private sidebar: SidebarComponent,
        private dialog: MatDialog,
        private elem: ElementRef) {

        this.route.params.subscribe( (p) => {
        this.action = p['action'];
        this.appComp.action = this.action;
        });


        this.singleReportDataService.currentMessage.subscribe((report) => {
                    this.currentReport = report;
                    this.setDateDuration();
                    console.log(this.currentReport);
                });
                 const httpOptions = {
                    headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                    'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                    'Authorization': localStorage.getItem('AUTH_TOKEN')
                    })
                };
                let url = '/api/app/config/report/'+this.currentReport.id;

                this.http.get(url,httpOptions).subscribe((config:Configuration) =>{
                    this.reportWorkflowStatuses = config.reportWorkflowStatuses;
                    this.appComp.reportWorkflowStatuses = config.reportWorkflowStatuses;
                    this.tenantUsers = config.tenantUsers;
                    this.appComp.tenantUsers = config.tenantUsers;
                    this.appComp.reportTransitions=config.reportTransitions;
                });
    }

    ngOnInit() {


        this.myControl = new FormControl();
        this.options = this.appComp.appConfig.templateLibrary;
        const docs = this.options.slice();

        this.filteredOptions = this.myControl.valueChanges
        .pipe(
            startWith(''),
            map(value => typeof value === 'string' ? value : value),
            map(name => name ? this._filter(name) : docs)
        );

        this.appComp.createNewReportSection.subscribe((val) =>{
            if(val){
                $('.modal-backdrop').remove();

                this.addNewSection();
                this.appComp.createNewReportSection.next(false);
            }
        });
    }

    ngAfterViewChecked() {
        if(this.newField){
            this.scrollTo(this.newField);
        }
    }

    setDateDuration(){
        if(this.currentReport.startDate && this.currentReport.endDate){
            var time = new Date(this.currentReport.endDate).getTime() - new Date(this.currentReport.startDate).getTime();
            time = time + 86400001;
            this.currentReport.duration = this.humanizer.humanize(time, { largest: 2, units: ['y', 'mo'], round: true});
        }else{
            this.currentReport.duration = 'No end date';
        }
    }

    getCleanText(section:Section): string{
        if(section.sectionName === ''){
            return String(section.id);
        }
        return section.sectionName.replace(/[^_0-9a-z]/gi, '');
    }

    addNewFieldToSection(sectionId: string, sectionName: string) {
        this.appComp.sectionInModification = true;

        const httpOptions = {
            headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
            'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
        };

        const url = '/api/user/' + this.appComp.loggedInUser.id + '/report/' + this.currentReport.id + '/section/' + Number(sectionId) + '/field';

        this.http.post<ReportFieldInfo>(url,this.currentReport, httpOptions).subscribe((info: ReportFieldInfo) => {
            this.singleReportDataService.changeMessage(info.report);
            this.currentReport = info.report;
            this.appComp.sectionInModification = false;
            this.newField = 'field_' + info.stringAttributeId;
        },
        error => {
                const errorMsg = error as HttpErrorResponse;
                console.log(error);
                this.toastr.error(errorMsg.error.message, errorMsg.error.messageTitle, {
                enableHtml: true
            });
        });
    }

    scrollTo(uniqueID){

        const elmnt = document.getElementById(uniqueID); // let if use typescript

        if(elmnt){
            const elementRect = elmnt.getBoundingClientRect();
            const absoluteElementTop = elementRect.top + window.pageYOffset;
            const middle = absoluteElementTop - (window.innerHeight / 2);
            window.scrollTo(0, middle);
            elmnt.focus();
        }
        this.newField = null;
    }

    handleTypeChange(ev: Event, attr: Attribute,sec:Section){
        attr.fieldValue = '';
        if(ev.toString()==='table'){
            if(attr.fieldValue.trim() === ''){
                attr.fieldTableValue = [];
                const data = new TableData();
                data.name = "";
                data.columns = [];

            for(let i=0; i< 5; i++){
                const col = new ColumnData();
                col.name = "";
                col.value = '';
                data.columns.push(col);
            }

            attr.fieldTableValue.push(JSON.parse(JSON.stringify(data)));
            }
        }

        const httpOptions = {
            headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
            'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
        };

        let url = '/api/user/' + this.appComp.loggedInUser.id + '/report/'
        + this.currentReport.id + '/section/'+sec.id+'/field/'+attr.id;
        this.http.put<ReportFieldInfo>(url, {'report':this.currentReport,'attr':attr}, httpOptions).subscribe((info: ReportFieldInfo) => {
            this.singleReportDataService.changeMessage(info.report);
            this.newField = 'field_' + info.stringAttributeId;
            },error => {
                const errorMsg = error as HttpErrorResponse;
                console.log(error);
                const x = {'enableHtml': true,'preventDuplicates': true} as Partial<IndividualConfig>;
                const config: Partial<IndividualConfig> = x;
                if(errorMsg.error.message==='Token Expired'){
                    this.toastr.error("Your session has expired", 'Logging you out now...', config);
                    setTimeout( () => { this.appComp.logout(); }, 4000 );
                } else {
                    this.toastr.error(errorMsg.error.message,"22 We encountered an error", config);
                }
        });
    }

    private _filter(value: any): TemplateLibrary[] {
        let filterValue;
        if(typeof value==='string'){
            filterValue = value.toLowerCase();
        }else {
            filterValue = value.name;
        }

        const selectedDoc = this.options.filter(option => option.name.toLowerCase().includes(filterValue));
        return selectedDoc;
    }

    displayFn = doc => {
        return doc ? doc.name : undefined;
    }

    ////////////////////////
    add(attribute: Attribute,event: MatChipInputEvent): void {
    // Add fruit only when MatAutocomplete is not open
    // To make sure this does not conflict with OptionSelected Event
        if (!this.matAutocomplete.isOpen) {
            const input = event.input;
            const value = event.value;

            // Add our fruit
            if ((value || '')) {
                const index = attribute.docs.findIndex((a) => a.name===value);
                attribute.docs.push(this.options[index]);
            }

        // Reset the input value
            if (input) {
                input.value = '';
            }

            this.myControl.setValue(null);
        }
    }


    remove(attribute: Attribute, fruit: TemplateLibrary) {
        const index = attribute.docs.findIndex((a) => a.id===fruit.id);

        if (index >= 0) {
            attribute.docs.splice(index, 1);
            attribute.fieldValue = JSON.stringify(attribute.docs);
        }
    }

    selected(attribute: Attribute, event: MatAutocompleteSelectedEvent): void {
        const fileExistsCheck=this._checkAttachmentExists(event.option.value.name);
        if(fileExistsCheck.status){
            alert("Document " + event.option.value.name + ' is already attached under ' + fileExistsCheck.message);
            return;
        }
        const httpOptions = {
            headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
            'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
        };

        const url = '/api/user/' + this.appComp.loggedInUser.id + '/report/' + this.currentReport.id + '/field/'+attribute.id+'/template/'+event.option.value.id;

        this.http.post<ReportDocInfo>(url,this.currentReport, httpOptions).subscribe((info: ReportDocInfo) => {
            this.singleReportDataService.changeMessage(info.report);

            this.currentReport = info.report;
            this.newField = 'attriute_'+attribute.id+'_attachment_' + info.attachmentId;
            this.allowScroll = false;
            attribute.fieldValue = JSON.stringify(attribute.docs);
            this.fruitInput.nativeElement.value = '';
            this.fruitCtrl.setValue(null);
        });

    }

    _checkAttachmentExists(filename):any{
        for(let section of this.currentReport.reportDetails.sections){
            if(section && section.attributes){
                for(let attr of section.attributes){
                    if(attr && attr.fieldType==='document'){
                        if(attr.attachments && attr.attachments.length > 0){
                            for(let attach of attr.attachments){
                                if(attach.name === filename){
                                    return {'status':true,'message':section.sectionName + ' | ' + attr.fieldName};
                                }
                            }
                        }

                    }
                }
            }
        }
            return {'status':false,'message':''};
    }

    checkIfSelected(doc):boolean{
        for(let section of this.currentReport.reportDetails.sections){
            if(section && section.attributes){
                for(let attr of section.attributes){
                    if(attr.fieldType==='document' && attr.attachments && attr.attachments.length > 0){
                        for(let attach of attr.attachments){
                            if(attach.name === doc.name){
                                return true;
                            }
                        }
                    }
                }
            }
        }
            return false;
    }


    processSelectedFiles(section,attribute,event){
        const files = event.target.files;


        const endpoint = '/api/user/' + this.appComp.loggedInUser.id + '/report/'+this.currentReport.id+'/section/'+section.id+'/attribute/'+attribute.id+'/upload';
        let formData = new FormData();
        for( let i=0; i< files.length; i++){
            formData.append('file', files.item(i));
            const fileExistsCheck=this._checkAttachmentExists(files.item(i).name.substring(0,files.item(i).name.lastIndexOf('.')));
            if(fileExistsCheck.status){
                alert("Document " + files.item(i).name + ' is already attached under ' + fileExistsCheck.message);
                event.target.value='';
                return;
            }
        }

        formData.append('reportToSave',JSON.stringify(this.currentReport));
        const httpOptions = {
            headers: new HttpHeaders({
            'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
            'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
        };

        this.http.post<ReportDocInfo>(endpoint,formData, httpOptions).subscribe((info: ReportDocInfo) => {
            this.singleReportDataService.changeMessage(info.report)
            this.currentReport = info.report;
            this.newField = 'attriute_'+attribute.id+'_attachment_' + info.attachmentId;
        });
    }

    addNewSection() {
            this.appComp.sectionInModification = true;
            const createSectionModal = this.createSectionModal.nativeElement;
            const titleElem = $(createSectionModal).find('#createSectionLabel');
            $(titleElem).html('Add new section');
            $(createSectionModal).modal('show');
        }


    saveSection() {
        const sectionName = $('#sectionTitleInput');
        if (sectionName.val().trim() === '') {
            this.toastr.warning('Section name cannot be left blank', 'Warning');
            sectionName.focus();
            return;
        }

        const createSectionModal = this.createSectionModal.nativeElement;

        const httpOptions = {
            headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
            'Authorization': localStorage.getItem('AUTH_TOKEN')
            })
        };

        const url = '/api/user/' + this.appComp.loggedInUser.id + '/report/' + this.currentReport.id + '/template/'+this.currentReport.template.id+'/section/'+sectionName.val();

        this.http.post<ReportSectionInfo>(url,this.currentReport, httpOptions).subscribe((info: ReportSectionInfo) => {
            this.singleReportDataService.changeMessage(info.report);

            sectionName.val('');
            //$('#section_' + newSection.id).css('display', 'block');
            $(createSectionModal).modal('hide');
            this.appComp.sectionAdded = true;
            this.sidebar.buildSectionsSideNav(null);
            this.appComp.sectionInModification = false;
            //  this.appComp.selectedTemplate = info.report.template;
            this.router.navigate(['report/section/' + this.getCleanText(info.report.reportDetails.sections.filter((a) => a.id===info.sectionId)[0])]);
        },error => {
            const errorMsg = error as HttpErrorResponse;
            console.log(error);
            const x = {'enableHtml': true,'preventDuplicates': true} as Partial<IndividualConfig>;
            const config: Partial<IndividualConfig> = x;
            if(errorMsg.error.message==='Token Expired'){
                this.toastr.error("Your session has expired", 'Logging you out now...', config);
                setTimeout( () => { this.appComp.logout(); }, 4000 );
            } else {
                this.toastr.error(errorMsg.error.message,"23 We encountered an error", config);
            }
        });
    }

    editSection(section){
        const dialogRef = this.dialog.open(SectionEditComponent, {
            data: section,
            panelClass: 'field-class'
        });


        dialogRef.afterClosed().subscribe(result => {
            if(result===undefined || result.trim()===''){
                return;
            }
            section.sectionName = result;
            this.singleReportDataService.changeMessage(this.currentReport);
            this.router.navigate(['report/section/' + this.getCleanText(section)]);
            this.sidebar.buildSectionsSideNav(null);
        });
    }

    deleteSection(secId: number, title: string) {
        const dialogRef = this.dialog.open(FieldDialogComponent, {
          data: title
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const httpOptions = {
                    headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                    'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                    'Authorization': localStorage.getItem('AUTH_TOKEN')
                    })
                };

                const url = '/api/user/' + this.appComp.loggedInUser.id + '/report/' + this.currentReport.id + '/template/'+this.currentReport.template.id+'/section/'+secId;

                this.http.put<Report>(url,this.currentReport, httpOptions).subscribe((report: Report) => {
                    this.singleReportDataService.changeMessage(report);
                    const path = this.sidebar.buildSectionsSideNav(null);
                    this.router.navigate([path]);
                },error => {
                    const errorMsg = error as HttpErrorResponse;
                    console.log(error);
                    const x = {'enableHtml': true,'preventDuplicates': true} as Partial<IndividualConfig>;
                    const config: Partial<IndividualConfig> = x;
                    if(errorMsg.error.message==='Token Expired'){
                        this.toastr.error("Your session has expired", 'Logging you out now...', config);
                        setTimeout( () => { this.appComp.logout(); }, 4000 );
                    } else {
                        this.toastr.error(errorMsg.error.message,"24 We encountered an error", config);
                    }

                });
            }
        });
    }

    showHistory(type,obj){
        this.adminComp.showHistory(type,obj);
    }

    showWorkflowAssigments(){
        this.adminComp.showWorkflowAssigments();
    }

    moveTo(section,fromAttr,toAttr){
        if(toAttr === null){
            return;
        }
        const from = fromAttr.attributeOrder;
        fromAttr.attributeOrder = toAttr.attributeOrder;
        toAttr.attributeOrder = from;
        section.attributes.sort((a, b) => (a.attributeOrder > b.attributeOrder) ? 1 : -1)
        this.newField = 'fieldBlock_'+ fromAttr.id;
    }


    deleteFieldEntry(sectionId: number, attributeId: number, attributeName: string) {
        const dialogRef = this.dialog.open(FieldDialogComponent, {
              data: 'Are you sure you want to delete ' + attributeName
            });

            dialogRef.afterClosed().subscribe(result => {
                if(result){
                    const httpOptions = {
                        headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                        'Authorization': localStorage.getItem('AUTH_TOKEN')
                        })
                    };

                    const url = '/api/user/' + this.appComp.loggedInUser.id + '/report/' + this.currentReport.id + '/section/'+sectionId+'/field/'+attributeId;

                    this.http.post<Report>(url,this.currentReport, httpOptions).subscribe((report: Report) => {
                        this.singleReportDataService.changeMessage(report);
                    },error => {
                        const errorMsg = error as HttpErrorResponse;
                        console.log(error);
                        const x = {'enableHtml': true,'preventDuplicates': true} as Partial<IndividualConfig>;
                        const config: Partial<IndividualConfig> = x;
                        if(errorMsg.error.message==='Token Expired'){
                            this.toastr.error("Your session has expired", 'Logging you out now...', config);
                            setTimeout( () => { this.appComp.logout(); }, 4000 );
                        } else {
                            this.toastr.error(errorMsg.error.message,"25 We encountered an error", config);
                        }
                    });
                }else{
                    dialogRef.close();
                }
            });
    }

    moveColsLeft(){
    $('#tableArea').animate({
        scrollLeft: "+=200px"
      }, "100","linear",function(){
     });
     }

   moveColsRight(){
    $('#tableArea').animate({
        scrollLeft: "-=200px"
      }, "100","linear",function(){
      });

   }

   getFieldTypeDisplayValue(type:string):string{
    if(type==="multiline"){
        return "Descriptive";
    } else if(type==="kpi"){
        return "Measurement/KPI";
    } else if(type==="table"){
        return "Tablular";
    } else if(type==="document"){
        return "Document";
    }
    return "";
   }

   handleSelection(attribId,attachmentId){
      const elems = this.elem.nativeElement.querySelectorAll('[id^="attriute_'+attribId+'_attachment_"]');
      if(elems.length>0){
      for(let singleElem of elems){
       if(singleElem.checked){
           this.elem.nativeElement.querySelector('[id^="attachments_download_'+attribId+'"]').disabled = false;
           return;
       }
       this.elem.nativeElement.querySelector('[id^="attachments_download_'+attribId+'"]').disabled = true;
      }
      }
      }

      downloadSelection(attribId){
         const elems = this.elem.nativeElement.querySelectorAll('[id^="attriute_'+attribId+'_attachment_"]');
         const selectedAttachments = new AttachmentDownloadRequest();
         if(elems.length>0){
         selectedAttachments.attachmentIds = [];
         for(let singleElem of elems){
          if(singleElem.checked){
              selectedAttachments.attachmentIds.push(singleElem.id.split('_')[3]);
          }
         }
           const httpOptions = {
                 responseType: 'blob' as 'json',
                 headers: new HttpHeaders({
                   'Content-Type': 'application/json',
                   'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
                   'Authorization': localStorage.getItem('AUTH_TOKEN')
                 })
               };

               let url = '/api/user/' + this.appComp.loggedInUser.id + '/report/'
                   + this.currentReport.id + '/attachments';
               this.http.post(url, selectedAttachments, httpOptions).subscribe((data) => {
                   saveAs(data,this.currentReport.grant.name+'_'+this.currentReport.name+'.zip');
               });
        }
      }


deleteAttachment(attributeId, attachmentId){

    const httpOptions = {
          headers: new HttpHeaders({
              'Content-Type': 'application/json',
              'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
              'Authorization': localStorage.getItem('AUTH_TOKEN')
          })
      };

      const url = '/api/user/' + this.appComp.loggedInUser.id + '/report/' + this.currentReport.id + '/attribute/'+attributeId+'/attachment/'+attachmentId;
        this.http.post<Report>(url, this.currentReport, httpOptions).subscribe((report: Report) => {
            this.singleReportDataService.changeMessage(report);
            this.currentReport = report;
            for(let section of this.currentReport.reportDetails.sections){
                if(section && section.attributes){
                    for(let attr of section.attributes){
                    if(attributeId===attr.id){
                        if(attr.attachments && attr.attachments.length>0){
                        this.newField = 'attriute_'+attributeId+'_attachment_' + attr.attachments[attr.attachments.length-1].id;
                        }
                    }
                    }
                }
            }
        });
    }
}
