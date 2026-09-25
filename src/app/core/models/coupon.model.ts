export type CouponCode = 'DORO10' | 'SUKIEN50K';

export interface Coupon {
  code: CouponCode;
  label: string;
  description: string;
  /** Phần trăm giảm trên giá tin rao, từ 0 đến 1. Chỉ một trong hai (percentOff/flatOff) khác 0. */
  percentOff: number;
  /** Số tiền giảm cố định, đơn vị VNĐ. */
  flatOff: number;
}

/** Số tiền của một đơn hàng (một tài khoản) sau khi áp mã giảm giá. */
export interface OrderTotals {
  subtotal: number;
  discount: number;
  total: number;
}
