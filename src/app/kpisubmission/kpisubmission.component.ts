import {Component, OnInit} from '@angular/core';
import {GrantDataService} from '../grant.data.service';
import {Grant, Submission, Tenants} from '../model/dahsboard';
import {Router} from '@angular/router';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ElementRef} from '@angular/core';
import {KpiSubmissionData} from '../model/KpiSubmissionData';
import {SubmissionDataService} from '../submission.data.service';
import {Action} from '../model/action';
import {AppComponent} from '../app.component';

declare var $: any;

@Component({
  selector: 'app-kpisubmission',
  templateUrl: './kpisubmission.component.html',
  styleUrls: ['./kpisubmission.component.scss']
})

export class KpisubmissionComponent implements OnInit {
  currentSubmission: Submission;
  quantitativeKpisToSubmit: Array<any> = [];
  qualitativeKpisToSubmit: Array<any> = [];
  documentKpisToSubmit: Array<any> = [];
  actions: Array<Action> = [];
  noteId: string;


  constructor(private http: HttpClient,
              private submissionDataService: SubmissionDataService,
              private grantDataService: GrantDataService,
              private router: Router,
              private elem: ElementRef,
              private appComp: AppComponent) {
  }

  ngOnInit(): void {
    this.submissionDataService.currentMessage.subscribe(submission => this.currentSubmission = submission);


    if (this.currentSubmission.flowAuthorities) {
      for (const fa of this.currentSubmission.flowAuthorities) {
        if (!this._contains(this.actions, fa.action)) {
          const a = new Action();
          a.toStateId = fa.toStateId;
          a.name = fa.action;
          if (!this.actions.some(e => e.name === a.name)) {
            this.actions.push(a);
          }
        }
      }

      for (const quantKpi of this.currentSubmission.quantitiaveKpisubmissions) {
        const kpiData = {
          'kpiDataId': quantKpi.id,
          'kpiType': quantKpi.grantKpi.kpiType,
          'kpiDataTitle': quantKpi.grantKpi.title,
          'kpiDataGoal': quantKpi.goal,
          'kpiDataActuals': quantKpi.actuals,
          'kpiDataNote': quantKpi.note
        }
        this.quantitativeKpisToSubmit.push(kpiData);
      }

      for (const qualKpi of this.currentSubmission.qualitativeKpiSubmissions) {
        const kpiData = {
          'kpiDataId': qualKpi.id,
          'kpiType': qualKpi.grantKpi.kpiType,
          'kpiDataTitle': qualKpi.grantKpi.title,
          'kpiDataGoal': qualKpi.goal,
          'kpiDataActuals': qualKpi.actuals,
          'kpiDataNote': qualKpi.note
        }
        this.qualitativeKpisToSubmit.push(kpiData);
      }

      for (const docKpi of this.currentSubmission.documentKpiSubmissions) {
        const kpiData = {
          'kpiDataId': docKpi.id,
          'kpiDataGrantKpiId': docKpi.grantKpi.id,
          'kpiType': docKpi.grantKpi.kpiType,
          'kpiDataTitle': docKpi.grantKpi.title,
          'kpiDataGoal': docKpi.goal,
          'kpiDataActuals': docKpi.actuals,
          'kpiDocType': docKpi.type,
          'kpiDataNote': docKpi.note
        }
        this.documentKpisToSubmit.push(kpiData);
      }
    }

    $('#notesModal').on('show.bs.modal', function (event) {
      const triggerElem = $(event.relatedTarget);
      const noteId = triggerElem.data('whatever');
      const noteValHolderElem = $('#note_' + noteId);
      const modal = $(this);
      console.log('>>>>>>' + noteValHolderElem);
      modal.find('#message-text').val(noteValHolderElem.val());
      modal.find('#noteId').val(noteId)
    })
  }

  submitKpis(toStateId: number) {
    const user = JSON.parse(localStorage.getItem('USER'));
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };


    const elements = this.elem.nativeElement.querySelectorAll('[id^="data_id_"]');
    const submissionData: Array<KpiSubmissionData> = [];
    for (const e of elements) {
      const idComponents = e.id.split('_');
      const data = new KpiSubmissionData();
      data.submissionId = Number(idComponents[2]);
      data.type = idComponents[3];
      data.kpiDataId = Number(idComponents[4]);

      const noteElemId = e.id.replace('data_id', '#note');
      const noteElem = this.elem.nativeElement.querySelector(noteElemId);
      data.note = noteElem.value;

      if (idComponents[3] === 'DOCUMENT') {
        const docElemId = e.id.replace('data_id', '#doc_id');
        const docElem = this.elem.nativeElement.querySelector(docElemId);
        const fileElemId = e.id.replace('data_id', '#file_id');
        const fileElem = this.elem.nativeElement.querySelector(fileElemId);
        data.value = docElem.value.substr(docElem.value.indexOf(',') + 1);
        data.fileName = fileElem.value;
        data.fileType = fileElem.value.substr(fileElem.value.lastIndexOf('.') + 1);
      } else {
        data.value = e.value;
      }

      data.toStatusId = Number(toStateId);
      submissionData.push(data);
    }


    const url = '/api/user/' + user.id + '/grant/kpi';
    this.http.put(url, submissionData, httpOptions).subscribe((grant: Grant) => {
      this.grantDataService.changeMessage(grant);
      this.router.navigate(['grant']);
    });
  }

  docChangeListener($event): void {
    this.readThis($event.target);
  }

  readThis(inputValue: any): void {
    const file: File = inputValue.files[0];
    const myReader: FileReader = new FileReader();
    const docElemId = inputValue.id.replace('data_id', '#doc_id');
    const fileElemId = inputValue.id.replace('data_id', '#file_id');
    const docTitleElemId = inputValue.id.replace('data_id', '#doc_title');
    myReader.onloadend = (e) => {
      const docElem = this.elem.nativeElement.querySelector(docElemId);
      const fileElem = this.elem.nativeElement.querySelector(fileElemId);
      fileElem.value = file.name;
      docElem.value = myReader.result.toString();
      $(docTitleElemId).html($(docTitleElemId).html() + ' [' + file.name + ']');
    };


    myReader.readAsDataURL(file);
  }

  saveNote() {
    const idHolder = this.elem.nativeElement.querySelector('#noteId');
    const messageElem = this.elem.nativeElement.querySelector('#message-text');
    const noteValHolder = this.elem.nativeElement.querySelector('#note_' + idHolder.value);
    noteValHolder.value = messageElem.value;
    const iconElem = this.elem.nativeElement.querySelector('#icon_' + idHolder.value);
    if (messageElem.value.trim().length > 0) {
      iconElem.classList.add('text-primary');
    } else {
      iconElem.classList.remove('text-primary');
    }
    $('#notesModal').modal('hide');
  }

  private _contains(a, obj) {
    for (let i = 0; i < a.length; i++) {
      if (a[i].action === obj) {
        return true;
      }
    }
    return false;
  }
}

