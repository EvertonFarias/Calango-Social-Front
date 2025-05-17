import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ProfileService } from '../../../services/ProfileService';
import { environment } from '../../../app.config';
import Swal from 'sweetalert2';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-evaluations',
  templateUrl: './user-evaluations.component.html',
  styleUrls: ['./user-evaluations.component.css'],
    imports: [ReactiveFormsModule, RouterModule, CommonModule,  
    FormsModule],
})
export class UserEvaluationsComponent implements OnInit {
  evaluations: any[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router
  ) {}
    editEvaluation(id: string) {
    this.router.navigate(['user/evaluations/edit', id]);
  }

  isBeforeNow(dateStr: string): boolean {
    return new Date(dateStr) > new Date();
  }

  ngOnInit(): void {
    const token = this.authService.getToken();
    const profile = this.profileService.getCurrentProfile();

    if (!token || !profile) {
      this.showToast('error', 'Token ou perfil não encontrado.');
      return;
    }

    const url = `${environment.apiUrl}/profile/evaluations/${profile.id}`;

    this.http.get<any[]>(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe({
      next: (data) => {
        this.evaluations = data;
      },
      error: (err) => {
        console.error('Erro ao buscar avaliações:', err);
        this.showToast('error', 'Erro ao carregar avaliações.');
      }
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
}
