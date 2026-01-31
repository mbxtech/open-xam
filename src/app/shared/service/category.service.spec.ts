import {TestBed} from '@angular/core/testing';
import {lastValueFrom, firstValueFrom} from 'rxjs';
import {mockIPC} from '@tauri-apps/api/mocks';

import {CategoryService} from './category.service';
import {ICategory} from "../model/interfaces/category.interface";
import {IPagedResult} from "../model/interfaces/paged-result.interface";
import {FilterExpressionBuilder} from "../model/interfaces/filter/filter-expression-builder.class";
import {PageOptions} from "../model/classes/page-options.class";

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCategories', () => {
    it('should return categories successfully', async () => {
      const now = new Date();
      const categories: ICategory[] = [
        {id: 1, name: 'A', createdAt: now, updatedAt: now},
        {id: 2, name: 'B', createdAt: now, updatedAt: now},
      ];

      mockIPC((cmd) => {
        if (cmd === 'get_categories') {
          return Promise.resolve(categories);
        }
        return Promise.resolve(null);
      });

      const initialLoading = await firstValueFrom(service.loading$);
      const initialErrors = await firstValueFrom(service.errors$);
      expect(initialLoading).toBe(false);
      expect(initialErrors.length).toBe(0);

      const result = await lastValueFrom(service.getCategories());
      expect(result).toEqual(categories);

      const loading = await firstValueFrom(service.loading$);
      const errors = await firstValueFrom(service.errors$);
      expect(loading).toBe(false);
      expect(errors.length).toBe(0);
    });

    it('should handle error from backend', async () => {
      const errorPayload = {message: 'failed to load'};
      mockIPC((cmd) => {
        if (cmd === 'get_categories') {
          return Promise.reject(errorPayload);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.getCategories());
      expect(result).toBeNull();

      const loading = await firstValueFrom(service.loading$);
      const errors = await firstValueFrom(service.errors$);
      expect(loading).toBe(false);
      expect(errors.length).toBe(1);
      expect(errors[0]).toEqual("failed to load");
    });
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      const now = new Date();
      const toCreate: ICategory = {id: 0, name: 'New', createdAt: now, updatedAt: now};
      const created: ICategory = {id: 10, name: 'New', createdAt: now, updatedAt: now};

      mockIPC((cmd, payload) => {
        if (cmd === 'create_category') {
          return Promise.resolve(created);
        }
        return Promise.resolve(payload);
      });

      const result = await lastValueFrom(service.createCategory(toCreate));
      expect(result).toEqual(created);

      const loading = await firstValueFrom(service.loading$);
      const errors = await firstValueFrom(service.errors$);
      expect(loading).toBe(false);
      expect(errors.length).toBe(0);
    });

    it('should handle error while creating category', async () => {
      const now = new Date();
      const toCreate: ICategory = {id: 0, name: 'New', createdAt: now, updatedAt: now};
      const errorPayload = {message: 'create failed'};

      mockIPC((cmd) => {
        if (cmd === 'create_category') {
          return Promise.reject(errorPayload);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.createCategory(toCreate));
      expect(result).toBeNull();

      const loading = await firstValueFrom(service.loading$);
      const errors = await firstValueFrom(service.errors$);
      expect(loading).toBe(false);
      expect(errors.length).toBe(1);
      expect(errors[0]).toEqual("create failed");
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const now = new Date();
      const toUpdate: ICategory = {id: 5, name: 'Upd', createdAt: now, updatedAt: now};

      mockIPC((cmd) => {
        if (cmd === 'update_category') {
          return Promise.resolve({...toUpdate, name: 'Updated'});
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.updateCategory(toUpdate));
      expect(result).toEqual({...toUpdate, name: 'Updated'});

      const loading = await firstValueFrom(service.loading$);
      const errors = await firstValueFrom(service.errors$);
      expect(loading).toBe(false);
      expect(errors.length).toBe(0);
    });

    it('should handle error while updating category', async () => {
      const now = new Date();
      const toUpdate: ICategory = {id: 5, name: 'Upd', createdAt: now, updatedAt: now};
      const errorPayload = {message: 'update failed'};

      mockIPC((cmd) => {
        if (cmd === 'update_category') {
          return Promise.reject(errorPayload);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.updateCategory(toUpdate));
      expect(result).toBeNull();

      const loading = await firstValueFrom(service.loading$);
      const errors = await firstValueFrom(service.errors$);
      expect(loading).toBe(false);
      expect(errors.length).toBe(1);
      expect(errors[0]).toEqual("update failed");
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      // Note: current implementation calls handler 'update_category'
      const deleted = {id: 9} as unknown as ICategory;

      mockIPC((cmd) => {
        if (cmd === 'delete_category') {
          return Promise.resolve(deleted);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.deleteCategory(9));
      expect(result).toEqual(deleted);

      const loading = await firstValueFrom(service.loading$);
      const errors = await firstValueFrom(service.errors$);
      expect(loading).toBe(false);
      expect(errors.length).toBe(0);
    });

    it('should handle error while deleting category', async () => {
      const errorPayload = {message: 'delete failed'};
      mockIPC((cmd) => {
        if (cmd === 'delete_category') {
          return Promise.reject(errorPayload);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.deleteCategory(123));
      expect(result).toBeNull();

      const loading = await firstValueFrom(service.loading$);
      const errors = await firstValueFrom(service.errors$);
      expect(loading).toBe(false);
      expect(errors.length).toBe(1);
      expect(errors[0]).toEqual("delete failed");
    });
  });

  describe('getCategoryById', () => {
    it('should return a category successfully', async () => {
      const now = new Date();
      const category: ICategory = {id: 3, name: 'C', createdAt: now, updatedAt: now};

      mockIPC((cmd) => {
        if (cmd === 'get_category_by_id') {
          return Promise.resolve(category);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.getCategoryById(3));
      expect(result).toEqual(category);

      const loading = await firstValueFrom(service.loading$);
      const errors = await firstValueFrom(service.errors$);
      expect(loading).toBe(false);
      expect(errors.length).toBe(0);
    });

    it('should handle error while loading a category by id', async () => {
      const errorPayload = {message: 'not found'};

      mockIPC((cmd) => {
        if (cmd === 'get_category_by_id') {
          return Promise.reject(errorPayload);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.getCategoryById(404));
      expect(result).toBeNull();

      const loading = await firstValueFrom(service.loading$);
      const errors = await firstValueFrom(service.errors$);
      expect(loading).toBe(false);
      expect(errors.length).toBe(1);
      expect(errors[0]).toEqual("not found");
    });
  });

  describe('searchCategories', () => {
    it('should return categories successfully', async () => {
      const now = new Date();
      const categories: ICategory[] = [
        {id: 1, name: 'A', createdAt: now, updatedAt: now},
        {id: 2, name: 'B', createdAt: now, updatedAt: now},
      ];
      const pagedResult: IPagedResult<ICategory> = {
        data: categories,
        totalElements: 2,
        totalPages: 1,
        currentPage: 1
      };

      mockIPC((cmd) => {
        if (cmd === 'search_categories') {
          return Promise.resolve(pagedResult);
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.search(FilterExpressionBuilder
          .trees().build(), PageOptions.default()));

      expect(result).toEqual(pagedResult);
      const errors = await firstValueFrom(service.errors$);
      expect(errors.length).toBe(0);

    });

    it('should handle error while searching categories', async () => {
      mockIPC((cmd) => {
        if (cmd === 'search_categories') {
          return Promise.reject({message: 'failed to load'});
        }
        return Promise.resolve(null);
      });

      const result = await lastValueFrom(service.search(FilterExpressionBuilder
          .trees().build(), PageOptions.default()));

      expect(result).toBeNull();
      const errors = await firstValueFrom(service.errors$);
      expect(errors.length).toBe(1);
      expect(errors[0]).toEqual("failed to load");
    });
  });
});
