import {AsyncPipe, DatePipe} from '@angular/common';
import {Component, inject, signal, WritableSignal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faAdd, faFileExport, faPencil, faTrash} from '@fortawesome/free-solid-svg-icons';
import {BaseDirectory, writeTextFile} from '@tauri-apps/plugin-fs';
import {BehaviorSubject, Observable} from 'rxjs';
import {BadgeComponent} from '../../../../../shared/components/badge/badge.component';
import {ButtonComponent} from '../../../../../shared/components/button/button.component';
import {CardComponent} from '../../../../../shared/components/card/card.component';
import {DialogComponent} from '../../../../../shared/components/dialog/dialog.component';
import {
    PaginationControlsComponent
} from '../../../../../shared/components/pagination-controls/pagination-controls.component';
import {PagedResult} from '../../../../../shared/model/classes/paged-result.class';
import {IExam} from '../../../../../shared/model/interfaces/exam.interface';
import {FilterExpressionBuilder} from '../../../../../shared/model/interfaces/filter/filter-expression-builder.class';
import {IPageOptions} from '../../../../../shared/model/interfaces/page-options.interface';
import {IPagedResult} from '../../../../../shared/model/interfaces/paged-result.interface';
import {ExamService} from '../../../../../shared/service/exam.service';
import {ToastService} from '../../../../../shared/service/toast.service';
import {ExamOverviewControlsComponent} from './components/exam-overview-controls/exam-overview-controls.component';
import {StatisticsHeaderComponent} from './components/statistics-header/statistics-header.component';
import {DialogHeaderComponent} from "../../../../../shared/components/dialog/dialog-header.component";
import {DialogContentComponent} from "../../../../../shared/components/dialog/dialog-content.component";
import {DialogFooterComponent} from "../../../../../shared/components/dialog/dialog-footer.component";
import Logger from "../../../../../shared/util/Logger";
import {PageOptions} from "../../../../../shared/model/classes/page-options.class";

const LOG_TAG = '[Admin|Exam|Overview]';

@Component({
    selector: 'open-xam-overview',
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.scss'],
    imports: [
        AsyncPipe,
        DatePipe,
        FaIconComponent,
        RouterModule,
        DialogComponent,
        FormsModule,
        CardComponent,
        ButtonComponent,
        PaginationControlsComponent,
        StatisticsHeaderComponent,
        ExamOverviewControlsComponent,
        BadgeComponent,
        DialogHeaderComponent,
        DialogContentComponent,
        DialogFooterComponent
    ]
})
export class OverviewComponent {
    private readonly logger = new Logger(LOG_TAG);

    public readonly faPencil = faPencil;
    public readonly faTrash = faTrash;
    public readonly faAdd = faAdd;
    public readonly faExport = faFileExport;

    private readonly _examService = inject(ExamService);
    private readonly _router = inject(Router);
    private readonly _route = inject(ActivatedRoute);
    private readonly _toast = inject(ToastService);

    private readonly _examsSubject$ = new BehaviorSubject<IExam[]>([]);
    protected currentPagedResultSignal: WritableSignal<IPagedResult<IExam>> = signal<IPagedResult<IExam>>(PagedResult.default());
    public page = 1;

    public isDeleteOpen: WritableSignal<boolean> = signal<boolean>(false);
    private _deleteId: number | null = null;

    public pageOptions: WritableSignal<IPageOptions> = signal<IPageOptions>(PageOptions.default());
    public statusTypeFilter: WritableSignal<string> = signal<string>('ALL');


    constructor() {
        this._loadExams();
    }

    public searchExams(searchTerm: string): void {
        if (searchTerm.length < 3) {
            const builder = FilterExpressionBuilder.trees()
                .add(FilterExpressionBuilder.or([
                    FilterExpressionBuilder.cond('name').like(FilterExpressionBuilder.str(searchTerm)),
                    FilterExpressionBuilder.cond('description').like(FilterExpressionBuilder.str(searchTerm))
                ]));

            if (this.statusTypeFilter() != 'ALL') {
                builder.add(FilterExpressionBuilder.cond('status_type').eq(FilterExpressionBuilder.str(this.statusTypeFilter())));
            }

            this._examService.searchExams(builder.build(),
                this.pageOptions()
            )
                .subscribe(result => {
                    if (!result?.data?.length) {
                        this._toast.addErrorToast($localize`:@@ox.search.no.results.title:No results`, $localize`:@@ox.search.no.results.message:No results found for the search term: ${searchTerm}`);
                        return;
                    }
                    this._examsSubject$.next(result.data);
                    this.currentPagedResultSignal.set(result);
                });
        }
    }

    public get exams(): Observable<IExam[]> {
        return this._examsSubject$.asObservable();
    }

    public onPageChanged(pageOptions: IPageOptions) {
        this.pageOptions.set(pageOptions);
        this._loadExams();
    }

    public async goToEdit(id?: number | null) {
        if (!id) {
            await this._router.navigate(['edit'], {relativeTo: this._route.parent});
            return;
        }
        await this._router.navigate([`edit`, id], {relativeTo: this._route.parent})
    }

    public async goToQuestion(id: number) {
        await this._router.navigate(['questions/overview', id]);
    }

    protected openDelete(id: number) {
        this._deleteId = id;
        this.isDeleteOpen.set(true);
    }

    public closeDelete() {
        this.isDeleteOpen.set(false);
        this._deleteId = null;
    }

    public confirmDelete() {
        if (this._deleteId == null) {
            this.logger.logError(LOG_TAG, 'No exam selected for deletion.');
            this.closeDelete();
            this._toast.addErrorToast(
                $localize`:@@ox.general.error:Error`,
                $localize`:@@ox.administration.overview.deleteExam.errorMessage:No exam selected for deletion.`);
            return;
        }
        const id = this._deleteId;
        this._examService.deleteExam(id).subscribe({
            next: () => {
                this._loadExams();
                this._toast.addSuccessToast(
                    $localize`:@@ox.general.deleted:Deleted`,
                    $localize`:@@ox.administration.overview.deleteExam.successMessage:The exam was deleted successfully.`);
                this.closeDelete();
            },
            error: () => {
                this._toast.addErrorToast(
                    $localize`:@@ox.general.error:Error`,
                    $localize`:@@ox.administration.overview.deleteExam.errorMessage:Failed to delete the exam.`);
                this.closeDelete();
            }
        });
    }

    public async exportExams(exam: IExam) {
        try {
            this.logger.logInfo(`Start export of exam: ${exam.name} ID: ${exam.id}`, LOG_TAG);
            const examToExport = {...exam};
            examToExport.id = 0;
            examToExport.createdAt = null;
            examToExport.updatedAt = null;
            examToExport.questions.forEach(q => {
                q.id = null;
                q.examId = null;
                q.createdAt = null;
                q.updatedAt = null;
                q.answers.forEach(a => {
                    a.id = null;
                    a.createdAt = null;
                    a.updatedAt = null;
                    a.questionId = null;
                });
                q.options?.forEach(o => {
                    o.rowId = null;
                    o.questionId = null;
                });
            })
            const fileName = `exam_${exam.id}_${new Date().getTime()}.json`;
            await writeTextFile(fileName, JSON.stringify(examToExport, null, 2), {
                createNew: true,
                baseDir: BaseDirectory.Document
            });
            this.logger.logInfo(`Exam: ${exam.name} was exported successfully and saved to Documents: ${fileName}`, LOG_TAG);
            this._toast.addSuccessToast(
                $localize`:@@ox.general.success:Success`,
                $localize`:@@ox.administration.overview.exportExam.successMessage:The exam was exported successfully to Documents: ${fileName}.`);
        } catch (e) {
            this.logger.logError(LOG_TAG, e);
            this._toast.addErrorToast(
                $localize`:@@ox.general.error:Error`,
                $localize`:@@ox.administration.overview.exportExam.errorMessage:Failed to export the exam.`);
        }
    }

    private _loadExams() {
        this._examService.getAllExams(this.pageOptions()).subscribe(result => {
            if (result?.data?.length) {
                this._examsSubject$.next(result.data);
                this.currentPagedResultSignal.set(result);
            }
        });
    }

    public get loading$() {
        return this._examService.loading$;
    }

}
