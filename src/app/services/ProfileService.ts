import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../app.config';

export interface ProfileDTO {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  city: string;
  state: string;

}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private profileSubject = new BehaviorSubject<ProfileDTO | null>(null);
  private boleeanSubject = new BehaviorSubject<boolean>(false);
  profile$ = this.profileSubject.asObservable();
  boleeanProfile$ = this.boleeanSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    }
  
    loadUserProfile() {
      const username = this.authService.getUsername();
      const token = this.authService.getToken();  
    
      if (username && token) {
        this.http.get<ProfileDTO>(`${environment.apiUrl}/profile/${username}`, { 
          headers: {
            Authorization: `Bearer ${token}`  
          }
        }).subscribe({
          next: (profile) => {
            this.profileSubject.next(profile);
          
            const isComplete = profile.name != null && profile.name !== '';
            this.boleeanSubject.next(isComplete);
          },
          error: (err) => {
            console.error('Erro ao carregar perfil do usuário:', err);
            this.profileSubject.next(null);
            this.boleeanSubject.next(false); 
          }
        });
      }
    }
    

  getCurrentProfile(): ProfileDTO | null {
    return this.profileSubject.getValue();
  }
}
