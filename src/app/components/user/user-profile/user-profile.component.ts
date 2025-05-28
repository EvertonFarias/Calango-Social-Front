import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { switchMap, of, catchError } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';

import { UserDTO, UserService } from '../../../services/UserService';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environment';
import { FriendshipService } from '../../../services/FriendshipService';
import { PostService, PostResponseDto } from '../../../services/PostService';
import { PostModalComponent } from '../../utils/post-modal/post-modal.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./css/user-profile.component.css','./css/modal.css']
})
export class UserProfileComponent implements OnInit {

  user: UserDTO | null = null;
  posts: PostResponseDto[] = [];
  friendsCount: number = 0;

  isModalOpen = false;
  calangoImages: string[] = [];
  selectedProfileImage: string = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private friendshipService: FriendshipService,
    private postsService: PostService,
    private dialog: MatDialog
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

            return this.postsService.getPostsByUser(user.id).pipe(
              catchError(error => {
                console.error('Erro ao carregar posts:', error);
                return of([]);
              })
            );
          }
          return of([]);
        })
      )
      .subscribe(posts => {
        this.posts = posts.map(post => ({
          ...post,
          thumbnailUrl: post.videoUrl && !post.thumbnailUrl ? 'assets/video-thumbnail-placeholder.jpg' : post.thumbnailUrl
        }));
      });
  }

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

  navigateToFullPost(postId: string): void {
    this.router.navigate(['user/post', postId]);
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  navigateToPost(postId: string): void {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      this.openPostModal(post);
    }
  }

  openPostModal(post: PostResponseDto): void {
    const dialogRef = this.dialog.open(PostModalComponent, {
      data: post,
      width: '90vw',
      maxWidth: '900px',
      height: '85vh',
      maxHeight: '85vh',
      panelClass: 'custom-post-modal',
      hasBackdrop: true,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('Modal do post fechado');
    });
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

      this.postsService['http'].put(
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
