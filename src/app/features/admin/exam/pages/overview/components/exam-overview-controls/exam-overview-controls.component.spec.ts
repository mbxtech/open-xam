import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {ExamOverviewControlsComponent} from './exam-overview-controls.component';
import {StatusType} from '../../../../../../../shared/model/status-typ.enum';
import {ActivatedRoute, Router} from '@angular/router';
import {ExamImportService} from '../../../../../../../shared/service/exam-import.service';
import {ToastService} from '../../../../../../../shared/service/toast.service';

describe('ExamOverviewControls', () => {
  let component: ExamOverviewControlsComponent;
  let fixture: ComponentFixture<ExamOverviewControlsComponent>;
  let routerMock: any;
  let activatedRouteMock: any;
  let examImportServiceMock: jest.Mocked<Partial<ExamImportService>>;
  let toastServiceMock: jest.Mocked<Partial<ToastService>>;

  beforeEach(async () => {
    routerMock = {
      navigate: jest.fn()
    };
    activatedRouteMock = {
      parent: {}
    };
    examImportServiceMock = {
      importExams: jest.fn().mockResolvedValue([])
    };
    toastServiceMock = {
      addSuccessToast: jest.fn(),
      addErrorToast: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ExamOverviewControlsComponent],
      providers: [
        {provide: Router, useValue: routerMock},
        {provide: ActivatedRoute, useValue: activatedRouteMock},
        {provide: ExamImportService, useValue: examImportServiceMock},
        {provide: ToastService, useValue: toastServiceMock}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamOverviewControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit searchChange when ox-input emits valueChange', () => {
    const spy = jest.spyOn(component.searchChange, 'emit');
    const inputDebugEl = fixture.debugElement.query(By.css('ox-input'));
    expect(inputDebugEl).toBeTruthy();

    // Simulate the custom event from the child component
    inputDebugEl.triggerEventHandler('valueChange', 'hello');
    expect(spy).toHaveBeenCalledWith('hello');
  });

  it('should emit statusTypeEvent when select changes', () => {
    const spy = jest.spyOn(component.statusTypeEvent, 'emit');
    component['examStatusControl'].setValue('ACTIVE');
    expect(spy).toHaveBeenCalledWith('ACTIVE' as StatusType);
  });

  it('should stop emitting after destroy (subscriptions cleaned up)', () => {
    const spy = jest.spyOn(component.statusTypeEvent, 'emit');
    // Initial change emits once
    component['examStatusControl'].setValue('DRAFT');
    expect(spy).toHaveBeenLastCalledWith('DRAFT' as StatusType);

    // Destroy and then change again should not emit further
    component.ngOnDestroy();
    spy.mockClear();
    component['examStatusControl'].setValue('ARCHIVED');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should navigate to edit on goToEdit', async () => {
    await component.goToEdit();
    expect(routerMock.navigate).toHaveBeenCalledWith(['edit'], {relativeTo: activatedRouteMock.parent});
  });

  describe('Import functionality', () => {
    it('should call importExams service when importing files', async () => {
      const mockFiles = [{name: 'test.json', content: '{}'}];
      await component.importExam(mockFiles as any);
      expect(examImportServiceMock.importExams).toHaveBeenCalledWith(mockFiles);
    });

    it('should show error toast when import fails', async () => {
      jest.mocked(examImportServiceMock.importExams!).mockRejectedValueOnce(new Error('Import failed'));
      await component.importExam([{name: 'test.json', content: '{}'}] as any);
      expect(toastServiceMock.addErrorToast).toHaveBeenCalled();
    });

    it('should update file errors when import has validation errors', async () => {
      const mockResult = [{
        success: false,
        errorType: 'validation-error',
        id: 'file-1',
        invalidCacheId: 'cache-123'
      }];
      jest.mocked(examImportServiceMock.importExams!).mockResolvedValueOnce(mockResult as any);

      // Set up an uploaded file first
      component['uploadedFiles'].set([{
        id: 'file-1',
        name: 'test.json',
        size: 100,
        type: 'application/json',
        file: new File(['{}'], 'test.json'),
        status: {status: 'uploading', progress: 0}
      }]);

      await component.importExam([{name: 'test.json', content: '{}'}] as any);

      const errors = component['fileErrors']();
      expect(errors.length).toBe(1);
    });
  });

  describe('Dialog state', () => {
    it('should initialize with dialog closed', () => {
      expect(component['importDialogOpen']()).toBe(false);
    });

    it('should update uploadedFiles when onFilesUploaded is called', () => {
      const mockFiles = [{
        id: 'test-id',
        name: 'test.json',
        size: 100,
        type: 'application/json',
        file: new File(['{}'], 'test.json'),
        status: {status: 'uploading' as const, progress: 50}
      }];

      component['onFilesUploaded'](mockFiles);
      expect(component['uploadedFiles']()).toEqual(mockFiles);
    });
  });
});
