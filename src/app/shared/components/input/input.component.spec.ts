import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { InputComponent } from './input.component';

@Component({
  template: `
    <ox-input 
      [(value)]="val" 
      [type]="type" 
      [placeholder]="placeholder" 
      [disabled]="disabled" 
      [class]="customClass"
      [min]="min"
      [max]="max"
      [step]="step"
      [ariaLabel]="ariaLabel"
      [ariaInvalid]="ariaInvalid">
    </ox-input>`,
  imports: [InputComponent, FormsModule]
})
class TestHostComponent {
  val: string | number = 'initial';
  type = 'text';
  placeholder = 'Enter text';
  disabled = false;
  customClass = 'my-custom-input';
  min?: number;
  max?: number;
  step?: number;
  ariaLabel?: string;
  ariaInvalid?: boolean;
}

describe('InputComponent', () => {
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent, TestHostComponent, FormsModule]
    })
    .compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
  });

  it('should support two-way binding', async () => {
    const inputEl = hostFixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    
    // Initial value
    expect(inputEl.value).toBe('initial');

    // Update from component
    hostComponent.val = 'updated';
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    expect(inputEl.value).toBe('updated');

    // Update from input
    inputEl.value = 'new value';
    inputEl.dispatchEvent(new Event('input'));
    hostFixture.detectChanges();
    expect(hostComponent.val).toBe('new value');
  });

  it('should apply type and placeholder', () => {
    hostComponent.type = 'password';
    hostComponent.placeholder = 'Secret';
    hostFixture.detectChanges();
    const inputEl = hostFixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    expect(inputEl.type).toBe('password');
    expect(inputEl.placeholder).toBe('Secret');
  });

  it('should toggle disabled state', async () => {
    const inputEl = hostFixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    
    expect(inputEl.disabled).toBe(false);

    hostComponent.disabled = true;
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    expect(inputEl.disabled).toBe(true);

    hostComponent.disabled = false;
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    expect(inputEl.disabled).toBe(false);
  });

  it('should apply numeric constraints', () => {
    hostComponent.min = 0;
    hostComponent.max = 100;
    hostComponent.step = 5;
    hostFixture.detectChanges();

    const inputEl = hostFixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    expect(inputEl.getAttribute('min')).toBe('0');
    expect(inputEl.getAttribute('max')).toBe('100');
    expect(inputEl.getAttribute('step')).toBe('5');
  });

  it('should apply aria attributes', () => {
    hostComponent.ariaLabel = 'Test Label';
    hostComponent.ariaInvalid = true;
    hostFixture.detectChanges();

    const inputEl = hostFixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    expect(inputEl.getAttribute('aria-label')).toBe('Test Label');
    expect(inputEl.getAttribute('aria-invalid')).toBe('true');
  });
});
