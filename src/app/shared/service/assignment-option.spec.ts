import {TestBed} from '@angular/core/testing';
import {lastValueFrom} from 'rxjs';
import {mockIPC} from '@tauri-apps/api/mocks';

import {AssignmentOptionService} from './assignment-option';
import {IAssignmentOption} from "../model/interfaces/assignment-option.interface";

describe('AssignmentOptionService', () => {
  let service: AssignmentOptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssignmentOptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('deleteById', () => {
    it('should delete assignment option successfully', async () => {
      mockIPC((cmd, payload) => {
        if (cmd === 'delete_assignment_option' && (payload as any).id === 1) {
          return Promise.resolve(1);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.deleteById(1));
      expect(result).toBe(1);
    });
  });

  describe('update', () => {
    it('should update assignment option successfully', async () => {
      const option: IAssignmentOption = {id: 1, text: 'Updated Option', questionId: 1};
      mockIPC((cmd, payload) => {
        if (cmd === 'update_assignment_option') {
          return Promise.resolve((payload as any).option);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.update(option));
      expect(result?.id).toBe(option.id);
      expect(result?.text).toBe(option.text);
    });
  });

  describe('create', () => {
    it('should create assignment option successfully', async () => {
      const option: IAssignmentOption = {id: 0, text: 'New Option', questionId: 1};
      const createdOption: IAssignmentOption = {...option, id: 10};
      mockIPC((cmd, payload) => {
        if (cmd === 'create_assignment_option') {
          return Promise.resolve(createdOption);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.create(option));
      expect(result).toEqual(createdOption);
    });
  });
});
