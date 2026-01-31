import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

import { AdminPageLayout } from './admin-page-layout';

describe('AdminPageLayout', () => {
    let component: AdminPageLayout;
    let fixture: ComponentFixture<AdminPageLayout>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                AdminPageLayout,
                RouterTestingModule
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminPageLayout);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Sidebar', () => {
        it('should render sidebar', () => {
            const sidebar = fixture.debugElement.query(By.css('aside'));
            expect(sidebar).toBeTruthy();
        });

        it('should have navigation items', () => {
            const navItems = fixture.debugElement.queryAll(By.css('nav ul li'));
            expect(navItems.length).toBe(3);
        });

        it('should render Exams nav item', () => {
            const navLinks = fixture.debugElement.queryAll(By.css('nav a'));
            const examsLink = navLinks.find(link =>
                link.nativeElement.getAttribute('href') === '/admin/exam/overview'
            );
            expect(examsLink).toBeTruthy();
        });

        it('should render Categories nav item', () => {
            const navLinks = fixture.debugElement.queryAll(By.css('nav a'));
            const categoriesLink = navLinks.find(link =>
                link.nativeElement.getAttribute('href') === '/admin/categories'
            );
            expect(categoriesLink).toBeTruthy();
        });

        it('should start with sidebar expanded', () => {
            expect(component['sidebarCollapsed']()).toBe(false);
        });

        it('should toggle sidebar when toggle button is clicked', () => {
            const toggleButton = fixture.debugElement.query(By.css('button'));

            toggleButton.triggerEventHandler('click', null);
            fixture.detectChanges();

            expect(component['sidebarCollapsed']()).toBe(true);

            toggleButton.triggerEventHandler('click', null);
            fixture.detectChanges();

            expect(component['sidebarCollapsed']()).toBe(false);
        });

        it('should have collapsed width class when collapsed', () => {
            component['sidebarCollapsed'].set(true);
            fixture.detectChanges();

            const sidebar = fixture.debugElement.query(By.css('aside'));
            expect(sidebar.nativeElement.classList.contains('w-16')).toBe(true);
        });

        it('should have expanded width class when not collapsed', () => {
            component['sidebarCollapsed'].set(false);
            fixture.detectChanges();

            const sidebar = fixture.debugElement.query(By.css('aside'));
            expect(sidebar.nativeElement.classList.contains('w-64')).toBe(true);
        });

        it('should hide nav labels when collapsed', () => {
            component['sidebarCollapsed'].set(true);
            fixture.detectChanges();

            const navLabels = fixture.debugElement.queryAll(By.css('nav a span'));
            expect(navLabels.length).toBe(0);
        });

        it('should show nav labels when expanded', () => {
            component['sidebarCollapsed'].set(false);
            fixture.detectChanges();

            const navLabels = fixture.debugElement.queryAll(By.css('nav a span'));
            expect(navLabels.length).toBe(3);
        });
    });

    describe('Main Content', () => {
        it('should render main content area', () => {
            const main = fixture.debugElement.query(By.css('main'));
            expect(main).toBeTruthy();
        });

        it('should render router outlet', () => {
            const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));
            expect(routerOutlet).toBeTruthy();
        });
    });
});
