import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { switchMap, of, catchError } from 'rxjs';
import { UserDTO, UserService } from '../../../services/UserService';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environment';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FriendshipService } from '../../../services/FriendshipService';
import { PostService } from '../../../services/PostService';
import Swal from 'sweetalert2';

interface Post {
  id: string;
  userId: string;
  username: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl?: string | null; // Para thumbnails de vídeos
  createdAt: string;
  profilePicture: string | null;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule,MatIconModule, MatMenuModule,
    MatButtonModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

  user: UserDTO | null = null;
  posts: Post[] = [];
  friendsCount: number = 0;

  isModalOpen = false;
  calangoImages: string[] = [];
  selectedProfileImage: string = ''; 

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

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private friendshipService: FriendshipService,
    private postsService: PostService
  ) {}

  ngOnInit(): void {
    this.calangoImages = Array.from({ length: 10 }, (_, i) => `img/calangos/calango-${i + 1}.png`);

    this.userService.user$
      .pipe(
        switchMap(user => {
          if (user && this.authService.isLoggedIn()) {
            this.user = user;
            this.loadFriendsCount(user.id);

            this.selectedProfileImage = (typeof user.profilePicture === 'string' && user.profilePicture.trim() !== '')
              ? user.profilePicture
              : 'img/calangos/default.png';

            // Carregar contagem de seguidores e seguindo (simulados por enquanto)
            

            const token = this.authService.getToken();
            const headers = new HttpHeaders({
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            });

            return this.http.get<Post[]>(`${environment.apiUrl}/api/users/${user.id}/posts`, {
              headers,
              observe: 'body'
            }).pipe(
              catchError(error => {
                console.error('Erro na requisição:', error);
                return of([]);
              })
            );
          }
          return of([]);
        })
      )
      .subscribe(posts => {
        // Adicionar thumbnails para vídeos se não existirem
        this.posts = posts.map(post => {
          if (post.videoUrl && !post.thumbnailUrl) {
            // Se não tiver thumbnail, usa uma imagem padrão
            post.thumbnailUrl = 'assets/video-thumbnail-placeholder.jpg';
          }
          return post;
        });
      });
  }

  // Simula o carregamento de estatísticas de seguidores (em uma aplicação real, isso viria da API)
  

  // Navega para a página do post completo
  navigateToFullPost(postId: string): void {
    this.router.navigate(['user/post', postId]);
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
  

  selectImage(imagePath: string): void {
    if (!imagePath || imagePath.trim() === '') {
      this.selectedProfileImage = 'img/calangos/calango-10.png';
    } else {
      this.selectedProfileImage = imagePath;

      const token = this.authService.getToken();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      this.http.put(
        `${environment.apiUrl}/users/${this.user?.id}/profile-pic`,
        { profilePicture: imagePath },
        { headers }
      ).subscribe({
        next: () => console.log('Imagem de perfil atualizada com sucesso'),
        error: err => console.error('Erro ao atualizar imagem de perfil:', err)
      });
    }

    this.closeModal();
  }
    private loadFriendsCount(userId: string): void {
    this.friendshipService.getUserFriends(userId)
      .subscribe(friends => {
        this.friendsCount = friends.length;
      });
  }

deletePost(postId: string): void {
  const userId = this.authService.getUserId();
  if (userId) {
    this.postsService.deletePost(postId, userId).subscribe({
      next: () => {
        console.log('Post deletado com sucesso.');
        this.showToast("success", "Post deletado com sucesso");
        this.posts = this.posts.filter(post => post.id !== postId);
      },
      error: (err) => {
        console.error('Erro ao deletar post:', err);
        this.showToast("error", "Erro ao deletar o post");
      }
    });
  } else {
    console.error('Usuário não autenticado. Não é possível deletar o post.');
  }
}

}