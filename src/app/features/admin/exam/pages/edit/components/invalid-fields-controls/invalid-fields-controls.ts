import {Component, input, InputSignal, output, OutputEmitterRef, signal, WritableSignal} from '@angular/core';
import {ButtonComponent} from "../../../../../../../shared/components/button/button.component";

@Component({
  selector: 'ox-invalid-fields-controls',
  imports: [
    ButtonComponent
  ],
  templateUrl: './invalid-fields-controls.html',
  styleUrl: './invalid-fields-controls.scss',
})
export class InvalidFieldsControls {

  public show: InputSignal<boolean> = input.required();
  public countElements: InputSignal<number> = input.required();

  public indexChanged: OutputEmitterRef<number> = output();
  protected currentIndex: WritableSignal<number> = signal(1);

  protected next(): void {
    this.currentIndex.set(this.currentIndex() + 1);
    this.indexChanged.emit(this.currentIndex());
  }

  protected prev(): void {
    this.currentIndex.set(this.currentIndex() - 1);
    this.indexChanged.emit(this.currentIndex());
  }

}
