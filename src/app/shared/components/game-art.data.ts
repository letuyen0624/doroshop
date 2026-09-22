import { GameId } from '../../core/models';

export interface GameArt {
  from: string;
  to: string;
  text: string;
  /** Tên biểu tượng, dùng chung giữa GameBadge (nhỏ) và AccountArt (lớn). */
  glyph: 'sword' | 'gem' | 'flame' | 'target' | 'crown' | 'star' | 'controller';
}

/** Mỗi game một cặp màu pastel và một biểu tượng SVG riêng, dùng chung cho toàn bộ trang. */
export const GAME_ART: Record<GameId, GameArt> = {
  'lien-quan-mobile': { from: '#fbcfe8', to: '#f9a8d4', text: '#9d174d', glyph: 'sword' },
  'lien-minh-huyen-thoai': { from: '#ddd6fe', to: '#c4b5fd', text: '#5b21b6', glyph: 'crown' },
  'free-fire': { from: '#fed7aa', to: '#fdba74', text: '#9a3412', glyph: 'flame' },
  valorant: { from: '#fecaca', to: '#fca5a5', text: '#991b1b', glyph: 'target' },
  'pubg-mobile': { from: '#bbf7d0', to: '#86efac', text: '#166534', glyph: 'star' },
  'genshin-impact': { from: '#bae6fd', to: '#7dd3fc', text: '#075985', glyph: 'gem' },
  khac: { from: '#e5e7eb', to: '#d1d5db', text: '#374151', glyph: 'controller' },
};
