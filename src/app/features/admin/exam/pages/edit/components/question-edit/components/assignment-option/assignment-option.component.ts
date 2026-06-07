import {Component, inject, Input,} from "@angular/core";
import {FormArray, FormGroup, ReactiveFormsModule,} from "@angular/forms";
import {$localize} from "@angular/localize/init";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {faAdd, faFloppyDisk, faTrash,} from "@fortawesome/free-solid-svg-icons";
import {Subscription} from "rxjs";
import {ButtonComponent} from "../../../../../../../../../shared/components/button/button.component";
import {CardComponent} from "../../../../../../../../../shared/components/card/card.component";
import {DialogContentComponent} from "../../../../../../../../../shared/components/dialog/dialog-content.component";
import {DialogHeaderComponent} from "../../../../../../../../../shared/components/dialog/dialog-header.component";
import {DialogComponent} from "../../../../../../../../../shared/components/dialog/dialog.component";
import {BasicInputComponent} from "../../../../../../../../../shared/forms/basic-input/basic-input.component";
import FormErrorMessageExtractor from "../../../../../../../../../shared/forms/validation/form-error-message-extractor";
import {IAssignmentOption} from "../../../../../../../../../shared/model/interfaces/assignment-option.interface";
import {QuestionType} from "../../../../../../../../../shared/model/question-type.enum";
import {AssignmentOptionService} from "../../../../../../../../../shared/service/assignment-option";
import {ToastService} from "../../../../../../../../../shared/service/toast.service";
import {AbstractEdit} from "../abstract-edit/abstract-edit";
import {AnswerFormComponent} from "../answer-form/answer-form.component";
import {ContextMenu, ContextMenuItem,} from "../../../../../../../../../shared/components/context-menu/context-menu";
import Logger from "../../../../../../../../../shared/util/Logger";

@Component({
  selector: "ox-assignment-option",
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
    ContextMenu,
  ],
  templateUrl: "./assignment-option.component.html",
  styleUrl: "./assignment-option.component.scss",
})
export class AssignmentOptionComponent extends AbstractEdit {
  private readonly _logger = new Logger('AssignmentOptionComponent');

  protected readonly faAdd = faAdd;
  protected readonly faTrash = faTrash;
  protected readonly QuestionType = QuestionType;

  private readonly _assignmentOptionService = inject(AssignmentOptionService);
  private readonly _toastService = inject(ToastService);
  private readonly _subscriptions$: Subscription = new Subscription();

  @Input({ required: true })
  public optionsArray: FormArray<FormGroup> = new FormArray<FormGroup>([]);

  @Input({ required: true })
  public answerArray: FormArray<FormGroup> = new FormArray<FormGroup>([]);

  protected readonly contextMenuItems: ContextMenuItem<string>[] = [
    {
      label: $localize`:@@ox.general.delete:Delete`,
      icon: faTrash,
      action: (param) => {
        if (typeof param === "string" && param !== '') {
          this.deleteAssignmentOption(param);
        }
      },
    },
    {
      label: $localize`:@@ox.general.delete:Save`,
      icon: faFloppyDisk,
      action: (param) => {
        if (typeof param === "string" && param !== '') {
          this.openSaveDialog(param);
        }
      },
    },
  ];

  constructor() {
    super();
  }

  protected addAssignmentOptionInternal(id: number): void {
    this.optionsArray.push(this.addAssignmentOptions(id));
  }

  private _saveAssignmentOption(grp: FormGroup): void {
    const assignmentToSave: IAssignmentOption =
      grp.getRawValue() satisfies IAssignmentOption;
    if (assignmentToSave?.id) {
      this._subscriptions$.add(
        this._assignmentOptionService
          .update(assignmentToSave)
          .subscribe((res) => {
            if (res) {
              this._toastService.addSuccessToast(
                $localize`:@@ox.administration.edit.assignment.save.success.title:Successfully updated assignment option`,
                $localize`:@@ox.administration.edit.assignment.save.success.message:Assignment option with id ${assignmentToSave.id} was updated successfully.`,
              );
              this.resetDialog();
            }
          }),
      );
    } else {
      this._subscriptions$.add(
        this._assignmentOptionService
          .create(assignmentToSave)
          .subscribe((res) => {
            if (res) {
              this._toastService.addSuccessToast(
                $localize`:@@ox.administration.edit.assignment.save.success.title:Successfully created assignment option`,
                $localize`:@@ox.administration.edit.assignment.save.success.message:Assignment option was created successfully.`,
              );
              this.resetDialog();
            }
          }),
      );
    }
  }

  private _deleteAssignmentOption(grp: FormGroup): void {
    const id = Number(grp.get('id')?.value);
    this._subscriptions$.add(
      this._assignmentOptionService.deleteById(id).subscribe((res) => {
        if (res) {
          this._toastService.addSuccessToast(
            $localize`:@@ox.administration.edit.assignment.delete.success.title:Assigment was deleted`,
            $localize`:@@ox.administration.edit.assignment.delete.success.title:Assignment with id ${id} was deleted successfully.`,
          );
          this._removeAssignmentOption(grp);
        }
      }),
    );
  }

  private _removeAssignmentOption(grp: FormGroup) {
    const answerIndices = this.answerArray.controls.filter((grp) => grp.get('assignedOptionId')?.value === grp.get('id')?.value)
        .map((_, index) => index);
    answerIndices.forEach((index) => this.answerArray.removeAt(index));
    this.optionsArray.removeAt(this.optionsArray.controls.indexOf(grp));
  }

  protected deleteAssignmentOption(internalId: string) {
    const grp = this._getGrpByInternalId(this.optionsArray, internalId);
    if (!grp) {
      return;
    }

    if (this.hasId(grp)) {
      this.openDirectActionDialog({
        title: $localize`:@@ox.administration.edit.assignment.edit.delete.title:Directly delete Question`,
        message: $localize`:@@ox.administration.edit.assignment.edit.delete.message:Do you want to delete the assignment option directly? It will be remove permanently and cannot be restored.`,
        submitLabel: $localize`:@@es.general.btn.deleteDirectly:Delete directly`,
        abortLabel: $localize`:@@es.general.btn.cancel:Cancel`,
        onSubmit: () => {
          this._removeAssignmentOption(grp);
          this.resetDialog();
        },
        onAction: () => this._deleteAssignmentOption(grp),
        onAbort: () => {
          this.resetDialog();
        },
      });
    } else {
      this.openConfirmDialog({
        title: $localize`:@@ox.administration.edit.assignment.edit.delete.title:Delete assignment option`,
        message: $localize`:@@ox.administration.edit.assignment.edit.delete.message:Do you want to delete the assignment option directly?`,
        submitLabel: $localize`:@@ox.general.btn.deleteDirectly:Delete`,
        abortLabel: $localize`:@@ox.general.btn.cancel:Cancel`,
        onSubmit: () => {
          this._removeAssignmentOption(grp);
          this.resetDialog();
        },
        onAbort: () => {
          this.resetDialog();
        },
      });
    }
  }

  public openSaveDialog(internalId: string): void {
    const grp = this._getGrpByInternalId(this.optionsArray, internalId);
    const hasQuestionId = this._validateQuestionId(grp);
    if (!grp || !hasQuestionId) {
      return;
    }

    if (!grp.valid) {
      grp.markAllAsTouched();
      const errors = FormErrorMessageExtractor.extractMessagesAsString(grp);
      this._toastService.addErrorToast(
          $localize`:@@ox.administration.edit.assignment.save.error.title:Unable to save assignment option`,
          $localize`:@@ox.administration.edit.assignment.save.error.message: Could not save assignment because form is not valid: ${errors}`,
      );
      return;
    }


    this.openConfirmDialog({
      title: $localize`:@@ox.administration.edit.assignment.edit.save.title:Save Assigment`,
      message: $localize`:@@ox.administration.edit.assignment.edit.save.message:Do you want to save the current changes to this assigment?`,
      submitLabel: $localize`:@@ox.general.btn.save:Save`,
      abortLabel: $localize`:@@ox.general.btn.cancel:Cancel`,
      onSubmit: () => this._saveAssignmentOption(grp),
      onAbort: () => {
        this.resetDialog();
      },
    });
  }

  protected handleContextMenuAction(
    item: ContextMenuItem<string>,
    internalId: string,
  ): void {
    item.action(internalId);
  }

}
