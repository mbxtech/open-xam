import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BadgeComponent, BadgeType } from './badge.component';

@Component({
  template: `<ox-badge [variant]="variant">Badge Content</ox-badge>`,
  imports: [BadgeComponent]
})
class TestHostComponent {
  variant: BadgeType = 'primary';
}

describe('BadgeComponent', () => {
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent, TestHostComponent]
    })
    .compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
  });

  it('should render content', () => {
    const badgeElement = hostFixture.debugElement.query(By.css('ox-badge'));
    expect(badgeElement.nativeElement.textContent).toContain('Badge Content');
  });

  it('should apply primary classes by default', () => {
    const badgeSpan = hostFixture.debugElement.query(By.css('span'));
    expect(badgeSpan.nativeElement.classList).toContain('bg-brand-primary');
    expect(badgeSpan.nativeElement.classList).toContain('text-white');
  });

  it('should apply secondary classes when variant is secondary', () => {
    hostComponent.variant = 'secondary';
    hostFixture.detectChanges();
    const badgeSpan = hostFixture.debugElement.query(By.css('span'));
    expect(badgeSpan.nativeElement.classList).toContain('bg-neutral-100');
    expect(badgeSpan.nativeElement.classList).toContain('text-neutral-900');
  });

  it('should apply destructive classes when variant is destructive', () => {
    hostComponent.variant = 'destructive';
    hostFixture.detectChanges();
    const badgeSpan = hostFixture.debugElement.query(By.css('span'));
    expect(badgeSpan.nativeElement.classList).toContain('bg-error-500');
  });

  it('should apply outlined classes when variant is outlined', () => {
    hostComponent.variant = 'outlined';
    hostFixture.detectChanges();
    const badgeSpan = hostFixture.debugElement.query(By.css('span'));
    expect(badgeSpan.nativeElement.classList).toContain('text-default-font');
    // Outlined doesn't have a bg- class in the implementation
    expect(badgeSpan.nativeElement.classList).not.toContain('bg-brand-primary');
    expect(badgeSpan.nativeElement.classList).not.toContain('bg-neutral-100');
    expect(badgeSpan.nativeElement.classList).not.toContain('bg-error-500');
  });
});
