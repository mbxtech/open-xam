import {Component, inject, input, InputSignal, signal, WritableSignal} from '@angular/core';
import {$localize} from '@angular/localize/init';
import {DialogState} from '../../../../../../../../../shared/components/dialog/dialog.component';
import {FormArray, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {IAnswer} from '../../../../../../../../../shared/model/interfaces/answer.interface';
import {TEXT_VALIDATORS} from "../../../../../../../../../shared/forms/validation/validators-sets";

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
    onAbort: (_: unknown) => {
    },
    onSubmit: (_: unknown) => {
    },
};

const directActionDialogInitState: DirectActionDialogState = {
    ...dialogInitState,
    actionBtnLabel: $localize`:@@ox.general.btn.action: Execute Action`,
    onAction: () => { }
}

@Component({
    selector: 'ox-abstract-edit',
    imports: [],
    templateUrl: './abstract-edit.html',
    styleUrl: './abstract-edit.scss',
})
export class AbstractEdit {

    protected readonly currentIndex: WritableSignal<number> = signal<number>(-1);
    protected actionDialogState: DialogState = dialogInitState;
    protected directActionDialogState: DirectActionDialogState = directActionDialogInitState;
    public formGroup: InputSignal<FormGroup> = input.required<FormGroup>();
    public formArrayName: InputSignal<string> = input.required<string>();
    private _formBuilder: FormBuilder = inject(FormBuilder);

    protected resetDialog(): void {
        this.actionDialogState = dialogInitState;
    }

    protected resetActionDialog(): void {
        this.directActionDialogState = directActionDialogInitState;
    }

    protected openConfirmDialog(config: Partial<DialogState> & { title: string; message: string }): void {
        const onAbort = config.onAbort ?? (() => {
            this.actionDialogState = { ...this.actionDialogState, open: false };
        });
        const onSubmit = config.onSubmit ?? (() => {
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

    protected openDirectActionDialog(config: Partial<DirectActionDialogState> & { title: string, message: string }): void {
        const onAbort = config.onAbort ?? (() => {
            this.directActionDialogState = { ...this.directActionDialogState, open: false };
        });
        const onSubmit = config.onSubmit ?? (() => {
            this.directActionDialogState = { ...this.directActionDialogState, open: false };
        });
        const onAction = config.onAction ?? (() => { });
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
            onAction
        };
    }

    protected isNumberSet(id: unknown): boolean {
        return typeof id === 'number' && id >= 0;
    }

    protected hasId(index: number): boolean {
        return !!this.formArray.at(index)?.get('id')?.value;
    }

    protected get formArray(): FormArray {
        return this.formGroup().get(this.formArrayName()) as FormArray;
    }

    protected getGroupAtIndex(index: number): FormGroup {
        return this.formArray.at(index) as FormGroup;
    }

    protected get parentId(): number | undefined {
        return this.formGroup().get('id')?.value;
    }

    protected getControl(controlName: string, index: number): FormControl {
        return this.formArray.at(index).get(controlName) as FormControl;
    }

    protected addAnswerFormGroup(value?: IAnswer, assignedOptionId?: number): FormGroup {

        let parentId = this.formGroup().get('id')?.value;
        if (value) {
            parentId = value.questionId;
        }

        const fg=  this._formBuilder.group({
            id: new FormControl(value?.id ?? null),
            answerText: new FormControl(value?.answerText ?? null, {
                updateOn: 'change',
                validators: TEXT_VALIDATORS
            }),
            description: new FormControl(value?.description ?? null),
            isCorrect: new FormControl(value?.isCorrect ?? false),
            assignedOptionId: new FormControl(value?.assignedOptionId ?? assignedOptionId ?? null),
            questionId: new FormControl(parentId ?? null),
        });

        if (value) {
            fg.markAllAsTouched({emitEvent: false})
        }

        return fg;
    }

}
