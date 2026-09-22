import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, ToastService } from '../../../core/services';
import { matchFields, notBlank } from '../../../shared/validators';

function safeReturnUrl(url: string | undefined): string {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/';
}

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './register.scss',
  template: `
    <div class="container auth page">
      <div class="auth-card card">
        <div class="logo-mark">
          <img src="assets/logo.png" alt="Logo DoroShop" />
        </div>
        <h1>Tạo tài khoản</h1>
        <p class="lead">Đăng ký để mua acc và theo dõi đơn nhanh hơn.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="reg-name">Họ và tên</label>
            <input
              id="reg-name"
              class="input"
              type="text"
              autocomplete="name"
              formControlName="name"
              [attr.aria-invalid]="showError('name') ? 'true' : null"
              [attr.aria-describedby]="showError('name') ? 'reg-name-error' : null"
            />
            @if (showError('name')) {
              <span id="reg-name-error" class="field-error">
                @if (form.controls.name.hasError('required') || form.controls.name.hasError('blank')) {
                  Vui lòng nhập họ và tên
                } @else {
                  Họ và tên cần có ít nhất 2 ký tự
                }
              </span>
            }
          </div>

          <div class="field">
            <label for="reg-email">Email</label>
            <input
              id="reg-email"
              class="input"
              type="email"
              autocomplete="email"
              formControlName="email"
              [attr.aria-invalid]="showError('email') ? 'true' : null"
              [attr.aria-describedby]="showError('email') ? 'reg-email-error' : null"
            />
            @if (showError('email')) {
              <span id="reg-email-error" class="field-error">
                @if (form.controls.email.hasError('required')) {
                  Vui lòng nhập email
                } @else {
                  Email không đúng định dạng
                }
              </span>
            }
          </div>

          <div class="field">
            <label for="reg-password">Mật khẩu</label>
            <input
              id="reg-password"
              class="input"
              type="password"
              autocomplete="new-password"
              formControlName="password"
              [attr.aria-invalid]="showError('password') ? 'true' : null"
              [attr.aria-describedby]="'reg-password-hint' + (showError('password') ? ' reg-password-error' : '')"
            />
            <span id="reg-password-hint" class="hint">Tối thiểu 6 ký tự.</span>
            @if (showError('password')) {
              <span id="reg-password-error" class="field-error">
                @if (form.controls.password.hasError('required')) {
                  Vui lòng nhập mật khẩu
                } @else {
                  Mật khẩu cần có ít nhất 6 ký tự
                }
              </span>
            }
          </div>

          <div class="field">
            <label for="reg-confirm">Nhập lại mật khẩu</label>
            <input
              id="reg-confirm"
              class="input"
              type="password"
              autocomplete="new-password"
              formControlName="confirm"
              [attr.aria-invalid]="showConfirmError() ? 'true' : null"
              [attr.aria-describedby]="showConfirmError() ? 'reg-confirm-error' : null"
            />
            @if (showConfirmError()) {
              <span id="reg-confirm-error" class="field-error">Mật khẩu nhập lại chưa khớp</span>
            }
          </div>

          @if (errorMessage(); as message) {
            <p class="form-error" role="alert">{{ message }}</p>
          }

          <button type="submit" class="btn btn-block" [disabled]="submitting()">
            {{ submitting() ? 'Đang tạo tài khoản...' : 'Đăng ký' }}
          </button>
        </form>

        <p class="switch">
          Đã có tài khoản?
          <a routerLink="/login" [queryParams]="returnUrl() ? { returnUrl: returnUrl() } : null">Đăng nhập</a>
        </p>
      </div>
    </div>
  `,
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly returnUrl = input<string>();

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2), notBlank()]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required]],
    },
    { validators: [matchFields('password', 'confirm')] },
  );

  protected showError(name: 'name' | 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected showConfirmError(): boolean {
    const confirm = this.form.controls.confirm;
    return (confirm.touched || confirm.dirty) && (confirm.invalid || this.form.hasError('mismatch'));
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);

    const { name, email, password } = this.form.getRawValue();
    this.auth.register({ name, email, password }).subscribe({
      next: (user) => {
        this.toast.success(`Chào mừng ${user.name} đến với DoroShop!`);
        void this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.submitting.set(false);
      },
    });
  }
}
