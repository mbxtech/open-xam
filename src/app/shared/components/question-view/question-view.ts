import { Component, input, InputSignal, output } from '@angular/core';
import { IQuestion } from '../../model/interfaces/question.interface';
import { QuestionType } from '../../model/question-type.enum';
import { SingleChoiceViewComponent } from './views/single-choice-view/single-choice-view';
import { MultipleChoiceViewComponent } from './views/multiple-choice-view/multiple-choice-view';
import { AssignmentViewComponent } from './views/assignment-view/assignment-view';
import {CardComponent} from '../card/card.component';
import {BadgeComponent} from '../badge/badge.component';
import {AlertComponent} from '../alert/alert.component';

export type questionViewMode = 'simulation' | 'preview' | 'realistic';
@Component({
  selector: 'ox-question-view',
    imports: [
        SingleChoiceViewComponent,
        MultipleChoiceViewComponent,
        AssignmentViewComponent,
        CardComponent,
        BadgeComponent,
        AlertComponent
    ],
  templateUrl: './question-view.html',
  styleUrl: './question-view.scss',
})
export class QuestionView {
  public question: InputSignal<IQuestion> = input.required();
  public questionResult: InputSignal<IQuestion | null> = input<IQuestion | null>(null);
  public originalQuestion: InputSignal<IQuestion | null> = input<IQuestion | null>(null);
  public viewMode: InputSignal<questionViewMode> = input.required();
  public confirmed = input<boolean>(false);

  public answerChanged = output<IQuestion>();

  public readonly QuestionType = QuestionType;

  public handleAnswerChange(updatedQuestion: IQuestion) {
    this.answerChanged.emit(updatedQuestion);
  }

}
