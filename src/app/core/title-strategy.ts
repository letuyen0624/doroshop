import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const SITE_NAME = 'DoroShop';
const TAGLINE = 'Chợ acc game demo';

/** Gắn hậu tố tên trang vào tiêu đề của mọi trang. */
@Injectable()
export class DoroShopTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.title.setTitle(pageTitle ? `${pageTitle} | ${SITE_NAME}` : `${SITE_NAME} - ${TAGLINE}`);
  }
}
