import { GameId } from '../../core/models';

export interface GameArt {
  from: string;
  to: string;
  text: string;
  /** Tên biểu tượng, dùng chung giữa GameBadge (nhỏ) và AccountArt (lớn). */
  glyph: 'sword' | 'gem' | 'flame' | 'target' | 'crown' | 'controller';
}

/** Mỗi game một cặp màu pastel (game hồng/tím lấy từ biến màu gốc trong styles.scss) và một biểu tượng SVG riêng, dùng chung cho toàn bộ trang. */
export const GAME_ART: Record<GameId, GameArt> = {
  'lien-quan-mobile': {
    from: 'var(--color-primary-light)',
    to: 'var(--color-primary)',
    text: 'var(--color-primary-art-ink)',
    glyph: 'sword',
  },
  'lien-minh-huyen-thoai': {
    from: 'var(--color-secondary-light)',
    to: 'var(--color-secondary)',
    text: 'var(--color-secondary-art-ink)',
    glyph: 'crown',
  },
  'free-fire': { from: '#fed7aa', to: '#fdba74', text: '#9a3412', glyph: 'flame' },
  valorant: { from: '#fecaca', to: '#fca5a5', text: '#991b1b', glyph: 'target' },
  'genshin-impact': { from: '#bae6fd', to: '#7dd3fc', text: '#075985', glyph: 'gem' },
  khac: { from: '#e5e7eb', to: '#d1d5db', text: '#374151', glyph: 'controller' },
};
