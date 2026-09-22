import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Hiển thị điểm đánh giá dạng 5 ngôi sao, hỗ trợ nửa sao bằng cách cắt chiều rộng. */
@Component({
  selector: 'app-star-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './star-rating.scss',
  template: `
    <span class="rating" [attr.aria-label]="ariaLabel()" role="img">
      <span class="stars" aria-hidden="true">
        <span class="stars-bg">★★★★★</span>
        <span class="stars-fill" [style.width.%]="percent()">★★★★★</span>
      </span>
      @if (showValue()) {
        <span class="value">{{ rating().toFixed(1) }}</span>
      }
      @if (reviewCount() > 0) {
        <span class="count">({{ reviewCount() }} đánh giá)</span>
      }
    </span>
  `,
})
export class StarRating {
  readonly rating = input.required<number>();
  readonly reviewCount = input<number>(0);
  readonly showValue = input<boolean>(true);

  protected readonly percent = computed(() =>
    Math.max(0, Math.min(100, (this.rating() / 5) * 100)),
  );

  protected readonly ariaLabel = computed(() => {
    const base = `Đánh giá ${this.rating().toFixed(1)} trên 5 sao`;
    return this.reviewCount() > 0 ? `${base}, ${this.reviewCount()} lượt đánh giá` : base;
  });
}
