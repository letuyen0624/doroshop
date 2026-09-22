import { Injectable, computed, inject, signal } from '@angular/core';
import { CartItem, CartLine, CartSummary, Coupon, CouponCode, GameAccount } from '../models';
import { GameAccountService } from './game-account.service';
import { STORAGE_KEYS, StorageService } from './storage.service';

export const COUPONS: readonly Coupon[] = [
  {
    code: 'DORO10',
    label: 'DORO10',
    description: 'Giảm 10% tổng giá trị đơn hàng',
    percentOff: 0.1,
    flatOff: 0,
  },
  {
    code: 'SUKIEN50K',
    label: 'SUKIEN50K',
    description: 'Giảm ngay 50.000 ₫',
    percentOff: 0,
    flatOff: 50_000,
  },
];

export type CouponResult =
  | { ok: true; coupon: Coupon }
  | { ok: false; reason: 'empty' | 'invalid' | 'duplicate' };

function findCoupon(code: string): Coupon | undefined {
  const normalized = code.trim().toUpperCase();
  return COUPONS.find((coupon) => coupon.code === normalized);
}

/**
 * Giỏ hàng lưu bằng signal và tự đồng bộ xuống localStorage.
 * Chỉ lưu id tài khoản và số lượng (luôn là 1), giá luôn lấy lại từ
 * GameAccountService để giỏ hàng không bị giá cũ khi admin sửa tin.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storage = inject(StorageService);
  private readonly accountService = inject(GameAccountService);

  private readonly itemsSignal = signal<CartItem[]>(this.loadItems());
  private readonly couponSignal = signal<Coupon | null>(this.loadCoupon());

  readonly items = this.itemsSignal.asReadonly();
  readonly coupon = this.couponSignal.asReadonly();

  /** Các dòng giỏ hàng đã ghép với tài khoản, bỏ qua tài khoản đã bị xóa. */
  readonly lines = computed<CartLine[]>(() => {
    const accounts = this.accountService.all();
    return this.itemsSignal()
      .map((item) => {
        const account = accounts.find((candidate) => candidate.id === item.accountId);
        if (!account) {
          return null;
        }
        return { account, quantity: item.quantity, lineTotal: account.price * item.quantity };
      })
      .filter((line): line is CartLine => line !== null);
  });

  readonly itemCount = computed(() => this.itemsSignal().length);

  readonly isEmpty = computed(() => this.lines().length === 0);

  readonly subtotal = computed(() =>
    this.lines().reduce((total, line) => total + line.lineTotal, 0),
  );

  readonly discount = computed(() => {
    const coupon = this.couponSignal();
    if (!coupon || this.subtotal() <= 0) {
      return 0;
    }
    const raw = coupon.flatOff > 0 ? coupon.flatOff : Math.round(this.subtotal() * coupon.percentOff);
    return Math.min(raw, this.subtotal());
  });

  readonly total = computed(() => Math.max(0, this.subtotal() - this.discount()));

  readonly summary = computed<CartSummary>(() => ({
    subtotal: this.subtotal(),
    discount: this.discount(),
    total: this.total(),
    itemCount: this.itemCount(),
  }));

  /** Thêm tài khoản vào giỏ. Không cho thêm nếu đã bán hoặc đã có trong giỏ. */
  add(account: GameAccount): boolean {
    if (account.status === 'da_ban') {
      return false;
    }
    if (this.itemsSignal().some((item) => item.accountId === account.id)) {
      return false;
    }
    this.commit([...this.itemsSignal(), { accountId: account.id, quantity: 1 }]);
    return true;
  }

  remove(accountId: string): void {
    this.commit(this.itemsSignal().filter((item) => item.accountId !== accountId));
  }

  /** Xóa sạch giỏ và mã giảm giá, dùng sau khi đặt hàng thành công. */
  clear(): void {
    this.commit([]);
    this.clearCoupon();
  }

  applyCoupon(code: string): CouponResult {
    if (!code.trim()) {
      return { ok: false, reason: 'empty' };
    }
    const coupon = findCoupon(code);
    if (!coupon) {
      return { ok: false, reason: 'invalid' };
    }
    if (this.couponSignal()?.code === coupon.code) {
      return { ok: false, reason: 'duplicate' };
    }
    this.couponSignal.set(coupon);
    this.storage.write<CouponCode>(STORAGE_KEYS.coupon, coupon.code);
    return { ok: true, coupon };
  }

  clearCoupon(): void {
    this.couponSignal.set(null);
    this.storage.remove(STORAGE_KEYS.coupon);
  }

  private commit(items: CartItem[]): void {
    this.itemsSignal.set(items);
    this.storage.write(STORAGE_KEYS.cart, items);
  }

  private loadItems(): CartItem[] {
    const stored = this.storage.read<CartItem[]>(STORAGE_KEYS.cart);
    if (!Array.isArray(stored)) {
      return [];
    }
    return stored.filter(
      (item): item is CartItem =>
        typeof item?.accountId === 'string' && typeof item?.quantity === 'number' && item.quantity > 0,
    );
  }

  private loadCoupon(): Coupon | null {
    const stored = this.storage.read<string>(STORAGE_KEYS.coupon);
    return stored ? (findCoupon(stored) ?? null) : null;
  }
}
