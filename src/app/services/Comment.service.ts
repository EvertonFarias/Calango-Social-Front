import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

import { AuthService } from './auth.service';
import { environment } from '../../environment';
export interface Comment {
  id: string;
  postId: string;
  userId?: string;
  username: string;
  profilePicture?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  likesCount?: number;
  isLiked?: boolean;
}

export interface CommentRequest {
  userId: string;
  content: string;
}

export interface CommentResponse {
  id: string;
  content: string;
  createdAt: string;
  profilePicture?: string;
  username: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  
  private baseUrl = `${environment.apiUrl}/api`;
  private commentsSubject = new BehaviorSubject<Comment[]>([]);
  public comments$ = this.commentsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Helper para retornar headers com token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Obter comentários de um post
   */
  getComments(postId: string): Observable<Comment[]> {
    return new Observable(observer => {
      this.http.get<CommentResponse[]>(
        `${this.baseUrl}/posts/${postId}/comments`,
        { headers: this.getAuthHeaders() }
      ).subscribe({
        next: (response) => {
          const comments: Comment[] = response.map(this.mapResponseToComment);
          observer.next(comments);
          observer.complete();
        },
        error: (error) => {
          console.error('Erro ao buscar comentários:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Criar novo comentário
   */
  createComment(postId: string, commentData: CommentRequest): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(
      `${this.baseUrl}/posts/${postId}/comments`,
      commentData,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteComment(postId: string, commentId: string): Observable<CommentResponse> {
    return this.http.delete<CommentResponse>(
      `${this.baseUrl}/posts/${postId}/comments/${commentId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Mapear resposta da API para o modelo Comment
   */
  private mapResponseToComment(response: CommentResponse): Comment {
    return {
      id: response.id,
      postId: '', // Será definido pelo componente
      username: response.username,
      userId: response.userId,
      profilePicture: response.profilePicture,
      content: response.content,
      createdAt: new Date(response.createdAt),
      likesCount: 0,
      isLiked: false
    };
  }

  // Métodos de controle local (Subject)

  updateCommentsSubject(comments: Comment[]): void {
    this.commentsSubject.next(comments);
  }

  addCommentToSubject(comment: Comment): void {
    const currentComments = this.commentsSubject.value;
    this.commentsSubject.next([comment, ...currentComments]);
  }

  updateCommentInSubject(updatedComment: Comment): void {
    const currentComments = this.commentsSubject.value;
    const index = currentComments.findIndex(c => c.id === updatedComment.id);

    if (index !== -1) {
      currentComments[index] = updatedComment;
      this.commentsSubject.next([...currentComments]);
    }
  }

  removeCommentFromSubject(commentId: string): void {
    const currentComments = this.commentsSubject.value;
    const filteredComments = currentComments.filter(c => c.id !== commentId);
    this.commentsSubject.next(filteredComments);
  }

  clearComments(): void {
    this.commentsSubject.next([]);
  }

  getCurrentComments(): Comment[] {
    return this.commentsSubject.value;
  }
}
