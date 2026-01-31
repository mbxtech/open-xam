import {Component, input, InputSignal} from '@angular/core';
import {NgClass} from "@angular/common";

@Component({
  selector: 'ox-card',
  imports: [
    NgClass
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {

  public cssClass: InputSignal<string> = input<string>('');

  public getClass(): string {
    const baseCss = 'text-default-font flex flex-col gap-6 rounded-md border border-neutral-border'
    if (this.cssClass().length) {
      return `${baseCss} ${this.cssClass()}`
    }

    return `bg-neutral-50 dark:bg-neutral-900 ${baseCss}`
  }

}
