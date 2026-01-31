import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditComponent } from './edit.component';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../../../../shared/service/exam.service';
import { ToastService } from '../../../../../shared/service/toast.service';
import { ImportCacheService } from '../../../../../shared/service/import-cache.service';
import { CategoryService } from '../../../../../shared/service/category.service';
import { of, BehaviorSubject } from 'rxjs';
import { StatusType } from '../../../../../shared/model/status-typ.enum';

describe('EditComponent', () => {
  let component: EditComponent;
  let fixture: ComponentFixture<EditComponent>;
  let examServiceMock: any;
  let toastServiceMock: any;
  let routerMock: any;
  let activatedRouteMock: any;
  let importCacheServiceMock: any;
  let categoryServiceMock: any;
  let errorsSubject: BehaviorSubject<any[]>;

  beforeEach(async () => {
    errorsSubject = new BehaviorSubject<any[]>([]);
    examServiceMock = {
      getExamById: jest.fn().mockReturnValue(of(null)),
      createExam: jest.fn().mockReturnValue(of({ id: 1, name: 'New Exam' })),
      updateExam: jest.fn().mockReturnValue(of({ id: 1, name: 'Updated Exam' })),
      errors$: errorsSubject.asObservable(),
      loading$: of(false)
    };

    toastServiceMock = {
      addErrorToast: jest.fn(),
      add: jest.fn()
    };

    routerMock = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true))
    };

    activatedRouteMock = {
      snapshot: {
        params: {},
        queryParams: {}
      },
      parent: {}
    };

    importCacheServiceMock = {
      loadInvalidFiel: jest.fn().mockReturnValue(of({ data: '' })),
      deleteInvalidFile: jest.fn().mockReturnValue(of(true))
    };

    categoryServiceMock = {
      getCategories: jest.fn().mockReturnValue(of([])),
      loading$: of(false),
      errors$: of([])
    };

    await TestBed.configureTestingModule({
      imports: [EditComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: ExamService, useValue: examServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ImportCacheService, useValue: importCacheServiceMock },
        { provide: CategoryService, useValue: categoryServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    fixture.detectChanges();
    expect(component.formGroup.get('id')?.value).toBeNull();
    expect(component.formGroup.get('statusType')?.value).toBe(StatusType.DRAFT);
  });

  it('should load exam when id is provided in route', () => {
    const examData = { id: 123, name: 'Test Exam', pointsToSucceeded: 10, maxQuestionsRealExam: 5, duration: 60, questions: [] };
    activatedRouteMock.snapshot.params['id'] = '123';
    examServiceMock.getExamById.mockReturnValue(of(examData));

    fixture = TestBed.createComponent(EditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(examServiceMock.getExamById).toHaveBeenCalledWith(123);
    expect(component.formGroup.get('name')?.value).toBe('Test Exam');
    expect(component.exam?.id).toBe(123);
  });

  it('should call createExam on submit when no exam loaded', () => {
    fixture.detectChanges();
    component.formGroup.patchValue({
      name: 'New Exam',
      pointsToSucceeded: 10,
      maxQuestionsRealExam: 5,
      duration: 60
    });

    component.submit();

    expect(examServiceMock.createExam).toHaveBeenCalled();
    expect(toastServiceMock.add).toHaveBeenCalledWith(expect.objectContaining({
      type: 'success'
    }));
    expect(routerMock.navigate).toHaveBeenCalledWith(['overview'], expect.any(Object));
  });

  it('should call updateExam on submit when exam id exists', () => {
    const examData = { id: 123, name: 'Test Exam', pointsToSucceeded: 10, maxQuestionsRealExam: 5, duration: 60, questions: [] };
    activatedRouteMock.snapshot.params['id'] = '123';
    examServiceMock.getExamById.mockReturnValue(of(examData));

    fixture = TestBed.createComponent(EditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.formGroup.patchValue({ name: 'Updated Name' });
    component.submit();

    expect(examServiceMock.updateExam).toHaveBeenCalled();
    expect(toastServiceMock.add).toHaveBeenCalledWith(expect.objectContaining({
      type: 'success'
    }));
  });

  it('should show error toast when form is invalid on submit', () => {
    fixture.detectChanges();
    component.formGroup.patchValue({ name: '' }); // Invalid name
    component.submit();

    expect(toastServiceMock.add).toHaveBeenCalledWith(expect.objectContaining({
      type: 'danger'
    }));
    expect(examServiceMock.createExam).not.toHaveBeenCalled();
  });

  it('should show error toasts when service emits errors', () => {
    fixture.detectChanges();
    errorsSubject.next([{ message: 'Error 1' }]);
    expect(toastServiceMock.addErrorToast).toHaveBeenCalled();
  });

  it('should update statusType in form when statusTypeChanged is called', () => {
    fixture.detectChanges();
    component['statusTypeChanged'](StatusType.ACTIVE);
    expect(component.formGroup.get('statusType')?.value).toBe(StatusType.ACTIVE);
  });
});
