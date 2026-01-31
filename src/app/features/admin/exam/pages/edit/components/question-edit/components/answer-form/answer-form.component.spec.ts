import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AnswerFormComponent } from './answer-form.component';
import { FormBuilder, ReactiveFormsModule, FormGroup, FormArray } from '@angular/forms';
import { AnswersService } from '../../../../../../../../../shared/service/answers.service';
import { ToastService } from '../../../../../../../../../shared/service/toast.service';
import { of, BehaviorSubject } from 'rxjs';
import { QuestionType } from '../../../../../../../../../shared/model/question-type.enum';

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
      deleteAnswerById: jest.fn().mockReturnValue(of(true))
    };
    toastServiceMock = {
      addErrorToast: jest.fn(),
      add: jest.fn(),
      addSuccessToast: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AnswerFormComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: AnswersService, useValue: answersServiceMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    })
    .compileComponents();

    fb = TestBed.inject(FormBuilder);
    parentForm = fb.group({
      id: [1],
      type: [QuestionType.SINGLE_CHOICE],
      answers: fb.array([])
    });

    fixture = TestBed.createComponent(AnswerFormComponent);
    component = fixture.componentInstance;
    
    fixture.componentRef.setInput('formGroup', parentForm);
    fixture.componentRef.setInput('formArrayName', 'answers');
    fixture.componentRef.setInput('questionType', QuestionType.SINGLE_CHOICE);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add answers when currentAnswers changes', () => {
    const answers = [{ id: 1, answerText: 'A1', isCorrect: true }];
    fixture.componentRef.setInput('currentAnswers', answers);
    fixture.detectChanges();
    
    expect(component['formArray'].length).toBe(1);
    expect(component['formArray'].at(0).get('answerText')?.value).toBe('A1');
  });

  it('should add a new answer when addAnswer is called', () => {
    component['addAnswer']();
    expect(component['formArray'].length).toBe(1);
  });

  it('should handle single choice checkbox logic', () => {
    fixture.componentRef.setInput('questionType', QuestionType.SINGLE_CHOICE);
    fixture.detectChanges();
    component['addAnswer']();
    component['addAnswer']();

    const ans1 = component['formArray'].at(0);
    const ans2 = component['formArray'].at(1);

    // Selecting one (index 0) should set isCorrect true for ans1 and false for ans2
    component.handleCorrectAnswerCheckBoxState(0);
    expect(ans1.get('isCorrect')?.value).toBe(true);
    expect(ans2.get('isCorrect')?.value).toBe(false);
  });

  it('should call answersService.createAnswer when saveCurrentAnswer is called (new answer)', fakeAsync(() => {
    component['addAnswer']();
    component['currentIndex'].set(0);
    const group = component['formArray'].at(0) as FormGroup;
    group.get('questionId')?.setValue(1);
    group.get('answerText')?.setValue('Valid Answer');
    
    component['_saveCurrentAnswer']();
    tick();
    
    expect(answersServiceMock.createAnswer).toHaveBeenCalled();
  }));

  it('should call answersService.deleteAnswerById when deleteCurrentAnswer is called', fakeAsync(() => {
    const answer = { id: 10, answerText: 'A', isCorrect: true, questionId: 1 };
    fixture.componentRef.setInput('currentAnswers', [answer]);
    fixture.detectChanges();
    
    component['currentIndex'].set(0);
    component.deleteCurrentAnswer();
    tick();
    
    expect(answersServiceMock.deleteAnswerById).toHaveBeenCalledWith(10);
    expect(component['formArray'].length).toBe(0);
  }));
});
