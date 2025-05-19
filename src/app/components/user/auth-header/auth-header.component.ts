import { Component, ElementRef, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { SearchService } from '../../../services/SearchService';

interface SearchResult {
  id: string;
  username: string;
  name: string;
  profilePic?: string;
}
@Component({
  selector: 'app-auth-header',
  standalone: true, // importante para Standalone Components
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
export class AuthHeaderComponent implements OnInit, AfterViewInit {
  isSearchActive = false;
  searchQuery = '';
  searchResults: SearchResult[] = [];
  recentSearches: SearchResult[] = [];
  
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  private searchSubject = new Subject<string>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private searchService: SearchService
  ) {
    // Configura o debounce para evitar múltiplas chamadas à API
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  ngOnInit(): void {
    // Carrega pesquisas recentes do localStorage na inicialização
    this.loadRecentSearches();
  }

  ngAfterViewInit(): void {
    // Focará o input automaticamente quando o painel de pesquisa abrir
    if (this.isSearchActive && this.searchInput) {
      setTimeout(() => this.searchInput.nativeElement.focus(), 0);
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
    
    
    this.searchService.searchUsers(query).subscribe((results: SearchResult[]) => {
      this.searchResults = results;
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
  }

  selectSearchResult(result: SearchResult): void {
    // Navegar para o perfil do usuário
    this.router.navigate(['/user/profile', result.username]);
    
    // Salvar na lista de pesquisas recentes
    this.addToRecentSearches(result);
    
    // Fechar o painel de pesquisa
    this.closeSearch();
  }

  addToRecentSearches(result: SearchResult): void {
    // Remover se já existir para evitar duplicatas
    this.recentSearches = this.recentSearches.filter(item => item.id !== result.id);
    
    // Adicionar ao início da lista
    this.recentSearches.unshift(result);
    
    // Manter apenas os 10 mais recentes
    if (this.recentSearches.length > 10) {
      this.recentSearches = this.recentSearches.slice(0, 10);
    }
    
    // Salvar no localStorage
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
    // Impedir propagação do evento para não acionar o clique no item
    event.stopPropagation();
    
    this.recentSearches = this.recentSearches.filter(item => item.id !== id);
    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
  }

  clearAllRecentSearches(): void {
    this.recentSearches = [];
    localStorage.removeItem('recentSearches');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['auth/login']);
  }
}