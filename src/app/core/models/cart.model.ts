import { GameAccount } from './game-account.model';

export interface CartItem {
  accountId: string;
  /** Luôn là 1 vì mỗi tài khoản game chỉ có một, nhưng giữ field để đồng bộ logic giỏ hàng. */
  quantity: number;
}

/** Một dòng giỏ hàng đã ghép với dữ liệu tài khoản để hiển thị. */
export interface CartLine {
  account: GameAccount;
  quantity: number;
  lineTotal: number;
}

export type CouponCode = 'DORO10' | 'SUKIEN50K';

export interface Coupon {
  code: CouponCode;
  label: string;
  description: string;
  /** Phần trăm giảm trên tạm tính, từ 0 đến 1. Chỉ một trong hai (percentOff/flatOff) khác 0. */
  percentOff: number;
  /** Số tiền giảm cố định, đơn vị VNĐ. */
  flatOff: number;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}
