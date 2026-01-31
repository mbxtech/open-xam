import {FormGroup} from '@angular/forms';

interface ValidationError {
    key: string,
    message: string
}

export default class FormErrorMessageExtractor {

    public static extractMessagesAsArray(form: FormGroup): ValidationError[] {
        return Object.keys(form.controls).map(key => ({key, message: form.getError(key)}));
    }

    public static extractMessagesAsString(formGroup: FormGroup): string {
        const array = FormErrorMessageExtractor.extractMessagesAsArray(formGroup);
        return array.map(error => error.message).join(', ');
    }
}