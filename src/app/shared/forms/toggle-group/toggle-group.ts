
import { Component, effect, forwardRef, input, model, output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface ToggleOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'ox-toggle-group',
  imports: [],
  templateUrl: './toggle-group.html',
  styleUrl: './toggle-group.scss',
   providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleGroup),
      multi: true
    }
  ]
})
export class ToggleGroup implements ControlValueAccessor {

  options = input<ToggleOption[]>([]);
  ariaLabel = input<string>('Toggle group');
  disabled = input<boolean>(false);
  valueChange = output<string>();

  selectedValue = model<string>('');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const currentValue = this.selectedValue();
      this.onChange(currentValue);
    });
  }

  selectOption(value: string): void {
    if (this.disabled()) return;
    
    const option = this.options().find(opt => opt.value === value);
    if (option?.disabled) return;
    
    this.selectedValue.set(value);
    this.onTouched();
    this.valueChange.emit(this.selectedValue());
  }

  writeValue(value: string): void {
    this.selectedValue.set(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {
    // Note: disabled is now a signal input, handled externally
  }

}
