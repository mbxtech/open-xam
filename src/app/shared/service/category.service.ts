import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../model/classes/paged-result.class';
import { ICategory } from "../model/interfaces/category.interface";
import { BaseService } from "./base-service";
import {IPageOptions} from "../model/interfaces/page-options.interface";
import {IFilterTree} from "../model/interfaces/filter/filter.types";

@Injectable({
  providedIn: 'root',
})
export class CategoryService extends BaseService {

    public getCategories(pageOptions?: IPageOptions): Observable<PagedResult<ICategory> | null> {
        this.setInitialStates();
        return this.invoke$<PagedResult<ICategory>>('get_categories', pageOptions ?? null);
    }

    public createCategory(categoryToCreate: ICategory): Observable<ICategory | null> {
        this.setInitialStates();
        return this.invoke$('create_category', {categoryToCreate});
    }

    public updateCategory(categoryToUpdate: ICategory): Observable<ICategory | null> {
        this.setInitialStates();
        return this.invoke$('update_category', {categoryToUpdate});
    }

    public deleteCategory(id: number): Observable<ICategory | null> {
        this.setInitialStates();
        return this.invoke$('delete_category', {id});
    }

    public getCategoryById(id: number): Observable<ICategory | null> {
        this.setInitialStates();
        return this.invoke$<ICategory>('get_category_by_id', {id});
    }

    public search(filter: IFilterTree[], pageOptions: IPageOptions): Observable<PagedResult<ICategory> | null> {
        this.setInitialStates();
        return this.invoke$<PagedResult<ICategory>>('search_categories', {filter, pageOptions});
    }
}
