import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-auth-header',
  standalone: true, // importante para Standalone Components
  imports: [
    RouterModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule
  ],
  templateUrl: './auth-header.component.html',
  styleUrls: ['./auth-header.component.css']
})
export class AuthHeaderComponent {


  constructor(    private authService: AuthService,  private router: Router,) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['auth/login']);
  }
}
