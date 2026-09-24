import { ACCOUNTS_SEED } from './accounts.seed';
import { DeliveredCredential, Order, OrderLine, OrderStatus, PaymentMethod } from '../models';
import { gameName } from '../models';

interface SeedSpec {
  daysAgo: number;
  status: OrderStatus;
  payment: PaymentMethod;
  accountId: string;
  coupon?: 'DORO10';
}

/**
 * Đơn mẫu chỉ tham chiếu tới các tài khoản đã seed sẵn ở trạng thái "đã bán",
 * để dữ liệu nhất quán: acc đã bán thì phải có đơn hàng tương ứng.
 */
const SPECS: readonly SeedSpec[] = [
  { daysAgo: 12, status: 'delivered', payment: 'cod', accountId: 'acc-004' },
  { daysAgo: 9, status: 'delivered', payment: 'bank', accountId: 'acc-008', coupon: 'DORO10' },
  { daysAgo: 7, status: 'delivered', payment: 'wallet', accountId: 'acc-012' },
  { daysAgo: 4, status: 'confirmed', payment: 'cod', accountId: 'acc-016' },
  { daysAgo: 2, status: 'cancelled', payment: 'bank', accountId: 'acc-028' },
  { daysAgo: 1, status: 'pending', payment: 'wallet', accountId: 'acc-024' },
];

function findAccount(id: string) {
  const account = ACCOUNTS_SEED.find((candidate) => candidate.id === id);
  if (!account) {
    throw new Error(`Seed order refers to unknown account ${id}`);
  }
  return account;
}

/** Sinh tài khoản/mật khẩu demo dựng sẵn cho đơn mẫu, giống hàm trong OrderService. */
function buildDemoCredential(orderId: string, accountId: string): DeliveredCredential {
  const suffix = accountId.replace(/[^a-z0-9]/gi, '').slice(-5);
  return {
    orderId,
    accountId,
    demoUsername: `doro_${suffix}`,
    demoPassword: `Demo@${suffix}2026`,
    warrantyDays: 7,
  };
}

export interface OrdersSeedResult {
  orders: Order[];
  credentials: DeliveredCredential[];
}

/** Tạo đơn mẫu cho tài khoản demo, ngày đặt tính lùi từ thời điểm khởi tạo dữ liệu. */
export function buildOrdersSeed(now: Date = new Date()): OrdersSeedResult {
  const orders: Order[] = [];
  const credentials: DeliveredCredential[] = [];

  SPECS.forEach((spec, index) => {
    const account = findAccount(spec.accountId);
    const line: OrderLine = {
      accountId: account.id,
      title: account.title,
      slug: account.slug,
      game: gameName(account.game),
      price: account.price,
    };

    const subtotal = line.price;
    const discount = spec.coupon ? Math.round(subtotal * 0.1) : 0;
    const createdAt = new Date(now.getTime() - spec.daysAgo * 86_400_000 - index * 60_000);
    const id = `DR-${String(index + 1).padStart(6, '0')}`;

    orders.push({
      id,
      userId: 'u-demo',
      lines: [line],
      contact: {
        fullName: 'Khách hàng Demo',
        contact: 'demo@doroshop.vn',
        note: '',
      },
      paymentMethod: spec.payment,
      subtotal,
      discount,
      total: subtotal - discount,
      couponCode: spec.coupon ?? null,
      status: spec.status,
      createdAt: createdAt.toISOString(),
    });

    if (spec.status !== 'cancelled') {
      credentials.push(buildDemoCredential(id, account.id));
    }
  });

  // Mới nhất lên đầu, giống cách OrderService thêm đơn mới.
  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { orders, credentials };
}

export const ORDERS_SEED_COUNT = SPECS.length;
