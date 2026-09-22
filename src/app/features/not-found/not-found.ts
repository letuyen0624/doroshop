import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Trang 404 cho mọi đường dẫn không khớp route nào. */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styleUrl: './not-found.scss',
  template: `
    <div class="page container not-found">
      <p class="code" aria-hidden="true">404</p>
      <h1>Không tìm thấy trang</h1>
      <p class="lead">
        Đường dẫn bạn vừa mở không tồn tại hoặc đã được chuyển đi nơi khác. Bạn thử quay về trang chủ
        hoặc xem toàn bộ tài khoản game nhé.
      </p>
      <div class="row actions">
        <a class="btn" routerLink="/">Về trang chủ</a>
        <a class="btn btn-ghost" routerLink="/accounts">Xem tất cả tài khoản</a>
      </div>
    </div>
  `,
})
export class NotFound {}
