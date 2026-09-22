import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Khung khu vực quản trị: thanh điều hướng con và vùng nội dung. */
@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styleUrl: './admin-layout.scss',
  template: `
    <div class="container page admin">
      <nav class="admin-nav card" aria-label="Điều hướng quản trị">
        <h2 class="admin-title">Quản trị</h2>
        <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Tổng quan</a>
        <a routerLink="/admin/accounts" routerLinkActive="active">Tài khoản game</a>
        <a routerLink="/admin/orders" routerLinkActive="active">Đơn hàng</a>
      </nav>
      <div class="admin-content">
        <router-outlet />
      </div>
    </div>
  `,
})
export class AdminLayout {}
