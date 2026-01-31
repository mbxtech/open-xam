import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StickyBottomBar } from './sticky-bottom-bar.component';

describe('StickyBottomBar', () => {
  let component: StickyBottomBar;
  let fixture: ComponentFixture<StickyBottomBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StickyBottomBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StickyBottomBar);
    component = fixture.componentInstance;

    // Set required inputs before detectChanges
    fixture.componentRef.setInput('showErrorControls', true);
    fixture.componentRef.setInput('countErrorElements', 5);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Navigation', () => {
    it('should emit indexChanged when next is called', () => {
      const spy = jest.spyOn(component.indexChanged, 'emit');
      component['next']();
      expect(spy).toHaveBeenCalledWith(2);
    });

    it('should emit indexChanged when prev is called', () => {
      component['currentIndex'].set(3);
      const spy = jest.spyOn(component.indexChanged, 'emit');
      component['prev']();
      expect(spy).toHaveBeenCalledWith(2);
    });

    it('should not go past countErrorElements when next is called', () => {
      component['currentIndex'].set(5);
      const spy = jest.spyOn(component.indexChanged, 'emit');
      component['next']();
      expect(spy).not.toHaveBeenCalled();
      expect(component['currentIndex']()).toBe(5);
    });

    it('should not go below 1 when prev is called', () => {
      component['currentIndex'].set(1);
      const spy = jest.spyOn(component.indexChanged, 'emit');
      component['prev']();
      expect(spy).not.toHaveBeenCalled();
      expect(component['currentIndex']()).toBe(1);
    });
  });

  describe('Actions', () => {
    it('should emit saveClicked when save is called', () => {
      const spy = jest.spyOn(component.saveClicked, 'emit');
      component['save']();
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('should emit cancelClicked when cancel is called', () => {
      const spy = jest.spyOn(component.cancelClicked, 'emit');
      component['cancel']();
      expect(spy).toHaveBeenCalledWith(true);
    });
  });

  describe('Input handling', () => {
    it('should display correct count of error elements', () => {
      expect(component.countErrorElements()).toBe(5);
    });

    it('should show error controls when showErrorControls is true', () => {
      expect(component.showErrorControls()).toBe(true);
    });

    it('should hide error controls when showErrorControls is false', () => {
      fixture.componentRef.setInput('showErrorControls', false);
      fixture.detectChanges();
      expect(component.showErrorControls()).toBe(false);
    });
  });
});
