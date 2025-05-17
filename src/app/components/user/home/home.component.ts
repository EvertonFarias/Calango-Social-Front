import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Observable } from 'rxjs';

import { RouterModule } from '@angular/router';
import { UserDTO, UserService } from '../../../services/UserService';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  user$: Observable<UserDTO | null>;
  isUserVerified$: Observable<boolean>;

  constructor(private userService: UserService) {
    this.user$ = this.userService.user$;
    this.isUserVerified$ = this.userService.isUserVerified$;
    console.log(this.isUserVerified$);
  }
  
}
