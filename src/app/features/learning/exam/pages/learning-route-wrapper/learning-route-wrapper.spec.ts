import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearningRouteWrapper } from './learning-route-wrapper';

describe('LearningRouteWrapper', () => {
  let component: LearningRouteWrapper;
  let fixture: ComponentFixture<LearningRouteWrapper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearningRouteWrapper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LearningRouteWrapper);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
