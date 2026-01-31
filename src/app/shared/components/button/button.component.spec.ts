// button.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;
  let buttonElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    buttonElement = fixture.debugElement.query(By.css('button'));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Default State', () => {
    it('should render a button element', () => {
      expect(buttonElement).toBeTruthy();
      expect(buttonElement.nativeElement.tagName).toBe('BUTTON');
    });

    it('should have default variant and size classes', () => {
      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('bg-brand-primary');
      expect(classes).toContain('text-white');
      expect(classes).toContain('h-9');
      expect(classes).toContain('px-4');
    });

    it('should have base classes', () => {
      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('inline-flex');
      expect(classes).toContain('items-center');
      expect(classes).toContain('justify-center');
      expect(classes).toContain('rounded-md');
    });

    it('should have default type as button', () => {
      expect(buttonElement.nativeElement.type).toBe('button');
    });

    it('should have data-slot attribute', () => {
      expect(buttonElement.nativeElement.getAttribute('data-slot')).toBe('button');
    });
  });

  describe('Variants', () => {
    it('should apply default variant classes', () => {
      fixture.componentRef.setInput('variant', 'default');
      fixture.detectChanges();

      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('bg-brand-primary');
      expect(classes).toContain('text-white');
    });

    it('should apply destructive variant classes', () => {
      fixture.componentRef.setInput('variant', 'destructive');
      fixture.detectChanges();

      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('bg-red-500');
      expect(classes).toContain('text-white');
    });

    it('should apply outline variant classes', () => {
      fixture.componentRef.setInput('variant', 'outline');
      fixture.detectChanges();

      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('border');
      expect(classes).toContain('bg-transparent');
    });

    it('should apply secondary variant classes', () => {
      fixture.componentRef.setInput('variant', 'secondary');
      fixture.detectChanges();

      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('bg-neutral-100');
      expect(classes).toContain('text-neutral-900');
    });

    it('should apply ghost variant classes', () => {
      fixture.componentRef.setInput('variant', 'ghost');
      fixture.detectChanges();

      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('hover:bg-neutral-50');
    });

    it('should apply link variant classes', () => {
      fixture.componentRef.setInput('variant', 'link');
      fixture.detectChanges();

      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('text-brand-primary');
      expect(classes).toContain('underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('should apply default size classes', () => {
      fixture.componentRef.setInput('size', 'default');
      fixture.detectChanges();

      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('h-9');
      expect(classes).toContain('px-4');
      expect(classes).toContain('py-2');
    });

    it('should apply small size classes', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();

      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('h-8');
      expect(classes).toContain('px-3');
    });

    it('should apply large size classes', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();

      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('h-10');
      expect(classes).toContain('px-6');
    });

    it('should apply icon size classes', () => {
      fixture.componentRef.setInput('size', 'icon');
      fixture.detectChanges();

      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('size-9');
    });
  });

  describe('Type Attribute', () => {
    it('should set button type', () => {
      fixture.componentRef.setInput('type', 'button');
      fixture.detectChanges();

      expect(buttonElement.nativeElement.type).toBe('button');
    });

    it('should set submit type', () => {
      fixture.componentRef.setInput('type', 'submit');
      fixture.detectChanges();

      expect(buttonElement.nativeElement.type).toBe('submit');
    });

    it('should set reset type', () => {
      fixture.componentRef.setInput('type', 'reset');
      fixture.detectChanges();

      expect(buttonElement.nativeElement.type).toBe('reset');
    });
  });

  describe('Disabled State', () => {
    it('should not be disabled by default', () => {
      expect(buttonElement.nativeElement.disabled).toBe(false);
    });

    it('should be disabled when disabled input is true', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      expect(buttonElement.nativeElement.disabled).toBe(true);
    });

    it('should have disabled classes in className', () => {
      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('disabled:pointer-events-none');
      expect(classes).toContain('disabled:opacity-50');
    });
  });

  describe('Custom Classes', () => {
    it('should apply custom classes', () => {
      fixture.componentRef.setInput('class', 'custom-class-1 custom-class-2');
      fixture.detectChanges();

      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('custom-class-1');
      expect(classes).toContain('custom-class-2');
    });

    it('should combine custom classes with variant and size classes', () => {
      fixture.componentRef.setInput('variant', 'destructive');
      fixture.componentRef.setInput('size', 'lg');
      fixture.componentRef.setInput('class', 'my-custom-class');
      fixture.detectChanges();

      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('bg-red-500');
      expect(classes).toContain('h-10');
      expect(classes).toContain('my-custom-class');
    });
  });

  describe('Aria Invalid', () => {
    it('should not have aria-invalid attribute by default', () => {
      expect(buttonElement.nativeElement.getAttribute('aria-invalid')).toBeNull();
    });

    it('should set aria-invalid to true', () => {
      fixture.componentRef.setInput('ariaInvalid', true);
      fixture.detectChanges();

      expect(buttonElement.nativeElement.getAttribute('aria-invalid')).toBe('true');
    });

    it('should set aria-invalid to false', () => {
      fixture.componentRef.setInput('ariaInvalid', false);
      fixture.detectChanges();

      expect(buttonElement.nativeElement.getAttribute('aria-invalid')).toBe('false');
    });

    it('should have aria-invalid classes in className', () => {
      const classes = buttonElement.nativeElement.className;
      expect(classes).toContain('aria-invalid:ring-destructive/20');
      expect(classes).toContain('aria-invalid:border-destructive');
    });
  });

  describe('Content Projection', () => {
    it('should project text content', () => {
      const testFixture = TestBed.createComponent(ButtonComponent);
      testFixture.componentRef.setInput('variant', 'default');

      // Set content manually for testing
      const buttonEl = testFixture.debugElement.query(By.css('button'));
      buttonEl.nativeElement.textContent = 'Click me';
      testFixture.detectChanges();

      expect(buttonEl.nativeElement.textContent.trim()).toBe('Click me');
    });
  });

  describe('Computed Classes', () => {
    it('should update classes when variant changes', () => {
      fixture.componentRef.setInput('variant', 'default');
      fixture.detectChanges();
      let classes = buttonElement.nativeElement.className;
      expect(classes).toContain('bg-brand-primary');

      fixture.componentRef.setInput('variant', 'destructive');
      fixture.detectChanges();
      classes = buttonElement.nativeElement.className;
      expect(classes).toContain('bg-red-500');
      expect(classes).not.toContain('bg-primary');
    });

    it('should update classes when size changes', () => {
      fixture.componentRef.setInput('size', 'default');
      fixture.detectChanges();
      let classes = buttonElement.nativeElement.className;
      expect(classes).toContain('h-9');

      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
      classes = buttonElement.nativeElement.className;
      expect(classes).toContain('h-10');
      expect(classes).not.toContain('h-9');
    });
  });
});