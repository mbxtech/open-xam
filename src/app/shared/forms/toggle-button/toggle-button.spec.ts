import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ToggleButton} from './toggle-button';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import spyOn = jest.spyOn;

describe('ToggleButton', () => {
    let component: ToggleButton;
    let fixture: ComponentFixture<ToggleButton>;
    let buttonElement: DebugElement;


    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ToggleButton]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ToggleButton);
        fixture.componentRef.setInput('label', 'Toggle button');
        component = fixture.componentInstance;
        buttonElement = fixture.debugElement.query(By.css('button'));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Initial State', () => {
        it('should have value false by default', () => {
            expect(component.value).toBe(false);
        });

        it('should not be disabled by default', () => {
            expect(component.disabled()).toBe(false);
        });

        it('should have correct ARIA attributes', () => {
            const button = buttonElement.nativeElement;
            expect(button.getAttribute('role')).toBe('switch');
            expect(button.getAttribute('aria-checked')).toBe('false');
            expect(button.getAttribute('aria-label')).toBe('Toggle button');
        });

        it('should apply correct CSS classes when unchecked', () => {
            const button = buttonElement.nativeElement;
            expect(button.classList.contains('bg-gray-200')).toBe(true);
            expect(button.classList.contains('bg-blue-600')).toBe(false);
        });
    });

    describe('Toggle Functionality', () => {
        it('should toggle value when clicked', () => {
            expect(component.value).toBe(false);

            buttonElement.nativeElement.click();
            fixture.detectChanges();

            expect(component.value).toBe(true);

            buttonElement.nativeElement.click();
            fixture.detectChanges();

            expect(component.value).toBe(false);
        });

        it('should emit valueChange event when toggled', () => {
            spyOn(component.valueChange, 'emit');

            buttonElement.nativeElement.click();

            expect(component.valueChange.emit).toHaveBeenCalledWith(true);
        });

        it('should update CSS classes when toggled', () => {
            buttonElement.nativeElement.click();
            fixture.detectChanges();

            const button = buttonElement.nativeElement;
            expect(button.classList.contains('bg-blue-600')).toBe(true);
            expect(button.classList.contains('bg-gray-200')).toBe(false);
        });

        it('should update ARIA checked attribute when toggled', () => {
            buttonElement.nativeElement.click();
            fixture.detectChanges();

            expect(buttonElement.nativeElement.getAttribute('aria-checked')).toBe('true');
        });

        it('should translate toggle switch when checked', () => {
            const toggleSwitch = fixture.debugElement.query(By.css('span.inline-block'));

            expect(toggleSwitch.nativeElement.classList.contains('translate-x-1')).toBe(true);

            buttonElement.nativeElement.click();
            fixture.detectChanges();

            expect(toggleSwitch.nativeElement.classList.contains('translate-x-6')).toBe(true);
        });
    });

    describe('Disabled State', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('disabled', true);
            fixture.detectChanges();
        });

        it('should apply disabled attribute', () => {
            expect(buttonElement.nativeElement.disabled).toBe(true);
        });

        it('should apply disabled CSS classes', () => {
            const button = buttonElement.nativeElement;
            expect(button.classList.contains('bg-gray-300')).toBe(true);
            expect(button.classList.contains('cursor-not-allowed')).toBe(true);
            expect(button.classList.contains('opacity-50')).toBe(true);
        });

        it('should not toggle when clicked while disabled', () => {
            const initialValue = component.value;

            buttonElement.nativeElement.click();
            fixture.detectChanges();

            expect(component.value).toBe(initialValue);
        });

        it('should not emit valueChange when clicked while disabled', () => {
            spyOn(component.valueChange, 'emit');

            buttonElement.nativeElement.click();

            expect(component.valueChange.emit).not.toHaveBeenCalled();
        });
    });

    describe('Label', () => {
        it('should display label when provided', () => {
            fixture.componentRef.setInput('label', 'Enable notifications');
            fixture.detectChanges();

            const labelElement = fixture.debugElement.query(By.css('span.ml-3'));
            expect(labelElement).toBeTruthy();
            expect(labelElement.nativeElement.textContent.trim()).toBe('Enable notifications');
        });

        it('should update label when changed', () => {
            fixture.componentRef.setInput('label', 'First Label');
            fixture.detectChanges();

            let labelElement = fixture.debugElement.query(By.css('span.ml-3'));
            expect(labelElement.nativeElement.textContent.trim()).toBe('First Label');

            fixture.componentRef.setInput('label', 'Second Label');
            fixture.detectChanges();

            labelElement = fixture.debugElement.query(By.css('span.ml-3'));
            expect(labelElement.nativeElement.textContent.trim()).toBe('Second Label');
        });
    });

    describe('ControlValueAccessor', () => {
        it('should write value', () => {
            component.writeValue(true);
            fixture.detectChanges();

            expect(component.value).toBe(true);
        });

        it('should call onChange when toggled', () => {
            const onChangeSpy = jest.fn();
            component.registerOnChange(onChangeSpy);

            const privateOnChangeSpy = jest.spyOn(component as any, 'onChange');

            buttonElement.nativeElement.click();

            expect(privateOnChangeSpy).toHaveBeenCalledWith(true);
        });

        it('should call onTouched when toggled', () => {
            const onTouched = jest.fn();
            component.registerOnTouched(onTouched);

            const onTouchedSpy = jest.spyOn(component as any,'onTouched');

            buttonElement.nativeElement.click();

            expect(onTouchedSpy).toHaveBeenCalled();
        });

        it('should set disabled state', () => {
            component.setDisabledState(true);
            fixture.detectChanges();

            expect(component.disabledState).toBe(true);
            expect(buttonElement.nativeElement.disabled).toBe(true);
        });
    });

    describe('Custom ARIA Label', () => {
        it('should use custom aria-label when provided', () => {
            fixture.componentRef.setInput('ariaLabel', 'Custom toggle');
            fixture.detectChanges();

            expect(buttonElement.nativeElement.getAttribute('aria-label')).toBe('Custom toggle');
        });
    });

    describe('Accessibility', () => {
        it('should have correct role', () => {
            expect(buttonElement.nativeElement.getAttribute('role')).toBe('switch');
        });

        it('should be keyboard accessible', () => {
            buttonElement.nativeElement.focus();
            expect(document.activeElement).toBe(buttonElement.nativeElement);
        });

        it('should have focus ring classes', () => {
            const button = buttonElement.nativeElement;
            expect(button.classList.contains('focus:outline-none')).toBe(true);
            expect(button.classList.contains('focus:ring-2')).toBe(true);
            expect(button.classList.contains('focus:ring-blue-500')).toBe(true);
        });
    });
});
