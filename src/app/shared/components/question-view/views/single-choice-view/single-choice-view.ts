import {Component, computed, effect, input, InputSignal, output, signal, WritableSignal} from '@angular/core';
import {IQuestion} from '../../../../model/interfaces/question.interface';

import {IAnswer} from '../../../../model/interfaces/answer.interface';
import {questionViewMode} from '../../question-view';
import {QuestionSummaryError} from "../question-summary/components/question-summary-error/question-summary-error";
import {QuestionSummarySuccess} from "../question-summary/components/question-summary-success/question-summary-success";
import {QuestionSummary} from "../question-summary/question-summary";

@Component({
    selector: 'ox-single-choice-view',
    standalone: true,
    imports: [QuestionSummary, QuestionSummarySuccess, QuestionSummaryError],
    templateUrl: './single-choice-view.html',
})
export class SingleChoiceViewComponent {
    public question: InputSignal<IQuestion> = input.required();
    public viewMode: InputSignal<questionViewMode> = input.required();
    public confirmed: InputSignal<boolean> = input(false);
    public questionResult: InputSignal<IQuestion | null> = input<IQuestion | null>(null);

    public answerChange = output<IQuestion>();

    public isAnswerCorrectChosen: WritableSignal<boolean> = signal<boolean>(false);

    public availableAnswers = computed(() => this.question().answers);
    public correctAnswer: WritableSignal<IAnswer | null> = signal(null);
    public selectedAnswer: WritableSignal<IAnswer | null> = signal(null);
    public cssClassActive = computed(() => this.confirmed() && (this.viewMode() === 'simulation' || this.viewMode() === 'preview'));

    constructor() {
        effect(() => {
            const inputQuestion = this.question();
            const result = this.questionResult();

            if (inputQuestion.answers.length) {
                const correctAnswer = inputQuestion.answers.find(a => a.isCorrect) || null;
                this.correctAnswer.set(correctAnswer);
            }

            if (result?.answers?.length) {
                const selected = result.answers.find(a => a.isCorrect) || null;
                this.selectedAnswer.set(selected);

                if (this.confirmed()) {
                    const originAnswer = inputQuestion.answers.find(a => a.isCorrect)!;
                    this.isAnswerCorrectChosen.set(selected?.id === originAnswer?.id);
                }
            }
        });
    }

    public showCorrectColor(id: number): boolean {
        return this.cssClassActive() && this.correctAnswer()?.id === id;
    }

    public showWrongColor(id: number): boolean {
        return this.cssClassActive() && this.correctAnswer()?.id !== id;
    }

    public onSelectionChange(answerId: number) {
        const updatedQuestion = JSON.parse(JSON.stringify({...this.question()})) satisfies IQuestion;
        updatedQuestion.answers = updatedQuestion.answers.map((a: IAnswer) => ({
            ...a,
            isCorrect: a.id === Number(answerId)
        }));
        const selected = updatedQuestion.answers.find((a: IAnswer) => a.id === answerId) || null;
        this.selectedAnswer.set(selected);
        this.isAnswerCorrectChosen.set(Number(answerId) === this.correctAnswer()?.id);
        this.answerChange.emit(updatedQuestion);
    }

}
