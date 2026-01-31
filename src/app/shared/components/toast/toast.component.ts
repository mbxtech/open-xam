import {Component, inject} from '@angular/core';
import {ToastService} from '../../service/toast.service';
import {Observable} from 'rxjs';
import {IToast} from '../../model/interfaces/toast.interface';
import {AsyncPipe, DatePipe, NgClass} from '@angular/common';

@Component({
  selector: 'ox-toast',
    imports: [
        AsyncPipe,
        DatePipe,
        NgClass
    ],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent {

  private readonly _toasts$: Observable<IToast[]>;
  private readonly _service: ToastService = inject(ToastService);
  constructor() {
    this._toasts$ = this._service.toasts$;
  }

  public remove(index: number): void {
    this._service.remove(index);
  }

  public get toasts$(): Observable<IToast[]> {
    return this._toasts$;
  }
}
