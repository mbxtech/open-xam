import {Component, computed, effect, input, InputSignal, output, signal, WritableSignal} from '@angular/core';
import {IQuestion} from '../../../../model/interfaces/question.interface';
import {questionViewMode} from '../../question-view';
import {QuestionSummaryError} from '../question-summary/components/question-summary-error/question-summary-error';
import {QuestionSummarySuccess} from '../question-summary/components/question-summary-success/question-summary-success';
import {QuestionSummary} from '../question-summary/question-summary';

@Component({
  selector: 'ox-multiple-choice-view',
  standalone: true,
  imports: [QuestionSummary, QuestionSummarySuccess, QuestionSummaryError],
  templateUrl: './multiple-choice-view.html',
})
export class MultipleChoiceViewComponent {
  public question: InputSignal<IQuestion> = input.required();
  public questionResult: InputSignal<IQuestion | null> = input<IQuestion | null>(null);
  public viewMode: InputSignal<questionViewMode> = input.required();
  public confirmed: InputSignal<boolean> = input(false);

  public isAnswerCorrectChosen: WritableSignal<boolean> = signal<boolean>(false);

  public answerChange = output<IQuestion>();

  public availableAnswers = computed(() => this.question().answers);
  public selectedAnswers: WritableSignal<Set<number>> = signal(new Set());
  public correctAnswers = computed(() => (this.question()).answers.filter((a) => a.isCorrect));
  public cssClassActive = computed(() => this.confirmed() && (this.viewMode() === 'simulation' || this.viewMode() === 'preview'));

  constructor() {
    effect(() => {
      const q = this.question();
      const result = this.questionResult();

      if (result?.answers.length) {
        const selected = new Set(result.answers.filter(a => a.isCorrect).map(a => a.id!));
        this.selectedAnswers.set(selected);

        if (this.confirmed()) {
          const correctAnswers = q.answers.filter(a => a.isCorrect).sort((a, b) => a.id! - b.id!);
          const resultAnswers = result.answers.filter(a => a.isCorrect).sort((a, b) => a.id! - b.id!);
          this.isAnswerCorrectChosen.set(correctAnswers?.length == resultAnswers?.length && resultAnswers.every((a, i) => a.id === correctAnswers?.[i]?.id));
        }
      }
    });
  }

  public onToggleSelection(answerId: number) {
    const currentSelected = new Set(this.selectedAnswers());
    if (currentSelected.has(Number(answerId))) {
      currentSelected.delete(answerId);
    } else {
      currentSelected.add(answerId);
    }
    this.selectedAnswers.set(currentSelected);

    const correctIds = new Set(this.question().answers.filter(a => a.isCorrect).map(a => a.id!));
    this.isAnswerCorrectChosen.set(correctIds.size === currentSelected.size && [...currentSelected].every(id => correctIds.has(id)));

    const updatedQuestion = { ...this.question() };
    updatedQuestion.answers = updatedQuestion.answers.map(a => ({
      ...a,
      isCorrect: currentSelected.has(a.id!)
    }));
    this.answerChange.emit(updatedQuestion);
  }

  public getCorrectAnswerText(): string {
    return this.correctAnswers().map((a) => a.answerText).join(', ');
  }  
  
  public getSelectedAnswerText(): string {
    return [...new Set(this.selectedAnswers())].map((a) => this.availableAnswers().find((answer) => answer.id === a)?.answerText).join(', ');
  }

  protected isAnswerSelected(id: number) {
    return this.selectedAnswers().has(Number(id));
  }

  public showCorrectColor(id: number): boolean {
    return this.cssClassActive() && (new Set(this.correctAnswers().map(a => a.id))).has(id);
  }

  public showWrongColor(id: number): boolean {
    return this.cssClassActive() && !(new Set(this.correctAnswers().map(a => a.id))).has(id);
  }

}
