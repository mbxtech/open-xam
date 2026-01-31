import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Component, signal} from '@angular/core';
import {By} from '@angular/platform-browser';
import {FileUploadSummaryElement} from './file-upload-summary-element';
import {UploadedFile, UploadStatus} from '../../../../model/interfaces/upload/file-upload.interfac';

function createMockUploadedFile(overrides: Partial<UploadedFile> = {}): UploadedFile {
  const mockFile = new File(['test content'], 'test.json', {type: 'application/json'});
  return {
    id: 'test-id-123',
    name: 'test-file.json',
    size: 1024,
    type: 'application/json',
    file: mockFile,
    status: {
      status: 'uploading',
      progress: 0
    },
    ...overrides
  };
}

@Component({
  template: `
    <ox-file-upload-summary-element
      [uploadedFile]="uploadedFile()"
      (fileRemoveClicked)="onFileRemove($event)"
    >
      <button class="custom-action-btn">Custom Action</button>
    </ox-file-upload-summary-element>
  `,
  imports: [FileUploadSummaryElement]
})
class TestHostComponent {
  uploadedFile = signal<UploadedFile>(createMockUploadedFile());
  removedFileId: string | null = null;

  onFileRemove(id: string) {
    this.removedFileId = id;
  }
}

describe('FileUploadSummaryElement', () => {
  let component: FileUploadSummaryElement;
  let fixture: ComponentFixture<FileUploadSummaryElement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadSummaryElement]
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadSummaryElement);
    component = fixture.componentInstance;
  });

  function setUploadedFile(file: UploadedFile) {
    fixture.componentRef.setInput('uploadedFile', file);
    fixture.detectChanges();
  }

  it('should create', () => {
    setUploadedFile(createMockUploadedFile());
    expect(component).toBeTruthy();
  });

  describe('File display', () => {
    it('should display file name', () => {
      setUploadedFile(createMockUploadedFile({name: 'my-document.pdf'}));

      const fileName = fixture.debugElement.query(By.css('.font-medium'));
      expect(fileName.nativeElement.textContent.trim()).toBe('my-document.pdf');
    });

    it('should display file size formatted correctly', () => {
      setUploadedFile(createMockUploadedFile({size: 2048}));

      const fileSize = fixture.debugElement.query(By.css('.text-sm.text-gray-500'));
      expect(fileSize.nativeElement.textContent.trim()).toBe('2 KB');
    });

    it('should display file icon', () => {
      setUploadedFile(createMockUploadedFile());

      const fileIcon = fixture.debugElement.query(By.css('svg.text-gray-500'));
      expect(fileIcon).toBeTruthy();
    });

    it('should truncate long file names', () => {
      setUploadedFile(createMockUploadedFile({name: 'a'.repeat(100) + '.json'}));

      const fileName = fixture.debugElement.query(By.css('.truncate'));
      expect(fileName).toBeTruthy();
    });
  });

  describe('formatFileSize', () => {
    it('should format 0 bytes correctly', () => {
      setUploadedFile(createMockUploadedFile({size: 0}));
      expect((component as any).formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      setUploadedFile(createMockUploadedFile());
      expect((component as any).formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes correctly', () => {
      setUploadedFile(createMockUploadedFile());
      expect((component as any).formatFileSize(1024)).toBe('1 KB');
      expect((component as any).formatFileSize(2048)).toBe('2 KB');
      expect((component as any).formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes correctly', () => {
      setUploadedFile(createMockUploadedFile());
      expect((component as any).formatFileSize(1048576)).toBe('1 MB');
      expect((component as any).formatFileSize(5242880)).toBe('5 MB');
      expect((component as any).formatFileSize(1572864)).toBe('1.5 MB');
    });

    it('should format gigabytes correctly', () => {
      setUploadedFile(createMockUploadedFile());
      expect((component as any).formatFileSize(1073741824)).toBe('1 GB');
      expect((component as any).formatFileSize(2147483648)).toBe('2 GB');
    });

    it('should round to 2 decimal places', () => {
      setUploadedFile(createMockUploadedFile());
      expect((component as any).formatFileSize(1234)).toBe('1.21 KB');
      expect((component as any).formatFileSize(1234567)).toBe('1.18 MB');
    });
  });

  describe('Status display - uploading', () => {
    it('should show progress bar when uploading', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'uploading', progress: 50}
      }));

      const progressBar = fixture.debugElement.query(By.css('.bg-blue-500'));
      expect(progressBar).toBeTruthy();
    });

    it('should show correct progress percentage', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'uploading', progress: 75}
      }));

      const progressText = fixture.debugElement.query(By.css('.min-w-\\[3rem\\]'));
      expect(progressText.nativeElement.textContent.trim()).toBe('75%');
    });

    it('should update progress bar width based on progress', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'uploading', progress: 60}
      }));

      const progressBar = fixture.debugElement.query(By.css('.bg-blue-500'));
      expect(progressBar.nativeElement.style.width).toBe('60%');
    });

    it('should handle 0% progress', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'uploading', progress: 0}
      }));

      const progressText = fixture.debugElement.query(By.css('.min-w-\\[3rem\\]'));
      expect(progressText.nativeElement.textContent.trim()).toBe('0%');
    });

    it('should handle 100% progress while still uploading', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'uploading', progress: 100}
      }));

      const progressBar = fixture.debugElement.query(By.css('.bg-blue-500'));
      expect(progressBar.nativeElement.style.width).toBe('100%');
    });

    it('should round progress percentage', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'uploading', progress: 33.333}
      }));

      const progressText = fixture.debugElement.query(By.css('.min-w-\\[3rem\\]'));
      expect(progressText.nativeElement.textContent.trim()).toBe('33%');
    });
  });

  describe('Status display - success', () => {
    it('should show success icon when status is success', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'success', progress: 100}
      }));

      const successIcon = fixture.debugElement.query(By.css('.text-green-600'));
      expect(successIcon).toBeTruthy();
    });

    it('should not show progress bar when status is success', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'success', progress: 100}
      }));

      const progressBar = fixture.debugElement.query(By.css('.bg-blue-500'));
      expect(progressBar).toBeNull();
    });
  });

  describe('Status display - error', () => {
    it('should show error icon when status is error', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'error', progress: 0, error: 'Upload failed'}
      }));

      const errorIcon = fixture.debugElement.query(By.css('.text-red-600'));
      expect(errorIcon).toBeTruthy();
    });

    it('should show error message when status is error', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'error', progress: 0, error: 'Network connection lost'}
      }));

      const errorMessage = fixture.debugElement.query(By.css('.text-red-600.mt-2'));
      expect(errorMessage.nativeElement.textContent).toContain('Network connection lost');
    });

    it('should not show progress bar when status is error', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'error', progress: 0}
      }));

      const progressBar = fixture.debugElement.query(By.css('.bg-blue-500'));
      expect(progressBar).toBeNull();
    });
  });

  describe('Status display - validation-error', () => {
    it('should apply error styling for validation-error status', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'validation-error', progress: 0, error: 'Invalid format'}
      }));

      const container = fixture.debugElement.query(By.css('.bg-red-50'));
      expect(container).toBeTruthy();
    });
  });

  describe('getFileItemClasses', () => {
    it('should return success classes for success status', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'success', progress: 100}
      }));

      const classes = (component as any).getFileItemClasses();
      expect(classes).toContain('bg-green-50');
      expect(classes).toContain('dark:bg-green-950');
      expect(classes).toContain('border-green-200');
      expect(classes).toContain('dark:border-green-800');
    });

    it('should return error classes for error status', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'error', progress: 0}
      }));

      const classes = (component as any).getFileItemClasses();
      expect(classes).toContain('bg-red-50');
      expect(classes).toContain('dark:bg-red-950');
      expect(classes).toContain('border-red-200');
      expect(classes).toContain('dark:border-red-800');
    });

    it('should return error classes for validation-error status', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'validation-error', progress: 0}
      }));

      const classes = (component as any).getFileItemClasses();
      expect(classes).toContain('bg-red-50');
      expect(classes).toContain('dark:bg-red-950');
    });

    it('should return uploading classes for uploading status', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'uploading', progress: 50}
      }));

      const classes = (component as any).getFileItemClasses();
      expect(classes).toContain('bg-blue-50');
      expect(classes).toContain('dark:bg-blue-950');
      expect(classes).toContain('border-blue-200');
      expect(classes).toContain('dark:border-blue-800');
    });

    it('should return default classes for unknown status', () => {
      const file = createMockUploadedFile();
      (file.status as any).status = 'unknown';
      setUploadedFile(file);

      const classes = (component as any).getFileItemClasses();
      expect(classes).toContain('bg-white');
      expect(classes).toContain('dark:bg-neutral-900');
      expect(classes).toContain('border-gray-200');
    });

    it('should always include base classes', () => {
      setUploadedFile(createMockUploadedFile());

      const classes = (component as any).getFileItemClasses();
      expect(classes).toContain('p-4');
      expect(classes).toContain('rounded-lg');
      expect(classes).toContain('border');
      expect(classes).toContain('transition-all');
      expect(classes).toContain('my-4');
    });
  });

  describe('Remove file functionality', () => {
    it('should emit fileRemoveClicked when remove button is clicked', () => {
      const mockFile = createMockUploadedFile({id: 'unique-file-id'});
      setUploadedFile(mockFile);

      const fileRemoveSpy = jest.fn();
      component.fileRemoveClicked.subscribe(fileRemoveSpy);

      const removeButton = fixture.debugElement.query(By.css('button'));
      removeButton.triggerEventHandler('click', new MouseEvent('click'));

      expect(fileRemoveSpy).toHaveBeenCalledWith('unique-file-id');
    });

    it('should render remove button', () => {
      setUploadedFile(createMockUploadedFile());

      const removeButton = fixture.debugElement.query(By.css('button'));
      expect(removeButton).toBeTruthy();
    });

    it('should have hover styles on remove button', () => {
      setUploadedFile(createMockUploadedFile());

      const removeButton = fixture.debugElement.query(By.css('button'));
      expect(removeButton.nativeElement.classList).toContain('hover:bg-gray-200');
    });
  });

  describe('Content projection', () => {
    it('should project custom content', () => {
      const hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.detectChanges();

      const customButton = hostFixture.debugElement.query(By.css('.custom-action-btn'));
      expect(customButton).toBeTruthy();
      expect(customButton.nativeElement.textContent.trim()).toBe('Custom Action');
    });

    it('should emit fileRemoveClicked through host component', () => {
      const hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.componentInstance.uploadedFile.set(createMockUploadedFile({id: 'host-file-id'}));
      hostFixture.detectChanges();

      const removeButton = hostFixture.debugElement.query(By.css('button:not(.custom-action-btn)'));
      removeButton.triggerEventHandler('click', new MouseEvent('click'));
      hostFixture.detectChanges();

      expect(hostFixture.componentInstance.removedFileId).toBe('host-file-id');
    });
  });

  describe('Dark mode compatibility', () => {
    it('should have dark mode classes for file icon', () => {
      setUploadedFile(createMockUploadedFile());

      const fileIcon = fixture.debugElement.query(By.css('svg.text-gray-500'));
      expect(fileIcon.nativeElement.classList).toContain('dark:text-gray-400');
    });

    it('should have dark mode classes for file name', () => {
      setUploadedFile(createMockUploadedFile());

      const fileName = fixture.debugElement.query(By.css('.font-medium'));
      expect(fileName.nativeElement.classList).toContain('dark:text-gray-200');
    });

    it('should have dark mode classes for file size', () => {
      setUploadedFile(createMockUploadedFile());

      const fileSize = fixture.debugElement.query(By.css('.text-sm.text-gray-500'));
      expect(fileSize.nativeElement.classList).toContain('dark:text-gray-400');
    });

    it('should have dark mode classes for progress bar background', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'uploading', progress: 50}
      }));

      const progressBg = fixture.debugElement.query(By.css('.bg-gray-200'));
      expect(progressBg.nativeElement.classList).toContain('dark:bg-gray-700');
    });

    it('should have dark mode classes for progress percentage text', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'uploading', progress: 50}
      }));

      const progressText = fixture.debugElement.query(By.css('.text-gray-600'));
      expect(progressText.nativeElement.classList).toContain('dark:text-gray-400');
    });

    it('should have dark mode classes for success icon', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'success', progress: 100}
      }));

      const successIcon = fixture.debugElement.query(By.css('.text-green-600'));
      expect(successIcon.nativeElement.classList).toContain('dark:text-green-400');
    });

    it('should have dark mode classes for error icon', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'error', progress: 0}
      }));

      const errorIcon = fixture.debugElement.query(By.css('.text-red-600'));
      expect(errorIcon.nativeElement.classList).toContain('dark:text-red-400');
    });

    it('should have dark mode classes for remove button', () => {
      setUploadedFile(createMockUploadedFile());

      const removeButton = fixture.debugElement.query(By.css('button'));
      expect(removeButton.nativeElement.classList).toContain('dark:hover:bg-gray-700');
    });

    it('should have dark mode classes for error message', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'error', progress: 0, error: 'Test error'}
      }));

      const errorMessage = fixture.debugElement.query(By.css('p.mt-2'));
      expect(errorMessage.nativeElement.classList).toContain('dark:text-red-400');
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined status gracefully', () => {
      const file = createMockUploadedFile();
      (file as any).status = undefined;
      setUploadedFile(file);

      expect((component as any).getStatus()).toBeUndefined();
    });

    it('should handle very large file sizes', () => {
      setUploadedFile(createMockUploadedFile({size: 10737418240})); // 10GB

      const fileSize = fixture.debugElement.query(By.css('.text-sm.text-gray-500'));
      expect(fileSize.nativeElement.textContent.trim()).toBe('10 GB');
    });

    it('should handle file with empty name', () => {
      setUploadedFile(createMockUploadedFile({name: ''}));

      const fileName = fixture.debugElement.query(By.css('.font-medium'));
      expect(fileName.nativeElement.textContent.trim()).toBe('');
    });

    it('should handle file with unicode characters in name', () => {
      setUploadedFile(createMockUploadedFile({name: '文件名.json'}));

      const fileName = fixture.debugElement.query(By.css('.font-medium'));
      expect(fileName.nativeElement.textContent.trim()).toBe('文件名.json');
    });

    it('should handle file with emoji in name', () => {
      setUploadedFile(createMockUploadedFile({name: '📄 document.pdf'}));

      const fileName = fixture.debugElement.query(By.css('.font-medium'));
      expect(fileName.nativeElement.textContent.trim()).toBe('📄 document.pdf');
    });

    it('should handle error with empty message', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'error', progress: 0, error: ''}
      }));

      const errorMessage = fixture.debugElement.query(By.css('.text-red-600.mt-2'));
      expect(errorMessage.nativeElement.textContent).toContain('Error:');
    });

    it('should handle error with very long message', () => {
      const longError = 'Error: ' + 'a'.repeat(500);
      setUploadedFile(createMockUploadedFile({
        status: {status: 'error', progress: 0, error: longError}
      }));

      const errorMessage = fixture.debugElement.query(By.css('.text-red-600.mt-2'));
      expect(errorMessage.nativeElement.textContent).toContain(longError);
    });

    it('should handle negative progress value', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'uploading', progress: -10}
      }));

      const progressText = fixture.debugElement.query(By.css('.min-w-\\[3rem\\]'));
      expect(progressText.nativeElement.textContent.trim()).toBe('-10%');
    });

    it('should handle progress value greater than 100', () => {
      setUploadedFile(createMockUploadedFile({
        status: {status: 'uploading', progress: 150}
      }));

      const progressBar = fixture.debugElement.query(By.css('.bg-blue-500'));
      expect(progressBar.nativeElement.style.width).toBe('150%');
    });
  });

  describe('getStatus', () => {
    it('should return the status from uploaded file', () => {
      const status: UploadStatus = {status: 'success', progress: 100};
      setUploadedFile(createMockUploadedFile({status}));

      expect((component as any).getStatus()).toEqual(status);
    });
  });
});
