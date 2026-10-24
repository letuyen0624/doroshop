import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GAMES, Game, GameAccount } from '../../core/models';
import { GameAccountService } from '../../core/services';
import { AccountCard, GameBadge } from '../../shared/components';

/** Một khối "theo tựa game" ở trang chủ: thông tin game kèm vài tin nổi bật của đúng game đó. */
interface GameSection {
  game: Game;
  accounts: GameAccount[];
}

/**
 * Thẻ "Acc Liên Quân" - cổng chung dẫn vào toàn bộ kho acc Liên Quân
 * (/accounts?games=lien-quan-mobile, mở ở tab mới), đứng đầu khối Liên Quân Mobile.
 * AccountCard nhận diện qua slug 'acc-lien-quan'.
 */
const LIEN_QUAN_FLAGSHIP_CARD: GameAccount = {
  id: 'lq-flagship-acc-lien-quan',
  slug: 'acc-lien-quan',
  title: 'Acc Liên Quân',
  game: 'lien-quan-mobile',
  server: 'Server Việt Nam',
  rank: 'Cao Thủ',
  characterCount: 0,
  skinCount: 0,
  loginStatus: 'chua_lien_ket',
  price: 1_590_000,
  oldPrice: 1_890_000,
  status: 'con_hang',
  rating: 4.8,
  reviewCount: 47,
  description: 'Kho acc Liên Quân Mobile uy tín, trắng thông tin 100%.',
  extraInfo: {},
  tags: ['dich-vu'],
  createdAt: new Date(0).toISOString(),
};

/**
 * Hai thẻ dịch vụ minh họa cố định, hiện cùng thẻ gateway và 3 thẻ tầng giá trong khối Liên Quân Mobile.
 * Không phải tin rao thật nên không nằm trong dữ liệu accounts; AccountCard nhận diện qua
 * đúng slug ('cay-thue-rank' / 'nap-game') để hiện banner, tag "DỊCH VỤ" và nút riêng.
 */
const LIEN_QUAN_SERVICE_CARDS: GameAccount[] = [
  {
    id: 'lq-service-cay-thue-rank',
    slug: 'cay-thue-rank',
    title: 'Cày thuê rank',
    game: 'lien-quan-mobile',
    server: 'Server Việt Nam',
    rank: 'Cao Thủ - Chiến Tướng',
    characterCount: 0,
    skinCount: 0,
    loginStatus: 'chua_lien_ket',
    price: 50_000,
    oldPrice: 70_000,
    status: 'con_hang',
    rating: 4.9,
    reviewCount: 85,
    description: 'Dịch vụ cày thuê rank Liên Quân Mobile, siêu tốc và bảo mật.',
    extraInfo: {},
    tags: ['dich-vu'],
    createdAt: new Date(0).toISOString(),
  },
  {
    id: 'lq-service-nap-game',
    slug: 'nap-game',
    title: 'Nạp game',
    game: 'lien-quan-mobile',
    server: 'Server Việt Nam',
    rank: 'Quân Huy 24/7',
    characterCount: 0,
    skinCount: 0,
    loginStatus: 'chua_lien_ket',
    price: 20_000,
    oldPrice: 22_000,
    status: 'con_hang',
    rating: 5.0,
    reviewCount: 120,
    description: 'Dịch vụ nạp game Liên Quân Mobile tự động, chiết khấu cao.',
    extraInfo: {},
    tags: ['dich-vu'],
    createdAt: new Date(0).toISOString(),
  },
];

/** Trang chủ: banner, khối tin nổi bật theo từng game và lý do chọn DoroShop. */
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
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Thẻ gateway "Acc Liên Quân", đứng đầu khối Liên Quân Mobile. */
  protected readonly lienQuanFlagshipCard = LIEN_QUAN_FLAGSHIP_CARD;

  /** 2 thẻ dịch vụ minh họa, hiện sau thẻ gateway trong cùng khối Liên Quân Mobile. */
  protected readonly lienQuanServiceCards = LIEN_QUAN_SERVICE_CARDS;

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

    this.accountService
      .featuredByGame(4)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (byGame) => {
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
