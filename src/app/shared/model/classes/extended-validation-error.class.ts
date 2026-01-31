import {IExtendedValidationError} from "../interfaces/extended-validation-error.interface";
import {IValidationResult} from "../interfaces/validation-result.interface";
import ValidationResult from "./validation-result.class";

export default class ExtendedValidationError implements IExtendedValidationError {
    index: number;
    message: string;
    errors: IValidationResult[];
    nestedErrors: IExtendedValidationError[];

    constructor(extendedValidationError: IExtendedValidationError) {
        this.index = extendedValidationError.index;
        this.message = extendedValidationError.message;
        this.errors = extendedValidationError.errors?.length ? extendedValidationError.errors.map(error => new ValidationResult(error)) : [];
        this.nestedErrors = extendedValidationError.nestedErrors?.length ? extendedValidationError.nestedErrors.map(nestedError => new ExtendedValidationError(nestedError)) : [];
    }

    public static isExtendedValidationErrorInstance(error: any): error is ExtendedValidationError {
        return error instanceof ExtendedValidationError;
    }

    public static isExtendedValidationErrorType(error: unknown): boolean {
        return error instanceof Object && ('index' in error || 'message' in error);
    }
}