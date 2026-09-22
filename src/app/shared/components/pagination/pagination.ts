import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** Thanh phân trang rút gọn, luôn hiện trang đầu, trang cuối và các trang quanh trang hiện tại. */
@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './pagination.scss',
  template: `
    @if (totalPages() > 1) {
      <nav class="pagination" aria-label="Phân trang danh sách sản phẩm">
        <button
          type="button"
          class="page-btn"
          [disabled]="page() === 1"
          aria-label="Trang trước"
          (click)="go(page() - 1)"
        >
          ‹
        </button>

        @for (item of pages(); track $index) {
          @if (item === null) {
            <span class="ellipsis" aria-hidden="true">…</span>
          } @else {
            <button
              type="button"
              class="page-btn"
              [class.active]="item === page()"
              [attr.aria-current]="item === page() ? 'page' : null"
              [attr.aria-label]="'Trang ' + item"
              (click)="go(item)"
            >
              {{ item }}
            </button>
          }
        }

        <button
          type="button"
          class="page-btn"
          [disabled]="page() === totalPages()"
          aria-label="Trang sau"
          (click)="go(page() + 1)"
        >
          ›
        </button>
      </nav>
    }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  /** null đại diện cho dấu ba chấm giữa các nhóm trang. */
  protected readonly pages = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const result: (number | null)[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) {
      result.push(null);
    }
    for (let page = start; page <= end; page++) {
      result.push(page);
    }
    if (end < total - 1) {
      result.push(null);
    }
    result.push(total);
    return result;
  });

  protected go(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.page()) {
      this.pageChange.emit(page);
    }
  }
}
