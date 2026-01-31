import {CrudErrorInterface} from "../interfaces/crud-error.interface";
import CurdError from "./curd-error.class";
import {IExtendedValidationError} from "../interfaces/extended-validation-error.interface";
import ExtendedValidationError from "./extended-validation-error.class";

export default class IpcErrorHandler {

    public static formatError(error: unknown): string {
        return this.getErrorMessage(error);
    }

    private static getErrorMessage(error: unknown): string {
        if (typeof error === 'string') {
            return error;
        } else if (error instanceof Error) {
            return error.message;
        } else if (CurdError.isCrudeErrorInstance(error) || CurdError.isCrudErrorType(error)) {
            return this.formatCrudError(error as CrudErrorInterface);
        } else if (ExtendedValidationError.isExtendedValidationErrorInstance(error) || ExtendedValidationError.isExtendedValidationErrorType(error)) {
            return this.formatExtendedValidationError(error as IExtendedValidationError);
        }

        return JSON.stringify(error);
    }

    private static formatExtendedValidationError(
        error: IExtendedValidationError,
        indentLevel: number = 0
    ): string {
        const indent = "  ".repeat(indentLevel);
        let result = `${indent}- Index ${error.index}: ${error.message}`;

        if (error.errors && error.errors.length > 0) {
            for (const validationError of error.errors) {
                result += `\n${indent}  • ${validationError.message}`;
            }
        }

        if (error.nestedErrors && error.nestedErrors.length > 0) {
            for (const nested of error.nestedErrors) {
                result += `\n${IpcErrorHandler.formatExtendedValidationError(nested, indentLevel + 1)}`;
            }
        }

        return result;
    }

    private static formatCrudError(error: CrudErrorInterface): string {
        const lines: string[] = [];

        lines.push(error.message);

        if (error.validationErrors?.length) {
            lines.push("Details:");
            for (const ve of error.validationErrors) {
                lines.push(`  • ${ve.field}: ${ve.message}`);
            }
        }

        return lines.join("\n");
    }

}