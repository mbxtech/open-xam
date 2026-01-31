import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { BasicInputComponent } from './basic-input.component';

describe('BasicInputComponent', () => {
  let component: BasicInputComponent;
  let fixture: ComponentFixture<BasicInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  const getInputElement = (): HTMLInputElement | HTMLTextAreaElement => 
    fixture.debugElement.query(By.css('input, textarea')).nativeElement;

  it('should render label and required asterisk when control has required validator', () => {
    const control = new FormControl('', { validators: [Validators.required] });
    component.label = 'Vorname';
    component.id = 'firstName';
    component.formControl = control;
    fixture.detectChanges();

    const labelEl: HTMLLabelElement | null = fixture.nativeElement.querySelector('label');
    expect(labelEl).not.toBeNull();
    expect(labelEl!.textContent).toContain('Vorname');
    expect(labelEl!.textContent).toContain('*');
  });

  it('should bind id, placeholder and type attributes', () => {
    component.id = 'age';
    component.placeholder = 'Bitte eingeben';
    component.type = 'number';
    fixture.detectChanges();

    const input = getInputElement() as HTMLInputElement;
    expect(input.getAttribute('id')).toBe('age');
    expect(input.getAttribute('placeholder')).toBe('Bitte eingeben');
    expect(input.getAttribute('type')).toBe('number');
  });

  it('should render textarea when type is textarea', () => {
    component.id = 'desc';
    component.type = 'textarea';
    component.rows = 5;
    fixture.detectChanges();

    const textarea = fixture.debugElement.query(By.css('textarea')).nativeElement as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    expect(textarea.getAttribute('id')).toBe('desc');
    expect(textarea.rows).toBe(5);
  });

  it('should reflect value written by writeValue into the input', () => {
    component.writeValue('Hello');
    fixture.detectChanges();

    const input = getInputElement();
    expect(input.value).toBe('Hello');
  });

  it('should call registered onChange when user types', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);
    fixture.detectChanges();

    const input = getInputElement();
    input.value = 'abc';
    input.dispatchEvent(new Event('input'));

    expect(onChange).toHaveBeenCalledWith('abc');
  });

  it('should call registered onTouched on blur', () => {
    const onTouched = jest.fn();
    component.registerOnTouched(onTouched);
    fixture.detectChanges();

    const input = getInputElement();
    input.dispatchEvent(new Event('blur'));

    expect(onTouched).toHaveBeenCalled();
  });

  it('should toggle disabled attribute via setDisabledState', () => {
    component.setDisabledState!(true);
    fixture.detectChanges();
    expect(component.disabled).toBe(true);
    expect(getInputElement().hasAttribute('disabled')).toBe(true);

    component.setDisabledState!(false);
    fixture.detectChanges();
    expect(component.disabled).toBe(false);
    expect(getInputElement().hasAttribute('disabled')).toBe(false);
  });

  it('should show errors and add invalid-border class when control has errors and is touched/dirty', () => {
    const control = new FormControl('');
    component.formControl = control;
    fixture.detectChanges();

    // set an error and mark as touched
    control.setErrors({ required: true });
    control.markAsTouched();
    fixture.detectChanges();

    // trigger handleErrors via blur
    component.registerOnTouched(jest.fn());
    const input = getInputElement();
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    // invalid-feedback should be shown and input should have class
    const feedback = fixture.nativeElement.querySelector('.invalid-feedback');
    expect(feedback).not.toBeNull();
    // Template renders the error key
    expect(feedback.textContent).toContain('required');
    expect(input.classList.contains('invalid-border')).toBe(true);
  });

  it('should remove invalid-border class when errors are cleared', () => {
    const control = new FormControl('');
    component.formControl = control;
    fixture.detectChanges();

    // introduce error and add class
    control.setErrors({ required: true });
    control.markAsDirty();
    const input = getInputElement();
    input.dispatchEvent(new Event('input')); // triggers handleErrors
    fixture.detectChanges();
    expect(input.classList.contains('invalid-border')).toBe(true);

    // clear errors and trigger handleErrors again
    control.setErrors(null);
    control.updateValueAndValidity();
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input.classList.contains('invalid-border')).toBe(false);
    // no invalid-feedback should be rendered
    const feedback = fixture.nativeElement.querySelector('.invalid-feedback');
    expect(feedback).toBeNull();
  });
});
