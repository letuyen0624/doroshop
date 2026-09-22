import { Injectable } from '@angular/core';

/** Tiền tố và phiên bản dữ liệu, đổi version sẽ bỏ qua dữ liệu cũ không tương thích. */
const PREFIX = 'doroshop';
const VERSION = 'v1';

/**
 * Bọc localStorage để toàn bộ ứng dụng đọc ghi qua một chỗ duy nhất.
 * Mọi thao tác đều có try/catch vì localStorage có thể bị chặn
 * (chế độ ẩn danh, trình duyệt khóa cookie, hết dung lượng).
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly memoryFallback = new Map<string, string>();
  private readonly available = this.detectAvailability();

  /** Đọc một giá trị đã lưu, trả về null nếu không có hoặc dữ liệu hỏng. */
  read<T>(key: string): T | null {
    const raw = this.readRaw(this.fullKey(key));
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Dữ liệu hỏng thì xóa đi để lần sau seed lại từ đầu.
      this.remove(key);
      return null;
    }
  }

  /** Ghi một giá trị, trả về false nếu trình duyệt không cho ghi. */
  write<T>(key: string, value: T): boolean {
    const fullKey = this.fullKey(key);
    let serialized: string;
    try {
      serialized = JSON.stringify(value);
    } catch {
      return false;
    }

    if (!this.available) {
      this.memoryFallback.set(fullKey, serialized);
      return false;
    }

    try {
      localStorage.setItem(fullKey, serialized);
      return true;
    } catch {
      this.memoryFallback.set(fullKey, serialized);
      return false;
    }
  }

  remove(key: string): void {
    const fullKey = this.fullKey(key);
    this.memoryFallback.delete(fullKey);
    if (!this.available) {
      return;
    }
    try {
      localStorage.removeItem(fullKey);
    } catch {
      /* Bỏ qua: không xóa được thì cũng không làm gì hơn được. */
    }
  }

  /** Xóa toàn bộ dữ liệu của DoroShop, dùng khi cần reset demo. */
  clearAll(): void {
    this.memoryFallback.clear();
    if (!this.available) {
      return;
    }
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`${PREFIX}.`)) {
          keys.push(key);
        }
      }
      keys.forEach((key) => localStorage.removeItem(key));
    } catch {
      /* Bỏ qua. */
    }
  }

  private fullKey(key: string): string {
    return `${PREFIX}.${VERSION}.${key}`;
  }

  private readRaw(fullKey: string): string | null {
    if (!this.available) {
      return this.memoryFallback.get(fullKey) ?? null;
    }
    try {
      return localStorage.getItem(fullKey) ?? this.memoryFallback.get(fullKey) ?? null;
    } catch {
      return this.memoryFallback.get(fullKey) ?? null;
    }
  }

  private detectAvailability(): boolean {
    try {
      const probe = `${PREFIX}.probe`;
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }
}

export const STORAGE_KEYS = {
  accounts: 'accounts',
  users: 'users',
  session: 'session',
  cart: 'cart',
  coupon: 'coupon',
  orders: 'orders',
  orderSeq: 'order-seq',
  credentials: 'credentials',
  theme: 'theme',
} as const;
