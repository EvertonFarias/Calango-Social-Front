import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';

import { UserService } from '../../services/UserService';
import { environment } from '../../../environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: [
    './login.component.css',
  './css/banner.css'],
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
})
export class LoginComponent {
  loginForm: FormGroup;
  authenticated: boolean = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private profileService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      login: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.authenticated = this.authService.isLoggedIn();
  }


  private showToast(icon: 'success' | 'error' | 'info', title: string) {
    Swal.fire({
      toast: true,
      position: 'bottom-end',
      icon,
      title,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    const loginData = this.loginForm.value;

    this.http.post<any>(`${environment.apiUrl}/auth/login`, loginData)
      .subscribe({
        next: (response) => {
          const token = response.token;
          this.authService.login(token);
          this.profileService.loadUser();
          this.router.navigate(['user/home']);
          console.log(this.authService.getUserRole(), this.authService.getUsername());
          
        },
        error: (err) => {
          console.error('Erro no login', err);
          this.showToast('error', 'Usuário ou senha inválidos.');
        }
      });
  }
}
