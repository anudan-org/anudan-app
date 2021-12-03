import { TestBed } from '@angular/core/testing';

import { DocpreviewService } from './docpreview.service';

describe('DocpreviewService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DocpreviewService = TestBed.get(DocpreviewService);
    expect(service).toBeTruthy();
  });
});
