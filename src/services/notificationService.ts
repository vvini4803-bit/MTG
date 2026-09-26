// Notification Service for Mobile & Web Push Notifications
// Supports Service Worker notifications, vibration, audio chimes, and in-app alert toasts

export interface PushNotificationPayload {
  title_kn: string;
  title_en: string;
  body_kn: string;
  body_en: string;
  section?: string;
  itemId?: string;
  icon?: string;
  urgent?: boolean;
}

type NotificationListener = (payload: PushNotificationPayload) => void;

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private inAppListeners: Set<NotificationListener> = new Set();
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initServiceWorker();
      this.listenToSwMessages();
    }
  }

  /**
   * Register the Service Worker for background push notifications
   */
  public async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;
      console.info('🔔 Service Worker successfully registered for push notifications');

      // Listen for updates
      reg.onupdatefound = () => {
        const installingWorker = reg.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.info('New version of Service Worker available.');
            }
          };
        }
      };

      return reg;
    } catch (err) {
      console.warn('Service worker registration failed:', err);
      return null;
    }
  }

  /**
   * Listen to messages sent from the Service Worker (e.g. user tapped notification)
   */
  private listenToSwMessages() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NAVIGATE_SECTION' && event.data.section) {
        // Dispatch custom event for App.tsx to catch and navigate
        window.dispatchEvent(
          new CustomEvent('mtg_navigate', {
            detail: { section: event.data.section, itemId: event.data.itemId }
          })
        );
      }
    });
  }

  /**
   * Check if notifications are supported on this device/browser
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current permission state: 'granted' | 'denied' | 'default'
   */
  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request permission from user to send mobile push notifications
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        this.playChime();
        this.vibrate([100, 50, 100]);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return false;
    }
  }

  /**
   * Mobile haptic vibration feedback
   */
  public vibrate(pattern: number[] = [200, 100, 200]) {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

  /**
   * Play a clean, pleasant notification chime via Web Audio API
   */
  public playChime(isUrgent = false) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (isUrgent) {
        // High attention alert chime: 784 Hz (G5) -> 1046 Hz (C6) -> 784 Hz
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(784, now);
        osc.frequency.setValueAtTime(1046, now + 0.15);
        osc.frequency.setValueAtTime(784, now + 0.3);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.start(now);
        osc.stop(now + 0.55);
      } else {
        // Pleasant village chime: 587 Hz (D5) -> 880 Hz (A5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880.0, now + 0.12);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {}
  }

  /**
   * Crisp, soft pop when message or photo is successfully sent (like WhatsApp)
   */
  public playMessageSent() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1174, now + 0.06);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.start(now);
      osc.stop(now + 0.08);
      this.vibrate([40]);
    } catch {}
  }

  /**
   * Distinct, pleasant incoming message chime (like WhatsApp)
   */
  public playMessageReceived() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(880.0, now + 0.08); // A5
      osc.frequency.setValueAtTime(1318.51, now + 0.16); // E6

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.4);
      this.vibrate([80, 50, 80]);
    } catch {}
  }

  /**
   * Trigger both a system/mobile push notification AND in-app floating banner
   */
  public async sendNotification(payload: PushNotificationPayload, isKannada = true): Promise<void> {
    const title = isKannada ? payload.title_kn : payload.title_en;
    const body = isKannada ? payload.body_kn : payload.body_en;

    // 1. Play sound & trigger mobile vibration
    this.playChime(payload.urgent);
    this.vibrate(payload.urgent ? [300, 100, 300, 100, 300] : [200, 100, 200]);

    // 2. Dispatch in-app notification event for open UI banner toast
    this.inAppListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (e) {
        console.error('Error in inAppListener:', e);
      }
    });

    // 3. System / Mobile Notification Tray
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const options: NotificationOptions = {
          body,
          icon: payload.icon || '/logo-192.png',
          badge: '/logo-192.png',
          tag: payload.section || 'mtg-notification',
          data: {
            url: `/?tab=${payload.section || 'news'}`,
            section: payload.section || 'news',
            itemId: payload.itemId
          }
        };

        // Try using Service Worker registration first (standard for Android / mobile PWA)
        if (this.swRegistration && 'showNotification' in this.swRegistration) {
          await this.swRegistration.showNotification(title, options);
        } else if ('serviceWorker' in navigator) {
          const readyReg = await navigator.serviceWorker.ready;
          await readyReg.showNotification(title, options);
        } else {
          // Standard browser fallback
          new Notification(title, options);
        }
      } catch (err) {
        console.warn('System notification delivery failed:', err);
      }
    }
  }

  /**
   * Subscribe to in-app notification events
   */
  public onInAppNotification(callback: NotificationListener): () => void {
    this.inAppListeners.add(callback);
    return () => this.inAppListeners.delete(callback);
  }

  /**
   * Send a test mobile push notification with sound, vibration, and system tray banner
   */
  public async sendTestNotification(isKannada = true): Promise<boolean> {
    await this.sendNotification(
      {
        title_kn: '🔔 ಮುತ್ತಾಗೊಂದಿ ಡಿಜಿಟಲ್ ಗ್ರಾಮ ಪೋರ್ಟಲ್',
        title_en: '🔔 Muttagundi Digital Village Portal',
        body_kn: 'ಮೊಬೈಲ್ ನೋಟಿಫಿಕೇಶನ್‌ಗಳು ಮತ್ತು ಸಂದೇಶಗಳು ನಿಮ್ಮ ಸಾಧನದಲ್ಲಿ ಯಶಸ್ವಿಯಾಗಿ ಸಕ್ರಿಯಗೊಂಡಿವೆ!',
        body_en: 'Mobile notifications and instant messages are now 100% active on your device!',
        section: 'notifications',
        urgent: false
      },
      isKannada
    );
    return true;
  }
}

export const notificationService = new NotificationService();
