import {afterNextRender, Component, inject, OnDestroy, signal, WritableSignal} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {faAdd, faFileLines} from '@fortawesome/free-solid-svg-icons';
import {Observable, Subscription} from 'rxjs';
import {CardComponent} from '../../../../../shared/components/card/card.component';
import {PageHeader} from "../../../../../shared/components/page-header/page-header";
import {BasicInputComponent} from '../../../../../shared/forms/basic-input/basic-input.component';
import {ToggleGroup, ToggleOption} from "../../../../../shared/forms/toggle-group/toggle-group";
import Exam from '../../../../../shared/model/classes/exam.class';
import {IExam} from '../../../../../shared/model/interfaces/exam.interface';
import {IQuestion} from '../../../../../shared/model/interfaces/question.interface';
import {StatusType, statusTypeSelectOptions} from '../../../../../shared/model/status-typ.enum';
import {ExamService} from '../../../../../shared/service/exam.service';
import {ToastService} from '../../../../../shared/service/toast.service';
import {QuestionEditComponent} from './components/question-edit/question-edit.component';
import {TEXT_REGEX, TEXT_VALIDATORS} from "../../../../../shared/forms/validation/validators-sets";
import {StickyBottomBar} from "./components/sticky-buttom-bar/sticky-bottom-bar.component";
import {CategorySelectComponent} from "../../../../../shared/components/category-select/category-select.component";
import {ImportCacheService} from "../../../../../shared/service/import-cache.service";
import Logger from "../../../../../shared/util/Logger";


@Component({
    selector: 'app-edit',
    imports: [
        BasicInputComponent,
        ReactiveFormsModule,
        RouterModule,
        BasicInputComponent,
        QuestionEditComponent,
        CardComponent,
        ToggleGroup,
        PageHeader,
        StickyBottomBar,
        CategorySelectComponent
    ],
    templateUrl: './edit.component.html',
    styleUrl: './edit.component.scss'
})
export class EditComponent implements OnDestroy {
    private readonly _logger = new Logger('EditComponent')

    protected readonly faAdd = faAdd;
    protected readonly faFileLines = faFileLines;

    private readonly _fb = inject(FormBuilder);
    private readonly _route = inject(ActivatedRoute);
    private readonly _router = inject(Router);
    private readonly _service = inject(ExamService);
    private readonly _toastService = inject(ToastService);
    private readonly _importCacheService = inject(ImportCacheService);

    protected questionsSignal: WritableSignal<IQuestion[]> = signal<IQuestion[]>([]);
    protected formValid: WritableSignal<boolean> = signal(false);
    protected pageTitle: WritableSignal<string> = signal('');
    protected pageSubTitle: WritableSignal<string> = signal('');
    protected invalidElementsSet: WritableSignal<Map<number, HTMLElement>> = signal(new Map());
    protected importID: WritableSignal<number | undefined> = signal(undefined);

    protected selectedStatus: WritableSignal<string> = signal('');
    private _exam: IExam | undefined = undefined;
    private readonly _formGroup: FormGroup;
    private readonly _subscriptions$: Subscription = new Subscription();

    protected readonly toggleOptions: ToggleOption[] = statusTypeSelectOptions().map((opt) => {
        return {
            ...opt,
            disable: false
        }
    });

    constructor() {
        this._formGroup = this._fb.group({
            id: new FormControl(null),
            pointsToSucceeded: new FormControl(0, {
                updateOn: 'blur',
                validators: [Validators.required, Validators.min(1), Validators.max(9999)]
            }),
            maxQuestionsRealExam: new FormControl<number | null>(null, {
                updateOn: 'blur',
                validators: [Validators.required, Validators.min(1), Validators.max(9999)]
            }),
            duration: new FormControl<number | null>(null, {
                updateOn: 'blur',
                validators: [Validators.required, Validators.min(1), Validators.max(9999)]
            }),
            name: new FormControl('', {
                updateOn: 'blur',
                validators: TEXT_VALIDATORS
            }),
            category: new FormGroup({
                id: new FormControl<number | null>(null),
                name: new FormControl<string | null>(null)
            }),
            description: new FormControl('', [Validators.maxLength(255), Validators.pattern(TEXT_REGEX)]),
            statusType: new FormControl(StatusType.DRAFT, [Validators.required]),
            questions: new FormArray([])
        });

        this.pageTitle.set($localize`:@@ox.exam.edit.page.create.title:Create new exam`);
        this.pageSubTitle.set($localize`:@@ox.exam.edit.page.create.subTitle:Create a new exam`);

        this._subscriptions$.add(this._formGroup.valueChanges.subscribe(() => {
            this.formValid.set(this.formGroup.valid);
        }));

        if (this._route.snapshot.params) {
            const id = Number(this._route.snapshot.params['id']);
            const importID = this._route.snapshot.queryParams['importId'];
            if (id > 0) {
                this._subscriptions$.add(this._service.getExamById(id).subscribe((ex) => {
                    if (ex?.id) {
                        this._setInitialValues(ex);
                    }
                }));
            }

            if (importID) {
                this.importID.set(importID);
                this._subscriptions$.add(this._importCacheService.loadInvalidFiel(Number(importID)).subscribe((result) => {
                        if (result.data.length) {
                            this._setInitialValues(JSON.parse(result.data));
                        }
                    }
                ));
            }
        }

        this._subscriptions$.add(this._service.errors$.subscribe((errors) => {
            if (errors.length) {
                errors.forEach((err) => {
                    this._toastService.addErrorToast($localize`:@@ox.errors.exam.edit:Error during exam operation`, err);

                });
            }
        }));

        afterNextRender(() => {
            setTimeout(() => {
                this._readAllInvalidFields();
            }, 500)
        })
    }

    ngOnDestroy(): void {
        this._subscriptions$.unsubscribe();
    }

    private _setInitialValues(ex: IExam): void {
        this._exam = ex
        this._formGroup.patchValue(ex);
        if (ex.category) {
            this.getCategoryGroup().patchValue(ex.category);
        }
        this.selectedStatus.set(ex.statusType ?? '');
        this.questionsSignal.set(ex.questions);
        this._formGroup.updateValueAndValidity();
        this._formGroup.markAllAsTouched();
        this.pageTitle.set($localize`:@@ox.exam.edit.page.title:Editing exam: ${ex.name}`);
        this.pageSubTitle.set($localize`:@@ox.exam.edit.page.subTitle:Editing the existing exam`);
    }

    public submit(): void {
        if (!this._formGroup.valid) {
            this._readAllInvalidFields();
            this.invalidElementsSet().get(1)?.focus();
            this.invalidElementsSet().get(1)?.scrollIntoView();
            this._addToastMessage($localize`:@@ox.exam.edit.errors.form.not.valid:Form is not valid, please check all fields.`, false);
            return;
        }

        const data = this._formGroup.getRawValue() as IExam;

        if (this.exam?.id) {
            this._subscriptions$.add(this._service.updateExam(new Exam(data)).subscribe((res) => {
                if (res) {
                    this._addToastMessage($localize`:@@ox.exam.edit.update.success:Successfully updated exam ${this.exam?.name} with id: ${this.exam?.id}`, true);
                    this._formGroup.reset();
                    this._router.navigate(['overview'], {relativeTo: this._route.parent}).then();
                }
            }));
        } else {
            this._subscriptions$.add(this._service.createExam(new Exam(data)).subscribe((result) => {
                if (result?.id) {
                    if (this.importID()) {
                        this._subscriptions$.add(this._importCacheService.deleteInvalidFile(this.importID()!).subscribe(
                            {
                                next: () => {
                                    this._logger.logInfo(`Invalid file with id: ${this.importID()} deleted successfully`);
                                },
                                error: (err) => {
                                    this._logger.logError(`Error during deleting invalid file with id: ${this.importID()}`, err);
                                }
                            }
                        ));
                    }
                    this._addToastMessage($localize`:@@ox.exam.edit.update.success:Successfully created exam ${result.name} with id: ${result?.id}`, true);
                    this._formGroup.reset();
                    this._router.navigate(['overview'], {relativeTo: this._route.parent}).then();
                }
            }));
        }
    }

    private _addToastMessage(message: string, success: boolean) {
        this._toastService.add({
            message,
            title: 'Edit Exam result',
            date: new Date(),
            type: success ? 'success' : 'danger'
        })
    }

    protected statusTypeChanged(str: string): void {
        this._formGroup.get('statusType')?.setValue(str);
        this.selectedStatus.set(str);
    }

    private _readAllInvalidFields(): void {
        const collection: HTMLCollectionOf<Element> = document.getElementsByTagName('ox-basic-input');
        this.invalidElementsSet().clear();
        let i = 1;
        for (const element of collection) {
            if (element.classList.contains('ng-touched') && element.classList.contains('ng-invalid')) {
                this.invalidElementsSet().set(i, element as HTMLElement);
                i++;
            }
        }
    }

    protected focusWrongFieldByIndex(idx: number): void {
        if (idx > this.invalidElementsSet().size) {
            return;
        }
        this.invalidElementsSet().get(idx)?.focus();
        this.invalidElementsSet().get(idx)?.scrollIntoView();
    }

    public get exam() {
        return this._exam;
    }

    public get formGroup() {
        return this._formGroup;
    }

    public getControl(control: string): FormControl {
        return this._formGroup.get(control) as FormControl;
    }

    public get loading$(): Observable<boolean> {
        return this._service.loading$;
    }

    protected get questions(): FormArray {
        return this.formGroup.get('questions') as FormArray;
    }

    protected handleIndexChanged(idx: number) {
        this.focusWrongFieldByIndex(idx);
    }

    protected cancel(): void {
        this._router.navigate(['overview'], {relativeTo: this._route.parent}).then();
    }

    protected getCategoryGroup(): FormGroup {
        return this.formGroup.get('category') as FormGroup;
    }
}
