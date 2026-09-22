import { Injectable, inject, signal } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { ACCOUNTS_SEED } from '../data/accounts.seed';
import { GameAccount, GameAccountDraft } from '../models';
import { STORAGE_KEYS, StorageService } from './storage.service';
import { AccountPage, AccountQuery, runQuery } from './account-query';

/** Độ trễ giả lập để component phải xử lý trạng thái đang tải như khi gọi API thật. */
const LATENCY_MIN = 200;
const LATENCY_MAX = 400;

function latency(): number {
  return LATENCY_MIN + Math.random() * (LATENCY_MAX - LATENCY_MIN);
}

/** Bọc dữ liệu thành Observable có độ trễ, giống một lời gọi HTTP. */
function fake<T>(value: T): Observable<T> {
  return of(value).pipe(delay(latency()));
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Nguồn dữ liệu tin rao tài khoản. Toàn bộ API trả về Observable nên sau này
 * chỉ cần đổi phần thân hàm sang HttpClient là xong, component không phải sửa.
 */
@Injectable({ providedIn: 'root' })
export class GameAccountService {
  private readonly storage = inject(StorageService);
  private readonly accounts = signal<GameAccount[]>(this.load());

  /** Snapshot đồng bộ, dùng cho giỏ hàng và thống kê admin. */
  readonly all = this.accounts.asReadonly();

  /** Danh sách rank hiện có, đã sắp xếp theo bảng chữ cái. */
  ranks(): string[] {
    return [...new Set(this.accounts().map((account) => account.rank))].sort((a, b) => a.localeCompare(b, 'vi'));
  }

  /** Khoảng giá nhỏ nhất và lớn nhất của toàn bộ tin rao. */
  priceRange(): { min: number; max: number } {
    const prices = this.accounts().map((account) => account.price);
    if (prices.length === 0) {
      return { min: 0, max: 0 };
    }
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }

  list(): Observable<GameAccount[]> {
    return fake(this.accounts());
  }

  /** Tìm kiếm, lọc, sắp xếp và phân trang trong một lần gọi. */
  search(query: AccountQuery): Observable<AccountPage> {
    return fake(runQuery(this.accounts(), query));
  }

  getBySlug(slug: string): Observable<GameAccount> {
    const found = this.accounts().find((account) => account.slug === slug);
    return found
      ? fake(found)
      : throwError(() => new Error('Không tìm thấy tài khoản')).pipe(delay(latency()));
  }

  getById(id: string): GameAccount | undefined {
    return this.accounts().find((account) => account.id === id);
  }

  /** Tin nổi bật: đánh giá cao nhất và còn hàng. */
  featured(limit = 8): Observable<GameAccount[]> {
    const items = this.accounts()
      .filter((account) => account.status === 'con_hang')
      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
      .slice(0, limit);
    return fake(items);
  }

  /** Tin đang giảm giá, xếp theo mức giảm lớn nhất. */
  onSale(limit = 8): Observable<GameAccount[]> {
    const items = this.accounts()
      .filter((account) => account.oldPrice !== undefined && account.oldPrice > account.price)
      .sort((a, b) => discountPercent(b) - discountPercent(a))
      .slice(0, limit);
    return fake(items);
  }

  /** Tin cùng game, ưu tiên cùng rank. */
  related(account: GameAccount, limit = 4): Observable<GameAccount[]> {
    const items = this.accounts()
      .filter((item) => item.id !== account.id && item.game === account.game)
      .sort((a, b) => {
        const rankScore = Number(b.rank === account.rank) - Number(a.rank === account.rank);
        return rankScore || b.rating - a.rating;
      })
      .slice(0, limit);
    return fake(items);
  }

  /** Số tin đang rao theo từng game, dùng cho dashboard admin. */
  countByGame(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const account of this.accounts()) {
      counts[account.game] = (counts[account.game] ?? 0) + 1;
    }
    return counts;
  }

  // ---------- CRUD cho khu vực quản trị ----------

  create(draft: GameAccountDraft): Observable<GameAccount> {
    const account: GameAccount = {
      ...draft,
      id: `acc-${Date.now().toString(36)}`,
      slug: this.uniqueSlug(draft.slug?.trim() || slugify(draft.title)),
      createdAt: new Date().toISOString(),
    };
    this.commit([...this.accounts(), account]);
    return fake(account);
  }

  update(id: string, draft: GameAccountDraft): Observable<GameAccount> {
    const current = this.accounts().find((account) => account.id === id);
    if (!current) {
      return throwError(() => new Error('Không tìm thấy tin cần sửa')).pipe(delay(latency()));
    }
    const requestedSlug = draft.slug?.trim() || slugify(draft.title);
    const updated: GameAccount = {
      ...current,
      ...draft,
      id: current.id,
      createdAt: current.createdAt,
      slug: requestedSlug === current.slug ? current.slug : this.uniqueSlug(requestedSlug),
    };
    this.commit(this.accounts().map((account) => (account.id === id ? updated : account)));
    return fake(updated);
  }

  remove(id: string): Observable<void> {
    this.commit(this.accounts().filter((account) => account.id !== id));
    return fake(undefined);
  }

  /** Đổi trạng thái các tài khoản đã bán sau khi đặt hàng thành công. */
  markSold(accountIds: readonly string[]): void {
    const soldSet = new Set(accountIds);
    this.commit(
      this.accounts().map((account) =>
        soldSet.has(account.id) ? { ...account, status: 'da_ban' as const } : account,
      ),
    );
  }

  /** Khôi phục dữ liệu gốc, tiện khi muốn chơi lại bản demo từ đầu. */
  resetToSeed(): void {
    this.commit(ACCOUNTS_SEED.map((account) => ({ ...account })));
  }

  private uniqueSlug(base: string): string {
    const fallback = base || 'tai-khoan';
    const taken = new Set(this.accounts().map((account) => account.slug));
    if (!taken.has(fallback)) {
      return fallback;
    }
    let counter = 2;
    while (taken.has(`${fallback}-${counter}`)) {
      counter++;
    }
    return `${fallback}-${counter}`;
  }

  private commit(accounts: GameAccount[]): void {
    this.accounts.set(accounts);
    this.storage.write(STORAGE_KEYS.accounts, accounts);
  }

  private load(): GameAccount[] {
    const stored = this.storage.read<GameAccount[]>(STORAGE_KEYS.accounts);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    const seed = ACCOUNTS_SEED.map((account) => ({ ...account }));
    this.storage.write(STORAGE_KEYS.accounts, seed);
    return seed;
  }
}

/** Phần trăm giảm giá đã làm tròn, trả về 0 nếu tin không khuyến mãi. */
export function discountPercent(account: GameAccount): number {
  if (!account.oldPrice || account.oldPrice <= account.price) {
    return 0;
  }
  return Math.round(((account.oldPrice - account.price) / account.oldPrice) * 100);
}
