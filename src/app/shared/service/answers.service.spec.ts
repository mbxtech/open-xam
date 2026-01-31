import {TestBed} from '@angular/core/testing';
import {lastValueFrom} from 'rxjs';
import {mockIPC} from '@tauri-apps/api/mocks';

import {AnswersService} from './answers.service';
import {IAnswer} from "../model/interfaces/answer.interface";

describe('AnswersService', () => {
  let service: AnswersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnswersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('deleteAnswerById', () => {
    it('should delete answer successfully', async () => {
      mockIPC((cmd, payload) => {
        if (cmd === 'delete_answer' && (payload as any).id === 1) {
          return Promise.resolve(1);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.deleteAnswerById(1));
      expect(result).toBe(1);
    });

    it('should handle error during deletion', async () => {
      const errorPayload = {message: 'delete failed'};
      mockIPC((cmd) => {
        if (cmd === 'delete_answer') {
          return Promise.reject(errorPayload);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.deleteAnswerById(1));
      expect(result).toBeNull();
    });
  });

  describe('updateAnswer', () => {
    it('should update answer successfully', async () => {
      const answer: IAnswer = {id: 1, answerText: 'Updated Answer', isCorrect: true, questionId: 1};
      mockIPC((cmd, payload) => {
        if (cmd === 'update_answer') {
          return Promise.resolve((payload as any).answer);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.updateAnswer(answer));
      expect(result).toEqual(answer);
    });
  });

  describe('createAnswer', () => {
    it('should create answer successfully', async () => {
      const answer: IAnswer = {id: 0, answerText: 'New Answer', isCorrect: false, questionId: 1};
      const createdAnswer: IAnswer = {...answer, id: 10};
      mockIPC((cmd, payload) => {
        if (cmd === 'create_answer') {
          return Promise.resolve(createdAnswer);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.createAnswer(answer));
      expect(result).toEqual(createdAnswer);
    });
  });
});
