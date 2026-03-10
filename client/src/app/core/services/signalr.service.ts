import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Order } from '../../shared/models/order';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  hubUrl = environment.hubUrl;
  hubConnection?: HubConnection;
  orderSignal = signal<Order | null>(null);
  orderStatusUpdated = signal<Order | null>(null);

  createHubConnection() {
    // Only create connection if not already connected or connecting
    if (this.hubConnection?.state === HubConnectionState.Connected || 
        this.hubConnection?.state === HubConnectionState.Connecting) {
      return;
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        withCredentials: true  // This will include authentication cookies
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          // Exponential backoff with jitter
          const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          return delay + Math.random() * 1000;
        }
      })
      .build();

    this.hubConnection.start()
      .catch(error => {
        // Handle SignalR connection error
      });

    this.hubConnection.on('OrderCompleteNotification', (order: Order) => {
      this.orderSignal.set(order)
    });

    this.hubConnection.on('OrderStatusUpdated', (order: Order) => {
      this.orderStatusUpdated.set(order);
    });

    this.hubConnection.onreconnected(error => {
      // Handle SignalR reconnection
    });

    this.hubConnection.onclose(error => {
      // Handle SignalR connection close
    });
  }

  stopHubConnection() {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      this.hubConnection.stop()
        .catch(error => {
          // Handle SignalR stop error
        })
    }
  }
}
