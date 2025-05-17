import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private authSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  authStatus$ = this.authSubject.asObservable();

  constructor() { }

  // Realiza o login, armazenando o token no localStorage
  login(token: string) {
    localStorage.setItem('token', token);
    this.authSubject.next(true); // <-- Atualiza o status para autenticado
  }

  // Realiza o logout, removendo o token do localStorage
  logout() {
    localStorage.removeItem('token');
    this.authSubject.next(false); // <-- Atualiza o status para não autenticado
  }

  // Retorna o token armazenado no localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Verifica se o usuário está logado (token não expirado)
  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  // Obtém o papel (role) do usuário a partir do payload do token
  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const payload = this.decodeToken(token);
    return payload?.role || null;
  }
  getUsername(): string | null {
    const token = this.getToken();
    if (!token) return null;
  
    const payload = this.decodeToken(token);
    return payload?.sub || null; 
  }
  
  // Decodifica o payload do JWT sem validar sua assinatura
  private decodeToken(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      return null;
    }
  }

  // Verifica se o token está expirado
  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return true;

    const exp = payload.exp;
    if (!exp) return true; // Se não houver expiração no token, considerar como expirado

    const expirationDate = new Date(exp * 1000); // Convertendo para milissegundos
    return expirationDate < new Date(); // Retorna verdadeiro se o token expirou
  }
}
