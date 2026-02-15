import {
    Component,
    effect, ElementRef, HostListener,
    inject,
    input,
    InputSignal,
    OnDestroy,
    OnInit,
    signal,
    ViewChild,
    WritableSignal
} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {$localize} from '@angular/localize/init';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {
    faAdd,
    faArrowsLeftRight,
    faCircleCheck, faExclamationTriangle,
    faEyeSlash,
    faFloppyDisk,
    faListCheck,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import {Subscription} from 'rxjs';
import {BadgeComponent} from '../../../../../../../shared/components/badge/badge.component';
import {CardComponent} from '../../../../../../../shared/components/card/card.component';
import {
    CategorySelectComponent
} from '../../../../../../../shared/components/category-select/category-select.component';
import {DialogContentComponent} from '../../../../../../../shared/components/dialog/dialog-content.component';
import {DialogHeaderComponent} from '../../../../../../../shared/components/dialog/dialog-header.component';
import {DialogComponent} from '../../../../../../../shared/components/dialog/dialog.component';
import {BasicInputComponent} from '../../../../../../../shared/forms/basic-input/basic-input.component';
import {DynamicSelectComponent} from '../../../../../../../shared/forms/dynamic-select/dynamic-select.component';
import FormErrorMessageExtractor from '../../../../../../../shared/forms/validation/form-error-message-extractor';
import {IAnswer} from '../../../../../../../shared/model/interfaces/answer.interface';
import {IAssignmentOption} from '../../../../../../../shared/model/interfaces/assignment-option.interface';
import {IQuestion} from '../../../../../../../shared/model/interfaces/question.interface';
import {
    mapQuestionTypeToText,
    QuestionType,
    questionTypesSelectOptions
} from '../../../../../../../shared/model/question-type.enum';
import {QuestionService} from '../../../../../../../shared/service/question.service';
import {ToastService} from '../../../../../../../shared/service/toast.service';
import {AbstractEdit} from './components/abstract-edit/abstract-edit';
import {AnswerFormComponent} from './components/answer-form/answer-form.component';
import {AssignmentOptionComponent} from './components/assignment-option/assignment-option.component';
import {ContextMenu, ContextMenuItem} from '../../../../../../../shared/components/context-menu/context-menu';
import {faEye} from '@fortawesome/free-solid-svg-icons/faEye';
import {ButtonComponent} from "../../../../../../../shared/components/button/button.component";
import {StrippedTextPipe} from "../../../../../../../shared/pipes/stripped-text-pipe";
import {TEXT_VALIDATORS} from "../../../../../../../shared/forms/validation/validators-sets";
import {ElementInView} from "../../../../../../../shared/directives/element-in-view";

interface SelectedQuestionTypeEntry {
    index: number;
    questionType: QuestionType;
}

@Component({
    selector: 'ox-question-edit',
    imports: [
        AnswerFormComponent,
        AssignmentOptionComponent,
        ReactiveFormsModule,
        BasicInputComponent,
        DynamicSelectComponent,
        BasicInputComponent,
        DynamicSelectComponent,
        CategorySelectComponent,
        DialogComponent,
        DialogHeaderComponent,
        DialogContentComponent,
        CardComponent,
        FaIconComponent,
        BadgeComponent,
        ContextMenu,
        ButtonComponent,
        StrippedTextPipe,
        ElementInView,
    ],
    templateUrl: './question-edit.component.html',
    styleUrl: './question-edit.component.scss'
})
export class QuestionEditComponent extends AbstractEdit implements OnDestroy, OnInit {

    protected readonly faArrowLeftRight = faArrowsLeftRight;
    protected readonly faAdd = faAdd;
    protected readonly faListCheck = faListCheck;
    protected readonly faCircleCheck = faCircleCheck;
    protected readonly faEye = faEye;
    protected readonly faEyeSlash = faEyeSlash;
    protected readonly faExclamationTriangle = faExclamationTriangle;
    protected readonly QuestionType = QuestionType;

    private readonly _toastService = inject(ToastService);
    private readonly _fb = inject(FormBuilder);
    private readonly _questionService = inject(QuestionService);

    private readonly _questionTypes: { value: any, label: string }[] = questionTypesSelectOptions();
    private readonly _subscription$: Subscription = new Subscription();

    private readonly EMPTY_ANSWERS: IAnswer[] = [];
    private readonly EMPTY_OPTIONS: IAssignmentOption[] = [];

    private _currentSelectedQuestionType: WritableSignal<SelectedQuestionTypeEntry[]> = signal<SelectedQuestionTypeEntry[]>([]);
    public questionsInput: InputSignal<IQuestion[]> = input<IQuestion[]>([]);
    public examId: InputSignal<number | null> = input<number | null>(null);
    protected collapsedIndices: WritableSignal<number[]> = signal<number[]>([]);
    protected allCollapsed: WritableSignal<boolean> = signal<boolean>(false);
    protected currentQuestionInView: WritableSignal<number | null> = signal<number | null>(null);
    protected previousQuestionInView: WritableSignal<number | null> = signal<number | null>(null);
    protected scrollingByNavigation: WritableSignal<boolean> = signal<boolean>(false);

    @ViewChild('sidebar') sidebar!: ElementRef;

    @HostListener('window:scroll', ['$event'])
    onWindowScroll(_event: Event): void {
        setTimeout(() => {
            this.scrollingByNavigation.set(false)
        }, 500);
    }

    protected readonly contextMenuItems: ContextMenuItem<number>[] = [
        {
            label: $localize`:@@ox.general.delete:Delete`,
            icon: faTrash,
            action: (param) => {
                if (typeof param === 'number' && param >= 0) {
                    this.removeQuestion(param);
                }
            }
        },
        {
            label: $localize`:@@ox.general.delete:Save`,
            icon: faFloppyDisk,
            action: (param) => {
                if (typeof param === 'number' && param >= 0) {
                    this.openSaveDialog(param);
                }
            }
        },
        {
            label: $localize`:@@ox.administration.edit.question.contextMenu.collapse:Collapse/Expand`,
            icon: faEye,
            action: (param) => {
                if (typeof param === 'number' && param >= 0) {
                    if (this.collapsedIndices().findIndex(index => index === param) === -1) {
                        this.collapsedIndices.update(prev => [...prev, param]);
                    } else {
                        this.collapsedIndices.update(prev => prev.filter(index => index !== param));
                    }
                }
            }
        }
    ];

    constructor() {
        super();
        effect(() => {
            if (this.questionsInput().length && !this.formArray.length) {
                this.questionsInput().forEach((question, index) => {
                    this.addQuestion(question);
                    if (question.type === QuestionType.ASSIGNMENT) {
                        this.handleAssignmentAnswersChange(question.answers, index);
                    }
                });
                this.formGroup().markAllAsTouched();
                this.formGroup().updateValueAndValidity();
            }
        });

        this._subscription$.add(this._questionService.errors$.subscribe((err) => {
            if (err.length) {
                err.forEach((error) => {
                    this._toastService.addErrorToast($localize`:@@ox.administration.edit.question.operation.errorTitle:Error during question operation`, error);
                })
            }
        }));
    }

    ngOnInit(): void {
        this._subscription$.add(this.formArray.valueChanges.subscribe((value: IQuestion[]) => {
            value.forEach((q, index) => {
                const lastQuestionType = this._currentSelectedQuestionType().at(index)?.questionType;
                if (lastQuestionType) {
                    if (lastQuestionType === QuestionType.ASSIGNMENT && q.type !== QuestionType.ASSIGNMENT) {
                        (this.getGroupAtIndex(index).get('options') as FormArray).clear({emitEvent: false});
                        (this.getGroupAtIndex(index).get('answers') as FormArray).clear({emitEvent: false});
                    } else if (q.type === QuestionType.ASSIGNMENT && lastQuestionType !== QuestionType.ASSIGNMENT) {
                        (this.getGroupAtIndex(index).get('answers') as FormArray).clear({emitEvent: false});
                    }
                }
                if (this._currentSelectedQuestionType().length) {
                    this._currentSelectedQuestionType()[index].questionType = q.type;
                }
            });
        }));
    }

    ngOnDestroy(): void {
        this._subscription$.unsubscribe();
    }

    private _addSuccessToast(localizedMessage: string): void {
        this._toastService.addSuccessToast(
            localizedMessage,
            $localize`:@@ox.administration.edit.question.operation.successTitle:Edit Question success`
        );
    }

    protected addQuestion(question?: IQuestion) {
        const index = this.formArray.length > 0 ? this.formArray.length + 1 : 0;
        this._currentSelectedQuestionType.set([...this._currentSelectedQuestionType(), {
            index,
            questionType: QuestionType.SINGLE_CHOICE
        }]);

        const fg = this._fb.group({
            id: new FormControl<number | null>(question?.id ?? null),
            questionText: new FormControl<string>(question?.questionText ?? '', {
                updateOn: 'blur',
                validators: TEXT_VALIDATORS
            }),
            pointsTotal: new FormControl<number>(question?.pointsTotal ?? 0),
            type: new FormControl<QuestionType>(question?.type || QuestionType.SINGLE_CHOICE, [Validators.required]),
            pointsPerCorrectAnswer: new FormControl<number | null>(question?.pointsPerCorrectAnswer ?? 0),
            answers: new FormArray([]),
            options: new FormArray([]),
            category: new FormGroup({
                id: new FormControl<number | null>(question?.category?.id ?? null),
                name: new FormControl<string | null>(question?.category?.name ?? null)
            }),
            examId: new FormControl<number | null>(this.examId()),
        });

        if (question) {
            fg.markAllAsTouched({emitEvent: false})
        }

        this.formArray.push(fg);
    }

    protected removeQuestion(index: number) {
        if (this.hasId(index)) {
            this.currentIndex.set(index);
            this.openDirectActionDialog({
                title: $localize`:@@ox.administration.edit.question.delete.directly.title:Directly delete Question`,
                message: $localize`:@@ox.administration.edit.question.delete.directly.message:Do you want to delete the question directly? It will be remove permanently and cannot be restored.`,
                submitLabel: $localize`:@@ox.general.delete:Delete`,
                abortLabel: $localize`:@@ox.general.cancel:Cancel`,
                actionBtnLabel: $localize`:@@ox.administration.edit.question.btn.action.delete:Delete directly`,
                onSubmit: () => this.formArray.removeAt(index),
                onAbort: () => {
                    this.resetDialog();
                },
                onAction: () => {
                    this.deleteQuestion();
                }
            });
        } else {
            this.openConfirmDialog({
                title: $localize`:@@ox.administration.edit.question.delete.title:Delete Question`,
                message: $localize`:@@ox.administration.edit.question.delete.message:Are you sure you want to delete this question?`,
                submitLabel: $localize`:@@ox.general.delete:Delete`,
                abortLabel: $localize`:@@ox.general.cancel:Cancel`,
                onSubmit: () => this.formArray.removeAt(index),
                onAbort: () => {
                    this.resetDialog();
                },
            });
        }
    }

    public openSaveDialog(index: number): void {
        this.currentIndex.set(index);
        this.openConfirmDialog({
            title: $localize`:@@ox.administration.edit.question.save.title:Save Question`,
            message: $localize`:@@ox.administration.edit.question.save.message:Do you want to save the current changes to this question?`,
            submitLabel: $localize`:@@ox.general.save:Save`,
            abortLabel: $localize`:@@ox.general.cancel:Cancel`,
            onSubmit: () => this._saveCurrentQuestion(),
            onAbort: () => {
                this.resetDialog();
            }
        });
    }

    private _saveCurrentQuestion(): void {
        if (!this.hasId(this.currentIndex())) {
            this._toastService.addErrorToast(
                $localize`:@@ox.administration.edit.question.error.title:Failed to save question`,
                $localize`:@@ox.administration.edit.question.save.error.id:Cannot save question, id is missing please save question before.`
            );
            this.resetDialog();
            return;
        }

        const questionToUpdate = this.getGroupAtIndex(this.currentIndex());
        if (!questionToUpdate.valid) {
            const errors = FormErrorMessageExtractor.extractMessagesAsString(questionToUpdate);
            this._toastService.addErrorToast(
                $localize`:@@ox.administration.edit.question.error.title:Failed to save question`,
                $localize`:@@ox.administration.edit.question.save.error.invalid:Cannot save question, form is invalid. ${errors}`
            );
            return;
        }

        const question: IQuestion = this.getQuestionValue(questionToUpdate.getRawValue() satisfies IQuestion);

        this._subscription$.add(this._questionService.updateQuestion(question).subscribe((res) => {
            if (res) {
                this._addSuccessToast($localize`:@@ox.administration.edit.question.save.success:Question was saved successfully`);
                this.resetDialog();
            }
        }));
    }

    public deleteQuestion(): void {
        const id = Number(this.getGroupAtIndex(this.currentIndex()).get('id')?.value);
        if (!this.isNumberSet(id)) {
            this._toastService.addErrorToast(
                $localize`:@@ox.administration.edit.question.error.title:Failed to delete question`,
                $localize`:@@ox.administration.edit.question.error.id:Cannot delete question, id is missing please save question before.`
            );
            return;
        }
        this._subscription$.add(this._questionService.deleteQuestion(id)
            .subscribe((res) => {
                if (res) {
                    this._addSuccessToast($localize`:@@ox.administration.edit.question.delete.success:Question was deleted successfully`);
                    this.formArray.removeAt(this.currentIndex());
                }
            }));
        this.resetDialog();
    }


    public handleAssignmentAnswersChange(answers: IAnswer[], index: number): void {
        if (answers.length) {
            (this.getGroupAtIndex(index).get('answers') as FormArray).clear();
            answers.forEach((answer) => {
                const answerGroup = this.addAnswerFormGroup(answer);
                (this.getGroupAtIndex(index).get('answers') as FormArray).push(answerGroup);
            });
            this.formGroup().updateValueAndValidity({emitEvent: false});
        }
    }

    protected handleCollapseAll(): void {
        this.allCollapsed.set(!this.allCollapsed());
        if (this.allCollapsed()) {
            this.collapsedIndices.update((prev) => {
                return [...prev, ...this.formArray.controls.map((_, index) => index).filter((i) => !this.isCollapsed(i))];
            });
        } else {
            this.collapsedIndices.set([]);
        }
    }

    public getQuestionValue(q: IQuestion): IQuestion {
        const question: IQuestion = {...q};
        question!.id = Number(question!.id);
        return question;
    }

    public getAnswers(index: number): IAnswer[] {
        return this.questionsInput().find((_, i) => i === Number(index))?.answers || this.EMPTY_ANSWERS;
    }

    protected handleContextMenuAction(item: ContextMenuItem<number>, index: number): void {
        item.action(index);
    }

    public getAssignmentOptions(index: number): IAssignmentOption[] {
        return this.questionsInput().find((_, i) => i === Number(index))?.options || this.EMPTY_OPTIONS;
    }

    public get questionTypes(): { value: any, label: string }[] {
        return this._questionTypes;
    }

    public getQuestionType(index: number): QuestionType {
        return this.formArray.at(index).get('type')?.value ?? QuestionType.SINGLE_CHOICE;
    }

    protected mapQuestionTypeToText(q: QuestionType): string {
        return mapQuestionTypeToText(q);
    }

    public isCollapsed(index: number): boolean {
        return this.collapsedIndices().find((id) => id === index) !== undefined;
    }

    protected getQuestionStatus(index: number): string {
        const grp = this.formArray.at(index);
        return grp.touched && grp.invalid ? 'error' : 'complete';
    }

    protected scrollToQuestion(index: number): void {
        const questionElement = document.getElementById(`question-${index}`);
        if (questionElement) {
            this.scrollingByNavigation.set(true);
            this.currentQuestionInView.set(index);
            questionElement.scrollIntoView({behavior: 'smooth'});
        }
    }

    protected onQuestionInView(inView: boolean, index: number): void {
        if (inView && this.currentQuestionInView() !== index) {
            if (!this.scrollingByNavigation()) {
                this.previousQuestionInView.set(this.currentQuestionInView());
                this.currentQuestionInView.set(index);
                this.scrollSideBarIfNeeded(index);
            }
        }
    }

    protected scrollSideBarIfNeeded(index: number): void {
        const previousQuestionInView = this.previousQuestionInView();
        const element = document.getElementById(`question-sidebar-${index}`);
        if (!element) {
            return;
        }

        const isInView = this._isElementInView(element, this.sidebar.nativeElement);

        const elementsInView = this._getCurrentSidebarElementsInView();

        if (!isInView) {
            const scrollUpIndex = index - (elementsInView.length - 1);
            if (scrollUpIndex.toString().includes('-')) {
                const firstElement = document.getElementById(`question-sidebar-0`);
                firstElement?.scrollIntoView({behavior: 'smooth'});
            } else if (previousQuestionInView !== null && previousQuestionInView > index) {
                const allSidebarElements = this._getAllSidebarElements();
                allSidebarElements[scrollUpIndex]?.scrollIntoView({behavior: 'smooth'});
            } else {
                element.scrollIntoView({behavior: 'smooth'});
            }
        }
    }

    private _getCurrentSidebarElementsInView(): HTMLElement[] {
        return this._getAllSidebarElements()
            .filter(el => el !== null).filter(el => this._isElementInView(el, this.sidebar.nativeElement)) as HTMLElement[];
    }

    private _getAllSidebarElements(): HTMLElement[] {
        return this.formArray.controls.map((_, index) => this.sidebar.nativeElement.querySelector(`#question-sidebar-${index}`));
    }

    private _isElementInView(element: HTMLElement, rootElement?: HTMLElement): boolean {
        if (rootElement) {
            return element.getBoundingClientRect().top >= rootElement.getBoundingClientRect().top && element.getBoundingClientRect().bottom <= rootElement.getBoundingClientRect().bottom;
        }
        return element.getBoundingClientRect().top >= 0 && element.getBoundingClientRect().bottom <= window.innerHeight;
    }

    protected getCategoryGroup(index: number): FormGroup {
        return this.getGroupAtIndex(index).get('category') as FormGroup;
    }

}
