import {Component, input, InputSignal, output, OutputEmitterRef, signal, WritableSignal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IPageOptions} from '../../model/interfaces/page-options.interface';
import {IPagedResult} from '../../model/interfaces/paged-result.interface';
import {ButtonComponent} from '../button/button.component';

@Component({
    selector: 'ox-pagination-controls',
    imports: [
        FormsModule,
        ButtonComponent
    ],
    templateUrl: './pagination-controls.component.html',
    styleUrl: './pagination-controls.component.scss',
})
export class PaginationControlsComponent<T> {

    protected readonly Math = Math;
    protected readonly elementsPerPageOptions: number[] = [5, 10, 25, 50];
    protected pageSize: WritableSignal<number> = signal<number>(10);
    public pagedResult: InputSignal<IPagedResult<T>> = input<IPagedResult<T>>({
        currentPage: 0,
        totalElements: 0,
        totalPages: 0,
        data: []
    });
    public pageOptions: OutputEmitterRef<IPageOptions> = output<IPageOptions>();
    protected page: WritableSignal<number> = signal<number>(1);

    public prevPage() {
        if (this.page() > 1) {
            this.page.set(this.page() - 1);
            this.emitPageOptions();
        }
    }

    public nextPage() {
        const total = this.pagedResult().totalElements;
        const maxPage = Math.max(1, Math.ceil(total / this.pageSize()));
        if (this.page() < maxPage) {
            this.page.set(this.page() + 1);
            this.emitPageOptions();
        }
    }

    public onPageSizeChange(size: number) {
        this.pageSize.set(size);
        this.page.set(1);
        this.emitPageOptions();
    }

    private emitPageOptions() {
        this.pageOptions.emit({
            elementsPerPage: this.pageSize(),
            page: this.page()
        });
    }
}
