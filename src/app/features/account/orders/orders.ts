import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { DeliveredCredential, Order } from '../../../core/models';
import { AuthService, OrderService } from '../../../core/services';
import { OrderDetailView, OrderStatusBadge } from '../../../shared/components';
import { VndPipe } from '../../../shared/pipes';

type State = { status: 'loading' } | { status: 'ready'; orders: Order[] } | { status: 'error' };

const LOADING: State = { status: 'loading' };

/** Lịch sử đơn hàng của người dùng hiện tại, bấm vào từng đơn để xem chi tiết và bàn giao demo. */
@Component({
  selector: 'app-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, VndPipe, OrderStatusBadge, OrderDetailView],
  styleUrl: './orders.scss',
  template: `
    <div class="page container">
      <div class="page-head">
        <h1>Đơn hàng của tôi</h1>
        <p>Theo dõi trạng thái và xem lại thông tin bàn giao demo của từng đơn.</p>
      </div>

      @if (loading()) {
        <div class="stack" aria-hidden="true">
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton row-skeleton"></div>
          }
        </div>
        <p class="sr-only" role="status">Đang tải đơn hàng</p>
      } @else if (failed()) {
        <div class="error-state">Không tải được danh sách đơn hàng. Vui lòng tải lại trang.</div>
      } @else if (orders().length === 0) {
        <div class="empty-state card">
          <h2>Bạn chưa có đơn hàng nào</h2>
          <p>Khi mua acc, đơn của bạn sẽ xuất hiện ở đây để tiện theo dõi.</p>
          <a class="btn" routerLink="/accounts">Xem tài khoản game</a>
        </div>
      } @else {
        <ul class="plain stack">
          @for (order of orders(); track order.id) {
            <li class="card order">
              <button
                type="button"
                class="order-head"
                [attr.aria-expanded]="expandedId() === order.id"
                [attr.aria-controls]="'order-panel-' + order.id"
                (click)="toggle(order.id)"
              >
                <span class="order-id">{{ order.id }}</span>
                <span class="order-date">{{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                <app-order-status [status]="order.status" />
                <span class="order-total">{{ order.total | vnd }}</span>
                <span class="chevron" aria-hidden="true">{{ expandedId() === order.id ? '−' : '+' }}</span>
              </button>
              @if (expandedId() === order.id) {
                <div class="order-body" [id]="'order-panel-' + order.id">
                  <app-order-detail-view [order]="order" [credentials]="credentialsFor(order.id)" />
                </div>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class Orders {
  private readonly ordersService = inject(OrderService);
  private readonly auth = inject(AuthService);

  protected readonly expandedId = signal<string | null>(null);

  private readonly state = toSignal(
    toObservable(this.auth.currentUser).pipe(
      switchMap((user) =>
        user
          ? this.ordersService.byUser(user.id).pipe(
              map((orders): State => ({ status: 'ready', orders })),
              startWith<State>({ status: 'loading' }),
              catchError(() => of<State>({ status: 'error' })),
            )
          : of<State>({ status: 'ready', orders: [] }),
      ),
    ),
    { initialValue: LOADING },
  );

  protected readonly loading = computed(() => this.state().status === 'loading');
  protected readonly failed = computed(() => this.state().status === 'error');
  protected readonly orders = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.orders : [];
  });

  protected toggle(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  protected credentialsFor(orderId: string): DeliveredCredential[] {
    return this.ordersService.credentialsFor(orderId);
  }
}
