import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, of } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { ExamLearningOverview } from './exam-learning-overview';
import { ExamService } from '../../../../../shared/service/exam.service';
import { ToastService } from '../../../../../shared/service/toast.service';
import { PagedResult } from '../../../../../shared/model/classes/paged-result.class';
import { IExam } from '../../../../../shared/model/interfaces/exam.interface';
import { IExamOverallStatistics } from '../../../../../shared/model/interfaces/exam-overall-statistics.interface';
import { QuestionType } from '../../../../../shared/model/question-type.enum';
import { StatusType } from '../../../../../shared/model/status-typ.enum';
import {D} from "@angular/cdk/keycodes";

describe('ExamLearningOverview', () => {
  let component: ExamLearningOverview;
  let fixture: ComponentFixture<ExamLearningOverview>;
  let examServiceMock: any;
  let toastServiceMock: any;
  let errors$: BehaviorSubject<string[]>;

  const mockExams: IExam[] = [
    {
      id: 1,
      name: 'Exam 1',
      statusType: StatusType.ACTIVE,
      createdAt: new Date('2024-01-01'),
      pointsToSucceeded: 70,
      questions: [
        {id: 1, questionText: 'Q1', type: QuestionType.SINGLE_CHOICE, pointsTotal: 10, answers: []},
        {id: 2, questionText: 'Q2', type: QuestionType.MULTIPLE_CHOICE, pointsTotal: 10, answers: []}
      ],
      category: {
        id: 1, name: 'Category A',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      description: ""
    },
    {
      id: 2,
      name: 'Exam 2',
      statusType: StatusType.ACTIVE,
      createdAt: new Date('2024-01-15'),
      pointsToSucceeded: 80,
      questions: [
        {id: 3, questionText: 'Q3', type: QuestionType.ASSIGNMENT, pointsTotal: 20, answers: []}
      ],
      description: ""
    }
  ];

  const mockPagedResult: PagedResult<IExam> = {
    data: mockExams,
    currentPage: 1,
    totalPages: 2,
    totalElements: 10
  };

  const mockStatistics: IExamOverallStatistics = {
    examCount: 10,
    averageQuestionCount: 25,
    averageSucceedingScore: 75,
    activeCount: 8,
    archiveCount: 1,
    draftCount: 1,
    inactiveCount: 0
  };

  let routerMock: any;
  let activatedRouteMock: any;

  beforeEach(async () => {
    errors$ = new BehaviorSubject<string[]>([]);

    examServiceMock = {
      searchExams: jest.fn(),
      getStatistics: jest.fn(),
      errors$: errors$.asObservable()
    };

    toastServiceMock = {
      addErrorToast: jest.fn()
    };

    routerMock = {
      navigate: jest.fn().mockResolvedValue(true)
    };

    activatedRouteMock = {
      parent: {}
    };

    examServiceMock.searchExams.mockReturnValue(of(mockPagedResult));
    examServiceMock.getStatistics.mockReturnValue(of(mockStatistics));

    await TestBed.configureTestingModule({
      imports: [ExamLearningOverview],
      providers: [
        { provide: ExamService, useValue: examServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExamLearningOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    errors$.complete();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load statistics on init', () => {
      expect(examServiceMock.getStatistics).toHaveBeenCalled();
    });

    it('should set statistics signal with loaded data', () => {
      expect(component.statisticsValue).toEqual(mockStatistics);
    });

    it('should load exams with default page options', () => {
      expect(examServiceMock.searchExams).toHaveBeenCalled();
    });

    it('should initialize with page options', () => {
      expect(component.pageOptions()).toEqual({ elementsPerPage: 6, page: 1 });
    });
  });

  describe('Statistics Display', () => {
    it('should display exam count statistic', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('10');
    });

    it('should display average question count statistic', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('25');
    });

    it('should display average succeeding score statistic', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('75');
    });
  });

  describe('Exam List Display', () => {
    it('should render exam cards for each exam', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const examCards = fixture.debugElement.queryAll(By.css('ox-exam-card'));
      expect(examCards.length).toBe(2);
    });

    it('should pass exam data to exam cards', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const examCards = fixture.debugElement.queryAll(By.css('ox-exam-card'));
      expect(examCards[0].componentInstance.exam()).toEqual(mockExams[0]);
      expect(examCards[1].componentInstance.exam()).toEqual(mockExams[1]);
    });
  });

  describe('Pagination', () => {
    it('should render pagination controls', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const paginationControls = fixture.debugElement.query(By.css('ox-pagination-controls'));
      expect(paginationControls).toBeTruthy();
    });

    it('should reload exams when page options change', () => {
      const initialCallCount = examServiceMock.searchExams.mock.calls.length;

      component.pageOptions.set({ elementsPerPage: 10, page: 2 });
      fixture.detectChanges();

      expect(examServiceMock.searchExams.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should update currentPagedResult when exams are loaded', async () => {
      await fixture.whenStable();

      // @ts-ignore
      expect(component.currentPagedResult()).toEqual(mockPagedResult);
    });
  });

  describe('Page Header', () => {
    it('should render page header', () => {
      const pageHeader = fixture.debugElement.query(By.css('ox-page-header'));
      expect(pageHeader).toBeTruthy();
    });

    it('should display page title', () => {
      const pageHeader = fixture.debugElement.query(By.css('ox-page-header'));
      expect(pageHeader.componentInstance.title).toBeTruthy();
    });

    it('should display page subtitle', () => {
      const pageHeader = fixture.debugElement.query(By.css('ox-page-header'));
      expect(pageHeader.componentInstance.subTitle).toBeTruthy();
    });
  });

  describe('Info Card', () => {
    it('should display info card with instructions', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const infoCards = fixture.debugElement.queryAll(By.css('ox-card'));
      expect(infoCards.length).toBeGreaterThan(0);
    });

    it('should display simulation mode description', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Simulation');
    });

    it('should display real mode description', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Real mode');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no exams are available', async () => {
      examServiceMock.searchExams.mockReturnValue(of({
        data: [],
        currentPage: 1,
        totalPages: 0,
        totalElements: 0
      }));

      component.pageOptions.set({ elementsPerPage: 6, page: 1 });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const emptyState = (fixture.nativeElement as HTMLElement).querySelector('.text-center.py-16');
      expect(emptyState).toBeTruthy();
    });

    it('should display no exams message in empty state', async () => {
      examServiceMock.searchExams.mockReturnValue(of(null));

      component.pageOptions.set({ elementsPerPage: 6, page: 1 });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('No active exams available');
    });

    it('should not render exam cards when no exams', async () => {
      examServiceMock.searchExams.mockReturnValue(of({
        data: [],
        currentPage: 1,
        totalPages: 0,
        totalElements: 0
      }));

      component.pageOptions.set({ elementsPerPage: 6, page: 1 });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const examCards = fixture.debugElement.queryAll(By.css('ox-exam-card'));
      expect(examCards.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should show error toast when exam service emits errors', () => {
      errors$.next(['Error loading exams']);

      expect(toastServiceMock.addErrorToast).toHaveBeenCalledWith(
        expect.any(String),
        'Error loading exams'
      );
    });

    it('should show multiple error toasts for multiple errors', () => {
      errors$.next(['Error 1', 'Error 2']);

      expect(toastServiceMock.addErrorToast).toHaveBeenCalledTimes(2);
    });

    it('should not show toast when errors array is empty', () => {
      toastServiceMock.addErrorToast.mockClear();
      errors$.next([]);

      expect(toastServiceMock.addErrorToast).not.toHaveBeenCalled();
    });
  });

  describe('Exam Loading', () => {
    it('should filter exams by Active status', () => {
      expect(examServiceMock.searchExams).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(Object)]),
        expect.any(Object)
      );
    });

    it('should pass page options to search', () => {
      const pageOpts = { elementsPerPage: 12, page: 3 };
      component.pageOptions.set(pageOpts);
      fixture.detectChanges();

      expect(examServiceMock.searchExams).toHaveBeenCalledWith(
        expect.any(Array),
        pageOpts
      );
    });

    it('should return observable from loadExamsWithPageOptions', () => {
      const result = component.loadExamsWithPageOptions();
      expect(result).toBeDefined();
    });

    it('should expose exams$ observable', () => {
      expect(component.exams$).toBeDefined();
    });
  });

  describe('Statistics Card', () => {
    it('should render statistics card', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const statisticsCard = fixture.debugElement.queryAll(By.css('ox-card')).find(card =>
        card.nativeElement.textContent.includes('Available exams')
      );
      expect(statisticsCard).toBeTruthy();
    });

    it('should display dividers between statistics', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const dividers = fixture.nativeElement.querySelectorAll('.bg-neutral-border');
      expect(dividers.length).toBeGreaterThan(0);
    });
  });

  describe('Grid Layout', () => {
    it('should use grid layout for exam cards', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const grid = fixture.nativeElement.querySelector('.grid');
      expect(grid).toBeTruthy();
    });

    it('should have responsive grid columns', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const grid = fixture.nativeElement.querySelector('.grid');
      expect(grid.classList.contains('grid-cols-1')).toBe(true);
      expect(grid.classList.contains('md:grid-cols-3')).toBe(true);
      expect(grid.classList.contains('lg:grid-cols-5')).toBe(true);
    });
  });

  describe('Page Options Effect', () => {
    it('should reload exams when page options change', () => {
      const initialCallCount = examServiceMock.searchExams.mock.calls.length;

      component.pageOptions.set({ elementsPerPage: 6, page: 2 });
      fixture.detectChanges();

      expect(examServiceMock.searchExams.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should update exams$ observable when page options change', () => {
      component.pageOptions.set({ elementsPerPage: 10, page: 1 });
      fixture.detectChanges();

      expect(component.exams$).toBeDefined();
    });
  });

  describe('Statistics Update', () => {
    it('should update statistics when service returns new data', () => {
      const newStatistics: IExamOverallStatistics = {
        examCount: 20,
        averageQuestionCount: 30,
        averageSucceedingScore: 80,
        activeCount: 15,
        archiveCount: 2,
        draftCount: 3,
        inactiveCount: 0
      };

      examServiceMock.getStatistics.mockReturnValue(of(newStatistics));

      const newComponent = TestBed.createComponent(ExamLearningOverview).componentInstance;

      expect(newComponent.statisticsValue.examCount).toBe(20);
      expect(newComponent.statisticsValue.averageQuestionCount).toBe(30);
      expect(newComponent.statisticsValue.averageSucceedingScore).toBe(80);
    });

    it('should handle null statistics response', () => {
      examServiceMock.getStatistics.mockReturnValue(of(null));

      const newFixture = TestBed.createComponent(ExamLearningOverview);
      newFixture.detectChanges();

      // Should not crash
      expect(newFixture.componentInstance).toBeTruthy();
    });
  });
});
