import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { TEXT_VALIDATORS } from '../../../../../../../shared/forms/validation/validators-sets';
import { QuestionType } from '../../../../../../../shared/model/question-type.enum';
import { CategoryService } from '../../../../../../../shared/service/category.service';
import { QuestionService } from '../../../../../../../shared/service/question.service';
import { ToastService } from '../../../../../../../shared/service/toast.service';
import { SidebarService } from '../../../../../admin-page-layout/service/sidebar.service';
import { QuestionEditComponent } from './question-edit.component';
import CurdError from '../../../../../../../shared/model/classes/curd-error.class';
import { IQuestion } from '../../../../../../../shared/model/interfaces/question.interface';
import Logger from '../../../../../../../shared/util/Logger';

// Mock IntersectionObserver for tests
class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
}

(globalThis as any).IntersectionObserver = MockIntersectionObserver;

describe('QuestionEditComponent', () => {
    let component: QuestionEditComponent;
    let fixture: ComponentFixture<QuestionEditComponent>;
    let questionServiceMock: any;
    let toastServiceMock: any;
    let categoryServiceMock: any;
    let sidebarServiceMock: any;
    let fb: FormBuilder;
    let parentForm: FormGroup;

    let defaultQuestionArray = new FormArray([
        new FormGroup({
            internalId: new FormControl(crypto.randomUUID()),
            id: new FormControl<number | null>(null),
            questionText: new FormControl<string>(''),
            pointsTotal: new FormControl<number>(0),
            type: new FormControl<QuestionType>(QuestionType.SINGLE_CHOICE),
            pointsPerCorrectAnswer: new FormControl<number | null>(0),
            answers: new FormArray([]),
            options: new FormArray([]),
            category: new FormGroup({
                id: new FormControl<number | null>(null),
                name: new FormControl<string | null>(null),
            }),
            examId: new FormControl<number | null>(null),
        }),
    ]);

    const creatQuestionFormGrp = (
        internalId: string,
        txt: string,
        type: QuestionType,
        examId?: number,
        id?: number
    ) => {
        return new FormGroup({
            internalId: new FormControl(internalId),
            id: new FormControl<number | null>(id ?? null),
            questionText: new FormControl<string>(txt),
            pointsTotal: new FormControl<number>(0),
            type: new FormControl<QuestionType>(type),
            pointsPerCorrectAnswer: new FormControl<number | null>(0),
            answers: new FormArray([]),
            options: new FormArray([]),
            category: new FormGroup({
                id: new FormControl<number | null>(null),
                name: new FormControl<string | null>(null),
            }),
            examId: new FormControl<number | null>(examId ?? null),
        });
    };

    const createQuestionGrpValidator = (
        internalId: string,
        txt: '',
        type: QuestionType,
        examId?: number,
        id?: number
    ) => {
        return new FormGroup({
            internalId: new FormControl(internalId),
            id: new FormControl<number | null>(id ?? null),
            questionText: new FormControl<string>(txt ?? '', {
                updateOn: 'blur',
                validators: TEXT_VALIDATORS,
            }),
            pointsTotal: new FormControl<number>(0),
            type: new FormControl<QuestionType>(type || QuestionType.SINGLE_CHOICE, [
                Validators.required,
            ]),
            pointsPerCorrectAnswer: new FormControl<number | null>(0),
            answers: new FormArray([]),
            options: new FormArray([]),
            category: new FormGroup({
                id: new FormControl<number | null>(null),
                name: new FormControl<string | null>(null),
            }),
            examId: new FormControl<number | null>(examId ?? null),
        });
    };

    const createFormArray = (length: number): FormArray => {
        const controls = Array.from({ length }, () => new FormControl(null));
        return new FormArray(controls);
    };

    beforeEach(async () => {
        questionServiceMock = {
            errors$: new BehaviorSubject([]),
            updateQuestion: jest.fn().mockReturnValue(of({ id: 1 })),
            createQuestion: jest.fn().mockReturnValue(of({ id: 1 })),
            deleteQuestion: jest.fn().mockReturnValue(of(true)),
        };
        toastServiceMock = {
            addErrorToast: jest.fn(),
            addSuccessToast: jest.fn(),
            add: jest.fn(),
        };
        categoryServiceMock = {
            getCategories: jest.fn().mockReturnValue(of([])),
            loading$: of(false),
            errors$: of([]),
        };
        sidebarServiceMock = {
            toggleStickyBottombar: jest.fn(),
            bottombarVisible$: jest.fn(),
            isExamEditPage: jest.fn(),
        };

        await TestBed.configureTestingModule({
            imports: [QuestionEditComponent, ReactiveFormsModule],
            providers: [
                FormBuilder,
                { provide: QuestionService, useValue: questionServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
                { provide: CategoryService, useValue: categoryServiceMock },
                { provide: SidebarService, useValue: sidebarServiceMock },
            ],
        }).compileComponents();

        fb = TestBed.inject(FormBuilder);
        parentForm = fb.group({
            id: [1],
            questions: fb.array([]),
        });

        fixture = TestBed.createComponent(QuestionEditComponent);
        component = fixture.componentInstance;

        // Set required inputs
        fixture.componentRef.setInput('formGroup', parentForm);
        fixture.componentRef.setInput('questionArray', defaultQuestionArray);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('should add new Question', () => {
        beforeEach(() => {
            fixture.componentRef.setInput(
                'questionArray',
                new FormArray([
                    creatQuestionFormGrp(crypto.randomUUID(), '', QuestionType.SINGLE_CHOICE),
                ])
            );
            fixture.detectChanges();
        });

        it('should add question by question side bar', () => {
            // @ts-ignore
            const addQuestionSpy = jest.spyOn(component, 'addQuestion');

            const btn = fixture.debugElement.query(
                By.css('[data-testid="add-question-btn-sidebar"]')
            );
            expect(btn).toBeTruthy();
            btn.nativeElement.click();

            fixture.detectChanges();

            expect(component['questionArray'].length).toBe(2);
            expect(component['_currentSelectedQuestionType']().length).toBe(1);
            expect(addQuestionSpy).toHaveBeenCalledWith(undefined);
        });

        it('should add question default button', () => {
            // @ts-ignore
            const addQuestionSpy = jest.spyOn(component, 'addQuestion');

            const addQuestionBtn = fixture.debugElement.query(
                By.css('[data-testid="add-question-btn"]')
            );
            expect(addQuestionBtn).toBeTruthy();
            addQuestionBtn.nativeElement.click();

            fixture.detectChanges();

            expect(component['questionArray'].length).toBe(2);
            expect(component['_currentSelectedQuestionType']().length).toBe(1);
            expect(addQuestionSpy).toHaveBeenCalledWith(undefined);
        });
    });

    describe('should handle context menu actions', () => {
        let contextMenu: any;
        let toastSpy: jest.SpyInstance;
        let questions: FormArray;
        let getGrpInternalSpy: jest.SpyInstance;

        const clickSaveButton = () => {
            const saveButton = fixture.debugElement.query(
                By.css('[data-testid="save-question-btn"]')
            );
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
                By.css('[data-testid="delete-question-btn"]')
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

        const openContextMenu = () => {
            contextMenu = fixture.debugElement.query(By.css('#question-context-menu-0'));
            expect(contextMenu).toBeTruthy();
            contextMenu.nativeElement.click();
            fixture.detectChanges();
        };

        beforeEach(() => {
            questions = new FormArray([
                creatQuestionFormGrp(crypto.randomUUID(), '', QuestionType.SINGLE_CHOICE, 1),
            ]);

            fixture.componentRef.setInput(
                'formGroup',
                new FormGroup({
                    id: new FormControl(),
                    questions: new FormArray([]),
                })
            );
            fixture.componentRef.setInput('questionArray', questions);
            fixture.detectChanges();

            toastSpy = jest.spyOn(component as any, '_addSuccessToast');
            getGrpInternalSpy = jest.spyOn(component as any, '_getGrpByInternalId');

            openContextMenu();
        });

        describe('save question', () => {
            it('should save new question', () => {
                const questionValueSpy = jest.spyOn(component as any, 'getQuestionValue');
                const openConfirmDialogSpy = jest.spyOn(component as any, 'openConfirmDialog');
                const _saveCurrentQuestionSpy = jest.spyOn(
                    component as any,
                    '_saveCurrentQuestion'
                );
                const updateQuestionSpy = jest
                    .spyOn(questionServiceMock, 'updateQuestion')
                    .mockReturnValue(of({ id: 1 }));

                clickSaveButton();
                clickSubmitButton();

                expect(getGrpInternalSpy).toHaveBeenCalled();
                expect(openConfirmDialogSpy).toHaveBeenCalled();
                expect(_saveCurrentQuestionSpy).toHaveBeenCalledWith(
                    component['questionArray'].at(0)
                );
                expect(questionValueSpy).toHaveBeenCalled();
                expect(updateQuestionSpy).toHaveBeenCalled();
                expect(toastSpy).toHaveBeenCalled();
            });

            it('should not save question (invalid internalId)', () => {
                const getGrpInternalSpy = jest
                    .spyOn(component as any, '_getGrpByInternalId')
                    .mockReturnValue(null);
                const openConfirmDialogSpy = jest.spyOn(component as any, 'openConfirmDialog');
                const errorToastSpy = jest.spyOn(toastServiceMock, 'addErrorToast');

                clickSaveButton();

                expect(getGrpInternalSpy).toHaveBeenCalled();
                expect(openConfirmDialogSpy).not.toHaveBeenCalled();
                expect(errorToastSpy).toHaveBeenCalledWith(
                    '@@ox.administration.edit.question.save.error.title:Question can not be saved',
                    '@@ox.administration.edit.question.error.internalId.mesasge:Question can not be saved, because of an unknown internal error. Pleae try again or remove and recreate the question.'
                );
            });

            it('should not save question (no exam id)', () => {
                const getGrpInternalSpy = jest
                    .spyOn(component as any, '_getGrpByInternalId')
                    .mockReturnValue(
                        creatQuestionFormGrp(crypto.randomUUID(), '', QuestionType.SINGLE_CHOICE)
                    );
                const openConfirmDialogSpy = jest.spyOn(component as any, 'openConfirmDialog');
                const errorToastSpy = jest.spyOn(toastServiceMock, 'addErrorToast');

                clickSaveButton();

                expect(getGrpInternalSpy).toHaveBeenCalled();
                expect(openConfirmDialogSpy).not.toHaveBeenCalled();
                expect(errorToastSpy).toHaveBeenCalledWith(
                    '@@ox.administration.edit.question.save.error.title:Question can not be saved',
                    '@@ox.administration.edit.question.error.examId.title:Question can not be saved, because the exam has not be saved yet, please save the exam first'
                );
            });

            it('should not save question (form group invalid)', () => {
                const questionGroup = createQuestionGrpValidator(
                    crypto.randomUUID(),
                    '',
                    QuestionType.SINGLE_CHOICE,
                    1
                );
                questionGroup.markAllAsTouched();
                questionGroup.updateValueAndValidity();

                fixture.detectChanges();
                expect(questionGroup.valid).toBeFalsy();

                const getGrpInternalSpy = jest
                    .spyOn(component as any, '_getGrpByInternalId')
                    .mockReturnValue(questionGroup);
                const openConfirmDialogSpy = jest.spyOn(component as any, 'openConfirmDialog');
                const errorToastSpy = jest.spyOn(toastServiceMock, 'addErrorToast');

                clickSaveButton();

                expect(getGrpInternalSpy).toHaveBeenCalled();
                expect(openConfirmDialogSpy).not.toHaveBeenCalled();
                expect(errorToastSpy).toHaveBeenCalled();
            });

            it('should not save quetion (cancel was clicked)', () => {
                const openConfirmDialogSpy = jest.spyOn(component as any, 'openConfirmDialog');
                const resetDialogSpy = jest.spyOn(component as any, 'resetDialog');

                clickSaveButton();
                clickCancelButton();

                expect(getGrpInternalSpy).toHaveBeenCalled();
                expect(openConfirmDialogSpy).toHaveBeenCalled();
                expect(resetDialogSpy).toHaveBeenCalled();
                expect(toastSpy).not.toHaveBeenCalled();
            });
        });

        describe('delete question', () => {
            it('should delete question (new question, no id)', () => {
                const confirmDialogSpy = jest.spyOn(component as any, 'openConfirmDialog');
                const _removeQuestionInternalSpy = jest.spyOn(
                    component as any,
                    '_removeQuestionInternal'
                );

                clickDeleteButton();
                clickSubmitButton();

                expect(confirmDialogSpy).toHaveBeenCalled();
                expect(_removeQuestionInternalSpy).toHaveBeenCalled();
                expect(component['questionArray'].length).toBe(0);
            });

            it('should not delete question (cancel clicked)', () => {
                const confirmDialogSpy = jest.spyOn(component as any, 'openConfirmDialog');
                const _removeQuestionInternalSpy = jest.spyOn(
                    component as any,
                    '_removeQuestionInternal'
                );
                const resetDialogSpy = jest.spyOn(component as any, 'resetDialog');

                clickDeleteButton();
                clickCancelButton();

                expect(confirmDialogSpy).toHaveBeenCalled();
                expect(_removeQuestionInternalSpy).not.toHaveBeenCalled();
                expect(resetDialogSpy).toHaveBeenCalled();
                expect(component['questionArray'].length).toBe(1);
            });

            it('should delete question (direct delete, id is set)', () => {
                const grp = creatQuestionFormGrp(
                    crypto.randomUUID(),
                    '',
                    QuestionType.SINGLE_CHOICE,
                    1,
                    1
                );
                fixture.componentRef.setInput('questionArray', new FormArray([grp]));
                fixture.detectChanges();

                const actionDialogSpy = jest.spyOn(component as any, 'openDirectActionDialog');
                const deleteQuestionSpy = jest.spyOn(component as any, 'deleteQuestion');
                const _deleteQuestionServiceSpy = jest
                    .spyOn(questionServiceMock, 'deleteQuestion')
                    .mockReturnValue(of(1));
                const resetDialogSpy = jest.spyOn(component as any, 'resetDialog');
                const _removeQuestionInternalSpy = jest.spyOn(
                    component as any,
                    '_removeQuestionInternal'
                );

                openContextMenu();
                clickDeleteButton();
                const directActionBtn = fixture.debugElement.query(
                    By.css('[data-testid="question-delete-directly"]')
                );
                expect(directActionBtn).toBeTruthy();
                directActionBtn.nativeElement.click();
                fixture.detectChanges();

                expect(getGrpInternalSpy).toHaveBeenCalled();
                expect(actionDialogSpy).toHaveBeenCalled();
                expect(deleteQuestionSpy).toHaveBeenCalledWith(1, 0);
                expect(_deleteQuestionServiceSpy).toHaveBeenCalled();
                expect(_removeQuestionInternalSpy).toHaveBeenCalled();

                expect(toastSpy).toHaveBeenCalled();
                expect(resetDialogSpy).toHaveBeenCalled();

                expect(component['questionArray'].length).toBe(0);
            });

            it('should delete question (no direct action)', () => {
                const grp = creatQuestionFormGrp(
                    crypto.randomUUID(),
                    '',
                    QuestionType.SINGLE_CHOICE,
                    1,
                    1
                );
                fixture.componentRef.setInput('questionArray', new FormArray([grp]));
                fixture.detectChanges();

                const actionDialogSpy = jest.spyOn(component as any, 'openDirectActionDialog');
                const deleteQuestionSpy = jest.spyOn(component as any, 'deleteQuestion');
                const _deleteQuestionServiceSpy = jest
                    .spyOn(questionServiceMock, 'deleteQuestion')
                    .mockReturnValue(of(1));
                const resetDialogSpy = jest.spyOn(component as any, 'resetDialog');
                const _removeQuestionInternalSpy = jest.spyOn(
                    component as any,
                    '_removeQuestionInternal'
                );

                openContextMenu();
                clickDeleteButton();
                clickSubmitButton();

                expect(getGrpInternalSpy).toHaveBeenCalled();
                expect(actionDialogSpy).toHaveBeenCalled();
                expect(deleteQuestionSpy).not.toHaveBeenCalledWith(1, 0);
                expect(_deleteQuestionServiceSpy).not.toHaveBeenCalled();
                expect(_removeQuestionInternalSpy).toHaveBeenCalled();

                expect(toastSpy).not.toHaveBeenCalled();
                expect(resetDialogSpy).toHaveBeenCalled();

                expect(component['questionArray'].length).toBe(0);
            });

            it('should not delete question (action dialog cancel clicked)', () => {
                const grp = creatQuestionFormGrp(
                    crypto.randomUUID(),
                    '',
                    QuestionType.SINGLE_CHOICE,
                    1,
                    1
                );
                fixture.componentRef.setInput('questionArray', new FormArray([grp]));
                fixture.detectChanges();

                const actionDialogSpy = jest.spyOn(component as any, 'openDirectActionDialog');
                const deleteQuestionSpy = jest.spyOn(component as any, 'deleteQuestion');
                const _deleteQuestionServiceSpy = jest
                    .spyOn(questionServiceMock, 'deleteQuestion')
                    .mockReturnValue(of(1));
                const resetDialogSpy = jest.spyOn(component as any, 'resetDialog');
                const _removeQuestionInternalSpy = jest.spyOn(
                    component as any,
                    '_removeQuestionInternal'
                );

                openContextMenu();
                clickDeleteButton();
                clickCancelButton();

                expect(getGrpInternalSpy).toHaveBeenCalled();
                expect(actionDialogSpy).toHaveBeenCalled();
                expect(deleteQuestionSpy).not.toHaveBeenCalledWith(1, 0);
                expect(_deleteQuestionServiceSpy).not.toHaveBeenCalled();
                expect(_removeQuestionInternalSpy).not.toHaveBeenCalled();

                expect(toastSpy).not.toHaveBeenCalled();
                expect(resetDialogSpy).toHaveBeenCalled();

                expect(component['questionArray'].length).toBe(1);
            });
        });

        describe('collapse questions', () => {
            it('should collapse question', () => {
                const collapseBtn = fixture.debugElement.query(
                    By.css('[data-testid="collapse-question-btn"]')
                );
                expect(collapseBtn).toBeTruthy();
                collapseBtn.nativeElement.click();

                fixture.detectChanges();

                expect(component['collapsedIndices']().length).toBe(1);
                expect(component['collapsedIndices']()).toContain(0);
            });

            it('should uncollapse question', () => {
                let collapseBtn = fixture.debugElement.query(
                    By.css('[data-testid="collapse-question-btn"]')
                );
                expect(collapseBtn).toBeTruthy();
                collapseBtn.nativeElement.click();

                fixture.detectChanges();

                expect(component['collapsedIndices']().length).toBe(1);
                expect(component['collapsedIndices']()).toContain(0);

                openContextMenu();
                collapseBtn = fixture.debugElement.query(
                    By.css('[data-testid="collapse-question-btn"]')
                );
                expect(collapseBtn).toBeTruthy();
                collapseBtn.nativeElement.click();

                fixture.detectChanges();

                expect(component['collapsedIndices']().length).toBe(0);
            });
        });
    });

    describe('handleCollapseAll', () => {
        beforeEach(() => {
            component.questionArray = createFormArray(5);
            component['collapsedIndices'].set([]);
            component['allCollapsed'].set(false);
        });

        it('should toggle allCollapsed from false to true', () => {
            component['handleCollapseAll']();
            expect(component['allCollapsed']()).toBe(true);
        });

        it('should toggle allCollapsed from true to false', () => {
            component['allCollapsed'].set(true);
            component['handleCollapseAll']();
            expect(component['allCollapsed']()).toBe(false);
        });

        it('should add all indices to collapsedIndices when collapsing', () => {
            component['handleCollapseAll']();
            expect(component['collapsedIndices']()).toEqual([0, 1, 2, 3, 4]);
        });

        it('should clear collapsedIndices when expanding', () => {
            component['allCollapsed'].set(true);
            component['collapsedIndices'].set([0, 1, 2, 3, 4]);

            component['handleCollapseAll']();

            expect(component['collapsedIndices']()).toEqual([]);
        });

        it('should only add non-collapsed indices when some are already collapsed', () => {
            // indices 1 and 3 are already collapsed
            component['collapsedIndices'].set([1, 3]);

            component['handleCollapseAll']();

            expect(component['collapsedIndices']()).toEqual([1, 3, 0, 2, 4]);
        });

        it('should not duplicate already collapsed indices', () => {
            component['collapsedIndices'].set([0, 1, 2, 3, 4]);

            component['handleCollapseAll']();

            const result = component['collapsedIndices']();
            const unique = [...new Set(result)];
            expect(result).toEqual(unique);
            expect(result).toHaveLength(5);
        });

        it('should handle empty questionArray when collapsing', () => {
            component.questionArray = createFormArray(0);

            component['handleCollapseAll']();

            expect(component['allCollapsed']()).toBe(true);
            expect(component['collapsedIndices']()).toEqual([]);
        });

        it('should handle empty questionArray when expanding', () => {
            component.questionArray = createFormArray(0);
            component['allCollapsed'].set(true);
            component['collapsedIndices'].set([]);

            component['handleCollapseAll']();

            expect(component['allCollapsed']()).toBe(false);
            expect(component['collapsedIndices']()).toEqual([]);
        });

        it('should collapse a single question', () => {
            component.questionArray = createFormArray(1);

            component['handleCollapseAll']();

            expect(component['allCollapsed']()).toBe(true);
            expect(component['collapsedIndices']()).toEqual([0]);
        });
    });

    it('should getAnswers', () => {
        const result = component.getAnswers(0);
        expect(result).toBeTruthy();
        expect(result.length).toBe(0);
    });

    it('should handleContexMenuItem', () => {
        const item = component['contextMenuItems'][0];
        const spy = jest.spyOn(item, 'action');

        component['handleContextMenuAction'](item, '');
        expect(spy).toHaveBeenCalled();
    });

    it('should get assignment options', () => {
        const result = component.getAssignmentOptions(0);
        expect(result).toBeTruthy();
        expect(result.length).toBe(0);
    });

    describe('question sidebar', () => {
        beforeEach(() => {
            const array = new FormArray([
                creatQuestionFormGrp(crypto.randomUUID(), '', QuestionType.SINGLE_CHOICE),
                creatQuestionFormGrp(crypto.randomUUID(), '', QuestionType.SINGLE_CHOICE),
                creatQuestionFormGrp(crypto.randomUUID(), '', QuestionType.SINGLE_CHOICE),
                creatQuestionFormGrp(crypto.randomUUID(), '', QuestionType.SINGLE_CHOICE),
                creatQuestionFormGrp(crypto.randomUUID(), '', QuestionType.SINGLE_CHOICE),
                creatQuestionFormGrp(crypto.randomUUID(), '', QuestionType.SINGLE_CHOICE),
                creatQuestionFormGrp(crypto.randomUUID(), '', QuestionType.SINGLE_CHOICE),
            ]);

            fixture.componentRef.setInput('questionArray', array);
            fixture.detectChanges();

            jest.clearAllMocks();
        });

        it('should scroll to question by sidebar navigation', () => {
            const mockHTMLElement = {
                scrollIntoView: jest.fn(),
            } as unknown as HTMLElement;
            const scrollToQuestionSpy = jest.spyOn(component as any, 'scrollToQuestion');
            const documentSpy = jest
                .spyOn(document, 'getElementById')
                .mockReturnValue(mockHTMLElement);
            const mockHTMLElementSpy = jest.spyOn(mockHTMLElement, 'scrollIntoView');

            const questionBtn = fixture.debugElement.query(By.css('#question-sidebar-6'));
            expect(questionBtn).toBeTruthy();
            questionBtn.nativeElement.click();
            fixture.detectChanges();

            expect(scrollToQuestionSpy).toHaveBeenCalled();
            expect(documentSpy).toHaveBeenCalled();
            expect(component['scrollingByNavigation']()).toBeTruthy();
            expect(component['currentQuestionInView']()).toBe(6);
            expect(mockHTMLElementSpy).toHaveBeenCalled();

            setTimeout(() => {
                expect(component['scrollingByNavigation']()).toBeFalsy();
            }, 500);
        });

        it('should handle onQuestionInView', () => {
            const scrollingByNavigationSpy = jest.spyOn(component as any, 'scrollingByNavigation');
            scrollingByNavigationSpy.mockReturnValue(false);

            component['scrollSideBarIfNeeded'] = jest.fn();

            const scrollSideBarIfNeededSpy = jest.spyOn(component as any, 'scrollSideBarIfNeeded');
            component['currentQuestionInView'].set(0);
            fixture.detectChanges();

            component['onQuestionInView'](true, 3);

            expect(component['previousQuestionInView']()).toBe(0);
            expect(component['currentQuestionInView']()).toBe(3);
            expect(scrollSideBarIfNeededSpy).toHaveBeenCalledWith(3);
        });

        describe('scrollSideBarIfNeeded & sidebar helpers', () => {
            const createMockElement = (rect: Partial<DOMRect> = {}): HTMLElement => {
                const el = document.createElement('div');
                el.getBoundingClientRect = jest.fn().mockReturnValue({
                    top: 0,
                    bottom: 100,
                    left: 0,
                    right: 100,
                    width: 100,
                    height: 100,
                    ...rect,
                });
                el.scrollIntoView = jest.fn();
                return el;
            };

            const createSidebarRef = (rect: Partial<DOMRect> = {}): ElementRef => {
                return {
                    nativeElement: createMockElement({ top: 0, bottom: 500, ...rect }),
                };
            };

            beforeEach(() => {
                component.sidebar = createSidebarRef({ top: 0, bottom: 500 });
                component.questionArray = createFormArray(5);
                const previousQuestionInViewSpy = jest.spyOn(
                    component as any,
                    'previousQuestionInView'
                );
                previousQuestionInViewSpy.mockReturnValue(null);
                jest.spyOn(document, 'getElementById');
            });

            afterEach(() => {
                jest.restoreAllMocks();
                document.body.innerHTML = '';
            });

            describe('_isElementInView', () => {
                describe('with rootElement', () => {
                    it('returns true when element is fully within the root element', () => {
                        const element = createMockElement({ top: 100, bottom: 200 });
                        const root = createMockElement({ top: 50, bottom: 300 });

                        expect(component['_isElementInView'](element, root)).toBe(true);
                    });

                    it('returns true when element top equals root top', () => {
                        const element = createMockElement({ top: 50, bottom: 200 });
                        const root = createMockElement({ top: 50, bottom: 300 });

                        expect(component['_isElementInView'](element, root)).toBe(true);
                    });

                    it('returns true when element bottom equals root bottom', () => {
                        const element = createMockElement({ top: 100, bottom: 300 });
                        const root = createMockElement({ top: 50, bottom: 300 });

                        expect(component['_isElementInView'](element, root)).toBe(true);
                    });

                    it('returns false when element top is above root top', () => {
                        const element = createMockElement({ top: 20, bottom: 200 });
                        const root = createMockElement({ top: 50, bottom: 300 });

                        expect(component['_isElementInView'](element, root)).toBe(false);
                    });

                    it('returns false when element bottom is below root bottom', () => {
                        const element = createMockElement({ top: 100, bottom: 400 });
                        const root = createMockElement({ top: 50, bottom: 300 });

                        expect(component['_isElementInView'](element, root)).toBe(false);
                    });

                    it('returns false when element is completely above root', () => {
                        const element = createMockElement({ top: 10, bottom: 40 });
                        const root = createMockElement({ top: 50, bottom: 300 });

                        expect(component['_isElementInView'](element, root)).toBe(false);
                    });

                    it('returns false when element is completely below root', () => {
                        const element = createMockElement({ top: 350, bottom: 450 });
                        const root = createMockElement({ top: 50, bottom: 300 });

                        expect(component['_isElementInView'](element, root)).toBe(false);
                    });
                });

                describe('without rootElement (uses window.innerHeight)', () => {
                    beforeEach(() => {
                        Object.defineProperty(globalThis, 'innerHeight', {
                            writable: true,
                            configurable: true,
                            value: 800,
                        });
                    });

                    it('returns true when element is within the viewport', () => {
                        const element = createMockElement({ top: 100, bottom: 400 });

                        expect(component['_isElementInView'](element)).toBe(true);
                    });

                    it('returns true when element top is exactly 0', () => {
                        const element = createMockElement({ top: 0, bottom: 400 });

                        expect(component['_isElementInView'](element)).toBe(true);
                    });

                    it('returns true when element bottom equals window.innerHeight', () => {
                        const element = createMockElement({ top: 200, bottom: 800 });

                        expect(component['_isElementInView'](element)).toBe(true);
                    });

                    it('returns false when element top is above viewport (negative)', () => {
                        const element = createMockElement({ top: -10, bottom: 400 });

                        expect(component['_isElementInView'](element)).toBe(false);
                    });

                    it('returns false when element bottom exceeds window.innerHeight', () => {
                        const element = createMockElement({ top: 200, bottom: 900 });

                        expect(component['_isElementInView'](element)).toBe(false);
                    });
                });
            });

            describe('_getAllSidebarElements', () => {
                it('returns elements matching each question index', () => {
                    const mockElements = [0, 1, 2].map(i => {
                        const el = createMockElement();
                        el.id = `question-sidebar-${i}`;
                        return el;
                    });

                    component.questionArray = createFormArray(3);
                    component.sidebar.nativeElement.querySelector = jest
                        .fn()
                        .mockImplementation((selector: string) => {
                            const index = Number.parseInt(
                                selector.replace('#question-sidebar-', ''),
                                10
                            );
                            return mockElements[index] ?? null;
                        });

                    const result = component['_getAllSidebarElements']();

                    expect(result).toHaveLength(3);
                    expect(result[0]).toBe(mockElements[0]);
                    expect(result[1]).toBe(mockElements[1]);
                    expect(result[2]).toBe(mockElements[2]);
                });

                it('returns null for missing elements', () => {
                    component.questionArray = createFormArray(3);
                    component.sidebar.nativeElement.querySelector = jest.fn().mockReturnValue(null);

                    const result = component['_getAllSidebarElements']();

                    expect(result).toHaveLength(3);
                    result.forEach(el => expect(el).toBeNull());
                });

                it('returns an empty array when questionArray has no controls', () => {
                    component.questionArray = createFormArray(0);
                    component.sidebar.nativeElement.querySelector = jest.fn();

                    expect(component['_getAllSidebarElements']()).toEqual([]);
                });

                it('calls querySelector with the correct selector for each control', () => {
                    component.questionArray = createFormArray(3);
                    component.sidebar.nativeElement.querySelector = jest.fn().mockReturnValue(null);

                    component['_getAllSidebarElements']();

                    expect(component.sidebar.nativeElement.querySelector).toHaveBeenNthCalledWith(
                        1,
                        '#question-sidebar-0'
                    );
                    expect(component.sidebar.nativeElement.querySelector).toHaveBeenNthCalledWith(
                        2,
                        '#question-sidebar-1'
                    );
                    expect(component.sidebar.nativeElement.querySelector).toHaveBeenNthCalledWith(
                        3,
                        '#question-sidebar-2'
                    );
                });
            });

            describe('_getCurrentSidebarElementsInView', () => {
                it('returns only elements that are within the sidebar viewport', () => {
                    const sidebarRect = { top: 0, bottom: 500 };
                    component.sidebar = createSidebarRef(sidebarRect);
                    component.questionArray = createFormArray(3);

                    const inViewEl = createMockElement({ top: 100, bottom: 200 });
                    const outOfViewEl = createMockElement({ top: 600, bottom: 700 });

                    component.sidebar.nativeElement.querySelector = jest
                        .fn()
                        .mockImplementation((selector: string) => {
                            if (selector === '#question-sidebar-0') return inViewEl;
                            if (selector === '#question-sidebar-1') return outOfViewEl;
                            if (selector === '#question-sidebar-2') return inViewEl;
                            return null;
                        });

                    const result = component['_getCurrentSidebarElementsInView']();

                    expect(result).toHaveLength(2);
                    expect(result).toContain(inViewEl);
                    expect(result).not.toContain(outOfViewEl);
                });

                it('returns an empty array when no elements are in view', () => {
                    component.sidebar = createSidebarRef({ top: 0, bottom: 100 });
                    component.questionArray = createFormArray(2);

                    const outOfViewEl = createMockElement({ top: 200, bottom: 400 });
                    component.sidebar.nativeElement.querySelector = jest
                        .fn()
                        .mockReturnValue(outOfViewEl);

                    expect(component['_getCurrentSidebarElementsInView']()).toEqual([]);
                });

                it('filters out null elements before checking visibility', () => {
                    component.sidebar = createSidebarRef({ top: 0, bottom: 500 });
                    component.questionArray = createFormArray(3);

                    const inViewEl = createMockElement({ top: 50, bottom: 150 });

                    component.sidebar.nativeElement.querySelector = jest
                        .fn()
                        .mockImplementation((selector: string) => {
                            if (selector === '#question-sidebar-0') return inViewEl;
                            return null;
                        });

                    const result = component['_getCurrentSidebarElementsInView']();

                    expect(result).toHaveLength(1);
                    expect(result[0]).toBe(inViewEl);
                });
            });

            describe('scrollSideBarIfNeeded', () => {
                describe('when the target element does not exist', () => {
                    it('returns early without scrolling', () => {
                        jest.spyOn(document, 'getElementById').mockReturnValue(null);
                        component.questionArray = createFormArray(3);

                        expect(() => component['scrollSideBarIfNeeded'](1)).not.toThrow();
                    });
                });

                describe('when the element is already in view', () => {
                    it('does not scroll the element', () => {
                        const targetEl = createMockElement({ top: 100, bottom: 200 });
                        jest.spyOn(document, 'getElementById').mockReturnValue(targetEl);

                        component.sidebar = createSidebarRef({ top: 0, bottom: 500 });
                        component.questionArray = createFormArray(3);
                        component.sidebar.nativeElement.querySelector = jest
                            .fn()
                            .mockReturnValue(targetEl);

                        component['scrollSideBarIfNeeded'](1);

                        expect(targetEl.scrollIntoView).not.toHaveBeenCalled();
                    });
                });

                describe('when the element is NOT in view', () => {
                    describe('and scrollUpIndex is negative (scroll to first element)', () => {
                        it('scrolls the first sidebar element into view', () => {
                            const sidebarRect = { top: 0, bottom: 500 };
                            component.sidebar = createSidebarRef(sidebarRect);
                            component.questionArray = createFormArray(5);

                            // First element in DOM — this is what we expect scrollIntoView to be called on
                            const firstEl = createMockElement({ top: -100, bottom: -50 }); // out of view (above sidebar)

                            // Target element is also out of view (below sidebar)
                            const targetEl = createMockElement({ top: 600, bottom: 700 });

                            // Only 3 elements are in view inside the sidebar (top: 0–500)
                            const inViewEl1 = createMockElement({ top: 50, bottom: 150 });
                            const inViewEl2 = createMockElement({ top: 150, bottom: 250 });
                            const inViewEl3 = createMockElement({ top: 250, bottom: 350 });

                            jest.spyOn(document, 'getElementById').mockImplementation(
                                (id: string) => {
                                    if (id === 'question-sidebar-0') return firstEl;
                                    return targetEl;
                                }
                            );

                            component.sidebar.nativeElement.querySelector = jest
                                .fn()
                                .mockImplementation((selector: string) => {
                                    if (selector === '#question-sidebar-0') return inViewEl1;
                                    if (selector === '#question-sidebar-1') return inViewEl2;
                                    if (selector === '#question-sidebar-2') return inViewEl3;
                                    if (selector === '#question-sidebar-3') return targetEl; // out of view
                                    if (selector === '#question-sidebar-4') return targetEl; // out of view
                                    return null;
                                });

                            const previousQuestionInViewSpy = jest.spyOn(
                                component as any,
                                'previousQuestionInView'
                            );
                            previousQuestionInViewSpy.mockReturnValue(null);

                            // index=0, elementsInView.length=3 → scrollUpIndex = 0 - 2 = -2 → negative → scroll to first
                            component['scrollSideBarIfNeeded'](0);

                            expect(firstEl.scrollIntoView).toHaveBeenCalledWith({
                                behavior: 'smooth',
                            });
                        });
                    });

                    describe('and previousQuestionInView > index (scrolling up)', () => {
                        it('scrolls the calculated scrollUpIndex element into view', () => {
                            component.sidebar = createSidebarRef({ top: 0, bottom: 500 });
                            component.questionArray = createFormArray(5);

                            const targetEl = createMockElement({ top: 600, bottom: 700 });
                            const scrollUpEl = createMockElement({ top: 50, bottom: 150 });

                            // 2 elements in view → elementsInView.length - 1 = 1
                            // index=3, scrollUpIndex = 3 - 1 = 2 (positive, not negative)
                            const inViewEl = createMockElement({ top: 100, bottom: 200 });

                            jest.spyOn(document, 'getElementById').mockImplementation(
                                (id: string) => {
                                    if (id === 'question-sidebar-3') return targetEl;
                                    return null;
                                }
                            );

                            component.sidebar.nativeElement.querySelector = jest
                                .fn()
                                .mockImplementation((selector: string) => {
                                    if (selector === '#question-sidebar-0') return inViewEl;
                                    if (selector === '#question-sidebar-1') return scrollUpEl;
                                    if (selector === '#question-sidebar-2') return inViewEl;
                                    if (selector === '#question-sidebar-3') return targetEl;
                                    return null;
                                });

                            // previousQuestionInView (5) > index (3) → scrolling up
                            const previousQuestionInViewSpy = jest.spyOn(
                                component as any,
                                'previousQuestionInView'
                            );
                            previousQuestionInViewSpy.mockReturnValue(4);

                            component['scrollSideBarIfNeeded'](3);

                            expect(scrollUpEl.scrollIntoView).toHaveBeenCalledWith({
                                behavior: 'smooth',
                            });
                        });

                        it('handles missing scrollUpIndex element gracefully', () => {
                            component.sidebar = createSidebarRef({ top: 0, bottom: 500 });
                            component.questionArray = createFormArray(5);

                            const targetEl = createMockElement({ top: 600, bottom: 700 });
                            const inViewEl = createMockElement({ top: 100, bottom: 200 });

                            jest.spyOn(document, 'getElementById').mockImplementation(
                                (id: string) => {
                                    if (id === 'question-sidebar-3') return targetEl;
                                    return null;
                                }
                            );

                            component.sidebar.nativeElement.querySelector = jest
                                .fn()
                                .mockImplementation((selector: string) => {
                                    if (selector === '#question-sidebar-0') return inViewEl;
                                    if (selector === '#question-sidebar-1') return inViewEl;
                                    return null; // scrollUpIndex element is null
                                });

                            const previousQuestionInViewSpy = jest.spyOn(
                                component as any,
                                'previousQuestionInView'
                            );
                            previousQuestionInViewSpy.mockReturnValue(5);
                            expect(() => component['scrollSideBarIfNeeded'](3)).not.toThrow();
                        });
                    });

                    describe('and scrolling forward (previousQuestionInView <= index or null)', () => {
                        it('scrolls the target element directly into view', () => {
                            component.sidebar = createSidebarRef({ top: 0, bottom: 500 });
                            component.questionArray = createFormArray(5);

                            const targetEl = createMockElement({ top: 600, bottom: 700 });
                            const inViewEl = createMockElement({ top: 100, bottom: 200 });

                            jest.spyOn(document, 'getElementById').mockImplementation(
                                (id: string) => {
                                    if (id === 'question-sidebar-4') return targetEl;
                                    return null;
                                }
                            );

                            component.sidebar.nativeElement.querySelector = jest
                                .fn()
                                .mockImplementation((selector: string) => {
                                    if (selector === '#question-sidebar-0') return inViewEl;
                                    if (selector === '#question-sidebar-1') return inViewEl;
                                    return null;
                                });

                            // previousQuestionInView (2) < index (4) → scroll forward
                            const previousQuestionInViewSpy = jest.spyOn(
                                component as any,
                                'previousQuestionInView'
                            );
                            previousQuestionInViewSpy.mockReturnValue(2);

                            component['scrollSideBarIfNeeded'](4);

                            expect(targetEl.scrollIntoView).toHaveBeenCalledWith({
                                behavior: 'smooth',
                            });
                        });

                        it('scrolls target into view when previousQuestionInView is null', () => {
                            component.sidebar = createSidebarRef({ top: 0, bottom: 500 });
                            component.questionArray = createFormArray(5);

                            const targetEl = createMockElement({ top: 600, bottom: 700 });
                            const inViewEl = createMockElement({ top: 100, bottom: 200 });

                            jest.spyOn(document, 'getElementById').mockImplementation(
                                (id: string) => {
                                    if (id === 'question-sidebar-4') return targetEl;
                                    return null;
                                }
                            );

                            component.sidebar.nativeElement.querySelector = jest
                                .fn()
                                .mockImplementation((selector: string) => {
                                    if (selector === '#question-sidebar-0') return inViewEl;
                                    if (selector === '#question-sidebar-1') return inViewEl;
                                    return null;
                                });

                            const previousQuestionInViewSpy = jest.spyOn(
                                component as any,
                                'previousQuestionInView'
                            );
                            previousQuestionInViewSpy.mockReturnValue(null);

                            component['scrollSideBarIfNeeded'](4);

                            expect(targetEl.scrollIntoView).toHaveBeenCalledWith({
                                behavior: 'smooth',
                            });
                        });

                        it('scrolls target into view when previousQuestionInView equals index', () => {
                            component.sidebar = createSidebarRef({ top: 0, bottom: 500 });
                            component.questionArray = createFormArray(5);

                            const targetEl = createMockElement({ top: 600, bottom: 700 });
                            const inViewEl = createMockElement({ top: 100, bottom: 200 });

                            jest.spyOn(document, 'getElementById').mockImplementation(
                                (id: string) => {
                                    if (id === 'question-sidebar-3') return targetEl;
                                    return null;
                                }
                            );

                            component.sidebar.nativeElement.querySelector = jest
                                .fn()
                                .mockImplementation((selector: string) => {
                                    if (selector === '#question-sidebar-0') return inViewEl;
                                    if (selector === '#question-sidebar-1') return inViewEl;
                                    return null;
                                });

                            // equal → not greater than → falls into else (scroll forward)
                            const previousQuestionInViewSpy = jest.spyOn(
                                component as any,
                                'previousQuestionInView'
                            );
                            previousQuestionInViewSpy.mockReturnValue(3);

                            component['scrollSideBarIfNeeded'](3);

                            expect(targetEl.scrollIntoView).toHaveBeenCalledWith({
                                behavior: 'smooth',
                            });
                        });
                    });

                    describe('scrollIntoView call specifics', () => {
                        it('always calls scrollIntoView with smooth behavior', () => {
                            component.sidebar = createSidebarRef({ top: 0, bottom: 500 });
                            component.questionArray = createFormArray(3);
                            const previousQuestionInViewSpy = jest.spyOn(
                                component as any,
                                'previousQuestionInView'
                            );
                            previousQuestionInViewSpy.mockReturnValue(null);

                            const targetEl = createMockElement({ top: 600, bottom: 700 });
                            jest.spyOn(document, 'getElementById').mockReturnValue(targetEl);
                            component.sidebar.nativeElement.querySelector = jest
                                .fn()
                                .mockReturnValue(null);

                            component['scrollSideBarIfNeeded'](2);

                            expect(targetEl.scrollIntoView).toHaveBeenCalledWith({
                                behavior: 'smooth',
                            });
                        });
                    });
                });
            });
        });
    });
});
