import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { GameAccount, LOGIN_STATUS_LABELS, gameName } from '../../../core/models';
import { GameAccountService, discountPercent } from '../../../core/services';
import { AccountArt, AccountCard, GameBadge, StarRating } from '../../../shared/components';
import { VndPipe } from '../../../shared/pipes';

interface DetailData {
  account: GameAccount;
  related: GameAccount[];
}

type DetailState = { status: 'loading' } | { status: 'ready'; data: DetailData } | { status: 'error' };

const LOADING: DetailState = { status: 'loading' };

/** Trang chi tiết tài khoản: badge game, giá, rank, thông số, mô tả và tin liên quan. */
@Component({
  selector: 'app-account-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, VndPipe, AccountArt, AccountCard, GameBadge, StarRating],
  templateUrl: './account-detail.html',
  styleUrl: './account-detail.scss',
})
export class AccountDetail {
  private readonly accountService = inject(GameAccountService);

  /** Lấy từ tham số đường dẫn /accounts/:slug. */
  readonly slug = input.required<string>();

  private readonly state = toSignal(
    toObservable(this.slug).pipe(
      switchMap((slug) =>
        this.accountService.getBySlug(slug).pipe(
          switchMap((account) =>
            this.accountService
              .related(account, 4)
              .pipe(map((related): DetailState => ({ status: 'ready', data: { account, related } }))),
          ),
          startWith<DetailState>({ status: 'loading' }),
          catchError(() => of<DetailState>({ status: 'error' })),
        ),
      ),
    ),
    { initialValue: LOADING },
  );

  protected readonly loading = computed(() => this.state().status === 'loading');
  protected readonly failed = computed(() => this.state().status === 'error');
  protected readonly data = computed<DetailData | null>(() => {
    const state = this.state();
    return state.status === 'ready' ? state.data : null;
  });

  protected readonly account = computed<GameAccount | null>(() => this.data()?.account ?? null);
  protected readonly related = computed<GameAccount[]>(() => this.data()?.related ?? []);

  protected readonly discount = computed(() => {
    const account = this.account();
    return account ? discountPercent(account) : 0;
  });

  protected readonly saveAmount = computed(() => {
    const account = this.account();
    return account?.oldPrice ? account.oldPrice - account.price : 0;
  });

  protected readonly gameLabel = computed(() => {
    const account = this.account();
    return account ? gameName(account.game) : '';
  });

  protected readonly loginStatusLabel = computed(() => {
    const account = this.account();
    return account ? LOGIN_STATUS_LABELS[account.loginStatus] : '';
  });

  /** Danh sách cặp tên và giá trị của bảng thông tin thêm. */
  protected readonly extraEntries = computed<{ key: string; value: string }[]>(() => {
    const account = this.account();
    if (!account) {
      return [];
    }
    return Object.entries(account.extraInfo).map(([key, value]) => ({ key, value }));
  });
}
