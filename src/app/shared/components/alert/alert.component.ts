import {Component, effect, input, InputSignal} from '@angular/core';

type AlertType = 'success' | 'danger' | 'light' | 'primary' | 'secondary' | 'info' | 'dark';

@Component({
  selector: 'ox-alert',
  imports: [],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss'
})
export class AlertComponent {

  public type: InputSignal<AlertType> = input<AlertType>('primary');
  public message: InputSignal<string> = input<string>('');
  public show: InputSignal<boolean> = input<boolean>(false);

  private _show: boolean = false;

  constructor() {
    effect(() => {
      this._show = this.show();
    });
  }

  public get shouldShow(): boolean {
    return this._show;
  }

  public set shouldShow(value: boolean) {
    this._show = value;
  }

}
