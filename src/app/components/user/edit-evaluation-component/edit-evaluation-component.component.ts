import { Component, OnInit } from '@angular/core';
import { environment } from '../../../app.config';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-evaluation-component',
    imports: [ReactiveFormsModule, RouterModule, CommonModule,  
    FormsModule],
  templateUrl: './edit-evaluation-component.component.html',
  styleUrl: './edit-evaluation-component.component.css'
})
export class EditEvaluationComponent implements OnInit {
  evaluationForm!: FormGroup;
  evaluationCode!: string;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.evaluationCode = this.route.snapshot.paramMap.get('code')!;
    this.initForm();
    this.loadEvaluation();
  }

  private initForm() {
    this.evaluationForm = this.fb.group({
      title: [''],
      description: [''],
      evaluationScore: [null],
      finalDateEvaluation: ['']
    });
  }

  private loadEvaluation() {
    const token = this.authService.getToken();
    if (!token) return;

    this.http.get<any>(`${environment.apiUrl}/evaluation/${this.evaluationCode}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe({
      next: (data) => {
        this.evaluationForm.patchValue({
          title: data.title,
          description: data.description,
          evaluationScore: data.evaluationScore,
          finalDateEvaluation: data.finalDateEvaluation.slice(0, 16) // formato yyyy-MM-ddTHH:mm
        });
      },
      error: (err) => {
        this.showToast('error', 'Erro ao carregar dados da avaliação.');
        console.error(err);
      }
    });
  }

  onSubmit() {
    const token = this.authService.getToken();
    if (!token) return;

    const payload = {
      ...this.evaluationForm.value,
      finalDateEvaluation: new Date(this.evaluationForm.value.finalDateEvaluation).toISOString()
    };

    this.http.put(`${environment.apiUrl}/evaluation/${this.evaluationCode}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          position: 'bottom-end',
          icon: 'success',
          title: 'Avaliação atualizada com sucesso!',
          showConfirmButton: false,
          timer: 2000
        }).then(() => this.router.navigate(['/user/evaluations']));
      },
      error: (err) => {
        const msg = err.error?.message || 'Erro ao atualizar avaliação.';
        this.showToast('error', msg);
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
      timer: 2000
    });
  }
}
