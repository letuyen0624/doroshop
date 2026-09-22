import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards';

/** Toàn bộ khu vực quản trị nằm sau adminGuard và được nạp động. */
export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    loadComponent: () => import('./admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Quản trị - Tổng quan',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'accounts',
        title: 'Quản trị - Tài khoản game',
        loadComponent: () => import('./accounts/admin-accounts').then((m) => m.AdminAccounts),
      },
      {
        path: 'accounts/new',
        title: 'Quản trị - Thêm tài khoản',
        loadComponent: () => import('./accounts/account-form').then((m) => m.AccountForm),
      },
      {
        path: 'accounts/:id/edit',
        title: 'Quản trị - Sửa tài khoản',
        loadComponent: () => import('./accounts/account-form').then((m) => m.AccountForm),
      },
      {
        path: 'orders',
        title: 'Quản trị - Đơn hàng',
        loadComponent: () => import('./orders/admin-orders').then((m) => m.AdminOrders),
      },
    ],
  },
];
