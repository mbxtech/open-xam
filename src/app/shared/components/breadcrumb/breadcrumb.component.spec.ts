import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';

import {BreadcrumbComponent} from './breadcrumb.component';
import {BreadcrumbService, Breadcrumb} from '../../service/breadcrumb.service';
import {provideRouter, RouterLink} from "@angular/router";
import {routes} from "../../../app.routes";

class BreadcrumbServiceMock {
  private _breadcrumbs: Breadcrumb[] = [
    {label: 'Home', url: '/'},
    {label: 'Admin', url: '/admin'},
  ];

  get breadcrumbs(): Breadcrumb[] {
    return this._breadcrumbs;
  }
}

describe('BreadcrumbComponent', () => {
  let component: BreadcrumbComponent;
  let fixture: ComponentFixture<BreadcrumbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [{provide: BreadcrumbService, useClass: BreadcrumbServiceMock}, provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render breadcrumb items from service', () => {
    // Note: The template always has a static "Home" link, then the items from the service.
    // However, the current template doesn't use "breadcrumb-item" class.
    // It uses li.inline-flex.items-center
    const items = fixture.debugElement.queryAll(By.css('li.inline-flex.items-center'));
    // 1 (static Home) + 2 (from service) = 3
    expect(items.length).toBe(3);
    expect(items[1].nativeElement.textContent).toContain('Home');
    expect(items[2].nativeElement.textContent).toContain('Admin');
  });

  it('should have correct routerLinks', () => {
    const linkDebugElements = fixture.debugElement.queryAll(By.directive(RouterLink));
    const links = linkDebugElements.map(de => de.injector.get(RouterLink));
    
    expect(links.length).toBe(2);
    expect(links[0].href).toBe('/');
    expect(links[1].href).toBe('/admin');
  });
});
