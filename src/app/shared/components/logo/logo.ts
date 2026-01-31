import { Component, effect, input, InputSignal } from '@angular/core';

export type logoVariant = 'large' | 'medium' | 'small' | 'icon';

@Component({
  selector: 'ox-logo',
  imports: [],
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
})
export class Logo {
  public variant: InputSignal<logoVariant> = input<logoVariant>('large');
  protected width: number = 0;
  protected height: number = 0;
  protected viewBox: string = '';

  constructor() {
    effect(() => {

      switch (this.variant()) {
        case 'large': {
          this.setDimensions(900, 260, '0 0 900 260');
        } break;
        case 'medium': {
          this.setDimensions(225, 65, '0 0 225 65');
        } break;
        case 'small': {
          this.setDimensions(112.5, 32.5, '0 0 113 33');
        } break;
        default: {
          this.setDimensions(900, 260, '0 0 900 260');
        }
      }
    })
  }

  private setDimensions(w: number, h: number, viewBox: string): void {
    this.width = w;
    this.height = h;
    this.viewBox = viewBox;
  }


}
