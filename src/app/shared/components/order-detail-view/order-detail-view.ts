import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DeliveredCredential, Order, PAYMENT_METHOD_LABELS } from '../../../core/models';
import { VndPipe } from '../../pipes';
import { OrderStatusBadge } from '../order-status/order-status';

/** Nội dung chi tiết một đơn hàng, dùng chung cho khách và admin. */
@Component({
  selector: 'app-order-detail-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, VndPipe, OrderStatusBadge],
  styleUrl: './order-detail-view.scss',
  template: `
    @let o = order();
    <div class="detail">
      <header class="head">
        <div>
          <h3>Đơn {{ o.id }}</h3>
          <p class="when">Đặt lúc {{ o.createdAt | date: 'HH:mm dd/MM/yyyy' }}</p>
        </div>
        <app-order-status [status]="o.status" />
      </header>

      <div class="cols">
        <section>
          <h4>Nhận tài khoản</h4>
          <p>
            <strong>{{ o.contact.fullName }}</strong><br />
            {{ o.contact.contact }}
          </p>
          @if (o.contact.note) {
            <p class="note">Ghi chú: {{ o.contact.note }}</p>
          }
        </section>
        <section>
          <h4>Thanh toán</h4>
          <p>{{ paymentLabels[o.paymentMethod] }}</p>
          @if (o.couponCode) {
            <p class="note">Mã giảm giá: {{ o.couponCode }}</p>
          }
        </section>
      </div>

      <div class="table-wrap">
        <table class="data lines">
          <caption class="sr-only">Tài khoản trong đơn {{ o.id }}</caption>
          <thead>
            <tr>
              <th scope="col">Tài khoản</th>
              <th scope="col">Game</th>
              <th scope="col" class="num">Giá</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><a [routerLink]="['/accounts', o.account.slug]">{{ o.account.title }}</a></td>
              <td>{{ o.account.game }}</td>
              <td class="num">{{ o.account.price | vnd }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      @if (credentials().length > 0) {
        <section class="delivery" aria-labelledby="delivery-title">
          <h4 id="delivery-title">Thông tin bàn giao (demo)</h4>
          <p class="demo-note">
            ⚠️ Đây là dữ liệu demo dựng sẵn, không phải tài khoản game thật.
          </p>
          <ul class="plain credential-list">
            @for (credential of credentials(); track credential.accountId) {
              <li class="credential card">
                <span class="credential-title">{{ o.account.title }}</span>
                <dl>
                  <div>
                    <dt>Tài khoản demo</dt>
                    <dd><code>{{ credential.demoUsername }}</code></dd>
                  </div>
                  <div>
                    <dt>Mật khẩu demo</dt>
                    <dd><code>{{ credential.demoPassword }}</code></dd>
                  </div>
                  <div>
                    <dt>Bảo hành</dt>
                    <dd>{{ credential.warrantyDays }} ngày</dd>
                  </div>
                </dl>
              </li>
            }
          </ul>
        </section>
      }

      <dl class="totals">
        <div><dt>Tạm tính</dt><dd>{{ o.subtotal | vnd }}</dd></div>
        @if (o.discount > 0) {
          <div class="discount"><dt>Giảm giá</dt><dd>-{{ o.discount | vnd }}</dd></div>
        }
        <div class="grand"><dt>Tổng cộng</dt><dd>{{ o.total | vnd }}</dd></div>
      </dl>
    </div>
  `,
})
export class OrderDetailView {
  readonly order = input.required<Order>();
  /** Thông tin bàn giao demo của đơn này (đã lọc sẵn theo orderId). */
  readonly credentials = input<DeliveredCredential[]>([]);

  protected readonly paymentLabels = PAYMENT_METHOD_LABELS;
}
