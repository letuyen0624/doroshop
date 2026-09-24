import { firstValueFrom } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ACCOUNTS_SEED } from '../data/accounts.seed';
import { GameAccount } from '../models';
import {
  AccountQuery,
  DEFAULT_QUERY,
  filterAccounts,
  normalizeText,
  paginate,
  runQuery,
  sortAccounts,
} from './account-query';
import { GameAccountService } from './game-account.service';

const query = (overrides: Partial<AccountQuery> = {}): AccountQuery => ({ ...DEFAULT_QUERY, ...overrides });
const ids = (accounts: readonly GameAccount[]): string[] => accounts.map((account) => account.id);

describe('account-query', () => {
  describe('normalizeText', () => {
    it('bỏ dấu tiếng Việt và chữ đ', () => {
      expect(normalizeText('Liên Quân Đấu Trường')).toBe('lien quan dau truong');
    });
  });

  describe('filterAccounts', () => {
    it('không có bộ lọc thì giữ nguyên toàn bộ', () => {
      expect(filterAccounts(ACCOUNTS_SEED, query())).toHaveLength(ACCOUNTS_SEED.length);
    });

    it('tìm theo tiêu đề không phân biệt hoa thường và dấu', () => {
      const result = filterAccounts(ACCOUNTS_SEED, query({ search: 'GENSHIN' }));
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((account) => normalizeText(account.title).includes('genshin'))).toBe(true);
    });

    it('lọc theo một game', () => {
      const result = filterAccounts(ACCOUNTS_SEED, query({ games: ['valorant'] }));
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((account) => account.game === 'valorant')).toBe(true);
    });

    it('lọc nhiều game cùng lúc (hoặc)', () => {
      const result = filterAccounts(ACCOUNTS_SEED, query({ games: ['free-fire', 'genshin-impact'] }));
      expect(new Set(result.map((account) => account.game))).toEqual(new Set(['free-fire', 'genshin-impact']));
    });

    it('lọc theo rank', () => {
      const result = filterAccounts(ACCOUNTS_SEED, query({ ranks: ['Vàng'] }));
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((account) => account.rank === 'Vàng')).toBe(true);
    });

    it('lọc khoảng giá, gồm cả hai đầu mút', () => {
      const result = filterAccounts(ACCOUNTS_SEED, query({ minPrice: 100_000, maxPrice: 300_000 }));
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((account) => account.price >= 100_000 && account.price <= 300_000)).toBe(true);
    });

    it('chỉ hiện còn hàng', () => {
      const result = filterAccounts(ACCOUNTS_SEED, query({ inStockOnly: true }));
      expect(result.every((account) => account.status === 'con_hang')).toBe(true);
      expect(result.length).toBeLessThan(ACCOUNTS_SEED.length);
    });

    it('kết hợp nhiều bộ lọc', () => {
      const result = filterAccounts(
        ACCOUNTS_SEED,
        query({ games: ['lien-quan-mobile'], inStockOnly: true, maxPrice: 100_000 }),
      );
      expect(ids(result)).toEqual(['acc-002']);
    });

    it('trả về rỗng khi không khớp gì', () => {
      expect(filterAccounts(ACCOUNTS_SEED, query({ search: 'khong-ton-tai-xyz' }))).toEqual([]);
    });
  });

  describe('sortAccounts', () => {
    it('giá tăng dần và giảm dần', () => {
      const asc = sortAccounts(ACCOUNTS_SEED, 'price-asc').map((account) => account.price);
      const desc = sortAccounts(ACCOUNTS_SEED, 'price-desc').map((account) => account.price);

      expect(asc).toEqual([...asc].sort((a, b) => a - b));
      expect(desc).toEqual([...desc].sort((a, b) => b - a));
    });

    it('đánh giá cao xếp trước', () => {
      const ratings = sortAccounts(ACCOUNTS_SEED, 'rating').map((account) => account.rating);
      expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
    });

    it('mới nhất xếp trước', () => {
      const dates = sortAccounts(ACCOUNTS_SEED, 'newest').map((account) => account.createdAt);
      expect(dates).toEqual([...dates].sort().reverse());
    });

    it('không làm thay đổi mảng gốc', () => {
      const before = ids(ACCOUNTS_SEED);
      sortAccounts(ACCOUNTS_SEED, 'price-desc');
      expect(ids(ACCOUNTS_SEED)).toEqual(before);
    });
  });

  describe('paginate', () => {
    it('chia trang đúng kích thước và số trang', () => {
      const page = paginate(ACCOUNTS_SEED, 1, 9);
      expect(page.items).toHaveLength(9);
      expect(page.total).toBe(ACCOUNTS_SEED.length);
      expect(page.totalPages).toBe(Math.ceil(ACCOUNTS_SEED.length / 9));
    });

    it('trang cuối chứa phần dư', () => {
      const last = Math.ceil(ACCOUNTS_SEED.length / 9);
      const page = paginate(ACCOUNTS_SEED, last, 9);
      expect(page.items).toHaveLength(ACCOUNTS_SEED.length - (last - 1) * 9);
    });

    it('trang vượt giới hạn hoặc không hợp lệ được kéo về trong khoảng', () => {
      expect(paginate(ACCOUNTS_SEED, 999, 9).page).toBe(Math.ceil(ACCOUNTS_SEED.length / 9));
      expect(paginate(ACCOUNTS_SEED, 0, 9).page).toBe(1);
      expect(paginate(ACCOUNTS_SEED, Number.NaN, 9).page).toBe(1);
    });

    it('danh sách rỗng vẫn có 1 trang', () => {
      const page = paginate([], 1, 9);
      expect(page.totalPages).toBe(1);
      expect(page.items).toEqual([]);
    });
  });

  describe('runQuery', () => {
    it('không có tin nào khớp thì trả về trang rỗng nhưng vẫn có cấu trúc hợp lệ', () => {
      // Danh mục "khac" tồn tại trong GameId nhưng chưa có tin nào seed sẵn.
      const result = runQuery(ACCOUNTS_SEED, query({ games: ['khac'], sort: 'price-asc', pageSize: 2 }));
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(1);
    });

    it('lọc theo game rồi sắp xếp giá tăng dần và phân trang', () => {
      const result = runQuery(
        ACCOUNTS_SEED,
        query({ games: ['genshin-impact'], sort: 'price-asc', pageSize: 2 }),
      );
      const genshin = ACCOUNTS_SEED.filter((account) => account.game === 'genshin-impact');

      expect(result.total).toBe(genshin.length);
      expect(result.items).toHaveLength(2);
      expect(result.items[0]!.price).toBeLessThanOrEqual(result.items[1]!.price);
    });
  });
});

describe('GameAccountService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('search trả về kết quả bất đồng bộ đã lọc và phân trang', async () => {
    const service = TestBed.inject(GameAccountService);
    const page = await firstValueFrom(service.search(query({ games: ['valorant'], pageSize: 2 })));

    expect(page.items).toHaveLength(2);
    expect(page.items.every((account) => account.game === 'valorant')).toBe(true);
  });

  it('gameCount và availableCount tính động từ dữ liệu, không gõ số cứng', async () => {
    const service = TestBed.inject(GameAccountService);
    const distinctGames = new Set(ACCOUNTS_SEED.map((account) => account.game)).size;
    const inStock = ACCOUNTS_SEED.filter((account) => account.status === 'con_hang').length;

    expect(service.gameCount()).toBe(distinctGames);
    expect(service.availableCount()).toBe(inStock);

    // Xóa toàn bộ tin của một game thì số game giảm đi, không cần sửa tay ở đâu cả.
    const valorantIds = ACCOUNTS_SEED.filter((account) => account.game === 'valorant').map((a) => a.id);
    for (const id of valorantIds) {
      await firstValueFrom(service.remove(id));
    }
    expect(service.gameCount()).toBe(distinctGames - 1);
  });

  it('dữ liệu mẫu không còn tin nào của PUBG Mobile và vẫn có ít nhất 24 tin', () => {
    expect(ACCOUNTS_SEED.length).toBeGreaterThanOrEqual(24);
    expect(ACCOUNTS_SEED.some((account) => (account.game as string) === 'pubg-mobile')).toBe(false);
    expect(ACCOUNTS_SEED.some((account) => /pubg/i.test(account.title))).toBe(false);
  });

  it('getBySlug báo lỗi khi không tìm thấy', async () => {
    const service = TestBed.inject(GameAccountService);
    await expect(firstValueFrom(service.getBySlug('khong-co'))).rejects.toThrow();
  });

  it('CRUD: thêm, sửa, xóa và tạo slug không trùng', async () => {
    const service = TestBed.inject(GameAccountService);
    const base = ACCOUNTS_SEED[0]!;
    const { id: _id, slug: _slug, createdAt: _createdAt, ...draft } = base;

    const created = await firstValueFrom(service.create({ ...draft, title: 'Tin thử nghiệm' }));
    expect(service.getById(created.id)?.slug).toBe('tin-thu-nghiem');

    const duplicate = await firstValueFrom(service.create({ ...draft, title: 'Tin thử nghiệm' }));
    expect(duplicate.slug).toBe('tin-thu-nghiem-2');

    const updated = await firstValueFrom(
      service.update(created.id, { ...draft, title: 'Tin đã sửa', price: 123_000 }),
    );
    expect(updated.price).toBe(123_000);
    expect(updated.createdAt).toBe(created.createdAt);

    await firstValueFrom(service.remove(created.id));
    expect(service.getById(created.id)).toBeUndefined();
  });

  it('markSold đổi trạng thái các tài khoản đã chọn sang đã bán', () => {
    const service = TestBed.inject(GameAccountService);
    expect(service.getById('acc-002')!.status).toBe('con_hang');

    service.markSold(['acc-002']);
    expect(service.getById('acc-002')!.status).toBe('da_ban');
  });

  it('lưu thay đổi xuống localStorage', async () => {
    const service = TestBed.inject(GameAccountService);
    await firstValueFrom(service.remove('acc-001'));

    TestBed.resetTestingModule();
    expect(TestBed.inject(GameAccountService).getById('acc-001')).toBeUndefined();
  });
});
