import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileDTO, ProfileService } from '../../../../services/ProfileService';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../app.config';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-content',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-content.component.html',
  styleUrl: './user-content.component.css'
})
export class UserContentComponent {
  @Input() profile$!: Observable<ProfileDTO | null>;
  @Input() boleeanProfile$!: Observable<boolean>;
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    phoneNumber: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
  });

  userId: string | null = null;

  ngOnInit(): void {
    this.profileService.profile$.subscribe(profile => {
      if (profile) {
        this.userId = profile.userId;
        this.form.patchValue({
          name: profile.name,
          phoneNumber: profile.phoneNumber,
          city: profile.city,
          state: profile.state
        });
      }
    });
  }

  onSubmit() {
    if (this.form.valid && this.userId) {
      const updatedProfile: ProfileDTO = {
        userId: this.userId,
        ...this.form.value
      };
  
      const token = this.profileService['authService'].getToken(); // acessa authService via ProfileService
  
      this.http.put(`${environment.apiUrl}/profile/${this.userId}`, updatedProfile, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).subscribe({
        next: () => {
          console.log('Perfil atualizado com sucesso!');
          this.profileService.loadUserProfile(); // Atualiza o observable global
        },
        error: err => {
          console.error('Erro ao atualizar o perfil:', err);
        }
      });
    } else {
      console.warn('Formulário inválido ou userId ausente');
      this.form.markAllAsTouched();
    }
  }
  

}
