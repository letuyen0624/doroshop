import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';
import { ThemeService } from './core/services';
import { ToastContainer } from './shared/components';

/** Khung ứng dụng: header cố định, vùng nội dung và footer. */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Footer, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Khởi tạo sớm để thuộc tính data-theme được gắn ngay từ lần vẽ đầu tiên.
  private readonly theme = inject(ThemeService);

  protected readonly currentTheme = this.theme.resolved;
}
