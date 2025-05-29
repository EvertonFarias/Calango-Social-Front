import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import Swal from 'sweetalert2';
import { AuthService } from './auth.service';
import { environment } from '../../environment';

export interface NotificationDTO {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderProfilePicture: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export enum NotificationType {
  FRIENDSHIP_REQUEST = 'FRIENDSHIP_REQUEST',
  FRIENDSHIP_ACCEPTED = 'FRIENDSHIP_ACCEPTED',
  NEW_COMMENT = 'NEW_COMMENT',
  NEW_LIKE = 'NEW_LIKE',
  NEW_POST = 'NEW_POST'
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  

  private apiUrl = `${environment.apiUrl}/notifications`;

  private newNotificationSubject = new Subject<NotificationDTO>();
  public newNotification$ = this.newNotificationSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<NotificationDTO[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private stompClient: Client | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  connect(userId: string) {
    const token = this.authService.getToken();
    const socket = new SockJS(`${environment.apiUrl}/ws?token=${token}`);

    this.stompClient = new Client({
      webSocketFactory: () => socket as any,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        this.stompClient?.subscribe(`/user/${userId}/queue/notifications`, (message) => {
          const notification: NotificationDTO = JSON.parse(message.body);
          this.handleNewNotification(notification);
        });

        // Carrega notificações existentes ao conectar
        this.loadNotifications(userId);
      }
    });

    this.stompClient.activate();
  }

  private handleNewNotification(notification: NotificationDTO) {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
    this.newNotificationSubject.next(notification);
    this.showNotificationToast(notification);
  }

  private showNotificationToast(notification: NotificationDTO) {
    let iconHtml = '';

    switch (notification.type) {
      case NotificationType.FRIENDSHIP_REQUEST:
        iconHtml = '<span class="material-symbols-outlined" style="color: #2196F3; font-size: 24px;">person_add</span>';
        break;
      case NotificationType.FRIENDSHIP_ACCEPTED:
        iconHtml = '<span class="material-symbols-outlined" style="color: #4CAF50; font-size: 24px;">group</span>';
        break;
      case NotificationType.NEW_COMMENT:
        iconHtml = '<span class="material-symbols-outlined" style="color: #FF9800; font-size: 24px;">chat_bubble</span>';
        break;
      case NotificationType.NEW_LIKE:
        iconHtml = '<span class="material-symbols-outlined" style="color:rgb(33, 98, 239); font-size: 24px;">thumb_up</span>';
        break;
      case NotificationType.NEW_POST:
        iconHtml = '<span class="material-symbols-outlined" style="color: #9C27B0; font-size: 24px;">article</span>';
        break;
    }

    Swal.fire({
      title: notification.title ? notification.title : 'Nova notificação',
      html: `
        <div style="display: flex; align-items: center; gap: 12px; justify-content: center;">
          ${iconHtml}
          <div>
            <div style="font-weight: 500; margin-bottom: 4px;">${notification.senderName}</div>
            <div style="color: #666; font-size: 14px;">${notification.message}</div>
          </div>
        </div>
      `,
      toast: true,
      position: 'top-end',
      timer: 5000,
      showConfirmButton: false,
      customClass: {
        popup: 'notification-toast'
      }
    });
  }

  loadNotifications(userId: string) {
    this.http.get<NotificationDTO[]>(`${this.apiUrl}/user/get-all/${userId}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (notifications) => {
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Erro ao carregar notificações:', error);
      }
    });
  }

  markAsRead(notificationId: string) {
    return this.http.put(`${this.apiUrl}/mark-as-read/${notificationId}`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  markAllAsRead(userId: string) {
    return this.http.put(`${this.apiUrl}/mark-all-as-read/${userId}`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  deleteNotification(notificationId: string, userId: string) {
    return this.http.delete(`${this.apiUrl}/user/${userId}/${notificationId}`, {
      headers: this.getAuthHeaders()
    });
  }

  deleteAllNotifications(userId: string) {
    return this.http.delete(`${this.apiUrl}/user/delete-all/${userId}`, {
      headers: this.getAuthHeaders()
    });
  }

  private updateUnreadCount() {
    const notifications = this.notificationsSubject.value;
    const unreadCount = notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  updateNotificationAsRead(notificationId: string) {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    );
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
  }

  removeNotificationLocally(notificationId: string) {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
  }

  clearAllNotificationsLocally() {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.FRIENDSHIP_REQUEST:
        return 'person_add';
      case NotificationType.FRIENDSHIP_ACCEPTED:
        return 'group';
      case NotificationType.NEW_COMMENT:
        return 'chat_bubble';
      case NotificationType.NEW_LIKE:
        return 'thumb_up';
      case NotificationType.NEW_POST:
        return 'article';
      default:
        return 'notifications';
    }
  }

  getNotificationIconColor(type: NotificationType): string {
    switch (type) {
      case NotificationType.FRIENDSHIP_REQUEST:
        return '#2196F3';
      case NotificationType.FRIENDSHIP_ACCEPTED:
        return '#4CAF50';
      case NotificationType.NEW_COMMENT:
        return '#FF9800';
      case NotificationType.NEW_LIKE:
        return 'rgb(33, 98, 239)';
      case NotificationType.NEW_POST:
        return '#9C27B0';
      default:
        return '#666';
    }
  }

  disconnect() {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.deactivate();
      console.log('WebSocket desconectado com sucesso.');
    }
    this.stompClient = null;
  }
}
