import {error, info, warn} from '@tauri-apps/plugin-log';

export default class Logger {

    private readonly logTag: string = 'App';
    constructor(logTag?: string) {
        this.logTag = logTag ?? '';
    }

    private _isJest: boolean = typeof window === 'undefined';
    private _logLoggingError = (type: string, err: unknown) => {
        const errorMessage = this.getErrorMessage(err);
        console.error(`[LoggingError] Tauri Type [${type}] ${errorMessage}`);
        error(`[Error] Tauri Type [${type}] failed`).catch(() => {/*ignored*/
        });
    }
    private _logInfoErrorHandler = this._isJest ? () => {
    } : this._logLoggingError.bind(null, 'InfoLog');
    private _logErrorErrorHandler = this._isJest ? () => {
    } : this._logLoggingError.bind(null, 'ErrorLog');
    private _logWarnErrorHandler = this._isJest ? () => {
    } : this._logLoggingError.bind(null, 'WarnLog');

    private getErrorMessage(error: unknown): string {
        if (typeof error === 'string') {
            return error;
        }
        return error instanceof Error ? error.message : JSON.stringify(error);
    }

    public logInfo(str: string, prefix?: string): void {
        const string = prefix ? `${prefix}: ${str}` : str;
        const message = `${this.logTag} ${string}`;
        console.log(message);
        info(message).catch(this._logInfoErrorHandler);
    }

    public logError(err: unknown, obj?: unknown): void {
        let message;

        if (typeof err === 'string' && obj) {
            const space = err.at(-1) === ' ' ? '' : ' ';
            let actualError: string = '';
            try {
                if (obj) {
                    actualError = this.getErrorMessage(obj);
                }

            } catch (e: unknown) {
                actualError = this.getErrorMessage(e);
            }

            message = `${err}${space}${actualError}`;

        } else {
            message = this.getErrorMessage(err);
        }

        message = `${this.logTag} ${message}`;
        console.error(message);
        error(message).catch(this._logErrorErrorHandler);
    }

    public logWarn(str: string, prefix?: string): void {
        const string = prefix ? `${prefix}: ${str}` : str;
        const message = `${this.logTag} ${string}`;
        console.warn(message);
        warn(message).catch(this._logWarnErrorHandler);
    }

}