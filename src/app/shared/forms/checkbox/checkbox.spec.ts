import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  let component: Checkbox;
  let fixture: ComponentFixture<Checkbox>;
  let labelElement: DebugElement;
  let inputElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Checkbox]
    }).compileComponents();

    fixture = TestBed.createComponent(Checkbox);
    component = fixture.componentInstance;
    fixture.detectChanges();
    labelElement = fixture.debugElement.query(By.css('label'));
    inputElement = fixture.debugElement.query(By.css('input[type="checkbox"]'));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should be unchecked by default', () => {
      expect(inputElement.nativeElement.checked).toBe(false);
    });

    it('should not be disabled by default', () => {
      expect(inputElement.nativeElement.disabled).toBe(false);
    });

    it('should have a generated id by default', () => {
      expect(component.id()).toBeTruthy();
      expect(typeof component.id()).toBe('string');
    });

    it('should link label to input via for attribute', () => {
      const forAttr = labelElement.nativeElement.getAttribute('for');
      const inputId = inputElement.nativeElement.id;
      expect(forAttr).toBe(inputId);
    });

    it('should not display label text when label is not provided', () => {
      const labelTextElement = fixture.debugElement.query(By.css('span.text-sm'));
      expect(labelTextElement).toBeFalsy();
    });

    it('should not show checkmark when unchecked', () => {
      const svg = fixture.debugElement.query(By.css('svg'));
      expect(svg).toBeFalsy();
    });
  });

  describe('Toggle Functionality', () => {
    it('should toggle checked state when clicked', () => {
      expect(inputElement.nativeElement.checked).toBe(false);

      inputElement.nativeElement.click();
      fixture.detectChanges();

      expect(inputElement.nativeElement.checked).toBe(true);

      inputElement.nativeElement.click();
      fixture.detectChanges();

      expect(inputElement.nativeElement.checked).toBe(false);
    });

    it('should emit valueChecked event when toggled to true', () => {
      jest.spyOn(component.valueChecked, 'emit');

      inputElement.nativeElement.click();
      fixture.detectChanges();

      expect(component.valueChecked.emit).toHaveBeenCalledWith(true);
    });

    it('should emit valueChecked event when toggled to false', () => {
      component.writeValue(true);
      fixture.detectChanges();

      jest.spyOn(component.valueChecked, 'emit');

      inputElement.nativeElement.click();
      fixture.detectChanges();

      expect(component.valueChecked.emit).toHaveBeenCalledWith(false);
    });

    it('should show checkmark SVG when checked', () => {
      inputElement.nativeElement.click();
      fixture.detectChanges();

      const svg = fixture.debugElement.query(By.css('svg'));
      expect(svg).toBeTruthy();
    });

    it('should hide checkmark SVG when unchecked', () => {
      inputElement.nativeElement.click();
      fixture.detectChanges();

      inputElement.nativeElement.click();
      fixture.detectChanges();

      const svg = fixture.debugElement.query(By.css('svg'));
      expect(svg).toBeFalsy();
    });

    it('should apply checked CSS classes when checked', () => {
      inputElement.nativeElement.click();
      fixture.detectChanges();

      const checkboxDiv = fixture.debugElement.query(By.css('div.flex.items-center.justify-center'));
      expect(checkboxDiv.nativeElement.classList.contains('bg-brand-600')).toBe(true);
      expect(checkboxDiv.nativeElement.classList.contains('border-brand-600')).toBe(true);
    });
  });

  describe('Disabled State', () => {
    beforeEach(() => {
      component.setDisabledState(true);
      fixture.detectChanges();
    });

    it('should disable the input', () => {
      expect(inputElement.nativeElement.disabled).toBe(true);
    });

    it('should apply opacity class to label', () => {
      expect(labelElement.nativeElement.classList.contains('opacity-50')).toBe(true);
    });

    it('should not toggle when clicked while disabled', () => {
      const initialChecked = inputElement.nativeElement.checked;

      inputElement.nativeElement.click();
      fixture.detectChanges();

      expect(inputElement.nativeElement.checked).toBe(initialChecked);
    });

    it('should not emit valueChecked when clicked while disabled', () => {
      jest.spyOn(component.valueChecked, 'emit');

      inputElement.nativeElement.click();
      fixture.detectChanges();

      expect(component.valueChecked.emit).not.toHaveBeenCalled();
    });
  });

  describe('Label', () => {
    it('should display label when provided', () => {
      fixture.componentRef.setInput('label', 'Accept terms');
      fixture.detectChanges();

      const labelTextElement = fixture.debugElement.query(By.css('span.text-sm'));
      expect(labelTextElement).toBeTruthy();
      expect(labelTextElement.nativeElement.textContent.trim()).toBe('Accept terms');
    });

    it('should update label when changed', () => {
      fixture.componentRef.setInput('label', 'First Label');
      fixture.detectChanges();

      let labelTextElement = fixture.debugElement.query(By.css('span.text-sm'));
      expect(labelTextElement.nativeElement.textContent.trim()).toBe('First Label');

      fixture.componentRef.setInput('label', 'Second Label');
      fixture.detectChanges();

      labelTextElement = fixture.debugElement.query(By.css('span.text-sm'));
      expect(labelTextElement.nativeElement.textContent.trim()).toBe('Second Label');
    });

    it('should not display label span when label is undefined', () => {
      fixture.componentRef.setInput('label', undefined);
      fixture.detectChanges();

      const labelTextElement = fixture.debugElement.query(By.css('span.text-sm'));
      expect(labelTextElement).toBeFalsy();
    });
  });

  describe('Custom ID', () => {
    it('should use custom id when provided', () => {
      fixture.componentRef.setInput('id', 'custom-checkbox-id');
      fixture.detectChanges();

      expect(inputElement.nativeElement.id).toBe('custom-checkbox-id');
      expect(labelElement.nativeElement.getAttribute('for')).toBe('custom-checkbox-id');
    });
  });

  describe('ControlValueAccessor', () => {
    it('should write value true', () => {
      component.writeValue(true);
      fixture.detectChanges();

      expect(inputElement.nativeElement.checked).toBe(true);
    });

    it('should write value false', () => {
      component.writeValue(true);
      fixture.detectChanges();

      component.writeValue(false);
      fixture.detectChanges();

      expect(inputElement.nativeElement.checked).toBe(false);
    });

    it('should handle null value as false', () => {
      component.writeValue(null);
      fixture.detectChanges();

      expect(inputElement.nativeElement.checked).toBe(false);
    });

    it('should emit valueChecked when writeValue is called', () => {
      jest.spyOn(component.valueChecked, 'emit');

      component.writeValue(true);

      expect(component.valueChecked.emit).toHaveBeenCalledWith(true);
    });

    it('should call onChange when toggled', () => {
      const onChangeSpy = jest.fn();
      component.registerOnChange(onChangeSpy);

      inputElement.nativeElement.click();
      fixture.detectChanges();

      expect(onChangeSpy).toHaveBeenCalledWith(true);
    });

    it('should call onTouched when toggled', () => {
      const onTouchedSpy = jest.fn();
      component.registerOnTouched(onTouchedSpy);

      inputElement.nativeElement.click();
      fixture.detectChanges();

      expect(onTouchedSpy).toHaveBeenCalled();
    });

    it('should set disabled state', () => {
      component.setDisabledState(true);
      fixture.detectChanges();

      expect(inputElement.nativeElement.disabled).toBe(true);
    });

    it('should unset disabled state', () => {
      component.setDisabledState(true);
      fixture.detectChanges();

      component.setDisabledState(false);
      fixture.detectChanges();

      expect(inputElement.nativeElement.disabled).toBe(false);
    });

    it('should register onChange callback', () => {
      const fn = jest.fn();
      component.registerOnChange(fn);

      inputElement.nativeElement.click();
      fixture.detectChanges();

      expect(fn).toHaveBeenCalled();
    });

    it('should register onTouched callback', () => {
      const fn = jest.fn();
      component.registerOnTouched(fn);

      inputElement.nativeElement.click();
      fixture.detectChanges();

      expect(fn).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have hidden input for screen readers', () => {
      expect(inputElement.nativeElement.classList.contains('sr-only')).toBe(true);
    });

    it('should have label element wrapping the checkbox', () => {
      expect(labelElement).toBeTruthy();
    });

    it('should have proper checkbox type', () => {
      expect(inputElement.nativeElement.type).toBe('checkbox');
    });

    it('should be keyboard accessible via label click', () => {
      labelElement.nativeElement.click();
      fixture.detectChanges();

      expect(inputElement.nativeElement.checked).toBe(true);
    });

    it('should have cursor-pointer class on label', () => {
      expect(labelElement.nativeElement.classList.contains('cursor-pointer')).toBe(true);
    });

    it('should have select-none class to prevent text selection', () => {
      expect(labelElement.nativeElement.classList.contains('select-none')).toBe(true);
    });
  });

  describe('Visual Checkbox Box', () => {
    it('should have the visual checkbox div', () => {
      const checkboxDiv = fixture.debugElement.query(By.css('div.flex.items-center.justify-center'));
      expect(checkboxDiv).toBeTruthy();
    });

    it('should have correct size classes', () => {
      const checkboxDiv = fixture.debugElement.query(By.css('div.flex.items-center.justify-center'));
      expect(checkboxDiv.nativeElement.classList.contains('w-5')).toBe(true);
      expect(checkboxDiv.nativeElement.classList.contains('h-5')).toBe(true);
    });

    it('should have border classes', () => {
      const checkboxDiv = fixture.debugElement.query(By.css('div.flex.items-center.justify-center'));
      expect(checkboxDiv.nativeElement.classList.contains('border-2')).toBe(true);
    });

    it('should have transition class', () => {
      const checkboxDiv = fixture.debugElement.query(By.css('div.flex.items-center.justify-center'));
      expect(checkboxDiv.nativeElement.classList.contains('transition-colors')).toBe(true);
    });
  });

  describe('Checkmark SVG', () => {
    beforeEach(() => {
      inputElement.nativeElement.click();
      fixture.detectChanges();
    });

    it('should have correct viewBox', () => {
      const svg = fixture.debugElement.query(By.css('svg'));
      expect(svg.nativeElement.getAttribute('viewBox')).toBe('0 0 24 24');
    });

    it('should have stroke but no fill', () => {
      const svg = fixture.debugElement.query(By.css('svg'));
      expect(svg.nativeElement.getAttribute('fill')).toBe('none');
      expect(svg.nativeElement.getAttribute('stroke')).toBe('currentColor');
    });

    it('should have polyline for checkmark', () => {
      const polyline = fixture.debugElement.query(By.css('svg polyline'));
      expect(polyline).toBeTruthy();
      expect(polyline.nativeElement.getAttribute('points')).toBe('20 6 9 17 4 12');
    });
  });
});
