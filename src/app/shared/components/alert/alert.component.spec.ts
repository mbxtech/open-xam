import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';

import {AlertComponent} from './alert.component';

describe('AlertComponent', () => {
  let component: AlertComponent;
  let fixture: ComponentFixture<AlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should not render initially', () => {
    fixture.detectChanges();
    const alertEl = fixture.debugElement.query(By.css('.alert'));
    expect(alertEl).toBeNull();
  });

  it('should render when show is true and hide after close click', () => {
    fixture.componentRef.setInput('message', 'Saved!');
    fixture.componentRef.setInput('type', 'success');
    fixture.componentRef.setInput('show', true);
    fixture.detectChanges();

    let alertEl = fixture.debugElement.query(By.css('.alert'));
    expect(alertEl).toBeTruthy();
    expect(alertEl.nativeElement.textContent).toContain('Saved!');

    const closeBtn = fixture.debugElement.query(By.css('button[aria-label="Close"]'));
    closeBtn.triggerEventHandler('click', new Event('click'));
    fixture.detectChanges();

    expect(component.shouldShow).toBeFalsy();
    alertEl = fixture.debugElement.query(By.css('.alert'));
    expect(alertEl).toBeNull();
  });

  it('should accept and apply different types', () => {
    const types: ('success' | 'danger' | 'light' | 'primary' | 'secondary' | 'info' | 'dark')[] =
      ['success', 'danger', 'light', 'primary', 'secondary', 'info', 'dark'];

    fixture.componentRef.setInput('show', true);

    types.forEach(type => {
      fixture.componentRef.setInput('type', type);
      fixture.detectChanges();
      const alertEl = fixture.debugElement.query(By.css('.alert'));
      expect(alertEl).toBeTruthy();
      expect(component.type()).toBe(type);
    });
  });

  it('should update message when message input changes', () => {
    fixture.componentRef.setInput('message', 'Initial Message');
    fixture.componentRef.setInput('type', 'success');
    fixture.componentRef.setInput('show', true);
    fixture.detectChanges();
    
    let alertEl = fixture.debugElement.query(By.css('.alert'));
    expect(alertEl.nativeElement.textContent).toContain('Initial Message');

    fixture.componentRef.setInput('message', 'Updated Message');
    fixture.detectChanges();
    
    alertEl = fixture.debugElement.query(By.css('.alert'));
    expect(alertEl.nativeElement.textContent).toContain('Updated Message');
  });
});
