import {CrudErrorInterface, IValidationErrors} from "../interfaces/crud-error.interface";
import ValidationError from "./validation-error.class";

export default class CurdError implements CrudErrorInterface {
    validationErrors: IValidationErrors[];
    message: string;

    constructor(error: CrudErrorInterface) {
        if (error.validationErrors.length) {
            this.validationErrors = error.validationErrors.map(validationError => new ValidationError(validationError));
        }
        this.validationErrors = error.validationErrors;
        this.message = error.message;
    }

    public static isCrudeErrorInstance(error: any): error is CurdError {
        return error instanceof CurdError;
    }

    public static isCrudErrorType(err: unknown): boolean {
        if (err === null) return false;
        if (typeof err !== 'object') return false;
        return 'message' in err || 'validationErrors' in err;
    }
}