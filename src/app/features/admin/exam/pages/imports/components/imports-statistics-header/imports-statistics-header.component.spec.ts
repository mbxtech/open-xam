import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ImportsStatisticsHeaderComponent } from './imports-statistics-header.component';
import { ICachedExamStatistics } from '../../../../../../../shared/model/interfaces/import/cached-exam-statistics.interface';
import { ComponentRef } from '@angular/core';

describe('ImportsStatisticsHeaderComponent', () => {
  let component: ImportsStatisticsHeaderComponent;
  let fixture: ComponentFixture<ImportsStatisticsHeaderComponent>;
  let componentRef: ComponentRef<ImportsStatisticsHeaderComponent>;

  const mockStatistics: ICachedExamStatistics = {
    total: 10,
    validationErrors: 7,
    generalErrors: 3,
    mostRecentDate: new Date('2024-01-15T10:30:00')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportsStatisticsHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportsStatisticsHeaderComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('statistics', mockStatistics);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display total failed count', () => {
    const totalElement = fixture.debugElement.queryAll(By.css('span.text-heading-1'))[0];
    expect(totalElement.nativeElement.textContent.trim()).toBe('10');
  });

  it('should display validation errors count', () => {
    const validationErrorsElement = fixture.debugElement.queryAll(By.css('span.text-heading-1'))[1];
    expect(validationErrorsElement.nativeElement.textContent.trim()).toBe('7');
  });

  it('should display general errors count', () => {
    const generalErrorsElement = fixture.debugElement.queryAll(By.css('span.text-heading-1'))[2];
    expect(generalErrorsElement.nativeElement.textContent.trim()).toBe('3');
  });

  it('should display most recent date when provided', () => {
    const dateElements = fixture.debugElement.queryAll(By.css('span.text-body'));
    expect(dateElements.length).toBeGreaterThan(0);
    expect(dateElements[0].nativeElement.textContent.trim()).not.toBe('-');
  });

  it('should display dash when most recent date is null', () => {
    const statsWithNullDate: ICachedExamStatistics = {
      ...mockStatistics,
      mostRecentDate: null
    };
    componentRef.setInput('statistics', statsWithNullDate);
    fixture.detectChanges();

    const dateElements = fixture.debugElement.queryAll(By.css('span.text-body'));
    expect(dateElements[0].nativeElement.textContent.trim()).toBe('-');
  });

  it('should render four statistic cards', () => {
    const cards = fixture.debugElement.queryAll(By.css('ox-card'));
    expect(cards.length).toBe(4);
  });

  it('should update display when statistics input changes', () => {
    const newStatistics: ICachedExamStatistics = {
      total: 20,
      validationErrors: 15,
      generalErrors: 5,
      mostRecentDate: new Date('2024-02-20T14:00:00')
    };

    componentRef.setInput('statistics', newStatistics);
    fixture.detectChanges();

    const spans = fixture.debugElement.queryAll(By.css('span.text-heading-1'));
    expect(spans[0].nativeElement.textContent.trim()).toBe('20');
    expect(spans[1].nativeElement.textContent.trim()).toBe('15');
    expect(spans[2].nativeElement.textContent.trim()).toBe('5');
  });
});
