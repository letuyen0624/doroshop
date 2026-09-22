import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { routes } from './app.routes';
import { DoroShopTitleStrategy } from './core/title-strategy';

// Đăng ký dữ liệu locale tiếng Việt cho ngày tháng và tiền tệ.
registerLocaleData(localeVi, 'vi');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Gắn query param và path param trực tiếp vào input của component.
      withComponentInputBinding(),
      // Chuyển trang thì cuộn lên đầu, quay lại thì giữ đúng vị trí cũ.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    { provide: LOCALE_ID, useValue: 'vi' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'VND' },
    { provide: TitleStrategy, useClass: DoroShopTitleStrategy },
  ],
};
