import { Component } from '@angular/core';

@Component({
  selector: 'ox-dialog-header',
  standalone: true,
  template: `
    <ng-content />
  `
})
export class DialogHeaderComponent {}
