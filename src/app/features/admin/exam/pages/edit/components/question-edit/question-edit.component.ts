import {
    Component,
    ElementRef,
    HostListener,
    inject,
    input,
    Input,
    InputSignal,
    OnDestroy,
    OnInit,
    signal,
    ViewChild,
    WritableSignal,
} from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { $localize } from '@angular/localize/init';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
    faAdd,
    faArrowsLeftRight,
    faCircleCheck,
    faExclamationTriangle,
    faEyeSlash,
    faFloppyDisk,
    faListCheck,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { faEye } from '@fortawesome/free-solid-svg-icons/faEye';
import { Subscription } from 'rxjs';
import { BadgeComponent } from '../../../../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../../../../shared/components/card/card.component';
import { CategorySelectComponent } from '../../../../../../../shared/components/category-select/category-select.component';
import {
    ContextMenu,
    ContextMenuItem,
} from '../../../../../../../shared/components/context-menu/context-menu';
import { DialogContentComponent } from '../../../../../../../shared/components/dialog/dialog-content.component';
import { DialogHeaderComponent } from '../../../../../../../shared/components/dialog/dialog-header.component';
import { DialogComponent } from '../../../../../../../shared/components/dialog/dialog.component';
import { ElementInView } from '../../../../../../../shared/directives/element-in-view';
import { BasicInputComponent } from '../../../../../../../shared/forms/basic-input/basic-input.component';
import { DynamicSelectComponent } from '../../../../../../../shared/forms/dynamic-select/dynamic-select.component';
import FormErrorMessageExtractor from '../../../../../../../shared/forms/validation/form-error-message-extractor';
import { IQuestion } from '../../../../../../../shared/model/interfaces/question.interface';
import {
    mapQuestionTypeToText,
    QuestionType,
    questionTypesSelectOptions,
} from '../../../../../../../shared/model/question-type.enum';
import { StrippedTextPipe } from '../../../../../../../shared/pipes/stripped-text-pipe';
import { QuestionService } from '../../../../../../../shared/service/question.service';
import { ToastService } from '../../../../../../../shared/service/toast.service';
import { AbstractEdit } from './components/abstract-edit/abstract-edit';
import { AnswerFormComponent } from './components/answer-form/answer-form.component';
import { AssignmentOptionComponent } from './components/assignment-option/assignment-option.component';

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
    styleUrl: './question-edit.component.scss',
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
    private readonly _questionService = inject(QuestionService);

    private readonly _questionTypes: { value: any; label: string }[] = questionTypesSelectOptions();
    private readonly _subscription$: Subscription = new Subscription();

    private readonly _currentSelectedQuestionType: WritableSignal<SelectedQuestionTypeEntry[]> =
        signal<SelectedQuestionTypeEntry[]>([]);
    protected collapsedIndices: WritableSignal<number[]> = signal<number[]>([]);
    protected allCollapsed: WritableSignal<boolean> = signal<boolean>(false);
    protected currentQuestionInView: WritableSignal<number | null> = signal<number | null>(null);
    protected previousQuestionInView: WritableSignal<number | null> = signal<number | null>(null);
    protected scrollingByNavigation: WritableSignal<boolean> = signal<boolean>(false);

    @ViewChild('sidebar') sidebar!: ElementRef;

    @Input({ required: true })
    public questionArray!: FormArray;

    public examId: InputSignal<number | null | undefined> = input();

    @HostListener('window:scroll', ['$event'])
    onWindowScroll(_event: Event): void {
        setTimeout(() => {
            this.scrollingByNavigation.set(false);
        }, 500);
    }

    protected readonly contextMenuItems: ContextMenuItem<string>[] = [
        {
            label: $localize`:@@ox.general.delete:Delete`,
            icon: faTrash,
            action: param => {
                if (typeof param === 'string' && param.length) {
                    this.removeQuestion(param);
                }
            },
            dataTestId: 'delete-question-btn',
        },
        {
            label: $localize`:@@ox.general.delete:Save`,
            icon: faFloppyDisk,
            action: param => {
                if (typeof param === 'string' && param.length) {
                    this.openSaveDialog(param);
                }
            },
            dataTestId: 'save-question-btn',
        },
        {
            label: $localize`:@@ox.administration.edit.question.contextMenu.collapse:Collapse/Expand`,
            icon: faEye,
            action: param => {
                if (typeof param === 'string' && param.length) {
                    const grp = this._getGrpByInternalId(this.questionArray, param);
                    const qIndex = this.questionArray.controls.indexOf(grp!);
                    if (this.collapsedIndices().includes(qIndex)) {
                        this.collapsedIndices.update(prev =>
                            prev.filter(index => index !== qIndex)
                        );
                    } else {
                        this.collapsedIndices.update(prev => [...prev, qIndex]);
                    }
                }
            },
            dataTestId: 'collapse-question-btn',
        },
    ];

    constructor() {
        super();
        this._subscription$.add(
            this._questionService.errors$.subscribe(err => {
                if (err.length) {
                    err.forEach(error => {
                        this._toastService.addErrorToast(
                            $localize`:@@ox.administration.edit.question.operation.errorTitle:Error during question operation`,
                            error
                        );
                    });
                }
            })
        );
    }

    ngOnInit(): void {
        this._subscription$.add(
            this.questionArray.valueChanges.subscribe((value: IQuestion[]) => {
                value.forEach((q, index) => {
                    const lastQuestionType =
                        this._currentSelectedQuestionType().at(index)?.questionType;
                    if (lastQuestionType) {
                        if (
                            lastQuestionType === QuestionType.ASSIGNMENT &&
                            q.type !== QuestionType.ASSIGNMENT
                        ) {
                            (this.questionArray.at(index).get('options') as FormArray).clear({
                                emitEvent: false,
                            });
                            (this.questionArray.at(index).get('answers') as FormArray).clear({
                                emitEvent: false,
                            });
                        } else if (
                            q.type === QuestionType.ASSIGNMENT &&
                            lastQuestionType !== QuestionType.ASSIGNMENT
                        ) {
                            (this.questionArray.at(index).get('answers') as FormArray).clear({
                                emitEvent: false,
                            });
                        }
                    }
                    if (this._currentSelectedQuestionType().length) {
                        this._currentSelectedQuestionType()[index].questionType = q.type;
                    }
                });
            })
        );
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

    protected removeQuestion(internalId: string) {
        const grp = this._getGrpByInternalId(this.questionArray, internalId);
        if (!grp) {
            return;
        }

        const index = this.questionArray.controls.indexOf(grp);

        if (this.hasId(grp)) {
            this.openDirectActionDialog({
                title: $localize`:@@ox.administration.edit.question.delete.directly.title:Directly delete Question`,
                message: $localize`:@@ox.administration.edit.question.delete.directly.message:Do you want to delete the question directly? It will be remove permanently and cannot be restored.`,
                submitLabel: $localize`:@@ox.general.delete:Delete`,
                abortLabel: $localize`:@@ox.general.cancel:Cancel`,
                actionBtnLabel: $localize`:@@ox.administration.edit.question.btn.action.delete:Delete directly`,
                onSubmit: () => {
                    this._removeQuestionInternal(index);
                    this.resetDialog();
                },
                onAbort: () => {
                    this.resetDialog();
                },
                onAction: () => {
                    this.deleteQuestion(grp.get('id')!.value, index);
                },
            });
        } else {
            this.openConfirmDialog({
                title: $localize`:@@ox.administration.edit.question.delete.title:Delete Question`,
                message: $localize`:@@ox.administration.edit.question.delete.message:Are you sure you want to delete this question?`,
                submitLabel: $localize`:@@ox.general.delete:Delete`,
                abortLabel: $localize`:@@ox.general.cancel:Cancel`,
                onSubmit: () => {
                    this._removeQuestionInternal(index);
                    this.resetDialog();
                },
                onAbort: () => {
                    this.resetDialog();
                },
            });
        }
    }

    private _removeQuestionInternal(index: number) {
        this._currentSelectedQuestionType.update(prev => prev.filter((_, i) => i !== index));
        this.questionArray.removeAt(index);
    }

    public openSaveDialog(internalId: string): void {
        const grp = this._getGrpByInternalId(this.questionArray, internalId);
        const errorToastTitle = $localize`@@ox.administration.edit.question.save.error.title:Question can not be saved`;
        if (!grp) {
            this.toastService.addErrorToast(
                errorToastTitle,
                $localize`@@ox.administration.edit.question.error.internalId.mesasge:Question can not be saved, because of an unknown internal error. Pleae try again or remove and recreate the question.`
            );
            return;
        }

        if (!grp.get('examId')?.value) {
            this._toastService.addErrorToast(
                errorToastTitle,
                $localize`@@ox.administration.edit.question.error.examId.title:Question can not be saved, because the exam has not be saved yet, please save the exam first`
            );
            return;
        }

        if (!grp.valid) {
            const errors = FormErrorMessageExtractor.extractMessagesAsString(grp);
            this._toastService.addErrorToast(
                errorToastTitle,
                $localize`:@@ox.administration.edit.question.error.invalid:Cannot save question, form is invalid. ${errors}`
            );
            return;
        }

        this.openConfirmDialog({
            title: $localize`:@@ox.administration.edit.question.save.title:Save Question`,
            message: $localize`:@@ox.administration.edit.question.save.message:Do you want to save the current changes to this question?`,
            submitLabel: $localize`:@@ox.general.save:Save`,
            abortLabel: $localize`:@@ox.general.cancel:Cancel`,
            onSubmit: () => this._saveCurrentQuestion(grp),
            onAbort: () => {
                this.resetDialog();
            },
        });
    }

    private _saveCurrentQuestion(grp: FormGroup): void {
        const question: IQuestion = this.getQuestionValue(grp.getRawValue() as IQuestion);

        this._subscription$.add(
            this._questionService.updateQuestion(question).subscribe(res => {
                if (res) {
                    this._addSuccessToast(
                        $localize`:@@ox.administration.edit.question.save.success:Question was saved successfully`
                    );
                    this.resetDialog();
                }
            })
        );
    }

    private deleteQuestion(id: number, index: number): void {
        this._subscription$.add(
            this._questionService.deleteQuestion(id).subscribe(res => {
                if (res) {
                    this._removeQuestionInternal(index);
                    this._addSuccessToast(
                        $localize`:@@ox.administration.edit.question.delete.success:Question was deleted successfully`
                    );
                    this.resetDialog();
                }
            })
        );
    }

    protected handleCollapseAll(): void {
        this.allCollapsed.set(!this.allCollapsed());
        if (this.allCollapsed()) {
            this.collapsedIndices.update(prev => {
                return [
                    ...prev,
                    ...this.questionArray.controls
                        .map((_, index) => index)
                        .filter(i => !this.isCollapsed(i)),
                ];
            });
        } else {
            this.collapsedIndices.set([]);
        }
    }

    protected addQuestionInternal(question?: IQuestion): void {
        const index = this.questionArray.length > 0 ? this.questionArray.length + 1 : 0;
        this._currentSelectedQuestionType.set([
            ...this._currentSelectedQuestionType(),
            {
                index,
                questionType: question?.type || QuestionType.SINGLE_CHOICE,
            },
        ]);

        this.questionArray.push(this.addQuestion(question, this.examId()));
    }

    public getQuestionValue(q: IQuestion): IQuestion {
        const question: IQuestion = { ...q };
        question.id = Number(question.id);
        return question;
    }

    public getAnswers(index: number): FormArray<FormGroup> {
        return this.questionArray.at(index).get('answers') as FormArray;
    }

    protected handleContextMenuAction(item: ContextMenuItem<string>, internalId: string): void {
        item.action(internalId);
    }

    public getAssignmentOptions(index: number): FormArray<FormGroup> {
        return this.questionArray.at(index).get('options') as FormArray;
    }

    public get questionTypes(): { value: any; label: string }[] {
        return this._questionTypes;
    }

    public getQuestionType(index: number): QuestionType {
        return this.questionArray.at(index).get('type')?.value ?? QuestionType.SINGLE_CHOICE;
    }

    protected mapQuestionTypeToText(q: QuestionType): string {
        return mapQuestionTypeToText(q);
    }

    public isCollapsed(index: number): boolean {
        return this.collapsedIndices().includes(index);
    }

    protected getQuestionStatus(index: number): string {
        const grp = this.questionArray.at(index);
        return grp.touched && grp.invalid ? 'error' : 'complete';
    }

    protected scrollToQuestion(index: number): void {
        const questionElement = document.getElementById(`question-${index}`);
        if (questionElement) {
            this.scrollingByNavigation.set(true);
            this.currentQuestionInView.set(index);
            questionElement.scrollIntoView({ behavior: 'smooth' });
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
        const element = document.getElementById(`question-sidebar-${index}`);
        if (!element) {
            return;
        }

        const previousQuestionInView = this.previousQuestionInView();
        const isInView = this._isElementInView(element, this.sidebar.nativeElement);

        const elementsInView = this._getCurrentSidebarElementsInView();

        if (!isInView) {
            const scrollUpIndex = index - (elementsInView.length - 1);
            if (scrollUpIndex.toString().includes('-')) {
                const firstElement = document.getElementById(`question-sidebar-0`);
                firstElement?.scrollIntoView({ behavior: 'smooth' });
            } else if (previousQuestionInView !== null && previousQuestionInView > index) {
                const allSidebarElements = this._getAllSidebarElements();
                allSidebarElements[scrollUpIndex]?.scrollIntoView({
                    behavior: 'smooth',
                });
            } else {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    private _getCurrentSidebarElementsInView(): HTMLElement[] {
        return this._getAllSidebarElements()
            .filter(el => el !== null)
            .filter(el => this._isElementInView(el, this.sidebar.nativeElement));
    }

    private _getAllSidebarElements(): HTMLElement[] {
        return this.questionArray.controls.map((_, index) =>
            this.sidebar.nativeElement.querySelector(`#question-sidebar-${index}`)
        );
    }

    private _isElementInView(element: HTMLElement, rootElement?: HTMLElement): boolean {
        if (rootElement) {
            return (
                element.getBoundingClientRect().top >= rootElement.getBoundingClientRect().top &&
                element.getBoundingClientRect().bottom <= rootElement.getBoundingClientRect().bottom
            );
        }
        return (
            element.getBoundingClientRect().top >= 0 &&
            element.getBoundingClientRect().bottom <= window.innerHeight
        );
    }

    protected getCategoryGroup(index: number): FormGroup {
        return this.questionArray.at(index).get('category') as FormGroup;
    }

    protected getAnswerArray(index: number): FormArray<FormGroup> {
        return this.questionArray.at(index).get('answers') as FormArray;
    }
}
