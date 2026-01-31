import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {BehaviorSubject} from 'rxjs';

import {ToastComponent} from './toast.component';
import {ToastService} from '../../service/toast.service';
import {IToast} from '../../model/interfaces/toast.interface';

class ToastServiceMock {
  public toasts$ = new BehaviorSubject<IToast[]>([]);
  public remove = jest.fn();
}

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let service: ToastServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [{provide: ToastService, useClass: ToastServiceMock}],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ToastService) as unknown as ToastServiceMock;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render toasts from service and remove on close click', () => {
    const t1: IToast = {title: 'T1', message: 'M1', type: 'success', date: new Date()};
    const t2: IToast = {title: 'T2', message: 'M2', type: 'danger', date: new Date()};
    service.toasts$.next([t1, t2]);
    fixture.detectChanges();

    const toastEls = fixture.debugElement.queryAll(By.css('.toast'));
    expect(toastEls.length).toBe(2);
    expect(toastEls[0].nativeElement.textContent).toContain('T1');
    expect(toastEls[1].nativeElement.textContent).toContain('T2');

    const closeButtons = fixture.debugElement.queryAll(By.css('.btn-close'));
    closeButtons[1].triggerEventHandler('click', new MouseEvent('click'));
    expect(service.remove).toHaveBeenCalledWith(1);
  });

  it('should apply correct classes for different toast types', () => {
    const types: IToast['type'][] = ['success', 'danger', 'warning', 'info'];
    const toasts: IToast[] = types.map(t => ({
      title: t as string,
      message: 'msg',
      type: t,
      date: new Date()
    }));
    
    service.toasts$.next(toasts);
    fixture.detectChanges();
    
    const toastEls = fixture.debugElement.queryAll(By.css('.toast'));
    expect(toastEls[0].nativeElement.classList).toContain('bg-success-50');
    expect(toastEls[1].nativeElement.classList).toContain('bg-error-50');
    expect(toastEls[2].nativeElement.classList).toContain('bg-warning-50');
    expect(toastEls[3].nativeElement.classList).toContain('bg-brand-50');
  });
});
