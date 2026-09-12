import Paho from 'paho-mqtt';
import { UserProfile, NewsItem, EventItem, Tournament, CropItem, TempleItem, GalleryItem, ChatMessage, Conversation } from '../types';

export type SyncEventType =
  | 'USER_REGISTERED'
  | 'USER_UPDATED'
  | 'NEWS_CREATED'
  | 'NEWS_VERIFIED'
  | 'NEWS_LIKED'
  | 'EVENT_CREATED'
  | 'TOURNAMENT_CREATED'
  | 'MATCH_SCORE_UPDATED'
  | 'CROP_ADDED'
  | 'TEMPLE_ADDED'
  | 'PHOTO_ADDED'
  | 'PHOTO_LIKED'
  | 'COMMENT_ADDED'
  | 'COMMENT_LIKED'
  | 'CHAT_MESSAGE'
  | 'SYNC_REQUEST'
  | 'SYNC_RESPONSE';

export interface SyncEnvelope {
  type: SyncEventType;
  payload: any;
  senderDeviceId: string;
  senderUserId?: string;
  timestamp: string;
}

class RealtimeSyncService {
  private client: Paho.Client | null = null;
  private deviceId: string;
  private isConnected: boolean = false;
  private currentUserId: string | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<(envelope: SyncEnvelope) => void> = new Set();
  private reconnectTimer: any = null;

  constructor() {
    this.deviceId = 'dev_' + Math.random().toString(36).substring(2, 9);
    
    // 1. Browser BroadcastChannel for instant local multi-tab sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('muttagundi_local_broadcast');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.senderDeviceId !== this.deviceId) {
            this.notifyListeners(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // 2. Connect to HiveMQ Public MQTT over WebSocket Broker
    this.connectCloudBroker();
  }

  public setCurrentUser(uid: string | null) {
    const oldUid = this.currentUserId;
    this.currentUserId = uid;

    if (this.isConnected && this.client) {
      if (oldUid && oldUid !== uid) {
        try {
          this.client.unsubscribe(`muttagundi/chat/${oldUid}`);
        } catch {}
      }
      if (uid) {
        try {
          this.client.subscribe(`muttagundi/chat/${uid}`);
        } catch {}
      }
    }
  }

  private connectCloudBroker() {
    if (typeof window === 'undefined') return;

    try {
      const clientId = `mtg_${this.deviceId}_${Date.now()}`;
      // High-reliability public MQTT broker over secure WSS
      this.client = new Paho.Client('broker.hivemq.com', 8884, '/mqtt', clientId);

      this.client.onConnectionLost = (responseObject) => {
        this.isConnected = false;
        if (responseObject.errorCode !== 0) {
          console.warn('Cloud realtime broker disconnected, reconnecting in 4s:', responseObject.errorMessage);
        }
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connectCloudBroker(), 4000);
      };

      this.client.onMessageArrived = (message: Paho.Message) => {
        try {
          const envelope: SyncEnvelope = JSON.parse(message.payloadString);
          if (envelope.senderDeviceId !== this.deviceId) {
            this.notifyListeners(envelope);
          }
        } catch (err) {
          console.warn('Failed to parse realtime message:', err);
        }
      };

      this.client.connect({
        useSSL: true,
        timeout: 10,
        keepAliveInterval: 30,
        cleanSession: true,
        onSuccess: () => {
          this.isConnected = true;
          console.info('🟢 Connected to Muttagundi Village Real-Time Cloud Relay');
          
          // Subscribe to village-wide public feed
          this.client?.subscribe('muttagundi/broadcast');
          
          // Subscribe to private direct messages if logged in
          if (this.currentUserId) {
            this.client?.subscribe(`muttagundi/chat/${this.currentUserId}`);
          }

          // Request state synchronization from peers
          setTimeout(() => {
            this.broadcast('SYNC_REQUEST', { deviceId: this.deviceId });
          }, 1000);
        },
        onFailure: (err) => {
          this.isConnected = false;
          console.warn('Cloud realtime connect failed, will retry in 5s:', err.errorMessage);
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connectCloudBroker(), 5000);
        }
      });
    } catch (e) {
      console.warn('Realtime init error:', e);
    }
  }

  public subscribe(callback: (envelope: SyncEnvelope) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(envelope: SyncEnvelope) {
    this.listeners.forEach((cb) => {
      try {
        cb(envelope);
      } catch (e) {
        console.error('Error in sync listener:', e);
      }
    });
  }

  /**
   * Broadcast an update to ALL devices across the internet
   */
  public broadcast(type: SyncEventType, payload: any, targetUserId?: string) {
    const envelope: SyncEnvelope = {
      type,
      payload,
      senderDeviceId: this.deviceId,
      senderUserId: this.currentUserId || undefined,
      timestamp: new Date().toISOString()
    };

    // 1. Same-device multi-tab broadcast
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(envelope);
      } catch {}
    }

    // 2. Global Cloud Relay over MQTT WebSockets
    if (this.isConnected && this.client) {
      try {
        const topic = targetUserId ? `muttagundi/chat/${targetUserId}` : 'muttagundi/broadcast';
        const msg = new Paho.Message(JSON.stringify(envelope));
        msg.destinationName = topic;
        msg.qos = 1; // At least once delivery
        this.client.send(msg);
      } catch (err) {
        console.warn('Failed to send realtime packet:', err);
      }
    }
  }

  public isCloudConnected(): boolean {
    return this.isConnected;
  }
}

export const realtimeSync = new RealtimeSyncService();
