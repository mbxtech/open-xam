import {Component, inject, OnDestroy, output, OutputEmitterRef, signal, WritableSignal} from '@angular/core';
import {ButtonComponent} from '../../../../../../../shared/components/button/button.component';
import {CardComponent} from '../../../../../../../shared/components/card/card.component';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {InputComponent} from '../../../../../../../shared/components/input/input.component';
import {faAdd, faFileImport} from '@fortawesome/free-solid-svg-icons';
import {StatusType} from '../../../../../../../shared/model/status-typ.enum';
import {Subscription} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {DialogComponent} from "../../../../../../../shared/components/dialog/dialog.component";
import {DialogHeaderComponent} from "../../../../../../../shared/components/dialog/dialog-header.component";
import {DialogContentComponent} from "../../../../../../../shared/components/dialog/dialog-content.component";
import {DialogFooterComponent} from "../../../../../../../shared/components/dialog/dialog-footer.component";
import {ToastService} from "../../../../../../../shared/service/toast.service";
import Logger from "../../../../../../../shared/util/Logger";
import {
    UploadedFilesSummary
} from "../../../../../../../shared/components/file-upload/components/uploaded-files-summary/uploaded-files-summary";
import {
    FileUploadSummaryElement
} from "../../../../../../../shared/components/file-upload/components/file-upload-summary-element/file-upload-summary-element";
import {ExamImportService} from "../../../../../../../shared/service/exam-import.service";
import {ReadFile, UploadedFile} from "../../../../../../../shared/model/interfaces/upload/file-upload.interfac";
import {FileUpload} from "../../../../../../../shared/components/file-upload/file-upload";
import {IExamImportResult} from "../../../../../../../shared/model/interfaces/import/exam-import-result.interface";

@Component({
    selector: 'ox-exam-overview-controls',
    imports: [
        ButtonComponent,
        CardComponent,
        FaIconComponent,
        FormsModule,
        InputComponent,
        ReactiveFormsModule,
        DialogComponent,
        DialogHeaderComponent,
        DialogContentComponent,
        FileUpload,
        DialogFooterComponent,
        UploadedFilesSummary,
        FileUploadSummaryElement
    ],
    templateUrl: './exam-overview-controls.component.html',
    styleUrl: './exam-overview-controls.component.scss',
})
export class ExamOverviewControlsComponent implements OnDestroy {
    private readonly logger = new Logger('[Admin|Exam|OverviewControls]');

    protected readonly faAdd = faAdd;
    protected readonly faImport = faFileImport;
    private readonly _examImportService: ExamImportService = inject(ExamImportService);
    private readonly _router: Router = inject(Router);
    private readonly _route: ActivatedRoute = inject(ActivatedRoute);
    private readonly _toast = inject(ToastService);

    private _subscriptions$ = new Subscription();

    protected readonly String = String;
    protected examStatusControl: FormControl<string | null> = new FormControl('ALL');
    protected searchPlaceholder: string = $localize`:@@ox.administration.overview.overviewControls.searchPlaceholder:Enter search term...`

    public uploadedFile: OutputEmitterRef<ReadFile> = output();
    public statusTypeEvent: OutputEmitterRef<StatusType> = output<StatusType>();

    public searchChange: OutputEmitterRef<string> = output<string>();
    protected importDialogOpen: WritableSignal<boolean> = signal<boolean>(false);
    protected uploadedFiles: WritableSignal<UploadedFile[]> = signal<UploadedFile[]>([]);
    protected fileErrors: WritableSignal<IExamImportResult[]> = signal<IExamImportResult[]>([]);

    constructor() {
        this._subscriptions$.add(this.examStatusControl.valueChanges.subscribe(value => this.statusTypeEvent.emit(value as StatusType)));
    }

    ngOnDestroy(): void {
        this._subscriptions$.unsubscribe();
    }

    public async goToEdit(): Promise<void> {
        await this._router.navigate(['edit'], {relativeTo: this._route.parent});
    }

    protected onFilesUploaded(files: UploadedFile[]): void {
        this.uploadedFiles.set(files);
    }

    public async importExam(files: ReadFile[]): Promise<void> {
        try {
            const importedExamResults = await this._examImportService.importExams(files);
            importedExamResults.forEach((examResult, index) => {
                if (!examResult.success) {
                    this.fileErrors.update((prev) => [...prev, examResult]);
                }
                this.uploadedFiles.update((prev) => {
                    const {errorType, success} = examResult;
                    prev[index].status = {
                        status: !success ? errorType! : 'success',
                        error: !success ? 'Validation failed' : '',
                        progress: 100,
                    }

                    return prev;
                })
            })
        } catch (e: unknown) {
            this.logger.logError(e);
            this._toast.addErrorToast(
                $localize`:@@ox.administration.overview.importExam.error.title:Unable to import Exam`,
                $localize`:@@ox.administration.overview.importExam.error.message:Exam could not be imported`
            );
        }
    }

    protected async editExam(fileId: string) {
        const result = this.fileErrors().find((file) => file.id === fileId);
        if (!result) {
            return;
        }
        await this._router.navigate(['edit'], {relativeTo: this._route.parent, queryParams: {importId: result.invalidCacheId}});
    }
}
