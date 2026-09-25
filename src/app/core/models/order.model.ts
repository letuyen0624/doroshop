export type PaymentMethod = 'cod' | 'bank' | 'wallet';

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

/** Snapshot của tài khoản được mua, lưu lại để lịch sử đơn không đổi khi admin sửa tin. */
export interface OrderedAccount {
  accountId: string;
  /** Tiêu đề tài khoản tại thời điểm đặt hàng. */
  title: string;
  slug: string;
  game: string;
  /** Giá tại thời điểm đặt hàng. */
  price: number;
}

/** Thông tin liên hệ để nhận tài khoản - không cần địa chỉ vì là hàng số. */
export interface ContactInfo {
  fullName: string;
  contact: string;
  note: string;
}

export interface Order {
  /** Mã đơn dạng DR-000123. */
  id: string;
  userId: string;
  /** Mỗi đơn chỉ có đúng một tài khoản. */
  account: OrderedAccount;
  contact: ContactInfo;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  status: OrderStatus;
  createdAt: string;
}

/**
 * Dữ liệu client gửi lên khi mua một tài khoản. Tiêu đề, giá và số tiền đều do
 * OrderService tự lấy lại từ tin rao và tính lại, client không tự quyết định.
 */
export interface CreateOrderPayload {
  userId: string;
  accountId: string;
  contact: ContactInfo;
  paymentMethod: PaymentMethod;
  couponCode: string | null;
}

/** Thông tin bàn giao tài khoản mô phỏng, sinh ra sau khi đặt hàng thành công. */
export interface DeliveredCredential {
  orderId: string;
  accountId: string;
  demoUsername: string;
  demoPassword: string;
  warrantyDays: number;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  delivered: 'Đã bàn giao',
  cancelled: 'Đã hủy',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: 'Thanh toán khi nhận (COD)',
  bank: 'Chuyển khoản ngân hàng',
  wallet: 'Ví điện tử DoroPay',
};

export const ORDER_STATUS_FLOW: readonly OrderStatus[] = ['pending', 'confirmed', 'delivered', 'cancelled'];
