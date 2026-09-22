import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { Order } from '../../../core/models';
import { AuthService, OrderService } from '../../../core/services';
import { OrderDetailView } from '../../../shared/components';

type State = { status: 'loading' } | { status: 'ready'; order: Order } | { status: 'error' };

const LOADING: State = { status: 'loading' };

/** Màn hình xác nhận sau khi đặt hàng, hiển thị mã đơn và thông tin bàn giao demo. */
@Component({
  selector: 'app-order-success',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, OrderDetailView],
  styleUrl: './order-success.scss',
  template: `
    <div class="page container narrow">
      @if (order(); as o) {
        <div class="card success">
          <div class="check" aria-hidden="true">✓</div>
          <h1>Đặt hàng thành công!</h1>
          <p>
            Cảm ơn bạn đã mua sắm tại DoroShop. Mã đơn hàng của bạn là
            <strong class="code">{{ o.id }}</strong>. Chúng tôi sẽ liên hệ xác nhận qua
            {{ o.contact.contact }}.
          </p>
          @if (o.paymentMethod === 'bank') {
            <p class="hint">
              Vui lòng chuyển khoản với nội dung là mã đơn hàng để được xác nhận sớm nhất (giả lập).
            </p>
          }
          <div class="row actions">
            <a class="btn" routerLink="/account/orders">Xem đơn hàng của tôi</a>
            <a class="btn btn-ghost" routerLink="/accounts">Tiếp tục mua sắm</a>
          </div>
        </div>
        <div class="card detail-card">
          <app-order-detail-view [order]="o" [credentials]="credentials()" />
        </div>
      } @else if (failed()) {
        <div class="empty-state card">
          <h1>Không tìm thấy đơn hàng</h1>
          <p>Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn này.</p>
          <a class="btn" routerLink="/account/orders">Xem đơn hàng của tôi</a>
        </div>
      } @else {
        <div class="skeleton box" aria-hidden="true"></div>
        <p class="sr-only" role="status">Đang tải đơn hàng</p>
      }
    </div>
  `,
})
export class OrderSuccess {
  private readonly orders = inject(OrderService);
  private readonly auth = inject(AuthService);

  /** Lấy từ tham số đường dẫn /order-success/:id. */
  readonly id = input.required<string>();

  private readonly state = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.orders.getById(id).pipe(
          map((order): State => {
            const user = this.auth.currentUser();
            // Khách chỉ được xem đơn của mình; admin xem được tất cả.
            return user && (user.role === 'admin' || order.userId === user.id)
              ? { status: 'ready', order }
              : { status: 'error' };
          }),
          startWith<State>({ status: 'loading' }),
          catchError(() => of<State>({ status: 'error' })),
        ),
      ),
    ),
    { initialValue: LOADING },
  );

  protected readonly failed = computed(() => this.state().status === 'error');
  protected readonly order = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.order : null;
  });

  protected readonly credentials = computed(() => {
    const order = this.order();
    return order ? this.orders.credentialsFor(order.id) : [];
  });
}
