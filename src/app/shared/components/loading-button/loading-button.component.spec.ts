import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';

import {LoadingButtonComponent} from './loading-button.component';

describe('LoadingButtonComponent', () => {
  let component: LoadingButtonComponent;
  let fixture: ComponentFixture<LoadingButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadingButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show default label when not loading', () => {
    component.defaultLabel = 'Save';
    component.loading = false;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.textContent).toContain('Save');
    expect(fixture.debugElement.query(By.css('.animate-spin'))).toBeNull();
  });

  it('should show spinner and loading text when loading', () => {
    component.loadingText = 'Saving...';
    component.loading = true;
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.animate-spin'))).toBeTruthy();
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.textContent).toContain('Saving...');
  });

  it('should bind disabled and type and call click handler', () => {
    const clickSpy = jest.fn();
    component.type = 'submit';
    component.disabled = true;
    component.click = clickSpy;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.type).toBe('submit');
    expect(button.nativeElement.disabled).toBe(true);

    // enable and click
    component.disabled = false;
    fixture.detectChanges();
    button.triggerEventHandler('click', new MouseEvent('click'));
    expect(clickSpy).toHaveBeenCalled();
  });
});
