import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Observable } from 'rxjs';
import { ProfileDTO, ProfileService } from '../../../services/ProfileService';
import { UserContentComponent } from "./user-content/user-content.component";
import { RouterModule } from '@angular/router';
import { FeatureCardsComponentComponent } from "../../feature-cards-component/feature-cards-component.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, UserContentComponent, RouterModule, FeatureCardsComponentComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  profile$: Observable<ProfileDTO | null>;
  boleeanProfile$: Observable<boolean>;

  constructor(private profileService: ProfileService) {
    this.profile$ = this.profileService.profile$;
    this.boleeanProfile$ = this.profileService.boleeanProfile$;
  }
}
