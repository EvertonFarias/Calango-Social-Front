import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { switchMap, catchError, tap, shareReplay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { map, filter } from 'rxjs/operators';
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
  private verificationPollingSubscription: Subscription | null = null;
  
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
    this.initializeUser();
  }

  /**
   * Inicializa o usuário e começa o polling de verificação se necessário
   */
  private initializeUser(): void {
    // Carregar o usuário imediatamente
    this.loadUser();
    
    // Configurar o polling de verificação apenas quando necessário
    this.setupVerificationPolling();
  }

  /**
   * Configura o polling de verificação de email quando o usuário não está verificado
   */
  private setupVerificationPolling(): void {
    // Cancelar qualquer polling existente
    this.stopVerificationPolling();
    
    // Iniciar novo polling apenas se o usuário existir e não estiver verificado
    this.verificationPollingSubscription = this.user$.pipe(
      // Comece o polling apenas quando tivermos um usuário não verificado
      filter(user => !!user && !user.verifiedEmail),
      // Cancela subscrição anterior ao iniciar nova
      switchMap(() => timer(0, 15000)),
      // A cada tick do timer, busque os dados do usuário novamente
      switchMap(() => this.fetchUserData())
    ).subscribe();
  }

  /**
   * Para o polling de verificação
   */
  private stopVerificationPolling(): void {
    if (this.verificationPollingSubscription) {
      this.verificationPollingSubscription.unsubscribe();
      this.verificationPollingSubscription = null;
    }
  }

  /**
   * Busca os dados do usuário da API
   */
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
        tap(user => {
          this.userSubject.next(user);
          
          // Se o usuário estiver verificado, podemos parar o polling
          if (user.verifiedEmail) {
            this.stopVerificationPolling();
          }
        }),
        catchError(error => {
          console.error('Erro ao buscar dados do usuário:', error);
          return new Observable<UserDTO | null>(subscriber => {
            subscriber.next(null);
            subscriber.complete();
          });
        })
      );
    }

  /**
   * Carrega os dados do usuário manualmente
   */
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
    this.stopVerificationPolling();
  }
}
