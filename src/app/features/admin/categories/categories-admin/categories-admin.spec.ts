import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, of } from 'rxjs';

import { CategoriesAdmin } from './categories-admin';
import { CategoryService } from '../../../../shared/service/category.service';
import { ToastService } from '../../../../shared/service/toast.service';
import { PagedResult } from '../../../../shared/model/classes/paged-result.class';
import { ICategory } from '../../../../shared/model/interfaces/category.interface';

describe('CategoriesAdmin', () => {
    let component: CategoriesAdmin;
    let fixture: ComponentFixture<CategoriesAdmin>;
    let categoryServiceMock: jest.Mocked<Partial<CategoryService>>;
    let toastServiceMock: jest.Mocked<Partial<ToastService>>;
    let errorsSubject: BehaviorSubject<string[]>;

    const mockCategories: ICategory[] = [
        { id: 1, name: 'Category 1', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
        { id: 2, name: 'Category 2', createdAt: new Date('2024-01-02'), updatedAt: new Date('2024-01-02') },
        { id: 3, name: 'Category 3', createdAt: new Date('2024-01-03'), updatedAt: new Date('2024-01-03') }
    ];

    const mockPagedResult: PagedResult<ICategory> = {
        data: mockCategories,
        totalElements: 3,
        totalPages: 1,
        currentPage: 1,
    };

    beforeEach(async () => {
        errorsSubject = new BehaviorSubject<string[]>([]);

        categoryServiceMock = {
            getCategories: jest.fn().mockReturnValue(of(mockPagedResult)),
            deleteCategory: jest.fn().mockReturnValue(of(mockCategories[0])),
            createCategory: jest.fn().mockReturnValue(of(mockCategories[0])),
            updateCategory: jest.fn().mockReturnValue(of(mockCategories[0])),
            search: jest.fn().mockReturnValue(of(mockPagedResult)),
            errors$: errorsSubject.asObservable()
        };

        toastServiceMock = {
            addSuccessToast: jest.fn(),
            addErrorToast: jest.fn()
        };

        await TestBed.configureTestingModule({
            imports: [CategoriesAdmin],
            providers: [
                { provide: CategoryService, useValue: categoryServiceMock },
                { provide: ToastService, useValue: toastServiceMock }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CategoriesAdmin);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        errorsSubject.complete();
    });

    describe('Component Creation', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should initialize with default signal values', () => {
            expect(component['creatingMode']()).toBe(false);
            expect(component['editingId']()).toBeNull();
            expect(component['deleteDialogOpen']()).toBe(false);
            expect(component['categoryToDelete']()).toBeNull();
        });

        it('should update statistics after loading categories', () => {
            const stats = component['statisticsSignal']();
            expect(stats.totalCount).toBe(mockPagedResult.totalElements);
            expect(stats.inUseCount).toBe(0);
            expect(stats.unusedCount).toBe(mockPagedResult.totalElements);
        });
    });

    describe('Categories Loading', () => {
        it('should call getCategories on init', () => {
            expect(categoryServiceMock.getCategories).toHaveBeenCalled();
        });

        it('should update currentPagedResultSignal when categories are loaded', fakeAsync(() => {
            component.categories$.subscribe();
            tick();

            const pagedResult = component['currentPagedResultSignal']();
            expect(pagedResult.totalElements).toBe(3);
            expect(pagedResult.data.length).toBe(3);
        }));

        it('should update statistics when categories are loaded', fakeAsync(() => {
            component.categories$.subscribe();
            tick();

            const stats = component['statisticsSignal']();
            expect(stats.totalCount).toBe(3);
        }));
    });

    describe('Error Handling', () => {
        it('should show error toast when service emits errors', fakeAsync(() => {
            errorsSubject.next(['Test error message']);
            tick();

            expect(toastServiceMock.addErrorToast).toHaveBeenCalledWith(
                expect.any(String),
                'Test error message'
            );
        }));
    });

    describe('Page Changed', () => {
        it('should update pageOptions when onPageChanged is called', () => {
            const newPageOptions = { elementsPerPage: 20, page: 2 };
            component['onPageChanged'](newPageOptions);

            expect(component['pageOptions']()).toEqual(newPageOptions);
        });

        it('should fetch new categories when page changes', () => {
            const newPageOptions = { elementsPerPage: 20, page: 2 };
            component['onPageChanged'](newPageOptions);

            expect(categoryServiceMock.getCategories).toHaveBeenCalledWith(newPageOptions);
        });
    });

    describe('Search Changed', () => {
        it('should call search service when search term is longer than 3 characters', fakeAsync(() => {
            component['onSearchChanged']('test search');
            tick();

            expect(categoryServiceMock.search).toHaveBeenCalled();
        }));

        it('should not call search service when search term is 3 characters or less', fakeAsync(() => {
            // @ts-ignore
            categoryServiceMock.search!.mockClear();
            component['onSearchChanged']('tes');
            tick();

            expect(categoryServiceMock.search).not.toHaveBeenCalled();
        }));

        it('should reload categories when search term is empty', fakeAsync(() => {
            const getCategoriesMocked = jest.mocked(categoryServiceMock.getCategories!);
            const initialCallCount = getCategoriesMocked.mock.calls.length;
            component['onSearchChanged']('');
            tick();

            expect(getCategoriesMocked.mock.calls.length).toBeGreaterThan(initialCallCount);
        }));

        it('should update paged result when search returns results', fakeAsync(() => {
            const searchResults: PagedResult<ICategory> = {
                data: [mockCategories[0]],
                totalElements: 1,
                totalPages: 1,
                currentPage: 1,
            };
            jest.mocked(categoryServiceMock.search!).mockReturnValue(of(searchResults));

            component['onSearchChanged']('test search');
            tick();

            const pagedResult = component['currentPagedResultSignal']();
            expect(pagedResult.totalElements).toBe(1);
        }));
    });

    describe('Create Category Mode', () => {
        it('should set creatingMode to true when onCreateCategory is called', () => {
            component['onCreateCategory']();
            expect(component['creatingMode']()).toBe(true);
        });

        it('should reset editingId when entering create mode', () => {
            component['editingId'].set(1);
            component['onCreateCategory']();

            expect(component['editingId']()).toBeNull();
        });

        it('should set creatingMode to false when onSaveNewCategory is called', fakeAsync(() => {
            component['creatingMode'].set(true);
            component['newCategoryControl'].setValue('New Category');
            component['onSaveNewCategory']();
            tick();

            expect(component['creatingMode']()).toBe(false);
        }));

        it('should call createCategory service when saving new category', fakeAsync(() => {
            component['newCategoryControl'].setValue('New Category');
            component['onSaveNewCategory']();
            tick();

            expect(categoryServiceMock.createCategory).toHaveBeenCalled();
        }));

        it('should show success toast after creating category', fakeAsync(() => {
            component['newCategoryControl'].setValue('New Category');
            component['onSaveNewCategory']();
            tick();

            expect(toastServiceMock.addSuccessToast).toHaveBeenCalled();
        }));

        it('should set creatingMode to false when onAbortNewCategory is called', () => {
            component['creatingMode'].set(true);
            component['onAbortNewCategory']();

            expect(component['creatingMode']()).toBe(false);
        });
    });

    describe('Edit Category Mode', () => {
        it('should set editingId when onEditCategory is called', () => {
            component['onEditCategory'](5);
            expect(component['editingId']()).toBe(5);
        });

        it('should reset creatingMode when entering edit mode', () => {
            component['creatingMode'].set(true);
            component['onEditCategory'](5);

            expect(component['creatingMode']()).toBe(false);
        });

        it('should reset editingId when onSaveEditCategory is called', () => {
            component['editingId'].set(5);
            component['onSaveEditCategory']();

            expect(component['editingId']()).toBeNull();
        });

        it('should reset editingId when onAbortEditCategory is called', () => {
            component['editingId'].set(5);
            component['onAbortEditCategory']();

            expect(component['editingId']()).toBeNull();
        });
    });

    describe('Delete Category Dialog', () => {
        const categoryToDelete: ICategory = mockCategories[0];

        it('should open delete dialog when onDeleteCategory is called', () => {
            component['onDeleteCategory'](categoryToDelete);

            expect(component['deleteDialogOpen']()).toBe(true);
            expect(component['categoryToDelete']()).toEqual(categoryToDelete);
        });

        it('should close dialog and reset state when closeDeleteDialog is called', () => {
            component['deleteDialogOpen'].set(true);
            component['categoryToDelete'].set(categoryToDelete);

            component['closeDeleteDialog']();

            expect(component['deleteDialogOpen']()).toBe(false);
            expect(component['categoryToDelete']()).toBeNull();
        });

        it('should call deleteCategory service when onConfirmDelete is called', fakeAsync(() => {
            component['categoryToDelete'].set(categoryToDelete);
            component['deleteDialogOpen'].set(true);

            component['onConfirmDelete']();
            tick();

            expect(categoryServiceMock.deleteCategory).toHaveBeenCalledWith(categoryToDelete.id);
        }));

        it('should show success toast after successful deletion', fakeAsync(() => {
            component['categoryToDelete'].set(categoryToDelete);
            component['onConfirmDelete']();
            tick();

            expect(toastServiceMock.addSuccessToast).toHaveBeenCalled();
        }));

        it('should refresh categories after successful deletion', fakeAsync(() => {
            component['categoryToDelete'].set(categoryToDelete);
            const getCategoriesMocked = jest.mocked(categoryServiceMock.getCategories!);
            const initialCallCount = getCategoriesMocked.mock.calls.length;

            component['onConfirmDelete']();
            tick();

            expect(getCategoriesMocked.mock.calls.length).toBeGreaterThan(initialCallCount);
        }));

        it('should close dialog after confirming deletion', fakeAsync(() => {
            component['categoryToDelete'].set(categoryToDelete);
            component['deleteDialogOpen'].set(true);

            component['onConfirmDelete']();
            tick();

            expect(component['deleteDialogOpen']()).toBe(false);
            expect(component['categoryToDelete']()).toBeNull();
        }));

        it('should not call deleteCategory if categoryToDelete is null', fakeAsync(() => {
            component['categoryToDelete'].set(null);

            component['onConfirmDelete']();
            tick();

            expect(categoryServiceMock.deleteCategory).not.toHaveBeenCalled();
        }));
    });

    describe('Template Rendering', () => {
        it('should render categorie controls component', () => {
            const controls = fixture.debugElement.query(By.css('ox-categorie-controls'));
            expect(controls).toBeTruthy();
        });

        it('should render statistics header component', () => {
            const statsHeader = fixture.debugElement.query(By.css('ox-categories-statistics-header'));
            expect(statsHeader).toBeTruthy();
        });

        it('should render pagination controls', () => {
            const pagination = fixture.debugElement.query(By.css('ox-pagination-controls'));
            expect(pagination).toBeTruthy();
        });

        it('should render delete dialog', () => {
            const dialog = fixture.debugElement.query(By.css('ox-dialog'));
            expect(dialog).toBeTruthy();
        });

        it('should show create category card when creatingMode is true', () => {
            component['creatingMode'].set(true);
            fixture.detectChanges();

            const createCard = fixture.debugElement.query(By.css('.border-blue-200'));
            expect(createCard).toBeTruthy();
        });

        it('should hide create category card when creatingMode is false', () => {
            component['creatingMode'].set(false);
            fixture.detectChanges();

            const createCard = fixture.debugElement.query(By.css('.border-blue-200'));
            expect(createCard).toBeFalsy();
        });
    });

    describe('Component Interactions', () => {
        it('should call onSearchChanged when controls emit searchChange', fakeAsync(() => {
            const spy = jest.spyOn(component as any, 'onSearchChanged');
            const controls = fixture.debugElement.query(By.css('ox-categorie-controls'));

            controls.triggerEventHandler('searchChange', 'test');
            tick();

            expect(spy).toHaveBeenCalledWith('test');
        }));

        it('should call onCreateCategory when controls emit createCategory', () => {
            const spy = jest.spyOn(component as any, 'onCreateCategory');
            const controls = fixture.debugElement.query(By.css('ox-categorie-controls'));

            controls.triggerEventHandler('createCategory', undefined);

            expect(spy).toHaveBeenCalled();
        });

        it('should call onPageChanged when pagination emits pageOptions', () => {
            const spy = jest.spyOn(component as any, 'onPageChanged');
            const pagination = fixture.debugElement.query(By.css('ox-pagination-controls'));
            const newPageOptions = { elementsPerPage: 20, page: 2 };

            pagination.triggerEventHandler('pageOptions', newPageOptions);

            expect(spy).toHaveBeenCalledWith(newPageOptions);
        });

        it('should call closeDeleteDialog when dialog emits closed', () => {
            const spy = jest.spyOn(component as any, 'closeDeleteDialog');
            const dialog = fixture.debugElement.query(By.css('ox-dialog'));

            dialog.triggerEventHandler('closed', undefined);

            expect(spy).toHaveBeenCalled();
        });
    });

    describe('Statistics Update', () => {
        it('should correctly calculate statistics from paged result', fakeAsync(() => {
            component.categories$.subscribe();
            tick();

            const stats = component['statisticsSignal']();
            expect(stats.totalCount).toBe(mockPagedResult.totalElements);
            expect(stats.unusedCount).toBe(mockPagedResult.totalElements);
            expect(stats.inUseCount).toBe(0);
        }));
    });
});
