import { Routes } from '@angular/router';
import { authGuard } from './core/guards';

/**
 * Mọi màn hình đều nạp động (lazy) để gói khởi động nhẹ nhất có thể.
 * Tiêu đề trang khai báo ngay tại route và được TitleStrategy gắn hậu tố "| DoroShop" (riêng trang chủ dùng tiêu đề mặc định).
 */
export const routes: Routes = [
  {
    path: '',
    // Không khai báo title: trang chủ dùng tiêu đề mặc định trong TitleStrategy.
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'accounts',
    title: 'Tài khoản game',
    loadComponent: () => import('./features/accounts/account-list/account-list').then((m) => m.AccountList),
  },
  {
    // Trang "Vào kho acc" của thẻ gateway Liên Quân Mobile ở trang chủ: 4 thẻ cổng vào theo tầng giá.
    path: 'kho-acc-lien-quan',
    title: 'Kho acc Liên Quân Mobile',
    loadComponent: () =>
      import('./features/kho-acc-lien-quan/kho-acc-lien-quan').then((m) => m.KhoAccLienQuan),
  },
  {
    path: 'accounts/:slug',
    title: 'Chi tiết tài khoản',
    loadComponent: () =>
      import('./features/accounts/account-detail/account-detail').then((m) => m.AccountDetail),
  },
  {
    // Mua một tài khoản: /checkout?account=<slug>
    path: 'checkout',
    title: 'Thanh toán',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'order-success/:id',
    title: 'Đặt hàng thành công',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/checkout/order-success/order-success').then((m) => m.OrderSuccess),
  },
  {
    path: 'login',
    title: 'Đăng nhập',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: 'Đăng ký',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadChildren: () => import('./features/account/account.routes').then((m) => m.accountRoutes),
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: '**',
    title: 'Không tìm thấy trang',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
