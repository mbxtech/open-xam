import {Component, computed, HostListener, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {ExamService} from '../../../../../shared/service/exam.service';
import {IExam} from '../../../../../shared/model/interfaces/exam.interface';
import {IQuestion} from '../../../../../shared/model/interfaces/question.interface';
import {QuestionView} from '../../../../../shared/components/question-view/question-view';
import {ButtonComponent} from '../../../../../shared/components/button/button.component';
import {CardComponent} from '../../../../../shared/components/card/card.component';
import {BadgeComponent} from '../../../../../shared/components/badge/badge.component';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faClock,
  faExclamationTriangle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import {interval, Subscription} from 'rxjs';
import {QuestionType} from '../../../../../shared/model/question-type.enum';

export type CertificationState = 'INTRODUCTION' | 'EXAM' | 'RESULT' | 'FAILED_CHEAT';

@Component({
  selector: 'ox-certification-mode',
  standalone: true,
  imports: [
    CommonModule,
    QuestionView,
    ButtonComponent,
    CardComponent,
    BadgeComponent,
    FaIconComponent
  ],
  templateUrl: './certification-mode.html',
  styleUrl: './certification-mode.scss',
})
export class CertificationMode implements OnInit, OnDestroy {
  public state = signal<CertificationState>('INTRODUCTION');
  public exam = signal<IExam | null>(null);
  public currentQuestionIndex = signal<number>(0);
  public questionAnswers = signal<Record<number, IQuestion>>({});
  public timeRemaining = signal<number>(0);
  
  // Icons
  public readonly faChevronLeft = faChevronLeft;
  public readonly faChevronRight = faChevronRight;
  public readonly faClock = faClock;
  public readonly faExclamationTriangle = faExclamationTriangle;
  public readonly faCheckCircle = faCheckCircle;
  public readonly faTimesCircle = faTimesCircle;

  private _router = inject(Router);
  private _examService = inject(ExamService);
  private _route = inject(ActivatedRoute);
  private _timerSubscription?: Subscription;

  public currentQuestion = computed(() => {
    const e = this.exam();
    if (!e || !e.questions) return null;
    const q = e.questions[this.currentQuestionIndex()];
    return this.questionAnswers()[q.id!] || q;
  });

  public progress = computed(() => {
    const e = this.exam();
    if (!e || !e.questions.length) return 0;
    return ((this.currentQuestionIndex() + 1) / e.questions.length) * 100;
  });

  public score = computed(() => {
    const e = this.exam();
    if (!e) return 0;
    
    let totalPoints = 0;
    const answers = this.questionAnswers();
    
    e.questions.forEach(q => {
      const userAnswer = answers[q.id!];
      if (userAnswer && this.isQuestionCorrect(q, userAnswer)) {
        totalPoints += q.pointsTotal;
      }
    });
    return totalPoints;
  });

  public isPassed = computed(() => {
    const e = this.exam();
    if (!e) return false;
    return this.score() >= (e.pointsToSucceeded ?? 0);
  });

  ngOnInit() {
    const id = this._route.snapshot.params['id'];
    if (id) {
      this._examService.getExamById(+id).subscribe(exam => {
        if (exam) {
          this.exam.set(exam);
        }
      });
    }
  }

  ngOnDestroy() {
    this._stopTimer();
  }

  @HostListener('window:blur')
  onBlur() {
    if (this.state() === 'EXAM') {
      this.failCheat();
    }
  }

  @HostListener('document:mouseleave')
  onMouseLeave() {
    if (this.state() === 'EXAM') {
      this.failCheat();
    }
  }

  public startCertification() {
    const e = this.exam();
    if (!e) return;

    // Prepare questions: shuffle and pick max number of questions for exam or 30 if not set
    let originalQuestions = [...e.questions];
    originalQuestions = originalQuestions.sort(() => Math.random() - 0.5);
    const maxQuestions = e.maxQuestionsRealExam ? e.maxQuestionsRealExam : 30;
    if (originalQuestions.length > maxQuestions) {
      originalQuestions = originalQuestions.slice(0, maxQuestions);
    }

    // Keep the original questions (with correct isCorrect values) in the exam signal
    const updatedExam = { ...e, questions: originalQuestions };
    this.exam.set(updatedExam);

    const answers: Record<number, IQuestion> = {};
    originalQuestions.forEach(q => {
      // Create a copy where all 'isCorrect' are false to represent "no selection yet"
      // This is necessary because the views use 'isCorrect' to track selection
      const qCopy = JSON.parse(JSON.stringify(q));
      if (q.type === QuestionType.ASSIGNMENT) {
        qCopy.answers.forEach((a: any) => a.assignedOptionId = null);
      } else {
        qCopy.answers.forEach((a: any) => a.isCorrect = false);
      }
      answers[q.id!] = qCopy;
    });
    this.questionAnswers.set(answers);

    // Setup timer: default 30 minutes if not set
    const duration = e.duration ? e.duration * 60 : 30 * 60;
    this.timeRemaining.set(duration);
    this._startTimer();

    this.state.set('EXAM');
  }

  private _startTimer() {
    this._timerSubscription = interval(1000).subscribe(() => {
      this.timeRemaining.update(t => {
        if (t <= 1) {
          this.finishCertification();
          return 0;
        }
        return t - 1;
      });
    });
  }

  private _stopTimer() {
    this._timerSubscription?.unsubscribe();
  }

  public handleAnswerChange(updatedQuestion: IQuestion) {
    this.questionAnswers.update(prev => ({
      ...prev,
      [updatedQuestion.id!]: updatedQuestion
    }));
  }

  public nextQuestion() {
    const e = this.exam();
    if (e && this.currentQuestionIndex() < e.questions.length - 1) {
      this.currentQuestionIndex.update(idx => idx + 1);
    }
  }

  public previousQuestion() {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.update(idx => idx - 1);
    }
  }

  public finishCertification() {
    this._stopTimer();
    this.state.set('RESULT');
  }

  public failCheat() {
    this._stopTimer();
    this.state.set('FAILED_CHEAT');
  }

  public formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  public backToOverview() {
    this._router.navigate(['/learning/overview']);
  }

  // Result helper
  public isQuestionCorrect(original: IQuestion, userAnswer: IQuestion): boolean {
    // We compare the original correct answers with what's in userAnswer.
    // The views (SingleChoice/MultipleChoice) unfortunately overwrite 'isCorrect' in the userAnswer 
    // to indicate selection. So we check if the userAnswer's 'isCorrect' fields match the original ones.
    
    if (original.type === QuestionType.ASSIGNMENT) {
        return original.answers.every(origAns => {
            const userAns = userAnswer.answers.find(a => a.id === origAns.id);
            return origAns.assignedOptionId === userAns?.assignedOptionId;
        });
    }

    return original.answers.every(origAns => {
      const userAns = userAnswer.answers.find(a => a.id === origAns.id);
      return (origAns.isCorrect ?? false) === (userAns?.isCorrect ?? false);
    });
  }
}
