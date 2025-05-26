// notification.service.ts

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import Swal from 'sweetalert2';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private newNotificationSubject = new Subject<any>();
  public newNotification$ = this.newNotificationSubject.asObservable();

  private stompClient: Client | null = null; // ← Referência ao STOMP client

  constructor(private authService: AuthService) {}

  connect(userId: string) {
    const token = this.authService.getToken();
    const socket = new SockJS(`http://localhost:8080/ws?token=${token}`);

    this.stompClient = new Client({
      webSocketFactory: () => socket as any,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        this.stompClient?.subscribe(`/user/${userId}/queue/notifications`, (message) => {
          const notification = JSON.parse(message.body);
          this.newNotificationSubject.next(notification);

          Swal.fire({
            title: notification.title || 'Nova notificação',
            text: notification.message,
            icon: 'info',
            toast: true,
            position: 'top-end',
            timer: 5000,
            showConfirmButton: false
          });
        });
      }
    });

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.deactivate(); // ← Encerra a conexão WebSocket
      console.log('WebSocket desconectado com sucesso.');
    }
    this.stompClient = null;
  }
}
