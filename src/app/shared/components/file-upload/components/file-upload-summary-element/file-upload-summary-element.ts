import {Component, input, InputSignal, output, OutputEmitterRef} from '@angular/core';
import {UploadedFile, UploadStatus} from "../../../../model/interfaces/upload/file-upload.interfac";

@Component({
    selector: 'ox-file-upload-summary-element',
    imports: [],
    templateUrl: './file-upload-summary-element.html',
    styleUrl: './file-upload-summary-element.scss',
})
export class FileUploadSummaryElement {

    public uploadedFile: InputSignal<UploadedFile> = input.required();
    public fileRemoveClicked: OutputEmitterRef<string> = output();
    protected readonly Math = Math;

    protected getFileItemClasses(): string {
        const status = this.getStatus();
        const base = 'p-4 rounded-lg border transition-all my-4';

        switch (status?.status) {
            case 'success':
                return `${base} bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800`;
            case 'error':
                return `${base} bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800`;
            case 'validation-error':
                return `${base} bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800`;
            case 'uploading':
                return `${base} bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800`;
            default:
                return `${base} bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-border`;

        }
    }

    protected getStatus(): UploadStatus | undefined {
        return this.uploadedFile()?.status;
    }

    protected removeFile(id: string) {
        this.fileRemoveClicked.emit(id);
    }

    protected formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

}
