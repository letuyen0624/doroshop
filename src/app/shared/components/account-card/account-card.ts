import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameAccount, LOGIN_STATUS_LABELS } from '../../../core/models';
import { discountPercent } from '../../../core/services';
import { VndPipe } from '../../pipes';
import { AccountArt } from '../account-art/account-art';
import { StarRating } from '../star-rating/star-rating';

@Component({
  selector: 'app-account-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, VndPipe, AccountArt, StarRating],
  styleUrl: './account-card.scss',
  template: `
    <article class="card account-card">
      <a
        class="thumb"
        [class.thumb-tinted]="isCayThue() || isNapGame()"
        [routerLink]="['/accounts', account().slug]"
        [attr.aria-label]="account().title"
      >
        @if (isFlagship()) {
          <img src="assets/acc-lien-quan-banner.webp" alt="Kho acc Liên Quân uy tín" class="acc-thumbnail" />
        } @else if (isCayThue()) {
          <img src="assets/cay-thue-rank-banner.webp" alt="Cày thuê rank Liên Quân siêu tốc" class="acc-thumbnail" />
        } @else if (isNapGame()) {
          <img src="assets/nap-game-banner.webp" alt="Nạp game Liên Quân uy tín" class="acc-thumbnail" />
        } @else {
          @if (isGiaRe()) {
            <img src="assets/acc-lien-quan-gia-re-banner.webp" alt="" class="acc-thumbnail" />
          } @else {
            <app-account-art [game]="account().game" [title]="account().title" [height]="190" />
          }
          @if (discount() > 0) {
            <span class="badge badge-sale floating">-{{ discount() }}%</span>
          }
          @if (account().status === 'da_ban') {
            <span class="badge badge-out floating-right">Đã bán</span>
          }
        }
      </a>

      <div class="body">
        @if (isSpecialCard()) {
          <!-- Tag phân loại đặt ở phần chữ, KHÔNG nằm trên ảnh: không bao giờ che nhân vật dù thay ảnh nào -->
          <span class="badge badge-service">DỊCH VỤ</span>

          <h3 class="name">
            <a [routerLink]="['/accounts', account().slug]">{{ account().title }}</a>
          </h3>

          <p class="meta">
            @if (isFlagship()) {
              Kho nick siêu VIP · Trắng thông tin 100%
            } @else if (isCayThue()) {
              Siêu tốc · Uy tín · Bảo mật tuyệt đối
            } @else {
              Hệ thống tự động · Chiết khấu cực cao
            }
          </p>

          <app-star-rating [rating]="account().rating" [reviewCount]="account().reviewCount" />

          <!-- "Vào kho acc" chuyển sang trang "Kho acc Liên Quân Mobile" (4 thẻ theo tầng giá). -->
          <a
            class="btn btn-block portal-btn"
            [routerLink]="isFlagship() ? ['/kho-acc-lien-quan'] : ['/accounts', account().slug]"
          >
            @if (isFlagship()) {
              VÀO KHO ACC
            } @else if (isCayThue()) {
              XEM BẢNG GIÁ
            } @else {
              NẠP NGAY
            }
          </a>
        } @else {
          <dl class="stats">
            <div>
              <dt>Tướng</dt>
              <dd>{{ account().characterCount }}</dd>
            </div>
            <div>
              <dt>Trang phục</dt>
              <dd>{{ account().skinCount }}</dd>
            </div>
            <div>
              <dt>Rank</dt>
              <dd>{{ account().rank }}</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>{{ loginStatusLabel() }}</dd>
            </div>
          </dl>

          <div class="prices">
            @if (account().oldPrice) {
              <span class="old-price">{{ account().oldPrice | vnd }}</span>
            }
            <span class="price">{{ account().price | vnd }}</span>
          </div>

          @if (account().status === 'da_ban') {
            <button type="button" class="btn btn-block" disabled>Đã bán</button>
          } @else {
            <a class="btn btn-block" routerLink="/checkout" [queryParams]="{ account: account().slug }">
              Mua ngay
            </a>
          }
        }
      </div>
    </article>
  `,
})
export class AccountCard {
  readonly account = input.required<GameAccount>();

  /**
   * Ba thẻ minh họa cố định ở khối Liên Quân Mobile trên trang chủ (xem home.ts), nhận diện
   * qua đúng slug của chúng — KHÔNG so khớp theo chuỗi con trong tiêu đề, vì mọi tin rao thật
   * trong hệ thống đều có tiêu đề bắt đầu bằng "Acc ..." nên so khớp lỏng sẽ dính luôn cả những
   * tin thật ở trang danh sách/các khối game khác.
   */
  protected readonly isFlagship = computed(() => this.account().slug === 'acc-lien-quan');
  protected readonly isCayThue = computed(() => this.account().slug === 'cay-thue-rank');
  protected readonly isNapGame = computed(() => this.account().slug === 'nap-game');

  /** Cả 3 thẻ minh họa đều dùng chung tag "DỊCH VỤ", không hiện khối thông tin/giá thật. */
  protected readonly isSpecialCard = computed(() => this.isFlagship() || this.isCayThue() || this.isNapGame());

  /** Tin thật duy nhất được gắn banner ảnh chụp thống kê riêng theo yêu cầu, thay cho app-account-art. */
  protected readonly isGiaRe = computed(() => this.account().slug === 'acc-lien-quan-gia-re-rank-vang');

  protected readonly discount = computed(() => discountPercent(this.account()));

  protected readonly loginStatusLabel = computed(() => LOGIN_STATUS_LABELS[this.account().loginStatus]);
}
