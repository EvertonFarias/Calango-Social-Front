import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { catchError, tap, shareReplay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';
import { environment } from '../../environment';

export interface UserDTO {
  profilePicture: string | null;
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
export class UserService implements OnDestroy {
  private userSubject = new BehaviorSubject<UserDTO | null>(null);

  // Expõe o usuário como Observable
  readonly user$ = this.userSubject.asObservable();
  
  // Expõe o status de verificação como Observable derivado de user$
  readonly isUserVerified$ = this.user$.pipe(
    map(user => !!user?.verifiedEmail),
    shareReplay(1)
  );

  constructor(
    private http: HttpClient, 
    private authService: AuthService
  ) {
    this.loadUser(); // Carrega o usuário uma única vez na inicialização
  }

  
  private fetchUserData(): Observable<UserDTO | null> {
    const token = this.authService.getToken();
    const userId = this.authService.getUserId();
    
    if (!token || !userId || !this.authService.isLoggedIn?.()) {
      this.userSubject.next(null);
      return new Observable(subscriber => {
        subscriber.next(null);
        subscriber.complete();
      });
    }

    return this.http.get<UserDTO>(`${environment.apiUrl}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(user => this.userSubject.next(user)),
      catchError(error => {
        console.error('Erro ao buscar dados do usuário:', error);
        return new Observable<UserDTO | null>(subscriber => {
          subscriber.next(null);
          subscriber.complete();
        });
      })
    );
  }


  loadUser(): Observable<UserDTO | null> {
    const userData$ = this.fetchUserData();
    userData$.subscribe();
    return userData$;
  }

  /**
   * Retorna o usuário atual sem precisar se inscrever no Observable
   */
  getCurrentUser(): UserDTO | null {
    return this.userSubject.getValue();
  }

  ngOnDestroy(): void {
  }
}
