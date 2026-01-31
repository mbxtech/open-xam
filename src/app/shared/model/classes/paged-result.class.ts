import {IPagedResult} from "../interfaces/paged-result.interface";

export class PagedResult<T> implements IPagedResult<T> {
    currentPage: number;
    data: T[];
    totalElements: number;
    totalPages: number;

    constructor(pagedResult: IPagedResult<T>) {
        this.currentPage = pagedResult.currentPage;
        this.data = pagedResult.data;
        this.totalElements = pagedResult.totalElements;
        this.totalPages = pagedResult.totalPages;
    }

    public static default<T>(): PagedResult<T> {
        return new PagedResult<T>({
            currentPage: 0,
            data: [],
            totalElements: 0,
            totalPages: 0
        })
    }
}