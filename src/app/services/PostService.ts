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
  username: string;          // ← Adicionar
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  profilePicture: string;
  createdAt: string;
  thumbnailUrl?: string | null;
  likesCount: number;        // ← Adicionar
  commentsCount: number;     // ← Adicionar
  isLiked: boolean;          // ← Adicionar
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
    return this.http.post<PostResponseDto>(this.apiUrl, post, {
      headers: this.getAuthHeaders()
    });
  }

  getPosts(): Observable<PostResponseDto[]> {
    return this.http.get<PostResponseDto[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }


  getPostById(postId: string): Observable<PostResponseDto> {
    return this.http.get<PostResponseDto>(
      `${environment.apiUrl}/api/users/posts/${postId}`,
      { headers: this.getAuthHeaders() }
    );
  }
  
  getPostsByUser(userId: string): Observable<PostResponseDto[]> {
    return this.http.get<PostResponseDto[]>(
      `${environment.apiUrl}/api/users/${userId}/posts`,
      { headers: this.getAuthHeaders() }
    );
  }

  deletePost(postId: string, userId: string) {
    return this.http.delete(`${this.apiUrl}/${postId}/users/${userId}`, {
      headers: this.getAuthHeaders()
    });
  }
}
