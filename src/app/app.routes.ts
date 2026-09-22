import { Routes } from '@angular/router';
import { authGuard } from './core/guards';

/**
 * Mọi màn hình đều nạp động (lazy) để gói khởi động nhẹ nhất có thể.
 * Tiêu đề trang khai báo ngay tại route và được TitleStrategy gắn hậu tố "| DoroShop".
 */
export const routes: Routes = [
  {
    path: '',
    title: 'Trang chủ',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'accounts',
    title: 'Tài khoản game',
    loadComponent: () => import('./features/accounts/account-list/account-list').then((m) => m.AccountList),
  },
  {
    path: 'accounts/:slug',
    title: 'Chi tiết tài khoản',
    loadComponent: () =>
      import('./features/accounts/account-detail/account-detail').then((m) => m.AccountDetail),
  },
  {
    path: 'cart',
    title: 'Giỏ hàng',
    loadComponent: () => import('./features/cart/cart-page/cart-page').then((m) => m.CartPage),
  },
  {
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
