import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IAnswer } from "../model/interfaces/answer.interface";
import { BaseService } from "./base-service";

@Injectable({
  providedIn: 'root'
})
export class AnswersService extends BaseService {

  public deleteAnswerById(id: number): Observable<number | null> {
    this.setInitialStates();
    return this.invoke$<number>('delete_answer', { id });
  }

  public updateAnswer(answer: IAnswer): Observable<IAnswer | null> {
    this.setInitialStates();
    return this.invoke$('update_answer', { answer });
  }

  public createAnswer(answer: IAnswer): Observable<IAnswer | null> {
    this.setInitialStates();
    return this.invoke$('create_answer', { answer });
  }

}
