import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {of} from 'rxjs';
import {StatisticsHeaderComponent} from './statistics-header.component';
import {ExamService} from '../../../../../../../shared/service/exam.service';
import {IExamOverallStatistics} from '../../../../../../../shared/model/interfaces/exam-overall-statistics.interface';

describe('StatisticsHeader', () => {
  let component: StatisticsHeaderComponent;
  let fixture: ComponentFixture<StatisticsHeaderComponent>;
  let examServiceMock: jest.Mocked<Partial<ExamService>>;

  const mockStatistics: IExamOverallStatistics = {
    examCount: 10,
    activeCount: 5,
    draftCount: 3,
    archiveCount: 2,
    inactiveCount: 0,
    averageQuestionCount: 25,
    averageSucceedingScore: 70
  };

  beforeEach(async () => {
    examServiceMock = {
      getStatistics: jest.fn().mockReturnValue(of(mockStatistics))
    } as any;

    await TestBed.configureTestingModule({
      imports: [StatisticsHeaderComponent],
      providers: [
        {provide: ExamService, useValue: examServiceMock}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatisticsHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getStatistics on init', () => {
    expect(examServiceMock.getStatistics).toHaveBeenCalled();
  });

  it('should update statisticsHeader signal when service returns data', () => {
    const stats = component.statisticsHeader();
    expect(stats.examCount).toBe(10);
    expect(stats.activeCount).toBe(5);
    expect(stats.draftCount).toBe(3);
    expect(stats.archiveCount).toBe(2);
  });

  it('should render statistics values in the template', () => {
    const spans = fixture.debugElement.queryAll(By.css('span.text-heading-1'));
    expect(spans.length).toBeGreaterThanOrEqual(4);
    expect(spans[0].nativeElement.textContent.trim()).toBe('10');
    expect(spans[1].nativeElement.textContent.trim()).toBe('5');
    expect(spans[2].nativeElement.textContent.trim()).toBe('3');
    expect(spans[3].nativeElement.textContent.trim()).toBe('2');
  });

  it('should handle null response from service', async () => {
    jest.mocked(examServiceMock.getStatistics!).mockReturnValue(of(null));

    const newFixture = TestBed.createComponent(StatisticsHeaderComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    const stats = newComponent.statisticsHeader();
    expect(stats.examCount).toBe(0);
  });
});
