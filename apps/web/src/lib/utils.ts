import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(new Date(date));
}

export function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatCurrency(amount: number, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatPhoneNumber(phone: string) {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }

  return phone;
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Role translations
export const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Süper Admin',
  ADMIN: 'Yönetici',
  THERAPIST: 'Terapist',
  RECEPTIONIST: 'Resepsiyonist',
  ACCOUNTANT: 'Muhasebe',
  CLIENT: 'Danışan',
};

// Status translations
export const statusLabels: Record<string, string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Pasif',
  SUSPENDED: 'Askıda',
  PENDING_VERIFICATION: 'Onay Bekliyor',
  SCHEDULED: 'Planlandı',
  CONFIRMED: 'Onaylandı',
  CHECKED_IN: 'Giriş Yapıldı',
  IN_PROGRESS: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
  NO_SHOW: 'Gelmedi',
  RESCHEDULED: 'Yeniden Planlandı',
  DRAFT: 'Taslak',
  REVIEWED: 'İncelendi',
  ARCHIVED: 'Arşivlendi',
  PENDING: 'Bekliyor',
  PAID: 'Ödendi',
  PARTIALLY_PAID: 'Kısmi Ödeme',
  REFUNDED: 'İade Edildi',
  FAILED: 'Başarısız',
};

// Status variant mapping for badges
export const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  SUSPENDED: 'destructive',
  PENDING_VERIFICATION: 'warning',
  SCHEDULED: 'secondary',
  CONFIRMED: 'success',
  CHECKED_IN: 'default',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
  NO_SHOW: 'destructive',
  RESCHEDULED: 'warning',
  DRAFT: 'secondary',
  REVIEWED: 'default',
  ARCHIVED: 'secondary',
  PENDING: 'warning',
  PAID: 'success',
  PARTIALLY_PAID: 'warning',
  REFUNDED: 'secondary',
  FAILED: 'destructive',
};
