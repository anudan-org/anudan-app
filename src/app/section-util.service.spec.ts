import { TestBed } from '@angular/core/testing';

import { SectionUtilService } from './section-util.service';

describe('SectionUtilService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SectionUtilService = TestBed.get(SectionUtilService);
    expect(service).toBeTruthy();
  });
});
