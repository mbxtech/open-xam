import { TestBed } from '@angular/core/testing';

import { BreadcrumbService } from './breadcrumb.service';
import {provideRouter} from "@angular/router";
import {routes} from "../../app.routes";
import {RouterTestingHarness} from "@angular/router/testing";
import {provideIndexedDb} from "ngx-indexed-db";

describe('BreadcrumbService', () => {
  let service: BreadcrumbService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideIndexedDb()]
    });
    service = TestBed.inject(BreadcrumbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create breadcrumbs on event', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/exam/overview');

    expect(service.breadcrumbs).toBeDefined();
    expect(service.breadcrumbs.length).toBe(3);
  });


});
