import {TestBed} from '@angular/core/testing';

import {BaseService} from './base-service';
import {mockIPC} from "@tauri-apps/api/mocks";
import {firstValueFrom, lastValueFrom, Observable} from "rxjs";

class BaseServiceMock extends BaseService {
    constructor() {
        super();
    }

    public setInitialStatesMock(): void {
        this.setInitialStates();
    }

    public invoke(handler: string, payload: any, error?: boolean): Observable<unknown> {
        mockIPC((cmd, payload) => {
            if (cmd === handler && error) {
                return Promise.reject(payload);
            }
            return Promise.resolve(payload);
        });


        return this.invoke$(handler, payload)
    }
}

describe('BaseService', () => {
    let service: BaseServiceMock;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = new BaseServiceMock();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set initial state', async () => {
        let loadingState: boolean;
        let errorsState: any[];

        let result = await lastValueFrom(service.invoke('test', {
            value: 'some error'
        }, true));

        expect(result).toBeNull()
        loadingState = await firstValueFrom(service.loading$);
        expect(loadingState).toBe(false);
        errorsState = await firstValueFrom(service.errors$);
        expect(errorsState).not.toBeNull();
        expect(errorsState.length).toEqual(1);
        expect(errorsState[0]).toEqual("{\"value\":\"some error\"}");

        service.setInitialStatesMock();

        loadingState = await firstValueFrom(service.loading$);
        errorsState = await firstValueFrom(service.errors$);

        expect(loadingState).toBe(false);
        expect(errorsState).not.toBeNull();
        expect(errorsState.length).toEqual(0);

    });

    describe('Invoke with params', () => {
        it('should invoke successfully', async () => {
            let loadingState = await firstValueFrom(service.loading$);
            let errorsState = await firstValueFrom(service.errors$);

            expect(loadingState).toBe(false);
            expect(errorsState).not.toBeNull();
            expect(errorsState.length).toEqual(0);

            let result = await lastValueFrom(service.invoke('test', {
                value: 'some value'
            }));

            expect(result).toEqual({value: 'some value'});
            loadingState = await firstValueFrom(service.loading$);
            expect(loadingState).toBe(false);
            errorsState = await firstValueFrom(service.errors$);
            expect(errorsState).not.toBeNull();
            expect(errorsState.length).toEqual(0);
        });

        it('should invoke error', async () => {
            let loadingState = await firstValueFrom(service.loading$);
            let errorsState = await firstValueFrom(service.errors$);

            expect(loadingState).toBe(false);
            expect(errorsState).not.toBeNull();
            expect(errorsState.length).toEqual(0);

            let result = await lastValueFrom(service.invoke('test', {
                value: 'some error'
            }, true));

            expect(result).toBeNull()
            loadingState = await firstValueFrom(service.loading$);
            expect(loadingState).toBe(false);
            errorsState = await firstValueFrom(service.errors$);
            expect(errorsState).not.toBeNull();
            expect(errorsState.length).toEqual(1);
            expect(errorsState[0]).toEqual("{\"value\":\"some error\"}");
        });
    });

    describe('Invoke without params', () => {
        it('should invoke successfully', async () => {
            let loadingState = await firstValueFrom(service.loading$);
            let errorsState = await firstValueFrom(service.errors$);

            expect(loadingState).toBe(false);
            expect(errorsState).not.toBeNull();
            expect(errorsState.length).toEqual(0);

            let result = await lastValueFrom(service.invoke('test', null));

            expect(result).toBeDefined();
            loadingState = await firstValueFrom(service.loading$);
            expect(loadingState).toBe(false);
            errorsState = await firstValueFrom(service.errors$);
            expect(errorsState).not.toBeNull();
            expect(errorsState.length).toEqual(0);
        });

        it('should invoke error', async () => {
            let loadingState = await firstValueFrom(service.loading$);
            let errorsState = await firstValueFrom(service.errors$);

            expect(loadingState).toBe(false);
            expect(errorsState).not.toBeNull();
            expect(errorsState.length).toEqual(0);

            let errorResult = await lastValueFrom(service.invoke('test', {
                value: 'some error'
            }, true));

            expect(errorResult).toBeDefined()
            loadingState = await firstValueFrom(service.loading$);
            expect(loadingState).toBe(false);
            errorsState = await firstValueFrom(service.errors$);
            expect(errorsState).not.toBeNull();
            expect(errorsState.length).toEqual(1);
            expect(errorsState[0]).toEqual("{\"value\":\"some error\"}");
        });
    });
});
