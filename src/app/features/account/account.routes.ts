import { Routes } from '@angular/router';

export const accountRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'orders' },
  {
    path: 'orders',
    title: 'Đơn hàng của tôi',
    loadComponent: () => import('./orders/orders').then((m) => m.Orders),
  },
];
