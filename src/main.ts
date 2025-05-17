import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { InitialHomeContentComponent } from './app/components/initial-home-content/initial-home-content.component';
import { RegisterComponent } from './app/components/register/register.component';
import { LoginComponent } from './app/components/login/login.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { UnauthorizedComponent } from './app/components/unauthorized/unauthorized.component';
import { NotFoundComponent } from './app/components/not-found-component/not-found-component.component';
import { CommonModule } from '@angular/common';
import { AuthRedirectGuard } from './app/guards/AuthRedirectGuard ';
import { AuthGuard } from './app/guards/Auth.guard';
import { RoleGuard } from './app/guards/Role.guard';
import { ProfileGuard } from './app/guards/Profile.guard';
import { HomeComponent } from './app/components/user/home/home.component';
import { UserEvaluationsComponent } from './app/components/user/user-evaluations/user-evaluations.component';
import { EditEvaluationComponent } from './app/components/user/edit-evaluation-component/edit-evaluation-component.component';


const routes = [

  { path: '', component: InitialHomeContentComponent },
  { 
    path: 'auth/register', 
    component: RegisterComponent, 
    canActivate: [AuthRedirectGuard] // Impede o acesso se o usuário estiver logado
  },
  { 
    path: 'auth/login', 
    component: LoginComponent, 
    canActivate: [AuthRedirectGuard] // Impede o acesso se o usuário estiver logado
  },
//   {
//   path: 'logout',
//   canActivate: [LogoutGuard], 

// },
  { 
    path: 'admin', 
    loadComponent: () => import('./app/components/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN'] }
  },
  { 
    path: 'user/create-evaluation', 
    loadComponent: () => import('./app/components/user/create-evaluation/create-evaluation.component').then(m => m.CreateEvaluationComponent),
    canActivate: [AuthGuard, RoleGuard, ProfileGuard], 
    data: { expectedRoles: ['USER',  'ADMIN'] }
  },
  {
    path: 'user/evaluations', 
    component: UserEvaluationsComponent, 
    canActivate: [AuthGuard, RoleGuard, ProfileGuard], 
    data: { expectedRoles: ['USER',  'ADMIN'] }
  },
  
  { path: 'unauthorized', component: UnauthorizedComponent },

  {
    path: 'user/home',
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  { path: 'user/evaluations/edit/:code', component: EditEvaluationComponent }
,
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', component: NotFoundComponent },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    CommonModule 
  ]
});
