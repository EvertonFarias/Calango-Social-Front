import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environment';
import { FriendshipService, FriendshipStatusResponse } from '../../../services/FriendshipService';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PostResponseDto, PostService } from '../../../services/PostService';
import { PostModalComponent } from '../../utils/post-modal/post-modal.component';
import { MatDialog } from '@angular/material/dialog';

interface UserResponseDTO {
  id: string;
  login: string;
  dateOfBirth: string;
  profilePicture: string;
}

@Component({
  selector: 'app-visited-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './visited-profile.component.html',
  styleUrls: ['./visited-profile.component.css']
})
export class VisitedProfileComponent implements OnInit, OnDestroy {
  visitedUser: UserResponseDTO | null = null;
  posts: PostResponseDto[] = [];
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
    private http: HttpClient,
    private postService: PostService,
    private dialog: MatDialog
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
    this.postService.getPostsByUser(userId)
      .pipe(
        catchError(error => {
          console.error('Erro ao carregar posts:', error);
          return of([]);
        })
      )
      .subscribe(posts => {
        this.posts = posts;
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
    if (!this.friendshipStatus.friendshipId) return;

    this.friendshipService.acceptFriendRequest(this.friendshipStatus.friendshipId)
      .subscribe(response => {
        if (response) {
          this.friendshipStatus.isFriend = true;
          this.friendshipStatus.isPending = false;
          this.loadFriendsCount(this.visitedUser!.id);
        }
      });
  }

  declineFriendRequest(): void {
    if (!this.friendshipStatus.friendshipId) return;

    this.friendshipService.declineFriendRequest(this.friendshipStatus.friendshipId)
      .subscribe(response => {
        if (response) {
          this.friendshipStatus.isPending = false;
          this.friendshipStatus.friendshipId = undefined;
        }
      });
  }

  addFriend(): void {
    if (!this.visitedUser || this.friendshipStatus.isPending || this.friendshipStatus.isFriend) return;

    this.friendshipService.sendFriendRequest(this.visitedUser.id)
      .subscribe(response => {
        if (response) {
          this.friendshipStatus.isPending = true;
          this.friendshipStatus.isRequestSender = true;
          this.friendshipStatus.friendshipId = response.id;
        }
      });
  }

  removeFriend(): void {
    if (!this.visitedUser || !this.friendshipStatus.isFriend || !this.friendshipStatus.friendshipId) return;

    this.friendshipService.deleteFriendship(this.friendshipStatus.friendshipId)
      .subscribe(success => {
        if (success) {
          this.friendshipStatus.isFriend = false;
          this.friendshipStatus.isPending = false;
          this.friendshipStatus.friendshipId = undefined;
          this.loadFriendsCount(this.visitedUser!.id);
        }
      });
  }

  cancelFriendRequest(): void {
    if (!this.visitedUser || !this.friendshipStatus.isPending || !this.friendshipStatus.friendshipId) return;

    this.friendshipService.deleteFriendship(this.friendshipStatus.friendshipId)
      .subscribe(success => {
        if (success) {
          this.friendshipStatus.isPending = false;
          this.friendshipStatus.friendshipId = undefined;
          this.friendshipStatus.isRequestSender = false;
        }
      });
  }

  openPostModal(post: PostResponseDto): void {
    this.dialog.open(PostModalComponent, {
      data: post,
      width: '90vw',
      maxWidth: '900px',
      height: '85vh',
      maxHeight: '85vh',
      panelClass: 'custom-post-modal',
      hasBackdrop: true,
      disableClose: false
    });
  }

  getProfileImage(): string {
    if (this.visitedUser?.profilePicture?.trim()) {
      return this.visitedUser.profilePicture;
    }
    return 'img/calangos/default.png';
  }

  getButtonText(): string {
    if (this.friendshipStatus.isFriend) return 'Remover Amigo';
    if (this.friendshipStatus.isPending) return 'Cancelar Solicitação';
    return 'Adicionar Amigo';
  }

  getButtonClass(): string {
    if (this.friendshipStatus.isFriend) return 'friend-button remove-friend';
    if (this.friendshipStatus.isPending) return 'friend-button pending';
    return 'friend-button add-friend';
  }

  getButtonIcon(): string {
    if (this.friendshipStatus.isFriend) return 'person_remove';
    if (this.friendshipStatus.isPending && this.friendshipStatus.isRequestSender) return 'cancel';
    return 'person_add';
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
}