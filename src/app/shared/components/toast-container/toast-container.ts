import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services';

/** Khu vực hiển thị thông báo nổi, đặt một lần ở khung ứng dụng. */
@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './toast-container.scss',
  template: `
    <div class="toast-stack" role="status" aria-live="polite" aria-atomic="false">
      @for (toast of toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.kind">
          <span class="icon" aria-hidden="true">
            @switch (toast.kind) {
              @case ('success') { ✓ }
              @case ('error') { ! }
              @default { i }
            }
          </span>
          <span class="message">{{ toast.message }}</span>
          <button type="button" class="close" aria-label="Đóng thông báo" (click)="dismiss(toast.id)">
            ×
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  private readonly toastService = inject(ToastService);
  protected readonly toasts = this.toastService.toasts;

  protected dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
