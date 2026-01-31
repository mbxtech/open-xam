import {TestBed} from '@angular/core/testing';
import {lastValueFrom} from 'rxjs';
import {mockIPC} from '@tauri-apps/api/mocks';

import {QuestionService} from './question.service';
import {IQuestion} from "../model/interfaces/question.interface";
import {QuestionType} from "../model/question-type.enum";

describe('QuestionService', () => {
  let service: QuestionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuestionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  const sampleQuestion: IQuestion = {
    id: 1,
    questionText: 'Test Question',
    type: QuestionType.SINGLE_CHOICE,
    answers: [],
    pointsTotal: 10,
    examId: 1
  };

  describe('getQuestionsByExamId', () => {
    it('should return questions for an exam', async () => {
      mockIPC((cmd, payload) => {
        if (cmd === 'get_questions_by_exam_id' && (payload as any).examId === 1) {
          return Promise.resolve([sampleQuestion]);
        }
        return Promise.resolve([]);
      });

      const result = await lastValueFrom(service.getQuestionsByExamId(1));
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);
    });

    it('should return empty array if no questions found', async () => {
      mockIPC((cmd) => {
        if (cmd === 'get_questions_by_exam_id') {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.getQuestionsByExamId(1));
      expect(result).toEqual([]);
    });
  });

  describe('getQuestionsById', () => {
    it('should return a question by id', async () => {
      mockIPC((cmd, payload) => {
        if (cmd === 'get_question' && (payload as any).id === 1) {
          return Promise.resolve(sampleQuestion);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.getQuestionsById(1));
      expect(result).toEqual(sampleQuestion);
    });
  });

  describe('createQuestion', () => {
    it('should create question successfully', async () => {
      mockIPC((cmd, payload) => {
        if (cmd === 'create_question') {
          return Promise.resolve((payload as any).questionToCreate);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.createQuestion(sampleQuestion));
      expect(result).toEqual(sampleQuestion);
    });
  });

  describe('updateQuestion', () => {
    it('should update question successfully', async () => {
      mockIPC((cmd, payload) => {
        if (cmd === 'update_question') {
          return Promise.resolve((payload as any).questionToUpdate);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.updateQuestion(sampleQuestion));
      expect(result).toEqual(sampleQuestion);
    });
  });

  describe('deleteQuestion', () => {
    it('should call delete via update_question handler (as implemented)', async () => {
      mockIPC((cmd, payload) => {
        if (cmd === 'delete_question' && (payload as any).id === 1) {
          return Promise.resolve(1);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.deleteQuestion(1));
      expect(result).toBe(1);
    });
  });
});
