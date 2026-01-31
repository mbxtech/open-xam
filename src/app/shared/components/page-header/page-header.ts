import { Component, inject, input, InputSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faArrowLeft, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from "../button/button.component";

@Component({
  selector: 'ox-page-header',
  imports: [FaIconComponent, ButtonComponent],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
})
export class PageHeader {
  protected readonly faArrowLeft: IconDefinition = faArrowLeft;

  public readonly icon: InputSignal<IconDefinition> = input.required();
  public readonly title: InputSignal<string> = input.required<string>();
  public readonly subTitle: InputSignal<string> = input<string>('');
  public readonly route: InputSignal<string> = input<string>('');
  public readonly showBackButton: InputSignal<boolean> = input<boolean>(true);
  public readonly relativeToParent: InputSignal<boolean> = input<boolean>(false);

  private _router: Router = inject(Router);
  private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);

  protected async navigate(): Promise<void> {
    if (this.relativeToParent()) {
      await this._router.navigate([this.route()], { relativeTo: this._activatedRoute.parent });
      return Promise.resolve();
    }

    await this._router.navigate([this.route()]);
  }

}
