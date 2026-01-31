import { Component, input, InputSignal } from '@angular/core';

export type BadgeType = 'primary' | 'secondary' | 'destructive' | 'outlined';

@Component({
  selector: 'ox-badge',
  imports: [],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {

  public variant: InputSignal<BadgeType> = input<BadgeType>('primary');
  public cssClass: InputSignal<string> = input<string>('');

  public getBadgeCssString(): string {
    const cssString: string = 'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden';
    const primary = 'border-transparent bg-brand-primary text-white';
    if (this.cssClass().length) {
      return `${cssString} ${this.cssClass()}`;
    }
    switch (this.variant()) {
      case 'primary':
        return `${cssString} ${primary}`;
      case 'secondary':
        return `${cssString} border-transparent bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100`;
      case 'destructive':
        return `${cssString} border-transparent bg-error-500 text-white`;
      case 'outlined':
        return `${cssString} border-neutral-border text-default-font bg-transparent`;
      default:
        return `${cssString} ${primary}`;
    }
  }

}
