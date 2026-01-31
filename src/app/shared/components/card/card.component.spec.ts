import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CardComponent } from './card.component';

@Component({
  template: `<ox-card [class]="customClass" cssClass="my-custom-class">Card Content</ox-card>`,
  imports: [CardComponent]
})
class TestHostComponent {
  customClass = 'my-custom-class';
}

describe('CardComponent', () => {
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent, TestHostComponent]
    })
    .compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
  });

  it('should render content', () => {
    const cardElement = hostFixture.debugElement.query(By.css('ox-card'));
    expect(cardElement.nativeElement.textContent).toContain('Card Content');
  });

  it('should have base classes', () => {
    const divElement = hostFixture.debugElement.query(By.css('div'));
    expect(divElement.nativeElement.classList).toContain('text-default-font');
    expect(divElement.nativeElement.classList).toContain('border-neutral-border');
    expect(divElement.nativeElement.classList).toContain('border');
  });

  it('should apply custom classes', () => {
    const divElement = hostFixture.debugElement.query(By.css('div'));
    expect(divElement.nativeElement.classList).toContain('my-custom-class');
  });
});
