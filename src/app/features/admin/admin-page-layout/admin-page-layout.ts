import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
    faChevronLeft,
    faChevronRight,
    faEye,
    faEyeSlash,
    faFileImport,
    faFolderTree,
    faLayerGroup,
    IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import { signal, WritableSignal } from '@angular/core';
import { SidebarService } from './service/sidebar.service';
import { Observable } from 'rxjs';
import { ToggleGroup } from "../../../shared/forms/toggle-group/toggle-group";
import { ButtonComponent } from "../../../shared/components/button/button.component";

interface NavItem {
    label: string;
    route: string;
    icon: IconDefinition;
}

@Component({
    selector: 'ox-admin-page-layout',
    imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FaIconComponent,
    AsyncPipe,
    ButtonComponent
],
    templateUrl: './admin-page-layout.html',
    styleUrl: './admin-page-layout.scss'
})
export class AdminPageLayout {

    protected readonly faChevronLeft = faChevronLeft;
    protected readonly faChevronRight = faChevronRight;
    protected readonly faEye = faEye;
    protected readonly faEyeSlash = faEyeSlash;

    protected sidebarCollapsed: WritableSignal<boolean> = signal(false);
    private _sidebarService: SidebarService = inject(SidebarService);

    protected navItems: NavItem[] = [
        {
            label: $localize`:@@ox.admin.nav.exams:Exams`,
            route: '/admin/exam/overview',
            icon: faFolderTree
        },
        {
            label: $localize`:@@ox.admin.nav.imports:Failed Imports`,
            route: '/admin/exam/imports',
            icon: faFileImport
        },
        {
            label: $localize`:@@ox.admin.nav.categories:Categories`,
            route: '/admin/categories',
            icon: faLayerGroup
        }
    ];

    protected toggleSidebar(): void {
        this.sidebarCollapsed.update(collapsed => !collapsed);
    }

    protected toggleStickyBottombar(): void {
        this._sidebarService.toggleStickyBottombar();
    }

    protected stickyBottombarState(): Observable<boolean> {
        return this._sidebarService.bottombarVisible$();
    }

    public get isEditPage(): Observable<boolean> {
        return this._sidebarService.isExamEditPage;
    }
}
