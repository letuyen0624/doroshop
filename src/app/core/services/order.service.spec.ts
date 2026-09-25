import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ContactInfo, CreateOrderPayload } from '../models';
import { GameAccountService } from './game-account.service';
import { OrderService } from './order.service';
import { STORAGE_KEYS } from './storage.service';

describe('OrderService: mỗi đơn đúng một tài khoản', () => {
  let orders: OrderService;
  let accounts: GameAccountService;

  const contact: ContactInfo = { fullName: 'Khách Demo', contact: 'demo@doroshop.vn', note: '' };
  const payload = (overrides: Partial<CreateOrderPayload> = {}): CreateOrderPayload => ({
    userId: 'u-demo',
    accountId: 'acc-002',
    contact,
    paymentMethod: 'cod',
    couponCode: null,
    ...overrides,
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    orders = TestBed.inject(OrderService);
    accounts = TestBed.inject(GameAccountService);
  });

  it('tạo đơn với snapshot của đúng một tài khoản và đánh dấu đã bán', async () => {
    const account = accounts.getById('acc-002')!;
    expect(account.status).not.toBe('da_ban');
    const before = orders.orders().length;

    const order = await firstValueFrom(orders.create(payload()));

    expect(order.account).toMatchObject({
      accountId: 'acc-002',
      title: account.title,
      slug: account.slug,
      price: account.price,
    });
    expect(order.subtotal).toBe(account.price);
    expect(order.total).toBe(account.price);
    expect(order.couponCode).toBeNull();
    expect(order.status).toBe('pending');
    expect(orders.orders()).toHaveLength(before + 1);
    expect(accounts.getById('acc-002')?.status).toBe('da_ban');
  });

  it('sinh đúng một thông tin bàn giao demo cho đơn', async () => {
    const order = await firstValueFrom(orders.create(payload()));
    const credentials = orders.credentialsFor(order.id);

    expect(credentials).toHaveLength(1);
    expect(credentials[0]?.accountId).toBe('acc-002');
  });

  it('áp mã DORO10 ngay khi tạo đơn (service tự tính lại tiền)', async () => {
    const account = accounts.getById('acc-002')!;
    const order = await firstValueFrom(orders.create(payload({ couponCode: 'doro10' })));

    expect(order.couponCode).toBe('DORO10');
    expect(order.discount).toBe(Math.round(account.price * 0.1));
    expect(order.total).toBe(account.price - order.discount);
  });

  it('SUKIEN50K không giảm quá giá tài khoản', async () => {
    const cheap = accounts.getById('acc-022')!; // 49.000 ₫, thấp hơn mức giảm cố định
    const order = await firstValueFrom(
      orders.create(payload({ accountId: cheap.id, couponCode: 'SUKIEN50K' })),
    );

    expect(order.discount).toBe(cheap.price);
    expect(order.total).toBe(0);
  });

  it('bỏ qua mã giảm giá không hợp lệ', async () => {
    const account = accounts.getById('acc-002')!;
    const order = await firstValueFrom(orders.create(payload({ couponCode: 'SAIMA' })));

    expect(order.couponCode).toBeNull();
    expect(order.total).toBe(account.price);
  });

  it('không cho mua tài khoản đã bán', async () => {
    expect(accounts.getById('acc-004')?.status).toBe('da_ban');
    const before = orders.orders().length;

    await expect(firstValueFrom(orders.create(payload({ accountId: 'acc-004' })))).rejects.toThrow(
      /vừa được bán/,
    );
    expect(orders.orders()).toHaveLength(before);
  });

  it('không cho mua cùng một tài khoản hai lần', async () => {
    await firstValueFrom(orders.create(payload()));

    await expect(firstValueFrom(orders.create(payload()))).rejects.toThrow(/vừa được bán/);
  });

  it('từ chối tài khoản không tồn tại', async () => {
    await expect(
      firstValueFrom(orders.create(payload({ accountId: 'acc-khong-co' }))),
    ).rejects.toThrow(/Không tìm thấy/);
  });

  it('không còn lưu giỏ hàng hay mã giảm giá trong localStorage', async () => {
    await firstValueFrom(orders.create(payload({ couponCode: 'DORO10' })));

    expect(Object.keys(localStorage).some((key) => /\.(cart|coupon)$/.test(key))).toBe(false);
    expect(Object.keys(STORAGE_KEYS)).not.toContain('cart');
    expect(Object.keys(STORAGE_KEYS)).not.toContain('coupon');
  });

  it('dọn dữ liệu giỏ hàng của phiên bản cũ khi khởi động', () => {
    localStorage.setItem('doroshop.v2.cart', '[{"accountId":"acc-002","quantity":1}]');
    localStorage.setItem('doroshop.v2.coupon', '"DORO10"');
    TestBed.resetTestingModule();
    TestBed.inject(OrderService);

    expect(localStorage.getItem('doroshop.v2.cart')).toBeNull();
    expect(localStorage.getItem('doroshop.v2.coupon')).toBeNull();
  });
});
