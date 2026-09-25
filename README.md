![Logo DoroShop](src/assets/logo.webp)

# DoroShop - Chợ acc game demo

> ⚠️ **Đây là dự án demo cho mục đích học tập.** Toàn bộ tài khoản, đơn hàng và thông tin bàn giao
> đều là **dữ liệu hư cấu**, không có tài khoản game thật nào được mua bán. Mua bán tài khoản game
> thật thường **vi phạm điều khoản dịch vụ** của nhà phát hành, nên trang này **không phục vụ giao
> dịch thật** - không có backend, không có cổng thanh toán, không thu thập thông tin thật.

DoroShop là một "chợ" mua bán tài khoản game phong cách kawaii: Liên Quân Mobile, Liên Minh Huyền
Thoại, Free Fire, Valorant, Genshin Impact và nhiều game khác. Mọi dữ liệu nằm trong
`localStorage` của trình duyệt.

Công nghệ: Angular 22 (standalone components, signals, control flow `@if/@for/@switch`, `inject()`),
Router lazy loading + functional guards + `withComponentInputBinding()`, Reactive Forms, SCSS + CSS
variables, font Baloo 2/Quicksand từ Google Fonts, TypeScript `strict`. Không dùng Angular Material/
Bootstrap, không thêm thư viện runtime ngoài Angular và RxJS.

## Cách chạy

Cần Node.js 20 trở lên.

```bash
npm install
npm start
```

Mở http://localhost:4200.

| Lệnh | Tác dụng |
| --- | --- |
| `npm start` | Chạy dev server |
| `npm run build` | Build production vào `dist/` |
| `npm test -- --watch=false` | Unit test (Vitest qua Angular CLI) |
| `npx playwright install chromium` | Tải trình duyệt cho E2E (chạy một lần) |
| `npm run e2e` | Test E2E bằng Playwright, tự bật/tắt dev server ở cổng 4310 |

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị | `admin@doroshop.vn` | `admin123` |
| Khách hàng | `demo@doroshop.vn` | `demo123` |

Mã giảm giá (nhập ngay ở trang thanh toán): `DORO10` (giảm 10%), `SUKIEN50K` (giảm cố định 50.000 ₫, không vượt quá giá tài khoản).

## Luồng mua hàng

Chọn acc → **Mua ngay** → đăng nhập nếu chưa có → thanh toán (`/checkout?account=<slug>`) → nhận thông tin bàn giao demo.

Mỗi lần chỉ mua **một** tin rao, thanh toán ngay: mỗi acc cần bàn giao thông tin đăng nhập riêng sau khi thanh toán nên không gộp nhiều acc vào một đơn.

Muốn chơi lại từ đầu: xóa dữ liệu site trong DevTools (Application > Local Storage) rồi tải lại trang.

## Cấu trúc thư mục

```
src/app/
  core/
    models/      GameAccount, User, Order, Coupon, DeliveredCredential...
    services/    Storage, GameAccount, Auth, Order, Coupon (mã giảm giá), Toast, Theme
    guards/      authGuard, adminGuard
    data/        dữ liệu mẫu (27 tài khoản thuộc 5 game, 6 đơn hàng)
  shared/        component dùng chung (AccountCard, AccountArt, GameBadge...), pipe vnd, validators
  layout/        header, footer
  features/      home, accounts, checkout, auth, account, admin, not-found
e2e/             test Playwright
```

## Những gì là giả lập

- **Backend**: `localStorage` (có version key, có try/catch, có bộ nhớ dự phòng khi bị chặn). Mỗi
  service trả `Observable` có độ trễ 200-400 ms.
- **Mật khẩu**: băm SHA-256 bằng Web Crypto trước khi lưu. **Đây chỉ là demo, không an toàn như hệ
  thống thật**: không có muối, không giới hạn số lần thử, dữ liệu nằm ngay trên trình duyệt, và
  guard chỉ chặn ở giao diện.
- **Thanh toán**: COD, chuyển khoản (thông tin tài khoản giả) và ví DoroPay đều chỉ là mô phỏng,
  không có cổng thanh toán, không thu thập số thẻ.
- **Thông tin bàn giao (`DeliveredCredential`)**: tài khoản/mật khẩu demo được **sinh tự động dựng
  sẵn** ngay khi tạo đơn (dạng `doro_xxxxx` / `Demo@xxxxx2026`), không liên quan gì tới tài khoản
  game thật. Mỗi màn hình hiển thị đều ghi rõ đây là dữ liệu demo.
- **Tài khoản game**: thương hiệu game có thật được nhắc tên để mô phỏng một chợ acc thực tế, nhưng
  toàn bộ 27 tin rao là hư cấu (rank, server, số liệu...). Ảnh minh họa vẽ bằng SVG/gradient theo
  từng game nên chạy được khi offline, không dùng ảnh chụp màn hình thật.
- **Đơn hàng mẫu**: 6 đơn của tài khoản demo được nạp lần đầu (khớp với 6 tin đã ở trạng thái "đã
  bán" trong dữ liệu mẫu) để trang admin và lịch sử đơn có dữ liệu xem ngay.
- **Ràng buộc khi mua**: mỗi tài khoản chỉ có một bản duy nhất, không thể mua trùng và không thể mua tài khoản đã bán (kiểm tra cả ở trang checkout lẫn trong `OrderService.create`). Mỗi đơn (`Order`) chỉ chứa đúng một tài khoản (`order.account`), không có mảng nhiều dòng hàng.

## Quyết định thiết kế

- Bộ lọc danh sách tài khoản lưu hoàn toàn trên query params (`search, games, ranks, minPrice,
  maxPrice, inStock, sort, page`) nên chia sẻ link được. Lọc theo game và rank cho phép chọn nhiều.
- Tìm kiếm không phân biệt dấu tiếng Việt ("lien quan" ra "Liên Quân").
- `OrderService.create` nhận `accountId` + mã giảm giá rồi tự lấy giá và tự tính lại tiền, client không quyết định số tiền. Đơn hàng lưu snapshot tiêu đề, game và giá tại thời điểm mua; tài khoản liên quan bị đổi sang
  `da_ban` ngay khi đặt hàng.
- Guard `authGuard`/`adminGuard` chuyển về `/login?returnUrl=...` và quay lại đúng trang sau khi
  đăng nhập (chỉ chấp nhận đường dẫn nội bộ): chưa đăng nhập mà bấm "Mua ngay" thì sau khi đăng nhập quay lại đúng `/checkout?account=...` với acc đã chọn.
- Phiên bản dữ liệu `localStorage` là `v3`; khi khởi động app tự xóa dữ liệu của các bản cũ.
- Giao diện sáng/tối mặc định theo hệ thống, nhớ lựa chọn; ở chế độ tối vẫn giữ tông hồng-tím nhưng
  đổi sang nền tối để không chói mắt; tôn trọng `prefers-reduced-motion`.
- Mọi màu hồng/tím của trang xuất phát từ **hai biến gốc** ở đầu `src/styles.scss`, lấy từ logo: `--color-primary #F5A6C7` (hồng, tóc Doro) và `--color-secondary #AE91C7` (tím, trái tim). Các sắc đậm/nhạt (`--color-primary-strong #C2477A`, `--color-primary-ink #9B436C`, `--color-secondary-strong #8965A6`, `--color-secondary-ink #745190`, các sắc `-soft`/`-light`) được suy ra bằng cách đổi độ sáng trong OKLCH, giữ nguyên hue. Nút hành động chính dùng **đúng màu hồng gốc của Doro** `--btn-primary` (= `--color-primary #F5A6C7`, không gradient) với chữ tối `--on-primary #361926` (tương phản 8.43:1); `--color-primary-strong #C2477A` chỉ còn dùng cho icon, viền và điểm nhấn. Chữ hồng/tím cỡ nhỏ >= 5.1:1 (WCAG AA). Muốn đổi màu thương hiệu chỉ cần sửa các biến này.
- Form thêm/sửa tin rao dùng `FormArray` để thêm/xóa từng dòng `extraInfo` (thông tin tự do) trực
  tiếp trên giao diện, không phải nhập dạng văn bản thô.

## Thay `localStorage` bằng API thật

Component chỉ làm việc với các service trả `Observable`, nên chỉ cần đổi thân hàm trong
`core/services`:

1. Thêm `provideHttpClient()` vào `app.config.ts`.
2. `GameAccountService`: thay `fake(...)` bằng `this.http.get<GameAccount[]>('/api/accounts', {
   params })`, `getBySlug` -> `GET /api/accounts/:slug`, `create/update/remove` ->
   `POST/PUT/DELETE`. Việc lọc, sắp xếp, phân trang (`account-query.ts`) chuyển sang phía server,
   giữ nguyên kiểu `AccountQuery` và `AccountPage` làm hợp đồng.
3. `AuthService`: `login/register` gọi API và nhận token (nên dùng cookie `HttpOnly`); bỏ băm mật
   khẩu ở client; thêm HTTP interceptor gắn token.
4. `OrderService.create`: để server kiểm tra trạng thái tài khoản, tính lại tiền, và **sinh thông
   tin bàn giao thật** (tài khoản game thật, đã đổi mật khẩu) qua một quy trình bàn giao an toàn -
   không bao giờ để client tự sinh `demoUsername`/`demoPassword` như hiện tại.
5. Guard vẫn giữ để điều hướng, nhưng phân quyền thật phải nằm ở server.

## Mở rộng tiếp

Backend thật (thay thân các hàm trong `core/services`, giữ nguyên kiểu `Observable`), cổng thanh
toán thật (VNPay, MoMo, Stripe) **chỉ dùng cho hàng hóa/dịch vụ hợp lệ** (bản demo này không nên
triển khai thanh toán thật cho việc mua bán acc game), hệ thống ký gửi và xác minh acc trước khi
đăng bán, chat trực tiếp giữa người mua/bán, đánh giá sau giao dịch, SSR để tốt cho SEO, và triển
khai lên Firebase Hosting, Netlify hoặc Vercel.
