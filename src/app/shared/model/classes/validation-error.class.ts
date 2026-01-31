import {IValidationErrors} from "../interfaces/crud-error.interface";

export default class ValidationError implements IValidationErrors {
    field: string;
    message: string;

    constructor(validationError: IValidationErrors) {
        this.field = validationError.field;
        this.message = validationError.message;
    }

}