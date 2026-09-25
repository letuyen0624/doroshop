import { COUPONS, calculateTotals, findCoupon, resolveCoupon } from './coupon';

describe('mã giảm giá và tổng tiền một đơn', () => {
  const doro10 = findCoupon('DORO10')!;
  const sukien = findCoupon('SUKIEN50K')!;

  describe('calculateTotals', () => {
    it('không có mã thì tổng cộng bằng giá tài khoản', () => {
      expect(calculateTotals(500_000, null)).toEqual({ subtotal: 500_000, discount: 0, total: 500_000 });
    });

    it('DORO10 giảm 10% giá tài khoản', () => {
      expect(calculateTotals(500_000, doro10)).toEqual({
        subtotal: 500_000,
        discount: 50_000,
        total: 450_000,
      });
    });

    it('SUKIEN50K giảm cố định 50.000 ₫', () => {
      expect(calculateTotals(500_000, sukien).discount).toBe(50_000);
      expect(calculateTotals(500_000, sukien).total).toBe(450_000);
    });

    it('mức giảm không bao giờ vượt quá giá (SUKIEN50K trên tài khoản 49.000 ₫)', () => {
      expect(calculateTotals(49_000, sukien)).toEqual({ subtotal: 49_000, discount: 49_000, total: 0 });
    });
  });

  describe('findCoupon', () => {
    it('nhận mã không phân biệt hoa thường và khoảng trắng', () => {
      expect(findCoupon('  doro10 ')?.code).toBe('DORO10');
      expect(findCoupon('sukien50k')?.code).toBe('SUKIEN50K');
    });

    it('trả về undefined với mã lạ, rỗng hoặc null', () => {
      expect(findCoupon('SAIMA')).toBeUndefined();
      expect(findCoupon('')).toBeUndefined();
      expect(findCoupon(null)).toBeUndefined();
    });

    it('chỉ có đúng hai mã DORO10 và SUKIEN50K', () => {
      expect(COUPONS.map((coupon) => coupon.code)).toEqual(['DORO10', 'SUKIEN50K']);
    });
  });

  describe('resolveCoupon (nhập mã ở trang checkout)', () => {
    it('chấp nhận mã hợp lệ', () => {
      const result = resolveCoupon('doro10', null);
      expect(result.ok).toBe(true);
      expect(result.ok && result.coupon.code).toBe('DORO10');
    });

    it('từ chối mã rỗng, mã không tồn tại và mã đang áp dụng', () => {
      expect(resolveCoupon('   ', null)).toEqual({ ok: false, reason: 'empty' });
      expect(resolveCoupon('SAIMA', null)).toEqual({ ok: false, reason: 'invalid' });
      expect(resolveCoupon('DORO10', doro10)).toEqual({ ok: false, reason: 'duplicate' });
    });

    it('cho đổi sang mã khác khi đang áp một mã', () => {
      expect(resolveCoupon('SUKIEN50K', doro10).ok).toBe(true);
    });
  });
});
