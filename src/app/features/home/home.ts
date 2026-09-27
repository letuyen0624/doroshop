import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { GAMES, Game, GameAccount } from '../../core/models';
import { GameAccountService } from '../../core/services';
import { AccountCard, GameBadge } from '../../shared/components';

/** Một khối "theo tựa game" ở trang chủ: thông tin game kèm vài tin nổi bật của đúng game đó. */
interface GameSection {
  game: Game;
  accounts: GameAccount[];
}

/** Trang chủ: banner, khối tin nổi bật theo từng game, tin giảm giá và lý do chọn DoroShop. */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AccountCard, GameBadge],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly accountService = inject(GameAccountService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly gameCount = this.accountService.gameCount;
  protected readonly availableCount = this.accountService.availableCount;

  protected readonly gameSections = signal<GameSection[]>([]);
  protected readonly featured = signal<GameAccount[]>([]);
  protected readonly onSale = signal<GameAccount[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Ô trống dùng để vẽ skeleton trong lúc chờ dữ liệu. */
  protected readonly skeletons = Array.from({ length: 4 });
  /** Số khối "theo game" vẽ skeleton trong lúc chờ, không cần khớp số game thật. */
  protected readonly skeletonSections = Array.from({ length: 2 });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    const gameById = new Map(GAMES.map((game) => [game.id, game]));

    forkJoin({
      featured: this.accountService.featured(4),
      onSale: this.accountService.onSale(4),
      byGame: this.accountService.featuredByGame(4),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ featured, onSale, byGame }) => {
          this.featured.set(featured);
          this.onSale.set(onSale);
          this.gameSections.set(
            byGame
              .filter((section) => section.accounts.length > 0)
              .map((section) => ({ game: gameById.get(section.game)!, accounts: section.accounts })),
          );
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Không tải được dữ liệu tài khoản. Vui lòng thử lại.');
          this.loading.set(false);
        },
      });
  }
}
