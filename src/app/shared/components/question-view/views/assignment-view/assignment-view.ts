import {CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {CommonModule} from '@angular/common';
import {Component, effect, input, InputSignal, output} from '@angular/core';
import {IAnswer} from '../../../../model/interfaces/answer.interface';
import {IQuestion} from '../../../../model/interfaces/question.interface';
import {questionViewMode} from '../../question-view';


interface ICategory {
  id: number;
  name: string;
  assignedAnswers: IAnswer[];
}

@Component({
  selector: 'ox-assignment-view',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './assignment-view.html',
})
export class AssignmentViewComponent {
  public question: InputSignal<IQuestion> = input.required();
  public originalQuestion: InputSignal<IQuestion | null> = input<IQuestion | null>(null);
  public questionResult: InputSignal<IQuestion | null> = input<IQuestion | null>(null);
  public viewMode: InputSignal<questionViewMode> = input.required();
  public confirmed = input<boolean>(false);

  public answerChange = output<IQuestion>();
  public availableAnswers: IAnswer[] = [];
  public categories: ICategory[] = [];

  constructor() {
    effect(() => {
      this.question();
      this.questionResult();
      this.initializeData();
    });
  }

  private initializeData() {
    const result = this.questionResult();
    const question = this.question();

    this.categories = (question.options || []).map(option => ({
      id: option.id,
      name: option.text,
      assignedAnswers: []
    }));

    const activeAnswers = result?.answers?.length ? result.answers : (question.answers || []);
    const assignedAnswerIds = new Set<number>();

    this.categories.forEach(category => {
      category.assignedAnswers = activeAnswers
        .filter(a => a.assignedOptionId === category.id)
        .map(ans => {
          assignedAnswerIds.add(ans.id!);
          // Wenn wir aus result kommen, suchen wir die Original-Antwort für die Beschreibung etc.
          if (result?.answers?.length) {
            return question.answers.find(qa => qa.id === ans.id) || ans;
          }
          return ans;
        });
    });

    this.availableAnswers = (question.answers || []).filter(a => !assignedAnswerIds.has(a.id!));
  }

  public onDrop(event: CdkDragDrop<IAnswer[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.emitAnswerChange();
  }

  public isAnswerCorrect(answer: IAnswer, categoryId: number): boolean {
    const original = this.originalQuestion();
    if (original) {
      const originalAnswer = original.answers.find(a => a.id === answer.id);
      return originalAnswer?.assignedOptionId === categoryId;
    }
    return answer?.assignedOptionId === categoryId;
  }

  public getAnswerClass(answer: IAnswer, categoryId: number): string {
    if (!this.confirmed()) {
      return 'bg-neutral-50 border-blue-200';
    }

    return this.isAnswerCorrect(answer, categoryId)
      ? 'bg-green-50 border-green-500'
      : 'bg-red-50 border-red-500';
  }

  public getCorrectCount(): number {
    let correct = 0;
    
    this.categories.forEach(category => {
      category.assignedAnswers.forEach(answer => {
        if (this.isAnswerCorrect(answer, category.id)) {
          correct++;
        }
      });
    });

    return correct;
  }

  public getTotalCount(): number {
    return this.question().answers?.length || 0;
  }

  private emitAnswerChange() {
    const originalQuestion = this.question();
    
    const updatedQuestion: IQuestion = {
      ...originalQuestion,
      answers: this.createUpdatedAnswers()
    };

    this.answerChange.emit(updatedQuestion);
  }

  private createUpdatedAnswers(): IAnswer[] {
    const originalAnswers = this.question().answers || [];
    
    return originalAnswers.map(answer => {
      const categoryWithAnswer = this.categories.find(cat =>
        cat.assignedAnswers.some(a => a.id === answer.id)
      );

      return {
        ...answer,
        assignedOptionId: categoryWithAnswer?.id || null
      };
    });
  }

  public isAllCorrect(): boolean {
    if (this.availableAnswers.length > 0) {
      return false;
    }

    return this.categories.every(category =>
      category.assignedAnswers.every(answer =>
        this.isAnswerCorrect(answer, category.id)
      )
    );
  }

  public getAllListIds(): string[] {
    return ['available', ...this.categories.map(c => `${c.id}`)];
  }
}