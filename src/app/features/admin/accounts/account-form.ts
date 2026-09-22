import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  AccountStatus,
  GAMES,
  GameAccount,
  GameAccountDraft,
  GameId,
  LOGIN_STATUS_LABELS,
  LoginStatus,
} from '../../../core/models';
import { GameAccountService, ToastService } from '../../../core/services';
import { notBlank } from '../../../shared/validators';

/** Giá cũ nếu có phải lớn hơn giá bán, nếu không thì không phải khuyến mãi. */
function oldPriceValidator(group: AbstractControl): ValidationErrors | null {
  const price = group.get('price')?.value as number | null;
  const oldPrice = group.get('oldPrice')?.value as number | null;
  if (oldPrice === null || oldPrice === undefined || price === null || price === undefined) {
    return null;
  }
  return oldPrice > price ? null : { oldPriceTooLow: true };
}

/** Yêu cầu ít nhất một dòng thông tin thêm hợp lệ (đủ cả key lẫn value). */
function extraInfoValidator(control: AbstractControl): ValidationErrors | null {
  const rows = (control.value as { key: string; value: string }[]) ?? [];
  const valid = rows.some((row) => row.key.trim().length > 0 && row.value.trim().length > 0);
  return valid ? null : { extraInfoEmpty: true };
}

/** Form thêm và sửa tài khoản game, dùng chung một component (có :id thì là chế độ sửa). */
@Component({
  selector: 'app-account-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './account-form.scss',
  templateUrl: './account-form.html',
})
export class AccountForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly accountService = inject(GameAccountService);
  private readonly toast = inject(ToastService);

  /** Có giá trị khi route là /admin/accounts/:id/edit. */
  readonly id = input<string>();

  protected readonly games = GAMES;
  protected readonly loginStatusOptions: readonly { value: LoginStatus; label: string }[] = [
    { value: 'chua_lien_ket', label: LOGIN_STATUS_LABELS.chua_lien_ket },
    { value: 'da_lien_ket_sms', label: LOGIN_STATUS_LABELS.da_lien_ket_sms },
    { value: 'da_lien_ket_fb', label: LOGIN_STATUS_LABELS.da_lien_ket_fb },
  ];

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly editing = computed<GameAccount | null>(() => {
    const id = this.id();
    return id ? (this.accountService.getById(id) ?? null) : null;
  });
  protected readonly notFound = computed(() => !!this.id() && this.editing() === null);

  private readonly extraInfoRow = () =>
    this.fb.nonNullable.group({
      key: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]),
      value: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(160)]),
    });

  protected readonly form = this.fb.group(
    {
      title: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6), Validators.maxLength(150), notBlank()]),
      game: this.fb.nonNullable.control<GameId>('lien-quan-mobile', [Validators.required]),
      server: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60), notBlank()]),
      rank: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(40), notBlank()]),
      characterCount: this.fb.control<number | null>(0, [Validators.required, Validators.min(0), Validators.max(5000)]),
      skinCount: this.fb.control<number | null>(0, [Validators.required, Validators.min(0), Validators.max(5000)]),
      loginStatus: this.fb.nonNullable.control<LoginStatus>('chua_lien_ket', [Validators.required]),
      status: this.fb.nonNullable.control<AccountStatus>('con_hang', [Validators.required]),
      price: this.fb.control<number | null>(null, [Validators.required, Validators.min(1000), Validators.max(1_000_000_000)]),
      oldPrice: this.fb.control<number | null>(null, [Validators.min(1000), Validators.max(1_000_000_000)]),
      rating: this.fb.control<number | null>(4.5, [Validators.required, Validators.min(0), Validators.max(5)]),
      reviewCount: this.fb.control<number | null>(0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]),
      description: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(20), Validators.maxLength(1500), notBlank()]),
      extraInfo: this.fb.nonNullable.array([this.extraInfoRow()], [extraInfoValidator]),
      tagsText: this.fb.nonNullable.control(''),
    },
    { validators: [oldPriceValidator] },
  );

  constructor() {
    // Vào chế độ sửa thì nạp dữ liệu tài khoản vào form đúng một lần.
    effect(() => {
      const account = this.editing();
      if (!account) {
        return;
      }
      this.extraInfoArray.clear();
      const entries = Object.entries(account.extraInfo);
      for (const [key, value] of entries.length > 0 ? entries : [['', '']]) {
        this.extraInfoArray.push(this.fb.nonNullable.group({ key: [key], value: [value] }));
      }
      this.form.patchValue({
        title: account.title,
        game: account.game,
        server: account.server,
        rank: account.rank,
        characterCount: account.characterCount,
        skinCount: account.skinCount,
        loginStatus: account.loginStatus,
        status: account.status,
        price: account.price,
        oldPrice: account.oldPrice ?? null,
        rating: account.rating,
        reviewCount: account.reviewCount,
        description: account.description,
        tagsText: account.tags.join(', '),
      });
    });
  }

  protected get extraInfoArray() {
    return this.form.controls.extraInfo;
  }

  protected invalid(name: keyof Omit<AccountForm['form']['controls'], 'extraInfo'>): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected showOldPriceError(): boolean {
    const oldPrice = this.form.controls.oldPrice;
    return (oldPrice.touched || oldPrice.dirty) && this.form.hasError('oldPriceTooLow');
  }

  protected showExtraInfoError(): boolean {
    return this.extraInfoArray.invalid && this.extraInfoArray.touched;
  }

  protected addExtraInfoRow(): void {
    this.extraInfoArray.push(this.extraInfoRow());
  }

  protected removeExtraInfoRow(index: number): void {
    if (this.extraInfoArray.length > 1) {
      this.extraInfoArray.removeAt(index);
    } else {
      this.extraInfoArray.at(0).reset({ key: '', value: '' });
    }
    this.extraInfoArray.markAsTouched();
  }

  protected submit(): void {
    this.extraInfoArray.markAsTouched();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Vui lòng sửa các trường đang báo lỗi trước khi lưu.');
      return;
    }

    const value = this.form.getRawValue();
    const extraInfo: Record<string, string> = {};
    for (const row of value.extraInfo) {
      const key = row.key.trim();
      const val = row.value.trim();
      if (key && val) {
        extraInfo[key] = val;
      }
    }

    const draft: GameAccountDraft = {
      title: value.title.trim(),
      game: value.game,
      server: value.server.trim(),
      rank: value.rank.trim(),
      characterCount: Number(value.characterCount),
      skinCount: Number(value.skinCount),
      loginStatus: value.loginStatus,
      status: value.status,
      price: Number(value.price),
      oldPrice: value.oldPrice ? Number(value.oldPrice) : undefined,
      rating: Number(value.rating),
      reviewCount: Number(value.reviewCount),
      description: value.description.trim(),
      extraInfo,
      tags: value.tagsText
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag, index, all) => tag.length > 0 && all.indexOf(tag) === index),
    };

    this.saving.set(true);
    this.errorMessage.set(null);

    const current = this.editing();
    const request = current
      ? this.accountService.update(current.id, { ...draft, slug: current.slug })
      : this.accountService.create(draft);

    request.subscribe({
      next: (account) => {
        this.toast.success(current ? `Đã cập nhật "${account.title}"` : `Đã thêm "${account.title}"`);
        void this.router.navigate(['/admin/accounts']);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.saving.set(false);
      },
    });
  }
}
