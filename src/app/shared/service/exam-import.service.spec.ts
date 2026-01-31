import { TestBed } from '@angular/core/testing';
import { ExamImportService } from './exam-import.service';
import { of, throwError } from 'rxjs';
import { ImportCacheService } from './import-cache.service';
import { ExamService } from './exam.service';

describe('ExamImportService', () => {
  let service: ExamImportService;
  let cacheService: jest.Mocked<ImportCacheService>;
  let examService: jest.Mocked<ExamService>;

  const mockExam = { name: 'Test Exam' } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExamImportService,
        {
          provide: ImportCacheService,
          useValue: {
            clearInvalidFiles: jest.fn(),
            addInvalidFileAsJson: jest.fn(),
          },
        },
        {
          provide: ExamService,
          useValue: {
            validateExam: jest.fn(),
            createExam: jest.fn(),
          },
        },
      ],
    });

    service = TestBed.inject(ExamImportService);
    cacheService = TestBed.inject(
        ImportCacheService
    ) as jest.Mocked<ImportCacheService>;
    examService = TestBed.inject(
        ExamService
    ) as jest.Mocked<ExamService>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });


  it('should import multiple exams', async () => {
    const spy = jest
        .spyOn(service, 'importExam')
        .mockResolvedValue({ success: true, id: '1' });

    const files = [
      { id: '1', name: 'a.json', type: 'application/json', data: '{}' },
      { id: '2', name: 'b.json', type: 'application/json', data: '{}' },
    ] as any[];

    const result = await service.importExams(files);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(result.length).toBe(2);
  });

  it('should import JSON exam successfully', async () => {
    jest
        .spyOn<any, any>(service['_importer'], 'importExamFromJSON')
        .mockReturnValue(mockExam);

    cacheService.clearInvalidFiles.mockReturnValue(of(void 0));
    examService.validateExam.mockReturnValue(of(true));
    examService.createExam.mockReturnValue(of(mockExam));

    const file = {
      id: 'file-1',
      name: 'exam.json',
      type: 'application/json',
      data: '{}',
    } as any;

    const result = await service.importExam(file);

    expect(result).toEqual({ success: true, id: 'file-1' });
    expect(examService.createExam).toHaveBeenCalledWith(mockExam);
  });

  it('should import TXT exam successfully', async () => {
    jest
        .spyOn<any, any>(service['_importer'], 'importFromTxt')
        .mockReturnValue(mockExam);

    cacheService.clearInvalidFiles.mockReturnValue(of(void 0));
    examService.validateExam.mockReturnValue(of(true));
    examService.createExam.mockReturnValue(of(mockExam));

    const file = {
      id: 'file-1',
      name: 'exam.txt',
      type: 'text/plain',
      data: 'test',
    } as any;

    const result = await service.importExam(file);

    expect(result).toEqual({ success: true, id: 'file-1' });
    expect(examService.createExam).toHaveBeenCalledWith(mockExam);
  });

  it('should fail on unsupported file type', async () => {
    cacheService.clearInvalidFiles.mockReturnValue(of(void 0));

    const file = {
      id: 'x',
      name: 'exam.xml',
      type: 'application/xml',
      data: '<xml />',
    } as any;

    const result = await service.importExam(file);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe('error');
  });

  it('should cache invalid exam when validation fails', async () => {
    jest
        .spyOn<any, any>(service['_importer'], 'importExamFromJSON')
        .mockReturnValue(mockExam);

    cacheService.clearInvalidFiles.mockReturnValue(of(void 0));
    examService.validateExam.mockReturnValue(of(false));
    cacheService.addInvalidFileAsJson.mockReturnValue(
        of({ id: 99, data: '{}' } as any)
    );

    const file = {
      id: 'file-2',
      name: 'bad.json',
      type: 'application/json',
      data: '{}',
    } as any;

    const result = await service.importExam(file);

    expect(result).toEqual({
      success: false,
      errorType: 'validation-error',
      invalidCacheId: 99,
      id: 'file-2',
    });
  });

  it('should fail if exam creation fails', async () => {
    jest
        .spyOn<any, any>(service['_importer'], 'importExamFromJSON')
        .mockReturnValue(mockExam);

    cacheService.clearInvalidFiles.mockReturnValue(of(void 0));
    examService.validateExam.mockReturnValue(of(true));
    examService.createExam.mockReturnValue(of(null));

    const file = {
      id: 'file-3',
      name: 'exam.json',
      type: 'application/json',
      data: '{}',
    } as any;

    const result = await service.importExam(file);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe('error');
  });

  it('should handle validation observable error', async () => {
    jest
        .spyOn<any, any>(service['_importer'], 'importExamFromJSON')
        .mockReturnValue(mockExam);

    cacheService.clearInvalidFiles.mockReturnValue(of(void 0));
    examService.validateExam.mockReturnValue(throwError(() => new Error('boom')));
    cacheService.addInvalidFileAsJson.mockReturnValue(
        of({ id: 5, data: '{}' } as any)
    );

    const file = {
      id: 'file-4',
      name: 'exam.json',
      type: 'application/json',
      data: '{}',
    } as any;

    const result = await service.importExam(file);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe('validation-error');
  });
});