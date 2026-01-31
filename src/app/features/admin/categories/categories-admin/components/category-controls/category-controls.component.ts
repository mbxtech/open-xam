import { Component, output, OutputEmitterRef } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../../../shared/components/input/input.component';

@Component({
    selector: 'ox-categorie-controls',
    imports: [
        ButtonComponent,
        CardComponent,
        FaIconComponent,
        InputComponent
    ],
    templateUrl: './category-controls.component.html',
    styleUrl: './category-controls.component.scss',
})
export class CategoryControls {

    protected readonly faPlus = faPlus;
    protected readonly String = String;

    public searchChange: OutputEmitterRef<string> = output<string>();
    public createCategory: OutputEmitterRef<void> = output<void>();

    protected searchPlaceholder: string = $localize`:@@admin.categories.searchPlaceholder:Search categories...`;

    protected onCreateCategory(): void {
        this.createCategory.emit();
    }
}
