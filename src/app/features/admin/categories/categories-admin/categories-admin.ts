import {Component, inject, OnDestroy, signal, WritableSignal} from '@angular/core';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faEdit, faFloppyDisk, faLayerGroup, faTrash} from '@fortawesome/free-solid-svg-icons';
import {AsyncPipe, DatePipe} from '@angular/common';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';

import {ButtonComponent} from '../../../../shared/components/button/button.component';
import {CardComponent} from '../../../../shared/components/card/card.component';
import {DialogComponent} from '../../../../shared/components/dialog/dialog.component';
import {DialogHeaderComponent} from '../../../../shared/components/dialog/dialog-header.component';
import {DialogContentComponent} from '../../../../shared/components/dialog/dialog-content.component';
import {DialogFooterComponent} from '../../../../shared/components/dialog/dialog-footer.component';
import {
    PaginationControlsComponent
} from '../../../../shared/components/pagination-controls/pagination-controls.component';

import {CategoryService} from '../../../../shared/service/category.service';
import {ToastService} from '../../../../shared/service/toast.service';

import Category from '../../../../shared/model/classes/category.class';
import {PagedResult} from '../../../../shared/model/classes/paged-result.class';
import {ICategory} from '../../../../shared/model/interfaces/category.interface';
import {IPageOptions} from '../../../../shared/model/interfaces/page-options.interface';
import {IPagedResult} from '../../../../shared/model/interfaces/paged-result.interface';
import {ICategoryStatistics} from '../../../../shared/model/interfaces/category-statistics.interface';

import {TEXT_VALIDATORS} from '../../../../shared/forms/validation/validators-sets';
import Logger from '../../../../shared/util/Logger';

import {CategoriesStatisticsHeader} from './components/categories-statistics-header/categories-statistics-header';
import {FilterExpressionBuilder} from "../../../../shared/model/interfaces/filter/filter-expression-builder.class";
import {BasicInputComponent} from "../../../../shared/forms/basic-input/basic-input.component";
import {CategoryControls} from "./components/category-controls/category-controls.component";

@Component({
    selector: 'ox-categories-admin',
    imports: [
        AsyncPipe,
        DatePipe,
        FaIconComponent,
        ButtonComponent,
        CardComponent,
        DialogComponent,
        DialogHeaderComponent,
        DialogContentComponent,
        DialogFooterComponent,
        PaginationControlsComponent,
        CategoryControls,
        CategoriesStatisticsHeader,
        BasicInputComponent,
        ReactiveFormsModule
    ],
    templateUrl: './categories-admin.html',
    styleUrl: './categories-admin.scss',
})
export class CategoriesAdmin implements OnDestroy {

    private readonly logger = new Logger('[Admin|CategoriesAdmin]');

    protected readonly faLayerGroup = faLayerGroup;
    protected readonly faFloppyDisk = faFloppyDisk;
    protected readonly faTrash = faTrash;
    protected readonly faEdit = faEdit;

    private _categoryService: CategoryService = inject(CategoryService);
    private _fb: FormBuilder = inject(FormBuilder);
    private _toastService: ToastService = inject(ToastService);

    protected creatingMode: WritableSignal<boolean> = signal(false);
    protected editingId: WritableSignal<number | null> = signal(null);
    protected deleteDialogOpen: WritableSignal<boolean> = signal(false);
    protected categoryToDelete: WritableSignal<ICategory | null> = signal(null);
    protected pageOptions: WritableSignal<IPageOptions> = signal<IPageOptions>({ elementsPerPage: 10, page: 1 });
    protected currentPagedResultSignal: WritableSignal<IPagedResult<ICategory>> = signal<IPagedResult<ICategory>>(PagedResult.default());
    protected statisticsSignal: WritableSignal<ICategoryStatistics> = signal<ICategoryStatistics>({
        totalCount: 0,
        inUseCount: 0,
        unusedCount: 0
    });

    private _subscriptions$: Subscription = new Subscription();
    private readonly _categoriesSubject = new BehaviorSubject<Category[]>([]);

    protected categoriesFormArray: FormArray = this._fb.array([]);
    protected newCategoryControl = new FormControl<string | null>(null, TEXT_VALIDATORS);

    constructor() {
        this._subscriptions$.add(this._categoryService.errors$.subscribe(error => {
            if (error?.length) {
                error.forEach(e => {
                    this._toastService.addErrorToast($localize`:@@ox.categories.admin.error:Error during operation`, e);
                    this.logger.logError(e);
                });
            }
        }));

        this._loadCategories();
    }

    ngOnDestroy(): void {
        this._subscriptions$.unsubscribe();
    }

    public get categories$(): Observable<Category[]> {
        return this._categoriesSubject.asObservable();
    }

    private _loadCategories(): void {
        this._subscriptions$.add(
            this._categoryService.getCategories(this.pageOptions()).subscribe(pagedResult => {
                if (pagedResult) {
                    this.currentPagedResultSignal.set(pagedResult);
                    this._updateStatistics(pagedResult);
                    this.categoriesFormArray.clear();
                    pagedResult.data.forEach(category => this.categoriesFormArray.push(this._createNewCategoryFormGroup(category)));
                    this._categoriesSubject.next(pagedResult.data as Category[]);
                }
            })
        );
    }

    protected onPageChanged($event: IPageOptions): void {
        this.pageOptions.set($event);
        this._loadCategories();
    }

    protected onSearchChanged(searchTerm: string): void {
        if (searchTerm.length > 3) {
            const builder = FilterExpressionBuilder.trees()
                .add(FilterExpressionBuilder.or([
                    FilterExpressionBuilder.cond('name').like(FilterExpressionBuilder.str(searchTerm))
                ]));

            this._subscriptions$.add(
                this._categoryService.search(builder.build(), this.pageOptions()).subscribe(pagedResult => {
                    if (pagedResult) {
                        this.currentPagedResultSignal.set(pagedResult);
                        this._updateStatistics(pagedResult);
                        this.categoriesFormArray.clear();
                        pagedResult.data.forEach(category => this.categoriesFormArray.push(this._createNewCategoryFormGroup(category)));
                        this._categoriesSubject.next(pagedResult.data as Category[]);
                    }
                })
            );
        } else if (searchTerm.length === 0) {
            this._loadCategories();
        }
    }

    protected onCreateCategory(): void {
        this.creatingMode.set(true);
        this.editingId.set(null);
    }

    protected onSaveNewCategory(): void {
        this.creatingMode.set(false);
        this._subscriptions$.add(this._categoryService.createCategory(Category.asNew(this.newCategoryControl.value!)).subscribe({
            next: (category) => {
                if (category) {
                    this._toastService.addSuccessToast(
                        $localize`:@@ox.categories.admin.createSuccess:Category created`,
                        $localize`:@@ox.categories.admin.createSuccessMessage:The category has been successfully created.`
                    );
                    this.newCategoryControl.reset();
                    this._loadCategories();
                }
            }
        }));
    }

    protected onAbortNewCategory(): void {
        this.creatingMode.set(false);
    }

    protected onEditCategory(categoryId: number): void {
        this.editingId.set(categoryId);
        this.creatingMode.set(false);
    }

    protected onSaveEditCategory(): void {
        const category = this.categoriesFormArray.controls.find(c => c.value.id === this.editingId())?.value;
        this.editingId.set(null);
        if (category) {
            this._subscriptions$.add(this._categoryService.updateCategory(category).subscribe({
                next: (updatedCategory) => {
                    if (updatedCategory) {
                        this.categoriesFormArray.at(this.categoriesFormArray.controls.findIndex(c => c.value.id === updatedCategory.id))?.patchValue(updatedCategory);
                        this._toastService.addSuccessToast(
                            $localize`:@@ox.categories.admin.editSuccess:Category edited`,
                            $localize`:@@ox.categories.admin.editSuccessMessage:The category has been successfully edited.`
                        );
                    }
                }
            }))
        }
    }

    protected onAbortEditCategory(): void {
        this.editingId.set(null);
    }

    protected onDeleteCategory(category: ICategory): void {
        this.categoryToDelete.set(category);
        this.deleteDialogOpen.set(true);
    }

    protected onConfirmDelete(): void {
        const category = this.categoryToDelete();
        if (category && category.id) {
            this._subscriptions$.add(
                this._categoryService.deleteCategory(category.id).subscribe({
                    next: () => {
                        this._toastService.addSuccessToast(
                            $localize`:@@ox.categories.admin.deleteSuccess:Category deleted`,
                            $localize`:@@ox.categories.admin.deleteSuccessMessage:The category has been successfully deleted.`
                        );
                        this._loadCategories();
                    },
                    error: (err) => {
                        this._toastService.addErrorToast($localize`:@@ox.categories.admin.deleteError:Failed to delete category`, $localize`:@@ox.categories.admin.deleteErrorMessage:An error occurred while deleting the category.`);
                        this.logger.logError('Failed to delete category:', err);
                    }
                })
            );
        }
        this.closeDeleteDialog();
    }

    protected closeDeleteDialog(): void {
        this.deleteDialogOpen.set(false);
        this.categoryToDelete.set(null);
    }

    private _updateStatistics(pagedResult: PagedResult<ICategory>): void {
        this.statisticsSignal.set({
            totalCount: pagedResult.totalElements,
            inUseCount: 0,
            unusedCount: pagedResult.totalElements
        });
    }

    private _createNewCategoryFormGroup(category?: ICategory): FormGroup {
        return this._fb.group({
            id: new FormControl(category?.id ?? null),
            name: new FormControl(category?.name ?? null, {
                validators: TEXT_VALIDATORS,
                updateOn: 'blur'
            })
        });
    }

    protected getControl(index: number): FormControl {
        return this.categoriesFormArray.at(index)?.get('name') as FormControl;
    }
}
