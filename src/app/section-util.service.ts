import { Section } from './model/dahsboard';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SectionUtilService {

  constructor() { }

  getCleanText(section: Section): string {
    if (section.sectionName === "") {
      return String(section.id);
    }
    return section.sectionName.replace(/[^_0-9a-z]/gi, "");
  }
}
