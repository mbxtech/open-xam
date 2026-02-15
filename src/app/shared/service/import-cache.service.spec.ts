import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ImportCacheService } from './import-cache.service';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { WithID } from 'ngx-indexed-db';

describe('ImportCacheService', () => {
  let service: ImportCacheService;
  let dbService: jest.Mocked<NgxIndexedDBService>;

  beforeEach(() => {
    const dbMock: jest.Mocked<NgxIndexedDBService> = {
      add: jest.fn(),
      getAll: jest.fn(),
      getByID: jest.fn(),
      clear: jest.fn(),
      delete: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        ImportCacheService,
        { provide: NgxIndexedDBService, useValue: dbMock },
      ],
    });

    service = TestBed.inject(ImportCacheService);
    dbService = TestBed.inject(
        NgxIndexedDBService
    ) as jest.Mocked<NgxIndexedDBService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add invalid file as json', (done) => {
    const json = '{"foo":"bar"}';
    const response = { id: 1, data: json } as { data: string } & WithID;

    dbService.add.mockReturnValue(of(response));

    service.addInvalidFileAsJson(json).subscribe((result) => {
      expect(dbService.add).toHaveBeenCalledWith('cache', { data: json });
      expect(result).toEqual(response);
      done();
    });
  });

  it('should get all invalid files', (done) => {
    const response: WithID[] = [
      { id: 1, data: 'a' },
      { id: 2, data: 'b' },
    ] as any;

    dbService.getAll.mockReturnValue(of(response));

    service.getAllInvalidFiles().subscribe((result) => {
      expect(dbService.getAll).toHaveBeenCalledWith('cache');
      expect(result).toEqual(response);
      done();
    });
  });

  it('should load invalid file by id', (done) => {
    const response = { data: '{"x":1}' };

    dbService.getByID.mockReturnValue(of(response));

    service.loadInvalidFile(42).subscribe((result) => {
      expect(dbService.getByID).toHaveBeenCalledWith('cache', 42);
      expect(result).toEqual(response);
      done();
    });
  });

  it('should clear invalid files', (done) => {
    dbService.clear.mockReturnValue(of(void 0));

    service.clearInvalidFiles().subscribe((result) => {
      expect(dbService.clear).toHaveBeenCalledWith('cache');
      expect(result).toBeUndefined();
      done();
    });
  });

  it('should delete invalid file by id', (done) => {
    const response: unknown[] = [];

    dbService.delete.mockReturnValue(of(response));

    service.deleteInvalidFile(7).subscribe((result) => {
      expect(dbService.delete).toHaveBeenCalledWith('cache', 7);
      expect(result).toEqual(response);
      done();
    });
  });
});