import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GameId, gameName } from '../../../core/models';
import { GAME_ART } from '../game-art.data';

/**
 * Badge tròn bo góc hiển thị icon và tên game, dùng thay cho ảnh chụp màn hình
 * để trang luôn đẹp và nhất quán kể cả khi offline.
 */
@Component({
  selector: 'app-game-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './game-badge.scss',
  template: `
    <span class="game-badge" [class.compact]="compact()">
      <svg class="icon" viewBox="0 0 32 32" role="presentation" aria-hidden="true">
        <defs>
          <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" [attr.stop-color]="art().from" />
            <stop offset="100%" [attr.stop-color]="art().to" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="16" [attr.fill]="'url(#' + gradientId + ')'" />
        <g [attr.stroke]="art().text" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          @switch (art().glyph) {
            @case ('sword') {
              <path d="M10 22 22 10M17 8l3 3M9 23l2 2M9.5 22.5 8 21" />
            }
            @case ('crown') {
              <path d="M8 20h16l-1.5-8-4 4-2.5-6-2.5 6-4-4z" />
            }
            @case ('flame') {
              <path d="M16 8c2 3-1 4-1 6.5a3 3 0 1 0 6 0c0-1 -.5-2-1-3 2 1 3 3.5 3 5.5a6.5 6.5 0 0 1-13 0c0-4 3-5 3-8.5z" />
            }
            @case ('target') {
              <circle cx="16" cy="16" r="7" />
              <circle cx="16" cy="16" r="2.5" />
            }
            @case ('star') {
              <path d="M16 8l2.4 5 5.6.6-4.2 3.8 1.2 5.6L16 20l-5 3 1.2-5.6-4.2-3.8 5.6-.6z" />
            }
            @case ('gem') {
              <path d="M9 13 16 8l7 5-7 11z" />
              <path d="M9 13h14M12.5 13 16 24l3.5-11" />
            }
            @case ('controller') {
              <rect x="7" y="12" width="18" height="10" rx="5" />
              <line x1="12" y1="17" x2="12" y2="17" />
              <line x1="20" y1="16" x2="20" y2="16" />
              <line x1="22" y1="18" x2="22" y2="18" />
            }
          }
        </g>
      </svg>
      <span class="label">{{ label() }}</span>
    </span>
  `,
})
export class GameBadge {
  readonly game = input.required<GameId>();
  /** Chế độ gọn chỉ hiện icon, dùng khi không gian hẹp. */
  readonly compact = input<boolean>(false);

  private static uid = 0;
  protected readonly gradientId = `game-badge-grad-${++GameBadge.uid}`;

  protected readonly art = computed(() => GAME_ART[this.game()]);
  protected readonly label = computed(() => gameName(this.game()));
}
