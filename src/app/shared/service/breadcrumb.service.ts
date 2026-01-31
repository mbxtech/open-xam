import {inject, Injectable, signal} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs';

export interface Breadcrumb {
  label: string;
  url: string;
  skip?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private _breadcrumbs = signal<Breadcrumb[]>([]);
  private _router: Router = inject(Router);
  private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);

  constructor() {
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this._breadcrumbs.set(this.createBreadcrumbs(this._activatedRoute.root));
    });
  }

  private createBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: Array<Breadcrumb> = []): Array<Breadcrumb> {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      const label = child.snapshot.data['breadcrumb'];
      if (label) {
        breadcrumbs.push({ label, url });
      }
      this.createBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  public get breadcrumbs(): Breadcrumb[] {
    return this._breadcrumbs();
  }
}
