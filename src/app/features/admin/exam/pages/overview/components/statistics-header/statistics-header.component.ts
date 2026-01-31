import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faArchive } from "@fortawesome/free-solid-svg-icons/faArchive";
import { CardComponent } from "../../../../../../../shared/components/card/card.component";
import { IExamOverallStatistics } from '../../../../../../../shared/model/interfaces/exam-overall-statistics.interface';
import { ExamService } from '../../../../../../../shared/service/exam.service';

@Component({
  selector: 'ox-statistics-header',
  imports: [
    CardComponent,
    FaIconComponent
  ],
  templateUrl: './statistics-header.component.html',
  styleUrl: './statistics-header.component.scss',
})
export class StatisticsHeaderComponent {

  protected readonly faArchive = faArchive;
  public statisticsHeader: WritableSignal<IExamOverallStatistics> = signal<IExamOverallStatistics>({
    averageQuestionCount: 0,
    examCount: 0,
    averageSucceedingScore: 0,
    archiveCount: 0,
    activeCount: 0,
    draftCount: 0,
    inactiveCount: 0
  });
  private readonly _examService: ExamService = inject(ExamService);

  constructor() {
    this._examService.getStatistics().subscribe((res) => {
      if (res) {
        this.statisticsHeader.set(res);
      }
    });
  }

}
