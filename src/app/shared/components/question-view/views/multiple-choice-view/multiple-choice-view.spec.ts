import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MultipleChoiceViewComponent } from './multiple-choice-view';
import { QuestionType } from '../../../../model/question-type.enum';
import { IQuestion } from '../../../../model/interfaces/question.interface';

describe('MultipleChoiceViewComponent', () => {
  let component: MultipleChoiceViewComponent;
  let fixture: ComponentFixture<MultipleChoiceViewComponent>;

  const mockQuestion: IQuestion = {
    id: 1,
    questionText: 'Which are primary colors?',
    type: QuestionType.MULTIPLE_CHOICE,
    pointsTotal: 2,
    answers: [
      { id: 101, answerText: 'Red', isCorrect: true, description: 'Red is primary' },
      { id: 102, answerText: 'Green', isCorrect: false, description: 'Green is secondary' },
      { id: 103, answerText: 'Blue', isCorrect: true, description: 'Blue is primary' }
    ]
  };

  const originalQuestion: IQuestion = JSON.parse(JSON.stringify(mockQuestion));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultipleChoiceViewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MultipleChoiceViewComponent);
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
      const checkboxes = fixture.debugElement.queryAll(By.css('input[type="checkbox"]'));
      expect(checkboxes.length).toBe(3);
    });

    it('should display answer text for each option', () => {
      const labels = fixture.debugElement.queryAll(By.css('label'));
      expect(labels[0].nativeElement.textContent.trim()).toBe('Red');
      expect(labels[1].nativeElement.textContent.trim()).toBe('Green');
      expect(labels[2].nativeElement.textContent.trim()).toBe('Blue');
    });

    it('should have no answers selected by default', () => {
      expect(component.selectedAnswers().size).toBe(0);
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

    it('should emit answerChange when an answer is toggled', () => {
      jest.spyOn(component.answerChange, 'emit');

      const checkboxes = fixture.debugElement.queryAll(By.css('input[type="checkbox"]'));
      checkboxes[0].nativeElement.click();
      fixture.detectChanges();

      expect(component.answerChange.emit).toHaveBeenCalled();
    });

    it('should add answer to selectedAnswers when clicked', () => {
      const checkboxes = fixture.debugElement.queryAll(By.css('input[type="checkbox"]'));
      checkboxes[0].nativeElement.click();
      fixture.detectChanges();

      expect(component.selectedAnswers().has(101)).toBe(true);
    });

    it('should remove answer from selectedAnswers when clicked again', () => {
      const checkboxes = fixture.debugElement.queryAll(By.css('input[type="checkbox"]'));

      checkboxes[0].nativeElement.click();
      fixture.detectChanges();
      expect(component.selectedAnswers().has(101)).toBe(true);

      checkboxes[0].nativeElement.click();
      fixture.detectChanges();
      expect(component.selectedAnswers().has(101)).toBe(false);
    });

    it('should allow multiple answers to be selected', () => {
      const checkboxes = fixture.debugElement.queryAll(By.css('input[type="checkbox"]'));

      checkboxes[0].nativeElement.click();
      checkboxes[2].nativeElement.click();
      fixture.detectChanges();

      expect(component.selectedAnswers().size).toBe(2);
      expect(component.selectedAnswers().has(101)).toBe(true);
      expect(component.selectedAnswers().has(103)).toBe(true);
    });

    it('should emit updated question with correct isCorrect flags', () => {
      jest.spyOn(component.answerChange, 'emit');

      const checkboxes = fixture.debugElement.queryAll(By.css('input[type="checkbox"]'));
      checkboxes[0].nativeElement.click();
      checkboxes[2].nativeElement.click();
      fixture.detectChanges();

      const emittedQuestion = (component.answerChange.emit as jest.Mock).mock.calls[1][0];
      expect(emittedQuestion.answers[0].isCorrect).toBe(true);
      expect(emittedQuestion.answers[1].isCorrect).toBe(false);
      expect(emittedQuestion.answers[2].isCorrect).toBe(true);
    });
  });

  describe('Simulation Mode', () => {
    it('should mark all correct answers green and all incorrect answers red after confirmation', () => {
      const resultQuestion: IQuestion = JSON.parse(JSON.stringify(mockQuestion));
      resultQuestion.answers[0].isCorrect = true;
      resultQuestion.answers[1].isCorrect = true;
      resultQuestion.answers[2].isCorrect = false;

      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionResult', resultQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const answerElements = fixture.nativeElement.querySelectorAll('.flex.flex-col.gap-3 > div');

      expect(answerElements[0].classList.contains('bg-green-50') || answerElements[0].classList.contains('dark:bg-success-50')).toBe(true);
      expect(answerElements[1].classList.contains('bg-red-50') || answerElements[1].classList.contains('dark:bg-error-50')).toBe(true);
      expect(answerElements[2].classList.contains('bg-green-50') || answerElements[2].classList.contains('dark:bg-success-50')).toBe(true);
    });

    it('should pre-select user choices after confirmation', () => {
      const resultQuestion: IQuestion = JSON.parse(JSON.stringify(mockQuestion));
      resultQuestion.answers[0].isCorrect = true;
      resultQuestion.answers[1].isCorrect = true;
      resultQuestion.answers[2].isCorrect = false;

      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionResult', resultQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes[0].checked).toBe(true);
      expect(checkboxes[1].checked).toBe(true);
      expect(checkboxes[2].checked).toBe(false);
    });

    it('should disable checkboxes after confirmation', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const checkboxes = fixture.debugElement.queryAll(By.css('input[type="checkbox"]'));
      checkboxes.forEach(checkbox => {
        expect(checkbox.nativeElement.disabled).toBe(true);
      });
    });

    it('should show answer descriptions after confirmation', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const descriptions = fixture.debugElement.queryAll(By.css('.text-caption'));
      expect(descriptions.length).toBe(3);
      expect(descriptions[0].nativeElement.textContent.trim()).toBe('Red is primary');
      expect(descriptions[1].nativeElement.textContent.trim()).toBe('Green is secondary');
    });

    it('should show success summary when all correct answers are chosen', () => {
      const userQuestion: IQuestion = JSON.parse(JSON.stringify(mockQuestion));
      userQuestion.answers[0].isCorrect = true;
      userQuestion.answers[1].isCorrect = false;
      userQuestion.answers[2].isCorrect = true;

      fixture.componentRef.setInput('question', userQuestion);
      fixture.componentRef.setInput('questionResult', userQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const successElement = fixture.debugElement.query(By.css('ox-question-summary-success'));
      expect(successElement).toBeTruthy();
    });

    it('should show error summary when wrong answers are chosen', () => {
      const resultQuestion: IQuestion = JSON.parse(JSON.stringify(mockQuestion));
      resultQuestion.answers[0].isCorrect = true;
      resultQuestion.answers[1].isCorrect = true;
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

      const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(false);
      expect(checkboxes[2].checked).toBe(true);
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

  describe('Correct Answers Detection', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();
    });

    it('should identify all correct answers from question', () => {
      const correctAnswers = component.correctAnswers();
      expect(correctAnswers.length).toBe(2);
      expect(correctAnswers.map(a => a.id)).toContain(101);
      expect(correctAnswers.map(a => a.id)).toContain(103);
    });

    it('should set isAnswerCorrectChosen to true when all correct answers are selected', () => {
      component.onToggleSelection(101);
      component.onToggleSelection(103);
      expect(component.isAnswerCorrectChosen()).toBe(true);
    });

    it('should set isAnswerCorrectChosen to false when partially correct', () => {
      component.onToggleSelection(101);
      expect(component.isAnswerCorrectChosen()).toBe(false);
    });

    it('should set isAnswerCorrectChosen to false when wrong answer is included', () => {
      component.onToggleSelection(101);
      component.onToggleSelection(102);
      component.onToggleSelection(103);
      expect(component.isAnswerCorrectChosen()).toBe(false);
    });
  });

  describe('Answer Text Methods', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();
    });

    it('should return correct answer text', () => {
      const correctText = component.getCorrectAnswerText();
      expect(correctText).toContain('Red');
      expect(correctText).toContain('Blue');
    });

    it('should return selected answer text', () => {
      component.onToggleSelection(101);
      component.onToggleSelection(102);
      const selectedText = component.getSelectedAnswerText();
      expect(selectedText).toContain('Red');
      expect(selectedText).toContain('Green');
    });
  });

  describe('isAnswerSelected Method', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();
    });

    it('should return true for selected answers', () => {
      component.onToggleSelection(101);
      expect(component['isAnswerSelected'](101)).toBe(true);
    });

    it('should return false for unselected answers', () => {
      expect(component['isAnswerSelected'](101)).toBe(false);
    });
  });

  describe('Show Correct/Wrong Color Methods', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();
    });

    it('showCorrectColor should return true for correct answers', () => {
      expect(component.showCorrectColor(101)).toBe(true);
      expect(component.showCorrectColor(103)).toBe(true);
    });

    it('showCorrectColor should return false for wrong answers', () => {
      expect(component.showCorrectColor(102)).toBe(false);
    });

    it('showWrongColor should return true for wrong answers', () => {
      expect(component.showWrongColor(102)).toBe(true);
    });

    it('showWrongColor should return false for correct answers', () => {
      expect(component.showWrongColor(101)).toBe(false);
      expect(component.showWrongColor(103)).toBe(false);
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

  describe('Question Result Handling', () => {
    it('should set selectedAnswers from questionResult', () => {
      const resultQuestion: IQuestion = JSON.parse(JSON.stringify(mockQuestion));
      resultQuestion.answers[0].isCorrect = true;
      resultQuestion.answers[1].isCorrect = true;
      resultQuestion.answers[2].isCorrect = false;

      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionResult', resultQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      expect(component.selectedAnswers().has(101)).toBe(true);
      expect(component.selectedAnswers().has(102)).toBe(true);
      expect(component.selectedAnswers().has(103)).toBe(false);
    });
  });
});
