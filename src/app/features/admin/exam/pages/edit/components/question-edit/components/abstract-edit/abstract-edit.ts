import { Component, inject, signal, WritableSignal } from '@angular/core';
import { $localize } from '@angular/localize/init';
import { DialogState } from '../../../../../../../../../shared/components/dialog/dialog.component';
import {
    AbstractControl,
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    Validators,
} from '@angular/forms';
import { IAnswer } from '../../../../../../../../../shared/model/interfaces/answer.interface';
import { TEXT_VALIDATORS } from '../../../../../../../../../shared/forms/validation/validators-sets';
import { IAssignmentOption } from '../../../../../../../../../shared/model/interfaces/assignment-option.interface';
import { IQuestion } from '../../../../../../../../../shared/model/interfaces/question.interface';
import { QuestionType } from '../../../../../../../../../shared/model/question-type.enum';
import { ToastService } from '../../../../../../../../../shared/service/toast.service';
import Logger from '../../../../../../../../../shared/util/Logger';

export interface DirectActionDialogState extends DialogState {
    actionBtnLabel: string;
    onAction: (_: unknown) => void;
}

const dialogInitState: DialogState = {
    title: '',
    message: '',
    open: false,
    abortLabel: $localize`:@@ox.general.btn.cancel:Cancel`,
    submitLabel: $localize`:@@ox.general.btn.confirm:Confirm`,
    onAbort: (_: unknown) => {},
    onSubmit: (_: unknown) => {},
};

const directActionDialogInitState: DirectActionDialogState = {
    ...dialogInitState,
    actionBtnLabel: $localize`:@@ox.general.btn.action: Execute Action`,
    onAction: () => {},
};

@Component({
    selector: 'ox-abstract-edit',
    imports: [],
    templateUrl: './abstract-edit.html',
    styleUrl: './abstract-edit.scss',
})
export class AbstractEdit {
    protected actionDialogState: DialogState = dialogInitState;
    protected directActionDialogState: DirectActionDialogState = directActionDialogInitState;
    private readonly _formBuilder: FormBuilder = inject(FormBuilder);
    protected toastService: ToastService = inject(ToastService);
    private readonly _abstractLogger: Logger = new Logger('AbstractEdit');

    protected resetDialog(): void {
        this.actionDialogState = dialogInitState;
    }

    protected resetActionDialog(): void {
        this.directActionDialogState = directActionDialogInitState;
    }

    protected openConfirmDialog(
        config: Partial<DialogState> & { title: string; message: string }
    ): void {
        const onAbort =
            config.onAbort ??
            (() => {
                this.actionDialogState = { ...this.actionDialogState, open: false };
            });
        const onSubmit =
            config.onSubmit ??
            (() => {
                this.actionDialogState = { ...this.actionDialogState, open: false };
            });
        this.actionDialogState = {
            ...dialogInitState,
            title: config.title,
            message: config.message,
            abortLabel: config.abortLabel ?? dialogInitState.abortLabel,
            submitLabel: config.submitLabel ?? dialogInitState.submitLabel,
            onAbort,
            onSubmit,
            open: true,
        };
    }

    protected openDirectActionDialog(
        config: Partial<DirectActionDialogState> & {
            title: string;
            message: string;
        }
    ): void {
        const onAbort =
            config.onAbort ??
            (() => {
                this.directActionDialogState = {
                    ...this.directActionDialogState,
                    open: false,
                };
            });
        const onSubmit =
            config.onSubmit ??
            (() => {
                this.directActionDialogState = {
                    ...this.directActionDialogState,
                    open: false,
                };
            });
        const onAction = config.onAction ?? (() => {});
        this.directActionDialogState = {
            ...directActionDialogInitState,
            title: config.title,
            message: config.message,
            abortLabel: config.abortLabel ?? directActionDialogInitState.abortLabel,
            submitLabel: config.submitLabel ?? directActionDialogInitState.submitLabel,
            actionBtnLabel: config.actionBtnLabel ?? directActionDialogInitState.actionBtnLabel,
            onAbort,
            onSubmit,
            open: true,
            onAction,
        };
    }

    protected isNumberSet(id: unknown): boolean {
        return typeof id === 'number' && id >= 0;
    }

    protected hasId(formArray: FormArray, internalId: string): boolean;
    protected hasId(formArray: FormArray, index: number): boolean;
    protected hasId(fromGroup: FormGroup): boolean;

    protected hasId(
        indexOrFormArray: number | FormArray | FormGroup,
        internalIdOrIndex?: string | number
    ): boolean {
        if (indexOrFormArray instanceof FormArray) {
            if (!internalIdOrIndex) {
                return false;
            }

            if (typeof internalIdOrIndex === 'string') {
                return !!indexOrFormArray.controls
                    .find(grp => grp.get('internalId')?.value === internalIdOrIndex)
                    ?.get('id')?.value;
            }

            return !!indexOrFormArray.at(internalIdOrIndex)?.get('id')?.value;
        }

        if (indexOrFormArray instanceof FormGroup) {
            return !!indexOrFormArray.get('id')?.value;
        }

        return false;
    }

    protected addAnswerFormGroup(value?: IAnswer, assignedOptionId?: number): FormGroup {
        const parentId = value?.questionId;

        const fg = this._formBuilder.group({
            internalId: new FormControl(crypto.randomUUID()),
            id: new FormControl(value?.id ?? null),
            answerText: new FormControl(value?.answerText ?? null, {
                updateOn: 'change',
                validators: TEXT_VALIDATORS,
            }),
            description: new FormControl(value?.description ?? null),
            isCorrect: new FormControl(value?.isCorrect ?? false),
            assignedOptionId: new FormControl(value?.assignedOptionId ?? assignedOptionId ?? null),
            questionId: new FormControl(parentId ?? null),
        });

        if (value) {
            fg.markAllAsTouched({ emitEvent: false });
        }

        return fg;
    }

    protected addAssignmentOptions(
        id: number,
        value?: IAssignmentOption,
        emitEvent: boolean = true
    ): FormGroup {
        const optionId = value?.id ?? id;
        const parentId = value?.questionId;
        return this._formBuilder.group({
            internalId: new FormControl(crypto.randomUUID()),
            id: new FormControl(value?.id ?? optionId, {
                validators: [Validators.min(1)],
            }),
            rowId: new FormControl(value?.rowId ?? null),
            text: new FormControl(value?.text ?? null, {
                validators: [Validators.required, Validators.minLength(4)],
            }),
            questionId: new FormControl(parentId ?? null),
            assignmentAnswers: new FormArray([]),
        });
    }

    protected addQuestion(question?: IQuestion, examId?: number | null | undefined) {
        const fg = this._formBuilder.group({
            internalId: new FormControl(crypto.randomUUID()),
            id: new FormControl<number | null>(question?.id ?? null),
            questionText: new FormControl<string>(question?.questionText ?? '', {
                updateOn: 'blur',
                validators: TEXT_VALIDATORS,
            }),
            pointsTotal: new FormControl<number>(question?.pointsTotal ?? 0),
            type: new FormControl<QuestionType>(question?.type || QuestionType.SINGLE_CHOICE, [
                Validators.required,
            ]),
            pointsPerCorrectAnswer: new FormControl<number | null>(
                question?.pointsPerCorrectAnswer ?? 0
            ),
            answers: new FormArray([]),
            options: new FormArray([]),
            category: new FormGroup({
                id: new FormControl<number | null>(question?.category?.id ?? null),
                name: new FormControl<string | null>(question?.category?.name ?? null),
            }),
            examId: new FormControl<number | null>(question?.examId ?? examId ?? null),
        });

        if (question) {
            fg.markAllAsTouched({ emitEvent: false });
        }

        if (question?.options?.length) {
            question.options.forEach(option => {
                (fg.get('options') as FormArray).push(this.addAssignmentOptions(option.id, option));
            });
        }

        if (question?.answers?.length) {
            question.answers.forEach(answer => {
                (fg.get('answers') as FormArray).push(this.addAnswerFormGroup(answer));
            });
        }

        return fg;
    }

    protected _getGrpByInternalId(array: FormArray, internalId: string): FormGroup | null {
        const grp = array.controls.find(grp => grp.get('internalId')?.value === internalId);
        if (!grp) {
            this._abstractLogger.logError(
                `[_getGrpByInternalId] No FormGroup found for internalId ${internalId}`,
                array
            );
            this.toastService.addErrorToast(
                $localize`:@@ox.administration.edit.error.noId.title:Answer can not be saved`,
                $localize`:@@ox.administration.edit.error.noId.message:System failure. The required answer could not be found!`
            );
            return null;
        }

        return grp as FormGroup;
    }

    protected _validateQuestionId(grp: FormGroup<any> | null): boolean {
        const questionId: number = grp?.get('questionId')?.value;
        const internalId = grp?.get('internalId')?.value;
        if (!questionId) {
            this._abstractLogger.logError(
                `[validateQuestionId] Assignment option with internalId ${internalId} has no questionId`,
                grp
            );
            this.toastService.addErrorToast(
                $localize`:@@ox.administration.edit.answer.error.noQuestionId.title:Assignment can not be saved`,
                $localize`:@@ox.administration.edit.answer.error.noQuestionId.message:The question is not saved yet, therefore the assignment can not be saved. Please save the Question first.`
            );
            return false;
        }

        return true;
    }

    protected getCtrlInternal(grp: FormGroup | AbstractControl, name: string): FormControl {
        return grp.get(name) as FormControl;
    }
}
