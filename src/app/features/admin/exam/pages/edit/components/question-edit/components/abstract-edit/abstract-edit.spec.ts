import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbstractEdit } from './abstract-edit';

describe('AbstractEdit', () => {
  let component: AbstractEdit;
  let fixture: ComponentFixture<AbstractEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbstractEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbstractEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
