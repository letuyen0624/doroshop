import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/** Chỉ cho tài khoản có vai trò admin vào khu vực quản trị. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (!auth.isLoggedIn()) {
    toast.info('Vui lòng đăng nhập bằng tài khoản quản trị');
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  if (auth.isAdmin()) {
    return true;
  }

  toast.error('Bạn không có quyền truy cập khu vực quản trị');
  return router.createUrlTree(['/']);
};
