import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { SearchService, SearchResult } from '../../../services/SearchService';
import { NotificationService } from '../../../services/Notification.service';
import { UserDTO, UserService } from '../../../services/UserService';

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
  styleUrls: ['./auth-header.component.css']
})
export class AuthHeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  isSearchActive = false;
  searchQuery = '';
  searchResults: SearchResult[] = [];
  recentSearches: SearchResult[] = [];
  hasUnreadNotifications = false;
  currentUser: UserDTO | null = null;

  @ViewChild('searchInput') searchInput!: ElementRef;
  
  private searchSubject = new Subject<string>();
  private userSubscription?: Subscription;

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

  ngOnInit(): void {
    this.loadRecentSearches();

    // Carrega os dados do usuário atual
    this.userSubscription = this.userService.user$.subscribe(user => {
      this.currentUser = user;
    });

    const userId = this.authService.getUserId();
    if (userId) {
      this.notificationService.connect(userId);

      this.notificationService.newNotification$.subscribe(notification => {
        this.hasUnreadNotifications = true;
      });
    }
  }

  ngAfterViewInit(): void {
    if (this.isSearchActive && this.searchInput) {
      setTimeout(() => this.searchInput.nativeElement.focus(), 0);
    }
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleSearch(event: Event): void {
    event.preventDefault();
    this.isSearchActive = !this.isSearchActive;
    
    if (this.isSearchActive) {
      setTimeout(() => {
        if (this.searchInput) {
          this.searchInput.nativeElement.focus();
        }
      }, 100);
    } else {
      this.clearSearch();
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

  getUserProfilePicture(): string {
    return this.currentUser?.profilePicture || 'img/calangos/default.png';
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'img/calangos/default.png';
  }

  logout(): void {
    this.notificationService.disconnect();
    this.authService.logout();
    this.router.navigate(['auth/login']);
  }
}