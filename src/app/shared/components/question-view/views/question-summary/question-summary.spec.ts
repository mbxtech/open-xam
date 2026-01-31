import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionSummary } from './question-summary';

describe('QuestionSummary', () => {
  let component: QuestionSummary;
  let fixture: ComponentFixture<QuestionSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionSummary);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('result', true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Result Display', () => {
    it('should show success styling when result is true', () => {
      fixture.componentRef.setInput('result', true);
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('div');
      expect(container.classList.contains('bg-green-50')).toBe(true);
      expect(container.classList.contains('border-green-500')).toBe(true);
    });

    it('should show error styling when result is false', () => {
      fixture.componentRef.setInput('result', false);
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('div');
      expect(container.classList.contains('bg-red-50')).toBe(true);
      expect(container.classList.contains('border-red-500')).toBe(true);
    });
  });
});
