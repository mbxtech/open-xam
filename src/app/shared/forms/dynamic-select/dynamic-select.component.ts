import { Component, Input, OnInit, forwardRef } from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule} from '@angular/forms';
import {inputBaseClasses} from '../../style/input-base.css';

export type SelectOption = { value: any; label: string };


@Component({
  selector: 'ox-dynamic-select',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './dynamic-select.component.html',
  styleUrl: './dynamic-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamicSelectComponent),
      multi: true
    }
  ]
})
export class DynamicSelectComponent implements OnInit, ControlValueAccessor {
  @Input() set options(options: SelectOption[] | null) {
      if (options) {
          this._options = options;
      }
  };

  protected _options: SelectOption[] = [];

  @Input() label: string = '';
  @Input() placeholder: string = 'Select an option';
  @Input() formControlName: string = '';
  @Input() disabled: boolean = false;
  @Input() multiple: boolean = false;
  @Input() required: boolean = false;

  value: any;
  onChange: any = () => {};
  onTouched: any = () => {};
  selectControl = new FormControl();
  protected baseClasses = [...inputBaseClasses, 'py-2'];

  constructor() {}

  ngOnInit() {
    this.selectControl.valueChanges.subscribe(value => {
      this.value = value;
      this.onChange(value);
    });
  }


  writeValue(value: any): void {
    this.value = value;
    this.selectControl.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.selectControl.disable();
    } else {
      this.selectControl.enable();
    }
  }

  onBlur() {
    this.onTouched();
  }

  public get options(): SelectOption[] {
    return this._options;
  }
}
