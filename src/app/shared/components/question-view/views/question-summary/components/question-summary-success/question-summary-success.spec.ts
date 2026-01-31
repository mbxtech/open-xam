import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionSummarySuccess } from './question-summary-success';

describe('QuestionSummarySuccess', () => {
  let component: QuestionSummarySuccess;
  let fixture: ComponentFixture<QuestionSummarySuccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionSummarySuccess]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionSummarySuccess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
