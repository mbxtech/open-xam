import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { CertificationMode } from './certification-mode';
import { ExamService } from '../../../../../shared/service/exam.service';
import { IExam } from '../../../../../shared/model/interfaces/exam.interface';
import { IQuestion } from '../../../../../shared/model/interfaces/question.interface';
import { QuestionType } from '../../../../../shared/model/question-type.enum';
import { StatusType } from '../../../../../shared/model/status-typ.enum';

describe('CertificationMode', () => {
  let component: CertificationMode;
  let fixture: ComponentFixture<CertificationMode>;
  let mockExamService: jest.Mocked<ExamService>;
  let mockRouter: jest.Mocked<Router>;
  let mockActivatedRoute: any;

  const createMockQuestion = (id: number, correctAnswerId: number): IQuestion => ({
    id,
    questionText: `Question ${id}?`,
    pointsTotal: 10,
    type: QuestionType.MULTIPLE_CHOICE,
    answers: [
      { id: id * 10 + 1, answerText: 'Answer 1', isCorrect: correctAnswerId === 1, assignedOptionId: null },
      { id: id * 10 + 2, answerText: 'Answer 2', isCorrect: correctAnswerId === 2, assignedOptionId: null },
      { id: id * 10 + 3, answerText: 'Answer 3', isCorrect: correctAnswerId === 3, assignedOptionId: null }
    ]
  });

  const mockQuestions: IQuestion[] = [
    createMockQuestion(1, 2),
    createMockQuestion(2, 1),
    createMockQuestion(3, 3),
    createMockQuestion(4, 2),
    createMockQuestion(5, 1)
  ];

  const mockExam: IExam = {
    id: 1,
    name: 'Certification Exam',
    description: 'Test Certification',
    duration: 2, // 2 minutes
    pointsToSucceeded: 30,
    maxQuestionsRealExam: 30,
    questions: mockQuestions,
    statusType: StatusType.ACTIVE
  };

  beforeEach(async () => {
    mockExamService = {
      getExamById: jest.fn()
    } as any;

    mockRouter = {
      navigate: jest.fn()
    } as any;

    mockActivatedRoute = {
      snapshot: {
        params: { id: '1' }
      },
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [CertificationMode],
      providers: [
        { provide: ExamService, useValue: mockExamService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
    .compileComponents();

    mockExamService.getExamById.mockReturnValue(of(mockExam));

    fixture = TestBed.createComponent(CertificationMode);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load exam by id from route params', () => {
      expect(mockExamService.getExamById).toHaveBeenCalledWith(1);
      expect(component.exam()).toEqual(mockExam);
    });

    it('should initialize in INTRODUCTION state', () => {
      expect(component.state()).toBe('INTRODUCTION');
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop timer on destroy', fakeAsync(() => {
      component.startCertification();
      tick(1000);

      const initialTime = component.timeRemaining();
      component.ngOnDestroy();
      tick(2000);

      expect(component.timeRemaining()).toBe(initialTime);
    }));
  });

  describe('startCertification', () => {
    it('should change state to EXAM', () => {
      component.startCertification();
      expect(component.state()).toBe('EXAM');
    });

    it('should limit questions to 30', () => {
      const manyQuestions = Array.from({ length: 50 }, (_, i) => createMockQuestion(i + 1, 1));
      component.exam.set({ ...mockExam, questions: manyQuestions });

      component.startCertification();

      expect(component.exam()!.questions.length).toBe(30);
    });

    it('should not limit if less than 30 questions', () => {
      component.startCertification();
      expect(component.exam()!.questions.length).toBe(5);
    });

    it('should initialize question answers with empty selections', () => {
      component.startCertification();

      const answers = component.questionAnswers();
      Object.values(answers).forEach((q: IQuestion) => {
        expect(q.answers.every((a: any) => a.isCorrect === false)).toBe(true);
      });
    });

    it('should set timer based on exam duration', () => {
      component.startCertification();
      expect(component.timeRemaining()).toBe(120); // 2 minutes * 60 seconds
    });

    it('should use default 30 minutes if duration not set', () => {
      component.exam.set({ ...mockExam, duration: undefined });
      component.startCertification();

      expect(component.timeRemaining()).toBe(1800); // 30 * 60
    });

    it('should start timer countdown', fakeAsync(() => {
      component.startCertification();
      const initialTime = component.timeRemaining();

      tick(3000);

      expect(component.timeRemaining()).toBe(initialTime - 3);
    }));
  });

  describe('timer functionality', () => {
    it('should decrement time remaining every second', fakeAsync(() => {
      component.startCertification();
      const initialTime = component.timeRemaining();

      tick(1000);
      expect(component.timeRemaining()).toBe(initialTime - 1);

      tick(1000);
      expect(component.timeRemaining()).toBe(initialTime - 2);
    }));

    it('should auto finish certification when time runs out', fakeAsync(() => {
      component.exam.set({ ...mockExam, duration: 0.01 }); // Very short duration
      component.startCertification();
      component.timeRemaining.set(1);

      tick(1000);

      expect(component.state()).toBe('RESULT');
      expect(component.timeRemaining()).toBe(0);
    }));
  });

  describe('currentQuestion computed', () => {
    beforeEach(() => {
      component.startCertification();
    });

    it('should return current question from answers', () => {
      const current = component.currentQuestion();
      expect(current).toBeDefined();
      expect(current?.id).toBe(component.exam()!.questions[0].id);
    });

    it('should update when index changes', () => {
      component.currentQuestionIndex.set(1);
      const current = component.currentQuestion();
      expect(current?.id).toBe(component.exam()!.questions[1].id);
    });

    it('should return null if no exam', () => {
      component.exam.set(null);
      expect(component.currentQuestion()).toBeNull();
    });
  });

  describe('progress computed', () => {
    beforeEach(() => {
      component.startCertification();
    });

    it('should calculate progress percentage', () => {
      expect(component.progress()).toBe(20); // 1 out of 5 = 20%

      component.currentQuestionIndex.set(2);
      expect(component.progress()).toBe(60); // 3 out of 5 = 60%
    });

    it('should return 0 if no exam', () => {
      component.exam.set(null);
      expect(component.progress()).toBe(0);
    });

    it('should return 0 if no questions', () => {
      component.exam.set({ ...mockExam, questions: [] });
      expect(component.progress()).toBe(0);
    });
  });

  describe('score computed', () => {
    beforeEach(() => {
      component.startCertification();
    });

    it('should return 0 when no answers are correct', () => {
      expect(component.score()).toBe(0);
    });

    it('should calculate score for correct answers', () => {
      const answers = component.questionAnswers();
      const exam = component.exam()!;

      // Mark first question as correct
      const q1 = exam.questions[0];
      const userAnswer1 = { ...answers[q1.id!] };
      userAnswer1.answers = userAnswer1.answers.map(a => ({
        ...a,
        isCorrect: q1.answers.find(orig => orig.id === a.id)?.isCorrect ?? false
      }));

      component.questionAnswers.update(prev => ({
        ...prev,
        [q1.id!]: userAnswer1
      }));

      expect(component.score()).toBe(10);
    });

    it('should return 0 if no exam', () => {
      component.exam.set(null);
      expect(component.score()).toBe(0);
    });
  });

  describe('isPassed computed', () => {
    beforeEach(() => {
      component.startCertification();
    });

    it('should return true if score meets threshold', () => {
      // Set all answers as correct (5 questions * 10 points = 50 points, threshold is 30)
      const answers = component.questionAnswers();
      const exam = component.exam()!;

      const updatedAnswers: Record<number, IQuestion> = {};
      exam.questions.forEach(q => {
        const userAnswer = { ...answers[q.id!] };
        userAnswer.answers = userAnswer.answers.map(a => ({
          ...a,
          isCorrect: q.answers.find(orig => orig.id === a.id)?.isCorrect ?? false
        }));
        updatedAnswers[q.id!] = userAnswer;
      });

      component.questionAnswers.set(updatedAnswers);

      expect(component.isPassed()).toBe(true);
    });

    it('should return false if score below threshold', () => {
      expect(component.isPassed()).toBe(false);
    });

    it('should return false if no exam', () => {
      component.exam.set(null);
      expect(component.isPassed()).toBe(false);
    });
  });

  describe('handleAnswerChange', () => {
    beforeEach(() => {
      component.startCertification();
    });

    it('should update question answer', () => {
      const updatedQuestion: IQuestion = {
        ...component.exam()!.questions[0],
        answers: [
          { id: 11, answerText: 'Answer 1', isCorrect: true, assignedOptionId: null },
          { id: 12, answerText: 'Answer 2', isCorrect: false, assignedOptionId: null },
          { id: 13, answerText: 'Answer 3', isCorrect: false, assignedOptionId: null }
        ]
      };

      component.handleAnswerChange(updatedQuestion);

      const answers = component.questionAnswers();
      expect(answers[updatedQuestion.id!]).toEqual(updatedQuestion);
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      component.startCertification();
    });

    describe('nextQuestion', () => {
      it('should increment question index', () => {
        component.nextQuestion();
        expect(component.currentQuestionIndex()).toBe(1);
      });

      it('should not go beyond last question', () => {
        component.currentQuestionIndex.set(4);
        component.nextQuestion();
        expect(component.currentQuestionIndex()).toBe(4);
      });

      it('should handle no exam', () => {
        component.exam.set(null);
        component.nextQuestion();
        expect(component.currentQuestionIndex()).toBe(0);
      });
    });

    describe('previousQuestion', () => {
      it('should decrement question index', () => {
        component.currentQuestionIndex.set(2);
        component.previousQuestion();
        expect(component.currentQuestionIndex()).toBe(1);
      });

      it('should not go below 0', () => {
        component.previousQuestion();
        expect(component.currentQuestionIndex()).toBe(0);
      });
    });
  });

  describe('finishCertification', () => {
    it('should change state to RESULT', () => {
      component.startCertification();
      component.finishCertification();

      expect(component.state()).toBe('RESULT');
    });

    it('should stop timer', fakeAsync(() => {
      component.startCertification();
      const timeBeforeFinish = component.timeRemaining();

      component.finishCertification();
      tick(2000);

      expect(component.timeRemaining()).toBe(timeBeforeFinish);
    }));
  });

  describe('anti-cheat detection', () => {
    beforeEach(() => {
      component.startCertification();
    });

    describe('onBlur', () => {
      it('should fail certification when window loses focus during exam', () => {
        component.onBlur();
        expect(component.state()).toBe('FAILED_CHEAT');
      });

      it('should not trigger when not in exam state', () => {
        component.state.set('INTRODUCTION');
        component.onBlur();
        expect(component.state()).toBe('INTRODUCTION');
      });
    });

    describe('onMouseLeave', () => {
      it('should fail certification when mouse leaves document during exam', () => {
        component.onMouseLeave();
        expect(component.state()).toBe('FAILED_CHEAT');
      });

      it('should not trigger when not in exam state', () => {
        component.state.set('RESULT');
        component.onMouseLeave();
        expect(component.state()).toBe('RESULT');
      });
    });

    describe('failCheat', () => {
      it('should change state to FAILED_CHEAT', () => {
        component.failCheat();
        expect(component.state()).toBe('FAILED_CHEAT');
      });

      it('should stop timer', fakeAsync(() => {
        const timeBeforeFail = component.timeRemaining();
        component.failCheat();
        tick(2000);

        expect(component.timeRemaining()).toBe(timeBeforeFail);
      }));
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      expect(component.formatTime(125)).toBe('2:05');
      expect(component.formatTime(60)).toBe('1:00');
      expect(component.formatTime(0)).toBe('0:00');
      expect(component.formatTime(3661)).toBe('61:01');
    });

    it('should pad seconds with leading zero', () => {
      expect(component.formatTime(65)).toBe('1:05');
      expect(component.formatTime(5)).toBe('0:05');
    });
  });

  describe('backToOverview', () => {
    it('should navigate to learning overview', () => {
      component.backToOverview();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/learning/overview']);
    });
  });

  describe('isQuestionCorrect', () => {
    const originalQuestion: IQuestion = {
      id: 1,
      questionText: 'Test?',
      pointsTotal: 10,
      type: QuestionType.MULTIPLE_CHOICE,
      answers: [
        { id: 1, answerText: 'A', isCorrect: false, assignedOptionId: null },
        { id: 2, answerText: 'B', isCorrect: true, assignedOptionId: null }
      ]
    };

    it('should return true when all answers match', () => {
      const userAnswer: IQuestion = {
        ...originalQuestion,
        answers: [
          { id: 1, answerText: 'A', isCorrect: false, assignedOptionId: null },
          { id: 2, answerText: 'B', isCorrect: true, assignedOptionId: null }
        ]
      };

      expect(component.isQuestionCorrect(originalQuestion, userAnswer)).toBe(true);
    });

    it('should return false when answers do not match', () => {
      const userAnswer: IQuestion = {
        ...originalQuestion,
        answers: [
          { id: 1, answerText: 'A', isCorrect: true, assignedOptionId: null },
          { id: 2, answerText: 'B', isCorrect: false, assignedOptionId: null }
        ]
      };

      expect(component.isQuestionCorrect(originalQuestion, userAnswer)).toBe(false);
    });

    it('should handle assignment type questions', () => {
      const assignmentQuestion: IQuestion = {
        id: 1,
        questionText: 'Match',
        pointsTotal: 10,
        type: QuestionType.ASSIGNMENT,
        answers: [
          { id: 1, answerText: 'A', isCorrect: false, assignedOptionId: 1 },
          { id: 2, answerText: 'B', isCorrect: false, assignedOptionId: 2 }
        ]
      };

      const userAnswer: IQuestion = {
        ...assignmentQuestion,
        answers: [
          { id: 1, answerText: 'A', isCorrect: false, assignedOptionId: 1 },
          { id: 2, answerText: 'B', isCorrect: false, assignedOptionId: 2 }
        ]
      };

      expect(component.isQuestionCorrect(assignmentQuestion, userAnswer)).toBe(true);
    });

    it('should return false for incorrect assignment answers', () => {
      const assignmentQuestion: IQuestion = {
        id: 1,
        questionText: 'Match',
        pointsTotal: 10,
        type: QuestionType.ASSIGNMENT,
        answers: [
          { id: 1, answerText: 'A', isCorrect: false, assignedOptionId: 1 },
          { id: 2, answerText: 'B', isCorrect: false, assignedOptionId: 2 }
        ]
      };

      const userAnswer: IQuestion = {
        ...assignmentQuestion,
        answers: [
          { id: 1, answerText: 'A', isCorrect: false, assignedOptionId: 2 },
          { id: 2, answerText: 'B', isCorrect: false, assignedOptionId: 1 }
        ]
      };

      expect(component.isQuestionCorrect(assignmentQuestion, userAnswer)).toBe(false);
    });
  });
});
