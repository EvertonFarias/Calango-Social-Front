import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../../../environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  maxDate: string;
  minDate: string;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    // Define data máxima (hoje) e mínima (100 anos atrás)
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
    
    const minYear = today.getFullYear() - 100;
    this.minDate = new Date(minYear, 0, 1).toISOString().split('T')[0];

    this.registerForm = this.fb.group({
      login: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        this.alphanumericValidator
      ]],
      dateOfBirth: ['', [
        Validators.required,
        this.dateValidator.bind(this),
        this.minimumAgeValidator.bind(this)
      ]],
      gender: ['', Validators.required],
      email: ['', [
        Validators.required, 
        Validators.email,
        this.emailDomainValidator
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', Validators.required]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  // Validador personalizado para data de nascimento
  private dateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const selectedDate = new Date(control.value);
    const today = new Date();
    
    // Remove a parte do tempo para comparação apenas de datas
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      return { futureDate: { message: 'Data de nascimento não pode ser no futuro' } };
    }

    return null;
  }

  // Validador para idade mínima (13 anos)
  private minimumAgeValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const birthDate = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 13) {
      return { minimumAge: { message: 'Idade mínima é 13 anos' } };
    }

    return null;
  }

  // Validador para nome de usuário alfanumérico
  private alphanumericValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const username = control.value;
    
    // Verifica se começa com uma letra
    if (!/^[a-zA-Z]/.test(username)) {
      return { startsWithLetter: { message: 'Nome de usuário deve começar com uma letra' } };
    }
    
    // Verifica se contém apenas letras, números e underscore
    const alphanumericRegex = /^[a-zA-Z0-9_]+$/;
    if (!alphanumericRegex.test(username)) {
      return { alphanumeric: { message: 'Nome de usuário deve conter apenas letras, números e underscore' } };
    }
    
    return null;
  }

  // Validador para força da senha
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const password = control.value;
    const errors: any = {};

    if (!/(?=.*[a-z])/.test(password)) {
      errors.lowercase = 'Deve conter pelo menos uma letra minúscula';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.uppercase = 'Deve conter pelo menos uma letra maiúscula';
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.number = 'Deve conter pelo menos um número';
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.special = 'Deve conter pelo menos um caractere especial (@$!%*?&)';
    }

    return Object.keys(errors).length ? { passwordStrength: errors } : null;
  }

  // Validador para domínio de email válido
  private emailDomainValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const email = control.value;
    const blockedDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    const domain = email.split('@')[1]?.toLowerCase();

    if (blockedDomains.includes(domain)) {
      return { blockedDomain: { message: 'Domínio de email não permitido' } };
    }

    return null;
  }

  // Validador para confirmação de senha
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: { message: 'As senhas não coincidem' } };
    }

    return null;
  }

  // Método para obter mensagens de erro específicas
  getFieldError(fieldName: string): string | null {
    const field = this.registerForm.get(fieldName);
    if (!field?.errors || !field.touched) return null;

    const errors = field.errors;

    // Mapeamento de mensagens de erro
    const errorMessages: { [key: string]: string } = {
      required: 'Este campo é obrigatório',
      email: 'Email inválido',
      minlength: `Mínimo de ${errors['minlength']?.requiredLength} caracteres`,
      maxlength: `Máximo de ${errors['maxlength']?.requiredLength} caracteres`,
      futureDate: errors['futureDate']?.message,
      minimumAge: errors['minimumAge']?.message,
      alphanumeric: errors['alphanumeric']?.message,
      startsWithLetter: errors['startsWithLetter']?.message,
      blockedDomain: errors['blockedDomain']?.message
    };

    // Retorna a primeira mensagem de erro encontrada
    for (const errorType in errors) {
      if (errorMessages[errorType]) {
        return errorMessages[errorType];
      }
    }

    return 'Campo inválido';
  }

  // Método para obter erros de senha
  getPasswordErrors(): string[] {
    const passwordField = this.registerForm.get('password');
    if (!passwordField?.value) return [];

    const password = passwordField.value;
    const errors: string[] = [];

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Pelo menos uma letra minúscula');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Pelo menos uma letra maiúscula');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Pelo menos um número');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Pelo menos um caractere especial (@$!%*?&)');
    }
    if (password.length < 8) {
      errors.push('Pelo menos 8 caracteres');
    }

    return errors;
  }

  // Método para obter erro de confirmação de senha
  getConfirmPasswordError(): string | null {
    if (this.registerForm.errors?.['passwordMismatch'] && 
        this.registerForm.get('confirmPassword')?.touched) {
      return this.registerForm.errors['passwordMismatch'].message;
    }
    return null;
  }

  private showToast(icon: 'success' | 'error' | 'info', title: string) {
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

  onSubmit() {
    // Marca todos os campos como tocados para mostrar erros
    this.registerForm.markAllAsTouched();
    
    if (this.registerForm.invalid) {
      this.showToast('error', 'Por favor, corrija os erros no formulário');
      return;
    }

    const { login, email, password, dateOfBirth, gender } = this.registerForm.value;
    const payload = { login, email, password, dateOfBirth, gender };

    // Desabilita o formulário durante o envio
    this.registerForm.disable();

    this.http.post(`${environment.apiUrl}/auth/register`, payload)
      .subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'success',
            title: 'Cadastro realizado!',
            text: 'Sua conta foi criada com sucesso. Redirecionando para o login...',
            timer: 2500,
            timerProgressBar: true,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate(['auth/login']);
          });
        },
        error: (error) => {
          this.registerForm.enable();
          
          // Tratamento de erros mais específico
          let errorMessage = 'Erro ao cadastrar usuário';
          
          if (error.status === 409) {
            errorMessage = 'Email ou nome de usuário já existe';
          } else if (error.status === 400) {
            errorMessage = error.error?.message || 'Dados inválidos';
          } else if (error.status === 0) {
            errorMessage = 'Erro de conexão. Verifique sua internet';
          }
          
          this.showToast('error', errorMessage);
        }
      });
  }

  // Método auxiliar para verificar se um campo é inválido
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  // Método para formatar o nome de usuário (primeira letra maiúscula)
  formatUsername(event: any) {
    const input = event.target;
    let value = input.value;
    
    if (value.length > 0) {
      // Capitaliza a primeira letra
      value = value.charAt(0).toUpperCase() + value.slice(1);
      
      // Atualiza o valor no formulário
      this.registerForm.patchValue({ login: value });
      
      // Atualiza o valor no input
      input.value = value;
    }
  }

  // Método para calcular idade (para exibição)
  calculateAge(): number | null {
    const birthDate = this.registerForm.get('dateOfBirth')?.value;
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }
}