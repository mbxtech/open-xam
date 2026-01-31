import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {BehaviorSubject, of, throwError} from 'rxjs';
import {FormControl, FormGroup} from '@angular/forms';

import {CategorySelectComponent} from './category-select.component';
import {CategoryService} from '../../service/category.service';
import {ToastService} from '../../service/toast.service';
import {DynamicSelectComponent} from '../../forms/dynamic-select/dynamic-select.component';

describe('CategorySelectComponent', () => {
  let component: CategorySelectComponent;
  let fixture: ComponentFixture<CategorySelectComponent>;
  let categoryServiceMock: any;
  let toastServiceMock: any;
  let errors$: BehaviorSubject<any[]>;

  beforeEach(async () => {
    errors$ = new BehaviorSubject<any[]>([]);
    categoryServiceMock = {
      getCategories: jest.fn(),
      createCategory: jest.fn(),
      errors$: errors$.asObservable(),
    };
    toastServiceMock = {
      add: jest.fn()
    };

    categoryServiceMock.getCategories.mockReturnValue(of({data: [{id: 1, name: 'Cat A', examId: 1}, {id: 2, name: 'Cat B', examId: 1}]}));
    categoryServiceMock.createCategory.mockReturnValue(of({id: 3, name: 'My Category', examId: 1}));

    await TestBed.configureTestingModule({
      imports: [CategorySelectComponent],
      providers: [
        {provide: CategoryService, useValue: categoryServiceMock},
        {provide: ToastService, useValue: toastServiceMock},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategorySelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', new FormGroup({
      id: new FormControl(),
      name: new FormControl(),
    }));
    fixture.detectChanges();
  });

  afterEach(() => {
    errors$.complete();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should call CategoryService.getCategories on init', () => {
      expect(categoryServiceMock.getCategories).toHaveBeenCalled();
    });

    it('should populate DynamicSelect options from categories', () => {
      const ds = fixture.debugElement.query(By.directive(DynamicSelectComponent))?.componentInstance as DynamicSelectComponent;
      expect(ds).toBeTruthy();
      expect(ds.options.length).toBe(2);
      expect(ds.options[0].label).toBe('Cat A');
      expect(ds.options[1].label).toBe('Cat B');
    });

    it('should set selectCategoryControl value from formGroup id', () => {
      const formGroup = new FormGroup({
        id: new FormControl(2),
        name: new FormControl('Cat B'),
      });

      fixture.componentRef.setInput('formGroup', formGroup);
      fixture.detectChanges();

      // @ts-ignore
      expect(component.selectCategoryControl.value).toBe(2);
    });
  });

  describe('Category Loading', () => {
    it('should reload categories when reloadCategories is called', () => {
      const callCount = categoryServiceMock.getCategories.mock.calls.length;
      component['reloadCategories']();
      expect(categoryServiceMock.getCategories).toHaveBeenCalledTimes(callCount + 1);
    });

    it('should update categories$ observable after loading', (done) => {
      // @ts-ignore
      component.categories$.subscribe(categories => {
        if (categories.length > 0) {
          expect(categories.length).toBe(2);
          expect(categories[0].label).toBe('Cat A');
          expect(categories[0].value).toBe(1);
          done();
        }
      });
    });

    it('should handle empty categories from service', () => {
      categoryServiceMock.getCategories.mockReturnValue(of({data: []}));
      component['_loadCategories']();
      fixture.detectChanges();

      const ds = fixture.debugElement.query(By.directive(DynamicSelectComponent))?.componentInstance as DynamicSelectComponent;
      // Should keep previous categories because it only updates if data.length > 0
      expect(ds.options.length).toBe(2);
    });

    it('should handle null/undefined response from service', () => {
      categoryServiceMock.getCategories.mockReturnValue(of(null));
      component['_loadCategories']();
      fixture.detectChanges();

      // Should not crash and keep existing categories
      const ds = fixture.debugElement.query(By.directive(DynamicSelectComponent))?.componentInstance as DynamicSelectComponent;
      expect(ds.options.length).toBe(2);
    });
  });

  describe('Category Selection', () => {
    it('should update formGroup when category is selected', (done) => {
      // @ts-ignore
      component.selectCategoryControl.setValue(1);
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.formGroup().get('id')?.value).toBe(1);
        expect(component.formGroup().get('name')?.value).toBe('Cat A');
        done();
      }, 100);
    });

    it('should not update formGroup when invalid value is selected', () => {
      const initialId = component.formGroup().get('id')?.value;
      // @ts-ignore
      component.selectCategoryControl.setValue(999); // Non-existent category
      fixture.detectChanges();

      expect(component.formGroup().get('id')?.value).toBe(initialId);
    });

    it('should handle null selection', () => {
      // @ts-ignore
      component.selectCategoryControl.setValue(null);
      fixture.detectChanges();

      // Should not crash or update form
      expect(component).toBeTruthy();
    });
  });

  describe('Category Creation', () => {
    it('should show validation toast when creating with empty value', () => {
      component.newCategoryControl.setValue('');
      component['createCategory']();

      expect(toastServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'danger'
        })
      );
      expect(categoryServiceMock.createCategory).not.toHaveBeenCalled();
    });

    it('should show validation toast when creating with null value', () => {
      component.newCategoryControl.setValue(null);
      component['createCategory']();

      expect(toastServiceMock.add).toHaveBeenCalled();
      expect(categoryServiceMock.createCategory).not.toHaveBeenCalled();
    });

    it('should create category, reset input, reload and show success toast', () => {
      const reloadSpy = jest.spyOn(component as any, 'reloadCategories');
      component.newCategoryControl.setValue('My Category');
      component['createCategory']();

      expect(categoryServiceMock.createCategory).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My Category' })
      );
      expect(component.newCategoryControl.value).toBeNull();
      expect(reloadSpy).toHaveBeenCalled();
      expect(toastServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success'
        })
      );
    });

    it('should show error toast when category creation fails', () => {
      categoryServiceMock.createCategory.mockReturnValue(
        throwError(() => new Error('Server error'))
      );

      component.newCategoryControl.setValue('New Cat');
      component['createCategory']();

      expect(toastServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'danger',
          title: expect.stringContaining('Error creating category')
        })
      );
    });

    it('should not reset input when creation fails', () => {
      categoryServiceMock.createCategory.mockReturnValue(
        throwError(() => new Error('Server error'))
      );

      component.newCategoryControl.setValue('New Cat');
      component['createCategory']();

      // Value should remain after error
      expect(component.newCategoryControl.value).toBe('New Cat');
    });

    it('should handle service returning null on creation', () => {
      categoryServiceMock.createCategory.mockReturnValue(of(null));

      component.newCategoryControl.setValue('New Cat');
      component['createCategory']();

      // Should not call reload or success toast when response is null
      expect(toastServiceMock.add).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      );
    });
  });

  describe('Error Handling', () => {
    it('should show error toast when BaseService emits errors$', () => {
      errors$.next(['Something went wrong']);

      expect(toastServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'danger',
          message: 'Something went wrong'
        })
      );
    });

    it('should show error toast with multiple errors', () => {
      errors$.next(['Error 1', 'Error 2', 'Error 3']);

      expect(toastServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'danger',
          message: 'Error 1, Error 2, Error 3'
        })
      );
    });

    it('should not show toast when errors$ emits empty array', () => {
      toastServiceMock.add.mockClear();
      errors$.next([]);

      expect(toastServiceMock.add).not.toHaveBeenCalled();
    });
  });

  describe('Form Integration', () => {
    it('should expose newCategoryControl getter', () => {
      expect(component.newCategoryControl).toBeDefined();
      expect(component.newCategoryControl.value).toBe('');
    });

    it('should have validators on newCategoryControl', () => {
      component.newCategoryControl.setValue('abc'); // Less than min length 5
      expect(component.newCategoryControl.valid).toBe(false);

      component.newCategoryControl.setValue('abcdef'); // More than min length
      expect(component.newCategoryControl.valid).toBe(true);
    });

    it('should expose categories$ observable', () => {
      // @ts-ignore
      expect(component.categories$).toBeDefined();
      // @ts-ignore
      expect(component.categories$).toBeInstanceOf(Object);
    });
  });

  describe('Component Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const subscription = (component as any)._subscriptions$;
      jest.spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });

    it('should complete categories$ on destroy', () => {
      const categories$ = (component as any)._categories$;
      jest.spyOn(categories$, 'unsubscribe');

      component.ngOnDestroy();

      expect(categories$.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('UI Elements', () => {
    it('should render DynamicSelectComponent', () => {
      const dynamicSelect = fixture.debugElement.query(By.directive(DynamicSelectComponent));
      expect(dynamicSelect).toBeTruthy();
    });

    it('should render BasicInputComponent for new category', () => {
      const basicInput = fixture.debugElement.query(By.css('ox-basic-input'));
      expect(basicInput).toBeTruthy();
    });

    it('should render create button', () => {
      const createButton = fixture.debugElement.query(By.css('ox-button'));
      expect(createButton).toBeTruthy();
    });

    it('should render reload button', () => {
      const reloadButton = fixture.debugElement.queryAll(By.css('ox-button'))[1];
      expect(reloadButton).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle categories with same name but different ids', () => {
      categoryServiceMock.getCategories.mockReturnValue(of({
        data: [
          {id: 1, name: 'Category', examId: 1},
          {id: 2, name: 'Category', examId: 1}
        ]
      }));

      component['_loadCategories']();
      fixture.detectChanges();

      // @ts-ignore
      component.categories$.subscribe(categories => {
        expect(categories.length).toBe(2);
        expect(categories[0].value).toBe(1);
        expect(categories[1].value).toBe(2);
      });
    });

    it('should map categories to select options with correct structure', () => {
      // @ts-ignore
      component.categories$.subscribe(categories => {
        categories.forEach((option, index) => {
          expect(option).toHaveProperty('value');
          expect(option).toHaveProperty('label');
          expect(option).toHaveProperty('id');
          // @ts-ignore
          expect(option.id).toBe(index);
        });
      });
    });
  });
});
