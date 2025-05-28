import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { CommentsService, Comment, CommentRequest } from '../../../services/Comment.service';
import { AuthService } from '../../../services/auth.service';
import { UserDTO, UserService } from '../../../services/UserService';
import { PostService, PostResponseDto } from '../../../services/PostService';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import Swal from 'sweetalert2';

export interface PostData {
  id: string;
  userId: string;
  username: string;
  profilePicture?: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export interface CurrentUser {
  id: string;
  username: string;
  profilePicture?: string;
}

@Component({
  selector: 'app-post-modal',
  templateUrl: './post-modal.component.html',
  styleUrls: [
    './post-modal.component.css',
    './css/modal-header.css',
    './css/modal-post.css',
    './css/modal-comments.css',
    './css/modal-media-queries.css'
  ],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ]
})
export class PostModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  comments: Comment[] = [];
  newCommentText = '';
  isLoadingComments = false;
  isSubmittingComment = false;
  commentsError = false;
  currentUser: CurrentUser | null = null;
  isLikingPost = false;

  constructor(
    public dialogRef: MatDialogRef<PostModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PostData,
    private router: Router,
    private commentsService: CommentsService,
    private authService: AuthService,
    private userService: UserService,
    private postService: PostService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadComments();
    this.subscribeToComments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.commentsService.clearComments();
  }

  private loadCurrentUser(): void {
    const cachedUser = this.userService.getCurrentUser();
    if (cachedUser) {
      this.setCurrentUser(cachedUser);
    } else {
      this.userService.loadUser()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (user) => {
            if (user) {
              this.setCurrentUser(user);
            }
          },
          error: (error) => {
            console.error('Erro ao carregar dados do usuário:', error);
          }
        });
    }

    this.userService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.setCurrentUser(user);
        }
      });
  }

  private setCurrentUser(userDto: UserDTO): void {
    this.currentUser = {
      id: userDto.id,
      username: userDto.login,
      profilePicture: userDto.profilePicture || undefined
    };
  }

  private subscribeToComments(): void {
    this.commentsService.comments$
      .pipe(takeUntil(this.destroy$))
      .subscribe(comments => {
        this.comments = comments;
      });
  }

  loadComments(): void {
    this.isLoadingComments = true;
    this.commentsError = false;

    this.commentsService.getComments(this.data.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingComments = false)
      )
      .subscribe({
        next: (comments) => {
          const commentsWithPostId = comments.map(comment => ({
            ...comment,
            postId: this.data.id
          })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.commentsService.updateCommentsSubject(commentsWithPostId);
          this.commentsError = false;
        },
        error: (error) => {
          console.error('Erro ao carregar comentários:', error);
          this.commentsError = true;
        }
      });
  }

  submitComment(): void {
    if (!this.newCommentText?.trim() || !this.currentUser) {
      return;
    }

    this.isSubmittingComment = true;

    const commentData: CommentRequest = {
      userId: this.currentUser.id,
      content: this.newCommentText.trim()
    };

    this.commentsService.createComment(this.data.id, commentData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmittingComment = false)
      )
      .subscribe({
        next: (response) => {
          const newComment: Comment = {
            id: response.id,
            postId: this.data.id,
            userId: this.currentUser!.id,
            username: response.username,
            profilePicture: response.profilePicture || this.currentUser!.profilePicture,
            content: response.content,
            createdAt: new Date(response.createdAt),
          };

          this.commentsService.addCommentToSubject(newComment);
          this.newCommentText = '';
          this.data.commentsCount = this.comments.length;
        },
        error: (error) => {
          console.error('Erro ao criar comentário:', error);
          this.showToast('error', 'Erro ao enviar comentário. Tente novamente.');
        }
      });
  }

  onCommentKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.submitComment();
    }
  }

  toggleCommentLike(comment: Comment): void {
    const updatedComment = {
      ...comment,
      isLiked: !comment.isLiked,
      likesCount: comment.isLiked ? (comment.likesCount || 0) - 1 : (comment.likesCount || 0) + 1
    };
    this.commentsService.updateCommentInSubject(updatedComment);
  }

  replyToComment(comment: Comment): void {
    this.newCommentText = `@${comment.username} `;
    setTimeout(() => {
      const textarea = document.querySelector('.comment-input textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }, 100);
  }

  deleteComment(comment: Comment): void {
    Swal.fire({
      title: 'Tem certeza que deseja excluir este comentário?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.commentsService.removeCommentFromSubject(comment.id);
        this.data.commentsCount = Math.max(0, this.data.commentsCount - 1);
        this.showToast('success', 'Comentário deletado');
        this.commentsService.deleteComment(this.data.id, comment.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {},
            error: (error) => {
              console.error('Erro ao excluir comentário:', error);
              this.showToast('error', 'Erro ao excluir comentário. Tente novamente.');
            }
          });
      }
    });
  }

  trackByCommentId(index: number, comment: Comment): string {
    return comment.id;
  }

  navigateToProfile(userId: string): void {
    this.dialogRef.close();
    this.router.navigate(['user/profile', userId]);
  }

  likePost(): void {
    if (this.isLikingPost) {
      console.log('Like action blocked: already processing', this.data.id);
      return;
    }

    this.isLikingPost = true;

    const originalLikedState = this.data.isLiked;
    const originalLikesCount = this.data.likesCount;

    console.log('Like action started:', {
      postId: this.data.id,
      originalLikedState,
      originalLikesCount,
      action: originalLikedState ? 'unlike' : 'like'
    });

    this.data.isLiked = !originalLikedState;
    this.data.likesCount = originalLikedState ? originalLikesCount - 1 : originalLikesCount + 1;

    this.postService.toggleLike(this.data.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedPost: PostResponseDto) => {
          console.log('Like response received:', {
            postId: this.data.id,
            updatedPost: {
              isLiked: updatedPost.isLiked,
              likesCount: updatedPost.likesCount
            }
          });

          this.data.isLiked = updatedPost.isLiked;
          this.data.likesCount = updatedPost.likesCount;

          console.log('Post updated with server response:', {
            postId: this.data.id,
            finalState: {
              isLiked: this.data.isLiked,
              likesCount: this.data.likesCount
            }
          });

          this.isLikingPost = false;
          
        },
        error: (error) => {
          console.error('Error liking/unliking post:', error);

          this.data.isLiked = originalLikedState;
          this.data.likesCount = originalLikesCount;

          console.log('Reverted post state after error:', {
            postId: this.data.id,
            revertedState: {
              isLiked: originalLikedState,
              likesCount: originalLikesCount
            }
          });

          this.isLikingPost = false;
          this.showToast('error', 'Erro ao curtir post. Tente novamente.');
        }
      });
  }

  getLikeButtonClass(): string {
    let classes = 'action-btn like-btn';
    if (this.data.isLiked) {
      classes += ' liked';
    }
    if (this.isLikingPost) {
      classes += ' liking';
    }
    console.log(`Post ${this.data.id} button classes:`, classes);
    return classes;
  }

  getLikeIcon(): string {
    const icon = this.data.isLiked ? 'thumb_up' : 'thumb_up_off_alt';
    console.log(`Post ${this.data.id} icon:`, icon);
    return icon;
  }

  toggleComments(): void {
    // Implementation if needed
  }

  closeModal(): void {
    this.dialogRef.close({ updated: this.data.isLiked !== this.data.isLiked }); // Pass updated flag only when closing
  }

  private showToast(icon: 'success' | 'error' | 'info', title: string) {
    Swal.fire({
      toast: true,
      position: 'bottom-end',
      icon,
      title,
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    });
  }
}