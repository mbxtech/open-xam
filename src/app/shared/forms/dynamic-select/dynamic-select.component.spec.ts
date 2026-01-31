import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { DynamicSelectComponent, SelectOption } from './dynamic-select.component';

describe('DynamicSelectComponent', () => {
  let component: DynamicSelectComponent;
  let fixture: ComponentFixture<DynamicSelectComponent>;

  const getSelect = (): HTMLSelectElement => fixture.debugElement.query(By.css('select')).nativeElement as HTMLSelectElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicSelectComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render label and required asterisk when provided', () => {
    component.label = 'Test Label';
    component.required = true;
    component.formControlName = 'test-select';
    fixture.detectChanges();

    const labelEl: HTMLLabelElement | null = fixture.nativeElement.querySelector('label');
    expect(labelEl).not.toBeNull();
    expect(labelEl!.textContent).toContain('Test Label');
    expect(labelEl!.textContent).toContain('*');
  });

  it('should render placeholder as the first option', () => {
    component.placeholder = 'Bitte wählen';
    fixture.detectChanges();

    const select = getSelect();
    const options = Array.from(select.querySelectorAll('option')) as HTMLOptionElement[];
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].textContent).toBe('Bitte wählen');
    // The placeholder option should be disabled and selected in the template
    expect(options[0].disabled).toBe(true);
  });

  it('should render provided options', () => {
    const options: SelectOption[] = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' }
    ];
    component.options = options;
    fixture.detectChanges();

    const select = getSelect();
    const optionEls = Array.from(select.querySelectorAll('option')) as HTMLOptionElement[];
    // +1 for placeholder
    expect(optionEls.length).toBe(3);
    expect(optionEls[1].text).toBe('One');
    expect(optionEls[1].value).toBe('1');
    expect(optionEls[2].text).toBe('Two');
    expect(optionEls[2].value).toBe('2');
  });

  it('should call onChange when value changes via form control', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);

    component.selectControl.setValue(2);

    expect(onChange).toHaveBeenCalledWith(2);
    expect(component.value).toBe(2);
  });

  it('should update internal control when writeValue is called', () => {
    component.writeValue(3);
    expect(component.selectControl.value).toBe(3);
    expect(component.value).toBe(3);
  });

  it('should set disabled state and reflect it in the DOM', () => {
    component.setDisabledState(true);
    fixture.detectChanges();

    expect(component.disabled).toBe(true);
    const select = getSelect();
    expect(select.hasAttribute('disabled')).toBe(true);

    component.setDisabledState(false);
    fixture.detectChanges();

    expect(component.disabled).toBe(false);
    expect(select.hasAttribute('disabled')).toBe(false);
  });

  it('should set multiple attribute when multiple=true', () => {
    component.multiple = true;
    fixture.detectChanges();

    const select = getSelect();
    expect(select.hasAttribute('multiple')).toBe(true);
  });

  it('should call onTouched on blur', () => {
    const onTouched = jest.fn();
    component.registerOnTouched(onTouched);
    fixture.detectChanges();

    const select = getSelect();
    select.dispatchEvent(new Event('blur'));

    expect(onTouched).toHaveBeenCalled();
  });
});
