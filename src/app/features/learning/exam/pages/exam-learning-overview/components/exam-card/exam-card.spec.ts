import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { ExamCard } from './exam-card';
import { IExam } from '../../../../../../../shared/model/interfaces/exam.interface';
import { QuestionType } from '../../../../../../../shared/model/question-type.enum';
import { StatusType } from '../../../../../../../shared/model/status-typ.enum';

describe('ExamCard', () => {
  let component: ExamCard;
  let fixture: ComponentFixture<ExamCard>;
  let routerMock: any;
  let activatedRouteMock: any;

  const mockExam: IExam = {
    description: "",
    id: 1,
    name: 'Test Exam',
    statusType: StatusType.ACTIVE,
    createdAt: new Date('2024-01-15'),
    pointsToSucceeded: 70,
    questions: [
      { id: 1, questionText: 'Q1', type: QuestionType.SINGLE_CHOICE, pointsTotal: 10, answers: [] },
      { id: 2, questionText: 'Q2', type: QuestionType.MULTIPLE_CHOICE, pointsTotal: 15, answers: [] },
      { id: 3, questionText: 'Q3', type: QuestionType.ASSIGNMENT, pointsTotal: 20, answers: [] }
    ],
    category: {
      id: 1, name: 'Mathematics',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };

  beforeEach(async () => {
    routerMock = {
      navigate: jest.fn().mockResolvedValue(true)
    };

    activatedRouteMock = {
      parent: {}
    };

    await TestBed.configureTestingModule({
      imports: [ExamCard],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExamCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('exam', mockExam);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Exam Display', () => {
    it('should display exam name', () => {
      const nameElement = fixture.debugElement.query(By.css('h3'));
      expect(nameElement.nativeElement.textContent.trim()).toBe('Test Exam');
    });

    it('should display exam status badge', () => {
      const badges = fixture.debugElement.queryAll(By.css('ox-badge'));
      expect(badges.length).toBeGreaterThanOrEqual(1);
      // Status badge exists
      expect(badges[0]).toBeTruthy();
    });

    it('should display category badge when category exists', () => {
      const badges = fixture.debugElement.queryAll(By.css('ox-badge'));
      expect(badges.length).toBe(2);
      expect(badges[1].nativeElement.textContent).toContain('Mathematics');
    });

    it('should not display category badge when category is null', () => {
      const examWithoutCategory = { ...mockExam, category: null };
      fixture.componentRef.setInput('exam', examWithoutCategory);
      fixture.detectChanges();

      const badges = fixture.debugElement.queryAll(By.css('ox-badge'));
      expect(badges.length).toBe(1);
    });

    it('should not display category badge when category name is empty', () => {
      const examWithEmptyCategory = { ...mockExam, category: { id: 1, name: '', examId: 1 } };
      fixture.componentRef.setInput('exam', examWithEmptyCategory);
      fixture.detectChanges();

      const badges = fixture.debugElement.queryAll(By.css('ox-badge'));
      expect(badges.length).toBe(1);
    });

    it('should display creation date', () => {
      const dateText = fixture.nativeElement.textContent;
      expect(dateText).toContain('15.01.2024');
    });

    it('should display number of questions', () => {
      const statsElements = fixture.debugElement.queryAll(By.css('.flex.items-center.justify-between'));
      const questionsElement = statsElements[0];
      expect(questionsElement.nativeElement.textContent).toContain('3');
    });

    it('should display points to succeed', () => {
      const statsElements = fixture.debugElement.queryAll(By.css('.flex.items-center.justify-between'));
      const pointsElement = statsElements[1];
      expect(pointsElement.nativeElement.textContent).toContain('70');
    });
  });

  describe('Buttons Display', () => {
    it('should render simulation mode button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
      expect(buttons.length).toBe(2);
      expect(buttons[0].nativeElement.textContent).toContain('Simulation mode');
    });

    it('should render real mode button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
      expect(buttons[1].nativeElement.textContent).toContain('Real mode');
    });

    it('should display flask icon on simulation button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
      const flaskIcon = buttons[0].query(By.css('fa-icon'));
      expect(flaskIcon).toBeTruthy();
    });

    it('should display play icon on real mode button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
      const playIcon = buttons[1].query(By.css('fa-icon'));
      expect(playIcon).toBeTruthy();
    });
  });

  describe('Navigation - Simulation Mode', () => {
    it('should navigate to simulation route when simulation button is clicked', async () => {
      const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
      buttons[0].nativeElement.click();
      fixture.detectChanges();

      await fixture.whenStable();

      expect(routerMock.navigate).toHaveBeenCalledWith(
        ['simulation', 1],
        { relativeTo: activatedRouteMock.parent }
      );
    });

    it('should use exam id in simulation navigation', async () => {
      const examWithDifferentId = { ...mockExam, id: 42 };
      fixture.componentRef.setInput('exam', examWithDifferentId);
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
      buttons[0].nativeElement.click();

      await fixture.whenStable();

      expect(routerMock.navigate).toHaveBeenCalledWith(
        ['simulation', 42],
        expect.any(Object)
      );
    });

    it('should call startSimulation method when simulation button is clicked', () => {
      jest.spyOn(component as any, 'startSimulation');

      const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
      buttons[0].nativeElement.click();

      expect((component as any).startSimulation).toHaveBeenCalled();
    });
  });

  describe('Navigation - Real Exam Mode', () => {
    it('should navigate to certification route when real mode button is clicked', async () => {
      const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
      buttons[1].nativeElement.click();
      fixture.detectChanges();

      await fixture.whenStable();

      expect(routerMock.navigate).toHaveBeenCalledWith(
        ['certification', 1],
        { relativeTo: activatedRouteMock.parent }
      );
    });

    it('should use exam id in certification navigation', async () => {
      const examWithDifferentId = { ...mockExam, id: 99 };
      fixture.componentRef.setInput('exam', examWithDifferentId);
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
      buttons[1].nativeElement.click();

      await fixture.whenStable();

      expect(routerMock.navigate).toHaveBeenCalledWith(
        ['certification', 99],
        expect.any(Object)
      );
    });

    it('should call startRealExam method when real mode button is clicked', () => {
      jest.spyOn(component as any, 'startRealExam');

      const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
      buttons[1].nativeElement.click();

      expect((component as any).startRealExam).toHaveBeenCalled();
    });
  });

  describe('Icons Display', () => {
    it('should display calendar icon for creation date', () => {
      const calendarIcon = fixture.debugElement.query(By.css('fa-icon'));
      expect(calendarIcon).toBeTruthy();
    });
  });

  describe('Card Wrapper', () => {
    it('should wrap content in ox-card', () => {
      const card = fixture.debugElement.query(By.css('ox-card'));
      expect(card).toBeTruthy();
    });
  });

  describe('Exam with Different Data', () => {
    it('should handle exam with no questions', () => {
      const examNoQuestions = { ...mockExam, questions: [] };
      fixture.componentRef.setInput('exam', examNoQuestions);
      fixture.detectChanges();

      const statsElements = fixture.debugElement.queryAll(By.css('.flex.items-center.justify-between'));
      const questionsElement = statsElements[0];
      expect(questionsElement.nativeElement.textContent).toContain('0');
    });

    it('should handle exam with many questions', () => {
      const manyQuestions = Array(100).fill(null).map((_, i) => ({
        id: i,
        questionText: `Q${i}`,
        type: QuestionType.SINGLE_CHOICE,
        pointsTotal: 10,
        answers: []
      }));
      const examManyQuestions = { ...mockExam, questions: manyQuestions };
      fixture.componentRef.setInput('exam', examManyQuestions);
      fixture.detectChanges();

      const statsElements = fixture.debugElement.queryAll(By.css('.flex.items-center.justify-between'));
      const questionsElement = statsElements[0];
      expect(questionsElement.nativeElement.textContent).toContain('100');
    });

    it('should display different status types', () => {
      const examDraft = { ...mockExam, statusType: StatusType.DRAFT };
      fixture.componentRef.setInput('exam', examDraft);
      fixture.detectChanges();

      const badges = fixture.debugElement.queryAll(By.css('ox-badge'));
      expect(badges.length).toBeGreaterThanOrEqual(1);
      // Status badge should update based on status type
      expect(badges[0]).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle exam with zero points to succeed', () => {
      const examZeroPoints = { ...mockExam, pointsToSucceeded: 0 };
      fixture.componentRef.setInput('exam', examZeroPoints);
      fixture.detectChanges();

      const statsElements = fixture.debugElement.queryAll(By.css('.flex.items-center.justify-between'));
      const pointsElement = statsElements[1];
      expect(pointsElement.nativeElement.textContent).toContain('0');
    });

    it('should handle exam with very long name', () => {
      const longName = 'A'.repeat(100);
      const examLongName = { ...mockExam, name: longName };
      fixture.componentRef.setInput('exam', examLongName);
      fixture.detectChanges();

      const nameElement = fixture.debugElement.query(By.css('h3'));
      expect(nameElement.nativeElement.textContent).toContain(longName);
    });

    it('should handle exam with null createdAt date', () => {
      const examNullDate = { ...mockExam, createdAt: null };
      fixture.componentRef.setInput('exam', examNullDate);
      fixture.detectChanges();

      // Should not crash
      expect(component).toBeTruthy();
    });
  });

  describe('Navigation Parent Context', () => {
    it('should navigate relative to parent route', async () => {
      const buttons = fixture.debugElement.queryAll(By.css('ox-button'));
      buttons[0].nativeElement.click();

      await fixture.whenStable();

      expect(routerMock.navigate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ relativeTo: activatedRouteMock.parent })
      );
    });
  });
});
