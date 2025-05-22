import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, of, Subscription } from 'rxjs';
import { UserDTO } from '../../../services/UserService';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environment';
import { FriendshipService, FriendshipStatusResponse } from '../../../services/FriendshipService';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

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
}

interface UserResponseDTO {
  id: string;
  login: string;
  email: string;
  role: string;
  verifiedEmail: boolean;
  gender: string;
  dateOfBirth: string;
  enabled: boolean;
  profilePicture: string;
}

@Component({
  selector: 'app-visited-profile',
  standalone: true,
  imports: [CommonModule, RouterModule,  MatIconModule,
    MatMenuModule,
    MatButtonModule],
  templateUrl: './visited-profile.component.html',
  styleUrls: ['./visited-profile.component.css']
})
export class VisitedProfileComponent implements OnInit, OnDestroy {
  visitedUser: UserResponseDTO | null = null;
  posts: Post[] = [];
  friendsCount: number = 0;
  friendshipStatus: FriendshipStatusResponse = {
    isFriend: false,
    isPending: false,
    isCurrentUser: false
  };

  private routeSubscription: Subscription | null = null;
  private currentUserId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private friendshipService: FriendshipService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();

    this.routeSubscription = this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadUserProfile(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  private loadUserProfile(id: string): void {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<UserResponseDTO>(`${environment.apiUrl}/users/${id}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Erro ao carregar dados do usuário:', error);
          this.router.navigate(['/not-found']);
          return of(null);
        })
      )
      .subscribe(user => {
        if (user) {
          this.visitedUser = user;
          this.friendshipStatus.isCurrentUser = this.currentUserId === user.id;

          if (this.friendshipStatus.isCurrentUser) {
            this.router.navigate(['/user/profile']);
            return;
          }

          this.loadUserPosts(user.id);
          this.loadFriendsCount(user.id);
          this.loadFriendshipStatus(user.id);
        }
      });
  }

  private loadUserPosts(userId: string): void {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<Post[]>(`${environment.apiUrl}/api/users/${userId}/posts`, { headers })
      .pipe(
        catchError(error => {
          console.error('Erro ao carregar posts:', error);
          return of([]);
        })
      )
      .subscribe(posts => {
        this.posts = posts.map(post => {
          if (post.videoUrl && !post.thumbnailUrl) {
            post.thumbnailUrl = 'assets/video-thumbnail-placeholder.jpg';
          }
          return post;
        });
      });
  }

  private loadFriendsCount(userId: string): void {
    this.friendshipService.getUserFriends(userId)
      .subscribe(friends => {
        this.friendsCount = friends.length;
      });
  }

  private loadFriendshipStatus(userId: string): void {
    this.friendshipService.getFriendshipStatus(userId)
      .subscribe(status => {
        this.friendshipStatus = status;
      });
  }

  acceptFriendRequest(): void {
    if (!this.friendshipStatus.friendshipId) {
      return;
    }

    this.friendshipService.acceptFriendRequest(this.friendshipStatus.friendshipId)
      .subscribe(response => {
        if (response) {
          this.friendshipStatus.isFriend = true;
          this.friendshipStatus.isPending = false;
          this.loadFriendsCount(this.visitedUser!.id); // Atualizar contagem
          console.log('Solicitação de amizade aceita');
        }
      });
  }

  declineFriendRequest(): void {
    if (!this.friendshipStatus.friendshipId) {
      return;
    }

    this.friendshipService.declineFriendRequest(this.friendshipStatus.friendshipId)
      .subscribe(response => {
        if (response) {
          this.friendshipStatus.isPending = false;
          this.friendshipStatus.friendshipId = undefined;
          console.log('Solicitação de amizade recusada');
        }
      });
  }

  addFriend(): void {
    if (!this.visitedUser || this.friendshipStatus.isPending || this.friendshipStatus.isFriend) {
      return;
    }

    this.friendshipService.sendFriendRequest(this.visitedUser.id)
      .subscribe(response => {
        if (response) {
          this.friendshipStatus.isPending = true;
          this.friendshipStatus.isRequestSender = true;
          this.friendshipStatus.friendshipId = response.id;
          console.log('Solicitação de amizade enviada com sucesso');
        }
      });
  }

  removeFriend(): void {
    if (!this.visitedUser || !this.friendshipStatus.isFriend || !this.friendshipStatus.friendshipId) {
      return;
    }

    this.friendshipService.deleteFriendship(this.friendshipStatus.friendshipId)
      .subscribe(success => {
        if (success) {
          this.friendshipStatus.isFriend = false;
          this.friendshipStatus.isPending = false;
          this.friendshipStatus.friendshipId = undefined;
          this.loadFriendsCount(this.visitedUser!.id); // Atualizar contagem
          console.log('Amigo removido com sucesso');
        }
      });
  }

  cancelFriendRequest(): void {
    if (!this.visitedUser || !this.friendshipStatus.isPending || !this.friendshipStatus.friendshipId) {
      return;
    }

    this.friendshipService.deleteFriendship(this.friendshipStatus.friendshipId)
      .subscribe(success => {
        if (success) {
          this.friendshipStatus.isPending = false;
          this.friendshipStatus.friendshipId = undefined;
          this.friendshipStatus.isRequestSender = false;
          console.log('Solicitação de amizade cancelada');
        }
      });
  }

  navigateToFullPost(postId: string): void {
    this.router.navigate(['user/post', postId]);
  }

  getProfileImage(): string {
    if (this.visitedUser?.profilePicture && 
        typeof this.visitedUser.profilePicture === 'string' && 
        this.visitedUser.profilePicture.trim() !== '') {
      return this.visitedUser.profilePicture;
    }
    return 'img/calangos/default.png';
  }

  getButtonText(): string {
    if (this.friendshipStatus.isFriend) {
      return 'Remover Amigo';
    } else if (this.friendshipStatus.isPending) {
      return 'Cancelar Solicitação';
    } else {
      return 'Adicionar Amigo';
    }
  }

  getButtonClass(): string {
    if (this.friendshipStatus.isFriend) {
      return 'friend-button remove-friend';
    } else if (this.friendshipStatus.isPending) {
      return 'friend-button pending';
    } else {
      return 'friend-button add-friend';
    }
  }

  onFriendButtonClick(): void {
    if (this.friendshipStatus.isFriend) {
      this.removeFriend();
    } else if (this.friendshipStatus.isPending) {
      this.cancelFriendRequest();
    } else {
      this.addFriend();
    }
  }
  getButtonIcon(): string {
  if (this.friendshipStatus.isFriend) {
    return 'person_remove'; // Ícone para remover amigo
  } else if (this.friendshipStatus.isPending && this.friendshipStatus.isRequestSender) {
    return 'cancel'; // Ícone para cancelar solicitação enviada
  } else {
    return 'person_add'; // Ícone para adicionar amigo
  }
}






}