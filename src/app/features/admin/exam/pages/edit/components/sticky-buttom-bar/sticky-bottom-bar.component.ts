import {
  Component,
  inject,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  signal,
  WritableSignal,
} from "@angular/core";
import { AsyncPipe } from "@angular/common";
import { ButtonComponent } from "../../../../../../../shared/components/button/button.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import {
  faXmark,
  faFloppyDisk,
  faCircleExclamation,
  faChevronUp,
  faChevronDown,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { BadgeComponent } from "../../../../../../../shared/components/badge/badge.component";
import { SidebarService } from "../../../../../admin-page-layout/service/sidebar.service";
import { Observable } from "rxjs";

@Component({
  selector: "ox-sticky-bottom-bar",
  imports: [ButtonComponent, FaIconComponent, BadgeComponent, AsyncPipe],
  templateUrl: "./sticky-bottom-bar.component.html",
  styleUrl: "./sticky-bottom-bar.component.scss",
})
export class StickyBottomBar {
  protected readonly faXMark = faXmark;
  protected readonly faFloppyDisk = faFloppyDisk;
  protected readonly faCircleExclamation = faCircleExclamation;
  protected readonly faChevronUp = faChevronUp;
  protected readonly faChevronDown = faChevronDown;
  protected readonly faCheck = faCheck;

  private readonly _sidebarService: SidebarService = inject(SidebarService);

  public showErrorControls: InputSignal<boolean> = input.required();
  public countErrorElements: InputSignal<number> = input.required();

  public indexChanged: OutputEmitterRef<number> = output();
  public saveClicked: OutputEmitterRef<boolean> = output();
  public cancelClicked: OutputEmitterRef<boolean> = output();
  protected currentIndex: WritableSignal<number> = signal(1);

  protected get visible(): Observable<boolean> {
    return this._sidebarService.bottombarVisible$();
  }

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
