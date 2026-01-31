
import { Component, HostListener, input, InputSignal, output, OutputEmitterRef, signal } from '@angular/core';
import { FaIconComponent, IconDefinition } from "@fortawesome/angular-fontawesome";
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';

export interface ContextMenuItem<T> {
  label: string;
  icon: IconDefinition;
  action: (param?: T) => void;
  disabled?: boolean;
  divider?: boolean;
}

@Component({
  selector: 'ox-context-menu',
  imports: [FaIconComponent],
  templateUrl: './context-menu.html',
  styleUrl: './context-menu.scss',
})
export class ContextMenu<T> {
  protected faEllipsis = faEllipsisVertical;

  public items = input.required<ContextMenuItem<T>[]>();
  public position: InputSignal<'bottom-left' | 'bottom-right'> = input<'bottom-left' | 'bottom-right'>('bottom-right');
  public disabled: InputSignal<boolean> = input<boolean>(false);
  public ariaLabel: InputSignal<string> = input<string>('Mehr Optionen');

  public itemClicked: OutputEmitterRef<ContextMenuItem<T>> = output<ContextMenuItem<T>>();
  public menuOpened: OutputEmitterRef<void> = output<void>();
  public menuClosed: OutputEmitterRef<void> = output<void>();

  protected isOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.isOpen() && target.closest && !target.closest('ox-context-menu')) {
      this.closeMenu();
    }
  }

  @HostListener('keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    if (this.isOpen() && event.key.toLocaleLowerCase() === 'escape') {
      this.closeMenu();
    }
  }

  protected toggleMenu(event: Event) {
    event.stopPropagation();
    
    if (this.isOpen()) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  protected openMenu() {
    this.isOpen.set(true);
    this.menuOpened.emit();
  }

  protected closeMenu() {
    this.isOpen.set(false);
    this.menuClosed.emit();
  }

  protected handleItemClick(item: ContextMenuItem<T>) {
    if (item.disabled) {
      return;
    }

    if (item.action) {
        item.action();
    }
    this.itemClicked.emit(item);

    this.closeMenu();
  }

}
