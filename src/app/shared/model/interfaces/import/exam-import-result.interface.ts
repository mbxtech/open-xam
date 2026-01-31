export interface IExamImportResult {
    success: boolean;
    invalidCacheId?: number;
    errorType?: 'validation-error' | 'error';
    id: string;
}