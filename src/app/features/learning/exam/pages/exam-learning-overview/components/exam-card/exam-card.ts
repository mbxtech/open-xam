import { Component, inject, input, InputSignal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCalendarDays, faFlask, faPlay } from '@fortawesome/free-solid-svg-icons';
import { BadgeComponent } from '../../../../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../../../../shared/components/button/button.component';
import { IExam } from '../../../../../../../shared/model/interfaces/exam.interface';
import { DatePipe } from '@angular/common';
import { CardComponent } from '../../../../../../../shared/components/card/card.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'ox-exam-card',
    imports: [BadgeComponent, FaIconComponent, ButtonComponent, DatePipe, CardComponent],
    templateUrl: './exam-card.html',
    styleUrl: './exam-card.scss',
})
export class ExamCard {

    protected readonly faCalendarDays = faCalendarDays;
    protected readonly faPlay = faPlay;
    protected readonly faFlask = faFlask;

    public readonly exam: InputSignal<IExam> = input.required();

    private readonly _router: Router = inject(Router);
    private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);

    protected async startSimulation(): Promise<void> {
        await this._router.navigate(['simulation', this.exam().id], {
            relativeTo: this._activatedRoute.parent,
        });
    }

    protected async startRealExam(): Promise<void> {
        await this._router.navigate(['certification', this.exam().id], {
            relativeTo: this._activatedRoute.parent,
        })
    }
}
