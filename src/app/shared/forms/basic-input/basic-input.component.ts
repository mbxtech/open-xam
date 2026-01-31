import {
  Component,
  ElementRef,
  forwardRef,
  inject,
  input,
  Input,
  InputSignal,
  Renderer2,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { inputBaseClasses } from '../../style/input-base.css';

interface ValidationError {
  key: string,
  message: string
}

@Component({
  selector: 'ox-basic-input',
  imports: [],
  templateUrl: './basic-input.component.html',
  styleUrl: './basic-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BasicInputComponent),
      multi: true
    }
  ]
})
export class BasicInputComponent implements ControlValueAccessor {

  public value: string | number = '';
  public disabled = false

  @Input() label: string = '';
  @Input() id: string = '';
  @Input() placeholder: string = '';
  @Input() type: 'text' | 'number' | 'textarea' = 'text';
  @Input() rows: number = 3;
  @Input() formControl: FormControl = new FormControl();


  @ViewChild('inputElement', { read: ElementRef })
  protected inputElement: ElementRef<HTMLInputElement | HTMLTextAreaElement> | null = null;
  private readonly _renderer: Renderer2 = inject(Renderer2);
  public class: InputSignal<string> = input<string>('');


  public onChange = (_: string | number) => {
  };
  public onTouched = () => {
  };

  public handleInput(event: Event) {

    this.onChange(this.castValue((event.target as HTMLInputElement).value))
    this.handleErrors();
  }

  private castValue(obj: any): any {
    if (this.type === 'number') {
      return Number(obj);
    }
    return obj;
  }

  writeValue(obj: any): void {
      this.value = this.castValue(obj);
    
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = () => {
      if (fn) {
        fn();
      }
      this.handleErrors();
    }
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  public get hasErrors(): boolean {
    return this.formControl?.invalid && (this.formControl.dirty || this.formControl?.touched)
  }

  public isRequired(): boolean {
    return this.formControl.hasValidator(Validators.required);
  }

  private handleErrors(): void {
    if (this.inputElement?.nativeElement != null) {
      const nativeElement = this.inputElement.nativeElement;
      const classes = nativeElement.classList;
      if (this.hasErrors) {
        this._renderer.addClass(nativeElement, 'invalid-border');
      }
      if (!this.hasErrors && classes.contains('invalid-border')) {
        this._renderer.removeClass(nativeElement, 'invalid-border')
      }
    }
  }

  public get errors(): ValidationError[] {
    if (this.formControl?.errors) {
      const result: ValidationError[] = [];
      const keys: string[] = Object.keys(this.formControl.errors);
      keys.forEach((key) => result.push({
        key,
        message: this.formControl.getError(key)
      }))
      return result;
    }
    return [];
  }

  inputClasses = (() => {
    return () => {
      const customClasses = this.class();
      return [...inputBaseClasses, customClasses].filter(Boolean).join(' ');
    };
  })();
}
