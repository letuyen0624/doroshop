import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

/** Hộp thoại xác nhận cho các thao tác không hoàn tác được, ví dụ xóa sản phẩm. */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './confirm-dialog.scss',
  template: `
    @if (open()) {
      <div class="backdrop" (click)="cancelled.emit()">
        <div
          class="dialog card"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="messageId"
          (click)="$event.stopPropagation()"
          (keydown.escape)="cancelled.emit()"
        >
          <h2 [id]="titleId">{{ title() }}</h2>
          <p [id]="messageId">{{ message() }}</p>
          <div class="actions">
            <button type="button" class="btn btn-ghost" (click)="cancelled.emit()">
              {{ cancelLabel() }}
            </button>
            <button #confirmButton type="button" class="btn btn-danger" (click)="confirmed.emit()">
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  readonly open = input.required<boolean>();
  readonly title = input<string>('Xác nhận');
  readonly message = input<string>('Bạn có chắc chắn muốn tiếp tục?');
  readonly confirmLabel = input<string>('Xác nhận');
  readonly cancelLabel = input<string>('Hủy');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');

  protected readonly titleId = `confirm-title-${Math.random().toString(36).slice(2, 8)}`;
  protected readonly messageId = `confirm-message-${Math.random().toString(36).slice(2, 8)}`;

  constructor() {
    // Mở hộp thoại thì đưa focus vào nút xác nhận để dùng được bằng bàn phím.
    effect(() => {
      if (this.open()) {
        queueMicrotask(() => this.confirmButton()?.nativeElement.focus());
      }
    });
  }
}
