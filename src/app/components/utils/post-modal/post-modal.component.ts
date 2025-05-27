import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { CommentsService, Comment, CommentRequest } from '../../../services/Comment.service';
import { AuthService } from '../../../services/auth.service';
import { UserDTO, UserService } from '../../../services/UserService';
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
  styleUrls: ['./post-modal.component.css'],
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

  constructor(
    public dialogRef: MatDialogRef<PostModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PostData,
    private router: Router,
    private commentsService: CommentsService,
    private authService: AuthService,
    private userService: UserService
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

  /**
   * Carrega informações do usuário atual
   */
  private loadCurrentUser(): void {
    // Primeiro tenta obter do cache do UserService
    const cachedUser = this.userService.getCurrentUser();
    
    if (cachedUser) {
      this.setCurrentUser(cachedUser);
    } else {
      // Se não tem no cache, carrega do servidor
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

    // Também se inscreve nas mudanças futuras do usuário
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
      username: userDto.login, // Usando 'login' como username
      profilePicture: userDto.profilePicture || undefined
    };
  }

  /**
   * Se inscreve nas mudanças dos comentários
   */
  private subscribeToComments(): void {
    this.commentsService.comments$
      .pipe(takeUntil(this.destroy$))
      .subscribe(comments => {
        this.comments = comments;
      });
  }

  /**
   * Carrega os comentários do post
   */
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
          // Adicionar postId aos comentários e ordenar por data (mais recentes primeiro)
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

  /**
   * Submete um novo comentário
   */
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
          
          // Atualizar contador de comentários
          this.data.commentsCount = this.comments.length;
        },
        error: (error) => {
          console.error('Erro ao criar comentário:', error);
          // Implementar notificação de erro para o usuário
          alert('Erro ao enviar comentário. Tente novamente.');
        }
      });
  }

  /**
   * Lida com o evento de tecla no textarea do comentário
   */
  onCommentKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.submitComment();
    }
  }

  /**
   * Curte ou descurte um comentário
   * Nota: Implementação local até que a API tenha endpoint para curtir comentários
   */
  toggleCommentLike(comment: Comment): void {
    // Implementação local para desenvolvimento
    const updatedComment = {
      ...comment,
      isLiked: !comment.isLiked,
      likesCount: comment.isLiked ? 
        (comment.likesCount || 0) - 1 : 
        (comment.likesCount || 0) + 1
    };

    this.commentsService.updateCommentInSubject(updatedComment);

    // TODO: Implementar quando a API tiver endpoint para curtir comentários
    /* 
    this.commentsService.toggleCommentLike(this.data.id, comment.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const updatedComment = {
            ...comment,
            isLiked: response.isLiked,
            likesCount: response.likesCount
          };
          this.commentsService.updateCommentInSubject(updatedComment);
        },
        error: (error) => {
          console.error('Erro ao curtir comentário:', error);
        }
      });
    */
  }

  /**
   * Responder a um comentário
   */
  replyToComment(comment: Comment): void {
    this.newCommentText = `@${comment.username} `;
    // Focar no input de comentário
    setTimeout(() => {
      const textarea = document.querySelector('.comment-input textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }, 100);
  }

  /**
   * Excluir um comentário
   * Nota: Implementação local até que a API tenha endpoint para deletar comentários
   */
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
      this.showToast("success", "Comentário deletado")
      this.commentsService.deleteComment(this.data.id, comment.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Nenhuma notificação aqui
          },
          error: (error) => {
            console.error('Erro ao excluir comentário:', error);
            this.showToast("error", "Erro ao excluir comentário. Tente novamente.");
          }
        });
    }
  });
}


  /**
   * TrackBy function para otimizar a renderização da lista
   */
  trackByCommentId(index: number, comment: Comment): string {
    return comment.id;
  }

  /**
   * Navega para o perfil do usuário
   */
  navigateToProfile(userId: string): void {
    this.dialogRef.close();
    this.router.navigate(['user/profile', userId]);
  }

  /**
   * Curte o post
   * Nota: Implementar com a API de posts quando disponível
   */
  likePost(): void {
    // Implementação local para desenvolvimento
    this.data.isLiked = !this.data.isLiked;
    this.data.likesCount += this.data.isLiked ? 1 : -1;

    // TODO: Implementar com a API de posts
    /*
    this.postsService.togglePostLike(this.data.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.data.isLiked = response.isLiked;
          this.data.likesCount = response.likesCount;
        },
        error: (error) => {
          console.error('Erro ao curtir post:', error);
          // Reverter mudança local em caso de erro
          this.data.isLiked = !this.data.isLiked;
          this.data.likesCount += this.data.isLiked ? 1 : -1;
        }
      });
    */
  }

  /**
   * Toggle dos comentários (se necessário)
   */
  toggleComments(): void {
    // Implementar se necessário - pode ser usado para mostrar/ocultar seção de comentários
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}