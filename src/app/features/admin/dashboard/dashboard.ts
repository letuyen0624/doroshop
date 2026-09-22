import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GAMES } from '../../../core/models';
import { GameAccountService, OrderService } from '../../../core/services';
import { OrderStatusBadge } from '../../../shared/components';
import { VndPipe } from '../../../shared/pipes';

interface DayBar {
  key: string;
  label: string;
  revenue: number;
  height: number;
}

const DAYS = 7;
const CHART_HEIGHT = 160;

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** Tổng quan: doanh thu, số đơn, số tin theo trạng thái/game và biểu đồ 7 ngày gần nhất. */
@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, DecimalPipe, VndPipe, OrderStatusBadge],
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly accountService = inject(GameAccountService);
  private readonly orderService = inject(OrderService);

  protected readonly chartHeight = CHART_HEIGHT;

  protected readonly revenue = this.orderService.revenue;
  protected readonly orders = this.orderService.orders;
  protected readonly orderCount = computed(() => this.orders().length);
  protected readonly accountCount = computed(() => this.accountService.all().length);

  protected readonly pendingCount = computed(
    () => this.orders().filter((order) => order.status === 'pending').length,
  );

  protected readonly availableCount = computed(
    () => this.accountService.all().filter((account) => account.status === 'con_hang').length,
  );

  protected readonly soldCount = computed(
    () => this.accountService.all().filter((account) => account.status === 'da_ban').length,
  );

  /** Số tin theo từng game, chỉ hiện những game có ít nhất một tin. */
  protected readonly byGame = computed(() => {
    const counts = this.accountService.countByGame();
    return GAMES.map((game) => ({ game, count: counts[game.id] ?? 0 })).filter((row) => row.count > 0);
  });

  protected readonly maxGameCount = computed(() =>
    Math.max(1, ...this.byGame().map((row) => row.count)),
  );

  protected readonly recentOrders = computed(() => this.orders().slice(0, 5));

  /** Doanh thu theo ngày trong 7 ngày gần nhất, không tính đơn đã hủy. */
  protected readonly bars = computed<DayBar[]>(() => {
    const today = new Date();
    const totals = new Map<string, number>();
    for (const order of this.orders()) {
      if (order.status === 'cancelled') {
        continue;
      }
      const key = dayKey(new Date(order.createdAt));
      totals.set(key, (totals.get(key) ?? 0) + order.total);
    }

    const days: { key: string; label: string; revenue: number }[] = [];
    for (let offset = DAYS - 1; offset >= 0; offset--) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
      const key = dayKey(date);
      days.push({
        key,
        label: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        revenue: totals.get(key) ?? 0,
      });
    }

    const max = Math.max(...days.map((day) => day.revenue), 1);
    return days.map((day) => ({
      ...day,
      height: day.revenue > 0 ? Math.max(4, Math.round((day.revenue / max) * CHART_HEIGHT)) : 0,
    }));
  });

  protected readonly weekRevenue = computed(() =>
    this.bars().reduce((total, bar) => total + bar.revenue, 0),
  );
}
