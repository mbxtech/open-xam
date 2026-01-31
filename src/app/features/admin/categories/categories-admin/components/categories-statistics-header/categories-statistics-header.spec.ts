import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoriesStatisticsHeader } from './categories-statistics-header';
import { ICategoryStatistics } from '../../../../../../shared/model/interfaces/category-statistics.interface';

describe('CategoriesStatisticsHeader', () => {
    let component: CategoriesStatisticsHeader;
    let fixture: ComponentFixture<CategoriesStatisticsHeader>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CategoriesStatisticsHeader]
        }).compileComponents();

        fixture = TestBed.createComponent(CategoriesStatisticsHeader);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default statistics values', () => {
        const stats: ICategoryStatistics = component.statistics();
        expect(stats.totalCount).toBe(0);
        expect(stats.inUseCount).toBe(0);
        expect(stats.unusedCount).toBe(0);
    });

    it('should display statistics from input', () => {
        fixture.componentRef.setInput('statistics', {
            totalCount: 10,
            inUseCount: 7,
            unusedCount: 3
        });
        fixture.detectChanges();

        const stats: ICategoryStatistics = component.statistics();
        expect(stats.totalCount).toBe(10);
        expect(stats.inUseCount).toBe(7);
        expect(stats.unusedCount).toBe(3);
    });
});
