import { TestBed } from '@angular/core/testing';
import { GameAccount } from '../models';
import { CartService } from './cart.service';
import { GameAccountService } from './game-account.service';

describe('CartService', () => {
  let cart: CartService;
  let accounts: GameAccountService;

  const byId = (id: string): GameAccount => {
    const account = accounts.getById(id);
    if (!account) {
      throw new Error(`Missing seed account ${id}`);
    }
    return account;
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    cart = TestBed.inject(CartService);
    accounts = TestBed.inject(GameAccountService);
  });

  it('bắt đầu với giỏ hàng trống', () => {
    expect(cart.isEmpty()).toBe(true);
    expect(cart.itemCount()).toBe(0);
    expect(cart.total()).toBe(0);
  });

  describe('thêm tài khoản', () => {
    it('thêm mới thành công khi tài khoản còn hàng', () => {
      const account = byId('acc-002');
      expect(cart.add(account)).toBe(true);

      expect(cart.lines()).toHaveLength(1);
      expect(cart.itemCount()).toBe(1);
      expect(cart.subtotal()).toBe(account.price);
    });

    it('không cho thêm tài khoản đã bán', () => {
      const sold = byId('acc-004');
      expect(sold.status).toBe('da_ban');

      expect(cart.add(sold)).toBe(false);
      expect(cart.isEmpty()).toBe(true);
    });

    it('không cho thêm trùng một tài khoản hai lần', () => {
      const account = byId('acc-002');
      expect(cart.add(account)).toBe(true);
      expect(cart.add(account)).toBe(false);

      expect(cart.itemCount()).toBe(1);
    });

    it('mỗi tài khoản luôn có quantity là 1', () => {
      cart.add(byId('acc-002'));
      expect(cart.items()[0]?.quantity).toBe(1);
    });
  });

  describe('xóa và tổng tiền', () => {
    it('xóa đúng tài khoản được chọn', () => {
      cart.add(byId('acc-002'));
      cart.add(byId('acc-026'));
      cart.remove('acc-002');

      expect(cart.lines().map((line) => line.account.id)).toEqual(['acc-026']);
    });

    it('subtotal cộng dồn nhiều tài khoản', () => {
      const a = byId('acc-002');
      const b = byId('acc-026');
      cart.add(a);
      cart.add(b);

      expect(cart.subtotal()).toBe(a.price + b.price);
      expect(cart.total()).toBe(a.price + b.price);
    });

    it('clear xóa sạch giỏ và mã giảm giá', () => {
      cart.add(byId('acc-002'));
      cart.applyCoupon('DORO10');
      cart.clear();

      expect(cart.isEmpty()).toBe(true);
      expect(cart.coupon()).toBeNull();
    });

    it('bỏ qua tài khoản đã bị xóa khỏi hệ thống', () => {
      cart.add(byId('acc-002'));
      TestBed.inject(GameAccountService).remove('acc-002').subscribe();

      expect(cart.lines()).toHaveLength(0);
      expect(cart.subtotal()).toBe(0);
    });
  });

  describe('mã giảm giá', () => {
    beforeEach(() => {
      cart.add(byId('acc-002'));
    });

    it('DORO10 giảm 10% tạm tính', () => {
      const result = cart.applyCoupon('DORO10');

      expect(result.ok).toBe(true);
      expect(cart.discount()).toBe(Math.round(cart.subtotal() * 0.1));
      expect(cart.total()).toBe(cart.subtotal() - cart.discount());
    });

    it('SUKIEN50K giảm cố định 50.000 ₫', () => {
      const result = cart.applyCoupon('SUKIEN50K');

      expect(result.ok).toBe(true);
      expect(cart.discount()).toBe(50_000);
    });

    it('mức giảm không bao giờ vượt quá tạm tính (SUKIEN50K trên đơn dưới 50.000 ₫)', () => {
      cart.clear();
      const cheap = byId('acc-022'); // 49.000 ₫, thấp hơn mức giảm cố định 50.000 ₫
      cart.add(cheap);
      cart.applyCoupon('SUKIEN50K');

      expect(cart.discount()).toBe(cheap.price);
      expect(cart.total()).toBe(0);
    });

    it('nhận mã không phân biệt hoa thường và khoảng trắng', () => {
      expect(cart.applyCoupon('  doro10 ').ok).toBe(true);
      expect(cart.coupon()?.code).toBe('DORO10');
    });

    it('từ chối mã không tồn tại, mã rỗng và mã đã áp dụng', () => {
      expect(cart.applyCoupon('SAIMA')).toEqual({ ok: false, reason: 'invalid' });
      expect(cart.applyCoupon('   ')).toEqual({ ok: false, reason: 'empty' });

      cart.applyCoupon('DORO10');
      expect(cart.applyCoupon('DORO10')).toEqual({ ok: false, reason: 'duplicate' });
    });

    it('gỡ mã thì bỏ giảm giá', () => {
      cart.applyCoupon('DORO10');
      cart.clearCoupon();

      expect(cart.discount()).toBe(0);
      expect(cart.coupon()).toBeNull();
    });
  });

  describe('lưu trữ', () => {
    it('khôi phục giỏ hàng và mã giảm giá sau khi tải lại', () => {
      cart.add(byId('acc-002'));
      cart.applyCoupon('DORO10');

      TestBed.resetTestingModule();
      const reloaded = TestBed.inject(CartService);

      expect(reloaded.itemCount()).toBe(1);
      expect(reloaded.coupon()?.code).toBe('DORO10');
    });
  });
});
