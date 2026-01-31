import {ValidatorFn, Validators} from '@angular/forms';

export const TEXT_REGEX = /^[\p{L}\p{M}\p{N}\s.:\\/,!?'"()\-–—…&]+$/u;
export const NAME_VALIDATORS: ValidatorFn[] = [Validators.required, Validators.pattern(/^[A-Za-z 0-9-]+$/), Validators.minLength(5)]
export const TEXT_VALIDATORS: ValidatorFn[] = [Validators.required, Validators.minLength(5),
    Validators.pattern(/^[\p{L}\p{M}\p{N}\s.:\\/,!?'"()\-–—…&]+$/u)]