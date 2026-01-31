import { Component, inject, signal, WritableSignal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { of } from 'rxjs';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { DialogComponent } from '../../../../../shared/components/dialog/dialog.component';
import { DialogHeaderComponent } from '../../../../../shared/components/dialog/dialog-header.component';
import { DialogContentComponent } from '../../../../../shared/components/dialog/dialog-content.component';
import { DialogFooterComponent } from '../../../../../shared/components/dialog/dialog-footer.component';
import { ToastService } from '../../../../../shared/service/toast.service';
import { ImportCacheService } from '../../../../../shared/service/import-cache.service';
import Logger from '../../../../../shared/util/Logger';
import { ICachedInvalidExam } from '../../../../../shared/model/interfaces/import/cached-invalid-exam.interface';
import { ICachedExamStatistics } from '../../../../../shared/model/interfaces/import/cached-exam-statistics.interface';
import { ImportsStatisticsHeaderComponent } from './components/imports-statistics-header/imports-statistics-header.component';
import { ImportsControlsComponent } from './components/imports-controls/imports-controls.component';

@Component({
  selector: 'ox-imports',
  imports: [
    DatePipe,
    FaIconComponent,
    DialogComponent,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    DialogHeaderComponent,
    DialogContentComponent,
    DialogFooterComponent,
    ImportsStatisticsHeaderComponent,
    ImportsControlsComponent
  ],
  templateUrl: './imports.component.html',
  styleUrl: './imports.component.scss',
})
export class ImportsComponent {
  private readonly logger = new Logger('[Admin|Exam|Imports]');

  protected readonly faPencil = faPencil;
  protected readonly faTrash = faTrash;

  private readonly _importCacheService = inject(ImportCacheService);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _toast = inject(ToastService);

  protected invalidExamsSignal: WritableSignal<ICachedInvalidExam[]> = signal([]);
  protected statisticsSignal: WritableSignal<ICachedExamStatistics> = signal({
    total: 0,
    validationErrors: 0,
    generalErrors: 0,
    mostRecentDate: null
  });
  protected isDeleteDialogOpen: WritableSignal<boolean> = signal(false);
  protected examToDelete: WritableSignal<ICachedInvalidExam | null> = signal(null);
  protected isLoading: WritableSignal<boolean> = signal(true);

  constructor() {
    this._loadInvalidExams();
  }

  private _loadInvalidExams(): void {
    this.isLoading.set(true);
    this._importCacheService.getAllInvalidFiles().subscribe({
      next: (items) => {
        const cachedExams: ICachedInvalidExam[] = [];

        for (const item of items) {
          try {
            const parsedExam = JSON.parse((item as any).data);
            cachedExams.push({
              id: item.id,
              exam: parsedExam,
              cachedAt: new Date(),
              errorType: 'validation-error' // Default, could be enhanced based on error data
            });
          } catch (error) {
            this.logger.logError('Failed to parse cached exam data', error);
          }
        }

        this.invalidExamsSignal.set(cachedExams);
        this._calculateStatistics(cachedExams);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.logger.logError('Failed to load invalid exams', error);
        this._toast.addErrorToast(
          $localize`:@@ox.general.error:Error`,
          $localize`:@@ox.admin.imports.load.error:Failed to load cached imports`
        );
        this.isLoading.set(false);
      }
    });
  }

  private _calculateStatistics(cachedExams: ICachedInvalidExam[]): void {
    const total = cachedExams.length;
    const validationErrors = cachedExams.filter(e => e.errorType === 'validation-error').length;
    const generalErrors = cachedExams.filter(e => e.errorType === 'error').length;

    let mostRecentDate: Date | null = null;
    if (cachedExams.length > 0) {
      mostRecentDate = cachedExams.reduce((latest, current) => {
        return current.cachedAt > latest ? current.cachedAt : latest;
      }, cachedExams[0].cachedAt);
    }

    this.statisticsSignal.set({
      total,
      validationErrors,
      generalErrors,
      mostRecentDate
    });
  }

  protected async goToEdit(cacheId: number): Promise<void> {
    await this._router.navigate(['edit'], {
      relativeTo: this._route.parent,
      queryParams: { importId: cacheId }
    });
  }

  protected openDelete(exam: ICachedInvalidExam): void {
    this.examToDelete.set(exam);
    this.isDeleteDialogOpen.set(true);
  }

  protected closeDelete(): void {
    this.isDeleteDialogOpen.set(false);
    this.examToDelete.set(null);
  }

  protected confirmDelete(): void {
    const exam = this.examToDelete();
    if (!exam) {
      this.logger.logError('No exam selected for deletion');
      this.closeDelete();
      this._toast.addErrorToast(
        $localize`:@@ox.general.error:Error`,
        $localize`:@@ox.admin.imports.delete.noSelection:No exam selected for deletion`
      );
      return;
    }

    this._importCacheService.deleteInvalidFile(exam.id).subscribe({
      next: () => {
        this._loadInvalidExams();
        this._toast.addSuccessToast(
          $localize`:@@ox.general.deleted:Deleted`,
          $localize`:@@ox.admin.imports.delete.success:The cached import was deleted successfully`
        );
        this.closeDelete();
      },
      error: (error) => {
        this.logger.logError('Failed to delete cached exam', error);
        this._toast.addErrorToast(
          $localize`:@@ox.general.error:Error`,
          $localize`:@@ox.admin.imports.delete.error:Failed to delete the cached import`
        );
        this.closeDelete();
      }
    });
  }

  protected clearAllInvalid(): void {
    this._importCacheService.clearInvalidFiles().subscribe({
      next: () => {
        this._loadInvalidExams();
        this._toast.addSuccessToast(
          $localize`:@@ox.general.success:Success`,
          $localize`:@@ox.admin.imports.clearAll.success:All cached imports were cleared successfully`
        );
      },
      error: (error) => {
        this.logger.logError('Failed to clear cached exams', error);
        this._toast.addErrorToast(
          $localize`:@@ox.general.error:Error`,
          $localize`:@@ox.admin.imports.clearAll.error:Failed to clear cached imports`
        );
      }
    });
  }

  protected refreshList(): void {
    this._loadInvalidExams();
  }

  public get loading$() {
    return of(false); // No service loading state for IndexedDB
  }
}
