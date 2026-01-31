import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {QuestionEditComponent} from './question-edit.component';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {QuestionService} from '../../../../../../../shared/service/question.service';
import {ToastService} from '../../../../../../../shared/service/toast.service';
import {BehaviorSubject, of} from 'rxjs';
import {QuestionType} from '../../../../../../../shared/model/question-type.enum';
import {CategoryService} from '../../../../../../../shared/service/category.service';

// Mock IntersectionObserver for tests
class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
}

(global as any).IntersectionObserver = MockIntersectionObserver;

describe('QuestionEditComponent', () => {
    let component: QuestionEditComponent;
    let fixture: ComponentFixture<QuestionEditComponent>;
    let questionServiceMock: any;
    let toastServiceMock: any;
    let categoryServiceMock: any;
    let fb: FormBuilder;
    let parentForm: FormGroup;

    beforeEach(async () => {
        questionServiceMock = {
            errors$: new BehaviorSubject([]),
            updateQuestion: jest.fn().mockReturnValue(of({id: 1})),
            createQuestion: jest.fn().mockReturnValue(of({id: 1})),
            deleteQuestion: jest.fn().mockReturnValue(of(true))
        };
        toastServiceMock = {
            addErrorToast: jest.fn(),
            addSuccessToast: jest.fn(),
            add: jest.fn()
        };
        categoryServiceMock = {
            getCategories: jest.fn().mockReturnValue(of([])),
            loading$: of(false),
            errors$: of([])
        };

        await TestBed.configureTestingModule({
            imports: [QuestionEditComponent, ReactiveFormsModule],
            providers: [
                FormBuilder,
                {provide: QuestionService, useValue: questionServiceMock},
                {provide: ToastService, useValue: toastServiceMock},
                {provide: CategoryService, useValue: categoryServiceMock}
            ]
        })
            .compileComponents();

        fb = TestBed.inject(FormBuilder);
        parentForm = fb.group({
            id: [1],
            questions: fb.array([])
        });

        fixture = TestBed.createComponent(QuestionEditComponent);
        component = fixture.componentInstance;

        // Set required inputs
        fixture.componentRef.setInput('formGroup', parentForm);
        fixture.componentRef.setInput('formArrayName', 'questions');

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should add questions when questionsInput changes', () => {
        const questions = [{id: 1, questionText: 'Q1', type: QuestionType.SINGLE_CHOICE, answers: []}];
        fixture.componentRef.setInput('questionsInput', questions);
        fixture.detectChanges();

        expect(component['formArray'].length).toBe(1);
        expect(component['formArray'].at(0).get('questionText')?.value).toBe('Q1');
    });

    it('should add a new question when addQuestion is called', () => {
        component['addQuestion']();
        expect(component['formArray'].length).toBe(1);
        expect(component['formArray'].at(0).get('id')?.value).toBeNull();
    });

    it('should remove a question from formArray when removeQuestion is called (no id)', () => {
        component['addQuestion']();
        expect(component['formArray'].length).toBe(1);

        jest.spyOn(component as any, 'openConfirmDialog').mockImplementation((config: any) => {
            config.onSubmit();
        });

        component['removeQuestion'](0);
        expect(component['formArray'].length).toBe(0);
    });

    it('should open save dialog and save question', () => {
        component['addQuestion']({
            id: 1, questionText: 'Q1', type: QuestionType.SINGLE_CHOICE, answers: [],
            pointsTotal: 0
        });
        const saveSpy = jest.spyOn(component as any, '_saveCurrentQuestion');

        jest.spyOn(component as any, 'openConfirmDialog').mockImplementation((config: any) => {
            config.onSubmit();
        });

        component.openSaveDialog(0);
        expect(saveSpy).toHaveBeenCalled();
    });

    it('should call questionService.updateQuestion when saveCurrentQuestion is called for existing question', fakeAsync(() => {
        const question = {
            id: 1,
            questionText: 'Valid question text',
            type: QuestionType.SINGLE_CHOICE,
            answers: [{id: 1, answerText: 'A1', isCorrect: true}],
            pointsTotal: 10,
            pointsPerCorrectAnswer: 10
        };
        component['addQuestion'](question);
        component['currentIndex'].set(0);

        component['_saveCurrentQuestion']();
        tick();

        expect(questionServiceMock.updateQuestion).toHaveBeenCalled();
    }));

    it('should call questionService.deleteQuestion when deleteQuestion is called', fakeAsync(() => {
        const question = {
            id: 10,
            questionText: 'Valid question text',
            type: QuestionType.SINGLE_CHOICE,
            answers: [],
            pointsTotal: 10,
            pointsPerCorrectAnswer: 10
        };
        component['addQuestion'](question);
        component['currentIndex'].set(0);

        component.deleteQuestion();
        tick();

        expect(questionServiceMock.deleteQuestion).toHaveBeenCalledWith(10);
        expect(component['formArray'].length).toBe(0);
    }));

    it('should update collapsed indices', () => {
        component['addQuestion']();
        component['addQuestion']();

        expect(component.isCollapsed(0)).toBe(false);

        const collapseAction = component['contextMenuItems'].find(i => i.label.includes('Collapse'));
        collapseAction?.action(0);

        expect(component.isCollapsed(0)).toBe(true);
        expect(component.isCollapsed(1)).toBe(false);
    });
});
