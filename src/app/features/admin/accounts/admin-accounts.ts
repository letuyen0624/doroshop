import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { GameAccount, gameName } from '../../../core/models';
import { GameAccountService, ToastService, normalizeText } from '../../../core/services';
import { ConfirmDialog } from '../../../shared/components';
import { VndPipe } from '../../../shared/pipes';

/** Bảng quản lý tin rao: tìm kiếm, sửa, xóa có xác nhận. */
@Component({
  selector: 'app-admin-accounts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, VndPipe, ConfirmDialog],
  styleUrl: './admin-accounts.scss',
  templateUrl: './admin-accounts.html',
})
export class AdminAccounts {
  private readonly accountService = inject(GameAccountService);
  private readonly toast = inject(ToastService);

  protected readonly gameName = gameName;
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  private readonly keyword = toSignal(
    this.searchControl.valueChanges.pipe(
      debounceTime(200),
      map((value) => normalizeText(value)),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  protected readonly accounts = computed(() => {
    const keyword = this.keyword();
    const all = [...this.accountService.all()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (!keyword) {
      return all;
    }
    return all.filter((account) =>
      normalizeText(`${account.title} ${account.id}`).includes(keyword),
    );
  });

  protected readonly pendingDelete = signal<GameAccount | null>(null);
  protected readonly deleting = signal(false);

  protected askDelete(account: GameAccount): void {
    this.pendingDelete.set(account);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected confirmDelete(): void {
    const account = this.pendingDelete();
    if (!account || this.deleting()) {
      return;
    }
    this.deleting.set(true);
    this.accountService.remove(account.id).subscribe({
      next: () => {
        this.toast.success(`Đã xóa tin "${account.title}"`);
        this.pendingDelete.set(null);
        this.deleting.set(false);
      },
      error: () => {
        this.toast.error('Không xóa được tin, vui lòng thử lại');
        this.deleting.set(false);
      },
    });
  }
}
