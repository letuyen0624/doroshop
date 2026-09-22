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
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { GAMES, GameId } from '../../../core/models';
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

  protected readonly gameOptions = GAMES;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly availableRanks = this.accountService.ranks();
  protected readonly priceRange = this.accountService.priceRange();
  protected readonly skeletons = Array.from({ length: PAGE_SIZE });

  protected readonly searchControl = this.fb.nonNullable.control('');
  protected readonly sortControl = this.fb.nonNullable.control<SortOption>('newest');

  protected readonly filterForm = this.fb.nonNullable.group({
    minPrice: this.fb.nonNullable.control<string>(''),
    maxPrice: this.fb.nonNullable.control<string>(''),
    inStockOnly: this.fb.nonNullable.control<boolean>(false),
  });

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
    const from = (result.page - 1) * result.pageSize + 1;
    const to = Math.min(result.total, from + result.items.length - 1);
    return `Hiển thị ${from}-${to} trong ${result.total} tài khoản`;
  });

  constructor() {
    // URL đổi (ví dụ bấm danh mục ở header) thì đồng bộ ngược lại vào form.
    effect(() => {
      const query = this.query();
      if (this.searchControl.value !== query.search) {
        this.searchControl.setValue(query.search, { emitEvent: false });
      }
      this.sortControl.setValue(query.sort, { emitEvent: false });
      this.filterForm.setValue(
        {
          minPrice: query.minPrice === null ? '' : String(query.minPrice),
          maxPrice: query.maxPrice === null ? '' : String(query.maxPrice),
          inStockOnly: query.inStockOnly,
        },
        { emitEvent: false },
      );
    });

    // Gõ tìm kiếm thì chờ 350ms rồi mới cập nhật URL.
    this.searchControl.valueChanges
      .pipe(
        debounceTime(350),
        map((value) => value.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((value) => this.patchQuery({ search: value || null, page: null }));

    this.filterForm.valueChanges.pipe(debounceTime(250), takeUntilDestroyed()).subscribe((value) => {
      this.patchQuery({
        minPrice: value.minPrice || null,
        maxPrice: value.maxPrice || null,
        inStock: value.inStockOnly ? '1' : null,
        page: null,
      });
    });

    this.sortControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((sort) => this.patchQuery({ sort: sort === 'newest' ? null : sort, page: null }));
  }

  protected isGameSelected(gameId: GameId): boolean {
    return this.query().games.includes(gameId);
  }

  protected toggleGame(gameId: GameId, checked: boolean): void {
    const current = this.query().games;
    const next = checked ? [...current, gameId] : current.filter((id) => id !== gameId);
    this.patchQuery({ games: next.length > 0 ? next.join(',') : null, page: null });
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
