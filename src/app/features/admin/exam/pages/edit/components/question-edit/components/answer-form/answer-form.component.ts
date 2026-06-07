import {
    ChangeDetectionStrategy,
    Component,
    inject,
    Input,
    input,
    InputSignal,
    OnDestroy,
} from '@angular/core';
import {
    FormArray,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
} from '@angular/forms';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {
    faAdd,
    faFloppyDisk,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import {Subscription} from 'rxjs';
import {ButtonComponent} from '../../../../../../../../../shared/components/button/button.component';
import {
    ContextMenu,
    ContextMenuItem,
} from '../../../../../../../../../shared/components/context-menu/context-menu';
import {DialogContentComponent} from '../../../../../../../../../shared/components/dialog/dialog-content.component';
import {DialogHeaderComponent} from '../../../../../../../../../shared/components/dialog/dialog-header.component';
import {DialogComponent} from '../../../../../../../../../shared/components/dialog/dialog.component';
import {BasicInputComponent} from '../../../../../../../../../shared/forms/basic-input/basic-input.component';
import {Checkbox} from '../../../../../../../../../shared/forms/checkbox/checkbox';
import {IAnswer} from '../../../../../../../../../shared/model/interfaces/answer.interface';
import {QuestionType} from '../../../../../../../../../shared/model/question-type.enum';
import {AnswersService} from '../../../../../../../../../shared/service/answers.service';
import {ToastService} from '../../../../../../../../../shared/service/toast.service';
import Logger from '../../../../../../../../../shared/util/Logger';
import {AbstractEdit} from '../abstract-edit/abstract-edit';
import Answer from "../../../../../../../../../shared/model/classes/answer.class";

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
        Checkbox,
    ],
    templateUrl: './answer-form.component.html',
    styleUrl: './answer-form.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnswerFormComponent extends AbstractEdit implements OnDestroy {
    private readonly _logger: Logger = new Logger('AnswerComponent');

    private readonly _answerService = inject(AnswersService);
    private readonly _toastService = inject(ToastService);

    protected readonly faAdd = faAdd;
    private readonly _subscription$: Subscription = new Subscription();

    protected readonly QuestionType = QuestionType;
    protected readonly contextMenuItems: ContextMenuItem<string>[] = [
        {
            label: $localize`:@@ox.general.btn.delete:Delete`,
            icon: faTrash,
            dataTestId: 'delete-answer',
            action: (param) => {
                if (typeof param === 'string' && param !== '') {
                    this.deleteAnswer(param);
                }
            },
        },
        {
            label: $localize`:@@ox.general.btn.save:Save`,
            icon: faFloppyDisk,
            dataTestId: 'save-answer',
            action: (param) => {
                if (typeof param === 'string' && param !== '') {
                    this.saveAnswer(param);
                }
            },
        },
    ];

    public readonly questionType: InputSignal<QuestionType> =
        input.required<QuestionType>();
    public readonly assignedOptionId: InputSignal<number> = input<number>(-1);

    @Input({required: true})
    public answerArray: FormArray<FormGroup> = new FormArray<FormGroup>([]);

    constructor() {
        super();

        this._subscription$.add(
            this._answerService.errors$.subscribe((errors) => {
                if (errors.length) {
                    errors.forEach((err) => {
                        this._toastService.addErrorToast(
                            $localize`:@@ox.administration.edit.answer.action.error.title:Error during Answer action`,
                            err,
                        );
                    });
                }
            }),
        );
    }

    ngOnDestroy(): void {
        this._subscription$.unsubscribe();
    }


    public deleteAnswer(internalId: string): void {
        const grp = this._getGrpByInternalId(this.answerArray, internalId);
        if (!grp) {
            return;
        }

        if (this.hasId(grp)) {
            this.openDirectActionDialog({
                title: $localize`:@@ox.administration.edit.answer.delete.directly.title:Directly delete Answer`,
                message: $localize`:@@ox.administration.edit.answer.delete.directly.message:Do you want to delete the answer directly? It will be remove permanently and cannot be restored.`,
                submitLabel: $localize`:@@ox.general.btn.delete:Delete`,
                abortLabel: $localize`:@@ox.general.btn.cancel:Cancel`,
                actionBtnLabel: $localize`:@@ox.administration.edit.answer.btn.action.delete:Delete directly`,
                onSubmit: () => {
                    this.answerArray.removeAt(this.answerArray.controls.indexOf(grp));
                    this.resetDialog();
                },
                onAbort: () => {
                    this.resetDialog();
                },
                onAction: () => {
                    this._deleteAnswerById(
                        grp.get('id')!.value,
                        this.answerArray.controls.indexOf(grp),
                    );
                },
            });
        } else {
            this.openConfirmDialog({
                title: $localize`:@@ox.administration.edit.answer.delete.title:Delete Answer`,
                message: $localize`:@@ox.administration.edit.answer.delete.message:Are you sure you want to delete this answer?`,
                submitLabel: $localize`:@@ox.general.btn.delete:Delete`,
                abortLabel: $localize`:@@ox.general.btn.cancel:Cancel`,
                onSubmit: () => {
                    this.answerArray.removeAt(this.answerArray.controls.indexOf(grp));
                    this.resetDialog();
                },
                onAbort: () => {
                    this.resetDialog();
                },
            });
        }
    }

    public saveAnswer(internalId: string): void {
        const grp = this._getGrpByInternalId(this.answerArray, internalId);
        const hasQuestionId = this._validateQuestionId(grp)
        if (!grp || !hasQuestionId) {
            return;
        }

        this.openConfirmDialog({
            title: $localize`:@@ox.administration.edit.answer.delete.title:Save Answer`,
            message: $localize`:@@ox.administration.edit.answer.delete.message:Are you sure you want to save this answer?`,
            submitLabel: $localize`:@@ox.general.btn.delete:Save`,
            abortLabel: $localize`:@@ox.general.btn.cancel:Cancel`,
            onSubmit: () => this._saveAnswerInternal(grp),
            onAbort: () => {
                this.resetDialog();
            },
        });
    }

    private _saveAnswerInternal(grp: FormGroup): void {
        const answer: IAnswer = grp.getRawValue() satisfies IAnswer;
        if (answer.id) {
            answer.id = Number(answer.id);
            this._subscription$.add(
                this._answerService.updateAnswer(new Answer(answer)).subscribe((res) => {
                    if (res?.id) {
                        this._addSuccessToast(
                            $localize`:@@ox.administration.edit.answer.saveAnswer.success:Answer was updated successfully`,
                        );
                    }
                }),
            );
        } else {
            this._subscription$.add(
                this._answerService.createAnswer(new Answer(answer)).subscribe((res) => {
                    if (res?.id) {
                        this._addSuccessToast(
                            $localize`:@@ox.administration.edit.answer.saveAnswer.success:Answer was created successfully`,
                        );
                    }
                }),
            );
        }
    }

    private _deleteAnswerById(id: number, index: number): void {
        this._subscription$.add(
            this._answerService.deleteAnswerById(id).subscribe((res) => {
                if (res) {
                    this._addSuccessToast(
                        $localize`:@@ox.administration.edit.answer.delete.message:Answer with id: ${id} was deleted successfully.`,
                    );
                    this.answerArray.removeAt(index);
                    this.resetDialog();
                }
            }),
        );
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
        if (this.questionType() === QuestionType.SINGLE_CHOICE) {
            this.answerArray.controls.forEach((group, i) => {
                const ctrl = group.get('isCorrect');
                ctrl?.setValue(i === index, {
                    emitEvent: true,
                    onlySelf: true,
                });
            });
        }
    }

    protected handleContextMenuAction(
        item: ContextMenuItem<string>,
        internalId: string,
    ): void {
        item.action(internalId);
    }

    protected addAnswer(): void {
        this.answerArray.push(
            this.addAnswerFormGroup(undefined, this.assignedOptionId()),
        );
    }

    protected getAnswerControls(): FormGroup[] {
        if (this.questionType() === QuestionType.ASSIGNMENT) {
            return this.answerArray.controls.filter((ctrl) => {
                const ctrlValue = Number(ctrl.get('assignedOptionId')?.value) || -1;
                return ctrlValue === this.assignedOptionId();
            });
        }

        return this.answerArray.controls;
    }
}
