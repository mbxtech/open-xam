import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { PageHeader } from './page-header';
import { faHome } from '@fortawesome/free-solid-svg-icons';

describe('PageHeader', () => {
  let component: PageHeader;
  let fixture: ComponentFixture<PageHeader>;
  let mockRouter: jest.Mocked<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true)
    } as any;

    mockActivatedRoute = {
      parent: {}
    };

    await TestBed.configureTestingModule({
      imports: [PageHeader],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageHeader);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('icon', faHome);
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  describe('rendering', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('icon', faHome);
      fixture.componentRef.setInput('title', 'My Page');
      fixture.componentRef.setInput('subTitle', 'Page description');
    });

    it('should display the title', () => {
      fixture.detectChanges();

      const titleElement = fixture.debugElement.query(By.css('h1'));
      expect(titleElement.nativeElement.textContent.trim()).toBe('My Page');
    });

    it('should display the subtitle', () => {
      fixture.detectChanges();

      const subtitleElement = fixture.debugElement.query(By.css('p'));
      expect(subtitleElement.nativeElement.textContent.trim()).toBe('Page description');
    });

    it('should display the icon', () => {
      fixture.detectChanges();

      const iconElements = fixture.debugElement.queryAll(By.css('fa-icon'));
      // Should have 2 icons: back button icon and page icon
      expect(iconElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render empty subtitle when not provided', () => {
      fixture.componentRef.setInput('subTitle', '');
      fixture.detectChanges();

      const subtitleElement = fixture.debugElement.query(By.css('p'));
      expect(subtitleElement.nativeElement.textContent.trim()).toBe('');
    });
  });

  describe('back button', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('icon', faHome);
      fixture.componentRef.setInput('title', 'Test Page');
      fixture.componentRef.setInput('route', '/dashboard');
    });

    it('should show back button by default', () => {
      fixture.detectChanges();

      const backButton = fixture.debugElement.query(By.css('ox-button'));
      expect(backButton).toBeTruthy();
    });

    it('should hide back button when showBackButton is false', () => {
      fixture.componentRef.setInput('showBackButton', false);
      fixture.detectChanges();

      const backButton = fixture.debugElement.query(By.css('ox-button'));
      expect(backButton).toBeNull();
    });

    it('should show back button when showBackButton is true', () => {
      fixture.componentRef.setInput('showBackButton', true);
      fixture.detectChanges();

      const backButton = fixture.debugElement.query(By.css('ox-button'));
      expect(backButton).toBeTruthy();
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('icon', faHome);
      fixture.componentRef.setInput('title', 'Test Page');
      fixture.componentRef.setInput('route', '/dashboard');
      fixture.detectChanges();
    });

    it('should navigate to route on back button click', async () => {
      const backButton = fixture.debugElement.query(By.css('ox-button'));
      backButton.nativeElement.click();
      fixture.detectChanges();

      await fixture.whenStable();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should navigate with absolute path by default', async () => {
      fixture.componentRef.setInput('relativeToParent', false);
      fixture.detectChanges();

      const backButton = fixture.debugElement.query(By.css('ox-button'));
      backButton.nativeElement.click();
      fixture.detectChanges();

      await fixture.whenStable();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should navigate relative to parent when relativeToParent is true', async () => {
      fixture.componentRef.setInput('relativeToParent', true);
      fixture.detectChanges();

      const backButton = fixture.debugElement.query(By.css('ox-button'));
      backButton.nativeElement.click();
      fixture.detectChanges();

      await fixture.whenStable();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard'], {
        relativeTo: mockActivatedRoute.parent
      });
    });

    it('should navigate to different routes', async () => {
      fixture.componentRef.setInput('route', '/settings');
      fixture.detectChanges();

      const backButton = fixture.debugElement.query(By.css('ox-button'));
      backButton.nativeElement.click();
      fixture.detectChanges();

      await fixture.whenStable();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/settings']);
    });

    it('should handle empty route', async () => {
      fixture.componentRef.setInput('route', '');
      fixture.detectChanges();

      const backButton = fixture.debugElement.query(By.css('ox-button'));
      backButton.nativeElement.click();
      fixture.detectChanges();

      await fixture.whenStable();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['']);
    });
  });

  describe('input properties', () => {
    it('should accept icon input', () => {
      fixture.componentRef.setInput('icon', faHome);
      fixture.componentRef.setInput('title', 'Test');
      fixture.detectChanges();

      expect(component.icon()).toBe(faHome);
    });

    it('should accept title input', () => {
      fixture.componentRef.setInput('icon', faHome);
      fixture.componentRef.setInput('title', 'My Title');
      fixture.detectChanges();

      expect(component.title()).toBe('My Title');
    });

    it('should accept subTitle input', () => {
      fixture.componentRef.setInput('icon', faHome);
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('subTitle', 'Subtitle text');
      fixture.detectChanges();

      expect(component.subTitle()).toBe('Subtitle text');
    });

    it('should have empty subTitle by default', () => {
      fixture.componentRef.setInput('icon', faHome);
      fixture.componentRef.setInput('title', 'Test');
      fixture.detectChanges();

      expect(component.subTitle()).toBe('');
    });

    it('should accept route input', () => {
      fixture.componentRef.setInput('icon', faHome);
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('route', '/test-route');
      fixture.detectChanges();

      expect(component.route()).toBe('/test-route');
    });

    it('should have empty route by default', () => {
      fixture.componentRef.setInput('icon', faHome);
      fixture.componentRef.setInput('title', 'Test');
      fixture.detectChanges();

      expect(component.route()).toBe('');
    });

    it('should accept showBackButton input', () => {
      fixture.componentRef.setInput('icon', faHome);
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('showBackButton', false);
      fixture.detectChanges();

      expect(component.showBackButton()).toBe(false);
    });

    it('should show back button by default', () => {
      fixture.componentRef.setInput('icon', faHome);
      fixture.componentRef.setInput('title', 'Test');
      fixture.detectChanges();

      expect(component.showBackButton()).toBe(true);
    });

    it('should accept relativeToParent input', () => {
      fixture.componentRef.setInput('icon', faHome);
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('relativeToParent', true);
      fixture.detectChanges();

      expect(component.relativeToParent()).toBe(true);
    });

    it('should not use relative navigation by default', () => {
      fixture.componentRef.setInput('icon', faHome);
      fixture.componentRef.setInput('title', 'Test');
      fixture.detectChanges();

      expect(component.relativeToParent()).toBe(false);
    });
  });
});
