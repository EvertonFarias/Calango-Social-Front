import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.registerForm = this.fb.group({
      login: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

 
  private showToast(icon: 'success' | 'error' | 'info', title: string) {
    Swal.fire({
      toast: true,
      position: 'bottom-end',
      icon,
      title,
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    const { login, email, password, confirmPassword, dateOfBirth, gender } = this.registerForm.value;

    if (password !== confirmPassword) {
      this.showToast('error', 'As senhas não coincidem!');
      return;
    }

    const payload = { login, email, password, dateOfBirth, gender };

    this.http.post('http://localhost:8080/auth/register', payload)
      .subscribe({
        next: () => {
          Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: 'success',
            title: 'Cadastro realizado!',
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true
          }).then(() => {
            this.router.navigate(['auth/login']);
          });
        },
        error: (error) => {
          const msg = error.error?.message || 'Erro ao cadastrar!';
          this.showToast('error', msg);
        }
      });
  }
}
