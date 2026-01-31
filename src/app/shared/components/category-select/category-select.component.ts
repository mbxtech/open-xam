import {Component, DestroyRef, effect, inject, input, InputSignal, OnDestroy} from '@angular/core';
import {faRotate} from '@fortawesome/free-solid-svg-icons/faRotate';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {DynamicSelectComponent, SelectOption} from '../../forms/dynamic-select/dynamic-select.component';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CategoryService} from '../../service/category.service';
import {BehaviorSubject, catchError, Observable, of, Subscription} from 'rxjs';
import {ICategory} from '../../model/interfaces/category.interface';
import {AsyncPipe} from '@angular/common';
import {ToastService} from '../../service/toast.service';
import Category from '../../model/classes/category.class';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ButtonComponent} from '../button/button.component';
import {BasicInputComponent} from '../../forms/basic-input/basic-input.component';

@Component({
    selector: 'ox-category-select',
    imports: [
        FaIconComponent,
        DynamicSelectComponent,
        ReactiveFormsModule,
        AsyncPipe,
        ButtonComponent,
        BasicInputComponent
    ],
    templateUrl: './category-select.component.html',
    styleUrl: './category-select.component.scss',
})
export class CategorySelectComponent implements OnDestroy {

    protected readonly faRotate = faRotate;

    public formGroup: InputSignal<FormGroup> = input.required();

    private readonly _destroyRef = inject(DestroyRef);
    private readonly _categoryService: CategoryService = inject(CategoryService);
    private readonly _toastService: ToastService = inject(ToastService);

    private readonly _categories$: BehaviorSubject<SelectOption[]> = new BehaviorSubject<SelectOption[]>([]);
    private readonly _subscriptions$: Subscription = new Subscription();

    private _newCategoryControl = new FormControl('', {
        validators: [
            Validators.minLength(5)
        ]
    });
    protected selectCategoryControl: FormControl = new FormControl();

    constructor() {

        effect(() => {
            const formGroup = this.formGroup();
            if (formGroup) {
                this.selectCategoryControl.setValue(formGroup.get('id')?.value);
            }
        });

        this._loadCategories();
        this._subscriptions$.add(this._categoryService.errors$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((errors) => {
            if (errors.length) {
                this._toastService.add({
                    title: $localize`:@@ox.categorySelect.errors:Errors appeared during category operations`,
                    message: errors.join(', '),
                    type: 'danger',
                    date: new Date()
                });
            }
        }));

        this._subscriptions$.add(this.selectCategoryControl.valueChanges.subscribe((value) => {
            if (value) {
                const category = this._categories$.value.find((category) => category.value === Number(value));
                if (category) {
                    this.formGroup().patchValue(new Category({id: category.value, name: category.label} as ICategory));
                }
            }
        }));
    }

    ngOnDestroy(): void {
        this._subscriptions$.unsubscribe();
        this._categories$.unsubscribe();
    }

    private _loadCategories(): void {
        this._subscriptions$.add(
            this._categoryService.getCategories().subscribe((categories) => {
                if (categories?.data?.length) {
                    this._categories$.next(this._mapToSelectOptions(categories.data));
                }
            })
        );
    }

    private _mapToSelectOptions(categories: ICategory[]): SelectOption[] {
        return categories.map((category, index) => ({
            value: category.id,
            label: category.name,
            id: index
        }));
    }

    protected get categories$(): Observable<SelectOption[]> {
        return this._categories$.asObservable();
    }

    protected reloadCategories(): void {
        this._subscriptions$.unsubscribe();
        this._categoryService.getCategories().subscribe((categories) => {
            if (categories?.data?.length) {
                this._categories$.next(this._mapToSelectOptions(categories.data));
            }
        });
    }

    protected createCategory(): void {
        const categoryName = this._newCategoryControl.value;
        if (!categoryName) {
            this._toastService.add({
                title: $localize`:@@ox.categorySelect.validation.error:Validation Error`,
                message: $localize`:@@ox.categorySelect.validation.error:You must enter a value!`,
                type: 'danger',
                date: new Date()
            });
            return;
        }

        this._categoryService.createCategory(new Category({name: categoryName} as ICategory))
            .pipe(catchError((error) => {
                this._toastService.add({
                    title: $localize`:@@ox.categorySelect.create.error:Error creating category`,
                    message: $localize`:@@ox.categorySelect.validation.error:Category could not be created: ${error.message}`,
                    type: 'danger',
                    date: new Date()
                })

                return of(null);
            }))
            .subscribe((res) => {
                if (res) {
                    this._newCategoryControl.reset();
                    this.reloadCategories();
                    this._toastService.add({
                        title: $localize`:@@ox.categorySelect.create.success:Category created successfully`,
                        message: $localize`:@@ox.categorySelect.create.success:Category with id ${res.id} created successfully`,
                        type: 'success',
                        date: new Date()
                    })
                }
            });

    }

    public get newCategoryControl(): FormControl {
        return this._newCategoryControl;
    }

}
