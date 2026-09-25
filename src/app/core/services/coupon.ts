import { Coupon, OrderTotals } from '../models';

export const COUPONS: readonly Coupon[] = [
  {
    code: 'DORO10',
    label: 'DORO10',
    description: 'Giảm 10% giá tài khoản',
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

/** Tìm mã giảm giá, không phân biệt hoa thường và khoảng trắng hai đầu. */
export function findCoupon(code: string | null | undefined): Coupon | undefined {
  const normalized = (code ?? '').trim().toUpperCase();
  return COUPONS.find((coupon) => coupon.code === normalized);
}

/** Kiểm tra một mã người dùng nhập, `current` là mã đang áp dụng (nếu có). */
export function resolveCoupon(code: string, current: Coupon | null): CouponResult {
  if (!code.trim()) {
    return { ok: false, reason: 'empty' };
  }
  const coupon = findCoupon(code);
  if (!coupon) {
    return { ok: false, reason: 'invalid' };
  }
  if (current?.code === coupon.code) {
    return { ok: false, reason: 'duplicate' };
  }
  return { ok: true, coupon };
}

/** Tạm tính, giảm giá và tổng cộng cho một tài khoản. Mức giảm không bao giờ vượt quá giá. */
export function calculateTotals(price: number, coupon: Coupon | null | undefined): OrderTotals {
  const subtotal = Math.max(0, price);
  const raw = !coupon
    ? 0
    : coupon.flatOff > 0
      ? coupon.flatOff
      : Math.round(subtotal * coupon.percentOff);
  const discount = Math.min(raw, subtotal);
  return { subtotal, discount, total: subtotal - discount };
}
