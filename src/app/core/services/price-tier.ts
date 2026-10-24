import { GameAccount, GameId } from '../models';
import { AccountQuery, DEFAULT_QUERY, filterAccounts } from './account-query';

/** Một tầng giá của một game, dùng cho trang "Kho acc" theo tầng giá. */
export interface PriceTier {
  id: 'gia-re' | 'pho-thong' | 'tam-trung' | 'sieu-pham';
  title: string;
  /** Mô tả ngắn khoảng giá, in trên banner. */
  hint: string;
  /** Giá thấp nhất (gồm cả mốc này), null nếu không giới hạn dưới. */
  minPrice: number | null;
  /** Giá cao nhất (gồm cả mốc này), null nếu không giới hạn trên. */
  maxPrice: number | null;
}

export const LIEN_QUAN_GAME: GameId = 'lien-quan-mobile';

/**
 * Bốn tầng giá của Liên Quân Mobile, hiện ở trang "Kho acc Liên Quân" (/kho-acc-lien-quan).
 * Bộ lọc /accounts tính cả hai đầu mút nên các mốc được đặt lệch 1 ₫ để không chồng lên nhau.
 */
export const LIEN_QUAN_TIERS: readonly PriceTier[] = [
  { id: 'gia-re', title: 'Acc Giá Rẻ', hint: 'Dưới 300.000 ₫', minPrice: null, maxPrice: 299_999 },
  { id: 'pho-thong', title: 'Acc Phổ Thông', hint: '300.000 - 999.999 ₫', minPrice: 300_000, maxPrice: 999_999 },
  { id: 'tam-trung', title: 'Acc Tầm Trung', hint: '1 - 5 triệu', minPrice: 1_000_000, maxPrice: 5_000_000 },
  { id: 'sieu-pham', title: 'Acc Siêu Phẩm', hint: 'Trên 5 triệu', minPrice: 5_000_001, maxPrice: null },
];

/** Query lọc của một tầng giá, chỉ tính tin còn hàng để khớp với chữ "Còn X acc". */
export function tierQuery(tier: PriceTier, game: GameId = LIEN_QUAN_GAME): AccountQuery {
  return {
    ...DEFAULT_QUERY,
    games: [game],
    minPrice: tier.minPrice,
    maxPrice: tier.maxPrice,
    inStockOnly: true,
  };
}

/** Query params của link tới /accounts cho một tầng giá (giá trị null sẽ bị router bỏ qua). */
export function tierQueryParams(
  tier: PriceTier,
  game: GameId = LIEN_QUAN_GAME,
): Record<string, string | number | null> {
  return {
    games: game,
    minPrice: tier.minPrice,
    maxPrice: tier.maxPrice,
    inStock: '1',
  };
}

/** Số tin còn hàng trong một tầng giá, dùng đúng bộ lọc của trang /accounts nên luôn khớp danh sách. */
export function countInTier(
  accounts: readonly GameAccount[],
  tier: PriceTier,
  game: GameId = LIEN_QUAN_GAME,
): number {
  return filterAccounts(accounts, tierQuery(tier, game)).length;
}
