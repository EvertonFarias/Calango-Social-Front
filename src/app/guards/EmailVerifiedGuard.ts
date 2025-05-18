import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, take, tap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { UserService } from '../services/UserService';

@Injectable({
  providedIn: 'root'
})
export class EmailVerifiedGuard implements CanActivate {
  constructor(
    private userService: UserService, 
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // Primeiro, forçar o carregamento do usuário para ter dados atualizados
    return this.userService.loadUser().pipe(
      // Mapeie para o status de verificação
      map(user => !!user?.verifiedEmail),
      // Força uma única emissão para que o guard não fique em estado pendente
      take(1),
      // Manipule o resultado da verificação
      tap(isVerified => {
        if (!isVerified) {
          this.showToast('error', 'Você precisa verificar seu e-mail para acessar esta página');
          this.router.navigate(['/user/home']);
        }
      }),
      catchError(error => {
        console.error('Erro no guard de verificação de email:', error);
        this.showToast('error', 'Erro ao verificar seu e-mail');
        this.router.navigate(['/user/home']);
        return of(false);
      })
    );
  }

  private showToast(icon: 'success' | 'error' | 'info' | 'warning', title: string): void {
    Swal.fire({
      toast: true,
      position: 'bottom-end',
      icon,
      title,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  }
}