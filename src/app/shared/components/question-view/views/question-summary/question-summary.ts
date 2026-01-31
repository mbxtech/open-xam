import { Component, ContentChild, input, InputSignal } from '@angular/core';
import { QuestionSummarySuccess } from './components/question-summary-success/question-summary-success';
import { QuestionSummaryError } from './components/question-summary-error/question-summary-error';

@Component({
  selector: 'ox-question-summary',
  imports: [],
  templateUrl: './question-summary.html',
  styleUrl: './question-summary.scss',
})
export class QuestionSummary {

  public result: InputSignal<boolean> = input.required();

  @ContentChild(QuestionSummarySuccess) private successContent?: QuestionSummarySuccess;
  @ContentChild(QuestionSummaryError) private errorContent?: QuestionSummaryError;

  protected get hasErrorContent(): boolean {
    return !!this.errorContent;
  }

  protected get hasSuccessContent(): boolean {
    return !!this.successContent;
  }

}
