import {AsyncPipe} from '@angular/common';
import {Component, effect, inject, signal, WritableSignal} from '@angular/core';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faFileCircleCheck, faGraduationCap} from '@fortawesome/free-solid-svg-icons';
import {Observable, Subscription, tap} from 'rxjs';
import {CardComponent} from '../../../../../shared/components/card/card.component';
import {PageHeader} from '../../../../../shared/components/page-header/page-header';
import {
  PaginationControlsComponent
} from '../../../../../shared/components/pagination-controls/pagination-controls.component';
import {PagedResult} from '../../../../../shared/model/classes/paged-result.class';
import {IExamOverallStatistics} from '../../../../../shared/model/interfaces/exam-overall-statistics.interface';
import {IExam} from '../../../../../shared/model/interfaces/exam.interface';
import {IPageOptions} from '../../../../../shared/model/interfaces/page-options.interface';
import {ExamService} from '../../../../../shared/service/exam.service';
import {ToastService} from '../../../../../shared/service/toast.service';
import {ExamCard} from './components/exam-card/exam-card';
import {FilterExpressionBuilder} from '../../../../../shared/model/interfaces/filter/filter-expression-builder.class';

@Component({
  selector: 'ox-exam-learning-overview',
  imports: [CardComponent, FaIconComponent, AsyncPipe, ExamCard, PaginationControlsComponent, PageHeader],
  templateUrl: './exam-learning-overview.html',
  styleUrl: './exam-learning-overview.scss',
})
export class ExamLearningOverview {

  protected faFileCheck = faFileCircleCheck;
  protected faGraduationCap = faGraduationCap;

  protected pageTitle: string = $localize`:@@ox.learning.exam.overview.pageTitle:Available exams`;
  protected pageSubTitle: string = $localize`:@@ox.learning.exam.overview.pageTitle:Please choose an exam to start with`;

  private readonly _examService: ExamService = inject(ExamService);
  private readonly _toastService: ToastService = inject(ToastService);


  private _exams$: Observable<PagedResult<IExam>> = new Observable<PagedResult<IExam>>();
  private readonly _subscription: Subscription = new Subscription();

  public pageOptions: WritableSignal<IPageOptions> = signal<IPageOptions>({ elementsPerPage: 6, page: 1 });
  protected currentPagedResult: WritableSignal<PagedResult<IExam>> = signal<PagedResult<IExam>>({
    currentPage: 1,
    data: [],
    totalElements: 0,
    totalPages: 0
  });

  protected statistics: WritableSignal<IExamOverallStatistics> = signal<IExamOverallStatistics>({
    averageQuestionCount: 0,
    examCount: 0,
    averageSucceedingScore: 0,
    archiveCount: 0,
    activeCount: 0,
    draftCount: 0,
    inactiveCount: 0
  });


  constructor() {

    this._subscription.add(this._examService.errors$.subscribe((errors) => {
      if (errors.length) {
        errors.forEach((error) => {
          this._toastService.addErrorToast(
            $localize`:@@ox.exam.errors.title: Error during Exam operation`,
            error
          );
        });
      }
    }));

    this._subscription.add(this._examService.getStatistics().subscribe((res) => {
      if (res) {
        this.statistics.set(res);
      }
    }));


    effect(() => {

      const changedPagedOptions = this.pageOptions();
      if (changedPagedOptions) {
        this._exams$ = this.loadExamsWithPageOptions();
      }
    });

  }

  public loadExamsWithPageOptions(): Observable<PagedResult<IExam>> {
    const filter = FilterExpressionBuilder.tree(FilterExpressionBuilder.cond('status_type').eq(FilterExpressionBuilder.str('Active')));
    return this._examService.searchExams([filter], this.pageOptions()).pipe(tap((res) => {
      if (res) {
        this.currentPagedResult.set(res);
      }
    }));
  }

  public get exams$(): Observable<PagedResult<IExam>> {
    return this._exams$;
  }

  public get statisticsValue() {
    return this.statistics();
  }

}
