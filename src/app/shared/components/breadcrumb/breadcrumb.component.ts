import { Component, inject } from '@angular/core';
import {RouterLink} from '@angular/router';
import {Breadcrumb, BreadcrumbService} from "../../service/breadcrumb.service";

@Component({
  selector: 'ox-breadcrumb',
  imports: [
    RouterLink
  ],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {
    private readonly _breadcrumbService = inject(BreadcrumbService);

    public get breadcrumbs(): Breadcrumb[] {
        return this._breadcrumbService.breadcrumbs;
    }
}
