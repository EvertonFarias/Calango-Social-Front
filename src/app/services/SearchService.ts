import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environment';


interface SearchResult {
  id: string;
  username: string;
  name: string;
  profilePic?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  searchUsers(query: string): Observable<SearchResult[]> {
    // return this.http.get<SearchResult[]>(`${this.apiUrl}/users/search?q=${query}`);
    
    // Para teste, você pode usar dados simulados:
    
    return of([
      { id: '1', username: 'usuario1', name: 'Nome Completo 1', profilePic: 'assets/images/avatar1.jpg' },
      { id: '2', username: 'usuario2', name: 'Nome Completo 2', profilePic: 'assets/images/avatar2.jpg' },
      { id: '3', username: 'outro_usuario', name: 'Outro Nome', profilePic: 'assets/images/avatar3.jpg' }
    ].filter(u => 
      u.username.toLowerCase().includes(query.toLowerCase()) || 
      u.name.toLowerCase().includes(query.toLowerCase())
    ));
    
  }
}