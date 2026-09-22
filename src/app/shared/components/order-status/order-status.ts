import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ORDER_STATUS_LABELS, OrderStatus } from '../../../core/models';

const BADGE_CLASS: Record<OrderStatus, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

/** Nhãn trạng thái đơn hàng có màu theo từng trạng thái. */
@Component({
  selector: 'app-order-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge ' + badgeClass()">{{ label() }}</span>`,
})
export class OrderStatusBadge {
  readonly status = input.required<OrderStatus>();

  protected readonly label = computed(() => ORDER_STATUS_LABELS[this.status()]);
  protected readonly badgeClass = computed(() => BADGE_CLASS[this.status()]);
}
