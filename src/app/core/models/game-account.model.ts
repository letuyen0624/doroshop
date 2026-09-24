/** Tên game được hỗ trợ, dùng làm danh mục trên trang. */
export type GameId =
  | 'lien-quan-mobile'
  | 'lien-minh-huyen-thoai'
  | 'free-fire'
  | 'valorant'
  | 'genshin-impact'
  | 'khac';

export interface Game {
  id: GameId;
  name: string;
  description: string;
}

export type LoginStatus = 'da_lien_ket_fb' | 'da_lien_ket_sms' | 'chua_lien_ket';

export type AccountStatus = 'con_hang' | 'da_ban';

export interface GameAccount {
  id: string;
  /** Tiêu đề rao bán, ví dụ "Acc Liên Quân full tướng - Rank Cao Thủ". */
  title: string;
  slug: string;
  game: GameId;
  server: string;
  rank: string;
  characterCount: number;
  skinCount: number;
  loginStatus: LoginStatus;
  price: number;
  oldPrice?: number;
  status: AccountStatus;
  rating: number;
  reviewCount: number;
  description: string;
  /** Thông tin tự do thêm theo từng game, ví dụ "Số kim cương": "12.000". */
  extraInfo: Record<string, string>;
  tags: string[];
  createdAt: string;
}

export type GameAccountDraft = Omit<GameAccount, 'id' | 'slug' | 'createdAt'> & {
  slug?: string;
};

export const GAMES: readonly Game[] = [
  { id: 'lien-quan-mobile', name: 'Liên Quân Mobile', description: 'MOBA di động quốc dân' },
  { id: 'lien-minh-huyen-thoai', name: 'Liên Minh Huyền Thoại', description: 'MOBA huyền thoại trên PC' },
  { id: 'free-fire', name: 'Free Fire', description: 'Sinh tồn bắn súng nhịp độ nhanh' },
  { id: 'valorant', name: 'Valorant', description: 'Bắn súng chiến thuật 5vs5' },
  { id: 'genshin-impact', name: 'Genshin Impact', description: 'Nhập vai thế giới mở' },
  { id: 'khac', name: 'Khác', description: 'Các game khác' },
] as const;

export const LOGIN_STATUS_LABELS: Record<LoginStatus, string> = {
  da_lien_ket_fb: 'Đã liên kết Facebook',
  da_lien_ket_sms: 'Đã liên kết SMS',
  chua_lien_ket: 'Chưa liên kết',
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  con_hang: 'Còn hàng',
  da_ban: 'Đã bán',
};

const GAME_NAME_MAP: Record<GameId, string> = GAMES.reduce(
  (acc, game) => {
    acc[game.id] = game.name;
    return acc;
  },
  {} as Record<GameId, string>,
);

export function gameName(id: GameId): string {
  return GAME_NAME_MAP[id] ?? id;
}
