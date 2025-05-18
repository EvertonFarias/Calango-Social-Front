import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  
  // Observable público para o status de autenticação
  readonly authStatus$ = this.authSubject.asObservable();
  
  // Alias para compatibilidade com outros componentes que usam isLoggedIn$
  readonly isLoggedIn$ = this.authStatus$;

  constructor() {
    // Verifica o token ao iniciar o serviço
    this.checkTokenValidity();
  }

  // Verifica se há um token válido e atualiza o BehaviorSubject
  private checkTokenValidity(): void {
    const isLoggedIn = this.hasValidToken();
    this.authSubject.next(isLoggedIn);
  }

  // Verifica se existe um token válido
  private hasValidToken(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  // Realiza o login, armazenando o token no localStorage
  login(token: string): void {
    localStorage.setItem('token', token);
    this.authSubject.next(true); // Atualiza o status para autenticado
  }

  // Realiza o logout, removendo o token do localStorage
  logout(): void {
    localStorage.removeItem('token');
    this.authSubject.next(false); // Atualiza o status para não autenticado
  }

  // Retorna o token armazenado no localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Verifica se o usuário está logado (token não expirado)
  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  // Verifica se o token é válido - método público para uso externo
  isTokenValid(token: string): boolean {
    return !!token && !this.isTokenExpired(token);
  }

  // Obtém o papel (role) do usuário a partir do payload do token
  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const payload = this.decodeToken(token);
    return payload?.role || null;
  }

  // Obtém o ID do usuário a partir do payload do token
  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const payload = this.decodeToken(token);
    return payload?.id || payload?.sub || null;
  }
  
  // Obtém o nome de usuário a partir do payload do token
  getUsername(): string | null {
    const token = this.getToken();
    if (!token) return null;
  
    const payload = this.decodeToken(token);
    return payload?.sub || payload?.preferred_username || null; 
  }
  
  // Decodifica o payload do JWT sem validar sua assinatura
  private decodeToken(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
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