import { CommonModule } from '@angular/common';
import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environment';
import { AuthService } from '../../../services/auth.service';
import { RouterModule, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { catchError, switchMap, takeUntil, debounceTime } from 'rxjs/operators';
import { UserDTO, UserService } from '../../../services/UserService';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
// import { PostModalComponent } from '../../utils/post-modal/post-modal.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PostService, PostResponseDto } from '../../../services/PostService';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatProgressSpinnerModule
    // PostModalComponent 
  ],
  templateUrl: './feed.component.html',
  styleUrls: [
    './feed.component.css', 
    './css/post-card.css',
    './css/post-media.css',
    './css/action-buttons.css',
    './css/loading.css',
    './css/like-button.css',
  ]
})
export class FeedComponent implements OnInit, OnDestroy {
  posts: PostResponseDto[] = [];
  isLoading = true;
  public isLoadingMore = false;
  user: UserDTO | null = null;
  public likingPosts = new Set<string>();
  
  // Controle de paginação
  public currentPage = 0;
  private pageSize = 20;
  public hasMorePosts = true;
  private isLoadingData = false;

  // Subject para scroll debounce e cleanup
  private scrollSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private postService: PostService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Setup scroll debouncing
    this.scrollSubject
      .pipe(
        debounceTime(100), // Debounce scroll events
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.checkAndLoadMore();
      });
  }

  ngOnInit(): void {
    console.log('FeedComponent: ngOnInit started');
    console.log('Environment API URL:', environment.apiUrl);
    this.loadUserAndFetchFeed();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Listener para scroll infinito com debounce
  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    this.scrollSubject.next();
  }

  private checkAndLoadMore(): void {
    if (this.isLoadingData || !this.hasMorePosts || this.isLoading) {
      return;
    }

    const threshold = 300; // Pixels antes do final da página para carregar mais
    const position = window.pageYOffset + window.innerHeight;
    const height = document.documentElement.scrollHeight;

    console.log('Scroll check:', {
      position,
      height,
      threshold,
      shouldLoad: position > height - threshold,
      isLoadingData: this.isLoadingData,
      hasMorePosts: this.hasMorePosts
    });

    if (position > height - threshold) {
      console.log('Loading more posts via scroll...');
      this.loadMorePosts();
    }
  }

  loadUserAndFetchFeed(): void {
    console.log('FeedComponent: loadUserAndFetchFeed started');
    this.isLoading = true;
    
    // Verificar se os serviços estão disponíveis
    if (!this.userService) {
      console.error('UserService não está disponível');
      this.showError('Erro de configuração: UserService não encontrado');
      this.isLoading = false;
      return;
    }
    
    if (!this.authService) {
      console.error('AuthService não está disponível');
      this.showError('Erro de configuração: AuthService não encontrado');
      this.isLoading = false;
      return;
    }

    console.log('Calling userService.loadUser()...');
    this.userService.loadUser()
      .pipe(
        switchMap(user => {
          console.log('User service response:', user);
          if (!user) {
            throw new Error('Usuário não encontrado');
          }

          this.user = user;
          console.log('User loaded successfully:', user);
          
          // Reset pagination state
          this.currentPage = 0;
          this.hasMorePosts = true;
          this.posts = [];
          
          console.log('Loading initial feed page...');
          return this.loadFeedPage(0);
        }),
        catchError(error => {
          console.error('Erro completo ao carregar feed:', error);
          this.isLoading = false;
          this.showError(`Erro ao carregar feed: ${error.message || error}`);
          return of([]);
        })
      )
      .subscribe({
        next: (posts) => {
          console.log('Initial posts received:', posts);
          this.posts = posts || [];
          this.isLoading = false;
          
          // Se recebeu menos posts que o pageSize, não há mais posts
          if (!posts || posts.length < this.pageSize) {
            this.hasMorePosts = false;
            console.log('No more posts available (initial load)');
          }
          
          console.log('Feed state after initial load:', {
            postsCount: this.posts.length,
            currentPage: this.currentPage,
            hasMorePosts: this.hasMorePosts
          });
        },
        error: (error) => {
          console.error('Subscribe error:', error);
          this.isLoading = false;
          this.showError('Erro na subscrição do feed');
        }
      });
  }

  private loadFeedPage(page: number) {
    console.log('loadFeedPage called with page:', page);
    
    if (!this.user) {
      console.error('User not found when trying to load feed page');
      this.showError('Usuário não encontrado');
      return of([]);
    }

    const token = this.authService.getToken();
    console.log('Token available:', !!token);
    
    if (!token) {
      console.error('Token not found');
      this.showError('Token de autenticação não encontrado. Faça login novamente.');
      return of([]);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const params = {
      page: page.toString(),
      size: this.pageSize.toString()
    };

    const url = `${environment.apiUrl}/api/feed/${this.user.id}`;
    console.log('Making HTTP request:', { 
      url, 
      page, 
      params, 
      userId: this.user.id,
      headers: headers.keys()
    });

    return this.http.get<PostResponseDto[]>(url, { headers, params })
      .pipe(
        catchError(error => {
          console.error('HTTP Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error,
            url: error.url
          });
          
          let errorMessage = 'Erro ao carregar posts';
          if (error.status === 401) {
            errorMessage = 'Sessão expirada. Faça login novamente.';
          } else if (error.status === 403) {
            errorMessage = 'Acesso negado';
          } else if (error.status === 404) {
            errorMessage = 'Endpoint não encontrado';
          } else if (error.status === 0) {
            errorMessage = 'Erro de conexão. Verifique sua internet.';
          }
          
          this.showError(errorMessage);
          return of([]);
        })
      );
  }

  loadMorePosts(): void {
    if (this.isLoadingData || !this.hasMorePosts || !this.user || this.isLoading) {
      console.log('Cannot load more posts:', {
        isLoadingData: this.isLoadingData,
        hasMorePosts: this.hasMorePosts,
        user: !!this.user,
        isLoading: this.isLoading
      });
      return;
    }

    const nextPage = this.currentPage + 1;
    console.log('Starting to load more posts, next page:', nextPage);
    
    this.isLoadingData = true;
    this.isLoadingMore = true;

    this.loadFeedPage(nextPage)
      .subscribe({
        next: (newPosts) => {
          console.log('Received new posts:', newPosts.length, newPosts);
          
          if (newPosts && newPosts.length > 0) {
            // Filtrar posts duplicados
            const uniqueNewPosts = newPosts.filter(newPost => 
              !this.posts.some(existingPost => existingPost.id === newPost.id)
            );
            
            if (uniqueNewPosts.length > 0) {
              this.posts = [...this.posts, ...uniqueNewPosts];
              this.currentPage = nextPage;
              console.log('Added unique posts:', uniqueNewPosts.length);
            }
            
            // Se recebeu menos posts que o pageSize, não há mais posts
            if (newPosts.length < this.pageSize) {
              this.hasMorePosts = false;
              console.log('No more posts available (reached end)');
            }
          } else {
            this.hasMorePosts = false;
            console.log('No new posts received');
          }
          
          console.log('Feed state after loading more:', {
            totalPosts: this.posts.length,
            currentPage: this.currentPage,
            hasMorePosts: this.hasMorePosts
          });
        },
        error: (error) => {
          console.error('Error loading more posts:', error);
          this.showError('Erro ao carregar mais posts');
        },
        complete: () => {
          this.isLoadingData = false;
          this.isLoadingMore = false;
        }
      });
  }

  // Método para recarregar feed (útil após ações como postar)
  refreshFeed(): void {
    console.log('Refreshing feed...');
    this.loadUserAndFetchFeed();
  }

  navigateToPost(postId: string): void {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      this.openPostModal(post);
    }
  }

  openPostModal(post: PostResponseDto): void {
    // Importação dinâmica do PostModalComponent
    import('../../utils/post-modal/post-modal.component').then(({ PostModalComponent }) => {
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

      dialogRef.afterClosed().subscribe(result => {
        console.log('Modal do post fechado');
        if (result && result.updated) {
          this.updateSpecificPost(post.id);
        }
      });
    }).catch(error => {
      console.error('Erro ao carregar PostModalComponent:', error);
      this.showError('Erro ao abrir modal do post');
    });
  }

  private updateSpecificPost(postId: string): void {
    if (!this.user) return;

    this.postService.getPostById(postId).subscribe({
      next: (updatedPost) => {
        const index = this.posts.findIndex(p => p.id === postId);
        if (index !== -1) {
          this.posts[index] = updatedPost;
        }
      },
      error: (error) => {
        console.error('Erro ao atualizar post:', error);
      }
    });
  }

  navigateToProfile(userId: string): void {
    if (this.user && userId === this.user.id) {
      this.router.navigate(['user/profile']);
    } else {
      this.router.navigate(['user/profile/', userId]);
    }
  }

  // MÉTODO CORRIGIDO - Fix principal do problema
  likePost(postId: string): void {
    if (this.likingPosts.has(postId)) {
      return;
    }

    this.likingPosts.add(postId);

    const postIndex = this.posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      this.likingPosts.delete(postId);
      return;
    }

    const post = this.posts[postIndex];
    const originalLikedState = post.isLiked;
    const originalLikesCount = post.likesCount;

    console.log('Like action started:', {
      postId,
      originalLikedState,
      originalLikesCount,
      action: originalLikedState ? 'unlike' : 'like'
    });

    // Atualização otimista da UI
    post.isLiked = !originalLikedState;
    post.likesCount = originalLikedState ? originalLikesCount - 1 : originalLikesCount + 1;

    this.postService.toggleLike(postId).subscribe({
      next: (updatedPost) => {
        console.log('Like response received:', {
          postId,
          updatedPost: {
            isLiked: updatedPost.isLiked,
            likesCount: updatedPost.likesCount
          }
        });

        const currentPostIndex = this.posts.findIndex(p => p.id === postId);
        if (currentPostIndex !== -1) {
          // Atualizar APENAS com os dados do servidor, sem sobrescrever outras propriedades
          this.posts[currentPostIndex] = {
            ...this.posts[currentPostIndex],
            likesCount: updatedPost.likesCount,
            isLiked: updatedPost.isLiked
          };
          
          console.log('Post updated with server response:', {
            postId,
            finalState: {
              isLiked: this.posts[currentPostIndex].isLiked,
              likesCount: this.posts[currentPostIndex].likesCount
            }
          });
        }
        this.likingPosts.delete(postId);
      },
      error: (error) => {
        console.error('Error liking/unliking post:', error);
        
        // Reverter as mudanças em caso de erro
        const currentPostIndex = this.posts.findIndex(p => p.id === postId);
        if (currentPostIndex !== -1) {
          this.posts[currentPostIndex].isLiked = originalLikedState;
          this.posts[currentPostIndex].likesCount = originalLikesCount;
          
          console.log('Reverted post state after error:', {
            postId,
            revertedState: {
              isLiked: originalLikedState,
              likesCount: originalLikesCount
            }
          });
        }
        
        this.likingPosts.delete(postId);
        this.showError('Erro ao curtir post. Tente novamente.');
      }
    });
  }

  commentOnPost(postId: string): void {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      this.openPostModal(post);
    }
  }

  isPostLiked(post: PostResponseDto): boolean {
    return post.isLiked;
  }
  

  getLikeButtonClass(post: PostResponseDto): string {
    let classes = 'action-btn like-btn';
    
    if (this.isPostLiked(post)) {
      classes += ' liked';
    }
    
    if (this.likingPosts.has(post.id)) {
      classes += ' liking';
    }

    console.log(`Post ${post.id} button classes:`, classes); // Debug
    return classes;
  }

  getLikeIcon(post: PostResponseDto): string {
    const icon = this.isPostLiked(post) ? 'thumb_up' : 'thumb_up_off_alt';
    console.log(`Post ${post.id} icon:`, icon); // Debug
    return icon;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}