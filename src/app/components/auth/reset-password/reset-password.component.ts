import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  form;
  token = '';
  success = '';
  error = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });

    // Pega o token da URL
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error = 'Token não encontrado na URL.';
    }
  }

  submit() {
    // Reset messages
    this.success = '';
    this.error = '';
    
    if (this.form.invalid) {
      this.error = 'Por favor, preencha todos os campos corretamente.';
      return;
    }
    
    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.error = 'As senhas não coincidem.';
      return;
    }

    if (!this.token) {
      this.error = 'Token não encontrado. Por favor, verifique o link recebido por email.';
      return;
    }
    
    this.isSubmitting = true;
    const body = {
      token: this.token,
      newPassword: this.form.value.password
    };

    this.http.post(`${environment.apiUrl}/auth/reset-password`, body, { responseType: 'text' })
      .subscribe({
        next: (response) => {
          this.success = 'Senha redefinida com sucesso!';
          this.error = '';
          setTimeout(() => this.router.navigate(['/auth/login']), 3000);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erro na requisição:', err);
          if (err.error && typeof err.error === 'string') {
            this.error = err.error;
          } else if (err.error?.message) {
            this.error = err.error.message;
          } else {
            this.error = `Erro ao redefinir a senha. (${err.status}: ${err.statusText})`;
          }
          this.success = '';
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
  }
}