import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnswerFormComponent } from './answer-form.component';
import {
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
} from '@angular/forms';
import { AnswersService } from '../../../../../../../../../shared/service/answers.service';
import { ToastService } from '../../../../../../../../../shared/service/toast.service';
import { BehaviorSubject, of } from 'rxjs';
import { QuestionType } from '../../../../../../../../../shared/model/question-type.enum';
import { TEXT_VALIDATORS } from '../../../../../../../../../shared/forms/validation/validators-sets';
import { By } from '@angular/platform-browser';

describe('AnswerFormComponent', () => {
    let component: AnswerFormComponent;
    let fixture: ComponentFixture<AnswerFormComponent>;
    let answersServiceMock: any;
    let toastServiceMock: any;
    let fb: FormBuilder;
    let parentForm: FormGroup;

    beforeEach(async () => {
        answersServiceMock = {
            errors$: new BehaviorSubject([]),
            createAnswer: jest.fn().mockReturnValue(of({ id: 1 })),
            updateAnswer: jest.fn().mockReturnValue(of({ id: 1 })),
            deleteAnswerById: jest.fn().mockReturnValue(of(true)),
        };
        toastServiceMock = {
            addErrorToast: jest.fn(),
            add: jest.fn(),
            addSuccessToast: jest.fn(),
        };

        await TestBed.configureTestingModule({
            imports: [AnswerFormComponent, ReactiveFormsModule],
            providers: [
                FormBuilder,
                { provide: AnswersService, useValue: answersServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
            ],
        }).compileComponents();

        fb = TestBed.inject(FormBuilder);
        parentForm = fb.group({
            id: [1],
            type: [QuestionType.SINGLE_CHOICE],
            answers: fb.array([]),
        });

        fixture = TestBed.createComponent(AnswerFormComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('formGroup', parentForm);
        fixture.componentRef.setInput('formArrayName', 'answers');
        fixture.componentRef.setInput('answerArray', parentForm.get('answers'));
        fixture.componentRef.setInput('questionType', QuestionType.SINGLE_CHOICE);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should add answers when currentAnswers changes', () => {
        const answers = new FormArray([
            new FormGroup({
                internalId: new FormControl(crypto.randomUUID()),
                id: new FormControl(1),
                answerText: new FormControl('A1', {
                    updateOn: 'change',
                    validators: TEXT_VALIDATORS,
                }),
                description: new FormControl(null),
                isCorrect: new FormControl(false),
                assignedOptionId: new FormControl(null),
                questionId: new FormControl(null),
            }),
        ]);
        fixture.componentRef.setInput('answerArray', answers);
        fixture.detectChanges();

        expect(component['answerArray'].length).toBe(1);
        expect(component['answerArray'].at(0).get('answerText')?.value).toBe('A1');
    });

    it('should add a new answer when addAnswer is called', () => {
        component['addAnswer']();
        expect(component['answerArray'].length).toBe(1);
    });

    it('should handle single choice checkbox logic', () => {
        fixture.componentRef.setInput('questionType', QuestionType.SINGLE_CHOICE);
        fixture.detectChanges();
        component['addAnswer']();
        component['addAnswer']();

        const ans1 = component['answerArray'].at(0);
        const ans2 = component['answerArray'].at(1);

        // Selecting one (index 0) should set isCorrect true for ans1 and false for ans2
        component.handleCorrectAnswerCheckBoxState(0);
        expect(ans1.get('isCorrect')?.value).toBe(true);
        expect(ans2.get('isCorrect')?.value).toBe(false);
    });

    describe('conext menu actions', () => {
        let contextMenu: any;
        let toastSpy: jest.SpyInstance;
        let answers: FormArray;

        const clickSaveButton = () => {
            const saveButton = fixture.debugElement.query(By.css('[data-testid="save-answer"]'));
            expect(saveButton).toBeTruthy();
            saveButton.nativeElement.click();
            fixture.detectChanges();
        };

        const clickSubmitButton = () => {
            const dialogSubmitBtn = fixture.debugElement.query(
                By.css('[data-testid="dialog-submit-btn"]')
            );
            expect(dialogSubmitBtn).toBeTruthy();
            dialogSubmitBtn.nativeElement.click();
            fixture.detectChanges();
        };
        const clickDeleteButton = () => {
            const dialogSubmitBtn = fixture.debugElement.query(
                By.css('[data-testid="delete-answer"]')
            );
            expect(dialogSubmitBtn).toBeTruthy();
            dialogSubmitBtn.nativeElement.click();
            fixture.detectChanges();
        };

        const clickCancelButton = () => {
            const dialogCancelButton = fixture.debugElement.query(
                By.css('[data-testid="dialog-cancel-btn"]')
            );
            expect(dialogCancelButton).toBeTruthy();
            dialogCancelButton.nativeElement.click();
            fixture.detectChanges();
        };

        beforeEach(() => {
            answers = new FormArray([
                new FormGroup({
                    internalId: new FormControl(crypto.randomUUID()),
                    id: new FormControl(null),
                    answerText: new FormControl('A1', {
                        updateOn: 'change',
                        validators: TEXT_VALIDATORS,
                    }),
                    description: new FormControl(null),
                    isCorrect: new FormControl(false),
                    assignedOptionId: new FormControl(null),
                    questionId: new FormControl(1),
                }),
            ]);

            fixture.componentRef.setInput('answerArray', answers);
            fixture.detectChanges();

            // @ts-ignore
            toastSpy = jest.spyOn(component, '_addSuccessToast');

            contextMenu = fixture.debugElement.query(By.css('#context-menu-0'));
            expect(contextMenu).toBeTruthy();
            contextMenu.nativeElement.click();
            fixture.detectChanges();
        });

        it('should create answer when dialog is confirmed', () => {
            const saveAnswerSpy = jest.spyOn(component, 'saveAnswer');
            // @ts-ignore
            const saveInternalSpy = jest.spyOn(component, '_saveAnswerInternal');
            const answerCreatSpy = jest.spyOn(answersServiceMock, 'createAnswer');
            answerCreatSpy.mockReturnValue(of({ id: 1 }));

            clickSaveButton();
            clickSubmitButton();

            expect(saveAnswerSpy).toHaveBeenCalled();
            expect(saveInternalSpy).toHaveBeenCalledWith(answers.controls[0]);
            expect(answerCreatSpy).toHaveBeenCalled();
            expect(toastSpy).toHaveBeenCalled();
        });

        it('should update answer when dialog is confirmed', () => {
            answers?.controls[0]?.get('id')?.setValue(1);
            fixture.detectChanges();

            const saveAnswerSpy = jest.spyOn(component, 'saveAnswer');
            // @ts-ignore
            const saveInternalSpy = jest.spyOn(component, '_saveAnswerInternal');
            const answerCreatSpy = jest.spyOn(answersServiceMock, 'updateAnswer');
            answerCreatSpy.mockReturnValue(of({ id: 1 }));

            clickSaveButton();
            clickSubmitButton();

            expect(saveAnswerSpy).toHaveBeenCalled();
            expect(saveInternalSpy).toHaveBeenCalled();
            expect(answerCreatSpy).toHaveBeenCalled();
            expect(toastSpy).toHaveBeenCalled();
        });

        it('should do nothing on save answer when dialog is dismissed', () => {
            const saveAnswerSpy = jest.spyOn(component, 'saveAnswer');
            // @ts-ignore
            const saveInternalSpy = jest.spyOn(component, '_saveAnswerInternal');
            const answersUpdateSpy = jest.spyOn(answersServiceMock, 'updateAnswer');
            const answerCreateSpy = jest.spyOn(answersServiceMock, 'createAnswer');

            clickSaveButton();
            clickCancelButton();

            expect(saveAnswerSpy).toHaveBeenCalled();
            expect(saveInternalSpy).not.toHaveBeenCalled();
            expect(answerCreateSpy).not.toHaveBeenCalled();
            expect(answersUpdateSpy).not.toHaveBeenCalled();
            expect(toastSpy).not.toHaveBeenCalled();
        });

        it('should not save answer if internalId of form group is not set', () => {
            // @ts-ignore
            const openConfirmDialogSpy = jest.spyOn(component, 'openConfirmDialog');
            component['saveAnswer']('unknown');

            expect(openConfirmDialogSpy).not.toHaveBeenCalled();
            expect(toastSpy).not.toHaveBeenCalled();
        });

        it('(ConfirmDialog) should delete answer when dialog is confirmed', () => {
            const deleteAnswerSpy = jest.spyOn(component, 'deleteAnswer');
            // @ts-ignore
            const deleteAnswerInternalSpy = jest.spyOn(component, '_deleteAnswerById');

            clickDeleteButton();
            clickSubmitButton();

            expect(deleteAnswerSpy).toHaveBeenCalled();
            expect(toastSpy).not.toHaveBeenCalled();
            expect(deleteAnswerInternalSpy).not.toHaveBeenCalled();
            expect(component['answerArray'].controls.length).toBe(0);
        });

        it('(DirectActionDialog) should delete answer when dialog is confirmed', () => {
            // @ts-ignore
            answers.controls[0].get('id').setValue(1);
            fixture.detectChanges();

            const deleteAnswerSpy = jest.spyOn(component, 'deleteAnswer');
            // @ts-ignore
            const deleteAnswerInternalSpy = jest.spyOn(component, '_deleteAnswerById');
            // @ts-ignore
            const directDialogSpy = jest.spyOn(component, 'openDirectActionDialog');

            clickDeleteButton();
            clickSubmitButton();

            expect(directDialogSpy).toHaveBeenCalled();
            expect(deleteAnswerSpy).toHaveBeenCalled();
            expect(toastSpy).not.toHaveBeenCalled();
            expect(deleteAnswerInternalSpy).not.toHaveBeenCalled();
            expect(component['answerArray'].controls.length).toBe(0);
        });

        it('(DirectActionDialog) should delete answer directly', () => {
            // @ts-ignore
            answers.controls[0].get('id').setValue(1);
            fixture.detectChanges();

            const deleteAnswerSpy = jest.spyOn(component, 'deleteAnswer');
            // @ts-ignore
            const deleteAnswerInternalSpy = jest.spyOn(component, '_deleteAnswerById');
            // @ts-ignore
            const directDialogSpy = jest.spyOn(component, 'openDirectActionDialog');
            const answerServiceDeleteAnswerSpy = jest.spyOn(answersServiceMock, 'deleteAnswerById');
            answerServiceDeleteAnswerSpy.mockReturnValue(of(1));

            clickDeleteButton();

            const dialogSubmitBtn = fixture.debugElement.query(
                By.css('[data-testid="direct-delete-answer"]')
            );
            expect(dialogSubmitBtn).toBeTruthy();
            dialogSubmitBtn.nativeElement.click();
            fixture.detectChanges();

            expect(directDialogSpy).toHaveBeenCalled();
            expect(deleteAnswerSpy).toHaveBeenCalled();
            expect(deleteAnswerInternalSpy).toHaveBeenCalledWith(1, 0);
            expect(toastSpy).toHaveBeenCalled();
            expect(component['answerArray'].controls.length).toBe(0);
        });

        it('(ConfirmDialog) should do not delete answer on abort', () => {
            const deleteAnswerSpy = jest.spyOn(component, 'deleteAnswer');
            // @ts-ignore
            const deleteAnswerInternalSpy = jest.spyOn(component, '_deleteAnswerById');

            clickDeleteButton();
            clickCancelButton();

            expect(deleteAnswerSpy).toHaveBeenCalled();
            expect(toastSpy).not.toHaveBeenCalled();
            expect(deleteAnswerInternalSpy).not.toHaveBeenCalled();
            expect(component['answerArray'].controls.length).toBe(1);
        });

        it('(DirectActionDialog) should do not delete answer on abort', () => {
            // @ts-ignore
            answers.controls[0].get('id').setValue(1);
            const deleteAnswerSpy = jest.spyOn(component, 'deleteAnswer');
            // @ts-ignore
            const deleteAnswerInternalSpy = jest.spyOn(component, '_deleteAnswerById');
            // @ts-ignore
            const directDialogSpy = jest.spyOn(component, 'openDirectActionDialog');
            const answerServiceDeleteAnswerSpy = jest.spyOn(answersServiceMock, 'deleteAnswerById');

            clickDeleteButton();
            clickCancelButton();

            expect(deleteAnswerSpy).toHaveBeenCalled();
            expect(directDialogSpy).toHaveBeenCalled();
            expect(answerServiceDeleteAnswerSpy).not.toHaveBeenCalled();
            expect(toastSpy).not.toHaveBeenCalled();
            expect(deleteAnswerInternalSpy).not.toHaveBeenCalled();
            expect(component['answerArray'].controls.length).toBe(1);
        });

        it('should not delete answer if internalId of form group is not set', () => {
            // @ts-ignore
            const openDirectActionDialogSpy = jest.spyOn(component, 'openDirectActionDialog');
            // @ts-ignore
            const openConfirmDialogSpy = jest.spyOn(component, 'openConfirmDialog');
            component['deleteAnswer']('unkownd');

            expect(openDirectActionDialogSpy).not.toHaveBeenCalled();
            expect(openConfirmDialogSpy).not.toHaveBeenCalled();
            expect(toastSpy).not.toHaveBeenCalled();
            expect(component['answerArray'].controls.length).toBe(1);
        });
    });

    it('Should get Answer controls by assignment option id', () => {
        const answers = new FormArray([
            new FormGroup({
                internalId: new FormControl(crypto.randomUUID()),
                id: new FormControl(10),
                answerText: new FormControl('A1', {
                    updateOn: 'change',
                    validators: TEXT_VALIDATORS,
                }),
                description: new FormControl(null),
                isCorrect: new FormControl(false),
                assignedOptionId: new FormControl(1),
                questionId: new FormControl(null),
            }),
            new FormGroup({
                internalId: new FormControl(crypto.randomUUID()),
                id: new FormControl(11),
                answerText: new FormControl('A2', {
                    updateOn: 'change',
                    validators: TEXT_VALIDATORS,
                }),
                description: new FormControl(null),
                isCorrect: new FormControl(false),
                assignedOptionId: new FormControl(null),
                questionId: new FormControl(null),
            }),
        ]);
        fixture.componentRef.setInput('questionType', QuestionType.ASSIGNMENT);
        fixture.componentRef.setInput('assignedOptionId', 1);
        fixture.componentRef.setInput('answerArray', answers);
        fixture.detectChanges();

        const result = component['getAnswerControls']();
        expect(result.length).toEqual(1);
        expect(result[0].get('answerText')?.value).toEqual('A1');
    });

    it('should get all answers question type is not assignment', () => {
        const answers = new FormArray([
            new FormGroup({
                internalId: new FormControl(crypto.randomUUID()),
                id: new FormControl(10),
                answerText: new FormControl('A1', {
                    updateOn: 'change',
                    validators: TEXT_VALIDATORS,
                }),
                description: new FormControl(null),
                isCorrect: new FormControl(false),
                assignedOptionId: new FormControl(1),
                questionId: new FormControl(null),
            }),
            new FormGroup({
                internalId: new FormControl(crypto.randomUUID()),
                id: new FormControl(11),
                answerText: new FormControl('A2', {
                    updateOn: 'change',
                    validators: TEXT_VALIDATORS,
                }),
                description: new FormControl(null),
                isCorrect: new FormControl(false),
                assignedOptionId: new FormControl(null),
                questionId: new FormControl(null),
            }),
        ]);
        fixture.componentRef.setInput('answerArray', answers);
        fixture.detectChanges();

        const result = component['getAnswerControls']();
        expect(result.length).toEqual(2);
    });

    it('should get answer form group by id', () => {
        const internalId = crypto.randomUUID();
        const answers = new FormArray([
            new FormGroup({
                internalId: new FormControl(internalId),
                id: new FormControl(null),
                answerText: new FormControl('A1', {
                    updateOn: 'change',
                    validators: TEXT_VALIDATORS,
                }),
                description: new FormControl(null),
                isCorrect: new FormControl(false),
                assignedOptionId: new FormControl(null),
                questionId: new FormControl(1),
            }),
        ]);

        fixture.componentRef.setInput('answerArray', answers);
        fixture.detectChanges();

        const toastServiceSpy = jest.spyOn(toastServiceMock, 'addErrorToast');

        const result = component['_getGrpByInternalId'](answers, internalId);

        expect(result).toEqual(answers.controls[0]);
        expect(toastServiceSpy).not.toHaveBeenCalled();
    });

    it('should not get answer form group by id', () => {
        const internalId = crypto.randomUUID();
        const answers = new FormArray([
            new FormGroup({
                internalId: new FormControl(internalId),
                id: new FormControl(null),
                answerText: new FormControl('A1', {
                    updateOn: 'change',
                    validators: TEXT_VALIDATORS,
                }),
                description: new FormControl(null),
                isCorrect: new FormControl(false),
                assignedOptionId: new FormControl(null),
                questionId: new FormControl(1),
            }),
        ]);

        fixture.componentRef.setInput('answerArray', answers);
        fixture.detectChanges();

        const toastServiceSpy = jest.spyOn(toastServiceMock, 'addErrorToast');

        const result = component['_getGrpByInternalId'](answers, 'unknown');

        expect(result).toBeNull();
        expect(toastServiceSpy).toHaveBeenCalled();
    });

    it('should validate questionId and show error', () => {
        const toastServiceSpy = jest.spyOn(toastServiceMock, 'addErrorToast');

        const result = component['_validateQuestionId'](new FormGroup({}));

        expect(result).toBeFalsy();
        expect(toastServiceSpy).toHaveBeenCalled();
    });
});
