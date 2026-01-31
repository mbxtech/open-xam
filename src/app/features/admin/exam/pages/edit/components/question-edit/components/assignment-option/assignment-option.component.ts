import { Component, effect, inject, input, InputSignal, OnInit, output, OutputEmitterRef } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { $localize } from '@angular/localize/init';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faAdd, faFloppyDisk, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { ButtonComponent } from '../../../../../../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../../../../../../shared/components/card/card.component';
import { DialogContentComponent } from "../../../../../../../../../shared/components/dialog/dialog-content.component";
import { DialogHeaderComponent } from "../../../../../../../../../shared/components/dialog/dialog-header.component";
import { DialogComponent } from "../../../../../../../../../shared/components/dialog/dialog.component";
import { BasicInputComponent } from '../../../../../../../../../shared/forms/basic-input/basic-input.component';
import FormErrorMessageExtractor from '../../../../../../../../../shared/forms/validation/form-error-message-extractor';
import { IAnswer } from '../../../../../../../../../shared/model/interfaces/answer.interface';
import { IAssignmentOption } from '../../../../../../../../../shared/model/interfaces/assignment-option.interface';
import { QuestionType } from '../../../../../../../../../shared/model/question-type.enum';
import { AssignmentOptionService } from '../../../../../../../../../shared/service/assignment-option';
import { ToastService } from '../../../../../../../../../shared/service/toast.service';
import { AbstractEdit } from '../abstract-edit/abstract-edit';
import { AnswerFormComponent } from '../answer-form/answer-form.component';
import { ContextMenuItem, ContextMenu } from '../../../../../../../../../shared/components/context-menu/context-menu';

interface AssignmentOptionForm extends IAssignmentOption {
    assignmentAnswers: IAnswer[]

}

@Component({
    selector: 'ox-assignment-option',
    imports: [
        FaIconComponent,
        ReactiveFormsModule,
        BasicInputComponent,
        AnswerFormComponent,
        CardComponent,
        ButtonComponent,
        DialogComponent,
        DialogHeaderComponent,
        DialogContentComponent,
        ContextMenu
    ],
    templateUrl: './assignment-option.component.html',
    styleUrl: './assignment-option.component.scss',
})
export class AssignmentOptionComponent extends AbstractEdit implements OnInit {
    protected readonly faAdd = faAdd;
    protected readonly faTrash = faTrash;
    protected readonly QuestionType = QuestionType;

    private readonly _fb: FormBuilder = inject(FormBuilder);
    private readonly _assignmentOptionService = inject(AssignmentOptionService);
    private readonly _toastService = inject(ToastService);
    private _subscriptions$: Subscription = new Subscription();

    public answers: InputSignal<IAnswer[]> = input<IAnswer[]>([]);
    public assignmentOptions: InputSignal<IAssignmentOption[]> = input<IAssignmentOption[]>([]);

    public answerChange: OutputEmitterRef<IAnswer[]> = output<IAnswer[]>();

    protected readonly contextMenuItems: ContextMenuItem<number>[] = [
        {
            label: $localize`:@@ox.general.delete:Delete`,
            icon: faTrash,
            action: (param) => {
                if (typeof param === 'number' && param >= 0) {
                    this.deleteAssignmentOptionAtIndex(param);
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
        }
    ];

    constructor() {
        super();
        effect(() => {
            const options = this.assignmentOptions();
            this.formArray.clear({ emitEvent: false });
            if (options && options.length) {
                options.forEach(assignmentOption => this.addAssignmentOption(assignmentOption, false));
                this.formGroup().updateValueAndValidity({ emitEvent: false })
            }
        });

    }

    ngOnInit(): void {
        this._subscriptions$.add(this.formArray.valueChanges.subscribe((value: AssignmentOptionForm[]) => {
            if (value.length) {
                const answersFlatten = value.flatMap((val) => val.assignmentAnswers);
                this.answerChange.emit(answersFlatten);
            }
        }));
    }

    public addAssignmentOption(value?: IAssignmentOption, emitEvent: boolean = true): void {
        const optionId = value?.id ?? this._generateId();
        let parentId = this.formGroup().get('id')?.value;
        if (value) {
            parentId = value.questionId;
        }
        const assignmentGroup = this._fb.group({
            id: new FormControl(value?.id ?? optionId, { validators: [Validators.min(1)] }),
            rowId: new FormControl(value?.rowId ?? null),
            text: new FormControl(value?.text ?? null, { validators: [Validators.required, Validators.minLength(4)] }),
            questionId: new FormControl(parentId ?? null),
            assignmentAnswers: new FormArray([])
        });

        if (this.answers().length) {
            const answersAssigned = this.answers().filter((a) => a.assignedOptionId === optionId);
            answersAssigned.forEach((a) => {
                const answerGroup = this.addAnswerFormGroup(a);
                (assignmentGroup.get('assignmentAnswers') as FormArray).push(answerGroup);
            });
        }

        if (value) {
            assignmentGroup.markAllAsTouched({emitEvent: false})
        }

        this.formArray.push(assignmentGroup, { emitEvent });
    }

    private _showMissingIdToast(title: string): void {
        this._toastService.addErrorToast(
            title,
            $localize`:@@ox.administration.edit.assignment.save.error.message: Could not save assignment because question was not saved yet. Please consider saving the question first.`
        );
    }

    private _saveAssignmentOption(): void {
        const errorTitle = $localize`:@@ox.administration.edit.assignment.save.error.title:Unable to save assignment option`;
        if (!this.parentId) {
            this._showMissingIdToast(errorTitle);
            this.resetDialog();
            return;
        }

        const group = this.getGroupAtIndex(this.currentIndex());
        if (!group.valid) {
            group.markAllAsTouched();
            const errors = FormErrorMessageExtractor.extractMessagesAsString(group);
            this._toastService.addErrorToast(
                errorTitle,
                $localize`:@@ox.administration.edit.assignment.save.error.message: Could not save assignment because form is not valid: ${errors}`
            );
            return;
        }

        const assignmentToSave: IAssignmentOption = group.getRawValue() satisfies IAssignmentOption;
        if (assignmentToSave?.id) {
            this._subscriptions$.add(this._assignmentOptionService.update(assignmentToSave).subscribe((res) => {
                if (res) {
                    this._toastService.addSuccessToast(
                        $localize`:@@ox.administration.edit.assignment.save.success.title:Successfully updated assignment option`,
                        $localize`:@@ox.administration.edit.assignment.save.success.message:Assignment option with id ${assignmentToSave.id} was updated successfully.`
                    );
                    this.resetDialog();
                }
            }));
        } else {
            this._subscriptions$.add(this._assignmentOptionService.create(assignmentToSave).subscribe((res) => {
                if (res) {
                    this._toastService.addSuccessToast(
                        $localize`:@@ox.administration.edit.assignment.save.success.title:Successfully created assignment option`,
                        $localize`:@@ox.administration.edit.assignment.save.success.message:Assignment option was created successfully.`
                    );
                    this.resetDialog();
                }
            }));
        }

    }

    private _deleteAssignmentOption(): void {
        if (!this.hasId(this.currentIndex())) {
            this._showMissingIdToast($localize`:@@ox.administration.edit.assignment.delete.error.title:Assignment could not be deleted`);
            this.resetDialog();
            return;
        }

        const id = Number(this.getGroupAtIndex(this.currentIndex()).get('id')?.value);
        this._subscriptions$.add(this._assignmentOptionService.deleteById(id).subscribe((res) => {
            if (res) {
                this._toastService.addSuccessToast(
                    $localize`:@@ox.administration.edit.assignment.delete.success.title:Assigment was deleted`,
                    $localize`:@@ox.administration.edit.assignment.delete.success.title:Assignment with id ${id} was deleted successfully.`,
                );
                this.formArray.removeAt(this.currentIndex());
            }
        }));
    }

    protected deleteAssignmentOptionAtIndex(index: number) {
        if (this.hasId(index)) {
            this.currentIndex.set(index);
            this.openDirectActionDialog({
                title: $localize`:@@ox.administration.edit.assignment.edit.delete.title:Directly delete Question`,
                message: $localize`:@@ox.administration.edit.assignment.edit.delete.message:Do you want to delete the assignment option directly? It will be remove permanently and cannot be restored.`,
                submitLabel: $localize`:@@es.general.btn.deleteDirectly:Delete directly`,
                abortLabel: $localize`:@@es.general.btn.cancel:Cancel`,
                onSubmit: () => {
                    this.formArray.removeAt(this.currentIndex());
                    this.resetDialog();
                },
                onAction: () => this._deleteAssignmentOption(),
                onAbort: () => {
                    this.resetDialog();
                }
            });
        } else {
            this.openConfirmDialog({
                title: $localize`:@@ox.administration.edit.assignment.edit.delete.title:Delete assignment option`,
                message: $localize`:@@ox.administration.edit.assignment.edit.delete.message:Do you want to delete the assignment option directly?`,
                submitLabel: $localize`:@@ox.general.btn.deleteDirectly:Delete`,
                abortLabel: $localize`:@@ox.general.btn.cancel:Cancel`,
                onSubmit: () => {
                    this.formArray.removeAt(index);
                    this.resetDialog();
                },
                onAbort: () => {
                    this.resetDialog();
                }
            });
        }
    }

    public openSaveDialog(index: number): void {
        this.currentIndex.set(index);
        this.openConfirmDialog({
            title: $localize`:@@ox.administration.edit.assignment.edit.save.title:Save Assigment`,
            message: $localize`:@@ox.administration.edit.assignment.edit.save.message:Do you want to save the current changes to this assigment?`,
            submitLabel: $localize`:@@ox.general.btn.save:Save`,
            abortLabel: $localize`:@@ox.general.btn.cancel:Cancel`,
            onSubmit: () => this._saveAssignmentOption(),
            onAbort: () => {
                this.resetDialog();
            }
        });
    }

    protected handleContextMenuAction(item: ContextMenuItem<number>, index: number): void {
        item.action(index);
    }

    private _generateId(): number {
        return this.formArray.length + 1;
    }

}
