import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'strippedText'
})
export class StrippedTextPipe implements PipeTransform {

  transform(value: string, maxLength: number): string {

    if (value.length <= maxLength) {
      return value;
    }

    return `${value.substring(0, maxLength)}...`;
  }

}
