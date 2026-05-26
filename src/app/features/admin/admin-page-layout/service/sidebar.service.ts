import { inject, Injectable } from "@angular/core";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";
import { BehaviorSubject, filter, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SidebarService {
  private readonly _isExamEditPage$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  private readonly _isStickyBottombarVisible: BehaviorSubject<boolean> =
    new BehaviorSubject(true);

  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe((event) => {
        console.log("Navigating TO:", event.url);
        this._isExamEditPage$.next(event.url.includes("exam/edit"));
      });

    // Fires AFTER navigation completes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this._isExamEditPage$.next(event.url.includes("exam/edit"));
      });
  }

  public toggleStickyBottombar() {
    this._isStickyBottombarVisible.next(!this._isStickyBottombarVisible.value);
  }

  public bottombarVisible$(): Observable<boolean> {
    return this._isStickyBottombarVisible.asObservable();
  }

  get isExamEditPage(): Observable<boolean> {
    return this._isExamEditPage$.asObservable();
  }
}
