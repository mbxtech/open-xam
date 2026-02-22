import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { PageOptions } from '../model/classes/page-options.class';
import { PagedResult } from '../model/classes/paged-result.class';
import { IExam } from '../model/interfaces/exam.interface';
import { IFilterTree } from '../model/interfaces/filter/filter.types';
import { IPageOptions } from '../model/interfaces/page-options.interface';
import { IPagedResult } from '../model/interfaces/paged-result.interface';
import { BaseService } from './base-service';
import { IExamOverallStatistics } from '../model/interfaces/exam-overall-statistics.interface';
import Logger from "../util/Logger";

@Injectable({
    providedIn: 'root'
})
export class ExamService extends BaseService {

    public getAllExams(pageOptions: IPageOptions): Observable<PagedResult<IExam>> {
        this.setInitialStates();
        return this.invoke$<PagedResult<IExam>>('get_exams', {
            pageOptions: new PageOptions(pageOptions)
        }).pipe(map(this.mapToPagedResult));
    }

    public getExamById(id: number): Observable<IExam | null> {
        this.setInitialStates();
        return this.invoke$<IExam>('get_exam', {id});
    }   

    public updateExam(exam: IExam): Observable<IExam | null> {
        this.setInitialStates();
        return this.invoke$<IExam>('update_exam', {examToUpdate: exam});
    }

    public deleteExam(id: number): Observable<number | null> {
        this.setInitialStates();
        return this.invoke$('delete_exam', {id});
    }

    public createExam(examCRUD: IExam): Observable<IExam | null> {
        this.setInitialStates();
        return this.invoke$<IExam | null>('create_exam', {examToCreate: examCRUD});
    }

    public searchExams(filter: IFilterTree[], pageOptions: IPageOptions): Observable<PagedResult<IExam>> {
        this.setInitialStates();
        return this.invoke$<IPagedResult<IExam>>('search_exams', {
            filter,
            pageOptions: new PageOptions(pageOptions)
        }).pipe(map(this.mapToPagedResult));
    }

    public getStatistics(): Observable<IExamOverallStatistics | null> {
        this.setInitialStates();
        this.logger.logInfo('Fetching exam statistics');
        return this.invoke$<IExamOverallStatistics | null>('get_exam_overall_statistics').pipe(tap((val) => console.log(val)));
    }

    public validateExam(exam: IExam): Observable<boolean | null> {
        this.setInitialStates();
        return this.invoke$<boolean>('validate_exam', {exam});
    }

    private mapToPagedResult<T>(res: IPagedResult<T> | null): PagedResult<T> {
        if (!res) {
            return PagedResult.default();
        }

        return new PagedResult(res);
    }


}
