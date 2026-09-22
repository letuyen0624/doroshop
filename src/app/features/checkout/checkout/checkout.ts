import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PAYMENT_METHOD_LABELS, PaymentMethod, gameName } from '../../../core/models';
import { AuthService, CartService, OrderService, ToastService } from '../../../core/services';
import { VndPipe } from '../../../shared/pipes';
import { emailOrVnPhone, notBlank } from '../../../shared/validators';

interface PaymentOption {
  value: PaymentMethod;
  label: string;
  description: string;
}

/**
 * Thanh toán. Toàn bộ bước trả tiền chỉ là mô phỏng: không có cổng thanh toán thật,
 * không thu thập số thẻ hay thông tin ngân hàng của người dùng.
 */
@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, VndPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly orders = inject(OrderService);
  private readonly toast = inject(ToastService);
  protected readonly cart = inject(CartService);

  protected readonly paymentOptions: readonly PaymentOption[] = [
    {
      value: 'cod',
      label: PAYMENT_METHOD_LABELS.cod,
      description: 'Xác nhận qua điện thoại, thanh toán khi nhận thông tin tài khoản.',
    },
    {
      value: 'bank',
      label: PAYMENT_METHOD_LABELS.bank,
      description: 'Chuyển khoản theo thông tin bên dưới, đơn được xác nhận sau khi nhận tiền.',
    },
    {
      value: 'wallet',
      label: PAYMENT_METHOD_LABELS.wallet,
      description: 'Thanh toán tức thì bằng ví DoroPay (giả lập, không trừ tiền thật).',
    },
  ];

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    fullName: [this.auth.currentUser()?.name ?? '', [Validators.required, Validators.minLength(2), notBlank()]],
    contact: ['', [Validators.required, emailOrVnPhone()]],
    note: ['', [Validators.maxLength(300)]],
    paymentMethod: this.fb.nonNullable.control<PaymentMethod>('cod'),
  });

  protected readonly method = signal<PaymentMethod>('cod');

  /** Mã tham chiếu chuyển khoản cố định theo phiên, chỉ để minh họa. */
  protected readonly transferRef = `DR${Date.now().toString().slice(-6)}`;

  protected readonly submitLabel = computed(() => {
    if (this.submitting()) {
      return 'Đang xử lý đơn hàng...';
    }
    return this.method() === 'wallet' ? 'Thanh toán bằng DoroPay' : 'Đặt hàng';
  });

  constructor() {
    // Giỏ trống thì không có gì để thanh toán, đưa người dùng về giỏ hàng.
    effect(() => {
      if (this.cart.isEmpty() && !this.submitting()) {
        void this.router.navigate(['/cart']);
      }
    });

    this.form.controls.paymentMethod.valueChanges.subscribe((value) => this.method.set(value));
  }

  protected showError(name: 'fullName' | 'contact' | 'note'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Vui lòng kiểm tra lại các thông tin nhận tài khoản.');
      return;
    }

    const user = this.auth.currentUser();
    if (!user) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    // Kiểm tra lại trạng thái ngay lúc đặt vì admin có thể đã đổi tài khoản trong lúc chờ.
    const lines = this.cart.lines();
    const alreadySold = lines.find((line) => line.account.status === 'da_ban');
    if (alreadySold) {
      this.errorMessage.set(
        `Tài khoản "${alreadySold.account.title}" vừa được bán cho người khác. Vui lòng xóa khỏi giỏ hàng.`,
      );
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { fullName, contact, note, paymentMethod } = this.form.getRawValue();
    const summary = this.cart.summary();

    this.orders
      .create({
        userId: user.id,
        lines: lines.map((line) => ({
          accountId: line.account.id,
          title: line.account.title,
          slug: line.account.slug,
          game: gameName(line.account.game),
          price: line.account.price,
        })),
        contact: {
          fullName: fullName.trim(),
          contact: contact.trim(),
          note: note.trim(),
        },
        paymentMethod,
        subtotal: summary.subtotal,
        discount: summary.discount,
        total: summary.total,
        couponCode: this.cart.coupon()?.code ?? null,
      })
      .subscribe({
        next: (order) => {
          this.cart.clear();
          this.toast.success(`Đặt hàng thành công, mã đơn ${order.id}`);
          void this.router.navigate(['/order-success', order.id]);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.submitting.set(false);
        },
      });
  }
}
