import { Component, input, InputSignal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { CardComponent } from '../../../../../../shared/components/card/card.component';
import { ICategoryStatistics } from '../../../../../../shared/model/interfaces/category-statistics.interface';

@Component({
    selector: 'ox-categories-statistics-header',
    imports: [
        CardComponent,
        FaIconComponent
    ],
    templateUrl: './categories-statistics-header.html',
    styleUrl: './categories-statistics-header.scss',
})
export class CategoriesStatisticsHeader {

    protected readonly faLayerGroup = faLayerGroup;

    public statistics: InputSignal<ICategoryStatistics> = input<ICategoryStatistics>({
        totalCount: 0,
        inUseCount: 0,
        unusedCount: 0
    });
}
