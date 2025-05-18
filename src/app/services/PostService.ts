import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { AuthService } from './auth.service';

export interface PostRequestDto {
  userId: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
}

export interface PostResponseDto {
  id: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = `${environment.apiUrl}/api/posts`;

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

  createPost(post: PostRequestDto): Observable<PostResponseDto> {
    console.log('Enviando post para:', this.apiUrl);
    console.log('Dados:', post);
    return this.http.post<PostResponseDto>(this.apiUrl, post, {
      headers: this.getAuthHeaders()
    });
  }

  getPosts(): Observable<PostResponseDto[]> {
    return this.http.get<PostResponseDto[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }
}
