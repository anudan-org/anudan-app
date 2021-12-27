import { TestBed } from '@angular/core/testing';

import { DocManagementService } from './doc-management.service';

describe('DocManagementService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DocManagementService = TestBed.get(DocManagementService);
    expect(service).toBeTruthy();
  });
});
