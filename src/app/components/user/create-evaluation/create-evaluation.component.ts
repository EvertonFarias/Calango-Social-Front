import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';


import { AuthService } from '../../../services/auth.service';
import { ProfileService } from '../../../services/ProfileService';
import { environment } from '../../../app.config';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-evaluation',
  templateUrl: './create-evaluation.component.html',
  styleUrls: ['./create-evaluation.component.css'],
  imports: [ReactiveFormsModule, RouterModule, CommonModule,  
    FormsModule],

})
export class CreateEvaluationComponent {
  formData = {
    title: '',
    description: '',
    finalDateEvaluation: '',
    time: null,
    evaluationScore: null
  };
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

  constructor(
    private http: HttpClient,
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    const profile = this.profileService.getCurrentProfile();
    const token = this.authService.getToken();

    if (!profile || !token) {
      console.error('Perfil ou token não encontrados.');
      return;
    }

    const date = new Date(this.formData.finalDateEvaluation);
    const isoDate = date.toISOString(); // ou use .slice(0, -1) se quiser sem 'Z'

    const payload = {
      responsibleProfileId: profile.id,
      title: this.formData.title,
      finalDateEvaluation: isoDate,
      description: this.formData.description,
      evaluationScore: this.formData.evaluationScore
    };

    this.http.post(`${environment.apiUrl}/evaluation`, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe({
        next: () => {
          Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: 'success',
            title: 'Avaliação criada com sucesso!',
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true
          }).then(() => {
            this.router.navigate(['user/evaluations']);
          });
        },
        error: (error) => {
          const msg = error.error?.message || 'Erro ao criar avaliação!';
          this.showToast('error', msg);
        }
      });
}
}

