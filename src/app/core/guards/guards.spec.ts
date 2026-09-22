import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { adminGuard } from './admin.guard';
import { authGuard } from './auth.guard';

const route = {} as ActivatedRouteSnapshot;
const stateFor = (url: string): RouterStateSnapshot => ({ url }) as RouterStateSnapshot;

describe('guards', () => {
  let auth: AuthService;
  let router: Router;

  const run = (guard: typeof authGuard, url: string): boolean | UrlTree =>
    TestBed.runInInjectionContext(() => guard(route, stateFor(url))) as boolean | UrlTree;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('cho qua khi đã đăng nhập', async () => {
      await firstValueFrom(auth.login({ email: 'demo@doroshop.vn', password: 'demo123' }));

      expect(run(authGuard, '/checkout')).toBe(true);
    });

    it('chuyển về /login kèm returnUrl khi chưa đăng nhập', () => {
      const result = run(authGuard, '/checkout?ref=cart');

      expect(result).toBeInstanceOf(UrlTree);
      const tree = result as UrlTree;
      expect(router.serializeUrl(tree)).toBe('/login?returnUrl=%2Fcheckout%3Fref%3Dcart');
    });
  });

  describe('adminGuard', () => {
    it('cho admin đi qua', async () => {
      await firstValueFrom(auth.login({ email: 'admin@doroshop.vn', password: 'admin123' }));

      expect(run(adminGuard, '/admin')).toBe(true);
    });

    it('khách hàng thường bị đưa về trang chủ', async () => {
      await firstValueFrom(auth.login({ email: 'demo@doroshop.vn', password: 'demo123' }));

      const result = run(adminGuard, '/admin');
      expect(result).toBeInstanceOf(UrlTree);
      expect(router.serializeUrl(result as UrlTree)).toBe('/');
    });

    it('người chưa đăng nhập bị đưa về /login kèm returnUrl', () => {
      const result = run(adminGuard, '/admin/orders');

      expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fadmin%2Forders');
    });
  });
});
