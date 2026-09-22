import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/** Chặn các trang cần đăng nhập, ghi nhớ đường dẫn để quay lại sau khi đăng nhập. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (auth.isLoggedIn()) {
    return true;
  }

  toast.info('Vui lòng đăng nhập để tiếp tục');
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
