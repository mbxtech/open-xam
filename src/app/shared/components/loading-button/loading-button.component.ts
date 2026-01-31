import {Component, Input} from '@angular/core';

@Component({
  selector: 'ox-loading-button',
  imports: [],
  templateUrl: './loading-button.component.html',
  styleUrl: './loading-button.component.scss'
})
export class LoadingButtonComponent {

  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() defaultLabel: string = '';
  @Input() loadingText: string = '';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() click: ($event: Event) => void = (_) => {
  };

}
