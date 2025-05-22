import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environment';

export interface FriendshipModel {
  id: string;
  sender: {
    id: string;
    login: string;
    profilePicture: string;
  };
  receiver: {
    id: string;
    login: string;
    profilePicture: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}

export interface FriendshipStatusResponse {
  isFriend: boolean;
  isPending: boolean;
  isCurrentUser: boolean;
  friendshipId?: string;
  isRequestSender?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FriendshipService {

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Verificar status de amizade entre dois usuários
  getFriendshipStatus(userId: string): Observable<FriendshipStatusResponse> {
    const currentUserId = this.authService.getUserId();
    
    if (!currentUserId) {
      return of({
        isFriend: false,
        isPending: false,
        isCurrentUser: false
      });
    }

    if (currentUserId === userId) {
      return of({
        isFriend: false,
        isPending: false,
        isCurrentUser: true
      });
    }

    return this.http.get<FriendshipModel[]>(`${environment.apiUrl}/users/friendships/user/${currentUserId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(friendships => {
        // Procura por amizades que envolvam os dois usuários
        // Agora consideramos apenas uma amizade por par de usuários
        const friendship = friendships.find(f => 
          (f.sender.id === userId && f.receiver.id === currentUserId) ||
          (f.sender.id === currentUserId && f.receiver.id === userId)
        );

        if (friendship) {
          return {
            isFriend: friendship.status === 'ACCEPTED',
            isPending: friendship.status === 'PENDING',
            isCurrentUser: false,
            friendshipId: friendship.id,
            isRequestSender: friendship.sender.id === currentUserId
          };
        }

        return {
          isFriend: false,
          isPending: false,
          isCurrentUser: false
        };
      }),
      catchError(error => {
        console.error('Erro ao carregar status de amizade:', error);
        return of({
          isFriend: false,
          isPending: false,
          isCurrentUser: false
        });
      })
    );
  }

  // Enviar solicitação de amizade
  sendFriendRequest(receiverId: string): Observable<FriendshipModel | null> {
    const senderId = this.authService.getUserId();
    
    if (!senderId) {
      return of(null);
    }

    return this.http.post<FriendshipModel>(
      `${environment.apiUrl}/users/friendships/request?senderId=${senderId}&receiverId=${receiverId}`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erro ao enviar solicitação de amizade:', error);
        return of(null);
      })
    );
  }

  // Aceitar solicitação de amizade
  acceptFriendRequest(friendshipId: string): Observable<FriendshipModel | null> {
    return this.http.put<FriendshipModel>(
      `${environment.apiUrl}/users/friendships/${friendshipId}/accept`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erro ao aceitar solicitação de amizade:', error);
        return of(null);
      })
    );
  }

  // Recusar solicitação de amizade
  declineFriendRequest(friendshipId: string): Observable<FriendshipModel | null> {
    return this.http.put<FriendshipModel>(
      `${environment.apiUrl}/users/friendships/${friendshipId}/decline`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erro ao recusar solicitação de amizade:', error);
        return of(null);
      })
    );
  }

  // Deletar amizade ou cancelar solicitação
  deleteFriendship(friendshipId: string): Observable<boolean> {
    const userId = this.authService.getUserId();

    if (!userId) {
      console.error('Usuário não autenticado ao tentar cancelar amizade.');
      return of(false);
    }

    return this.http.delete(
      `${environment.apiUrl}/users/friendships/${friendshipId}`,
      {
        headers: this.getHeaders().set('userId', userId),
        responseType: 'text'
      }
    ).pipe(
      map(() => true),
      catchError(error => {
        console.error('Erro ao cancelar amizade:', error);
        return of(false);
      })
    );
  }

  // Listar todas as amizades de um usuário (inclui aceitas e pendentes)
  getUserFriendships(userId: string): Observable<FriendshipModel[]> {
    return this.http.get<FriendshipModel[]>(
      `${environment.apiUrl}/users/friendships/user/${userId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erro ao carregar amizades:', error);
        return of([]);
      })
    );
  }

  // Listar apenas amigos aceitos de um usuário
  getUserFriends(userId: string): Observable<FriendshipModel[]> {
    return this.getUserFriendships(userId).pipe(
      map(friendships => friendships.filter(f => f.status === 'ACCEPTED'))
    );
  }

  // Listar solicitações pendentes recebidas pelo usuário atual
  getPendingRequests(): Observable<FriendshipModel[]> {
    const currentUserId = this.authService.getUserId();
    
    if (!currentUserId) {
      return of([]);
    }

    return this.getUserFriendships(currentUserId).pipe(
      map(friendships => friendships.filter(f => 
        f.status === 'PENDING' && f.receiver.id === currentUserId
      ))
    );
  }

  // Listar solicitações pendentes enviadas pelo usuário atual
  getSentPendingRequests(): Observable<FriendshipModel[]> {
    const currentUserId = this.authService.getUserId();
    
    if (!currentUserId) {
      return of([]);
    }

    return this.getUserFriendships(currentUserId).pipe(
      map(friendships => friendships.filter(f => 
        f.status === 'PENDING' && f.sender.id === currentUserId
      ))
    );
  }
}