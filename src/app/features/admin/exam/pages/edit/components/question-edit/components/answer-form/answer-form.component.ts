import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    input,
    InputSignal,
    OnDestroy,
    signal,
    WritableSignal
} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faAdd, faFloppyDisk, faTrash} from '@fortawesome/free-solid-svg-icons';
import {Subscription} from 'rxjs';
import {ButtonComponent} from '../../../../../../../../../shared/components/button/button.component';
import {ContextMenu, ContextMenuItem} from '../../../../../../../../../shared/components/context-menu/context-menu';
import {DialogContentComponent} from '../../../../../../../../../shared/components/dialog/dialog-content.component';
import {DialogHeaderComponent} from '../../../../../../../../../shared/components/dialog/dialog-header.component';
import {DialogComponent} from '../../../../../../../../../shared/components/dialog/dialog.component';
import {BasicInputComponent} from '../../../../../../../../../shared/forms/basic-input/basic-input.component';
import {IAnswer} from '../../../../../../../../../shared/model/interfaces/answer.interface';
import {QuestionType} from '../../../../../../../../../shared/model/question-type.enum';
import {AnswersService} from '../../../../../../../../../shared/service/answers.service';
import {ToastService} from '../../../../../../../../../shared/service/toast.service';
import {AbstractEdit} from '../abstract-edit/abstract-edit';
import {Checkbox} from "../../../../../../../../../shared/forms/checkbox/checkbox";


@Component({
    selector: 'ox-answer-form',
    imports: [
        BasicInputComponent,
        ReactiveFormsModule,
        FaIconComponent,
        DialogComponent,
        ContextMenu,
        ButtonComponent,
        DialogContentComponent,
        DialogHeaderComponent,
        Checkbox
    ],
    templateUrl: './answer-form.component.html',
    styleUrl: './answer-form.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnswerFormComponent extends AbstractEdit implements OnDestroy {
    private readonly _answerService = inject(AnswersService);
    private readonly _toastService = inject(ToastService);

    protected readonly faAdd = faAdd;
    private readonly _subscription$: Subscription = new Subscription();

    protected readonly QuestionType = QuestionType;
    protected readonly contextMenuItems: ContextMenuItem<number>[] = [
        {
            label: $localize`:@@ox.general.btn.delete:Delete`,
            icon: faTrash,
            action: (param) => {
                if (typeof param === 'number' && param >= 0) {
                    this.deleteAnswer(param);
                }
            }
        },
        {
            label: $localize`:@@ox.general.btn.save:Save`,
            icon: faFloppyDisk,
            action: (param) => {
                if (typeof param === 'number' && param >= 0) {
                    this.saveAnswer(param);
                }
            }
        }
    ];

    protected readonly questionTypeSignal: WritableSignal<QuestionType> = signal<QuestionType>(QuestionType.SINGLE_CHOICE);
    public readonly questionType: InputSignal<QuestionType> = input.required<QuestionType>();
    public readonly currentAnswers: InputSignal<IAnswer[]> = input<IAnswer[]>([]);
    public readonly assignedOptionId: InputSignal<number> = input<number>(-1);

    constructor() {
        super();
        effect(() => {
            const qType = this.questionType();
            this.questionTypeSignal.set(qType);
            const inputAnswers = this.currentAnswers();

            this.formArray.clear({emitEvent: false});

            if (inputAnswers && inputAnswers.length) {
                if (qType === QuestionType.ASSIGNMENT) {
                    inputAnswers.filter(answers => answers.assignedOptionId === this.assignedOptionId())
                        .forEach(answer => this.formArray.push(this.addAnswerFormGroup(answer), {emitEvent: false}));
                } else {
                    inputAnswers.forEach((answer: IAnswer, index) => {
                        this.formArray.push(this.addAnswerFormGroup(answer), {emitEvent: false});
                        if (qType === QuestionType.SINGLE_CHOICE) {
                            this.handleCorrectAnswerCheckBoxState(index);
                        }
                    });
                }

                this.formGroup().markAllAsTouched();
                this.formGroup().updateValueAndValidity({emitEvent: false});
            }

        });

        this._subscription$.add(
            this._answerService.errors$.subscribe((errors) => {
                if (errors.length) {
                    errors.forEach((err) => {
                        this._toastService.addErrorToast(
                            $localize`:@@ox.administration.edit.answer.action.error.title:Error during Answer action`,
                            err
                        );
                    });
                }
            })
        );
    }

    ngOnDestroy(): void {
        this._subscription$.unsubscribe();
    }

    public deleteAnswer(index: number): void {
        if (this.hasId(index)) {
            this.currentIndex.set(index);
            this.openDirectActionDialog({
                title: $localize`:@@ox.administration.edit.answer.delete.directly.title:Directly delete Answer`,
                message: $localize`:@@ox.administration.edit.answer.delete.directly.message:Do you want to delete the answer directly? It will be remove permanently and cannot be restored.`,
                submitLabel: $localize`:@@ox.general.btn.delete:Delete`,
                abortLabel: $localize`:@@ox.general.btn.cancel:Cancel`,
                actionBtnLabel: $localize`:@@ox.administration.edit.answer.btn.action.delete:Delete directly`,
                onSubmit: () => {
                    this.formArray.removeAt(index);
                    this.resetDialog();
                },
                onAbort: () => {
                    this.resetDialog();
                },
                onAction: () => {
                    this.deleteCurrentAnswer();
                }
            });
        } else {
            this.openConfirmDialog({
                title: $localize`:@@ox.administration.edit.answer.delete.title:Delete Answer`,
                message: $localize`:@@ox.administration.edit.answer.delete.message:Are you sure you want to delete this answer?`,
                submitLabel: $localize`:@@ox.general.btn.delete:Delete`,
                abortLabel: $localize`:@@ox.general.btn.cancel:Cancel`,
                onSubmit: () => {
                    this.formArray.removeAt(index);
                    this.resetDialog();
                },
                onAbort: () => {
                    this.resetDialog();
                },
            });
        }
    }

    public saveAnswer(index: number): void {
        if (!this.hasId(index) && !this.isNumberSet(this.formGroup().get('id')?.value)) {
            this._toastService.addErrorToast(
                $localize`:@@ox.administration.edit.answer.error.noId.title:Answer can not be saved`,
                $localize`:@@ox.administration.edit.answer.error.noId.message:The question is not saved yet, therefore the answer can not be saved. Please save the Question first.`
            );
            return;
        }
        this.currentIndex.set(index);
        this.openConfirmDialog({
            title: $localize`:@@ox.administration.edit.answer.delete.title:Save Answer`,
            message: $localize`:@@ox.administration.edit.answer.delete.message:Are you sure you want to save this answer?`,
            submitLabel: $localize`:@@ox.general.btn.delete:Save`,
            abortLabel: $localize`:@@ox.general.btn.cancel:Cancel`,
            onSubmit: () => this._saveCurrentAnswer(),
            onAbort: () => {
                this.resetDialog();
            },
        });
    }

    private _saveCurrentAnswer(): void {
        const group = this.getGroupAtIndex(this.currentIndex());
        const errorTitle = $localize`:@@ox.administration.edit.answer.error.noQuestionId.title:Answer can not be saved`;
        if (group.invalid) {
            group.markAllAsTouched();
            this._toastService.addErrorToast(
                errorTitle,
                $localize`:@@ox.administration.edit.answer.error.noQuestionId.message:The answer can not be saved because form is not valid.`
            );
            return;
        }

        const answer: IAnswer = group.getRawValue() satisfies IAnswer;
        if (!answer.questionId) {
            this._toastService.addErrorToast(
                errorTitle,
                $localize`:@@ox.administration.edit.answer.error.noQuestionId.message:The question is not saved yet, therefore the answer can not be saved. Please save the Question first.`
            );
            return;
        }

        if (answer.id) {
            answer.id = Number(answer.id);
            this._subscription$.add(this._answerService.updateAnswer(answer).subscribe((res) => {
                if (res?.id) {
                    this._addSuccessToast($localize`:@@ox.administration.edit.answer.saveAnswer.success:Answer: ${this.currentIndex() + 1} was updated successfully`);
                }
            }));
        } else {
            this._subscription$.add(this._answerService.createAnswer(answer).subscribe((res) => {
                if (res?.id) {
                    this._addSuccessToast($localize`:@@ox.administration.edit.answer.saveAnswer.success:Answer: ${this.currentIndex() + 1} was created successfully`);
                }
            }));
        }
    }

    public deleteCurrentAnswer(): void {
        const group = this.formArray.at(this.currentIndex()) as FormGroup;
        if (!this.hasId(this.currentIndex())) {
            return;
        }

        const answer: IAnswer = group.getRawValue() satisfies IAnswer;
        this._subscription$.add(this._answerService.deleteAnswerById(answer.id!).subscribe((res) => {
            if (res) {
                this._toastService.addSuccessToast(
                    $localize`:@@ox.answers.edit.delete.title:Deleted Answer`,
                    $localize`:@@ox.administration.edit.answer.delete.message:Answer with id: ${answer.id} was deleted successfully.`
                );
                this.formArray.removeAt(this.currentIndex());
                this.resetDialog();
            }
        }));
    }

    private _addSuccessToast(localizedMessage: string): void {
        this._toastService.add({
            message: localizedMessage,
            title: $localize`:@@ox.administration.edit.answer.success.title:Edit Answer success`,
            type: 'success',
            date: new Date(),
        });
    }

    public handleCorrectAnswerCheckBoxState(index: number): void {
        if (this.questionTypeSignal() === QuestionType.SINGLE_CHOICE) {
            this.formArray.controls.forEach((group, i) => {
                const ctrl = group.get('isCorrect');
                ctrl?.setValue(i === index, {
                    emitEvent: true,
                    onlySelf: true
                });
            });
        }
    }

    protected handleContextMenuAction(item: ContextMenuItem<number>, index: number): void {
        item.action(index);
    }

    protected addAnswer(): void {
        this.formArray.push(this.addAnswerFormGroup(undefined, this.assignedOptionId()));
    }
}
