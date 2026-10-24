import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameAccountService, LIEN_QUAN_TIERS, countInTier, tierQueryParams } from '../../core/services';

/**
 * Trang "Kho acc Liên Quân Mobile": 4 thẻ cổng vào theo tầng giá (Giá Rẻ / Phổ Thông / Tầm Trung /
 * Siêu Phẩm), bấm vào mỗi thẻ sang /accounts đã lọc sẵn đúng game + khoảng giá. Đứng sau nút
 * "Vào kho acc" ở thẻ gateway trên trang chủ.
 */
@Component({
  selector: 'app-kho-acc-lien-quan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styleUrl: './kho-acc-lien-quan.scss',
  template: `
    <div class="page container">
      <div class="page-head">
        <h1>Kho acc Liên Quân Mobile</h1>
        <p>Chọn theo tầng giá phù hợp với bạn, mỗi thẻ dẫn tới đúng danh sách đã lọc sẵn.</p>
      </div>

      <div class="tier-grid">
        @for (item of tiers(); track item.tier.id) {
          <article class="card tier-card">
            <a class="thumb" [routerLink]="['/accounts']" [queryParams]="item.queryParams" tabindex="-1" aria-hidden="true">
              @if (item.tier.id === 'gia-re') {
                <img class="tier-banner-img" src="assets/tier-gia-re-banner.webp" alt="" />
              } @else if (item.tier.id === 'pho-thong') {
                <img class="tier-banner-img" src="assets/tier-pho-thong-banner.webp" alt="" />
              } @else if (item.tier.id === 'tam-trung') {
                <img class="tier-banner-img" src="assets/tier-tam-trung-banner.webp" alt="" />
              } @else {
                <img class="tier-banner-img" src="assets/tier-sieu-pham-banner.webp" alt="" />
              }
            </a>

            <div class="body">
              <h2 class="name">
                <a [routerLink]="['/accounts']" [queryParams]="item.queryParams">{{ item.tier.title }}</a>
              </h2>

              <p class="meta">
                @if (item.count > 0) {
                  Còn {{ item.count }} acc
                } @else {
                  Hết hàng
                }
              </p>

              <a class="btn btn-block cta" [routerLink]="['/accounts']" [queryParams]="item.queryParams">
                Xem tất cả
              </a>
            </div>
          </article>
        }
      </div>
    </div>
  `,
})
export class KhoAccLienQuan {
  private readonly accountService = inject(GameAccountService);

  protected readonly tiers = computed(() =>
    LIEN_QUAN_TIERS.map((tier) => ({
      tier,
      count: countInTier(this.accountService.all(), tier),
      queryParams: tierQueryParams(tier),
    })),
  );
}
