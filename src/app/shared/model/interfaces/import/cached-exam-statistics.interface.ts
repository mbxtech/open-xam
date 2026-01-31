export interface ICachedExamStatistics {
    total: number;
    validationErrors: number;
    generalErrors: number;
    mostRecentDate: Date | null;
}
