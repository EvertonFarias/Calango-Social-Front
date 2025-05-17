import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FeatureCardsComponentComponent } from "../feature-cards-component/feature-cards-component.component";

@Component({
  selector: 'app-initial-home-content',
  imports: [RouterModule, FeatureCardsComponentComponent],
  templateUrl: './initial-home-content.component.html',
  styleUrl: './initial-home-content.component.css'
})
export class InitialHomeContentComponent {
  authenticated: boolean = false;
 

  constructor(private authService: AuthService) {
    this.authenticated = this.authService.isLoggedIn();
  }

}
