import {Injectable} from '@angular/core';
import {BaseService} from "./base-service";
import {map, Observable} from 'rxjs';
import {IQuestion} from "../model/interfaces/question.interface";

@Injectable({
  providedIn: 'root'
})
export class QuestionService extends BaseService {

  public getQuestionsByExamId(examId: number): Observable<IQuestion[]> {
    this.setInitialStates();
    return this.invoke$<IQuestion[]>('get_questions_by_exam_id', {examId}).pipe(map((questions) => questions ?? []));
  }

  public getQuestionsById(questionId: number): Observable<IQuestion | null> {
    this.setInitialStates();
    return this.invoke$<IQuestion | null>('get_question', {id: questionId});
  }

  public createQuestion(question: IQuestion): Observable<IQuestion | null> {
    this.setInitialStates();
    return this.invoke$('create_question', {questionToCreate: question});
  }

  public updateQuestion(input: IQuestion): Observable<IQuestion | null> {
      this.setInitialStates();
      return this.invoke$('update_question', {questionToUpdate: input});
  }

  public deleteQuestion(id: number): Observable<number | null> {
      this.setInitialStates();
      return this.invoke$('delete_question', {id});
  }

}
