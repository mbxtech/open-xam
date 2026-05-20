import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";
import { BehaviorSubject, filter, Observable } from "rxjs";

@Injectable()
export class SidebarService {
    private _isExamEditPage$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private _isStickyButtombarHidden: BehaviorSubject<boolean> = new BehaviorSubject(false);

    private router = inject(Router);

    constructor() {
        this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(event => {
        console.log('Navigating TO:', event.url);
            this._isExamEditPage$.next(event.url.includes('exam/edit'));
      });

    // Fires AFTER navigation completes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        console.log('Current URL:', event.urlAfterRedirects);
      });
    }

    public toggleStickyBottombar() {
        this._isStickyButtombarHidden.next(!this._isStickyButtombarHidden.value);
    }

    public bottombarVisible$(): Observable<boolean> {
        return this._isStickyButtombarHidden.asObservable();
    }

    get isExamEditPage(): Observable<boolean> {
        return this._isStickyButtombarHidden.asObservable();
    }

}