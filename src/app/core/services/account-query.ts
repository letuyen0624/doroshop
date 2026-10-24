import { GameAccount, GameId } from '../models';

export type SortOption = 'price-asc' | 'price-desc';

export const SORT_OPTIONS: readonly { value: SortOption; label: string }[] = [
  { value: 'price-asc', label: 'Giá tăng dần' },
  { value: 'price-desc', label: 'Giá giảm dần' },
];

export interface AccountQuery {
  search: string;
  games: GameId[];
  ranks: string[];
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  sort: SortOption;
  page: number;
  pageSize: number;
}

export interface AccountPage {
  items: GameAccount[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const DEFAULT_QUERY: AccountQuery = {
  search: '',
  games: [],
  ranks: [],
  minPrice: null,
  maxPrice: null,
  inStockOnly: false,
  sort: 'price-asc',
  page: 1,
  pageSize: 9,
};

/**
 * Bỏ dấu tiếng Việt và hạ chữ thường để tìm kiếm không phân biệt dấu:
 * gõ "lien quan" vẫn ra "Liên Quân".
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Lọc danh sách theo toàn bộ tiêu chí của bộ lọc. */
export function filterAccounts(accounts: readonly GameAccount[], query: AccountQuery): GameAccount[] {
  const keyword = normalizeText(query.search);
  const gameSet = new Set(query.games);
  const rankSet = new Set(query.ranks.map((rank) => rank.toLowerCase()));

  return accounts.filter((account) => {
    if (keyword && !normalizeText(account.title).includes(keyword)) {
      return false;
    }
    if (gameSet.size > 0 && !gameSet.has(account.game)) {
      return false;
    }
    if (rankSet.size > 0 && !rankSet.has(account.rank.toLowerCase())) {
      return false;
    }
    if (query.minPrice !== null && account.price < query.minPrice) {
      return false;
    }
    if (query.maxPrice !== null && account.price > query.maxPrice) {
      return false;
    }
    if (query.inStockOnly && account.status !== 'con_hang') {
      return false;
    }
    return true;
  });
}

/** Sắp xếp một bản sao của danh sách, không đụng vào mảng gốc. */
export function sortAccounts(accounts: readonly GameAccount[], sort: SortOption): GameAccount[] {
  const sorted = [...accounts];
  switch (sort) {
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'price-asc':
    default:
      return sorted.sort((a, b) => a.price - b.price);
  }
}

/** Cắt trang, tự kéo về trang cuối nếu trang yêu cầu vượt quá số trang hiện có. */
export function paginate(accounts: readonly GameAccount[], page: number, pageSize: number): AccountPage {
  const size = Math.max(1, pageSize);
  const total = accounts.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(Math.max(1, Math.trunc(page) || 1), totalPages);
  const start = (safePage - 1) * size;

  return {
    items: accounts.slice(start, start + size),
    total,
    page: safePage,
    pageSize: size,
    totalPages,
  };
}

/** Gộp cả ba bước lọc, sắp xếp và phân trang. */
export function runQuery(accounts: readonly GameAccount[], query: AccountQuery): AccountPage {
  return paginate(sortAccounts(filterAccounts(accounts, query), query.sort), query.page, query.pageSize);
}
