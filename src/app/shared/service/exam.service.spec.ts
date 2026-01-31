import {TestBed} from '@angular/core/testing';
import {firstValueFrom, lastValueFrom} from 'rxjs';
import {mockIPC} from '@tauri-apps/api/mocks';

import {ExamService} from './exam.service';
import {IExam} from "../model/interfaces/exam.interface";
import {IPagedResult} from "../model/interfaces/paged-result.interface";
import {StatusType} from "../model/status-typ.enum";
import {PageOptions} from "../model/classes/page-options.class";
import {IExamOverallStatistics} from "../model/interfaces/exam-overall-statistics.interface";
import Exam from "../model/classes/exam.class";
import {PagedResult} from "../model/classes/paged-result.class";

describe('ExamService', () => {
  let service: ExamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  const sampleExam: IExam = {
    id: 1,
    name: 'Test Exam',
    description: 'Desc',
    questions: [],
    statusType: StatusType.ACTIVE
  };

  const pagedResult: IPagedResult<IExam> = {
    data: [sampleExam],
    totalElements: 1,
    totalPages: 1,
    currentPage: 1
  };

  describe('getAllExams', () => {
    it('should return paged exams', async () => {
      mockIPC((cmd) => {
        if (cmd === 'get_exams') {
          return Promise.resolve(pagedResult);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.getAllExams(PageOptions.default()));
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe(1);
    });
  });

  describe('getExamById', () => {
    it('should return an exam by id', async () => {
      mockIPC((cmd, payload) => {
        if (cmd === 'get_exam' && (payload as any).id === 1) {
          return Promise.resolve(sampleExam);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.getExamById(1));
      expect(result).toEqual(sampleExam);
    });
  });

  describe('updateExam', () => {
    it('should update exam successfully', async () => {
      mockIPC((cmd, payload) => {
        if (cmd === 'update_exam') {
          return Promise.resolve((payload as any).examToUpdate);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.updateExam(sampleExam));
      expect(result).toEqual(sampleExam);
    });
  });

  describe('deleteExam', () => {
    it('should delete exam successfully', async () => {
      mockIPC((cmd, payload) => {
        if (cmd === 'delete_exam' && (payload as any).id === 1) {
          return Promise.resolve(1);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.deleteExam(1));
      expect(result).toBe(1);
    });
  });

  describe('createExam', () => {
    it('should create exam successfully', async () => {
      mockIPC((cmd, payload) => {
        if (cmd === 'create_exam') {
          return Promise.resolve((payload as any).examToCreate);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.createExam(sampleExam));
      expect(result).toEqual(sampleExam);
    });
  });

  describe('searchExams', () => {
    it('should return search results', async () => {
      mockIPC((cmd) => {
        if (cmd === 'search_exams') {
          return Promise.resolve(pagedResult);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.searchExams([], PageOptions.default()));
      expect(result.data.length).toBe(1);
    });

    it('should return default results', async () => {
      mockIPC((cmd) => {
        if (cmd === 'search_exams') {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.searchExams([], PageOptions.default()));
      expect(result).toEqual(PagedResult.default());
    });
  });

  describe('getStatistics', () => {
    it('should return exam statistics', async () => {

      const statistics: IExamOverallStatistics = {
        activeCount: 0,
        archiveCount: 0,
        averageQuestionCount: 0,
        averageSucceedingScore: 0,
        draftCount: 0,
        examCount: 0,
        inactiveCount: 0
      };

      mockIPC((cmd) => {
        if (cmd === 'get_exam_overall_statistics') {
          return Promise.resolve(statistics);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.getStatistics());
      expect(result).toEqual(statistics);

      const errors = await firstValueFrom(service.errors$);
      expect(errors.length).toBe(0);
    });
  });

  describe('validateExam', () => {
    it('should return validation result', async () => {

      const expectedResult = true;

      mockIPC((cmd) => {
        if (cmd === 'validate_exam') {
          return Promise.resolve(expectedResult);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.validateExam(new Exam({} as IExam)));
      expect(result).toBeTruthy();

      const errors = await firstValueFrom(service.errors$);
      expect(errors.length).toBe(0);
    });
  });
});
