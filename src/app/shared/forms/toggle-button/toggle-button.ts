import { NgClass } from '@angular/common';
import { Component, effect, forwardRef, input, InputSignal, output, OutputEmitterRef, signal, WritableSignal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ox-toggle-button',
  imports: [NgClass],
  templateUrl: './toggle-button.html',
  styleUrl: './toggle-button.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleButton),
      multi: true
    }
  ]
})
export class ToggleButton implements ControlValueAccessor {
  public label: InputSignal<string> = input.required<string>();
  public ariaLabel: InputSignal<string> = input<string>('Toggle button');
  public disabled: InputSignal<boolean> = input<boolean>(false);
  public valueChange: OutputEmitterRef<boolean> = output<boolean>();

  protected isDisabled: WritableSignal<boolean> = signal<boolean>(false);

  public value: boolean = false;

  private onChange: (value: boolean) => void = () => { };
  private onTouched: () => void = () => { };

  constructor() {
    effect(() => {
      const inputDisabled = this.disabled();
      this.isDisabled.set(inputDisabled);
    });
  }

  toggle(): void {
    if (this.isDisabled()) return;

    this.value = !this.value;
    this.onChange(this.value);
    this.onTouched();
    this.valueChange.emit(this.value);
  }

  writeValue(value: boolean): void {
    this.value = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  public get disabledState(): boolean {
    return this.isDisabled();
  }
}
