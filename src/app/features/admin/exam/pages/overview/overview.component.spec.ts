import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { IExam } from '../../../../../shared/model/interfaces/exam.interface';
import { IPagedResult } from '../../../../../shared/model/interfaces/paged-result.interface';
import { ExamService } from '../../../../../shared/service/exam.service';
import { ToastService } from '../../../../../shared/service/toast.service';
import { ExamImportService } from '../../../../../shared/service/exam-import.service';
import { OverviewComponent } from './overview.component';
import { IExamOverallStatistics } from '../../../../../shared/model/interfaces/exam-overall-statistics.interface';

describe('OverviewComponent', () => {
  let component: OverviewComponent;
  let fixture: ComponentFixture<OverviewComponent>;
  let examServiceMock: any;
  let examImportServiceMock: any;
  let routerMock: any;
  let toastMock: any;
  let loading$: BehaviorSubject<boolean>;

  const mockStatistics: IExamOverallStatistics = {
    examCount: 10,
    activeCount: 5,
    draftCount: 3,
    archiveCount: 2,
    inactiveCount: 0,
    averageQuestionCount: 25,
    averageSucceedingScore: 70
  };

  beforeEach(async () => {
    loading$ = new BehaviorSubject<boolean>(false);
    routerMock = { navigate: jest.fn() };
    const routeMock = { parent: {} } as ActivatedRoute;

    const sampleExam: IExam = {
      id: 1,
      name: 'Exam 1',
      description: 'Desc',
      questions: [],
      statusType: 'ACTIVE' as any
    };
    const pagedResult: IPagedResult<IExam> = {
      currentPage: 1,
      data: [sampleExam],
      totalElements: 1,
      totalPages: 1
    };

    examServiceMock = {
      getAllExams: jest.fn(() => of(pagedResult)),
      searchExams: jest.fn(() => of(pagedResult)),
      deleteExam: jest.fn(() => of(1)),
      getStatistics: jest.fn(() => of(mockStatistics)),
      loading$: loading$.asObservable()
    };

    examImportServiceMock = {
      importExams: jest.fn().mockResolvedValue([])
    };

    toastMock = {
      addErrorToast: jest.fn(),
      addSuccessToast: jest.fn(),
      add: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ OverviewComponent ],
      providers: [
        { provide: ExamService, useValue: examServiceMock },
        { provide: ExamImportService, useValue: examImportServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: ToastService, useValue: toastMock },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load exams on init and update signals/streams', (done) => {
    const received: IExam[] = [];
    component.exams.subscribe(v => {
      received.push(...v);
      expect(received.length).toBe(1);
      const current = component['currentPagedResultSignal']();
      expect(current.totalElements).toBe(1);
      done();
    });
  });

  it('should call searchExams on service and update results when term length < 3', () => {
    component.searchExams('ab');
    expect(examServiceMock.searchExams).toHaveBeenCalled();
  });

  it('should show error toast when search returns empty', () => {
    examServiceMock.searchExams.mockReturnValueOnce(of({ currentPage: 1, data: [], totalElements: 0, totalPages: 0 }));
    component.searchExams('a');
    expect(toastMock.addErrorToast).toHaveBeenCalled();
  });

  it('goToEdit without id navigates to edit', async () => {
    await component.goToEdit();
    expect(routerMock.navigate).toHaveBeenCalledWith(['edit'], { relativeTo: expect.any(Object) });
  });

  it('goToEdit with id navigates to edit/id', async () => {
    await component.goToEdit(5);
    expect(routerMock.navigate).toHaveBeenCalledWith(['edit', 5], { relativeTo: expect.any(Object) });
  });

  it('goToQuestion navigates to questions/overview/:id', async () => {
    await component.goToQuestion(9);
    expect(routerMock.navigate).toHaveBeenCalledWith(['questions/overview', 9]);
  });

  it('confirmDelete closes dialog and shows success on success', () => {
    component['_deleteId'] = 1;
    component.confirmDelete();
    expect(examServiceMock.deleteExam).toHaveBeenCalledWith(1);
  });

  it('confirmDelete shows error toast on error', () => {
    examServiceMock.deleteExam.mockReturnValueOnce(throwError(() => new Error('fail')));
    component['_deleteId'] = 2;
    component.confirmDelete();
    expect(toastMock.addErrorToast).toHaveBeenCalled();
  });

  it('loading$ should proxy service loading$', (done) => {
    const sub = component.loading$.subscribe(v => {
      if (v) {
        sub.unsubscribe();
        done();
      }
    });
    loading$.next(true);
  });

  describe('Page navigation', () => {
    it('should update pageOptions when onPageChanged is called', () => {
      const newPageOptions = { elementsPerPage: 20, page: 2 };
      component.onPageChanged(newPageOptions);
      expect(component.pageOptions()).toEqual(newPageOptions);
    });

    it('should reload exams when page changes', () => {
      const initialCallCount = examServiceMock.getAllExams.mock.calls.length;
      component.onPageChanged({ elementsPerPage: 10, page: 2 });
      expect(examServiceMock.getAllExams.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe('Delete dialog', () => {
    it('should open delete dialog when openDelete is called', () => {
      component['openDelete'](5);
      expect(component.isDeleteOpen()).toBe(true);
      expect(component['_deleteId']).toBe(5);
    });

    it('should close delete dialog and reset deleteId when closeDelete is called', () => {
      component['_deleteId'] = 5;
      component.isDeleteOpen.set(true);

      component.closeDelete();

      expect(component.isDeleteOpen()).toBe(false);
      expect(component['_deleteId']).toBeNull();
    });

    it('should show error toast when confirmDelete is called without deleteId', () => {
      component['_deleteId'] = null;
      component.confirmDelete();
      expect(toastMock.addErrorToast).toHaveBeenCalled();
    });
  });
});
