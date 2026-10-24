import { ACCOUNTS_SEED } from '../data/accounts.seed';
import { GameAccount } from '../models';
import { DEFAULT_QUERY, filterAccounts } from './account-query';
import { LIEN_QUAN_TIERS, countInTier, tierQuery, tierQueryParams } from './price-tier';

const account = (price: number, overrides: Partial<GameAccount> = {}): GameAccount =>
  ({ ...ACCOUNTS_SEED[0], id: `t-${price}`, game: 'lien-quan-mobile', status: 'con_hang', price, ...overrides }) as GameAccount;

const [giaRe, phoThong, tamTrung, sieuPham] = LIEN_QUAN_TIERS;

describe('4 tầng giá Liên Quân Mobile (trang Kho acc)', () => {
  it('có đúng 4 tầng với tên theo yêu cầu', () => {
    expect(LIEN_QUAN_TIERS.map((tier) => tier.title)).toEqual([
      'Acc Giá Rẻ',
      'Acc Phổ Thông',
      'Acc Tầm Trung',
      'Acc Siêu Phẩm',
    ]);
  });

  it('mốc giá không chồng lên nhau', () => {
    const prices = [299_999, 300_000, 999_999, 1_000_000, 5_000_000, 5_000_001];
    const list = prices.map((price) => account(price));

    expect(countInTier(list, giaRe)).toBe(1); // 299.999
    expect(countInTier(list, phoThong)).toBe(2); // 300.000 và 999.999
    expect(countInTier(list, tamTrung)).toBe(2); // 1.000.000 và 5.000.000
    expect(countInTier(list, sieuPham)).toBe(1); // 5.000.001
  });

  it('mỗi tin còn hàng của Liên Quân rơi vào đúng một tầng', () => {
    const inStock = ACCOUNTS_SEED.filter(
      (item) => item.game === 'lien-quan-mobile' && item.status === 'con_hang',
    );
    const total = LIEN_QUAN_TIERS.reduce((sum, tier) => sum + countInTier(ACCOUNTS_SEED, tier), 0);

    expect(total).toBe(inStock.length);
  });

  it('chỉ đếm tin còn hàng và đúng game', () => {
    const list = [
      account(100_000),
      account(150_000, { status: 'da_ban' }),
      account(200_000, { game: 'valorant' }),
    ];

    expect(countInTier(list, giaRe)).toBe(1);
  });

  it('số đếm luôn khớp với số kết quả của bộ lọc /accounts cùng tham số', () => {
    for (const tier of LIEN_QUAN_TIERS) {
      expect(countInTier(ACCOUNTS_SEED, tier)).toBe(filterAccounts(ACCOUNTS_SEED, tierQuery(tier)).length);
    }
  });

  it('tierQuery chỉ khác DEFAULT_QUERY ở game, khoảng giá và còn hàng', () => {
    expect(tierQuery(tamTrung)).toEqual({
      ...DEFAULT_QUERY,
      games: ['lien-quan-mobile'],
      minPrice: 1_000_000,
      maxPrice: 5_000_000,
      inStockOnly: true,
    });
  });

  it('query params của link dùng đúng tên param mà trang /accounts đọc', () => {
    expect(tierQueryParams(giaRe)).toEqual({
      games: 'lien-quan-mobile',
      minPrice: null,
      maxPrice: 299_999,
      inStock: '1',
    });
    expect(tierQueryParams(phoThong)).toMatchObject({ minPrice: 300_000, maxPrice: 999_999 });
    expect(tierQueryParams(tamTrung)).toMatchObject({ minPrice: 1_000_000, maxPrice: 5_000_000 });
    expect(tierQueryParams(sieuPham)).toMatchObject({ minPrice: 5_000_001, maxPrice: null });
  });
});
