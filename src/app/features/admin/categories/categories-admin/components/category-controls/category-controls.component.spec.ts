import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryControls } from './category-controls.component';

describe('CategorieControls', () => {
    let component: CategoryControls;
    let fixture: ComponentFixture<CategoryControls>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CategoryControls]
        }).compileComponents();

        fixture = TestBed.createComponent(CategoryControls);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit searchChange event when search input changes', () => {
        const searchChangeSpy = jest.spyOn(component.searchChange, 'emit');
        component.searchChange.emit('test search');
        expect(searchChangeSpy).toHaveBeenCalledWith('test search');
    });

    it('should emit createCategory event when create button is clicked', () => {
        const createCategorySpy = jest.spyOn(component.createCategory, 'emit');
        component.createCategory.emit();
        expect(createCategorySpy).toHaveBeenCalled();
    });
});
