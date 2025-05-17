import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const RoleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRoles = route.data?.['expectedRoles'] as string[];  
  const currentRole = authService.getUserRole();

  if (!expectedRoles || expectedRoles.length === 0) {
    console.error('RoleGuard: expectedRoles não definido ou vazio na rota!');
    router.navigate(['/unauthorized']);
    return false;
  }

  if (currentRole && expectedRoles.includes(currentRole)) {
    return true;
  } else {
    router.navigate(['/unauthorized']);
    return false;
  }
};
