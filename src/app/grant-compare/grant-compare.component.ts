import { DatePipe } from '@angular/common';
import { ClosureDiff } from './../model/closures';
import { DisbursementDiff } from './../model/disbursement';
import { ReportDiff } from './../model/report';
import { CurrencyService } from './../currency-service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GrantDiff, SectionDiff, AttributeDiff } from './../model/dahsboard';
import { Component, Input, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import * as inf from 'indian-number-format';
import * as difference from 'simple-text-diff';

@Component({
  selector: 'app-grant-compare',
  templateUrl: './grant-compare.component.html',
  styleUrls: ['./grant-compare.component.scss'],
  styles: [`
    ::ng-deep .wf-assignment-class .mat-dialog-container{
      overflow: scroll !important;
    height: calc(100vh - 114px) !important;
    padding-top: 10px !important;
    }
  `]
})
export class GrantCompareComponent implements OnInit {

  @Input("newItem") newItem: any;
  @Input("oldItem") oldItem: any;
  @Input("standAlone") isStandAlone: boolean = true;
  @Input("title") title: string = "Grants Comparision";
  @Input("compare1Title") compare1: string = "Current Grant";
  @Input("compare2Title") compare2: string = "Compared with Grant";
  @Input("for") _for = "Grant";
  @Input("compareType") _compareType = "weak";
  @Output() hasChanges = new EventEmitter();
  changes: any[] = [];
  grantDiff: GrantDiff;
  reportDiff: ReportDiff;
  closureDiff: ClosureDiff;
  disbursementDiff: DisbursementDiff;

  constructor(public dialogRef: MatDialogRef<GrantCompareComponent>
    , @Inject(MAT_DIALOG_DATA) public itemsCompare: any, public currencyService: CurrencyService, private datePipe: DatePipe) {
    dialogRef.disableClose = true;

    if (itemsCompare.checkType) {
      this._compareType = itemsCompare.checkType;
    }
    if (itemsCompare.compareItems && itemsCompare.compareItems.length === 2) {
      this.newItem = itemsCompare.compareItems[0];
      this.oldItem = itemsCompare.compareItems[1];
    }

  }

  ngOnInit() {
    this.getTheDifference('a', 'b');

    if (this._for === 'Grant' && this._compareType === 'weak') {
      this._diffWeak(this.newItem, this.oldItem);
    } else if (this._for === 'Grant' && this._compareType === 'strong') {
      this._diffStrong(this.newItem, this.oldItem);
    } else if (this._for === 'Report') {
      this._reportDiff(this.newItem, this.oldItem);
    } else if (this._for === 'Closure') {
      this._closureDiff(this.newItem, this.oldItem);
    } else if (this._for === 'Disbursement') {
      this._disbursementDiff(this.newItem, this.oldItem);
    }
  }

  _diffWeak(newGrant: any, oldGrant: any): any[] {
    const resultHeader = [];
    const resultSections = [];

    if (oldGrant.name !== newGrant.name) {
      this._getGrantDiff();
      resultHeader.push({ 'order': 1, 'category': 'Grant Header', 'name': 'Grant Name changed', 'change': [{ 'old': oldGrant.name, 'new': newGrant.name }] });
      this.grantDiff.oldGrantName = oldGrant.name;
      this.grantDiff.newGrantName = newGrant.name;
    }
    if (oldGrant.startDate !== newGrant.startDate) {
      this._getGrantDiff();
      this.grantDiff.oldGrantStartDate = oldGrant.startDate;
      this.grantDiff.newGrantStartDate = newGrant.startDate;
    }
    if (oldGrant.endDate !== newGrant.endDate) {
      this._getGrantDiff();
      this.grantDiff.oldGrantEndDate = oldGrant.endDate;
      this.grantDiff.newGrantEndDate = newGrant.endDate;
    }
    if (oldGrant.amount !== newGrant.amount) {
      this._getGrantDiff();
      this.grantDiff.oldGrantAmount = oldGrant.amount;
      this.grantDiff.newGrantAmount = newGrant.amount;
    }
    if (oldGrant.implementingOrganizationName && newGrant.implementingOrganizationName) {
      if (oldGrant.implementingOrganizationName !== newGrant.implementingOrganizationName) {
        this._getGrantDiff();
        this.grantDiff.oldGrantee = oldGrant.implementingOrganizationName;
        this.grantDiff.newGrantee = newGrant.implementingOrganizationName;
      }
    } else if (oldGrant.implementingOrganizationName === '' && newGrant.implementingOrganizationName != '') {
      this._getGrantDiff();
      this.grantDiff.newGrantee = newGrant.implementingOrganizationName;
    } else if (oldGrant.implementingOrganizationName != '' && newGrant.implementingOrganizationName === '') {
      this._getGrantDiff();
      this.grantDiff.oldGrantee = oldGrant.implementingOrganizationName;
    }
    if (oldGrant.implementingOrganizationRepresentative !== newGrant.implementingOrganizationRepresentative) {
      this._getGrantDiff();
      this.grantDiff.oldRep = oldGrant.implementingOrganizationRepresentative;
      this.grantDiff.newRep = newGrant.implementingOrganizationRepresentative;
    }


    for (const section of newGrant.sections) {
      const oldSection = oldGrant.sections.filter((sec) => sec.name === section.name)[0];
      if (oldSection) {

        if (section.attributes) {
          for (let attr of section.attributes) {
            let oldAttr = null;
            if (oldSection.attributes) {
              oldAttr = oldSection.attributes.filter((a) => a.name === attr.name)[0];
            }
            if (oldAttr) {
              if (oldAttr.name !== attr.name) {
                this._getGrantDiffSections();
                this.saveDifferences(oldSection, oldAttr, section, attr);

              }
              else if (oldAttr.type !== attr.type) {
                this._getGrantDiffSections();
                this.saveDifferences(oldSection, oldAttr, section, attr);

              } else if (oldAttr.type === attr.type && oldAttr.type === 'multiline' && oldAttr.value !== attr.value) {
                this._getGrantDiffSections();
                this.saveDifferences(oldSection, oldAttr, section, attr);
              } else if (oldAttr.type === attr.type && oldAttr.type === 'kpi') {
                const ot = (oldAttr.target === undefined || oldAttr.target === null) ? null : oldAttr.target;
                const nt = (attr.target === undefined || attr.target === null) ? null : attr.target;
                const of = (oldAttr.frequency === undefined || oldAttr.frequency === null) ? null : oldAttr.frequency;
                const nf = (attr.frequency === undefined || attr.frequency === null) ? null : attr.frequency;
                if (ot !== nt) {
                  this._getGrantDiffSections();
                  this.saveDifferences(oldSection, oldAttr, section, attr);
                } else if (of !== nf) {
                  this._getGrantDiffSections();
                  this.saveDifferences(oldSection, oldAttr, section, attr);
                }


              } else if (oldAttr.type === attr.type && oldAttr.type === 'table') {
                let hasTableDifferences = false;
                if (oldAttr.tableValue.length !== attr.tableValue.length) {
                  this._getGrantDiffSections();
                  this.saveDifferences(oldSection, oldAttr, section, attr);
                } else {
                  for (let i = 0; i < oldAttr.tableValue.length; i++) {
                    if (oldAttr.tableValue[i].header !== attr.tableValue[i].header || oldAttr.tableValue[i].name !== attr.tableValue[i].name || oldAttr.tableValue[i].columns.length !== attr.tableValue[i].columns.length) {
                      this._getGrantDiffSections();
                      this.saveDifferences(oldSection, oldAttr, section, attr);
                      hasTableDifferences = true;
                      break;
                    } else {
                      for (let j = 0; j < oldAttr.tableValue[i].columns.length; j++) {
                        if (oldAttr.tableValue[i].columns[j].name !== attr.tableValue[i].columns[j].name || oldAttr.tableValue[i].columns[j].value !== attr.tableValue[i].columns[j].value) {
                          this._getGrantDiffSections();
                          this.saveDifferences(oldSection, oldAttr, section, attr);
                          hasTableDifferences = true;
                          break;
                        }
                      }
                      if (hasTableDifferences) {
                        break;
                      }
                    }
                  }
                }

              } else if (oldAttr.type === attr.type && oldAttr.type === 'document') {
                if (oldAttr.attachments && attr.attachments && oldAttr.attachments.length !== attr.attachments.length) {
                  this._getGrantDiffSections();
                  this.saveDifferences(oldSection, oldAttr, section, attr);
                } else if (oldAttr.attachments && attr.attachments && oldAttr.attachments.length === attr.attachments.length) {
                  for (let i = 0; i < oldAttr.attachments.length; i++) {
                    if (oldAttr.attachments[i].name !== attr.attachments[i].name || oldAttr.attachments[i].type !== attr.attachments[i].type) {
                      this._getGrantDiffSections();
                      this.saveDifferences(oldSection, oldAttr, section, attr);
                      break;
                    }
                  }
                }

              } else if (oldAttr.type === attr.type && oldAttr.type === 'disbursement') {

                let hasDifferences = false;

                if (oldAttr.tableValue.length !== attr.tableValue.length) {
                  hasDifferences = true;
                } else {
                  for (let i = 0; i < oldAttr.tableValue.length; i++) {

                    if (oldAttr.tableValue[i].columns.length !== attr.tableValue[i].columns.length) {
                      hasDifferences = true;
                    } else {
                      for (let j = 0; j < oldAttr.tableValue[i].columns.length; j++) {
                        if (oldAttr.tableValue[i].columns[j].name !== attr.tableValue[i].columns[j].name) {
                          hasDifferences = true;
                        }
                        if (((!oldAttr.tableValue[i].columns[j].value || oldAttr.tableValue[i].columns[j].value === null) ? "" : oldAttr.tableValue[i].columns[j].value) !== ((!attr.tableValue[i].columns[j].value || attr.tableValue[i].columns[j].value === null || attr.tableValue[i].columns[j].value === "0") ? "" : attr.tableValue[i].columns[j].value)) {
                          hasDifferences = true;
                        }
                      }
                    }
                  }
                }

                if (hasDifferences) {
                  this._getGrantDiffSections();
                  this.saveDifferences(oldSection, oldAttr, section, attr);
                }

              }

            } else if (!oldAttr) {
              this._getGrantDiffSections();
              const attrDiff = new AttributeDiff();
              attrDiff.section = section.name;
              attrDiff.newAttribute = attr;
              const sectionDiff = new SectionDiff();
              sectionDiff.oldSection = oldSection;
              sectionDiff.newSection = section;
              sectionDiff.attributesDiffs = [];
              sectionDiff.order = section.order
              sectionDiff.attributesDiffs.push(attrDiff);
              this.grantDiff.sectionDiffs.push(sectionDiff);
            }
          }



          if (oldSection.attributes) {
            for (let attr of oldSection.attributes) {
              let oldAttr = null;

              oldAttr = section.attributes.filter((a) => a.name === attr.name)[0];
              if (!oldAttr) {
                this._getGrantDiffSections();
                const attrDiff = new AttributeDiff();
                attrDiff.section = section.name;
                attrDiff.oldAttribute = attr;
                attrDiff.newAttribute = null;
                const sectionDiff = new SectionDiff();
                sectionDiff.oldSection = oldSection;
                sectionDiff.newSection = section;
                sectionDiff.order = section.order
                sectionDiff.attributesDiffs = [];
                sectionDiff.attributesDiffs.push(attrDiff);
                this.grantDiff.sectionDiffs.push(sectionDiff);
              }
            }
          }
        }
        if (oldSection.name !== section.name) {
          this._getGrantDiffSections();
          let secDiff = new SectionDiff();
          secDiff.oldSection = oldSection;
          secDiff.newSection = section;
          secDiff.order = section.order
          secDiff.hasSectionLevelChanges = true;
          this.grantDiff.sectionDiffs.push(secDiff);
        }


        let hasDifferences = false;
        if (section.attributes) {
          for (let i = 0; i < section.attributes.length; i++) {
            if (oldSection.attributes.findIndex(f => f.name === section.attributes[i].name) !== i) {
              hasDifferences = true;
              break;
            }
          }
        }

        let attrDiff = [];
        if (hasDifferences) {
          for (let a of section.attributes) {
            //this._getGrantSectionAttributeOrderDiffs();
            attrDiff.push({ name: a.name, type: 'new', order: a.order });
          }

        }

        if (attrDiff.length > 0) {
          for (let oldattr of oldSection.attributes) {
            attrDiff.push({ name: oldattr.name, type: 'old', order: oldattr.order });
          }
          this._getGrantDiffSections();
          let secDiff = new SectionDiff();
          secDiff.oldSection = oldSection;
          secDiff.newSection = section;
          secDiff.order = section.order
          secDiff.hasSectionLevelChanges = true;
          secDiff.attributeOrderDiffs.push(attrDiff);
          this.grantDiff.sectionDiffs.push(secDiff);
        }
      } else {
        this._getGrantDiffSections();
        let secDiff = new SectionDiff();
        secDiff.oldSection = null;
        secDiff.newSection = section;
        secDiff.order = section.order;
        secDiff.hasSectionLevelChanges = true;
        this.grantDiff.sectionDiffs.push(secDiff);
      }
    }

    for (const section of oldGrant.sections) {
      const currentSection = newGrant.sections.filter((sec) => sec.name === section.name)[0];
      if (!currentSection) {
        this._getGrantDiffSections();
        let secDiff = new SectionDiff();
        secDiff.oldSection = section;
        secDiff.newSection = null;
        secDiff.order = section.order;
        secDiff.hasSectionLevelChanges = true
        this.grantDiff.sectionDiffs.push(secDiff);
      }
    }

    let hasSectionDifferences = false;
    if (newGrant.sections) {
      for (let i = 0; i < newGrant.sections.length; i++) {
        if (oldGrant.sections.findIndex(f => f.name === newGrant.sections[i].name) !== i) {
          hasSectionDifferences = true;
          break;
        }
      }
    }

    let secDiff = [];
    if (hasSectionDifferences) {
      for (let a of newGrant.sections) {
        this._getGrantSectionOrderDiffs();

        this.grantDiff.orderDiffs.push({ name: a.name, type: 'new', order: a.order })
      }

    }

    if (this.grantDiff.orderDiffs && this.grantDiff.orderDiffs.length > 0) {
      for (let oldSec of oldGrant.sections) {
        this.grantDiff.orderDiffs.push({ name: oldSec.name, type: 'old', order: oldSec.order })
      }

    }

    this.changes.push(resultHeader);
    this.changes.push(resultSections);
    if (this.grantDiff && this.grantDiff.sectionDiffs) {
      this.grantDiff.sectionDiffs.sort((a, b) => a.order >= b.order ? 1 : -1);
    }
    if (this.grantDiff) {
      this.hasChanges.emit(true);
    } else {
      this.hasChanges.emit(false);
    }
    return this.changes;
  }

  _diffStrong(newGrant: any, oldGrant: any): any[] {
    const resultHeader = [];
    const resultSections = [];

    if (oldGrant.name !== newGrant.name) {
      this._getGrantDiff();
      resultHeader.push({ 'order': 1, 'category': 'Grant Header', 'name': 'Grant Name changed', 'change': [{ 'old': oldGrant.name, 'new': newGrant.name }] });
      this.grantDiff.oldGrantName = oldGrant.name;
      this.grantDiff.newGrantName = newGrant.name;
    }
    if (oldGrant.startDate !== newGrant.startDate) {
      this._getGrantDiff();
      this.grantDiff.oldGrantStartDate = oldGrant.startDate;
      this.grantDiff.newGrantStartDate = newGrant.startDate;
    }
    if (oldGrant.endDate !== newGrant.endDate) {
      this._getGrantDiff();
      this.grantDiff.oldGrantEndDate = oldGrant.endDate;
      this.grantDiff.newGrantEndDate = newGrant.endDate;
    }
    if (oldGrant.amount !== newGrant.amount) {
      this._getGrantDiff();
      this.grantDiff.oldGrantAmount = oldGrant.amount;
      this.grantDiff.newGrantAmount = newGrant.amount;
    }
    if (oldGrant.implementingOrganizationName && newGrant.implementingOrganizationName) {
      if (oldGrant.implementingOrganizationName !== newGrant.implementingOrganizationName) {
        this._getGrantDiff();
        this.grantDiff.oldGrantee = oldGrant.implementingOrganizationName;
        this.grantDiff.newGrantee = newGrant.implementingOrganizationName;
      }
    } else if (oldGrant.implementingOrganizationName === '' && newGrant.implementingOrganizationName != '') {
      this._getGrantDiff();
      this.grantDiff.newGrantee = newGrant.implementingOrganizationName;
    } else if (oldGrant.implementingOrganizationName != '' && newGrant.implementingOrganizationName === '') {
      this._getGrantDiff();
      this.grantDiff.oldGrantee = oldGrant.implementingOrganizationName;
    }
    if (oldGrant.implementingOrganizationRepresentative !== newGrant.implementingOrganizationRepresentative) {
      this._getGrantDiff();
      this.grantDiff.oldRep = oldGrant.implementingOrganizationRepresentative;
      this.grantDiff.newRep = newGrant.implementingOrganizationRepresentative;
    }


    for (const section of newGrant.sections) {
      const oldSection = oldGrant.sections.filter((sec) => sec.id === section.id)[0];
      if (oldSection) {

        if (section.attributes) {
          for (let attr of section.attributes) {
            let oldAttr = null;
            if (oldSection.attributes) {
              oldAttr = oldSection.attributes.filter((a) => a.id === attr.id)[0];
            }
            if (oldAttr) {
              if (oldAttr.name !== attr.name) {
                this._getGrantDiffSections();
                this.saveDifferences(oldSection, oldAttr, section, attr);

              }
              else if (oldAttr.type !== attr.type) {
                this._getGrantDiffSections();
                this.saveDifferences(oldSection, oldAttr, section, attr);

              } else
                if (oldAttr.type === attr.type && oldAttr.type === 'multiline' && oldAttr.value !== attr.value) {
                  this._getGrantDiffSections();
                  this.saveDifferences(oldSection, oldAttr, section, attr);
                } else

                  if (oldAttr.type === attr.type && oldAttr.type === 'kpi') {
                    const ot = (oldAttr.target === undefined || oldAttr.target === null) ? null : oldAttr.target;
                    const nt = (attr.target === undefined || attr.target === null) ? null : attr.target;
                    const of = (oldAttr.frequency === undefined || oldAttr.frequency === null) ? null : oldAttr.frequency;
                    const nf = (attr.frequency === undefined || attr.frequency === null) ? null : attr.frequency;
                    if (ot !== nt) {
                      this._getGrantDiffSections();
                      this.saveDifferences(oldSection, oldAttr, section, attr);
                    } else if (of !== nf) {
                      this._getGrantDiffSections();
                      this.saveDifferences(oldSection, oldAttr, section, attr);
                    }


                  } else
                    if (oldAttr.type === attr.type && oldAttr.type === 'table') {
                      let hasTableDifferences = false;
                      if (oldAttr.tableValue.length !== attr.tableValue.length) {
                        this._getGrantDiffSections();
                        this.saveDifferences(oldSection, oldAttr, section, attr);
                      } else {
                        for (let i = 0; i < oldAttr.tableValue.length; i++) {
                          if (oldAttr.tableValue[i].header !== attr.tableValue[i].header || oldAttr.tableValue[i].name !== attr.tableValue[i].name || oldAttr.tableValue[i].columns.length !== attr.tableValue[i].columns.length) {
                            this._getGrantDiffSections();
                            this.saveDifferences(oldSection, oldAttr, section, attr);
                            hasTableDifferences = true;
                            break;
                          } else {
                            for (let j = 0; j < oldAttr.tableValue[i].columns.length; j++) {
                              if (oldAttr.tableValue[i].columns[j].name !== attr.tableValue[i].columns[j].name || oldAttr.tableValue[i].columns[j].value !== attr.tableValue[i].columns[j].value) {
                                this._getGrantDiffSections();
                                this.saveDifferences(oldSection, oldAttr, section, attr);
                                hasTableDifferences = true;
                                break;
                              }
                            }
                            if (hasTableDifferences) {
                              break;
                            }
                          }
                        }
                      }

                    } else
                      if (oldAttr.type === attr.type && oldAttr.type === 'document') {
                        if (oldAttr.attachments && attr.attachments && oldAttr.attachments.length !== attr.attachments.length) {
                          this._getGrantDiffSections();
                          this.saveDifferences(oldSection, oldAttr, section, attr);
                        } else if (oldAttr.attachments && attr.attachments && oldAttr.attachments.length === attr.attachments.length) {
                          for (let i = 0; i < oldAttr.attachments.length; i++) {
                            if (oldAttr.attachments[i].name !== attr.attachments[i].name || oldAttr.attachments[i].type !== attr.attachments[i].type) {
                              this._getGrantDiffSections();
                              this.saveDifferences(oldSection, oldAttr, section, attr);
                              break;
                            }
                          }
                        }

                      } else
                        if (oldAttr.type === attr.type && oldAttr.type === 'disbursement') {

                          let hasDifferences = false;

                          if (oldAttr.tableValue.length !== attr.tableValue.length) {
                            hasDifferences = true;
                          } else {
                            for (let i = 0; i < oldAttr.tableValue.length; i++) {

                              if (oldAttr.tableValue[i].columns.length !== attr.tableValue[i].columns.length) {
                                hasDifferences = true;
                              } else {
                                for (let j = 0; j < oldAttr.tableValue[i].columns.length; j++) {
                                  if (oldAttr.tableValue[i].columns[j].name !== attr.tableValue[i].columns[j].name) {
                                    hasDifferences = true;
                                  }
                                  if (((!oldAttr.tableValue[i].columns[j].value || oldAttr.tableValue[i].columns[j].value === null) ? "" : oldAttr.tableValue[i].columns[j].value === "0" ? "" : oldAttr.tableValue[i].columns[j].value) !== ((!attr.tableValue[i].columns[j].value || attr.tableValue[i].columns[j].value === null || attr.tableValue[i].columns[j].value === "0") ? "" : attr.tableValue[i].columns[j].value === "0" ? "" : attr.tableValue[i].columns[j].value)) {
                                    hasDifferences = true;
                                  }
                                }
                              }
                            }
                          }

                          if (hasDifferences) {
                            this._getGrantDiffSections();
                            this.saveDifferences(oldSection, oldAttr, section, attr);
                          }

                        }

            } else if (!oldAttr) {
              this._getGrantDiffSections();
              const attrDiff = new AttributeDiff();
              attrDiff.section = section.name;
              attrDiff.newAttribute = attr;
              const sectionDiff = new SectionDiff();
              sectionDiff.oldSection = oldSection;
              sectionDiff.newSection = section;
              sectionDiff.attributesDiffs = [];
              sectionDiff.order = section.order
              sectionDiff.attributesDiffs.push(attrDiff);
              this.grantDiff.sectionDiffs.push(sectionDiff);
            }
          }



          if (oldSection.attributes) {
            for (let attr of oldSection.attributes) {
              let oldAttr = null;

              oldAttr = section.attributes.filter((a) => a.id === attr.id)[0];
              if (!oldAttr) {
                this._getGrantDiffSections();
                const attrDiff = new AttributeDiff();
                attrDiff.section = section.name;
                attrDiff.oldAttribute = attr;
                attrDiff.newAttribute = null;
                const sectionDiff = new SectionDiff();
                sectionDiff.oldSection = oldSection;
                sectionDiff.newSection = section;
                sectionDiff.order = section.order
                sectionDiff.attributesDiffs = [];
                sectionDiff.attributesDiffs.push(attrDiff);
                this.grantDiff.sectionDiffs.push(sectionDiff);
              }
            }
          }
        }
        if (oldSection.name !== section.name) {
          this._getGrantDiffSections();
          let secDiff = new SectionDiff();
          secDiff.oldSection = oldSection;
          secDiff.newSection = section;
          secDiff.order = section.order
          secDiff.hasSectionLevelChanges = true;
          this.grantDiff.sectionDiffs.push(secDiff);
        }



        let hasDifferences = false;
        if (section.attributes) {
          for (let i = 0; i < section.attributes.length; i++) {
            const idx = oldSection.attributes.findIndex(f => f.id === section.attributes[i].id);
            if (idx !== -1 && idx !== i) {
              hasDifferences = true;
              break;
            }
          }
        }

        let attrDiff = [];
        if (hasDifferences) {
          for (let a of section.attributes) {
            attrDiff.push({ name: a.name, type: 'new', order: a.order });
          }

        }

        if (attrDiff.length > 0) {
          for (let oldattr of oldSection.attributes) {
            attrDiff.push({ name: oldattr.name, type: 'old', order: oldattr.order });
          }
          this._getGrantDiffSections();
          let secDiff = new SectionDiff();
          secDiff.oldSection = oldSection;
          secDiff.newSection = section;
          secDiff.order = section.order
          secDiff.hasSectionLevelChanges = true;

          secDiff.attributeOrderDiffs.push(attrDiff);
          this.grantDiff.sectionDiffs.push(secDiff);
        }
      } else {
        this._getGrantDiffSections();
        let secDiff = new SectionDiff();
        secDiff.oldSection = null;
        secDiff.newSection = section;
        secDiff.order = section.order;
        secDiff.hasSectionLevelChanges = true;
        this.grantDiff.sectionDiffs.push(secDiff);
      }
    }

    for (const section of oldGrant.sections) {
      const currentSection = newGrant.sections.filter((sec) => sec.id === section.id)[0];
      if (!currentSection) {
        this._getGrantDiffSections();
        let secDiff = new SectionDiff();
        secDiff.oldSection = section;
        secDiff.newSection = null;
        secDiff.order = section.order;
        secDiff.hasSectionLevelChanges = true
        this.grantDiff.sectionDiffs.push(secDiff);
      }
    }

    let hasSectionDifferences = false;
    if (newGrant.sections) {
      for (let i = 0; i < newGrant.sections.length; i++) {
        const idx = oldGrant.sections.findIndex(f => f.id === newGrant.sections[i].id);
        if (idx !== -1 && idx !== i) {
          hasSectionDifferences = true;
          break;
        }
      }
    }

    let secDiff = [];
    if (hasSectionDifferences) {
      for (let a of newGrant.sections) {
        this._getGrantSectionOrderDiffs();
        this.grantDiff.orderDiffs.push({ name: a.name, type: 'new', order: a.order })
      }

    }

    if (this.grantDiff && this.grantDiff.orderDiffs && this.grantDiff.orderDiffs.length > 0) {
      for (let oldSec of oldGrant.sections) {
        this.grantDiff.orderDiffs.push({ name: oldSec.name, type: 'old', order: oldSec.order })
      }

    }

    this.changes.push(resultHeader);
    this.changes.push(resultSections);
    if (this.grantDiff && this.grantDiff.sectionDiffs) {
      this.grantDiff.sectionDiffs.sort((a, b) => a.order >= b.order ? 1 : -1);
    }
    if (this.grantDiff) {
      this.hasChanges.emit(true);
    } else {
      this.hasChanges.emit(false);
    }
    return this.changes;
  }


  _reportDiff(newReport: any, oldReport: any): any[] {
    const resultHeader = [];
    const resultSections = [];

    if (oldReport.name !== newReport.name) {
      this._getReportDiff();
      resultHeader.push({ 'order': 1, 'category': 'Report Header', 'name': 'Report Name changed', 'change': [{ 'old': oldReport.name, 'new': newReport.name }] });
      this.reportDiff.oldReportName = oldReport.name;
      this.reportDiff.newReportName = newReport.name;
    }
    if (oldReport.startDate !== newReport.startDate) {
      this._getReportDiff();
      this.reportDiff.oldReportStartDate = oldReport.startDate;
      this.reportDiff.newReportStartDate = newReport.startDate;
    }
    if (oldReport.endDate !== newReport.endDate) {
      this._getReportDiff();
      this.reportDiff.oldReportEndDate = oldReport.endDate;
      this.reportDiff.newReportEndDate = newReport.endDate;
    }

    if (oldReport.dueDate !== newReport.dueDate) {
      this._getReportDiff();
      this.reportDiff.oldReportDueDate = oldReport.dueDate;
      this.reportDiff.newReportDueDate = newReport.dueDate;
    }


    for (const section of newReport.sections) {
      const oldSection = oldReport.sections.filter((sec) => sec.id === section.id)[0];
      if (oldSection) {

        if (section.attributes) {
          for (let attr of section.attributes) {
            let oldAttr = null;
            if (oldSection.attributes) {
              oldAttr = oldSection.attributes.filter((a) => a.id === attr.id)[0];
            }
            if (oldAttr) {
              if (oldAttr.name !== attr.name) {
                this._getReportDiffSections();
                this.saveReportDifferences(oldSection, oldAttr, section, attr);

              }
              else if (oldAttr.type !== attr.type) {
                this._getReportDiffSections();
                this.saveReportDifferences(oldSection, oldAttr, section, attr);

              } else
                if (oldAttr.type === attr.type && oldAttr.type === 'multiline' && (((!oldAttr.value || oldAttr.value === null) ? "" : oldAttr.value) !== ((!attr.value || attr.value === null) ? "" : attr.value))) {
                  this._getReportDiffSections();
                  this.saveReportDifferences(oldSection, oldAttr, section, attr);
                } else

                  if (oldAttr.type === attr.type && oldAttr.type === 'kpi') {
                    const ot = (oldAttr.target === undefined || oldAttr.target === null) ? null : oldAttr.target;
                    const nt = (attr.target === undefined || attr.target === null) ? null : attr.target;
                    const of = (oldAttr.frequency === undefined || oldAttr.frequency === null) ? null : oldAttr.frequency;
                    const nf = (attr.frequency === undefined || attr.frequency === null) ? null : attr.frequency;
                    const oat = (oldAttr.actualTarget === undefined || oldAttr.actualTarget === null) ? null : oldAttr.actualTarget;
                    const nat = (attr.actualTarget === undefined || attr.actualTarget === null) ? null : attr.actualTarget;
                    if (ot !== nt) {
                      this._getReportDiffSections();
                      this.saveReportDifferences(oldSection, oldAttr, section, attr);
                    } else if (of !== nf) {
                      this._getReportDiffSections();
                      this.saveReportDifferences(oldSection, oldAttr, section, attr);
                    } else if (oat !== nat) {
                      this._getReportDiffSections();
                      this.saveReportDifferences(oldSection, oldAttr, section, attr);
                    }
                  } else
                    if (oldAttr.type === attr.type && oldAttr.type === 'table') {
                      if (oldAttr.tableValue.length !== attr.tableValue.length) {
                        this._getReportDiffSections();
                        this.saveReportDifferences(oldSection, oldAttr, section, attr);
                      } else {
                        let hasTableDifferences = false;
                        for (let i = 0; i < oldAttr.tableValue.length; i++) {
                          if (oldAttr.tableValue[i].header !== attr.tableValue[i].header || oldAttr.tableValue[i].name !== attr.tableValue[i].name || oldAttr.tableValue[i].columns.length !== attr.tableValue[i].columns.length) {
                            this._getReportDiffSections();
                            this.saveReportDifferences(oldSection, oldAttr, section, attr);
                            hasTableDifferences = true;
                            break;
                          } else {
                            for (let j = 0; j < oldAttr.tableValue[i].columns.length; j++) {
                              if (oldAttr.tableValue[i].columns[j].name !== attr.tableValue[i].columns[j].name || oldAttr.tableValue[i].columns[j].value !== attr.tableValue[i].columns[j].value) {
                                this._getReportDiffSections();
                                this.saveReportDifferences(oldSection, oldAttr, section, attr);
                                hasTableDifferences = true;
                                break;
                              }
                            }
                            if (hasTableDifferences) {
                              break;
                            }
                          }
                        }
                      }

                    } else
                      if (oldAttr.type === attr.type && oldAttr.type === 'document') {
                        if (oldAttr.attachments && attr.attachments && oldAttr.attachments.length !== attr.attachments.length) {
                          this._getReportDiffSections();
                          this.saveReportDifferences(oldSection, oldAttr, section, attr);
                        } else if (oldAttr.attachments && attr.attachments && oldAttr.attachments.length === attr.attachments.length) {
                          for (let i = 0; i < oldAttr.attachments.length; i++) {
                            if (oldAttr.attachments[i].name !== attr.attachments[i].name || oldAttr.attachments[i].type !== attr.attachments[i].type) {
                              this._getReportDiffSections();
                              this.saveReportDifferences(oldSection, oldAttr, section, attr);
                              break;
                            }
                          }
                        }

                      } else
                        if (oldAttr.type === attr.type && oldAttr.type === 'disbursement') {

                          let hasDifferences = false;

                          if (oldAttr.tableValue) {
                            for (let i = 0; i < oldAttr.tableValue.length; i++) {
                              if (oldAttr.tableValue[i].enteredByGrantee && oldAttr.tableValue[i].reportId !== newReport.reportId) {
                                oldAttr.tableValue.splice(i, 1);
                              }
                            }
                          }

                          if (oldAttr.tableValue && !attr.tableValue) {
                            hasDifferences = true;
                          } else if (!oldAttr.tableValue && attr.tableValue) {
                            hasDifferences = true;

                          } else if (oldAttr.tableValue.length !== attr.tableValue.length) {
                            hasDifferences = true;
                          } else {
                            for (let i = 0; i < oldAttr.tableValue.length; i++) {
                              if (oldAttr.tableValue[i].enteredByGrantee !== attr.tableValue[i].enteredByGrantee) {
                                hasDifferences = true;
                              } else
                                if (oldAttr.tableValue[i].columns.length !== attr.tableValue[i].columns.length) {
                                  hasDifferences = true;
                                } else {
                                  for (let j = 0; j < oldAttr.tableValue[i].columns.length; j++) {
                                    if (oldAttr.tableValue[i].columns[j].name !== attr.tableValue[i].columns[j].name) {
                                      hasDifferences = true;
                                    } else
                                      if (((!oldAttr.tableValue[i].columns[j].value || oldAttr.tableValue[i].columns[j].value === null) ? "" : oldAttr.tableValue[i].columns[j].value) !== ((!attr.tableValue[i].columns[j].value || attr.tableValue[i].columns[j].value === null) ? "" : attr.tableValue[i].columns[j].value)) {
                                        hasDifferences = true;
                                      }
                                  }
                                }
                            }
                          }

                          if (hasDifferences) {
                            this._getReportDiffSections();
                            this.saveReportDifferences(oldSection, oldAttr, section, attr);
                          }

                        }
            } else if (!oldAttr) {
              this._getReportDiffSections();
              const attrDiff = new AttributeDiff();
              attrDiff.section = section.name;
              attrDiff.newAttribute = attr;
              const sectionDiff = new SectionDiff();
              sectionDiff.oldSection = oldSection;
              sectionDiff.newSection = section;
              sectionDiff.attributesDiffs = [];
              sectionDiff.order = section.order
              sectionDiff.attributesDiffs.push(attrDiff);
              this.reportDiff.sectionDiffs.push(sectionDiff);
            }
          }

          if (oldSection.attributes) {
            for (let attr of oldSection.attributes) {
              let oldAttr = null;

              oldAttr = section.attributes.filter((a) => a.name === attr.name)[0];
              if (!oldAttr) {
                this._getReportDiffSections();
                const attrDiff = new AttributeDiff();
                attrDiff.section = section.name;
                attrDiff.oldAttribute = attr;
                attrDiff.newAttribute = null;
                const sectionDiff = new SectionDiff();
                sectionDiff.oldSection = oldSection;
                sectionDiff.newSection = section;
                sectionDiff.order = section.order
                sectionDiff.attributesDiffs = [];
                sectionDiff.attributesDiffs.push(attrDiff);
                this.reportDiff.sectionDiffs.push(sectionDiff);
              }
            }
          }
        }
        if (oldSection.name !== section.name) {
          this._getReportDiffSections();
          let secDiff = new SectionDiff();
          secDiff.oldSection = oldSection;
          secDiff.newSection = section;
          secDiff.order = section.order
          secDiff.hasSectionLevelChanges = true;
          this.reportDiff.sectionDiffs.push(secDiff);
        }

        let hasDifferences = false;
        if (section.attributes) {
          for (let i = 0; i < section.attributes.length; i++) {
            const idx = oldSection.attributes.findIndex(f => f.id === section.attributes[i].id)
            if (idx !== -1 && idx !== i) {
              hasDifferences = true;
              break;
            }
          }
        }

        let attrDiff = [];
        if (hasDifferences) {
          for (let a of section.attributes) {
            attrDiff.push({ name: a.name, type: 'new', order: a.order });
          }

        }

        if (attrDiff.length > 0) {
          for (let oldattr of oldSection.attributes) {
            attrDiff.push({ name: oldattr.name, type: 'old', order: oldattr.order });
          }
          this._getReportDiffSections();
          const attrDiff1 = new AttributeDiff();
          attrDiff1.section = section.name;
          const sectionDiff = new SectionDiff();
          sectionDiff.oldSection = oldSection;
          sectionDiff.newSection = section;
          sectionDiff.order = section.order
          sectionDiff.hasSectionLevelChanges = true;
          sectionDiff.attributeOrderDiffs.push(attrDiff);
          this.reportDiff.sectionDiffs.push(sectionDiff);
        }
      } else {
        this._getReportDiffSections();
        let secDiff = new SectionDiff();
        secDiff.oldSection = null;
        secDiff.newSection = section;
        secDiff.order = section.order;
        secDiff.hasSectionLevelChanges = true;
        this.reportDiff.sectionDiffs.push(secDiff);
      }
    }

    for (const section of oldReport.sections) {
      const currentSection = newReport.sections.filter((sec) => sec.name === section.name)[0];
      if (!currentSection) {
        this._getReportDiffSections();
        let secDiff = new SectionDiff();
        secDiff.oldSection = section;
        secDiff.newSection = null;
        secDiff.order = section.order;
        secDiff.hasSectionLevelChanges = true
        this.reportDiff.sectionDiffs.push(secDiff);
      }
    }


    let hasSectionDifferences = false;
    if (newReport.sections) {
      for (let i = 0; i < newReport.sections.length; i++) {
        const idx = oldReport.sections.findIndex(f => f.id === newReport.sections[i].id);
        if (idx !== -1 && idx !== i) {
          hasSectionDifferences = true;
          break;
        }
      }
    }

    let secDiff = [];

    if (hasSectionDifferences) {
      this._getReportDiff();
      for (let a of newReport.sections) {
        this._getReportSectionOrderDiffs();

        this.reportDiff.orderDiffs.push({ name: a.name, type: 'new', order: a.order })
      }

    }

    if (this.reportDiff && this.reportDiff.orderDiffs && this.reportDiff.orderDiffs.length > 0) {
      for (let oldSec of oldReport.sections) {
        this.grantDiff.orderDiffs.push({ name: oldSec.name, type: 'old', order: oldSec.order })
      }

    }

    this.changes.push(resultHeader);
    this.changes.push(resultSections);
    if (this.reportDiff && this.reportDiff.sectionDiffs) {
      this.reportDiff.sectionDiffs.sort((a, b) => a.order >= b.order ? 1 : -1);
    }

    if (this.reportDiff) {
      this.hasChanges.emit(true);
    } else {
      this.hasChanges.emit(false);
    }
    return this.changes;
  }

  _closureDiff(newClosure: any, oldClosure: any): any[] {
    const resultHeader = [];
    const resultSections = [];

    if (oldClosure.reason.reason !== newClosure.reason.reason) {
      this._getClosureDiff();
      resultHeader.push({ 'order': 1, 'category': 'CLosure Header', 'name': 'Closure Reason changed', 'change': [{ 'old': oldClosure.reason.reason, 'new': newClosure.reason.reason }] });
      this.closureDiff.oldClosureReason = oldClosure.reason.reason;
      this.closureDiff.newClosureReason = newClosure.reason.reason;
    }
    if (oldClosure.description !== newClosure.description) {
      this._getClosureDiff();
      this.closureDiff.oldClosureDescription = oldClosure.description;
      this.closureDiff.newClosureDescription = newClosure.description;
    }

    if (oldClosure.grantRefundAmount !== newClosure.grantRefundAmount) {
      this._getClosureDiff();
      this.closureDiff.oldClosureGrantRefundAmount = oldClosure.grantRefundAmount;
      this.closureDiff.newClosureGrantRefundAmount = newClosure.grantRefundAmount;
    }

    if (oldClosure.grantRefundReason !== newClosure.grantRefundReason) {
      this._getClosureDiff();
      this.closureDiff.oldClosureGrantRefundReason = oldClosure.grantRefundReason;
      this.closureDiff.newClosureGrantRefundReason = newClosure.grantRefundReason;
    }

    if (JSON.stringify(oldClosure.actualRefunds) !== JSON.stringify(newClosure.actualRefunds)) {
      this._getClosureDiff();
      this.closureDiff.oldClosureActualRefunds = oldClosure.actualRefunds;
      this.closureDiff.newClosureActualRefunds = newClosure.actualRefunds;
    }


    for (const section of newClosure.sections) {
      const oldSection = oldClosure.sections.filter((sec) => sec.id === section.id)[0];
      if (oldSection) {

        if (section.attributes) {
          for (let attr of section.attributes) {
            let oldAttr = null;
            if (oldSection.attributes) {
              oldAttr = oldSection.attributes.filter((a) => a.id === attr.id)[0];
            }
            if (oldAttr) {
              if (oldAttr.name !== attr.name) {
                this._getClosureDiffSections();
                this.saveClosureDifferences(oldSection, oldAttr, section, attr);

              }
              else if (oldAttr.type !== attr.type) {
                this._getClosureDiffSections();
                this.saveClosureDifferences(oldSection, oldAttr, section, attr);

              } else
                if (oldAttr.type === attr.type && oldAttr.type === 'multiline' && (((!oldAttr.value || oldAttr.value === null) ? "" : oldAttr.value) !== ((!attr.value || attr.value === null) ? "" : attr.value))) {
                  this._getClosureDiffSections();
                  this.saveClosureDifferences(oldSection, oldAttr, section, attr);
                } else

                  if (oldAttr.type === attr.type && oldAttr.type === 'kpi') {
                    const ot = (oldAttr.target === undefined || oldAttr.target === null) ? null : oldAttr.target;
                    const nt = (attr.target === undefined || attr.target === null) ? null : attr.target;
                    const of = (oldAttr.frequency === undefined || oldAttr.frequency === null) ? null : oldAttr.frequency;
                    const nf = (attr.frequency === undefined || attr.frequency === null) ? null : attr.frequency;
                    const oat = (oldAttr.actualTarget === undefined || oldAttr.actualTarget === null) ? null : oldAttr.actualTarget;
                    const nat = (attr.actualTarget === undefined || attr.actualTarget === null) ? null : attr.actualTarget;
                    if (ot !== nt) {
                      this._getClosureDiffSections();
                      this.saveClosureDifferences(oldSection, oldAttr, section, attr);
                    } else if (of !== nf) {
                      this._getClosureDiffSections();
                      this.saveClosureDifferences(oldSection, oldAttr, section, attr);
                    } else if (oat !== nat) {
                      this._getClosureDiffSections();
                      this.saveClosureDifferences(oldSection, oldAttr, section, attr);
                    }
                  } else
                    if (oldAttr.type === attr.type && oldAttr.type === 'table') {
                      if (oldAttr.tableValue.length !== attr.tableValue.length) {
                        this._getClosureDiffSections();
                        this.saveClosureDifferences(oldSection, oldAttr, section, attr);
                      } else {
                        let hasTableDifferences = false;
                        for (let i = 0; i < oldAttr.tableValue.length; i++) {
                          if (oldAttr.tableValue[i].header !== attr.tableValue[i].header || oldAttr.tableValue[i].name !== attr.tableValue[i].name || oldAttr.tableValue[i].columns.length !== attr.tableValue[i].columns.length) {
                            this._getClosureDiffSections();
                            this.saveClosureDifferences(oldSection, oldAttr, section, attr);
                            hasTableDifferences = true;
                            break;
                          } else {
                            for (let j = 0; j < oldAttr.tableValue[i].columns.length; j++) {
                              if (oldAttr.tableValue[i].columns[j].name !== attr.tableValue[i].columns[j].name || oldAttr.tableValue[i].columns[j].value !== attr.tableValue[i].columns[j].value) {
                                this._getClosureDiffSections();
                                this.saveClosureDifferences(oldSection, oldAttr, section, attr);
                                hasTableDifferences = true;
                                break;
                              }
                            }
                            if (hasTableDifferences) {
                              break;
                            }
                          }
                        }
                      }

                    } else
                      if (oldAttr.type === attr.type && oldAttr.type === 'document') {
                        if (oldAttr.attachments && attr.attachments && oldAttr.attachments.length !== attr.attachments.length) {
                          this._getClosureDiffSections();
                          this.saveClosureDifferences(oldSection, oldAttr, section, attr);
                        } else if (oldAttr.attachments && attr.attachments && oldAttr.attachments.length === attr.attachments.length) {
                          for (let i = 0; i < oldAttr.attachments.length; i++) {
                            if (oldAttr.attachments[i].name !== attr.attachments[i].name || oldAttr.attachments[i].type !== attr.attachments[i].type) {
                              this._getClosureDiffSections();
                              this.saveClosureDifferences(oldSection, oldAttr, section, attr);
                              break;
                            }
                          }
                        }

                      } else
                        if (oldAttr.type === attr.type && oldAttr.type === 'disbursement') {

                          let hasDifferences = false;

                          if (oldAttr.tableValue) {
                            for (let i = 0; i < oldAttr.tableValue.length; i++) {
                              if (oldAttr.tableValue[i].enteredByGrantee && oldAttr.tableValue[i].reportId !== newClosure.reportId) {
                                oldAttr.tableValue.splice(i, 1);
                              }
                            }
                          }

                          if (oldAttr.tableValue && !attr.tableValue) {
                            hasDifferences = true;
                          } else if (!oldAttr.tableValue && attr.tableValue) {
                            hasDifferences = true;

                          } else if (oldAttr.tableValue && attr.tableValue && oldAttr.tableValue.length !== attr.tableValue.length) {
                            hasDifferences = true;
                          } else {
                            for (let i = 0; i < oldAttr.tableValue.length; i++) {
                              if (oldAttr.tableValue[i].enteredByGrantee !== attr.tableValue[i].enteredByGrantee) {
                                hasDifferences = true;
                              } else
                                if (oldAttr.tableValue[i].columns.length !== attr.tableValue[i].columns.length) {
                                  hasDifferences = true;
                                } else {
                                  for (let j = 0; j < oldAttr.tableValue[i].columns.length; j++) {
                                    if (oldAttr.tableValue[i].columns[j].name !== attr.tableValue[i].columns[j].name) {
                                      hasDifferences = true;
                                    } else
                                      if (((!oldAttr.tableValue[i].columns[j].value || oldAttr.tableValue[i].columns[j].value === null) ? "" : oldAttr.tableValue[i].columns[j].value) !== ((!attr.tableValue[i].columns[j].value || attr.tableValue[i].columns[j].value === null) ? "" : attr.tableValue[i].columns[j].value)) {
                                        hasDifferences = true;
                                      }
                                  }
                                }
                            }
                          }

                          if (hasDifferences) {
                            this._getClosureDiffSections();
                            this.saveClosureDifferences(oldSection, oldAttr, section, attr);
                          }

                        }
            } else if (!oldAttr) {
              this._getClosureDiffSections();
              const attrDiff = new AttributeDiff();
              attrDiff.section = section.name;
              attrDiff.newAttribute = attr;
              const sectionDiff = new SectionDiff();
              sectionDiff.oldSection = oldSection;
              sectionDiff.newSection = section;
              sectionDiff.attributesDiffs = [];
              sectionDiff.order = section.order
              sectionDiff.attributesDiffs.push(attrDiff);
              this.closureDiff.sectionDiffs.push(sectionDiff);
            }
          }

          if (oldSection.attributes) {
            for (let attr of oldSection.attributes) {
              let oldAttr = null;

              oldAttr = section.attributes.filter((a) => a.id === attr.id)[0];
              if (!oldAttr) {
                this._getClosureDiffSections();
                const attrDiff = new AttributeDiff();
                attrDiff.section = section.name;
                attrDiff.oldAttribute = attr;
                attrDiff.newAttribute = null;
                const sectionDiff = new SectionDiff();
                sectionDiff.oldSection = oldSection;
                sectionDiff.newSection = section;
                sectionDiff.order = section.order
                sectionDiff.attributesDiffs = [];
                sectionDiff.attributesDiffs.push(attrDiff);
                this.closureDiff.sectionDiffs.push(sectionDiff);
              }
            }
          }
        }
        if (oldSection.name !== section.name) {
          this._getClosureDiffSections();
          let secDiff = new SectionDiff();
          secDiff.oldSection = oldSection;
          secDiff.newSection = section;
          secDiff.order = section.order
          secDiff.hasSectionLevelChanges = true;
          this.closureDiff.sectionDiffs.push(secDiff);
        }

        let hasDifferences = false;
        if (section.attributes) {
          for (let i = 0; i < section.attributes.length; i++) {
            const idx = oldSection.attributes.findIndex(f => f.id === section.attributes[i].id)
            if (idx !== -1 && idx !== i) {
              hasDifferences = true;
              break;
            }
          }
        }

        let attrDiff = [];
        if (hasDifferences) {
          for (let a of section.attributes) {
            attrDiff.push({ name: a.name, type: 'new', order: a.order });
          }

        }

        if (attrDiff.length > 0) {
          for (let oldattr of oldSection.attributes) {
            attrDiff.push({ name: oldattr.name, type: 'old', order: oldattr.order });
          }
          this._getClosureDiffSections();
          const attrDiff1 = new AttributeDiff();
          attrDiff1.section = section.name;
          const sectionDiff = new SectionDiff();
          sectionDiff.oldSection = oldSection;
          sectionDiff.newSection = section;
          sectionDiff.order = section.order
          sectionDiff.hasSectionLevelChanges = true;
          sectionDiff.attributeOrderDiffs.push(attrDiff);
          this.closureDiff.sectionDiffs.push(sectionDiff);
        }
      } else {
        this._getClosureDiffSections();
        let secDiff = new SectionDiff();
        secDiff.oldSection = null;
        secDiff.newSection = section;
        secDiff.order = section.order;
        secDiff.hasSectionLevelChanges = true;
        this.closureDiff.sectionDiffs.push(secDiff);
      }
    }

    for (const section of oldClosure.sections) {
      const currentSection = newClosure.sections.filter((sec) => sec.name === section.name)[0];
      if (!currentSection) {
        this._getClosureDiffSections();
        let secDiff = new SectionDiff();
        secDiff.oldSection = section;
        secDiff.newSection = null;
        secDiff.order = section.order;
        secDiff.hasSectionLevelChanges = true
        this.closureDiff.sectionDiffs.push(secDiff);
      }
    }


    let hasSectionDifferences = false;
    if (newClosure.sections) {
      for (let i = 0; i < newClosure.sections.length; i++) {
        const idx = oldClosure.sections.findIndex(f => f.id === newClosure.sections[i].id);
        if (idx !== -1 && idx !== i) {
          hasSectionDifferences = true;
          break;
        }
      }
    }

    let secDiff = [];

    if (hasSectionDifferences) {
      this._getClosureDiff();
      for (let a of newClosure.sections) {
        this._getClosureSectionOrderDiffs();
        this.closureDiff.orderDiffs.push({ name: a.name, type: 'new', order: a.order })
      }

    }

    if (this.closureDiff && this.closureDiff.orderDiffs && this.closureDiff.orderDiffs.length > 0) {
      for (let oldSec of oldClosure.sections) {
        this.closureDiff.orderDiffs.push({ name: oldSec.name, type: 'old', order: oldSec.order })
      }

    }

    this.changes.push(resultHeader);
    this.changes.push(resultSections);
    if (this.closureDiff && this.closureDiff.sectionDiffs) {
      this.closureDiff.sectionDiffs.sort((a, b) => a.order >= b.order ? 1 : -1);
    }

    if (this.closureDiff) {
      this.hasChanges.emit(true);
    } else {
      this.hasChanges.emit(false);
    }
    return this.changes;
  }

  _getGrantDiff() {
    if (!this.grantDiff) {
      this.grantDiff = new GrantDiff();
    }
  }
  _getGrantDiffSections() {
    this._getGrantDiff();
    if (!this.grantDiff.sectionDiffs) {
      this.grantDiff.sectionDiffs = [];
    }

  }

  _getGrantSectionOrderDiffs() {
    this._getGrantDiff();
    if (!this.grantDiff.orderDiffs) {
      this.grantDiff.orderDiffs = [];
    }
  }

  _getReportSectionOrderDiffs() {
    this._getReportDiff();
    if (!this.reportDiff.orderDiffs) {
      this.reportDiff.orderDiffs = [];
    }
  }

  _getClosureSectionOrderDiffs() {
    this._getClosureDiff();
    if (!this.closureDiff.orderDiffs) {
      this.closureDiff.orderDiffs = [];
    }
  }


  _getReportDiff() {
    if (!this.reportDiff) {
      this.reportDiff = new ReportDiff();
    }
  }

  _getReportDiffSections() {
    this._getReportDiff();
    if (!this.reportDiff.sectionDiffs) {
      this.reportDiff.sectionDiffs = [];
    }
  }

  _getClosureDiff() {
    if (!this.closureDiff) {
      this.closureDiff = new ClosureDiff();
    }
  }

  _getClosureDiffSections() {
    this._getClosureDiff();
    if (!this.closureDiff.sectionDiffs) {
      this.closureDiff.sectionDiffs = [];
    }
  }

  saveDifferences(oldSection, oldAttr, section, attr) {
    const attrDiff = new AttributeDiff();
    attrDiff.section = section.name;
    attrDiff.oldAttribute = oldAttr;
    attrDiff.newAttribute = attr;
    const sectionDiff = new SectionDiff();
    sectionDiff.oldSection = oldSection;
    sectionDiff.newSection = section;
    sectionDiff.attributesDiffs = [];
    sectionDiff.order = section.order
    this._getGrantDiffSections();
    sectionDiff.attributesDiffs.push(attrDiff);
    this.grantDiff.sectionDiffs.push(sectionDiff);
  }

  saveReportDifferences(oldSection, oldAttr, section, attr) {
    const attrDiff = new AttributeDiff();
    attrDiff.section = section.sectionName;
    attrDiff.oldAttribute = oldAttr;
    attrDiff.newAttribute = attr;
    const sectionDiff = new SectionDiff();
    sectionDiff.oldSection = oldSection;
    sectionDiff.newSection = section;
    sectionDiff.attributesDiffs = [];
    sectionDiff.order = section.order
    sectionDiff.attributesDiffs.push(attrDiff);
    this.reportDiff.sectionDiffs.push(sectionDiff);
  }

  saveClosureDifferences(oldSection, oldAttr, section, attr) {
    const attrDiff = new AttributeDiff();
    attrDiff.section = section.sectionName;
    attrDiff.oldAttribute = oldAttr;
    attrDiff.newAttribute = attr;
    const sectionDiff = new SectionDiff();
    sectionDiff.oldSection = oldSection;
    sectionDiff.newSection = section;
    sectionDiff.attributesDiffs = [];
    sectionDiff.order = section.order
    sectionDiff.attributesDiffs.push(attrDiff);
    this.closureDiff.sectionDiffs.push(sectionDiff);
  }

  _disbursementDiff(newDisbursement: any, olddisbursement: any): any[] {
    const resultHeader = [];
    const resultSections = [];

    if (olddisbursement.requestedAmount !== newDisbursement.requestedAmount) {
      this._getDisbursementDiff();
      resultHeader.push({ 'order': 1, 'category': 'Approval Request', 'name': 'Requested Amount changed', 'change': [{ 'old': olddisbursement.requestedAmount, 'new': newDisbursement.requestedAmount }] });
      this.disbursementDiff.oldRequestedAmount = olddisbursement.requestedAmount;
      this.disbursementDiff.newRequestedAmount = newDisbursement.requestedAmount;
    }
    if (olddisbursement.commentary !== newDisbursement.commentary) {
      this._getDisbursementDiff();
      resultHeader.push({ 'order': 2, 'category': 'Approval Request', 'name': 'Approval Request Reason changed', 'change': [{ 'old': olddisbursement.commentary, 'new': newDisbursement.commentary }] });
      this.disbursementDiff.oldReason = olddisbursement.commentary;
      this.disbursementDiff.newReason = newDisbursement.commentary;
    }

    if (newDisbursement.actualDisbursement && newDisbursement.actualDisbursement.length > 0) {
      this._getDisbursementDiff();
      resultHeader.push({ 'order': 3, 'category': 'Approval Request', 'name': 'Recorded Disbursement changes', 'change': [{ 'old': null, 'new': newDisbursement.ActualDisbursement }] });
      this.disbursementDiff.actualDisbursement = null;
      this.disbursementDiff.actualDisbursement = newDisbursement.actualDisbursement;
    }




    this.changes.push(resultHeader);

    if (this.disbursementDiff) {
      this.hasChanges.emit(true);
    } else {
      this.hasChanges.emit(false);
    }
    return this.changes;
  }

  _getDisbursementDiff() {
    if (!this.disbursementDiff) {
      this.disbursementDiff = new DisbursementDiff();
    }
  }

  getType(type: String) {
    if (type === 'multiline') {
      return 'Descriptive';
    } else if (type === 'table') {
      return 'Tabular';
    } else if (type === 'document') {
      return 'Document';
    } else if (type === 'kpi') {
      return 'Measurement/KPI';
    } else if (type === 'disbursement') {
      return 'Disbursement';
    }
  }

  getTabularDataNew(oldData, data) {
    let html = '<table width="100%" border="1" class="bg-white"><tr>';
    const tabData = data;
    html += '<td>' + this.getTheDifference((oldData && oldData.length > 0 && oldData[0].header ? oldData[0].header : ''), (tabData && tabData.lenght > 0 && tabData[0].header ? tabData[0].header : '')).after + '</td>';
    for (let i = 0; i < tabData[0].columns.length; i++) {


      html += '<td>' + this.getTheDifference(String((oldData && oldData.length > 0 && oldData[0].columns[i] && oldData[0].columns[i].name && oldData[0].columns[i].name.trim() === '') ? oldData[0].columns[i].name : '&nbsp;'), String(tabData && tabData.length > 0 && tabData[0].columns[i] && tabData[0].columns[i].name && tabData[0].columns[i].name.trim() === '' ? '&nbsp;' : tabData[0].columns[i].name)).after + '</td>';
    }
    html += '</tr>';
    for (let i = 0; i < tabData.length; i++) {

      html += '<tr><td>' + this.getTheDifference(oldData && oldData.length > 0 && oldData[i] ? oldData[i].name : '', tabData[i].name).after + '</td>';
      for (let j = 0; j < tabData[i].columns.length; j++) {
        html += '<td>' + this.getTheDifference(oldData && oldData.length > 0 && oldData[i] ? String(oldData[i].columns[j].value.trim() === '' ? '&nbsp;' : oldData[i].columns[j].value) : '', String(tabData[i].columns[j].value.trim() === '' ? '&nbsp;' : tabData[i].columns[j].value)).after + '</td>';
      }
      html += '</tr>';
    }

    html += '</table>'
    return html;
  }

  getTabularDataOld(oldData, data) {
    let html = '<table width="100%" border="1" class="bg-white"><tr>';
    const tabData = data;
    html += '<td>' + this.getTheDifference((oldData && oldData.length > 0 && oldData[0].header ? oldData[0].header : ''), (tabData && tabData.length > 0 && tabData[0].header ? tabData[0].header : '')).before + '</td>';
    for (let i = 0; i < tabData[0].columns.length; i++) {


      html += '<td>' + this.getTheDifference(String(oldData && oldData.length > 0 && oldData[0].columns[i].name.trim() === '' ? '&nbsp;' : oldData[0].columns[i].name), String(tabData && tabData.length > 0 && tabData[0].columns[i].name.trim() === '' ? '&nbsp;' : tabData[0].columns[i].name)).before + '</td>';
    }
    html += '</tr>';
    for (let i = 0; i < tabData.length; i++) {
      if (!oldData[i]) {
        continue;
      }
      html += '<tr><td>' + this.getTheDifference(oldData && oldData.length > 0 && oldData[i] ? oldData[i].name : '', tabData && tabData.length > 0 && tabData[i].name ? tabData[i].name : '').before + '</td>';
      for (let j = 0; j < tabData[i].columns.length; j++) {
        html += '<td>' + this.getTheDifference(oldData[i] ? String(oldData[i].columns[j].value.trim() === '' ? '&nbsp;' : oldData[i].columns[j].value) : '', String(tabData[i].columns[j].value.trim() === '' ? '&nbsp;' : tabData[i].columns[j].value)).before + '</td>';
      }
      html += '</tr>';
    }

    html += '</table>'
    return html;
  }

  getDisbursementTabularDataNew(oldData, data) {
    let html = '<table width="100%" border="1" class="bg-white"><tr>';
    const tabData = data;
    if (oldData && oldData.length > 0 && tabData) {
      html += '<td>' + this.getTheDifference(oldData[0].header ? oldData[0].header : '', tabData[0].header ? tabData[0].header : '').after + '</td>';
      for (let i = 0; i < tabData[0].columns.length; i++) {


        html += '<td>' + this.getTheDifference(oldData[0].columns[i].name ? oldData[0].columns[i].name : '', tabData[0].columns[i].name).after + '</td>';
      }
      html += '</tr>';
      for (let i = 0; i < tabData.length; i++) {
        html += '<tr><td>' + this.getTheDifference(oldData[i] && oldData[i].name ? oldData[i].name : '', tabData[i].name).after + '</td>';
        for (let j = 0; j < tabData[i].columns.length; j++) {
          if (!tabData[i].columns[j].dataType) {
            html += '<td>' + this.getTheDifference(oldData[i] && oldData[i].columns[j].value ? oldData[i].columns[j].value : '', tabData[i].columns[j].value).after + '</td>';
          } else if (tabData[i].columns[j].dataType === 'currency') {
            html += '<td class="text-right">₹ ' + this.getTheDifference(inf.format(Number(oldData[i] && oldData[i].columns[j].value && oldData[i].columns[j].value.trim() !== '' ? oldData[i].columns[j].value : 0), 2), inf.format(Number(tabData[i] && tabData[i].columns[j].value && tabData[i].columns[j].value.trim() !== '' ? tabData[i].columns[j].value : 0), 2)).after + '</td>';
          }
        }
        html += '</tr>';
      }
    }

    html += '</table>'
    return html;
  }

  getDisbursementTabularDataOld(oldData, data) {
    let html = '<table width="100%" border="1" class="bg-white"><tr>';
    const tabData = data;
    if (tabData) {
      html += '<td>' + this.getTheDifference(oldData[0].header ? oldData[0].header : '', tabData[0].header ? tabData[0].header : '').before + '</td>';
      for (let i = 0; i < tabData[0].columns.length; i++) {


        html += '<td>' + this.getTheDifference(oldData[0].columns[i].name ? oldData[0].columns[i].name : '', tabData[0].columns[i].name).before + '</td>';
      }
      html += '</tr>';
      for (let i = 0; i < tabData.length; i++) {
        if (!oldData[i]) {
          continue;
        }
        html += '<tr><td>' + this.getTheDifference(oldData[i] && oldData[i].name ? oldData[i].name : '', tabData[i].name).before + '</td>';
        for (let j = 0; j < tabData[i].columns.length; j++) {
          if (!tabData[i].columns[j].dataType) {
            html += '<td>' + this.getTheDifference(oldData[i] && oldData[i].columns[j].value ? oldData[i].columns[j].value : '', tabData[i].columns[j].value).before + '</td>';
          } else if (tabData[i].columns[j].dataType === 'currency') {
            html += '<td class="text-right">₹ ' + this.getTheDifference(inf.format(Number(oldData[i] && oldData[i].columns[j].value && oldData[i].columns[j].value.trim() !== '' ? oldData[i].columns[j].value : 0), 2), inf.format(Number(tabData[i] && tabData[i].columns[j].value && tabData[i].columns[j].value.trim() !== '' ? tabData[i].columns[j].value : 0), 2)).before + '</td>';
          }
        }
        html += '</tr>';
      }
    }

    html += '</table>'
    return html;
  }


  getDocumentNameNew(oldVal, val: string): string {
    let obj = [];
    let objOld = [];
    let formattedData = "<ul>"
    if (val && val !== "") {
      obj = JSON.parse(val);
    }
    if (oldVal && oldVal !== "") {
      objOld = JSON.parse(oldVal);
    }

    if (obj && obj.length > 0) {


      for (let i = 0; i < obj.length; i++) {
        formattedData += "<li>" + this.getTheDifference(objOld[i] ? objOld[i].name : '', obj[i].name).after + "</li>"
      }

    }
    formattedData += "</ul>";
    return formattedData;
  }

  getDocumentNameOld(oldVal, val: string): string {
    let obj = [];
    let objOld = [];
    let formattedData = "<ul>"
    if (val && val !== "") {
      obj = JSON.parse(val);
    }
    if (oldVal && oldVal !== "") {
      objOld = JSON.parse(oldVal);
    }

    if (obj && obj.length > 0) {


      for (let i = 0; i < obj.length; i++) {
        if (!objOld[i]) {
          continue;
        }
        formattedData += "<li>" + this.getTheDifference(objOld[i].name, obj[i].name).before + "</li>"
      }

    }
    formattedData += "</ul>";
    return formattedData;
  }

  getDocumentName(val: string): any[] {
    let obj = [];
    if (val && val !== "") {
      obj = JSON.parse(val);
    }
    return obj;
  }

  onNoClick() {
    this.dialogRef.close();
  }

  getTheDifference(o: string, n: string) {
    const diff = difference.default.diffPatchBySeparator(o, n, ' ');
    console.log(diff);
    return diff;

  }

  getTabularData(data) {
    let html = '<table width="100%" border="1" class="bg-white"><tr>';
    const tabData = data;
    html += '<td>' + (tabData[0].header ? tabData[0].header : '') + '</td>';
    for (let i = 0; i < tabData[0].columns.length; i++) {


      html += '<td>' + String(tabData[0].columns[i].name.trim() === '' ? '&nbsp;' : tabData[0].columns[i].name) + '</td>';
    }
    html += '</tr>';
    for (let i = 0; i < tabData.length; i++) {

      html += '<tr><td>' + tabData[i].name + '</td>';
      for (let j = 0; j < tabData[i].columns.length; j++) {
        html += '<td>' + String(tabData[i].columns[j].value.trim() === '' ? '&nbsp;' : tabData[i].columns[j].value) + '</td>';
      }
      html += '</tr>';
    }

    html += '</table>'
    return html;
  }

  getDisbursementTabularData(data) {
    let html = '<table width="100%" border="1" class="bg-white"><tr>';
    const tabData = data;
    if (tabData) {
      html += '<td>' + (tabData[0].header ? tabData[0].header : '') + '</td>';
      for (let i = 0; i < tabData[0].columns.length; i++) {


        html += '<td>' + tabData[0].columns[i].name + '</td>';
      }
      html += '</tr>';
      for (let i = 0; i < tabData.length; i++) {

        html += '<tr><td>' + tabData[i].name + '</td>';
        for (let j = 0; j < tabData[i].columns.length; j++) {
          if (!tabData[i].columns[j].dataType) {
            html += '<td>' + tabData[i].columns[j].value + '</td>';
          } else if (tabData[i].columns[j].dataType === 'currency') {
            html += '<td class="text-right">₹ ' + inf.format(Number(tabData[i].columns[j].value), 2) + '</td>';
          }


        }
        html += '</tr>';
      }
    }

    html += '</table>'
    return html;
  }

  getTheRefundAmountNewDifference(oldAmt, newAmt) {
    return this.getTheDifference(inf.format(oldAmt ? Number(oldAmt) : 0), inf.format(newAmt ? Number(newAmt) : 0)).before;
  }

  getTheRefundAmountOldDifference(oldAmt, newAmt) {
    return inf.format(this.getTheDifference(inf.format(oldAmt ? Number(oldAmt) : 0), inf.format(newAmt ? Number(newAmt) : 0)).after);
  }

  getActualRefundsTabularDataNew(oldData, data) {
    let html = '<table width="100%" border="1" class="bg-white"><tr>';
    const tabData = data;
    html += '<td>#</td><td>Refund Date</td><td>Refund Amount</td><td>Note</td></tr>';
    for (let i = 0; i < tabData.length; i++) {


      html += '<tr><td>' + (i + 1) + '</td><td>' + this.getTheDifference((oldData[i] && oldData[i].refundDate) ? String(this.datePipe.transform(oldData[i].refundDate, 'dd-MMM-yyyy')) : '', tabData[i].refundDate ? String(this.datePipe.transform(tabData[i].refundDate, 'dd-MMM-yyyy')) : '').after + '</td>' +
        '<td>' + this.getTheDifference((oldData[i] && oldData[i].amount) ? String(oldData[i].amount) : '', tabData[i].amount ? String(tabData[i].amount) : '').after + '</td>' +
        '<td>' + this.getTheDifference((oldData[i] && oldData[i].note) ? String(oldData[i].note) : '', tabData[i].note ? String(tabData[i].note) : '').after + '</td>';

    }
    html += '</tr>';
    html += '</table>'
    return html;
  }

  getActualRefundsTabularDataOld(oldData, data) {
    let html = '<table width="100%" border="1" class="bg-white"><tr>';

    let tabData;
    tabData = oldData;
    html += '<td>#</td><td>Refund Date</td><td>Refund Amount</td><td>Note</td></tr>';
    for (let i = 0; i < tabData.length; i++) {



      html += '<tr><td>' + (i + 1) + '</td><td>' + this.getTheDifference((oldData[i] && oldData[i].refundDate) ? String(this.datePipe.transform(oldData[i].refundDate, 'dd-MMM-yyyy')) : '', tabData[i].refundDate ? String(this.datePipe.transform(tabData[i].refundDate, 'dd-MMM-yyyy')) : '').before + '</td>' +
        '<td>' + this.getTheDifference((oldData[i] && oldData[i].amount) ? String(oldData[i].amount) : '', tabData[i].amount ? String(tabData[i].amount) : '').before + '</td>' +
        '<td>' + this.getTheDifference((oldData[i] && oldData[i].note) ? String(oldData[i].note) : '', tabData[i].note ? String(tabData[i].note) : '').before + '</td></tr>';

    }
    html += '</table>'
    return html;
  }
}
