import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionSummaryError } from './question-summary-error';

describe('QuestionSummaryError', () => {
  let component: QuestionSummaryError;
  let fixture: ComponentFixture<QuestionSummaryError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionSummaryError]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionSummaryError);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
