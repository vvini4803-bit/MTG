import { UserProfile } from '../types';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'guest_default';
  let id = localStorage.getItem('gramasiri_device_id');
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem('gramasiri_device_id', id);
  }
  return id;
}

export function getEffectiveUserId(currentUser: UserProfile | null): string {
  if (currentUser && currentUser.uid) {
    return currentUser.uid;
  }
  return getDeviceId();
}

export function getEffectiveUserName(currentUser: UserProfile | null, isKannada: boolean): string {
  if (currentUser) {
    if (isKannada && currentUser.name_kn) return currentUser.name_kn;
    if (currentUser.name) return currentUser.name;
  }
  const savedName = localStorage.getItem('gramasiri_resident_name');
  if (savedName && savedName.trim()) return savedName.trim();
  return isKannada ? 'ಗ್ರಾಮಸ್ಥರು' : 'Muttagundi Resident';
}

export function triggerHapticFeedback(): void {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(25);
    } catch {}
  }
}
