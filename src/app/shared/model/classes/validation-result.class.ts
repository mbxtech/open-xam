import {IValidationResult} from "../interfaces/validation-result.interface";

export default class ValidationResult implements IValidationResult{
    field: string;
    message: string;

    constructor(validationResult: IValidationResult) {
        this.field = validationResult.field;
        this.message = validationResult.message;
    }

}