import { Component, Input } from '@angular/core';
import { ProfileDTO, ProfileService } from '../../../services/ProfileService';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-info',
  standalone: true,
  templateUrl: './user-info.component.html',
  imports: [CommonModule],
  styleUrls: ['./user-info.component.css']
})
export class UserInfoComponent {
  @Input() logout!: () => void;
  profile$: Observable<ProfileDTO | null>;
  isMenuOpen = false; // controla se o menu está visível


  constructor(
    private profileService: ProfileService,
    
  ) {
    this.profile$ = this.profileService.profile$;
   }

   toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
