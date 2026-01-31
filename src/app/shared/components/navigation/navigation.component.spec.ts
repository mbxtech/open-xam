import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {NavigationComponent} from './navigation.component';
import {provideRouter} from "@angular/router";
import {routes} from "../../../app.routes";

describe('NavigationComponent', () => {
    let component: NavigationComponent;
    let fixture: ComponentFixture<NavigationComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NavigationComponent],
            providers: [provideRouter(routes)]
        }).compileComponents();

        fixture = TestBed.createComponent(NavigationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle menu collapsed state on toggler click', () => {
        const toggler = fixture.debugElement.query(By.css('button[aria-label="Toggle navigation"]'));
        expect(component["isMenuCollapsed"]).toBeTruthy();
        expect(toggler.attributes['aria-expanded']).toBe('false');

        toggler.triggerEventHandler('click', new MouseEvent('click'));
        fixture.detectChanges();

        expect(component["isMenuCollapsed"]).toBeFalsy();
        expect(toggler.attributes['aria-expanded']).toBe('true');

        // clicking a nav link should collapse the menu
        const examsLinks = fixture.debugElement.queryAll(By.css('a[routerLink="/exam/overview"]'));
        // Take the first one (desktop)
        examsLinks[0].triggerEventHandler('click', new MouseEvent('click'));
        fixture.detectChanges();
        expect(component["isMenuCollapsed"]).toBeTruthy();
    });

    it('should have correct navigation links', () => {
        const links = fixture.debugElement.queryAll(By.css('a[routerLink]'));
        const hrefs = links.map(link => link.attributes['routerLink']);
        expect(hrefs).toContain('/exam/overview');
    });
});
