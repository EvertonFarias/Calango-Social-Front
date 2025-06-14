import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { SearchService, SearchResult } from '../../../services/SearchService';
import { UserDTO, UserService } from '../../../services/UserService';
import { NotificationDTO, NotificationService, NotificationType } from '../../../services/Notification.service';

@Component({
  selector: 'app-auth-header',
  standalone: true,
  imports: [
    RouterModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './auth-header.component.html',
  styleUrls: [
    './css/sidebar-base.css',
    './css/sidebar-logo.css',
    './css/sidebar-navigation.css',
    './css/sidebar-notifications.css',
    './css/sidebar-search.css',
    './css/sidebar-profile.css',
    './css/sidebar-logout.css',
    './css/sidebar-animations.css'
  ],
})
export class AuthHeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  isSearchActive = false;
  searchQuery = '';
  searchResults: SearchResult[] = [];
  recentSearches: SearchResult[] = [];
  
  // Propriedades de notificação
  notifications: NotificationDTO[] = [];
  unreadNotificationsCount = 0;
  hasUnreadNotifications = false;
  showNotificationPanel = false;
  
  currentUser: UserDTO | null = null;
  isMobile = false;

  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('searchContainer') searchContainer!: ElementRef;
  @ViewChild('notificationContainer') notificationContainer!: ElementRef;
  
  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private searchService: SearchService,
    private notificationService: NotificationService
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  // Listener para mudanças no tamanho da tela
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenSize();
  }

  // Listener para cliques globais no documento
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Verifica se o clique foi fora do container de busca
    if (this.isSearchActive && this.searchContainer && !this.searchContainer.nativeElement.contains(target)) {
      this.closeSearch();
    }
    
    // Verifica se o clique foi fora do container de notificações
    if (this.showNotificationPanel && this.notificationContainer && !this.notificationContainer.nativeElement.contains(target)) {
      this.closeNotificationPanel();
    }
  }

  // Listener para a tecla ESC
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isSearchActive) {
      this.closeSearch();
    }
    if (this.showNotificationPanel) {
      this.closeNotificationPanel();
    }
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadRecentSearches();
    this.initializeUser();
    this.initializeNotifications();
  }

  ngAfterViewInit(): void {
    if (this.isSearchActive && this.searchInput) {
      setTimeout(() => this.searchInput.nativeElement.focus(), 0);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.notificationService.disconnect();
  }

  private initializeUser(): void {
    const userSub = this.userService.user$.subscribe(user => {
      this.currentUser = user;
    });
    this.subscriptions.push(userSub);
  }

  private initializeNotifications(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    // Conecta ao WebSocket
    this.notificationService.connect(userId);

    // Subscreve às notificações
    const notificationsSub = this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });

    // Subscreve ao contador de não lidas
    const unreadCountSub = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadNotificationsCount = count;
      this.hasUnreadNotifications = count > 0;
    });

    // Subscreve a novas notificações (para efeitos visuais adicionais se necessário)
    const newNotificationSub = this.notificationService.newNotification$.subscribe(notification => {
      // Aqui você pode adicionar lógica adicional quando uma nova notificação chegar
      console.log('Nova notificação recebida:', notification);
    });

    this.subscriptions.push(notificationsSub, unreadCountSub, newNotificationSub);
  }

  // Método para verificar o tamanho da tela
  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    // Fecha painéis quando muda para mobile para evitar problemas de layout
    if (this.isMobile) {
      this.closeAllPanels();
    }
  }

  // Método para fechar todos os painéis (útil quando clicar em outros ícones)
  private closeAllPanels(): void {
    this.closeSearch();
    this.closeNotificationPanel();
  }

  // Métodos de Search (atualizados)
  toggleSearch(event: Event): void {
    event.preventDefault();
    event.stopPropagation(); // Impede a propagação do evento
    
    // Se já está ativo, fecha; senão abre e fecha outros painéis
    if (this.isSearchActive) {
      this.closeSearch();
    } else {
      this.closeNotificationPanel(); // Fecha painel de notificações
      this.isSearchActive = true;
      
      setTimeout(() => {
        if (this.searchInput) {
          this.searchInput.nativeElement.focus();
        }
      }, 100);
    }
  }

  closeSearch(): void {
    this.isSearchActive = false;
    this.clearSearch();
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  performSearch(query: string): void {
    if (!query.trim()) {
      this.searchResults = [];
      return;
    }
    
    const currentUserId = this.authService.getUserId() ?? '';
    this.searchService.searchUsers(query, currentUserId).subscribe((results: SearchResult[]) => {
      this.searchResults = results;
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
  }

  selectSearchResult(result: SearchResult): void {
    this.router.navigate(['/user/profile', result.id]);
    this.addToRecentSearches(result);
    this.closeSearch();
  }

  addToRecentSearches(result: SearchResult): void {
    this.recentSearches = this.recentSearches.filter(item => item.id !== result.id);
    this.recentSearches.unshift(result);
    
    if (this.recentSearches.length > 10) {
      this.recentSearches = this.recentSearches.slice(0, 10);
    }
    
    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
  }

  loadRecentSearches(): void {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        this.recentSearches = JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao carregar pesquisas recentes:', e);
        this.recentSearches = [];
      }
    }
  }

  removeRecentSearch(id: string, event: Event): void {
    event.stopPropagation();
    this.recentSearches = this.recentSearches.filter(item => item.id !== id);
    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
  }

  clearAllRecentSearches(): void {
    this.recentSearches = [];
    localStorage.removeItem('recentSearches');
  }

  // Métodos de Notificação (atualizados)
  toggleNotificationPanel(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation(); // Impede a propagação do evento
    }
    
    // Se já está ativo, fecha; senão abre e fecha outros painéis
    if (this.showNotificationPanel) {
      this.closeNotificationPanel();
    } else {
      this.closeSearch(); // Fecha painel de busca
      this.showNotificationPanel = true;
      
      if (this.hasUnreadNotifications) {
        // Marca todas como lidas quando abre o painel
        this.markAllNotificationsAsRead();
      }
    }
  }

  closeNotificationPanel(): void {
    this.showNotificationPanel = false;
  }

  markAllNotificationsAsRead(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.notificationService.markAllAsRead(userId).subscribe({
      next: () => {
        // Atualiza localmente
        this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
        this.hasUnreadNotifications = false;
        this.unreadNotificationsCount = 0;
      },
      error: (error) => {
        console.error('Erro ao marcar notificações como lidas:', error);
      }
    });
  }

  markNotificationAsRead(notification: NotificationDTO): void {
    if (notification.isRead) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        this.notificationService.updateNotificationAsRead(notification.id);
      },
      error: (error) => {
        console.error('Erro ao marcar notificação como lida:', error);
      }
    });
  }

  deleteNotification(notification: NotificationDTO, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const userId = this.authService.getUserId();
    if (!userId) return;

    this.notificationService.deleteNotification(notification.id, userId).subscribe({
      next: () => {
        this.notificationService.removeNotificationLocally(notification.id);
      },
      error: (error) => {
        console.error('Erro ao deletar notificação:', error);
      }
    });
  }

  clearAllNotifications(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.notificationService.deleteAllNotifications(userId).subscribe({
      next: () => {
        this.notificationService.clearAllNotificationsLocally();
      },
      error: (error) => {
        console.error('Erro ao limpar todas as notificações:', error);
      }
    });
  }

  onNotificationClick(notification: NotificationDTO): void {
    // Marca como lida se não estiver
    this.markNotificationAsRead(notification);

    // Navega baseado no tipo de notificação
    this.navigateBasedOnNotificationType(notification);
    
    // Fecha o painel
    this.closeNotificationPanel();
  }

  private navigateBasedOnNotificationType(notification: NotificationDTO): void {
    switch (notification.type) {
      case NotificationType.FRIENDSHIP_REQUEST:
        this.router.navigate(['/user/profile', notification.senderId]);
        break;
      case NotificationType.FRIENDSHIP_ACCEPTED:
        this.router.navigate(['/user/profile', notification.senderId]);
        break;
      case NotificationType.NEW_COMMENT:
      case NotificationType.NEW_LIKE:
        if (notification.referenceId) {
          this.router.navigate(['/user/post', notification.referenceId]);
        }
        break;
      case NotificationType.NEW_POST:
        this.router.navigate(['/user/profile', notification.senderId]);
        break;
      default:
        // Navegação padrão para o perfil do remetente
        this.router.navigate(['/user/profile', notification.senderId]);
    }
  }

  getNotificationIcon(type: NotificationType): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getNotificationIconColor(type: NotificationType): string {
    return this.notificationService.getNotificationIconColor(type);
  }

  getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Agora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}m`;
    return `${Math.floor(diffInSeconds / 31536000)}a`;
  }

  // Métodos do usuário (mantidos do código original)
  getUserProfilePicture(): string {
    return this.currentUser?.profilePicture || 'img/calangos/default.png';
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'img/calangos/default.png';
  }

  trackByNotificationId(index: number, notification: NotificationDTO): string {
    return notification.id;
  }

  // Método para ser chamado quando clicar em outros ícones da sidebar
  onSidebarItemClick(): void {
    this.closeAllPanels();
  }

  logout(): void {
    this.closeAllPanels();
    this.notificationService.disconnect();
    this.authService.logout();
    this.router.navigate(['auth/login']);
  }
}