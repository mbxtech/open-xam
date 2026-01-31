import { Component, input } from '@angular/core';
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faExclamationTriangle, faFileImport, faClock } from "@fortawesome/free-solid-svg-icons";
import { CardComponent } from "../../../../../../../shared/components/card/card.component";
import { ICachedExamStatistics } from '../../../../../../../shared/model/interfaces/import/cached-exam-statistics.interface';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'ox-imports-statistics-header',
  imports: [
    CardComponent,
    FaIconComponent,
    DatePipe
  ],
  templateUrl: './imports-statistics-header.component.html',
  styleUrl: './imports-statistics-header.component.scss',
})
export class ImportsStatisticsHeaderComponent {
  protected readonly faExclamationTriangle = faExclamationTriangle;
  protected readonly faFileImport = faFileImport;
  protected readonly faClock = faClock;

  public statistics = input.required<ICachedExamStatistics>();
}
