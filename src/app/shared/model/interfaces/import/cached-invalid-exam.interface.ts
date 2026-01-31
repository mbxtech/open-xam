import { IExam } from '../exam.interface';

export interface ICachedInvalidExam {
    id: number;           // IndexedDB ID
    exam: IExam;          // Parsed exam data
    cachedAt: Date;       // When cached
    errorType: 'validation-error' | 'error';
}
