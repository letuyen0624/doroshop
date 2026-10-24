import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { GAMES, GameId, rankFilterLabel } from '../../../core/models';
import {
  AccountPage,
  AccountQuery,
  DEFAULT_QUERY,
  GameAccountService,
  SORT_OPTIONS,
  SortOption,
} from '../../../core/services';
import { AccountCard, Pagination } from '../../../shared/components';

type ListState = { status: 'loading' } | { status: 'ready'; page: AccountPage } | { status: 'error' };

const LOADING: ListState = { status: 'loading' };
const PAGE_SIZE = 9;

function parseSort(value: string | undefined): SortOption {
  const found = SORT_OPTIONS.find((option) => option.value === value);
  return found ? found.value : DEFAULT_QUERY.sort;
}

function parseGames(value: string | undefined): GameId[] {
  if (!value) {
    return [];
  }
  const valid = new Set(GAMES.map((game) => game.id));
  return value
    .split(',')
    .map((id) => id.trim())
    .filter((id): id is GameId => valid.has(id as GameId));
}

function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseNumber(value: string | undefined): number | null {
  if (value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * Danh sách tài khoản với tìm kiếm, lọc, sắp xếp và phân trang.
 * Toàn bộ trạng thái bộ lọc nằm trên query params nên link chia sẻ được
 * và nút quay lại của trình duyệt hoạt động đúng.
 */
@Component({
  selector: 'app-account-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AccountCard, Pagination],
  templateUrl: './account-list.html',
  styleUrl: './account-list.scss',
})
export class AccountList {
  private readonly accountService = inject(GameAccountService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Các input này được gắn tự động từ query params nhờ withComponentInputBinding().
  readonly search = input<string>();
  readonly games = input<string>();
  readonly ranks = input<string>();
  readonly minPrice = input<string>();
  readonly maxPrice = input<string>();
  readonly inStock = input<string>();
  readonly sort = input<string>();
  readonly page = input<string>();

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly skeletons = Array.from({ length: PAGE_SIZE });

  protected readonly sortControl = this.fb.nonNullable.control<SortOption>(DEFAULT_QUERY.sort);
  protected readonly inStockOnlyControl = this.fb.nonNullable.control<boolean>(false);

  /** Bộ lọc hiện tại, dựng lại từ query params. */
  protected readonly query = computed<AccountQuery>(() => ({
    search: this.search() ?? '',
    games: parseGames(this.games()),
    ranks: parseList(this.ranks()),
    minPrice: parseNumber(this.minPrice()),
    maxPrice: parseNumber(this.maxPrice()),
    inStockOnly: this.inStock() === '1',
    sort: parseSort(this.sort()),
    page: Math.max(1, Number(this.page() ?? '1') || 1),
    pageSize: PAGE_SIZE,
  }));

  /**
   * Danh sách rank để chọn, chỉ lấy từ (các) game đang được lọc — mỗi game có hệ rank
   * riêng nên không trộn chung (vd. chọn Liên Quân thì không hiện "AR 20" của Genshin).
   * Chưa chọn game nào thì vẫn hiện toàn bộ rank như trước.
   */
  protected readonly availableRanks = computed(() => this.accountService.ranks(this.query().games));

  /** Nhãn ô lọc Rank đổi theo thuật ngữ của game, vd Genshin Impact hiện "Cấp độ AR". */
  protected readonly rankLabel = computed(() => rankFilterLabel(this.query().games));

  /** Tăng lên mỗi lần bấm "Thử lại" để chạy lại truy vấn với cùng bộ lọc. */
  private readonly refreshTick = signal(0);
  private readonly request = computed(() => ({ query: this.query(), tick: this.refreshTick() }));

  /** Kết quả tìm kiếm; switchMap tự hủy request cũ khi bộ lọc đổi liên tục. */
  private readonly state = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ query }) =>
        this.accountService.search(query).pipe(
          map((page): ListState => ({ status: 'ready', page })),
          startWith<ListState>({ status: 'loading' }),
          catchError(() => of<ListState>({ status: 'error' })),
        ),
      ),
    ),
    { initialValue: LOADING },
  );

  protected readonly loading = computed(() => this.state().status === 'loading');
  protected readonly failed = computed(() => this.state().status === 'error');
  protected readonly result = computed<AccountPage | null>(() => {
    const state = this.state();
    return state.status === 'ready' ? state.page : null;
  });

  protected readonly activeFilterCount = computed(() => {
    const query = this.query();
    let count = 0;
    if (query.search) count++;
    if (query.games.length > 0) count++;
    if (query.ranks.length > 0) count++;
    if (query.minPrice !== null || query.maxPrice !== null) count++;
    if (query.inStockOnly) count++;
    return count;
  });

  protected readonly resultLabel = computed(() => {
    const result = this.result();
    if (!result) {
      return '';
    }
    if (result.total === 0) {
      return 'Không có tài khoản nào khớp bộ lọc';
    }
    return `Có ${result.total} tài khoản phù hợp với tìm kiếm của bạn`;
  });

  constructor() {
    // URL đổi (ví dụ bấm "Xem tất cả acc <Game>" ở trang chủ, hoặc tìm kiếm ở header) thì đồng bộ ngược lại vào form.
    effect(() => {
      const query = this.query();
      this.sortControl.setValue(query.sort, { emitEvent: false });
      this.inStockOnlyControl.setValue(query.inStockOnly, { emitEvent: false });
    });

    this.inStockOnlyControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((inStockOnly) => {
      this.patchQuery({ inStock: inStockOnly ? '1' : null, page: null });
    });

    this.sortControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((sort) => this.patchQuery({ sort: sort === DEFAULT_QUERY.sort ? null : sort, page: null }));
  }

  protected isRankSelected(rank: string): boolean {
    return this.query().ranks.includes(rank);
  }

  protected toggleRank(rank: string, checked: boolean): void {
    const current = this.query().ranks;
    const next = checked ? [...current, rank] : current.filter((item) => item !== rank);
    this.patchQuery({ ranks: next.length > 0 ? next.join(',') : null, page: null });
  }

  protected goToPage(page: number): void {
    this.patchQuery({ page: page > 1 ? String(page) : null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected clearFilters(): void {
    void this.router.navigate(['/accounts'], { queryParams: {} });
  }

  protected retry(): void {
    this.refreshTick.update((tick) => tick + 1);
  }

  private patchQuery(params: Record<string, string | null>): void {
    void this.router.navigate(['/accounts'], {
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
