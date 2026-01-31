import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { SingleChoiceViewComponent } from './single-choice-view';
import { QuestionType } from '../../../../model/question-type.enum';
import { IQuestion } from '../../../../model/interfaces/question.interface';

describe('SingleChoiceViewComponent', () => {
  let component: SingleChoiceViewComponent;
  let fixture: ComponentFixture<SingleChoiceViewComponent>;

  const mockQuestion: IQuestion = {
    id: 1,
    questionText: 'What is 1+1?',
    type: QuestionType.SINGLE_CHOICE,
    pointsTotal: 1,
    answers: [
      { id: 101, answerText: '1', isCorrect: false, description: 'Wrong answer' },
      { id: 102, answerText: '2', isCorrect: true, description: 'Correct answer' },
      { id: 103, answerText: '3', isCorrect: false, description: 'Another wrong answer' }
    ]
  };

  const originalQuestion: IQuestion = JSON.parse(JSON.stringify(mockQuestion));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleChoiceViewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SingleChoiceViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('question', mockQuestion);
    fixture.componentRef.setInput('viewMode', 'simulation');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();
    });

    it('should render all available answers', () => {
      const answerElements = fixture.debugElement.queryAll(By.css('input[type="radio"]'));
      expect(answerElements.length).toBe(3);
    });

    it('should display answer text for each option', () => {
      const labels = fixture.debugElement.queryAll(By.css('label'));
      expect(labels[0].nativeElement.textContent.trim()).toBe('1');
      expect(labels[1].nativeElement.textContent.trim()).toBe('2');
      expect(labels[2].nativeElement.textContent.trim()).toBe('3');
    });

    it('should have no answer selected by default', () => {
      const radioButtons = fixture.debugElement.queryAll(By.css('input[type="radio"]'));
      radioButtons.forEach(radio => {
        expect(radio.nativeElement.checked).toBe(false);
      });
    });

    it('should not show descriptions when not confirmed', () => {
      const descriptions = fixture.debugElement.queryAll(By.css('.text-caption'));
      expect(descriptions.length).toBe(0);
    });

    it('should not show question summary when not confirmed', () => {
      const summary = fixture.debugElement.query(By.css('ox-question-summary'));
      expect(summary).toBeFalsy();
    });
  });

  describe('Answer Selection', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();
    });

    it('should emit answerChange when an answer is selected', () => {
      jest.spyOn(component.answerChange, 'emit');

      const radioButtons = fixture.debugElement.queryAll(By.css('input[type="radio"]'));
      radioButtons[0].nativeElement.click();
      fixture.detectChanges();

      expect(component.answerChange.emit).toHaveBeenCalled();
    });

    it('should update selectedAnswer when selection changes', () => {
      const radioButtons = fixture.debugElement.queryAll(By.css('input[type="radio"]'));
      radioButtons[1].nativeElement.click();
      fixture.detectChanges();

      expect(component.selectedAnswer()?.id).toBe(102);
    });

    it('should emit updated question with correct isCorrect flags', () => {
      jest.spyOn(component.answerChange, 'emit');

      const radioButtons = fixture.debugElement.queryAll(By.css('input[type="radio"]'));
      radioButtons[1].nativeElement.click();
      fixture.detectChanges();

      const emittedQuestion = (component.answerChange.emit as jest.Mock).mock.calls[0][0];
      expect(emittedQuestion.answers[0].isCorrect).toBe(false);
      expect(emittedQuestion.answers[1].isCorrect).toBe(true);
      expect(emittedQuestion.answers[2].isCorrect).toBe(false);
    });
  });

  describe('Simulation Mode', () => {
    it('should mark correct answer green and incorrect answers red after confirmation, regardless of selection', () => {
      const userQuestion: IQuestion = JSON.parse(JSON.stringify(mockQuestion));
      userQuestion.answers[0].isCorrect = false;
      userQuestion.answers[1].isCorrect = true;
      userQuestion.answers[2].isCorrect = false;

      const resultQuestion: IQuestion = JSON.parse(JSON.stringify(mockQuestion));
      resultQuestion.answers[0].isCorrect = true;
      resultQuestion.answers[1].isCorrect = false;
      resultQuestion.answers[2].isCorrect = false;

      fixture.componentRef.setInput('question', userQuestion);
      fixture.componentRef.setInput('questionResult', resultQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const answerElements = fixture.nativeElement.querySelectorAll('.flex.flex-col.gap-3 > div');

      expect(answerElements[0].classList.contains('bg-red-50') || answerElements[0].classList.contains('dark:bg-error-50')).toBe(true);
      expect(answerElements[1].classList.contains('bg-green-50') || answerElements[1].classList.contains('dark:bg-success-50')).toBe(true);
      expect(answerElements[2].classList.contains('bg-red-50') || answerElements[2].classList.contains('dark:bg-error-50')).toBe(true);
    });

    it('should pre-select user choice after confirmation', () => {
      const resultQuestion: IQuestion = JSON.parse(JSON.stringify(mockQuestion));
      resultQuestion.answers[0].isCorrect = true;
      resultQuestion.answers[1].isCorrect = false;
      resultQuestion.answers[2].isCorrect = false;

      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionResult', resultQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const radioButtons = fixture.nativeElement.querySelectorAll('input[type="radio"]');
      expect(radioButtons[0].checked).toBe(true);
      expect(radioButtons[1].checked).toBe(false);
      expect(radioButtons[2].checked).toBe(false);
    });

    it('should disable radio buttons after confirmation', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const radioButtons = fixture.debugElement.queryAll(By.css('input[type="radio"]'));
      radioButtons.forEach(radio => {
        expect(radio.nativeElement.disabled).toBe(true);
      });
    });

    it('should show answer descriptions after confirmation', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const descriptions = fixture.debugElement.queryAll(By.css('.text-caption'));
      expect(descriptions.length).toBe(3);
      expect(descriptions[0].nativeElement.textContent.trim()).toBe('Wrong answer');
      expect(descriptions[1].nativeElement.textContent.trim()).toBe('Correct answer');
    });

    it('should show success summary when correct answer is chosen', () => {
      const userQuestion: IQuestion = JSON.parse(JSON.stringify(mockQuestion));
      userQuestion.answers[1].isCorrect = true;

      fixture.componentRef.setInput('question', userQuestion);
      fixture.componentRef.setInput('questionResult', userQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const successElement = fixture.debugElement.query(By.css('ox-question-summary-success'));
      expect(successElement).toBeTruthy();
    });

    it('should show error summary when wrong answer is chosen', () => {
      const resultQuestion: IQuestion = JSON.parse(JSON.stringify(mockQuestion));
      resultQuestion.answers[0].isCorrect = true;
      resultQuestion.answers[1].isCorrect = false;
      resultQuestion.answers[2].isCorrect = false;

      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionResult', resultQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      expect(component.isAnswerCorrectChosen()).toBe(false);
    });
  });

  describe('Preview Mode', () => {
    it('should show descriptions after confirmation in preview mode', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'preview');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const descriptions = fixture.debugElement.queryAll(By.css('.text-caption'));
      expect(descriptions.length).toBe(3);
    });

    it('should show question summary in preview mode when confirmed', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'preview');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const summary = fixture.debugElement.query(By.css('ox-question-summary'));
      expect(summary).toBeTruthy();
    });
  });

  describe('Realistic Mode', () => {
    it('should pre-fill selection based on questionResult', () => {
      const resultQuestion: IQuestion = JSON.parse(JSON.stringify(mockQuestion));
      resultQuestion.answers[0].isCorrect = false;
      resultQuestion.answers[1].isCorrect = false;
      resultQuestion.answers[2].isCorrect = true;

      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionResult', resultQuestion);
      fixture.componentRef.setInput('viewMode', 'realistic');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      expect(component.selectedAnswer()?.id).toBe(103);
    });

    it('should not show descriptions in realistic mode even when confirmed', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'realistic');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const descriptions = fixture.debugElement.queryAll(By.css('.text-caption'));
      expect(descriptions.length).toBe(0);
    });

    it('should not show question summary in realistic mode', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'realistic');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const summary = fixture.debugElement.query(By.css('ox-question-summary'));
      expect(summary).toBeFalsy();
    });

    it('should not show color coding in realistic mode', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'realistic');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const answerElements = fixture.nativeElement.querySelectorAll('.flex.flex-col.gap-3 > div');
      answerElements.forEach((element: HTMLElement) => {
        expect(element.classList.contains('bg-green-50')).toBe(false);
        expect(element.classList.contains('bg-red-50')).toBe(false);
      });
    });
  });

  describe('Correct Answer Detection', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();
    });

    it('should identify correct answer from question', () => {
      expect(component.correctAnswer()?.id).toBe(102);
    });

    it('should set isAnswerCorrectChosen to true when correct answer is selected', () => {
      component.onSelectionChange(102);
      expect(component.isAnswerCorrectChosen()).toBe(true);
    });

    it('should set isAnswerCorrectChosen to false when wrong answer is selected', () => {
      component.onSelectionChange(101);
      expect(component.isAnswerCorrectChosen()).toBe(false);
    });
  });

  describe('Available Answers', () => {
    it('should compute availableAnswers from question', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      expect(component.availableAnswers().length).toBe(3);
      expect(component.availableAnswers()).toEqual(mockQuestion.answers);
    });
  });

  describe('CSS Class Active', () => {
    it('should activate CSS classes when confirmed in simulation mode', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      expect(component.cssClassActive()).toBe(true);
    });

    it('should activate CSS classes when confirmed in preview mode', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'preview');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      expect(component.cssClassActive()).toBe(true);
    });

    it('should not activate CSS classes when not confirmed', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', false);
      fixture.detectChanges();

      expect(component.cssClassActive()).toBe(false);
    });

    it('should not activate CSS classes in realistic mode', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'realistic');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      expect(component.cssClassActive()).toBe(false);
    });
  });

  describe('Show Correct/Wrong Color Methods', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();
    });

    it('showCorrectColor should return true for correct answer', () => {
      expect(component.showCorrectColor(102)).toBe(true);
    });

    it('showCorrectColor should return false for wrong answers', () => {
      expect(component.showCorrectColor(101)).toBe(false);
      expect(component.showCorrectColor(103)).toBe(false);
    });

    it('showWrongColor should return true for wrong answers', () => {
      expect(component.showWrongColor(101)).toBe(true);
      expect(component.showWrongColor(103)).toBe(true);
    });

    it('showWrongColor should return false for correct answer', () => {
      expect(component.showWrongColor(102)).toBe(false);
    });
  });

  describe('Question Result Handling', () => {
    it('should set selectedAnswer from questionResult', () => {
      const resultQuestion: IQuestion = JSON.parse(JSON.stringify(mockQuestion));
      resultQuestion.answers[0].isCorrect = true;
      resultQuestion.answers[1].isCorrect = false;

      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionResult', resultQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      expect(component.selectedAnswer()?.id).toBe(101);
    });
  });
});
