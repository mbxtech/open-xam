import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { ToggleGroup, ToggleOption } from './toggle-group';

describe('ToggleGroup', () => {
  let component: ToggleGroup;
  let fixture: ComponentFixture<ToggleGroup>;
  let groupElement: DebugElement;

  const testOptions: ToggleOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleGroup]
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleGroup);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', testOptions);
    fixture.detectChanges();
    groupElement = fixture.debugElement.query(By.css('[role="group"]'));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have empty selectedValue by default', () => {
      expect(component.selectedValue()).toBe('');
    });

    it('should not be disabled by default', () => {
      expect(component.disabled()).toBe(false);
    });

    it('should render all options', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons.length).toBe(3);
    });

    it('should display correct labels for options', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons[0].nativeElement.textContent.trim()).toBe('Option 1');
      expect(buttons[1].nativeElement.textContent.trim()).toBe('Option 2');
      expect(buttons[2].nativeElement.textContent.trim()).toBe('Option 3');
    });

    it('should have correct ARIA attributes on group', () => {
      expect(groupElement.nativeElement.getAttribute('role')).toBe('group');
      expect(groupElement.nativeElement.getAttribute('aria-label')).toBe('Toggle group');
    });

    it('should have aria-pressed false for all options when none selected', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons.forEach(button => {
        expect(button.nativeElement.getAttribute('aria-pressed')).toBe('false');
      });
    });
  });

  describe('Selection Functionality', () => {
    it('should select option when clicked', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));

      buttons[1].nativeElement.click();
      fixture.detectChanges();

      expect(component.selectedValue()).toBe('option2');
    });

    it('should update aria-pressed when option is selected', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));

      buttons[0].nativeElement.click();
      fixture.detectChanges();

      expect(buttons[0].nativeElement.getAttribute('aria-pressed')).toBe('true');
      expect(buttons[1].nativeElement.getAttribute('aria-pressed')).toBe('false');
      expect(buttons[2].nativeElement.getAttribute('aria-pressed')).toBe('false');
    });

    it('should emit valueChange event when option is selected', () => {
      jest.spyOn(component.valueChange, 'emit');
      const buttons = fixture.debugElement.queryAll(By.css('button'));

      buttons[2].nativeElement.click();
      fixture.detectChanges();

      expect(component.valueChange.emit).toHaveBeenCalledWith('option3');
    });

    it('should apply selected CSS classes to selected option', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));

      buttons[0].nativeElement.click();
      fixture.detectChanges();

      expect(buttons[0].nativeElement.classList.contains('bg-brand-primary')).toBe(true);
      expect(buttons[0].nativeElement.classList.contains('text-white')).toBe(true);
    });

    it('should remove selected CSS classes from previously selected option', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));

      buttons[0].nativeElement.click();
      fixture.detectChanges();

      buttons[1].nativeElement.click();
      fixture.detectChanges();

      expect(buttons[0].nativeElement.classList.contains('bg-brand-primary')).toBe(false);
      expect(buttons[1].nativeElement.classList.contains('bg-brand-primary')).toBe(true);
    });

    it('should allow re-selecting the same option', () => {
      jest.spyOn(component.valueChange, 'emit');
      const buttons = fixture.debugElement.queryAll(By.css('button'));

      buttons[0].nativeElement.click();
      fixture.detectChanges();

      buttons[0].nativeElement.click();
      fixture.detectChanges();

      expect(component.selectedValue()).toBe('option1');
      expect(component.valueChange.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('Disabled State', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
    });

    it('should disable all buttons when group is disabled', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons.forEach(button => {
        expect(button.nativeElement.disabled).toBe(true);
      });
    });

    it('should apply disabled CSS classes', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons.forEach(button => {
        expect(button.nativeElement.classList.contains('opacity-50')).toBe(true);
        expect(button.nativeElement.classList.contains('cursor-not-allowed')).toBe(true);
      });
    });

    it('should not change selection when clicked while disabled', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));

      buttons[0].nativeElement.click();
      fixture.detectChanges();

      expect(component.selectedValue()).toBe('');
    });

    it('should not emit valueChange when clicked while disabled', () => {
      jest.spyOn(component.valueChange, 'emit');
      const buttons = fixture.debugElement.queryAll(By.css('button'));

      buttons[0].nativeElement.click();

      expect(component.valueChange.emit).not.toHaveBeenCalled();
    });
  });

  describe('Individual Option Disabled', () => {
    beforeEach(() => {
      const optionsWithDisabled: ToggleOption[] = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2', disabled: true },
        { value: 'option3', label: 'Option 3' }
      ];
      fixture.componentRef.setInput('options', optionsWithDisabled);
      fixture.detectChanges();
    });

    it('should disable only the option with disabled flag', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));

      expect(buttons[0].nativeElement.disabled).toBe(false);
      expect(buttons[1].nativeElement.disabled).toBe(true);
      expect(buttons[2].nativeElement.disabled).toBe(false);
    });

    it('should not select disabled option when clicked', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));

      buttons[1].nativeElement.click();
      fixture.detectChanges();

      expect(component.selectedValue()).toBe('');
    });

    it('should allow selecting non-disabled options', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));

      buttons[0].nativeElement.click();
      fixture.detectChanges();

      expect(component.selectedValue()).toBe('option1');

      buttons[2].nativeElement.click();
      fixture.detectChanges();

      expect(component.selectedValue()).toBe('option3');
    });
  });

  describe('ControlValueAccessor', () => {
    it('should write value', () => {
      component.writeValue('option2');
      fixture.detectChanges();

      expect(component.selectedValue()).toBe('option2');
    });

    it('should update UI when value is written', () => {
      component.writeValue('option1');
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons[0].nativeElement.getAttribute('aria-pressed')).toBe('true');
    });

    it('should call onChange when option is selected', () => {
      const onChangeSpy = jest.fn();
      component.registerOnChange(onChangeSpy);

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons[0].nativeElement.click();
      fixture.detectChanges();

      expect(onChangeSpy).toHaveBeenCalledWith('option1');
    });

    it('should call onTouched when option is selected', () => {
      const onTouchedSpy = jest.fn();
      component.registerOnTouched(onTouchedSpy);

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons[0].nativeElement.click();
      fixture.detectChanges();

      expect(onTouchedSpy).toHaveBeenCalled();
    });

    it('should register onChange callback', () => {
      const fn = jest.fn();
      component.registerOnChange(fn);

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons[0].nativeElement.click();
      fixture.detectChanges();

      expect(fn).toHaveBeenCalled();
    });

    it('should register onTouched callback', () => {
      const fn = jest.fn();
      component.registerOnTouched(fn);

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons[0].nativeElement.click();
      fixture.detectChanges();

      expect(fn).toHaveBeenCalled();
    });
  });

  describe('Custom ARIA Label', () => {
    it('should use custom aria-label when provided', () => {
      fixture.componentRef.setInput('ariaLabel', 'View mode selector');
      fixture.detectChanges();

      expect(groupElement.nativeElement.getAttribute('aria-label')).toBe('View mode selector');
    });

    it('should have aria-label on each option button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));

      expect(buttons[0].nativeElement.getAttribute('aria-label')).toBe('Option 1');
      expect(buttons[1].nativeElement.getAttribute('aria-label')).toBe('Option 2');
      expect(buttons[2].nativeElement.getAttribute('aria-label')).toBe('Option 3');
    });
  });

  describe('Empty Options', () => {
    it('should render no buttons when options is empty', () => {
      fixture.componentRef.setInput('options', []);
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons.length).toBe(0);
    });
  });

  describe('Dynamic Options', () => {
    it('should update buttons when options change', () => {
      const newOptions: ToggleOption[] = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' }
      ];

      fixture.componentRef.setInput('options', newOptions);
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons.length).toBe(2);
      expect(buttons[0].nativeElement.textContent.trim()).toBe('A');
      expect(buttons[1].nativeElement.textContent.trim()).toBe('B');
    });

    it('should maintain selection if selected value still exists in new options', () => {
      component.writeValue('option1');
      fixture.detectChanges();

      const newOptions: ToggleOption[] = [
        { value: 'option1', label: 'First' },
        { value: 'option4', label: 'Fourth' }
      ];

      fixture.componentRef.setInput('options', newOptions);
      fixture.detectChanges();

      expect(component.selectedValue()).toBe('option1');
    });
  });

  describe('Accessibility', () => {
    it('should have correct role on container', () => {
      expect(groupElement.nativeElement.getAttribute('role')).toBe('group');
    });

    it('should have buttons with type="button"', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons.forEach(button => {
        expect(button.nativeElement.getAttribute('type')).toBe('button');
      });
    });

    it('should be keyboard accessible', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons[0].nativeElement.focus();
      expect(document.activeElement).toBe(buttons[0].nativeElement);
    });
  });
});
