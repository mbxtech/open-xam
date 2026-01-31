import {TestBed} from '@angular/core/testing';

import {ToastService} from './toast.service';
import {Observable} from "rxjs";

describe('ToastService', () => {
    let service: ToastService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ToastService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add toast message', () => {
        service.add({
            date: new Date(),
            message: 'Test',
            title: 'Test',
            type: 'primary'
        });

        expect(service.toasts.length).toBe(1);
        expect(service.toasts[0].message).toBe('Test');
        expect(service.toasts[0].title).toBe('Test');
        expect(service.toasts[0].type).toBe('primary');
        expect(service.toasts[0].date).toBeDefined();
    });

    it('should add success toast message', () => {
        service.addSuccessToast('Test', 'Test');

        expect(service.toasts.length).toBe(1);
        expect(service.toasts[0].message).toBe('Test');
        expect(service.toasts[0].title).toBe('Test');
        expect(service.toasts[0].type).toBe('success');
        expect(service.toasts[0].date).toBeDefined();
    });

    it('should add error toast message', () => {
        service.addErrorToast('Test Err', 'Test Err');

        expect(service.toasts.length).toBe(1);
        expect(service.toasts[0].message).toBe('Test Err');
        expect(service.toasts[0].title).toBe('Test Err');
        expect(service.toasts[0].type).toBe('danger');
        expect(service.toasts[0].date).toBeDefined();
    });

    it('should remove toast message', () => {
        service.add({
            date: new Date(),
            message: 'Test 1',
            title: 'Test 1',
            type: 'primary'
        });
        service.add({
            date: new Date(),
            message: 'Test 2',
            title: 'Test 2',
            type: 'primary'
        });

        expect(service.toasts.length).toBe(2);
        service.remove(1);
        expect(service.toasts.length).toBe(1);
        expect(service.toasts[0].message).toBe('Test 1');
    });

    it('should clear toast messages', () => {
        service.add({
            date: new Date(),
            message: 'Test 1',
            title: 'Test 1',
            type: 'primary'
        });
        service.add({
            date: new Date(),
            message: 'Test 1',
            title: 'Test 1',
            type: 'primary'
        });

        expect(service.toasts.length).toBe(2);
        service.clear();
        expect(service.toasts.length).toBe(0);
    });

    it('should get toast messages as observable', () => {
        service.add({
            date: new Date(),
            message: 'Test 1',
            title: 'Test 1',
            type: 'primary'
        });

        expect(service.toasts.length).toBe(1);

        expect(service.toasts$).toBeDefined();
        expect(service.toasts$).toBeInstanceOf(Observable);
    });

});
