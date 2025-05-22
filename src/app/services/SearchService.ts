import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { AuthService } from './auth.service';

export interface SearchResult {
  id: string;
  username: string;
  profilePicture?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = `${environment.apiUrl}/users/search`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  searchUsers(query: string, currentUserId: string): Observable<SearchResult[]> {
    const url = `${this.apiUrl}/${encodeURIComponent(query)}/exclude/${currentUserId}`;
    return this.http.get<SearchResult[]>(url, {
      headers: this.getAuthHeaders()
    });
  }



}
