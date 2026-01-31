import { Component } from '@angular/core';

@Component({
  selector: 'ox-dialog-content',
  standalone: true,
  template: `
    <ng-content />
  `
})
export class DialogContentComponent {}
