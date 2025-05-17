import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnDestroy {
  success = '';
  error = '';
  isSubmitting = false;
  emailSent = false;
  form;
  private subscription: Subscription | null = null;
  private redirectTimeout: any;

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit() {
    // Limpa mensagens anteriores
    this.success = '';
    this.error = '';
    
    if (this.form.invalid) {
      this.error = 'Por favor, informe um endereço de e-mail válido.';
      return;
    }

    this.isSubmitting = true;
    
    // Cancelar qualquer requisição anterior se existir
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    
    this.subscription = this.http.post('http://localhost:8080/auth/forgot-password', this.form.value, { responseType: 'text' })
      .subscribe({
        next: (response) => {
          this.success = 'E-mail enviado com sucesso! Verifique sua caixa de entrada.';
          this.error = '';
          this.emailSent = true;
          this.isSubmitting = false; // Garantir que isSubmitting é resetado em caso de sucesso
          
          // Limpa o formulário após o sucesso
          this.form.reset();
          
          // Depois de 5 segundos, redireciona para a página de login
          this.redirectTimeout = setTimeout(() => {
            if (this.emailSent) {
              this.router.navigate(['/auth/login']);
            }
          }, 7000);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erro ao enviar e-mail:', err);
          
          if (err.error && typeof err.error === 'string') {
            this.error = err.error;
          } else if (err.error?.message) {
            this.error = err.error.message;
          } else if (err.status === 404) {
            this.error = 'E-mail não encontrado em nosso sistema.';
          } else {
            this.error = `Erro ao enviar e-mail. (${err.status}: ${err.statusText})`;
          }
          
          this.success = '';
          this.isSubmitting = false; // Reseta o estado do botão em caso de erro
        }
      });
  }

  // Método para tentar novamente
  tryAgain() {
    this.emailSent = false;
    this.success = '';
    this.error = '';
    
    // Limpar o timeout de redirecionamento
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }
  
  // Método para ir para página de login
  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
  
  ngOnDestroy() {
    // Limpar subscrições e timeouts quando o componente for destruído
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }
}