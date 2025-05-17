import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Injectable({
  providedIn: 'root',
})
export class LogoutGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    this.authService.logout(); // Chama a função de logout
    this.router.navigate(['auth/login']); // Redireciona para a página de login
    return false; // Impede a navegação na rota atual
  }
}
