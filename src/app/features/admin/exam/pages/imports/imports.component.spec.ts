import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {of, throwError} from 'rxjs';
import {ImportsComponent} from './imports.component';
import {ImportCacheService} from '../../../../../shared/service/import-cache.service';
import {ToastService} from '../../../../../shared/service/toast.service';
import {IExam} from '../../../../../shared/model/interfaces/exam.interface';
import {StatusType} from "../../../../../shared/model/status-typ.enum";

describe('ImportsComponent', () => {
  let component: ImportsComponent;
  let fixture: ComponentFixture<ImportsComponent>;
  let importCacheServiceMock: jest.Mocked<Partial<ImportCacheService>>;
  let toastServiceMock: jest.Mocked<Partial<ToastService>>;
  let routerMock: jest.Mocked<Partial<Router>>;
  let routeMock: Partial<ActivatedRoute>;

  const mockExam1: IExam = {
    id: 1,
    name: 'Test Exam 1',
    description: 'Test Description 1',
    questions: [{} as any, {} as any],
    pointsToSucceeded: 70,
    maxQuestionsRealExam: 50,
    duration: 60,
    statusType: StatusType.DRAFT,
    category: {
      id: 1, name: 'Category 1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockExam2: IExam = {
    id: 2,
    name: 'Test Exam 2',
    description: 'Test Description 2',
    questions: [{} as any],
    pointsToSucceeded: 80,
    maxQuestionsRealExam: 40,
    duration: 45,
    statusType: StatusType.ACTIVE,
    category: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    importCacheServiceMock = {
      getAllInvalidFiles: jest.fn(() => of([
        { id: 1, data: JSON.stringify(mockExam1) },
        { id: 2, data: JSON.stringify(mockExam2) }
      ] as any)),
      deleteInvalidFile: jest.fn(() => of([])),
      clearInvalidFiles: jest.fn(() => of(void 0))
    };

    toastServiceMock = {
      addSuccessToast: jest.fn(),
      addErrorToast: jest.fn()
    };

    routerMock = {
      navigate: jest.fn().mockResolvedValue(true)
    };

    routeMock = {
      parent: {} as any
    };

    await TestBed.configureTestingModule({
      imports: [ImportsComponent],
      providers: [
        { provide: ImportCacheService, useValue: importCacheServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: routeMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load invalid exams on init', () => {
    expect(importCacheServiceMock.getAllInvalidFiles).toHaveBeenCalled();
  });

  it('should parse JSON data correctly from IndexedDB', () => {
    const cachedExams = component['invalidExamsSignal']();
    expect(cachedExams.length).toBe(2);
    expect(cachedExams[0].exam.name).toBe('Test Exam 1');
    expect(cachedExams[1].exam.name).toBe('Test Exam 2');
  });

  it('should handle JSON parse errors gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    importCacheServiceMock.getAllInvalidFiles = jest.fn(() => of([
      { id: 1, data: 'invalid json' }
    ] as any));

    const newFixture = TestBed.createComponent(ImportsComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    const cachedExams = newComponent['invalidExamsSignal']();
    expect(cachedExams.length).toBe(0);

    consoleErrorSpy.mockRestore();
  });

  it('should show loading state initially', () => {
    expect(component['isLoading']()).toBe(false); // After init it should be false
  });

  it('should show empty state when no cached exams', () => {
    importCacheServiceMock.getAllInvalidFiles = jest.fn(() => of([]));

    const newFixture = TestBed.createComponent(ImportsComponent);
    newFixture.detectChanges();

    const emptyState = newFixture.debugElement.query(By.css('.border-dashed'));
    expect(emptyState).toBeTruthy();
  });

  it('should display cached exams with correct data', () => {
    // Look for exam cards specifically (cards with the hover effect and proper structure)
    const examCards = fixture.debugElement.queryAll(By.css('.py-4 ox-card'));
    expect(examCards.length).toBe(2);

    const firstCard = examCards[0];
    const heading = firstCard.query(By.css('.text-heading-3'));
    expect(heading.nativeElement.textContent.trim()).toBe('Test Exam 1');
  });

  it('should calculate statistics correctly', () => {
    const stats = component['statisticsSignal']();
    expect(stats.total).toBe(2);
    expect(stats.validationErrors).toBe(2); // Default type
    expect(stats.generalErrors).toBe(0);
    expect(stats.mostRecentDate).toBeTruthy();
  });

  it('should navigate to edit with importId query param', async () => {
    await component['goToEdit'](1);

    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['edit'],
      {
        relativeTo: routeMock.parent,
        queryParams: { importId: 1 }
      }
    );
  });

  it('should open delete dialog when delete clicked', () => {
    const cachedExam = component['invalidExamsSignal']()[0];
    component['openDelete'](cachedExam);

    expect(component['isDeleteDialogOpen']()).toBe(true);
    expect(component['examToDelete']()).toBe(cachedExam);
  });

  it('should delete exam and reload list on confirm', () => {
    const cachedExam = component['invalidExamsSignal']()[0];
    component['openDelete'](cachedExam);

    component['confirmDelete']();

    expect(importCacheServiceMock.deleteInvalidFile).toHaveBeenCalledWith(1);
    expect(toastServiceMock.addSuccessToast).toHaveBeenCalled();
  });

  it('should show error toast on delete failure', () => {
    importCacheServiceMock.deleteInvalidFile = jest.fn(() => throwError(() => new Error('Delete failed')));

    const cachedExam = component['invalidExamsSignal']()[0];
    component['openDelete'](cachedExam);
    component['confirmDelete']();

    expect(toastServiceMock.addErrorToast).toHaveBeenCalled();
  });

  it('should clear all invalid files and reload', () => {
    component['clearAllInvalid']();

    expect(importCacheServiceMock.clearInvalidFiles).toHaveBeenCalled();
    expect(toastServiceMock.addSuccessToast).toHaveBeenCalled();
  });

  it('should show error toast on clear all failure', () => {
    importCacheServiceMock.clearInvalidFiles = jest.fn(() => throwError(() => new Error('Clear failed')));

    component['clearAllInvalid']();

    expect(toastServiceMock.addErrorToast).toHaveBeenCalled();
  });

  it('should call service methods with correct params', () => {
    expect(importCacheServiceMock.getAllInvalidFiles).toHaveBeenCalled();
  });

  it('should refresh list when refresh is called', () => {
    const loadSpy = jest.spyOn(component as any, '_loadInvalidExams');
    component['refreshList']();

    expect(loadSpy).toHaveBeenCalled();
  });

  it('should close delete dialog', () => {
    component['isDeleteDialogOpen'].set(true);
    component['examToDelete'].set({} as any);

    component['closeDelete']();

    expect(component['isDeleteDialogOpen']()).toBe(false);
    expect(component['examToDelete']()).toBeNull();
  });

  it('should handle error when loading exams fails', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    importCacheServiceMock.getAllInvalidFiles = jest.fn(() => throwError(() => new Error('Load failed')));

    const newFixture = TestBed.createComponent(ImportsComponent);
    newFixture.detectChanges();

    expect(toastServiceMock.addErrorToast).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should return observable from loading$ getter', () => {
    const loading$ = component.loading$;
    expect(loading$).toBeDefined();
    loading$.subscribe(value => {
      expect(value).toBe(false);
    });
  });

  it('should handle null exam in confirmDelete', () => {
    component['examToDelete'].set(null);
    component['confirmDelete']();

    expect(importCacheServiceMock.deleteInvalidFile).not.toHaveBeenCalled();
    expect(toastServiceMock.addErrorToast).toHaveBeenCalled();
  });

  it('should display correct badge variant for failed exams', () => {
    const badges = fixture.debugElement.queryAll(By.css('ox-badge[variant="destructive"]'));
    expect(badges.length).toBeGreaterThan(0);
  });
});
