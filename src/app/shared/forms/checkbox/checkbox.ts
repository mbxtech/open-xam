import {Component, forwardRef, input, InputSignal, output, OutputEmitterRef, signal} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";

@Component({
  selector: 'ox-checkbox',
  imports: [],
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Checkbox),
      multi: true
    }
  ],
})
export class Checkbox implements ControlValueAccessor {

  public label: InputSignal<string | undefined> = input<string | undefined>();
  public id: InputSignal<string> = input<string>(crypto.randomUUID());

  public valueChecked: OutputEmitterRef<boolean> = output<boolean>();

  protected checked = signal(false);
  protected disabled = signal(false);

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  protected toggle(): void {
    if (this.disabled()) return;

    const value = !this.checked();
    this.checked.set(value);
    this.valueChecked.emit(value);
    this.onChange(value);
    this.onTouched();
  }

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
    this.valueChecked.emit(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
