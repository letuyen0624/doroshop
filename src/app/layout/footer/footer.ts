import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GAMES } from '../../core/models';

/** Chân trang: giới thiệu, danh mục game, hỗ trợ và lưu ý demo. */
@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styleUrl: './footer.scss',
  template: `
    <footer class="site-footer">
      <div class="container grid">
        <section class="about">
          <img class="brand-logo" src="assets/logo.webp" alt="Logo DoroShop" width="240" height="120" />
          <p class="slogan">Tìm acc không khó, đã có <strong>Doro</strong>! <span class="heart" aria-hidden="true">♥</span></p>
          <p>
            Chợ acc game demo với Liên Quân, Liên Minh Huyền Thoại, Free Fire, Valorant,
            Genshin Impact và nhiều game khác. Đây là dự án học tập, toàn bộ tài khoản đều là dữ liệu
            hư cấu, không phải hàng thật.
          </p>
          <p class="disclaimer">
            ⚠️ Không dùng để giao dịch thật. Mua bán tài khoản game thường vi phạm điều khoản dịch vụ
            của nhà phát hành.
          </p>
        </section>

        <nav aria-labelledby="footer-games">
          <h3 id="footer-games">Danh mục game</h3>
          <ul class="plain">
            @for (game of games; track game.id) {
              <li>
                <a [routerLink]="['/accounts']" [queryParams]="{ games: game.id }">
                  {{ game.name }}
                </a>
              </li>
            }
          </ul>
        </nav>

        <nav aria-labelledby="footer-support">
          <h3 id="footer-support">Hỗ trợ</h3>
          <ul class="plain">
            <li><a routerLink="/accounts">Tất cả tài khoản</a></li>
            <li><a routerLink="/cart">Giỏ hàng</a></li>
            <li><a routerLink="/account/orders">Tra cứu đơn hàng</a></li>
            <li><a routerLink="/login">Đăng nhập</a></li>
          </ul>
        </nav>

        <section aria-labelledby="footer-policy">
          <h3 id="footer-policy">Chính sách demo</h3>
          <ul class="plain policy">
            <li>Bàn giao ngay sau khi thanh toán (mô phỏng)</li>
            <li>Bảo hành đổi acc 7 ngày nếu lỗi</li>
            <li>Thanh toán COD, chuyển khoản hoặc ví điện tử</li>
            <li>Hỗ trợ khách hàng 8h - 22h mỗi ngày</li>
          </ul>
        </section>
      </div>

      <div class="container bottom">
        <p>© {{ year }} DoroShop. Dự án demo học tập, không giao dịch thật.</p>
        <p class="note">Dữ liệu được lưu trong trình duyệt của bạn, không gửi tới máy chủ nào.</p>
      </div>
    </footer>
  `,
})
export class Footer {
  protected readonly games = GAMES;
  protected readonly year = new Date().getFullYear();
}
