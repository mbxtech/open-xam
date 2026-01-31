

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    file: File;
    status: UploadStatus;
}

export interface UploadStatus {
    status: 'uploading' | 'success' | 'error' | 'validation-error';
    progress: number;
    error?: string;
    path?: string;
}

export interface ReadFile {
    name: string,
    data: string | ArrayBuffer,
    type: string,
    id: string
}
