import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environment';
import { AuthService } from '../../../services/auth.service';
import { RouterModule, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { UserDTO, UserService } from '../../../services/UserService';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

interface Post {
  id: string;
  userId: string;
  username: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl?: string | null;
  createdAt: string;
  profilePicture: string | null;
  likesCount: number;
  commentsCount: number;
}

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule,
    MatMenuModule,
    MatButtonModule],
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit {
  posts: Post[] = [];
  isLoading = true;
  user: UserDTO | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserAndFetchFeed();
  }

  loadUserAndFetchFeed(): void {
  this.userService.loadUser()
    .pipe(
      switchMap(user => {
        if (!user) {
          throw new Error('Usuário não encontrado');
        }

        this.user = user;
        const token = this.authService.getToken();

        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });

        return this.http.get<Post[]>(`${environment.apiUrl}/api/feed/${user.id}`, { headers });
      }),
      catchError(error => {
        console.error('Erro ao carregar feed:', error);
        this.isLoading = false;
        return of([]);
      })
    )
    .subscribe(posts => {
      this.posts = posts;
      this.isLoading = false;
    });
}

  navigateToPost(postId: string): void {
    this.router.navigate(['user/post', postId]);
  }

navigateToProfile(userId: string): void {
  if (this.user && userId === this.user.id) {
    this.router.navigate(['user/profile']);
  } else {
    this.router.navigate(['user/profile/', userId]);
  }
}
}
