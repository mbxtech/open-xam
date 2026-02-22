import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamService } from '../../shared/service/exam.service';
import { IExamOverallStatistics } from '../../shared/model/interfaces/exam-overall-statistics.interface';
import { CardComponent } from '../../shared/components/card/card.component';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { 
  faChartLine, 
  faGraduationCap, 
  faCheckCircle, 
  faArchive, 
  faEdit, 
  faEyeSlash,
  faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import Logger from "../../shared/util/Logger";

@Component({
  selector: 'ox-dashboard',
  standalone: true,
  imports: [CommonModule, CardComponent, PageHeader, FaIconComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  protected readonly faChartLine = faChartLine;
  protected readonly faGraduationCap = faGraduationCap;
  protected readonly faCheckCircle = faCheckCircle;
  protected readonly faArchive = faArchive;
  protected readonly faEdit = faEdit;
  protected readonly faEyeSlash = faEyeSlash;
  protected readonly faQuestionCircle = faQuestionCircle;

  private readonly _examService = inject(ExamService);

  public statistics: WritableSignal<IExamOverallStatistics | null> = signal(null);

  private readonly logger = new Logger('Dashboard');

  ngOnInit(): void {
    this.logger.logInfo('Dashboard initialized');
    this._examService.getStatistics().subscribe((stats) => {
      if (stats) {
        this.statistics.set(stats);
      }
    });
  }
}
