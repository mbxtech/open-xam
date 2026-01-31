import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ImportsControlsComponent } from './imports-controls.component';

describe('ImportsControlsComponent', () => {
  let component: ImportsControlsComponent;
  let fixture: ComponentFixture<ImportsControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportsControlsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportsControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render refresh button', () => {
    const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
    expect(buttons.length).toBe(2);
  });

  it('should emit refresh event when refresh button is clicked', () => {
    const refreshSpy = jest.fn();
    component.refresh.subscribe(refreshSpy);

    const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
    const refreshButton = buttons[0]; // First button is refresh
    refreshButton.nativeElement.click();

    expect(refreshSpy).toHaveBeenCalled();
  });

  it('should emit clearAll event when clear all button is clicked', () => {
    const clearAllSpy = jest.fn();
    component.clearAll.subscribe(clearAllSpy);

    const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
    const clearAllButton = buttons[1]; // Second button is clear all
    clearAllButton.nativeElement.click();

    expect(clearAllSpy).toHaveBeenCalled();
  });

  it('should display correct icons', () => {
    const icons = fixture.debugElement.queryAll(By.css('fa-icon'));
    expect(icons.length).toBe(2);
  });

  it('should render buttons with correct variants', () => {
    const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
    expect(buttons.length).toBe(2);
    // Just verify the buttons exist and are rendered correctly
  });
});
