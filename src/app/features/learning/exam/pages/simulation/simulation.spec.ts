import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import {async, of} from 'rxjs';
import { Simulation } from './simulation';
import { ExamService } from '../../../../../shared/service/exam.service';
import { IExam } from '../../../../../shared/model/interfaces/exam.interface';
import { IQuestion } from '../../../../../shared/model/interfaces/question.interface';
import { QuestionType } from '../../../../../shared/model/question-type.enum';
import { StatusType } from '../../../../../shared/model/status-typ.enum';

describe('Simulation', () => {
  let component: Simulation;
  let fixture: ComponentFixture<Simulation>;
  let mockExamService: jest.Mocked<ExamService>;
  let mockRouter: jest.Mocked<Router>;
  let mockActivatedRoute: any;

  const mockQuestion1: IQuestion = {
    id: 1,
    questionText: 'What is 2+2?',
    pointsTotal: 10,
    type: QuestionType.MULTIPLE_CHOICE,
    answers: [
      { id: 1, answerText: '3', isCorrect: false, assignedOptionId: null },
      { id: 2, answerText: '4', isCorrect: true, assignedOptionId: null },
      { id: 3, answerText: '5', isCorrect: false, assignedOptionId: null }
    ]
  };

  const mockQuestion2: IQuestion = {
    id: 2,
    questionText: 'What is 3+3?',
    pointsTotal: 10,
    type: QuestionType.MULTIPLE_CHOICE,
    answers: [
      { id: 4, answerText: '5', isCorrect: false, assignedOptionId: null },
      { id: 5, answerText: '6', isCorrect: true, assignedOptionId: null },
      { id: 6, answerText: '7', isCorrect: false, assignedOptionId: null }
    ]
  };

  const mockExam: IExam = {
    id: 1,
    name: 'Test Exam',
    description: 'Test Description',
    duration: 60,
    pointsToSucceeded: 70,
    maxQuestionsRealExam: 10,
    questions: [mockQuestion1, mockQuestion2],
    statusType: StatusType.ACTIVE
  };

  beforeEach(async () => {
    mockExamService = {
      getExamById: jest.fn()
    } as any;

    mockRouter = {
      navigate:  jest.fn().mockImplementation(() => Promise.resolve(true))
    } as any;

    mockActivatedRoute = {
      snapshot: {
        params: { id: '1' }
      },
      queryParams: of({ mode: 'simulation' })
    };

    await TestBed.configureTestingModule({
      imports: [Simulation],
      providers: [
        { provide: ExamService, useValue: mockExamService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
    .compileComponents();

    mockExamService.getExamById.mockReturnValue(of(mockExam));

    fixture = TestBed.createComponent(Simulation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load exam by id from route params', () => {
      expect(mockExamService.getExamById).toHaveBeenCalledWith(1);
      expect(component.exam()).toEqual(mockExam);
    });

    it('should initialize question answers with cloned questions', () => {
      const answers = component.questionAnswers();
      expect(Object.keys(answers).length).toBe(2);
      expect(answers[1]).toBeDefined();
      expect(answers[2]).toBeDefined();

      // Check that answers are marked as incorrect initially
      expect(answers[1].answers.every((a: any) => a.isCorrect === false)).toBe(true);
      expect(answers[2].answers.every((a: any) => a.isCorrect === false)).toBe(true);
    });

    it('should set view mode from query params', () => {
      expect(component.viewMode()).toBe('simulation');
    });

    it('should update view mode when query params change', () => {
      mockActivatedRoute.queryParams = of({ mode: 'realistic' });
      component.ngOnInit();

      // Wait for query params subscription
      expect(component.viewMode()).toBe('realistic');
    });
  });

  describe('currentQuestion computed', () => {
    it('should return the current question based on index', () => {
      expect(component.currentQuestion()).toEqual(mockQuestion1);

      component.currentQuestionIndex.set(1);
      expect(component.currentQuestion()).toEqual(mockQuestion2);
    });

    it('should return null if exam is not loaded', () => {
      component.exam.set(null);
      expect(component.currentQuestion()).toBeNull();
    });

    it('should return null if index is out of bounds', () => {
      component.currentQuestionIndex.set(10);
      expect(component.currentQuestion()).toBeUndefined();
    });
  });

  describe('isConfirmed computed', () => {
    it('should return true if current question is confirmed', () => {
      component.confirmedQuestions.set(new Set([1]));
      expect(component.isConfirmed()).toBe(true);
    });

    it('should return false if current question is not confirmed', () => {
      component.confirmedQuestions.set(new Set([2]));
      expect(component.isConfirmed()).toBe(false);
    });

    it('should return false if no current question', () => {
      component.exam.set(null);
      expect(component.isConfirmed()).toBe(false);
    });
  });

  describe('progress computed', () => {
    it('should calculate progress percentage correctly', () => {
      expect(component.progress()).toBe(50); // 1 out of 2 questions = 50%

      component.currentQuestionIndex.set(1);
      expect(component.progress()).toBe(100); // 2 out of 2 questions = 100%
    });

    it('should return 0 if no exam is loaded', () => {
      component.exam.set(null);
      expect(component.progress()).toBe(0);
    });

    it('should return 0 if exam has no questions', () => {
      component.exam.set({ ...mockExam, questions: [] });
      expect(component.progress()).toBe(0);
    });
  });

  describe('handleAnswerChange', () => {
    it('should update question answers when answer changes', () => {
      const updatedQuestion: IQuestion = {
        ...mockQuestion1,
        answers: [
          { id: 1, answerText: '3', isCorrect: false, assignedOptionId: null },
          { id: 2, answerText: '4', isCorrect: true, assignedOptionId: null },
          { id: 3, answerText: '5', isCorrect: false, assignedOptionId: null }
        ]
      };

      component.handleAnswerChange(updatedQuestion);

      const answers = component.questionAnswers();
      expect(answers[1]).toEqual(updatedQuestion);
    });
  });

  describe('confirmAnswer', () => {
    it('should mark current question as confirmed', () => {
      component.confirmAnswer();

      expect(component.confirmedQuestions().has(1)).toBe(true);
    });

    it('should automatically go to next question in realistic mode', () => {
      component.viewMode.set('realistic');
      component.currentQuestionIndex.set(0);

      component.confirmAnswer();

      expect(component.currentQuestionIndex()).toBe(1);
    });

    it('should not go to next question in simulation mode', () => {
      component.viewMode.set('simulation');
      component.currentQuestionIndex.set(0);

      component.confirmAnswer();

      expect(component.currentQuestionIndex()).toBe(0);
    });

    it('should handle confirm when no current question', () => {
      component.exam.set(null);

      expect(() => component.confirmAnswer()).not.toThrow();
    });
  });

  describe('nextQuestion', () => {
    it('should increment current question index', () => {
      component.currentQuestionIndex.set(0);
      component.nextQuestion();

      expect(component.currentQuestionIndex()).toBe(1);
    });

    it('should not increment beyond last question', () => {
      component.currentQuestionIndex.set(1);
      component.nextQuestion();

      expect(component.currentQuestionIndex()).toBe(1);
    });

    it('should not increment if no exam is loaded', () => {
      component.exam.set(null);
      component.currentQuestionIndex.set(0);
      component.nextQuestion();

      expect(component.currentQuestionIndex()).toBe(0);
    });
  });

  describe('previousQuestion', () => {
    it('should decrement current question index', () => {
      component.currentQuestionIndex.set(1);
      component.previousQuestion();

      expect(component.currentQuestionIndex()).toBe(0);
    });

    it('should not decrement below 0', () => {
      component.currentQuestionIndex.set(0);
      component.previousQuestion();

      expect(component.currentQuestionIndex()).toBe(0);
    });
  });

  describe('finishSimulation', () => {
    it('should emit finished event with all question answers', () => {
      const emitSpy = jest.fn();
      component.finished.subscribe(emitSpy);

      component.finishSimulation();

      expect(emitSpy).toHaveBeenCalledWith(Object.values(component.questionAnswers()));
    });

    it('should navigate to learning overview', () => {
      component.finishSimulation();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/learning/overview']);
    });
  });
});
