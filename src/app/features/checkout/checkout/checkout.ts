import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Coupon, PAYMENT_METHOD_LABELS, PaymentMethod } from '../../../core/models';
import {
  AuthService,
  COUPONS,
  GameAccountService,
  OrderService,
  ToastService,
  calculateTotals,
  resolveCoupon,
} from '../../../core/services';
import { AccountArt, GameBadge } from '../../../shared/components';
import { VndPipe } from '../../../shared/pipes';
import { emailOrVnPhone, notBlank } from '../../../shared/validators';

interface PaymentOption {
  value: PaymentMethod;
  label: string;
  description: string;
}

/**
 * Thanh toán MỘT tài khoản: chọn ở trang danh sách/chi tiết rồi bấm "Mua ngay" để sang
 * /checkout?account=<slug>. Mã giảm giá áp dụng trực tiếp tại đây. Toàn bộ bước trả tiền
 * chỉ là mô phỏng: không có cổng thanh toán thật, không thu thập số thẻ hay thông tin ngân hàng.
 */
@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, VndPipe, AccountArt, GameBadge],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly orders = inject(OrderService);
  private readonly accounts = inject(GameAccountService);
  private readonly toast = inject(ToastService);

  /** Slug của tài khoản đang mua, lấy từ query param ?account=. */
  readonly account = input<string | undefined>();

  /** Tin rao đang mua, null nếu thiếu tham số hoặc không tìm thấy. */
  protected readonly item = computed(() => {
    const slug = this.account();
    return slug ? (this.accounts.all().find((candidate) => candidate.slug === slug) ?? null) : null;
  });

  /** Đã đặt xong: sau đó tin chuyển sang "đã bán" nhưng không được báo lỗi. */
  private readonly placed = signal(false);

  protected readonly soldOut = computed(() => !this.placed() && this.item()?.status === 'da_ban');

  protected readonly coupons = COUPONS;
  protected readonly coupon = signal<Coupon | null>(null);
  protected readonly couponControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.maxLength(20)],
  });

  protected readonly totals = computed(() => calculateTotals(this.item()?.price ?? 0, this.coupon()));

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
    this.form.controls.paymentMethod.valueChanges.subscribe((value) => this.method.set(value));
  }

  protected showError(name: 'fullName' | 'contact' | 'note'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected applyCoupon(event: Event): void {
    event.preventDefault();
    const result = resolveCoupon(this.couponControl.value, this.coupon());
    if (result.ok) {
      this.coupon.set(result.coupon);
      this.toast.success(`Đã áp dụng mã ${result.coupon.code}`);
      this.couponControl.reset('');
      return;
    }
    const messages = {
      empty: 'Vui lòng nhập mã giảm giá',
      invalid: 'Mã giảm giá không hợp lệ',
      duplicate: 'Mã này đã được áp dụng rồi',
    } as const;
    this.toast.error(messages[result.reason]);
  }

  protected removeCoupon(): void {
    this.coupon.set(null);
    this.toast.info('Đã gỡ mã giảm giá');
  }

  protected submit(): void {
    const item = this.item();
    if (!item) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Vui lòng kiểm tra lại các thông tin nhận tài khoản.');
      return;
    }

    const user = this.auth.currentUser();
    if (!user) {
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/checkout?account=${item.slug}` },
      });
      return;
    }

    // Kiểm tra lại trạng thái ngay lúc đặt vì admin có thể đã đổi tài khoản trong lúc chờ.
    if (item.status === 'da_ban') {
      this.errorMessage.set(`Tài khoản "${item.title}" vừa được bán cho người khác.`);
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { fullName, contact, note, paymentMethod } = this.form.getRawValue();

    this.orders
      .create({
        userId: user.id,
        accountId: item.id,
        contact: {
          fullName: fullName.trim(),
          contact: contact.trim(),
          note: note.trim(),
        },
        paymentMethod,
        couponCode: this.coupon()?.code ?? null,
      })
      .subscribe({
        next: (order) => {
          this.placed.set(true);
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
