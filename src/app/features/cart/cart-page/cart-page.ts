import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { COUPONS, CartService, ToastService } from '../../../core/services';
import { AccountArt, GameBadge } from '../../../shared/components';
import { VndPipe } from '../../../shared/pipes';

/** Trang giỏ hàng: xóa từng tin, nhập mã giảm giá và xem tóm tắt tiền. */
@Component({
  selector: 'app-cart-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, VndPipe, AccountArt, GameBadge],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
})
export class CartPage {
  protected readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);

  protected readonly coupons = COUPONS;
  protected readonly couponControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.maxLength(20)],
  });

  protected applyCoupon(event: Event): void {
    event.preventDefault();
    const result = this.cart.applyCoupon(this.couponControl.value);
    if (result.ok) {
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
    this.cart.clearCoupon();
    this.toast.info('Đã gỡ mã giảm giá');
  }

  protected remove(accountId: string, title: string): void {
    this.cart.remove(accountId);
    this.toast.info(`Đã xóa "${title}" khỏi giỏ hàng`);
  }
}
