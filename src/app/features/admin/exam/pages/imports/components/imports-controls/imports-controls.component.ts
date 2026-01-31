import { Component, output, OutputEmitterRef } from '@angular/core';
import { ButtonComponent } from '../../../../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../../../../shared/components/card/card.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faRotate, faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'ox-imports-controls',
  imports: [
    ButtonComponent,
    CardComponent,
    FaIconComponent
  ],
  templateUrl: './imports-controls.component.html',
  styleUrl: './imports-controls.component.scss',
})
export class ImportsControlsComponent {
  protected readonly faRotate = faRotate;
  protected readonly faTrash = faTrash;

  public clearAll: OutputEmitterRef<void> = output<void>();
  public refresh: OutputEmitterRef<void> = output<void>();
}
