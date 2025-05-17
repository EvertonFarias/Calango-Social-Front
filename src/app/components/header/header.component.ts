import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service'; 
import { Router, RouterModule } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { UserInfoComponent } from "./user-info/user-info.component";
import { AuthButtonsComponent } from "./auth-buttons/auth-buttons.component";
import { ProfileDTO, ProfileService } from '../../services/ProfileService';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  imports: [CommonModule, RouterModule, UserInfoComponent, AuthButtonsComponent],
})
export class HeaderComponent implements OnInit, OnDestroy {
  authenticated: boolean = false;
  private authSubscription!: Subscription;
  profile$: Observable<ProfileDTO | null>;

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    
  ) {
    this.profile$ = this.profileService.profile$;
   }

  ngOnInit(): void {
    this.authSubscription = this.authService.authStatus$.subscribe(isLogged => {
      this.authenticated = isLogged;
      this.cdr.detectChanges();
    });
  }
  

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['auth/login']);
  }
}
