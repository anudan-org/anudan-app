import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';
import { Disbursement, DisbursementWorkflowAssignmentModel, DisbursementWorkflowAssignment, ActualDisbursement } from 'app/model/disbursement';
import { DisbursementDataService } from 'app/disbursement.data.service';
import { AppComponent } from 'app/app.component';
import * as indianCurrencyInWords from 'indian-currency-in-words';
import { TitleCasePipe, DatePipe } from '@angular/common';
import * as inf from 'indian-number-format';
import { Attribute, TableData } from 'app/model/dahsboard';
import { AdminLayoutComponent } from 'app/layouts/admin-layout/admin-layout.component';
import { Router, NavigationStart } from '@angular/router';
import { WorkflowValidationService } from 'app/workflow-validation-service';
import { MatDialog, MatDatepicker, MatDatepickerInputEvent } from '@angular/material';
import { MessagingComponent } from 'app/components/messaging/messaging.component';
import { FieldDialogComponent } from 'app/components/field-dialog/field-dialog.component';
import { WfassignmentComponent } from 'app/components/wfassignment/wfassignment.component';
import { WorkflowDataService } from 'app/workflow.data.service';
import { DisbursementNotesComponent } from 'app/components/disbursementNotes/disbursementNotes.component';
import { CurrencyService } from 'app/currency-service';


@Component({
  selector: 'disbursement-preview-dashboard',
  templateUrl: './disbursement-preview.component.html',
  styleUrls: ['./disbursement-preview.component.css'],
  providers: [TitleCasePipe],
  styles: [`
       ::ng-deep .disbursements-class .mat-form-field-appearance-legacy .mat-form-field-infix {
             padding:0 !important;
       }
  `,
  `
    ::ng-deep .disbursements-class .mat-form-field-appearance-legacy .mat-form-field-wrapper{
            padding-bottom: 0 !important;
    }
  `,`
   ::ng-deep .disbursements-class .mat-form-field-infix{
           border-top: 0 !important;
   }
  `]
})
export class DisbursementPreviewComponent implements OnInit {

  currentDisbursement:Disbursement
  logoUrl: string;
  subscribers: any = {};
  wfDisabled: boolean = false;

  @ViewChild('pdf') pdf;
  @ViewChild('datePicker') datePicker:MatDatepicker<any>;
  @ViewChild('tablePlaceholder') tablePlaceholder: ElementRef;

  originalDisbursement: any;
  selectedDateField: any;
  selectedField: ActualDisbursement;

  constructor(
    private disbursementService: DisbursementDataService,
    private appComponent: AppComponent,
    private titlecasePipe: TitleCasePipe,
    private adminComp: AdminLayoutComponent,
    private router: Router,
    private workflowValidationService:WorkflowValidationService,
    private dialog:MatDialog,
    private workflowDataService: WorkflowDataService,
    private datepipe: DatePipe,
    public currencyService: CurrencyService
    ){
      this.disbursementService.currentMessage.subscribe( disbursement => this.currentDisbursement = disbursement);

      this.subscribers.name = this.router.events.subscribe((val) => {
        if(val instanceof NavigationStart && this.currentDisbursement){
          this.disbursementService.saveDisbursement(this.currentDisbursement)
          .then(d => {
            this.disbursementService.changeMessage(d);
          });
        }
      });
    }

  ngOnInit() {
    this.originalDisbursement = JSON.parse(JSON.stringify(this.currentDisbursement));
    this.appComponent.currentView = 'disbursement';
    
    if(this.currentDisbursement===undefined || this.currentDisbursement===null){
      this.appComponent.currentView = 'dashboard';
      this.router.navigate(['dashboard']);
    }
    this.logoUrl = "/api/public/images/"+this.currentDisbursement.grant.grantorOrganization.code+"/logo";

    console.log(this.currentDisbursement);
  }


  getGrantAmountInWords(amount:number){
    let amtInWords = '-';
    if(amount){
        amtInWords = indianCurrencyInWords(amount).replace("Rupees","").replace("Paisa","");
        return 'Rs. ' + this.titlecasePipe.transform(amtInWords);
    }
    return amtInWords;
  }

  getFormattedGrantAmount(amount: number):string{
    return inf.format(amount,2);
  }

  getGrantDisbursementAttribute():Attribute{
    for(let section of this.currentDisbursement.grant.grantDetails.sections){
        if(section.attributes){
            for(let attr of section.attributes){
                if(attr.fieldType==='disbursement'){
                    return attr;
                }
            }
        }
    }
    return null;
  }

  getTotals():string{
   
    let total=0;
    for(let ad of this.currentDisbursement.actualDisbursements){
      total += ad.actualAmount===undefined?0:Number(ad.actualAmount);
    }

    if(total===0){
      return '₹';
    }

    return this.currencyService.getFormattedAmount(total);
  }

  getFormattedCurrency(amount: string):string{
    if(!amount || amount===''){
        return inf.format(Number("0"),2);
    }
    return inf.format(Number(amount),2);
  }

  
  saveAs(filename){
    this.pdf.saveAs(filename);
  }

  showHistory(type,obj){
    this.adminComp.showHistory(type,obj);
  }

  showWorkflowAssigments(){
    this.adminComp.showWorkflowAssigments();
  }

  showWorkflowAssigmentAndSubmit(toState:number){
    this.workflowDataService.getDisbursementWorkflowStatuses(this.currentDisbursement)
        .then( workflowStatuses => {
            const wfModel = new DisbursementWorkflowAssignmentModel();
            wfModel.users = this.appComponent.tenantUsers;
            wfModel.workflowStatuses = workflowStatuses;
            wfModel.workflowAssignments = this.currentDisbursement.assignments;
            wfModel.type=this.appComponent.currentView;
            wfModel.disbursement = this.currentDisbursement;
            wfModel.canManage = this.currentDisbursement.canManage;
            const dialogRef = this.dialog.open(WfassignmentComponent, {
                data: {model:wfModel,userId: this.appComponent.loggedInUser.id},
                panelClass: 'wf-assignment-class'
            });
    
            dialogRef.afterClosed().subscribe(result => {
                if (result.result) {
                    const ass:DisbursementWorkflowAssignment[] = [];
                    for(let data of result.data){
                        const wa = new DisbursementWorkflowAssignment();
                        wa.id=data.id;
                        wa.stateId = data.stateId;
                        wa.assignmentId = data.userId;
                        wa.disbursementId = data.disbursementId;
                        wa.customAssignments = data.customAssignments;
                        ass.push(wa);
                    }
    
                    this.disbursementService.saveAssignments(this.currentDisbursement,ass)
                    .then(disbursement =>{
                        this.disbursementService.changeMessage(disbursement);
                        this.currentDisbursement = disbursement;
                        this.submitDisbursement(toState);
                    });
                } else {
                    dialogRef.close();
                }
            });
        });
  }

  submitDisbursement(toState:number){

    this.workflowDataService.getDisbursementWorkflowStatuses(this.currentDisbursement)
    .then(workflowStatuses => {
      this.appComponent.disbursementWorkflowStatuses = workflowStatuses;
      if((this.workflowValidationService.getStatusByStatusIdForDisbursement(toState, this.appComponent).internalStatus==='ACTIVE' || this.workflowValidationService.getStatusByStatusIdForDisbursement(toState, this.appComponent).internalStatus==='CLOSED') && this.disbursementService.checkIfHeaderHasMissingEntries(this.currentDisbursement)){
        const dialogRef = this.dialog.open(MessagingComponent,{
          data: "Approval Request has missing header information.",
          panelClass: 'center-class'
        });
        return;
      }

      for(let assignment of this.currentDisbursement.assignments){
        const status1 = this.appComponent.disbursementWorkflowStatuses.filter((status) => status.id===assignment.stateId);
        if(assignment.owner === null || assignment.owner === undefined || assignment.owner === 0 && !status1[0].terminal){
            const dialogRef = this.dialog.open(FieldDialogComponent, {
                data: {title:"Would you like to carry out workflow assignments?"},
                panelClass: 'center-class'
            });
            dialogRef.afterClosed().subscribe(result => {
                if(result){
                    this.showWorkflowAssigmentAndSubmit(toState);
                }
            });
            return;
        }
    }

    this.openBottomSheetForReportNotes(toState);
        this.wfDisabled = true;
        return;
    });
      

      
  }

  openBottomSheetForReportNotes(toStateId: number): void {

    const _bSheet = this.dialog.open(DisbursementNotesComponent, {
      hasBackdrop: false,
      data: {canManage:true,currentDisbursement: this.currentDisbursement, originalDisbursement: this.originalDisbursement},
      panelClass: 'grant-notes-class'
    });

    _bSheet.afterClosed().subscribe(result => {
      if(result.result){
        this.submitAndSaveDisbursement(toStateId,result.message);
      }else{
        this.wfDisabled = false;
      }
    });
  }

  submitAndSaveDisbursement(toStateId: number,message:string){

    this.disbursementService.submitDisbursement(this.currentDisbursement,message,this.currentDisbursement.status.id,toStateId)
    .then( d => {
      this.disbursementService.changeMessage(d);
        this.wfDisabled = false;
            if(d.status.internalStatus==='DRAFT' || d.status.internalStatus==='REVIEW'){
                this.appComponent.subMenu = {name:'Approvals In-progress',action:'di'};
            } else if(d.status.internalStatus==='ACTIVE'){
                this.appComponent.subMenu = {name:'Approvals Active',action:'ad'};
            } else if(d.status.internalStatus==='CLOSED'){
                this.appComponent.subMenu = {name:'Approvals Closed',action:'cd'};
            }
    });

  }

  manageGrant(){
    this.adminComp.manageGrant(null, this.currentDisbursement.grant.id);
  }

  openDate(actual:ActualDisbursement,ev:MouseEvent){
    const stDateElem = this.datePicker;
    this.selectedDateField = ev;
    this.selectedField = actual;
    if(!stDateElem.opened){
        stDateElem.open();
    } else{
        stDateElem.close();
    }
  }

  setDate(ev: MatDatepickerInputEvent<any>){
    const trgt = ev.target;
    this.selectedDateField.target.value = this.datepipe.transform(trgt.value, 'dd-MMM-yyyy');
    this.selectedField = this.selectedDateField.target.value;
 }

 showAmountInput(evt: any){
  evt.currentTarget.style.visibility='hidden';
  const id = evt.target.attributes.id.value.replace('label_','');
  const inputElem = this.tablePlaceholder.nativeElement.querySelectorAll('#date_'+id);
  inputElem[0].style.visibility='visible';
}

  showFormattedAmount(evt:any){
    evt.currentTarget.style.visibility='hidden';
    const id = evt.target.attributes.id.value.replace('date_','');
    const inputElem = this.tablePlaceholder.nativeElement.querySelectorAll('#label_'+id);
    inputElem[0].style.visibility='visible';
  }

  addDisbursementRow(){
    this.disbursementService.addNewDisbursementRow(this.currentDisbursement)
    .then((ad:ActualDisbursement) => {
      this.currentDisbursement.actualDisbursements.push(ad);
    });
  }

  deleteDisbursementRow(actual:ActualDisbursement,index:number){
    this.currentDisbursement.actualDisbursements.splice(index,1);
  }
}
