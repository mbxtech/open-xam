import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Component} from '@angular/core';
import {By} from '@angular/platform-browser';
import {FileUpload} from './file-upload';
import {UploadedFilesSummary} from './components/uploaded-files-summary/uploaded-files-summary';
import {UploadedFile} from '../../model/interfaces/upload/file-upload.interfac';

@Component({
  template: `
    <ox-file-upload (uploadedFiles)="onFilesUploaded($event)" (allReadFiles)="onAllFilesRead($event)">
      <ox-uploaded-files-summary>
        <div class="summary-content">Summary Content</div>
      </ox-uploaded-files-summary>
    </ox-file-upload>
  `,
  imports: [FileUpload, UploadedFilesSummary]
})
class TestHostWithSummaryComponent {
  uploadedFiles: UploadedFile[] = [];
  allReadFiles: any[] = [];

  onFilesUploaded(files: UploadedFile[]) {
    this.uploadedFiles = files;
  }

  onAllFilesRead(files: any[]) {
    this.allReadFiles = files;
  }
}

@Component({
  template: `<ox-file-upload></ox-file-upload>`,
  imports: [FileUpload]
})
class TestHostWithoutSummaryComponent {}

function createMockFile(name: string, size: number, type: string = 'application/json'): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, {type});
}

function createMockDragEvent(type: string, files: File[] = []): any {
  const dataTransfer = {
    files: files,
    items: files.map(f => ({kind: 'file', type: f.type, getAsFile: () => f})),
    types: ['Files']
  };

  return {
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    dataTransfer
  };
}

describe('FileUpload', () => {
  let component: FileUpload;
  let fixture: ComponentFixture<FileUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUpload]
    }).compileComponents();

    fixture = TestBed.createComponent(FileUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component rendering', () => {
    it('should render the drop zone', () => {
      const dropZone = fixture.debugElement.query(By.css('.drop-zone-root'));
      expect(dropZone).toBeTruthy();
    });

    it('should render file input element', () => {
      const fileInput = fixture.debugElement.query(By.css('input[type="file"]'));
      expect(fileInput).toBeTruthy();
      expect(fileInput.nativeElement.multiple).toBe(true);
    });

    it('should render upload icon', () => {
      const svg = fixture.debugElement.query(By.css('svg'));
      expect(svg).toBeTruthy();
    });

    it('should render title and description', () => {
      const title = fixture.debugElement.query(By.css('h1'));
      const description = fixture.debugElement.query(By.css('p.text-gray-600'));
      expect(title).toBeTruthy();
      expect(description).toBeTruthy();
    });
  });

  describe('Drag and drop functionality', () => {
    it('should set isDragging to true on drag enter', () => {
      const event = createMockDragEvent('dragenter');
      component.handleDragEnter(event);
      fixture.detectChanges();

      expect((component as any).isDragging()).toBe(true);
    });

    it('should set isDragging to false on drag leave from drop-zone-root', () => {
      (component as any).isDragging.set(true);
      fixture.detectChanges();

      const mockTarget = document.createElement('div');
      mockTarget.classList.add('drop-zone-root');

      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        target: mockTarget
      } as unknown as DragEvent;

      component.handleDragLeave(event);
      fixture.detectChanges();

      expect((component as any).isDragging()).toBe(false);
    });

    it('should not set isDragging to false on drag leave from child element', () => {
      (component as any).isDragging.set(true);
      fixture.detectChanges();

      const mockTarget = document.createElement('div');
      mockTarget.classList.add('child-element');

      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        target: mockTarget
      } as unknown as DragEvent;

      component.handleDragLeave(event);
      fixture.detectChanges();

      expect((component as any).isDragging()).toBe(true);
    });

    it('should prevent default on drag over', () => {
      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as unknown as DragEvent;

      component.handleDragOver(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should process files on drop', fakeAsync(() => {
      const mockFile = createMockFile('test.json', 100);
      const processFilesSpy = jest.spyOn(component, 'processFiles');

      const event = createMockDragEvent('drop', [mockFile]);
      component.handleDrop(event);
      tick();

      expect((component as any).isDragging()).toBe(false);
      expect(processFilesSpy).toHaveBeenCalledWith([mockFile]);
    }));

    it('should handle drop with no files', fakeAsync(() => {
      const processFilesSpy = jest.spyOn(component, 'processFiles');

      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: null
      } as unknown as DragEvent;

      component.handleDrop(event);
      tick();

      expect(processFilesSpy).toHaveBeenCalledWith([]);
    }));
  });

  describe('File input handling', () => {
    it('should process files from file input', fakeAsync(() => {
      const mockFile = createMockFile('test.json', 100);
      const processFilesSpy = jest.spyOn(component, 'processFiles');

      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [mockFile],
        writable: false
      });

      const event = {target: input} as unknown as Event;
      component.handleFileInput(event);
      tick();

      expect(processFilesSpy).toHaveBeenCalledWith([mockFile]);
    }));

    it('should handle empty file input', fakeAsync(() => {
      const processFilesSpy = jest.spyOn(component, 'processFiles');

      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: null,
        writable: false
      });

      const event = {target: input} as unknown as Event;
      component.handleFileInput(event);
      tick();

      expect(processFilesSpy).toHaveBeenCalledWith([]);
    }));
  });

  describe('File size validation', () => {
    it('should set maxFileSizeReached when total file size exceeds limit', fakeAsync(() => {
      const largeFile = createMockFile('large.json', 11000000); // 11MB

      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [largeFile],
        writable: false
      });

      const event = {target: input} as unknown as Event;
      component.handleFileInput(event);
      tick();

      expect((component as any).maxFileSizeReached()).toBe(true);
    }));

    it('should not process files when total size exceeds limit', fakeAsync(() => {
      const largeFile = createMockFile('large.json', 11000000);
      const processFilesSpy = jest.spyOn(component, 'processFiles');

      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [largeFile],
        writable: false
      });

      const event = {target: input} as unknown as Event;
      component.handleFileInput(event);
      tick();

      expect(processFilesSpy).not.toHaveBeenCalled();
    }));

    it('should show alert when max file size reached', fakeAsync(() => {
      (component as any).maxFileSizeReached.set(true);
      fixture.detectChanges();

      const alert = fixture.debugElement.query(By.css('ox-alert'));
      expect(alert).toBeTruthy();
    }));

    it('should reset maxFileSizeReached on new file input', fakeAsync(() => {
      (component as any).maxFileSizeReached.set(true);

      const mockFile = createMockFile('small.json', 100);
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [mockFile],
        writable: false
      });

      const event = {target: input} as unknown as Event;
      component.handleFileInput(event);
      tick();

      expect((component as any).maxFileSizeReached()).toBe(false);
    }));

    it('should allow files at exactly the size limit', fakeAsync(() => {
      const exactFile = createMockFile('exact.json', 10000000); // Exactly 10MB
      const processFilesSpy = jest.spyOn(component, 'processFiles');

      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [exactFile],
        writable: false
      });

      const event = {target: input} as unknown as Event;
      component.handleFileInput(event);
      tick();

      expect((component as any).maxFileSizeReached()).toBe(false);
      expect(processFilesSpy).toHaveBeenCalled();
    }));

    it('should calculate total size of multiple files', fakeAsync(() => {
      const file1 = createMockFile('file1.json', 6000000); // 6MB
      const file2 = createMockFile('file2.json', 6000000); // 6MB = 12MB total

      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [file1, file2],
        writable: false
      });

      const event = {target: input} as unknown as Event;
      component.handleFileInput(event);
      tick();

      expect((component as any).maxFileSizeReached()).toBe(true);
    }));
  });

  describe('processFiles', () => {
    it('should create UploadedFile objects with correct properties', fakeAsync(() => {
      const mockFile = createMockFile('test.json', 100, 'application/json');

      component.processFiles([mockFile]);
      tick();

      const files = (component as any).files();
      expect(files.length).toBe(1);
      expect(files[0].name).toBe('test.json');
      expect(files[0].size).toBe(100);
      expect(files[0].type).toBe('application/json');
      expect(files[0].file).toBe(mockFile);
      expect(files[0].status.status).toBe('uploading');
      expect(files[0].id).toBeTruthy();
    }));

    it('should generate unique IDs for each file', fakeAsync(() => {
      const file1 = createMockFile('file1.json', 100);
      const file2 = createMockFile('file2.json', 100);

      component.processFiles([file1, file2]);
      tick();

      const files = (component as any).files();
      expect(files[0].id).not.toBe(files[1].id);
    }));

    it('should append new files to existing files', fakeAsync(() => {
      const file1 = createMockFile('file1.json', 100);
      const file2 = createMockFile('file2.json', 100);

      component.processFiles([file1]);
      tick();
      component.processFiles([file2]);
      tick();

      const files = (component as any).files();
      expect(files.length).toBe(2);
    }));

    it('should handle empty file list', fakeAsync(() => {
      component.processFiles([]);
      tick();

      const files = (component as any).files();
      expect(files.length).toBe(0);
    }));
  });

  describe('getDropZoneClasses', () => {
    it('should return default classes when not dragging', () => {
      (component as any).isDragging.set(false);
      const classes = (component as any).getDropZoneClasses();

      expect(classes).toContain('drop-zone-root');
      expect(classes).toContain('border-gray-300');
      expect(classes).toContain('bg-gray-50');
      expect(classes).not.toContain('border-blue-500');
    });

    it('should return dragging classes when dragging', () => {
      (component as any).isDragging.set(true);
      const classes = (component as any).getDropZoneClasses();

      expect(classes).toContain('drop-zone-root');
      expect(classes).toContain('border-blue-500');
      expect(classes).toContain('bg-blue-50');
      expect(classes).toContain('scale-105');
    });
  });

  describe('hasSummary', () => {
    it('should return false when no summary component is projected', () => {
      expect((component as any).hasSummary()).toBe(false);
    });

    it('should return true when summary component is projected', () => {
      const hostFixture = TestBed.createComponent(TestHostWithSummaryComponent);
      hostFixture.detectChanges();

      const fileUpload = hostFixture.debugElement.query(By.directive(FileUpload)).componentInstance;
      expect((fileUpload as any).hasSummary()).toBe(true);
    });
  });

  describe('Content projection', () => {
    it('should project uploaded-files-summary when present', () => {
      const hostFixture = TestBed.createComponent(TestHostWithSummaryComponent);
      hostFixture.detectChanges();

      const summary = hostFixture.debugElement.query(By.directive(UploadedFilesSummary));
      expect(summary).toBeTruthy();
    });

    it('should not render summary section when no summary projected', () => {
      const hostFixture = TestBed.createComponent(TestHostWithoutSummaryComponent);
      hostFixture.detectChanges();

      const summary = hostFixture.debugElement.query(By.directive(UploadedFilesSummary));
      expect(summary).toBeNull();
    });
  });

  describe('Click to browse', () => {
    it('should trigger file input click when drop zone is clicked', () => {
      const fileInput = fixture.debugElement.query(By.css('input[type="file"]')).nativeElement;
      const clickSpy = jest.spyOn(fileInput, 'click');

      const dropZone = fixture.debugElement.query(By.css('.drop-zone-root'));
      dropZone.triggerEventHandler('click', new MouseEvent('click'));

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle file with zero size', fakeAsync(() => {
      const emptyFile = createMockFile('empty.json', 0);
      component.processFiles([emptyFile]);
      tick(1000);

      const files = (component as any).files();
      expect(files.length).toBe(1);
      expect(files[0].size).toBe(0);
    }));

    it('should handle files with special characters in name', fakeAsync(() => {
      const specialFile = createMockFile('test file (1) [2].json', 100);
      component.processFiles([specialFile]);
      tick(1000);

      const files = (component as any).files();
      expect(files[0].name).toBe('test file (1) [2].json');
    }));

    it('should handle multiple files being uploaded simultaneously', fakeAsync(() => {
      const files = Array.from({length: 5}, (_, i) => createMockFile(`file${i}.json`, 100));
      component.processFiles(files);
      tick(1000);

      const uploadedFiles = (component as any).files();
      expect(uploadedFiles.length).toBe(5);
    }));

    it('should handle file with very long name', fakeAsync(() => {
      const longName = 'a'.repeat(255) + '.json';
      const longNameFile = createMockFile(longName, 100);
      component.processFiles([longNameFile]);
      tick(1000);

      const files = (component as any).files();
      expect(files[0].name).toBe(longName);
    }));
  });

  describe('uploadFile behavior', () => {
    it('should initialize file with uploading status', fakeAsync(() => {
      const mockFile = createMockFile('test.json', 100);
      component.processFiles([mockFile]);

      const files = (component as any).files();
      expect(files[0].status.status).toBe('uploading');
      expect(files[0].status.progress).toBe(0);
      tick(1000);
    }));

    it('should call uploadFile for each processed file', fakeAsync(() => {
      const uploadFileSpy = jest.spyOn(component, 'uploadFile');
      const mockFile = createMockFile('test.json', 100);

      component.processFiles([mockFile]);
      tick();

      expect(uploadFileSpy).toHaveBeenCalled();
    }));
  });
});
