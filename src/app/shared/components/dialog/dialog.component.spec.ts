import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {Component} from '@angular/core';
import {DialogComponent} from './dialog.component';
import {DialogHeaderComponent} from './dialog-header.component';
import {DialogContentComponent} from './dialog-content.component';
import {DialogFooterComponent} from './dialog-footer.component';
import {provideAnimations} from "@angular/platform-browser/animations";

@Component({
  template: `
    <ox-dialog [isOpen]="isOpen" title="Base Title" submitLabel="Submit" cancelLabel="Cancel">
      <ox-dialog-header>Custom Header</ox-dialog-header>
      <ox-dialog-content>Custom Content</ox-dialog-content>
      <ox-dialog-footer><button class="custom-footer-btn">Footer Btn</button></ox-dialog-footer>
    </ox-dialog>
  `,
  imports: [DialogComponent, DialogHeaderComponent, DialogContentComponent, DialogFooterComponent]
})
class TestHostComponent {
  isOpen = false;
}

describe('DialogComponent', () => {
  let component: DialogComponent;
  let fixture: ComponentFixture<DialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogComponent, DialogHeaderComponent, DialogContentComponent, DialogFooterComponent],
      providers: [provideAnimations()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render dialog when isOpen is true and display title + buttons', () => {
    const ref = fixture.componentRef;
    ref.setInput('isOpen', true);
    ref.setInput('title', 'My Title');
    ref.setInput('submitLabel', 'Save');
    ref.setInput('cancelLabel', 'Cancel');
    fixture.detectChanges();

    const backdrop = fixture.debugElement.query(By.css('.fixed.inset-0'));
    expect(backdrop).toBeTruthy();
    expect(fixture.debugElement.query(By.css('h5')).nativeElement.textContent).toContain('My Title');
    
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(2);
    expect(buttons[0].nativeElement.textContent.trim()).toBe('Cancel');
    expect(buttons[1].nativeElement.textContent.trim()).toBe('Save');
  });

  it('should emit submitted and closed on submit click', () => {
    const submittedSpy = jest.fn();
    const closedSpy = jest.fn();

    component.submitted.subscribe(submittedSpy);
    component.closed.subscribe(closedSpy);

    const ref = fixture.componentRef;
    ref.setInput('isOpen', true);
    ref.setInput('submitLabel', 'Save');
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const submitBtn = buttons[1];
    submitBtn.nativeElement.click();
    fixture.detectChanges();

    expect(submittedSpy).toHaveBeenCalled();
    expect(closedSpy).toHaveBeenCalled();
  });

  it('should emit cancelled and closed on cancel click', () => {
    const cancelledSpy = jest.fn();
    const closedSpy = jest.fn();

    component.cancelled.subscribe(cancelledSpy);
    component.closed.subscribe(closedSpy);

    const ref = fixture.componentRef;
    ref.setInput('isOpen', true);
    ref.setInput('cancelLabel', 'Cancel');
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const cancelBtn = buttons[0];
    cancelBtn.nativeElement.click();
    fixture.detectChanges();

    expect(cancelledSpy).toHaveBeenCalled();
    expect(closedSpy).toHaveBeenCalled();
  });

  it('should close on escape key', () => {
    const ref = fixture.componentRef;
    ref.setInput('isOpen', true);
    fixture.detectChanges();

    const closedSpy = jest.fn();
    component.closed.subscribe(closedSpy);

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    fixture.detectChanges();

    expect(closedSpy).toHaveBeenCalled();
  });

  it('should close on backdrop click', () => {
    const ref = fixture.componentRef;
    ref.setInput('isOpen', true);
    fixture.detectChanges();

    const closedSpy = jest.fn();
    component.closed.subscribe(closedSpy);

    const backdrop = fixture.debugElement.query(By.css('.fixed.inset-0'));
    backdrop.triggerEventHandler('click', new MouseEvent('click'));
    fixture.detectChanges();

    expect(closedSpy).toHaveBeenCalled();
  });

  it('should support content projection via sub-components', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.isOpen = true;
    hostFixture.detectChanges();

    const header = hostFixture.debugElement.query(By.directive(DialogHeaderComponent));
    const content = hostFixture.debugElement.query(By.directive(DialogContentComponent));
    const footer = hostFixture.debugElement.query(By.directive(DialogFooterComponent));

    expect(header.nativeElement.textContent).toContain('Custom Header');
    expect(content.nativeElement.textContent).toContain('Custom Content');
    expect(footer.nativeElement.textContent).toContain('Footer Btn');
    
    // Default title and buttons should not be present
    expect(hostFixture.debugElement.query(By.css('h5'))).toBeNull();
    const buttons = hostFixture.debugElement.queryAll(By.css('button'));
    // Only the one in our footer projection
    expect(buttons.length).toBe(1);
    expect(buttons[0].nativeElement.classList).toContain('custom-footer-btn');
  });
});
