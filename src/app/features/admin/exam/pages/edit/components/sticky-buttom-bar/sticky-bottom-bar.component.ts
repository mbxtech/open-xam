import {Component, input, InputSignal, output, OutputEmitterRef, signal, WritableSignal} from '@angular/core';
import {ButtonComponent} from "../../../../../../../shared/components/button/button.component";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {
  faXmark,
  faFloppyDisk,
  faCircleExclamation,
  faChevronUp,
  faChevronDown, faCheck
} from "@fortawesome/free-solid-svg-icons";
import {BadgeComponent} from "../../../../../../../shared/components/badge/badge.component";

@Component({
  selector: 'ox-sticky-bottom-bar',
  imports: [
    ButtonComponent,
    FaIconComponent,
    BadgeComponent
  ],
  templateUrl: './sticky-bottom-bar.component.html',
  styleUrl: './sticky-bottom-bar.component.scss',
})
export class StickyBottomBar {

  protected readonly faXMark = faXmark;
  protected readonly faFloppyDisk = faFloppyDisk;
  protected readonly faCircleExclamation = faCircleExclamation;
  protected readonly faChevronUp = faChevronUp;
  protected readonly faChevronDown = faChevronDown;
  protected readonly faCheck = faCheck;

  public showErrorControls: InputSignal<boolean> = input.required();
  public countErrorElements: InputSignal<number> = input.required();

  public indexChanged: OutputEmitterRef<number> = output();
  public saveClicked: OutputEmitterRef<boolean> = output();
  public cancelClicked: OutputEmitterRef<boolean> = output();
  protected currentIndex: WritableSignal<number> = signal(1);

  protected next(): void {
    if (this.currentIndex() === this.countErrorElements()) {
      return;
    }
    this.currentIndex.set(this.currentIndex() + 1);
    this.indexChanged.emit(this.currentIndex());
  }

  protected prev(): void {
    if (this.currentIndex() === 1) {
      return;
    }

    this.currentIndex.set(this.currentIndex() - 1);
    this.indexChanged.emit(this.currentIndex());
  }

  protected save(): void {
    this.saveClicked.emit(true);
  }

  protected cancel(): void {
    this.cancelClicked.emit(true);
  }

}
