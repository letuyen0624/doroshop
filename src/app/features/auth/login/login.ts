import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, ToastService } from '../../../core/services';

/** Chỉ cho phép quay lại đường dẫn nội bộ, tránh bị lợi dụng để chuyển hướng ra ngoài. */
function safeReturnUrl(url: string | undefined): string {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/';
}

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './login.scss',
  template: `
    <div class="container auth page">
      <div class="auth-card card">
        <div class="logo-mark">
          <img src="assets/logo.webp" alt="Logo DoroShop" width="260" height="130" />
        </div>
        <h1>Đăng nhập</h1>
        <p class="lead">Chào mừng bạn quay lại DoroShop.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="login-email">Email</label>
            <input
              id="login-email"
              class="input"
              type="email"
              autocomplete="email"
              formControlName="email"
              [attr.aria-invalid]="showError('email') ? 'true' : null"
              [attr.aria-describedby]="showError('email') ? 'login-email-error' : null"
            />
            @if (showError('email')) {
              <span id="login-email-error" class="field-error">
                @if (form.controls.email.hasError('required')) {
                  Vui lòng nhập email
                } @else {
                  Email không đúng định dạng
                }
              </span>
            }
          </div>

          <div class="field">
            <label for="login-password">Mật khẩu</label>
            <input
              id="login-password"
              class="input"
              type="password"
              autocomplete="current-password"
              formControlName="password"
              [attr.aria-invalid]="showError('password') ? 'true' : null"
              [attr.aria-describedby]="showError('password') ? 'login-password-error' : null"
            />
            @if (showError('password')) {
              <span id="login-password-error" class="field-error">Vui lòng nhập mật khẩu</span>
            }
          </div>

          @if (errorMessage(); as message) {
            <p class="form-error" role="alert">{{ message }}</p>
          }

          <button type="submit" class="btn btn-block" [disabled]="submitting()">
            {{ submitting() ? 'Đang đăng nhập...' : 'Đăng nhập' }}
          </button>
        </form>

        <div class="demo-box">
          <p>Tài khoản demo (bấm để điền sẵn)</p>
          <ul>
            <li>
              Khách hàng:
              <button type="button" (click)="fillDemo('demo@doroshop.vn', 'demo123')">demo&#64;doroshop.vn / demo123</button>
            </li>
            <li>
              Quản trị:
              <button type="button" (click)="fillDemo('admin@doroshop.vn', 'admin123')">admin&#64;doroshop.vn / admin123</button>
            </li>
          </ul>
        </div>

        <p class="switch">
          Chưa có tài khoản?
          <a routerLink="/register" [queryParams]="returnUrl() ? { returnUrl: returnUrl() } : null">Đăng ký ngay</a>
        </p>
      </div>
    </div>
  `,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Đường dẫn cần quay lại sau khi đăng nhập, lấy từ query param returnUrl. */
  readonly returnUrl = input<string>();

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected showError(name: 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected fillDemo(email: string, password: string): void {
    this.form.setValue({ email, password });
    this.errorMessage.set(null);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.toast.success(`Xin chào ${user.name}!`);
        void this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.submitting.set(false);
      },
    });
  }
}
