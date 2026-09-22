import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const DEFAULT_DURATION = 3500;

/** Hàng đợi thông báo nổi ở góc màn hình, tự tắt sau vài giây. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly items = signal<Toast[]>([]);

  readonly toasts = this.items.asReadonly();

  success(message: string, duration = DEFAULT_DURATION): void {
    this.push('success', message, duration);
  }

  error(message: string, duration = DEFAULT_DURATION): void {
    this.push('error', message, duration);
  }

  info(message: string, duration = DEFAULT_DURATION): void {
    this.push('info', message, duration);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.items.update((list) => list.filter((toast) => toast.id !== id));
  }

  private push(kind: ToastKind, message: string, duration: number): void {
    const id = this.nextId++;
    this.items.update((list) => [...list, { id, kind, message }]);
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), duration),
    );
  }
}
