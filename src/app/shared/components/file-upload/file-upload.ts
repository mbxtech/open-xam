import {Component, ContentChild, output, OutputEmitterRef, signal, WritableSignal} from '@angular/core';
import {UploadedFilesSummary} from "./components/uploaded-files-summary/uploaded-files-summary";
import Logger from "../../util/Logger";
import {AlertComponent} from "../alert/alert.component";
import {ReadFile, UploadedFile, UploadStatus} from "../../model/interfaces/upload/file-upload.interfac";

@Component({
  selector: 'ox-file-upload',
  imports: [
    AlertComponent
  ],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss',
})
export class FileUpload {

  private readonly logger: Logger = new Logger(FileUpload.name);
  private readonly MAX_TOTAL_FILE_SIZE = 10000000;

  protected isDragging:WritableSignal<boolean>  = signal(false);
  protected files: WritableSignal<UploadedFile[]>  = signal<UploadedFile[]>([]);
  protected readFiles: WritableSignal<ReadFile[]>  = signal<ReadFile[]>([]);
  protected maxFileSizeReached: WritableSignal<boolean> = signal(false);

  protected Math = Math;

  public uploadedFiles: OutputEmitterRef<UploadedFile[]> = output();
  public allReadFiles: OutputEmitterRef<ReadFile[]> = output();

  @ContentChild(UploadedFilesSummary) uploadedFilesSummary?: UploadedFilesSummary;

  public handleDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  public handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    if (target.classList.contains('drop-zone-root')) {
      this.isDragging.set(false);
    }
  }

  public handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  public async handleDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const droppedFiles = Array.from(event.dataTransfer?.files || []);
    await this.processFiles(droppedFiles);
  }

  public async handleFileInput(event: Event): Promise<void> {
    this.maxFileSizeReached.set(false);
    const input = event.target as HTMLInputElement;
    const selectedFiles = Array.from(input.files || []);
    const totalFileSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
    if (totalFileSize > this.MAX_TOTAL_FILE_SIZE) {
      this.maxFileSizeReached.set(true);
      return;
    }

    await this.processFiles(selectedFiles);
    input.value = ''; // Reset input
  }

  public async processFiles(fileList: File[]): Promise<void> {
    const newFiles: UploadedFile[] = fileList.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      status: {
        status: 'uploading',
        progress: 0
      }
    }));

    this.files.update(prev => [...prev, ...newFiles]);

    for (const fileData of newFiles) {
      await this.uploadFile(fileData);
    }
  }

  public async uploadFile(fileData: UploadedFile): Promise<void> {
    this._updateFileStatus(fileData.id, { status: 'uploading', progress: 0 });

    try {
      const reader = new FileReader();

      reader.onprogress = (e: ProgressEvent<FileReader>) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          this._updateFileStatus(fileData.id, { status: 'uploading', progress });
          this.uploadedFiles.emit(this.files());
        }
      };

      reader.onload = async (e: ProgressEvent<FileReader>) => {
        try {
          if (e.target?.result) {
            const readFile = {
              name: fileData.name,
              data: e.target!.result,
              type: fileData.type,
              id: fileData.id
            };

            this._updateFileStatus(fileData.id, { status: 'success', progress: 100 });
            this.uploadedFiles.emit(this.files());

            this.readFiles.update(files => [...files, readFile]);
            if (this.readFiles().length === this.files().length) {
              this.allReadFiles.emit(this.readFiles());
            }
          }
        } catch (error) {
          this.logger.logError('Failed to read file:', error)
          this._updateFileStatus(fileData.id, { status: 'error', progress: 0, error: error instanceof Error ? error.message : 'Unknown error' });
          this.uploadedFiles.emit(this.files());
        }
      };

      reader.onerror = () => {
        this.logger.logError('Failed to read file:', 'Unknown error')
        this._updateFileStatus(fileData.id, { status: 'error', progress: 0, error: 'Failed to read file' });
      };

      reader.readAsArrayBuffer(fileData.file);
    } catch (error) {
      this.logger.logError('Failed to read file:', error)
      this._updateFileStatus(fileData.id, { status: 'error', progress: 0, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private _updateFileStatus(fileId: string, status: UploadStatus): void {
    this.files.update(prev => prev.map(file => file.id === fileId ? {...file, status} : file));
  }

  protected getDropZoneClasses(): string {
    const base = 'drop-zone-root relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 ease-in-out';
    return this.isDragging()
      ? `${base} border-blue-500 bg-blue-50 scale-105`
      : `${base} border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100`;
  }

  protected hasSummary(): boolean {
    return !!this.uploadedFilesSummary;
  }
}
