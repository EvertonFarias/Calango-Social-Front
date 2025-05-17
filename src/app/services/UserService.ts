import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../app.config';

export interface UserDTO {
  id: string;
  login: string;
  email: string;
  role: string;
  verifiedEmail: boolean;
  gender: string;
  dateOfBirth: Date;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userSubject = new BehaviorSubject<UserDTO | null>(null);
  private isUserVerifiedSubject = new BehaviorSubject<boolean>(false);

  user$ = this.userSubject.asObservable();
  isUserVerified$ = this.isUserVerifiedSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  loadUser() {
  const isAuthenticated = this.authService.isLoggedIn?.() ?? !!this.authService.getToken();
  const userId = this.authService.getUserId();
  const token = this.authService.getToken();

  if (!isAuthenticated || !userId || !token) {
    // Não está autenticado, garantir estado limpo
    this.userSubject.next(null);
    this.isUserVerifiedSubject.next(false);
    return;
  }

  this.http.get<UserDTO>(`${environment.apiUrl}/users/${userId}`, { 
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).subscribe({
    next: (user) => {
      this.userSubject.next(user);
      this.isUserVerifiedSubject.next(user.verifiedEmail);
    },
    error: (err) => {
      console.error('Erro ao carregar dados do usuário:', err);
      this.userSubject.next(null);
      this.isUserVerifiedSubject.next(false);
    }
  });
}

  getCurrentUser(): UserDTO | null {
    return this.userSubject.getValue();
  }
}
