import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { ORDERS_SEED_COUNT, buildOrdersSeed } from '../data/orders.seed';
import { CreateOrderPayload, DeliveredCredential, Order, OrderStatus, gameName } from '../models';
import { calculateTotals, findCoupon } from './coupon';
import { GameAccountService } from './game-account.service';
import { STORAGE_KEYS, StorageService } from './storage.service';

const LATENCY = 320;
const WARRANTY_DAYS = 7;

function fake<T>(value: T): Observable<T> {
  return of(value).pipe(delay(LATENCY));
}

/** Sinh mã đơn dạng DR-000123. */
function formatOrderId(sequence: number): string {
  return `DR-${sequence.toString().padStart(6, '0')}`;
}

/** Sinh tài khoản/mật khẩu demo dựng sẵn, không phải thông tin thật. */
function buildDemoCredential(orderId: string, accountId: string): DeliveredCredential {
  const suffix = accountId.replace(/[^a-z0-9]/gi, '').slice(-5);
  return {
    orderId,
    accountId,
    demoUsername: `doro_${suffix}`,
    demoPassword: `Demo@${suffix}2026`,
    warrantyDays: WARRANTY_DAYS,
  };
}

/** Quản lý đơn hàng: tạo đơn, sinh thông tin bàn giao demo, tra cứu và đổi trạng thái. */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly storage = inject(StorageService);
  private readonly accountService = inject(GameAccountService);

  // ordersSignal khởi tạo trước credentialsSignal: nếu đây là lần chạy đầu tiên,
  // loadOrders() ghi luôn cả đơn lẫn thông tin bàn giao demo xuống storage, để
  // loadCredentials() chạy ngay sau đó đọc lại được đúng dữ liệu vừa seed.
  private readonly ordersSignal = signal<Order[]>(this.loadOrders());
  private readonly credentialsSignal = signal<DeliveredCredential[]>(this.loadCredentials());

  readonly orders = this.ordersSignal.asReadonly();

  /** Doanh thu tính trên các đơn chưa bị hủy. */
  readonly revenue = computed(() =>
    this.ordersSignal()
      .filter((order) => order.status !== 'cancelled')
      .reduce((total, order) => total + order.total, 0),
  );

  /**
   * Tạo đơn cho đúng MỘT tài khoản. Giống một backend thật, service tự kiểm tra tin rao
   * còn hàng, tự lấy tiêu đề/giá và tự tính lại tiền theo mã giảm giá (nếu hợp lệ).
   */
  create(payload: CreateOrderPayload): Observable<Order> {
    const account = this.accountService.getById(payload.accountId);
    if (!account) {
      return throwError(() => new Error('Không tìm thấy tài khoản cần mua')).pipe(delay(LATENCY));
    }
    if (account.status === 'da_ban') {
      return throwError(() => new Error('Tài khoản này vừa được bán cho người khác')).pipe(
        delay(LATENCY),
      );
    }

    const coupon = findCoupon(payload.couponCode) ?? null;
    const { subtotal, discount, total } = calculateTotals(account.price, coupon);

    const sequence = (this.storage.read<number>(STORAGE_KEYS.orderSeq) ?? 0) + 1;
    const order: Order = {
      id: formatOrderId(sequence),
      userId: payload.userId,
      account: {
        accountId: account.id,
        title: account.title,
        slug: account.slug,
        game: gameName(account.game),
        price: account.price,
      },
      contact: payload.contact,
      paymentMethod: payload.paymentMethod,
      subtotal,
      discount,
      total,
      couponCode: coupon?.code ?? null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.storage.write(STORAGE_KEYS.orderSeq, sequence);
    this.commitOrders([order, ...this.ordersSignal()]);
    this.accountService.markSold([account.id]);
    this.commitCredentials([...this.credentialsSignal(), buildDemoCredential(order.id, account.id)]);

    return fake(order);
  }

  /** Đơn của một người dùng, mới nhất lên đầu. */
  byUser(userId: string): Observable<Order[]> {
    return fake(this.ordersSignal().filter((order) => order.userId === userId));
  }

  all(): Observable<Order[]> {
    return fake(this.ordersSignal());
  }

  getById(id: string): Observable<Order> {
    const order = this.ordersSignal().find((candidate) => candidate.id === id);
    return order
      ? fake(order)
      : throwError(() => new Error('Không tìm thấy đơn hàng')).pipe(delay(LATENCY));
  }

  updateStatus(id: string, status: OrderStatus): Observable<Order> {
    const order = this.ordersSignal().find((candidate) => candidate.id === id);
    if (!order) {
      return throwError(() => new Error('Không tìm thấy đơn hàng')).pipe(delay(LATENCY));
    }
    const updated: Order = { ...order, status };
    this.commitOrders(this.ordersSignal().map((item) => (item.id === id ? updated : item)));
    return fake(updated);
  }

  /** Thông tin bàn giao demo của một đơn hàng cụ thể. */
  credentialsFor(orderId: string): DeliveredCredential[] {
    return this.credentialsSignal().filter((credential) => credential.orderId === orderId);
  }

  private commitOrders(orders: Order[]): void {
    this.ordersSignal.set(orders);
    this.storage.write(STORAGE_KEYS.orders, orders);
  }

  private commitCredentials(credentials: DeliveredCredential[]): void {
    this.credentialsSignal.set(credentials);
    this.storage.write(STORAGE_KEYS.credentials, credentials);
  }

  private loadOrders(): Order[] {
    const stored = this.storage.read<Order[]>(STORAGE_KEYS.orders);
    if (Array.isArray(stored)) {
      return stored;
    }
    // Lần chạy đầu tiên: nạp vài đơn mẫu để trang quản trị và lịch sử đơn có dữ liệu xem.
    const seed = buildOrdersSeed();
    this.storage.write(STORAGE_KEYS.orders, seed.orders);
    this.storage.write(STORAGE_KEYS.credentials, seed.credentials);
    this.storage.write(STORAGE_KEYS.orderSeq, ORDERS_SEED_COUNT);
    return seed.orders;
  }

  private loadCredentials(): DeliveredCredential[] {
    const stored = this.storage.read<DeliveredCredential[]>(STORAGE_KEYS.credentials);
    return Array.isArray(stored) ? stored : [];
  }
}
