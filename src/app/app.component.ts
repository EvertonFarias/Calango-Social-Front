import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from "./components/header/header.component";
import { FooterComponent } from "./components/footer/footer.component";
import { AuthHeaderComponent } from "./components/user/auth-header/auth-header.component";
import { UserService } from './services/UserService';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, AuthHeaderComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'InovaTest-Front';
  authenticated = false;
  private authSubscription: Subscription | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Carrega os dados do usuário
    this.userService.loadUser();
    
    // Verifica o estado inicial de autenticação
    this.authenticated = this.authService.isLoggedIn();
    
    // Subscreve para alterações no estado de autenticação
    this.authSubscription = this.authService.authStatus$.subscribe(
      isLoggedIn => {
        this.authenticated = isLoggedIn;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}