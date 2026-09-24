import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const SITE_NAME = 'DoroShop';
/** Tiêu đề dùng khi route không khai báo title, hiện chỉ có trang chủ. */
const DEFAULT_TITLE = 'DoroShop – Shop acc uy tín';

/**
 * Route có title thì hiển thị dạng "Tên trang | DoroShop".
 * Route không có title (trang chủ) dùng tiêu đề mặc định DEFAULT_TITLE.
 */
@Injectable()
export class DoroShopTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.title.setTitle(pageTitle ? `${pageTitle} | ${SITE_NAME}` : DEFAULT_TITLE);
  }
}
