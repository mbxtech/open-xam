import {IPageOptions} from "../interfaces/page-options.interface";

export class PageOptions implements IPageOptions {
    elementsPerPage: number;
    page: number;
    constructor(options: IPageOptions) {
        this.elementsPerPage = options.elementsPerPage;
        this.page = options.page;
    }

    public static default(): PageOptions {
        return new PageOptions({elementsPerPage: 10, page: 1});
    }
}