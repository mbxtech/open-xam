import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvalidFieldsControls } from './invalid-fields-controls';

describe('InvalidFieldsControls', () => {
  let component: InvalidFieldsControls;
  let fixture: ComponentFixture<InvalidFieldsControls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvalidFieldsControls]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvalidFieldsControls);
    component = fixture.componentInstance;

    // Set required inputs before detectChanges
    fixture.componentRef.setInput('show', true);
    fixture.componentRef.setInput('countElements', 5);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

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

  it('should increment currentIndex when next is called', () => {
    expect(component['currentIndex']()).toBe(1);
    component['next']();
    expect(component['currentIndex']()).toBe(2);
  });

  it('should decrement currentIndex when prev is called', () => {
    component['currentIndex'].set(3);
    component['prev']();
    expect(component['currentIndex']()).toBe(2);
  });

  it('should hide when show input is false', () => {
    fixture.componentRef.setInput('show', false);
    fixture.detectChanges();
    expect(component.show()).toBe(false);
  });

  it('should display correct count of elements', () => {
    expect(component.countElements()).toBe(5);
  });
});
