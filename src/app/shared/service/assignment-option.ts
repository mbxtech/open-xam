import {Injectable} from '@angular/core';
import {BaseService} from './base-service';
import {Observable} from 'rxjs';
import {IAssignmentOption} from '../model/interfaces/assignment-option.interface';
import AssignmentOption from '../model/classes/assiginment-options.class';

@Injectable({
  providedIn: 'root',
})
export class AssignmentOptionService extends BaseService{

  public deleteById(id: number): Observable<number | null> {
    this.setInitialStates();
    return this.invoke$<number>('delete_assignment_option', {id});
  }

  public update(option: IAssignmentOption): Observable<IAssignmentOption | null> {
    this.setInitialStates();
    return this.invoke$('update_assignment_option', {option: new AssignmentOption(option)});
  }  
  
  public create(option: IAssignmentOption): Observable<IAssignmentOption | null> {
    this.setInitialStates();
    return this.invoke$('create_assignment_option', {option: new AssignmentOption(option)});
  }
}
