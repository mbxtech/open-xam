import {IValidationResult} from "./validation-result.interface";

export interface IExtendedValidationError {
    index: number;
    message: string;
    errors: IValidationResult[];
    nestedErrors: IExtendedValidationError[];
}