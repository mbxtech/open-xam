import {
    Directive,
    ElementRef,
    inject,
    input,
    InputSignal,
    OnDestroy,
    OnInit,
    output,
    OutputEmitterRef
} from '@angular/core';

@Directive({
    selector: '[oxElementInView]',
})
export class ElementInView implements OnInit, OnDestroy {
    public inView: OutputEmitterRef<boolean> = output();
    public threshold: InputSignal<number> = input(0.5);
    public rootElement = input<Element | null>(null);

    private observer!: IntersectionObserver;
    private _el: ElementRef = inject(ElementRef);

    ngOnInit(): void {
        const options: IntersectionObserverInit = {
            root: this.rootElement(),
            rootMargin: '0px',
            threshold: this.threshold()
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.inView.emit(entry.isIntersecting);
            });
        }, options);

        this.observer.observe(this._el.nativeElement);
    }

    ngOnDestroy(): void {
        this.observer.unobserve(this._el.nativeElement);
    }

}
