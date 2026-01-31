import {Component} from "@angular/core";
import {RouterOutlet} from "@angular/router";
import {BreadcrumbComponent} from "./shared/components/breadcrumb/breadcrumb.component";
import {ToastComponent} from "./shared/components/toast/toast.component";
import {NavigationComponent} from "./shared/components/navigation/navigation.component";

@Component({
  selector: "app-root",
    imports: [RouterOutlet, BreadcrumbComponent, ToastComponent, NavigationComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {

}
