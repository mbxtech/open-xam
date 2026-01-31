import {Component, inject} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {ThemeService} from '../../service/theme.service';
import {faCloudMoon, faSun, IconDefinition} from '@fortawesome/free-solid-svg-icons';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {Logo} from "../logo/logo";

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FaIconComponent, Logo],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent {
  protected faSun: IconDefinition = faSun;
  protected isMenuCollapsed: boolean = true;
  protected themeService: ThemeService = inject(ThemeService);
  protected readonly faCloudMoon = faCloudMoon;
}
