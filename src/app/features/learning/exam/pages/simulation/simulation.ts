import {Component, computed, inject, OnDestroy, OnInit, output, signal} from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faCheck, faChevronLeft, faChevronRight, faTimes} from '@fortawesome/free-solid-svg-icons';
import {QuestionView, questionViewMode} from '../../../../../shared/components/question-view/question-view';
import {IExam} from '../../../../../shared/model/interfaces/exam.interface';
import {IQuestion} from '../../../../../shared/model/interfaces/question.interface';
import {ExamService} from '../../../../../shared/service/exam.service';
import {ButtonComponent} from '../../../../../shared/components/button/button.component';
import {CardComponent} from '../../../../../shared/components/card/card.component';
import {Subscription} from "rxjs";

@Component({
    selector: 'ox-simulation',
    standalone: true,
    imports: [QuestionView, FaIconComponent, QuestionView, ButtonComponent, CardComponent],
    templateUrl: './simulation.html',
    styleUrl: './simulation.scss',
})
export class Simulation implements OnInit, OnDestroy {
    public readonly faChevronLeft = faChevronLeft;
    public readonly faChevronRight = faChevronRight;
    public readonly faCheck = faCheck;
    public readonly faTimes = faTimes;

    private _router: Router = inject(Router);
    private _examService: ExamService = inject(ExamService);
    private _route: ActivatedRoute = inject(ActivatedRoute);

    private readonly _subscriptions$: Subscription = new Subscription();

    public exam = signal<IExam | null>(null);
    public currentQuestionIndex = signal<number>(0);
    public viewMode = signal<questionViewMode>('simulation');
    public confirmedQuestions = signal<Set<number>>(new Set());
    public questionAnswers = signal<Record<number, IQuestion>>({});

    public finished = output<IQuestion[]>();

    public currentQuestion = computed(() => {
        const e = this.exam();
        if (!e || !e.questions) return null;
        return e.questions[this.currentQuestionIndex()];
    });

    public isConfirmed = computed(() => {
        const q = this.currentQuestion();
        return q ? this.confirmedQuestions().has(q.id!) : false;
    });

    public progress = computed(() => {
        const e = this.exam();
        if (!e || !e.questions.length) return 0;
        return ((this.currentQuestionIndex() + 1) / e.questions.length) * 100;
    });


    ngOnInit() {
        const id = this._route.snapshot.params['id'];
        if (id) {
            this._subscriptions$.add(this._examService.getExamById(+id).subscribe(exam => {
                if (exam) {
                    this.exam.set(exam);
                    const answers: Record<number, IQuestion> = {};
                    exam.questions.forEach(q => {
                        const clone = JSON.parse(JSON.stringify(q));
                        clone.answers.forEach((a: any) => a.isCorrect = false);
                        clone.answers.forEach((a: any) => a.assignedOptionId = null);
                        answers[q.id!] = clone;
                    });
                    this.questionAnswers.set(answers);
                }
            }));
        }

        this._subscriptions$.add(this._route.queryParams.subscribe(params => {
            if (params['mode']) {
                this.viewMode.set(params['mode'] as questionViewMode);
            }
        }));
    }

    ngOnDestroy() {
        this._subscriptions$.unsubscribe();
    }

    public handleAnswerChange(updatedQuestion: IQuestion) {
        this.questionAnswers.update(prev => ({
            ...prev,
            [updatedQuestion.id!]: updatedQuestion
        }));
    }

    public confirmAnswer() {
        const q = this.currentQuestion();
        if (q) {
            this.confirmedQuestions.update(prev => {
                const next = new Set(prev);
                next.add(q.id!);
                return next;
            });

            if (this.viewMode() === 'realistic') {
                this.nextQuestion();
            }
        }
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

    public finishSimulation() {
        const answers = Object.values(this.questionAnswers());
        this.finished.emit(answers);
        this._router.navigate(['/learning/overview']).then();
    }
}
