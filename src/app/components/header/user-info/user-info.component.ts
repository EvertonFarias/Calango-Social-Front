import { Component, Input } from '@angular/core';
import { UserDTO, UserService } from '../../../services/UserService';
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
  user$: Observable<UserDTO | null>;
  isMenuOpen = false; // controla se o menu está visível


  constructor(
    private userService: UserService,
    
  ) {
    this.user$ = this.userService.user$;
   }

   toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
