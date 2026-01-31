import {
    Component, computed, ContentChild, HostListener, input, InputSignal, output,
    OutputEmitterRef, signal, WritableSignal
} from '@angular/core';
import { DialogContentComponent } from './dialog-content.component';
import { DialogFooterComponent } from './dialog-footer.component';
import { DialogHeaderComponent } from './dialog-header.component';
import {ButtonComponent} from '../button/button.component';

export interface DialogState {
    title: string;
    open: boolean;
    message: string;
    onSubmit: (event: unknown) => void;
    onAbort: (event: unknown) => void;
    abortLabel: string;
    submitLabel: string;
}

@Component({
    selector: 'ox-dialog',
    imports: [
        ButtonComponent
    ],
    templateUrl: './dialog.component.html',
    styleUrl: './dialog.component.scss'
})
export class DialogComponent {
    public title: InputSignal<string> = input<string>('');
    public submitLabel: InputSignal<string> = input<string>('');
    public cancelLabel: InputSignal<string> = input<string>('');
    public isOpen: InputSignal<boolean> = input<boolean>(false);
    private _open: WritableSignal<boolean> = signal<boolean>(false);
    protected open = computed(() => this._open() || this.isOpen());

    public closed: OutputEmitterRef<unknown> = output<unknown>();
    public cancelled: OutputEmitterRef<unknown> = output<unknown>();
    public submitted: OutputEmitterRef<unknown> = output<unknown>();

    @ContentChild(DialogHeaderComponent) private header?: DialogHeaderComponent;
    @ContentChild(DialogContentComponent) private content?: DialogContentComponent;
    @ContentChild(DialogFooterComponent) private footer?: DialogFooterComponent;

    protected get hasHeader(): boolean {
        return !!this.header;
    }

    protected get hasContent(): boolean {
        return !!this.content;
    }

    protected get hasFooter(): boolean {
        return !!this.footer;
    }

    @HostListener('document:keydown', ['$event'])
    onEscape(event: KeyboardEvent) {
        if (this.open() && event.key === 'Escape') {
            this.handleCancel(event as unknown as Event);
        }
    }

    public handleSubmit(_: Event): void {
        this.submitted.emit(true);
        this.closed.emit(true);
    }

    public handleCancel(_: Event): void {
        this.cancelled.emit(true);
        this.closed.emit(true);
        this._open.set(false);
    }
}
