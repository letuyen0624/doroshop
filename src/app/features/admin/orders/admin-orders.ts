import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DeliveredCredential, ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, Order, OrderStatus } from '../../../core/models';
import { OrderService, ToastService } from '../../../core/services';
import { OrderDetailView } from '../../../shared/components';
import { VndPipe } from '../../../shared/pipes';

type StatusFilter = OrderStatus | 'all';

/** Danh sách đơn hàng cho admin: lọc theo trạng thái, xem chi tiết và đổi trạng thái. */
@Component({
  selector: 'app-admin-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, VndPipe, OrderDetailView],
  styleUrl: './admin-orders.scss',
  templateUrl: './admin-orders.html',
})
export class AdminOrders {
  private readonly orderService = inject(OrderService);
  private readonly toast = inject(ToastService);

  protected readonly statuses = ORDER_STATUS_FLOW;
  protected readonly labels = ORDER_STATUS_LABELS;

  protected readonly filter = signal<StatusFilter>('all');
  protected readonly selectedId = signal<string | null>(null);
  protected readonly updatingId = signal<string | null>(null);

  protected readonly orders = this.orderService.orders;

  protected readonly filtered = computed(() => {
    const filter = this.filter();
    const all = this.orders();
    return filter === 'all' ? all : all.filter((order) => order.status === filter);
  });

  protected readonly selected = computed<Order | null>(() => {
    const id = this.selectedId();
    return id ? (this.orders().find((order) => order.id === id) ?? null) : null;
  });

  protected countFor(status: StatusFilter): number {
    return status === 'all'
      ? this.orders().length
      : this.orders().filter((order) => order.status === status).length;
  }

  protected setFilter(value: string): void {
    this.filter.set(value as StatusFilter);
    this.selectedId.set(null);
  }

  protected select(id: string): void {
    this.selectedId.update((current) => (current === id ? null : id));
  }

  protected changeStatus(order: Order, value: string): void {
    const status = value as OrderStatus;
    if (status === order.status) {
      return;
    }
    this.updatingId.set(order.id);
    this.orderService.updateStatus(order.id, status).subscribe({
      next: () => {
        this.toast.success(`Đơn ${order.id}: ${ORDER_STATUS_LABELS[status]}`);
        this.updatingId.set(null);
      },
      error: () => {
        this.toast.error('Không cập nhật được trạng thái đơn hàng');
        this.updatingId.set(null);
      },
    });
  }

  protected credentialsFor(orderId: string): DeliveredCredential[] {
    return this.orderService.credentialsFor(orderId);
  }
}
