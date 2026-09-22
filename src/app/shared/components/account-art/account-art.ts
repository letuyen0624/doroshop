import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GameId, gameName } from '../../../core/models';
import { GAME_ART } from '../game-art.data';

let uidCounter = 0;

/**
 * Ảnh minh họa lớn cho từng tin rao, vẽ hoàn toàn bằng SVG/gradient theo màu của game.
 * Không dùng ảnh chụp màn hình thật nên trang luôn đẹp và nhất quán kể cả khi offline.
 */
@Component({
  selector: 'app-account-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './account-art.scss',
  template: `
    <svg
      class="account-art"
      [attr.viewBox]="'0 0 400 ' + height()"
      role="img"
      [attr.aria-label]="label()"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" [attr.stop-color]="art().from" />
          <stop offset="100%" [attr.stop-color]="art().to" />
        </linearGradient>
        <radialGradient [attr.id]="glowId" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" [attr.height]="height()" [attr.fill]="'url(#' + gradientId + ')'" />
      <circle cx="340" cy="50" r="130" [attr.fill]="'url(#' + glowId + ')'" />
      <circle cx="50" [attr.cy]="height() - 30" r="100" [attr.fill]="'url(#' + glowId + ')'" />

      <!-- Trang trí sparkle nhỏ -->
      <g [attr.fill]="art().text" opacity="0.35">
        <path d="M60 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
        <path d="M350 150l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
      </g>

      <g
        [attr.transform]="'translate(200 ' + height() / 2 + ') scale(' + scale() + ') translate(-16 -16)'"
        [attr.stroke]="art().text"
        stroke-width="2.2"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.92"
      >
        @switch (art().glyph) {
          @case ('sword') {
            <path d="M10 22 22 10M17 8l3 3M9 23l2 2M9.5 22.5 8 21" />
          }
          @case ('crown') {
            <path d="M8 20h16l-1.5-8-4 4-2.5-6-2.5 6-4-4z" />
          }
          @case ('flame') {
            <path
              d="M16 8c2 3-1 4-1 6.5a3 3 0 1 0 6 0c0-1 -.5-2-1-3 2 1 3 3.5 3 5.5a6.5 6.5 0 0 1-13 0c0-4 3-5 3-8.5z"
            />
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
  `,
})
export class AccountArt {
  /** Game quyết định màu và biểu tượng. */
  readonly game = input.required<GameId>();
  /** Tiêu đề tin rao, dùng cho nhãn trợ năng. */
  readonly title = input<string>('');
  /** Chiều cao viewBox, cho phép dùng ảnh ngang hoặc ảnh cao. */
  readonly height = input<number>(220);

  private readonly uid = ++uidCounter;
  protected readonly gradientId = `acc-art-grad-${this.uid}`;
  protected readonly glowId = `acc-art-glow-${this.uid}`;

  protected readonly art = computed(() => GAME_ART[this.game()]);
  protected readonly scale = computed(() => Math.max(2, this.height() / 70));

  protected readonly label = computed(() => {
    const title = this.title();
    return title ? `Ảnh minh họa cho ${title}` : `Ảnh minh họa game ${gameName(this.game())}`;
  });
}
