import { TestBed } from '@angular/core/testing';

import { ExcelDownloadService } from './excel-download.service';

describe('ExcelDownloadService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ExcelDownloadService = TestBed.get(ExcelDownloadService);
    expect(service).toBeTruthy();
  });
});
