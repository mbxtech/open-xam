import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {IToast} from '../model/interfaces/toast.interface';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private readonly _currentToasts: BehaviorSubject<IToast[]> = new BehaviorSubject<IToast[]>([]);

  constructor() { }

  public get toasts$(): Observable<IToast[]> {
    return this._currentToasts.asObservable();
  }

  public add(toast: IToast): void {
    this._currentToasts.next([...this.toasts, toast])
  }

  public addSuccessToast(title: string, message: string): void {
      this._currentToasts.next([...this.toasts, {
          title,
          message,
          type: "success",
          date: new Date()
      }]);
  }

  public addErrorToast(title: string, message: string): void {
      this._currentToasts.next([...this.toasts, {
          title,
          message,
          type: "danger",
          date: new Date()
      }]);
  }

  public clear(): void {
    this._currentToasts.next([]);
  }

  public remove(index: number) {
    const toasts = this.toasts;
    toasts.splice(index, 1);
    this._currentToasts.next(toasts);
  }

  public get toasts(): IToast[] {
    return this._currentToasts.value;
  }

}
