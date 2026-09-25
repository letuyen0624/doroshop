import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameAccount } from '../../../core/models';
import { discountPercent } from '../../../core/services';
import { VndPipe } from '../../pipes';
import { AccountArt } from '../account-art/account-art';
import { GameBadge } from '../game-badge/game-badge';
import { StarRating } from '../star-rating/star-rating';

/** Thẻ tin rao dùng lại ở trang chủ, danh sách và phần tin liên quan. */
@Component({
  selector: 'app-account-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, VndPipe, AccountArt, GameBadge, StarRating],
  styleUrl: './account-card.scss',
  template: `
    <article class="card account-card">
      <a class="thumb" [routerLink]="['/accounts', account().slug]" [attr.aria-label]="account().title">
        <app-account-art [game]="account().game" [title]="account().title" [height]="190" />
        <div class="badges">
          @if (discount() > 0) {
            <span class="badge badge-sale">-{{ discount() }}%</span>
          }
          @if (account().status === 'da_ban') {
            <span class="badge badge-out">Đã bán</span>
          }
        </div>
      </a>

      <div class="body">
        <app-game-badge [game]="account().game" [compact]="true" />
        <h3 class="name">
          <a [routerLink]="['/accounts', account().slug]">{{ account().title }}</a>
        </h3>
        <p class="meta">Rank {{ account().rank }} · {{ account().server }}</p>
        <app-star-rating [rating]="account().rating" [reviewCount]="account().reviewCount" />

        <div class="prices">
          <span class="price">{{ account().price | vnd }}</span>
          @if (account().oldPrice) {
            <span class="old-price">{{ account().oldPrice | vnd }}</span>
          }
        </div>

        @if (account().status === 'da_ban') {
          <button type="button" class="btn btn-block" disabled>Đã bán</button>
        } @else {
          <a
            class="btn btn-block"
            routerLink="/checkout"
            [queryParams]="{ account: account().slug }"
            [attr.aria-label]="'Mua ngay ' + account().title"
          >
            Mua ngay
          </a>
        }
      </div>
    </article>
  `,
})
export class AccountCard {
  readonly account = input.required<GameAccount>();

  protected readonly discount = computed(() => discountPercent(this.account()));
}
