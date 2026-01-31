import { ElementInView } from './element-in-view';
import { ElementRef } from '@angular/core';
import {TestBed} from "@angular/core/testing";


describe('ElementInView Directive', () => {
  let directive: ElementInView;
  let elementRef: ElementRef<HTMLElement>;

  let observeSpy: jest.Mock;
  let unobserveSpy: jest.Mock;
  let ioCallback: IntersectionObserverCallback;

  beforeEach(() => {
    observeSpy = jest.fn();
    unobserveSpy = jest.fn();

    (global as any).IntersectionObserver = jest.fn(
        (cb: IntersectionObserverCallback) => {
          ioCallback = cb;
          return {
            observe: observeSpy,
            unobserve: unobserveSpy,
            disconnect: jest.fn()
          };
        }
    );

    elementRef = new ElementRef(document.createElement('div'));

    TestBed.configureTestingModule({
      providers: [
        { provide: ElementRef, useValue: elementRef }
      ]
    });

    TestBed.runInInjectionContext(() => {
      directive = new ElementInView();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create directive', () => {
    expect(directive).toBeTruthy();
  });

  it('should observe element on init', () => {
    directive.ngOnInit();

    expect(observeSpy).toHaveBeenCalledWith(elementRef.nativeElement);
  });

  it('should emit true when element enters view', () => {
    const emitSpy = jest.spyOn(directive.inView, 'emit');

    directive.ngOnInit();

    ioCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
    );

    expect(emitSpy).toHaveBeenCalledWith(true);
  });

  it('should unobserve element on destroy', () => {
    directive.ngOnInit();
    directive.ngOnDestroy();

    expect(unobserveSpy).toHaveBeenCalledWith(elementRef.nativeElement);
  });
});