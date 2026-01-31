import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {Component, input} from '@angular/core';
import {CollapseCardComponent} from './collapse-card.component';

@Component({
  template: `
    <ox-collapse-card [title]="title()" [subtitle]="subtitle()" [class]="customClass">
      <div class="projected-content">Content</div>
    </ox-collapse-card>
  `,
  imports: [CollapseCardComponent]
})
class TestHostComponent {
  title = input('Test Title');
  subtitle = input('Test Title');
  customClass = 'my-custom-class';
}

describe('CollapseCardComponent', () => {
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollapseCardComponent, TestHostComponent]
    })
    .compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('should create', () => {
    expect(hostFixture.componentInstance).toBeTruthy();
  });

  it('should toggle collapsed state and body visibility', () => {
    const cardComponent = hostFixture.debugElement.query(By.directive(CollapseCardComponent)).componentInstance as CollapseCardComponent;
    const body = hostFixture.debugElement.query(By.css('.card-body'));
    
    expect(cardComponent.collapsed).toBeTruthy();
    expect((body.nativeElement as HTMLElement).style.display).toBe('none');

    const toggleBtn = hostFixture.debugElement.query(By.css('.card-header .btn'));
    toggleBtn.triggerEventHandler('click', new Event('click'));
    hostFixture.detectChanges();

    expect(cardComponent.collapsed).toBeFalsy();
    expect((body.nativeElement as HTMLElement).style.display).toBe('block');
  });

  it('should render title and optional subtitle', () => {
    hostFixture.componentRef.setInput('title', 'Main Title');
    hostFixture.componentRef.setInput('subtitle', 'Sub');
    hostFixture.detectChanges();

    const title = hostFixture.debugElement.query(By.css('.card-title')).nativeElement as HTMLElement;
    expect(title.textContent).toContain('Main Title');
    const subtitle = hostFixture.debugElement.query(By.css('.card-subtitle')).nativeElement as HTMLElement;
    expect(subtitle.textContent).toContain('Sub');
  });

  it('should not render subtitle if it is empty', () => {
    hostFixture.componentRef.setInput('subtitle', '');
    hostFixture.detectChanges();

    const subtitle = hostFixture.debugElement.query(By.css('.card-subtitle'));
    expect(subtitle).toBeNull();
  });

  it('should project content into card-body', () => {
    const projectedContent = hostFixture.debugElement.query(By.css('.projected-content'));
    expect(projectedContent).toBeTruthy();
    expect(projectedContent.nativeElement.textContent).toBe('Content');
  });

  it('should apply custom classes to the host div', () => {
    const cardContainer = hostFixture.debugElement.query(By.css('.card'));
    expect(cardContainer.nativeElement.classList).toContain('my-custom-class');
  });
});
