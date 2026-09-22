import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, delay, from, of, switchMap, throwError } from 'rxjs';
import { Credentials, PublicUser, RegisterPayload, User } from '../models';
import { hashPassword } from './sha256';
import { STORAGE_KEYS, StorageService } from './storage.service';

const LATENCY = 260;

/** Hai tài khoản demo được tạo sẵn, mật khẩu đã băm SHA-256. */
const USERS_SEED: readonly User[] = [
  {
    id: 'u-admin',
    name: 'Quản trị viên',
    email: 'admin@doroshop.vn',
    // admin123
    passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    role: 'admin',
  },
  {
    id: 'u-demo',
    name: 'Khách hàng Demo',
    email: 'demo@doroshop.vn',
    // demo123
    passwordHash: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791',
    role: 'customer',
  },
];

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

/**
 * Xác thực giả lập chạy hoàn toàn ở trình duyệt.
 * Mật khẩu được băm SHA-256 trước khi lưu, nhưng đây vẫn chỉ là demo:
 * không có muối, không giới hạn số lần thử, và ai mở DevTools cũng đọc được dữ liệu.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(StorageService);

  private readonly users = signal<User[]>(this.loadUsers());
  private readonly currentUserSignal = signal<PublicUser | null>(this.loadSession());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUserSignal() !== null);
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');

  login(credentials: Credentials): Observable<PublicUser> {
    const email = credentials.email.trim().toLowerCase();
    return from(hashPassword(credentials.password)).pipe(
      delay(LATENCY),
      switchMap((hash) => {
        const user = this.users().find((candidate) => candidate.email === email);
        if (!user || user.passwordHash !== hash) {
          return throwError(() => new Error('Email hoặc mật khẩu không đúng'));
        }
        const publicUser = toPublicUser(user);
        this.setSession(publicUser);
        return of(publicUser);
      }),
    );
  }

  register(payload: RegisterPayload): Observable<PublicUser> {
    const email = payload.email.trim().toLowerCase();
    if (this.users().some((user) => user.email === email)) {
      return throwError(() => new Error('Email này đã được đăng ký')).pipe(delay(LATENCY));
    }

    return from(hashPassword(payload.password)).pipe(
      delay(LATENCY),
      switchMap((hash) => {
        const user: User = {
          id: `u-${Date.now().toString(36)}`,
          name: payload.name.trim(),
          email,
          passwordHash: hash,
          role: 'customer',
        };
        const next = [...this.users(), user];
        this.users.set(next);
        this.storage.write(STORAGE_KEYS.users, next);

        const publicUser = toPublicUser(user);
        this.setSession(publicUser);
        return of(publicUser);
      }),
    );
  }

  logout(): void {
    this.currentUserSignal.set(null);
    this.storage.remove(STORAGE_KEYS.session);
  }

  private setSession(user: PublicUser): void {
    this.currentUserSignal.set(user);
    this.storage.write(STORAGE_KEYS.session, user);
  }

  private loadUsers(): User[] {
    const stored = this.storage.read<User[]>(STORAGE_KEYS.users);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    const seed = USERS_SEED.map((user) => ({ ...user }));
    this.storage.write(STORAGE_KEYS.users, seed);
    return seed;
  }

  /** Khôi phục phiên đăng nhập sau khi tải lại trang. */
  private loadSession(): PublicUser | null {
    const stored = this.storage.read<PublicUser>(STORAGE_KEYS.session);
    if (!stored || typeof stored.id !== 'string') {
      return null;
    }
    // Chỉ chấp nhận phiên nếu tài khoản vẫn còn tồn tại.
    const user = this.users().find((candidate) => candidate.id === stored.id);
    return user ? toPublicUser(user) : null;
  }
}
