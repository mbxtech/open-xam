export interface IPagedResult<T> {
    data: T[];
    totalElements: number;
    currentPage: number;
    totalPages: number;
}