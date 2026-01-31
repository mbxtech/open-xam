export interface IValidationErrors {
    field: string;
    message: string;
}

export interface CrudErrorInterface {
    validationErrors: IValidationErrors[];
    message: string;
}