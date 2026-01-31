import {Component, input, InputSignal} from '@angular/core';
import {NgClass, NgStyle} from '@angular/common';
import {faArrowDown} from '@fortawesome/free-solid-svg-icons/faArrowDown';
import {faArrowUp} from '@fortawesome/free-solid-svg-icons/faArrowUp';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';


@Component({
    selector: 'ox-collapse-card',
    imports: [
        NgStyle,
        NgClass,
        FaIconComponent
    ],
    templateUrl: './collapse-card.component.html',
    styleUrl: './collapse-card.component.scss'
})
export class CollapseCardComponent {

    public readonly faArrowDown = faArrowDown;
    public readonly faArrowUp = faArrowUp;

    private _isCollapsed: boolean = true;

    public title: InputSignal<string> = input<string>('');
    public subtitle: InputSignal<string> = input<string>('');
    public class: InputSignal<string> = input<string>('')

    public get collapsed(): boolean {
        return this._isCollapsed;
    }

    public set collapsed(value: boolean) {
        this._isCollapsed = value;
    }

}
