import { Component, Input} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./components/header/header.component";
import { FooterComponent } from "./components/footer/footer.component";
import { ProfileService } from './services/ProfileService';



@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(private profileService: ProfileService) {}

  ngOnInit() {
    this.profileService.loadUserProfile();
  }
  title = 'InovaTest-Front';
  authenticated: boolean = false;
}
