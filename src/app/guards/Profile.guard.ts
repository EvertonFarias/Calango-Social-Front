import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProfileService } from '../services/ProfileService';
import { AuthService } from '../services/auth.service';
import { map, filter, take } from 'rxjs';
import Swal from 'sweetalert2'; 

export const ProfileGuard: CanActivateFn = () => {
  const profileService = inject(ProfileService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Função para exibir o toast
  const showToast = (icon: 'success' | 'error' | 'info', title: string) => {
    Swal.fire({
      toast: true,
      position: 'bottom-end',
      icon,
      title,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    });
  };

  return profileService.profile$.pipe(

    filter(profile => profile !== null),
    take(1),
    map(profile => {
      if (
        profile &&
        profile.name &&
        profile.phoneNumber &&
        profile.city &&
        profile.state
      ) {
        return true;
      }

      
      showToast('error', 'Perfil incompleto! Preencha as informações para continuar.');

      // Redireciona para a home se o perfil estiver incompleto
      router.navigate(['user/home']);
      return false;
    })
  );
};
