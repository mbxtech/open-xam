import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { AssignmentViewComponent } from './assignment-view';
import { QuestionType } from '../../../../model/question-type.enum';
import { IQuestion } from '../../../../model/interfaces/question.interface';
import { IAnswer } from '../../../../model/interfaces/answer.interface';

describe('AssignmentViewComponent', () => {
  let component: AssignmentViewComponent;
  let fixture: ComponentFixture<AssignmentViewComponent>;

  const mockQuestion: IQuestion = {
    id: 1,
    questionText: 'Assign items to their categories',
    type: QuestionType.ASSIGNMENT,
    pointsTotal: 4,
    answers: [
      { id: 101, answerText: 'Apple', assignedOptionId: 1 },
      { id: 102, answerText: 'Carrot', assignedOptionId: 2 },
      { id: 103, answerText: 'Banana', assignedOptionId: 1 },
      { id: 104, answerText: 'Broccoli', assignedOptionId: 2 }
    ],
    options: [
      { id: 1, text: 'Fruits' },
      { id: 2, text: 'Vegetables' }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignmentViewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AssignmentViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('question', mockQuestion);
    fixture.componentRef.setInput('viewMode', 'simulation');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should initialize categories from question options', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      expect(component.categories.length).toBe(2);
      expect(component.categories[0].name).toBe('Fruits');
      expect(component.categories[1].name).toBe('Vegetables');
    });

    it('should initialize with answers already assigned to categories', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      expect(component.categories[0].assignedAnswers.length).toBe(2);
      expect(component.categories[1].assignedAnswers.length).toBe(2);
      expect(component.availableAnswers.length).toBe(0);
    });

    it('should have unassigned answers in availableAnswers', () => {
      const questionWithUnassigned: IQuestion = {
        ...mockQuestion,
        answers: [
          { id: 101, answerText: 'Apple', assignedOptionId: null },
          { id: 102, answerText: 'Carrot', assignedOptionId: 2 }
        ]
      };

      fixture.componentRef.setInput('question', questionWithUnassigned);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      expect(component.availableAnswers.length).toBe(1);
      expect(component.availableAnswers[0].answerText).toBe('Apple');
    });
  });

  describe('Category Display', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();
    });

    it('should display all categories in the table', () => {
      const categoryRows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(categoryRows.length).toBe(2);
    });

    it('should display category names', () => {
      const categoryNames = fixture.nativeElement.querySelectorAll('td:first-child .font-medium');
      expect(categoryNames[0].textContent.trim()).toBe('Fruits');
      expect(categoryNames[1].textContent.trim()).toBe('Vegetables');
    });

    it('should show placeholder when category has no assigned answers', () => {
      const emptyQuestion: IQuestion = {
        ...mockQuestion,
        answers: []
      };

      fixture.componentRef.setInput('question', emptyQuestion);
      fixture.detectChanges();

      const placeholders = fixture.nativeElement.querySelectorAll('.text-gray-400');
      expect(placeholders.length).toBeGreaterThan(0);
    });
  });

  describe('Available Answers Display', () => {
    it('should show available answers section', () => {
      const questionWithUnassigned: IQuestion = {
        ...mockQuestion,
        answers: [
          { id: 101, answerText: 'Apple', assignedOptionId: null }
        ]
      };

      fixture.componentRef.setInput('question', questionWithUnassigned);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const availableSection = fixture.nativeElement.querySelector('[id="available"]');
      expect(availableSection).toBeTruthy();
    });

    it('should show "All answers are assigned" when no available answers', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const allAssignedText = fixture.nativeElement.querySelector('[id="available"] .text-gray-400');
      expect(allAssignedText?.textContent).toContain('All answers are assigned');
    });

    it('should display unassigned answers', () => {
      const questionWithUnassigned: IQuestion = {
        ...mockQuestion,
        answers: [
          { id: 101, answerText: 'Apple', assignedOptionId: null },
          { id: 102, answerText: 'Banana', assignedOptionId: null }
        ]
      };

      fixture.componentRef.setInput('question', questionWithUnassigned);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const answerElements = fixture.nativeElement.querySelectorAll('[id="available"] [cdkDrag]');
      expect(answerElements.length).toBe(2);
    });
  });

  describe('Drag and Drop Functionality', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();
    });

    it('should handle drop within same container (reordering)', () => {
      jest.spyOn(component.answerChange, 'emit');

      const event = {
        previousContainer: { data: component.categories[0].assignedAnswers },
        container: { data: component.categories[0].assignedAnswers },
        previousIndex: 0,
        currentIndex: 1
      } as CdkDragDrop<IAnswer[]>;

      const initialOrder = [...component.categories[0].assignedAnswers];
      component.onDrop(event);

      expect(component.categories[0].assignedAnswers[0].id).toBe(initialOrder[1].id);
      expect(component.categories[0].assignedAnswers[1].id).toBe(initialOrder[0].id);
      expect(component.answerChange.emit).toHaveBeenCalled();
    });

    it('should handle drop to different container', () => {
      jest.spyOn(component.answerChange, 'emit');

      const event = {
        previousContainer: { data: component.categories[0].assignedAnswers },
        container: { data: component.categories[1].assignedAnswers },
        previousIndex: 0,
        currentIndex: 0
      } as CdkDragDrop<IAnswer[]>;

      const movedAnswer = component.categories[0].assignedAnswers[0];
      component.onDrop(event);

      expect(component.categories[1].assignedAnswers).toContain(movedAnswer);
      expect(component.answerChange.emit).toHaveBeenCalled();
    });

    it('should emit updated question after drop', () => {
      jest.spyOn(component.answerChange, 'emit');

      const event = {
        previousContainer: { data: component.availableAnswers },
        container: { data: component.categories[0].assignedAnswers },
        previousIndex: 0,
        currentIndex: 0
      } as CdkDragDrop<IAnswer[]>;

      component.onDrop(event);

      expect(component.answerChange.emit).toHaveBeenCalled();
      const emittedQuestion = (component.answerChange.emit as jest.Mock).mock.calls[0][0];
      expect(emittedQuestion.answers).toBeDefined();
    });
  });

  describe('Answer Correctness', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('originalQuestion', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();
    });

    it('should identify correct answer placement', () => {
      const apple = component.categories[0].assignedAnswers.find(a => a.answerText === 'Apple');
      expect(component.isAnswerCorrect(apple!, 1)).toBe(true);
    });

    it('should identify incorrect answer placement', () => {
      const apple = component.categories[0].assignedAnswers.find(a => a.answerText === 'Apple');
      expect(component.isAnswerCorrect(apple!, 2)).toBe(false);
    });

    it('should use original question for correctness when provided', () => {
      const userQuestion: IQuestion = {
        ...mockQuestion,
        answers: [
          { id: 101, answerText: 'Apple', assignedOptionId: 2 } // User assigned to wrong category
        ]
      };

      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('originalQuestion', mockQuestion);
      fixture.componentRef.setInput('questionResult', userQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const apple = component.categories[1].assignedAnswers.find(a => a.answerText === 'Apple');
      // Apple should be in category 2 (index 1) but correct category is 1
      expect(component.isAnswerCorrect(apple!, 2)).toBe(false);
      expect(component.isAnswerCorrect(apple!, 1)).toBe(true); // Correct according to original
    });
  });

  describe('Answer Styling', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();
    });

    it('should return neutral styling when not confirmed', () => {
      fixture.componentRef.setInput('confirmed', false);
      fixture.detectChanges();

      const apple = component.categories[0].assignedAnswers[0];
      const cssClass = component.getAnswerClass(apple, 1);

      expect(cssClass).toContain('bg-neutral-50');
      expect(cssClass).toContain('border-blue-200');
    });

    it('should return success styling for correct answer when confirmed', () => {
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const apple = component.categories[0].assignedAnswers.find(a => a.answerText === 'Apple');
      const cssClass = component.getAnswerClass(apple!, 1);

      expect(cssClass).toContain('bg-green-50');
      expect(cssClass).toContain('border-green-500');
    });

    it('should return error styling for incorrect answer when confirmed', () => {
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const apple = component.categories[0].assignedAnswers.find(a => a.answerText === 'Apple');
      const cssClass = component.getAnswerClass(apple!, 2); // Wrong category

      expect(cssClass).toContain('bg-red-50');
      expect(cssClass).toContain('border-red-500');
    });
  });

  describe('Correct Count', () => {
    it('should count correctly assigned answers', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const correctCount = component.getCorrectCount();
      expect(correctCount).toBe(4); // All 4 answers are correctly assigned
    });

    it('should count zero when all answers are wrong', () => {
      const wrongQuestion: IQuestion = {
        ...mockQuestion,
        answers: [
          { id: 101, answerText: 'Apple', assignedOptionId: 2 }, // Wrong category
          { id: 102, answerText: 'Carrot', assignedOptionId: 1 }  // Wrong category
        ]
      };

      fixture.componentRef.setInput('question', wrongQuestion);
      fixture.componentRef.setInput('originalQuestion', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const correctCount = component.getCorrectCount();
      expect(correctCount).toBe(0);
    });

    it('should count partial correct answers', () => {
      const partialQuestion: IQuestion = {
        ...mockQuestion,
        answers: [
          { id: 101, answerText: 'Apple', assignedOptionId: 1 },    // Correct
          { id: 102, answerText: 'Carrot', assignedOptionId: 1 }     // Wrong
        ]
      };

      fixture.componentRef.setInput('question', partialQuestion);
      fixture.componentRef.setInput('originalQuestion', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const correctCount = component.getCorrectCount();
      expect(correctCount).toBe(1);
    });
  });

  describe('Total Count', () => {
    it('should return total number of answers', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      expect(component.getTotalCount()).toBe(4);
    });

    it('should return zero when no answers', () => {
      const emptyQuestion: IQuestion = {
        ...mockQuestion,
        answers: []
      };

      fixture.componentRef.setInput('question', emptyQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      expect(component.getTotalCount()).toBe(0);
    });
  });

  describe('All Correct Check', () => {
    it('should return true when all answers are correctly assigned', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      expect(component.isAllCorrect()).toBe(true);
    });

    it('should return false when there are unassigned answers', () => {
      const questionWithUnassigned: IQuestion = {
        ...mockQuestion,
        answers: [
          { id: 101, answerText: 'Apple', assignedOptionId: null },
          { id: 102, answerText: 'Carrot', assignedOptionId: 2 }
        ]
      };

      fixture.componentRef.setInput('question', questionWithUnassigned);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      expect(component.isAllCorrect()).toBe(false);
    });

    it('should return false when any answer is incorrectly assigned', () => {
      const wrongQuestion: IQuestion = {
        ...mockQuestion,
        answers: [
          { id: 101, answerText: 'Apple', assignedOptionId: 2 }, // Wrong
          { id: 102, answerText: 'Carrot', assignedOptionId: 2 }
        ]
      };

      fixture.componentRef.setInput('question', wrongQuestion);
      fixture.componentRef.setInput('originalQuestion', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      expect(component.isAllCorrect()).toBe(false);
    });
  });

  describe('Connected Lists', () => {
    it('should return all list IDs including available', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const listIds = component.getAllListIds();
      expect(listIds).toContain('available');
      expect(listIds).toContain('1');
      expect(listIds).toContain('2');
    });

    it('should return correct number of list IDs', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const listIds = component.getAllListIds();
      expect(listIds.length).toBe(3); // available + 2 categories
    });
  });

  describe('Confirmation State', () => {
    it('should show checkmarks for correct answers when confirmed', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const checkmarks = fixture.nativeElement.querySelectorAll('svg.text-green-600');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    it('should show X marks for incorrect answers when confirmed', () => {
      const wrongQuestion: IQuestion = {
        ...mockQuestion,
        answers: [
          { id: 101, answerText: 'Apple', assignedOptionId: 2 } // Wrong category
        ]
      };

      fixture.componentRef.setInput('question', wrongQuestion);
      fixture.componentRef.setInput('originalQuestion', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const xMarks = fixture.nativeElement.querySelectorAll('svg.text-red-600');
      expect(xMarks.length).toBeGreaterThan(0);
    });

    it('should not show indicators when not confirmed', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', false);
      fixture.detectChanges();

      const indicators = fixture.nativeElement.querySelectorAll('svg.text-green-600, svg.text-red-600');
      expect(indicators.length).toBe(0);
    });
  });

  describe('Summary Display', () => {
    it('should show success summary when all correct', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const successSummary = fixture.nativeElement.querySelector('.bg-green-50');
      expect(successSummary).toBeTruthy();
    });

    it('should show error summary when not all correct', () => {
      const wrongQuestion: IQuestion = {
        ...mockQuestion,
        answers: [
          { id: 101, answerText: 'Apple', assignedOptionId: 2 }
        ]
      };

      fixture.componentRef.setInput('question', wrongQuestion);
      fixture.componentRef.setInput('originalQuestion', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const errorSummary = fixture.nativeElement.querySelector('.bg-red-50');
      expect(errorSummary).toBeTruthy();
    });

    it('should not show summary when not confirmed', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', false);
      fixture.detectChanges();

      const summaries = fixture.nativeElement.querySelectorAll('.bg-green-50, .bg-red-50');
      expect(summaries.length).toBe(0);
    });

    it('should display correct count in error summary', () => {
      const partialQuestion: IQuestion = {
        ...mockQuestion,
        answers: [
          { id: 101, answerText: 'Apple', assignedOptionId: 1 },    // Correct
          { id: 102, answerText: 'Carrot', assignedOptionId: 1 },   // Wrong
          { id: 103, answerText: 'Banana', assignedOptionId: 1 }    // Correct
        ]
      };

      fixture.componentRef.setInput('question', partialQuestion);
      fixture.componentRef.setInput('originalQuestion', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.componentRef.setInput('confirmed', true);
      fixture.detectChanges();

      const errorSummary = fixture.nativeElement.querySelector('.text-red-800');
      expect(errorSummary?.textContent).toContain('2');
      expect(errorSummary?.textContent).toContain('3');
    });
  });

  describe('Question Result Handling', () => {
    it('should initialize from questionResult when provided', () => {
      const resultQuestion: IQuestion = {
        ...mockQuestion,
        answers: [
          { id: 101, answerText: 'Apple', assignedOptionId: 2 },  // Different assignment
          { id: 102, answerText: 'Carrot', assignedOptionId: 1 }
        ]
      };

      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionResult', resultQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      // Should use result's assignments
      const appleInCategory2 = component.categories[1].assignedAnswers.find(a => a.answerText === 'Apple');
      expect(appleInCategory2).toBeTruthy();
    });

    it('should update when questionResult changes', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      const newResult: IQuestion = {
        ...mockQuestion,
        answers: [
          { id: 101, answerText: 'Apple', assignedOptionId: null }
        ]
      };

      fixture.componentRef.setInput('questionResult', newResult);
      fixture.detectChanges();

      expect(component.availableAnswers.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should handle question with no options', () => {
      const noOptionsQuestion: IQuestion = {
        ...mockQuestion,
        options: []
      };

      fixture.componentRef.setInput('question', noOptionsQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      expect(component.categories.length).toBe(0);
    });

    it('should handle question with no answers', () => {
      const noAnswersQuestion: IQuestion = {
        ...mockQuestion,
        answers: []
      };

      fixture.componentRef.setInput('question', noAnswersQuestion);
      fixture.componentRef.setInput('viewMode', 'simulation');
      fixture.detectChanges();

      expect(component.availableAnswers.length).toBe(0);
      expect(component.getTotalCount()).toBe(0);
    });
  });
});
