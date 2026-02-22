import { invoke } from "@tauri-apps/api/core";
import { BehaviorSubject, catchError, finalize, from, Observable, of } from "rxjs";
import Logger from "../util/Logger";
import IpcErrorHandler from "../model/classes/ipc-error-handler.class";

export class BaseService {

    private readonly _errors$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
    private readonly _loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    protected readonly logger = new Logger('BaseService');

    protected invoke$<T>(handler: string, params?: any): Observable<T | null> {
        if (!params) {
            return from(invoke<T>(handler)).pipe(
                finalize(() => this.loading = false),
                catchError(error => {
                    this.logger.logError(error);
                    this.addError(IpcErrorHandler.formatError(error));
                    return of(null);
                })
            );
        }

        return from(invoke<T>(handler, params)).pipe(
            finalize(() => this.loading = false),
            catchError(error => {
                this.logger.logError(error);
                this.addError(IpcErrorHandler.formatError(error));
                return of(null);
            })
        );
    }

    protected setInitialStates() {
        this._errors$.next([]);
        this._loading$.next(false);
    }

    protected addError(error: any) {
        this._errors$.next([...this._errors$.value, error]);
    }

    public get errors$() {
        return this._errors$.asObservable();
    }

    public get loading$() {
        return this._loading$.asObservable();
    }

    protected set loading(value: boolean) {
        this._loading$.next(value);
    }
}
