import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {QuestionView} from './question-view';
import {QuestionType} from '../../model/question-type.enum';
import {IQuestion} from '../../model/interfaces/question.interface';

describe('QuestionView', () => {
  let component: QuestionView;
  let fixture: ComponentFixture<QuestionView>;

  const mockSingleChoiceQuestion: IQuestion = {
    id: 1,
    questionText: 'Test Question',
    pointsTotal: 5,
    type: QuestionType.SINGLE_CHOICE,
    answers: [
      { id: 1, answerText: 'Answer 1', isCorrect: true },
      { id: 2, answerText: 'Answer 2', isCorrect: false }
    ]
  };

  const mockMultipleChoiceQuestion: IQuestion = {
    id: 2,
    questionText: 'Multiple Choice Question',
    pointsTotal: 10,
    type: QuestionType.MULTIPLE_CHOICE,
    answers: [
      { id: 3, answerText: 'Option A', isCorrect: true },
      { id: 4, answerText: 'Option B', isCorrect: true },
      { id: 5, answerText: 'Option C', isCorrect: false }
    ]
  };

  const mockAssignmentQuestion: IQuestion = {
    id: 3,
    questionText: 'Assignment Question',
    pointsTotal: 8,
    type: QuestionType.ASSIGNMENT,
    answers: [
      { id: 6, answerText: 'Item 1', isCorrect: false, assignedOptionId: null },
      { id: 7, answerText: 'Item 2', isCorrect: false, assignedOptionId: null }
    ],
    options: [
      { id: 1, text: 'Category A' },
      { id: 2, text: 'Category B' }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionView]
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionView);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('question', mockSingleChoiceQuestion);
    fixture.componentRef.setInput('viewMode', 'simulation');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Question Display', () => {
    it('should display question text', () => {
      fixture.componentRef.setInput('question', mockSingleChoiceQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const questionText = fixture.debugElement.query(By.css('h3'));
      expect(questionText.nativeElement.textContent.trim()).toContain('Test Question');
    });

    it('should display points badge', () => {
      fixture.componentRef.setInput('question', mockSingleChoiceQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const badge = fixture.debugElement.query(By.css('ox-badge'));
      expect(badge.nativeElement.textContent).toContain('5 Points');
    });

    it('should display category badge when category is present', () => {
      const questionWithCategory = {
        ...mockSingleChoiceQuestion,
        category: { id: 1, name: 'Math', examId: 1 }
      };
      fixture.componentRef.setInput('question', questionWithCategory);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const badges = fixture.debugElement.queryAll(By.css('ox-badge'));
      expect(badges.length).toBe(2);
      expect(badges[1].nativeElement.textContent).toContain('Math');
    });

    it('should not display category badge when category is not present', () => {
      fixture.componentRef.setInput('question', mockSingleChoiceQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const badges = fixture.debugElement.queryAll(By.css('ox-badge'));
      expect(badges.length).toBe(1);
    });
  });

  describe('Question Type Rendering', () => {
    it('should render SingleChoiceView for SINGLE_CHOICE type', () => {
      fixture.componentRef.setInput('question', mockSingleChoiceQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const singleChoiceView = fixture.debugElement.query(By.css('ox-single-choice-view'));
      expect(singleChoiceView).toBeTruthy();
    });

    it('should render MultipleChoiceView for MULTIPLE_CHOICE type', () => {
      fixture.componentRef.setInput('question', mockMultipleChoiceQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const multipleChoiceView = fixture.debugElement.query(By.css('ox-multiple-choice-view'));
      expect(multipleChoiceView).toBeTruthy();
    });

    it('should render AssignmentView for ASSIGNMENT type', () => {
      fixture.componentRef.setInput('question', mockAssignmentQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const assignmentView = fixture.debugElement.query(By.css('ox-assignment-view'));
      expect(assignmentView).toBeTruthy();
    });

    it('should show alert for unsupported question type', () => {
      const unsupportedQuestion = {
        ...mockSingleChoiceQuestion,
        // @ts-ignore
        type: 999 as QuestionType // Invalid type
      };
      fixture.componentRef.setInput('question', unsupportedQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const alert = fixture.debugElement.query(By.css('ox-alert'));
      expect(alert).toBeTruthy();
    });
  });

  describe('Answer Change Handling', () => {
    it('should emit answerChanged when handleAnswerChange is called', () => {
      fixture.componentRef.setInput('question', mockSingleChoiceQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      jest.spyOn(component.answerChanged, 'emit');

      const updatedQuestion = { ...mockSingleChoiceQuestion };
      component.handleAnswerChange(updatedQuestion);

      expect(component.answerChanged.emit).toHaveBeenCalledWith(updatedQuestion);
    });
  });

  describe('View Modes', () => {
    it('should pass simulation viewMode to child component', () => {
      fixture.componentRef.setInput('question', mockSingleChoiceQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const singleChoiceView = fixture.debugElement.query(By.css('ox-single-choice-view'));
      expect(singleChoiceView.componentInstance.viewMode()).toBe('simulation');
    });

    it('should pass preview viewMode to child component', () => {
      fixture.componentRef.setInput('question', mockSingleChoiceQuestion);
      fixture.componentRef.setInput('viewMode', 'preview');
      fixture.detectChanges();

      const singleChoiceView = fixture.debugElement.query(By.css('ox-single-choice-view'));
      expect(singleChoiceView.componentInstance.viewMode()).toBe('preview');
    });

    it('should pass realistic viewMode to child component', () => {
      fixture.componentRef.setInput('question', mockSingleChoiceQuestion);
      fixture.componentRef.setInput('viewMode', 'realistic');
      fixture.detectChanges();

      const singleChoiceView = fixture.debugElement.query(By.css('ox-single-choice-view'));
      expect(singleChoiceView.componentInstance.viewMode()).toBe('realistic');
    });
  });

  describe('Confirmed State', () => {
    it('should pass confirmed state to child component', () => {
      fixture.componentRef.setInput('question', mockSingleChoiceQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const singleChoiceView = fixture.debugElement.query(By.css('ox-single-choice-view'));
      expect(singleChoiceView.componentInstance.confirmed()).toBe(true);
    });

    it('should default confirmed to false', () => {
      fixture.componentRef.setInput('question', mockSingleChoiceQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const singleChoiceView = fixture.debugElement.query(By.css('ox-single-choice-view'));
      expect(singleChoiceView.componentInstance.confirmed()).toBe(false);
    });
  });

  describe('Question Result Handling', () => {
    it('should pass questionResult to child component', () => {
      const resultQuestion = { ...mockSingleChoiceQuestion };
      fixture.componentRef.setInput('question', mockSingleChoiceQuestion);
      fixture.componentRef.setInput('questionResult', resultQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const singleChoiceView = fixture.debugElement.query(By.css('ox-single-choice-view'));
      expect(singleChoiceView.componentInstance.questionResult()).toEqual(resultQuestion);
    });

    it('should default questionResult to null', () => {
      fixture.componentRef.setInput('question', mockSingleChoiceQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const singleChoiceView = fixture.debugElement.query(By.css('ox-single-choice-view'));
      expect(singleChoiceView.componentInstance.questionResult()).toBeNull();
    });
  });

  describe('Card Wrapper', () => {
    it('should wrap content in ox-card', () => {
      fixture.componentRef.setInput('question', mockSingleChoiceQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const card = fixture.debugElement.query(By.css('ox-card'));
      expect(card).toBeTruthy();
    });
  });
});
