import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { GAMES, GameAccount } from '../../core/models';
import { GameAccountService } from '../../core/services';
import { AccountArt, AccountCard, GameBadge } from '../../shared/components';

/** Trang chủ: banner, danh mục theo game, tin nổi bật, tin giảm giá và lý do chọn DoroShop. */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AccountCard, AccountArt, GameBadge],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly accountService = inject(GameAccountService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly games = GAMES;
  protected readonly gameCount = this.accountService.gameCount;
  protected readonly availableCount = this.accountService.availableCount;

  protected readonly featured = signal<GameAccount[]>([]);
  protected readonly onSale = signal<GameAccount[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Ô trống dùng để vẽ skeleton trong lúc chờ dữ liệu. */
  protected readonly skeletons = Array.from({ length: 4 });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      featured: this.accountService.featured(4),
      onSale: this.accountService.onSale(4),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ featured, onSale }) => {
          this.featured.set(featured);
          this.onSale.set(onSale);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Không tải được dữ liệu tài khoản. Vui lòng thử lại.');
          this.loading.set(false);
        },
      });
  }
}
