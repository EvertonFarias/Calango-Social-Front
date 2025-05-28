import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { RouterModule } from '@angular/router';
import { UserDTO, UserService } from '../../../services/UserService';
import { FeedComponent } from '../feed/feed.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FeedComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'] // Note: styleUrls (plural)
})
export class HomeComponent {
  user$: Observable<UserDTO | null>;
  isUserVerified$: Observable<boolean>;

  constructor(private userService: UserService) {
    this.user$ = this.userService.user$;
    this.isUserVerified$ = this.userService.isUserVerified$;
    console.log('HomeComponent initialized');
    console.log('isUserVerified$:', this.isUserVerified$);
  }
}