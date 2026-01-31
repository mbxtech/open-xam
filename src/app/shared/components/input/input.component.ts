import {Component, ElementRef, input, model, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'ox-input',
  imports: [
    FormsModule
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent {
  public value = model<string | number>('');

  @ViewChild('inputElement', {read: ElementRef})
  public inputElement!: ElementRef<HTMLInputElement>;

  public type = input<string>('text');
  public placeholder = input<string>('');
  public disabled = input<boolean>(false);
  public readonly = input<boolean>(false);
  public required = input<boolean>(false);
  public class = input<string>('');
  public min = input<number | undefined>(undefined);
  public max = input<number | undefined>(undefined);
  public step = input<number | undefined>(undefined);
  public maxlength = input<number | undefined>(undefined);
  public pattern = input<string | undefined>(undefined);
  public ariaInvalid = input<boolean | undefined>(undefined);
  public ariaLabel = input<string | undefined>(undefined);
  public ariaDescribedby = input<string | undefined>(undefined);

  protected inputClasses = (() => {
    const baseClasses = [
      'placeholder:text-subtext-color',
      'bg-neutral-100',
      'dark:bg-neutral-900',
      'border-neutral-border',
      'text-default-font',
      'flex',
      'h-9',
      'w-full',
      'min-w-0',
      'rounded-md',
      'border',
      'px-3',
      'py-1',
      'text-base',
      'transition-[color,box-shadow]',
      'outline-none',
      'disabled:pointer-events-none',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
      'md:text-sm',
      'focus-visible:border-brand-primary',
      'aria-invalid:border-error-500'
    ];

    return () => {
      const customClasses = this.class();
      return [...baseClasses, customClasses].filter(Boolean).join(' ');
    };
  })();
}
