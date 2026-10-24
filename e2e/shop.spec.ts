import { Page, expect, test } from '@playwright/test';

const login = async (page: Page, email: string, password: string, returnTo = '/'): Promise<void> => {
  await page.goto(`/login?returnUrl=${encodeURIComponent(returnTo)}`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
};

const accountCards = (page: Page) => page.locator('app-account-card');

test.describe('duyệt và lọc tài khoản', () => {
  test('trang chủ hiện banner, khối tin theo game và thẻ gateway Liên Quân', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('DoroShop – Shop acc uy tín');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tìm acc không khó, đã có Doro');

    // Các game khác: mỗi game đang có tin còn hàng render một khối riêng, dẫn tới đúng bộ lọc của game đó.
    const lmht = page.getByRole('heading', { name: 'Liên Minh Huyền Thoại', exact: true }).locator('..');
    await expect(lmht.getByRole('link', { name: 'Xem tất cả acc Liên Minh Huyền Thoại →' })).toHaveAttribute(
      'href',
      '/accounts?games=lien-minh-huyen-thoai',
    );
    // "Khác" chưa có tin rao nào nên không hiện khối rỗng.
    await expect(page.getByRole('heading', { name: 'Khác', exact: true })).toHaveCount(0);
    // Không còn section "Tin nổi bật" / "Đang giảm giá".
    await expect(page.getByRole('heading', { name: 'Tin nổi bật' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Đang giảm giá' })).toHaveCount(0);

    // Thẻ gateway "Acc Liên Quân" đứng đầu, rồi 2 thẻ dịch vụ. "Vào kho acc" chuyển sang trang
    // "Kho acc Liên Quân Mobile" (4 thẻ theo tầng giá).
    const lienQuanCards = page.locator('.lien-quan-grid app-account-card');
    await expect(lienQuanCards).toHaveCount(3);
    await expect(lienQuanCards.locator('.name')).toHaveText(['Acc Liên Quân', 'Cày thuê rank', 'Nạp game']);
    await expect(lienQuanCards.first().getByRole('link', { name: 'VÀO KHO ACC' })).toHaveAttribute(
      'href',
      '/kho-acc-lien-quan',
    );

    // 4 game thật còn lại (tối đa 4 tin mỗi game) + 3 thẻ Liên Quân (gateway + cày thuê + nạp game)
    await expect(accountCards(page).first()).toBeVisible();
    await expect(accountCards(page)).toHaveCount(19);
  });

  test('trang "Kho acc Liên Quân Mobile" hiện 4 thẻ tầng giá dẫn tới đúng danh sách đã lọc', async ({
    page,
  }) => {
    await page.goto('/kho-acc-lien-quan');
    await expect(page).toHaveTitle('Kho acc Liên Quân Mobile | DoroShop');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kho acc Liên Quân Mobile');

    const tiers = page.locator('.tier-card');
    await expect(tiers).toHaveCount(4);
    await expect(tiers.locator('.name')).toHaveText([
      'Acc Giá Rẻ',
      'Acc Phổ Thông',
      'Acc Tầm Trung',
      'Acc Siêu Phẩm',
    ]);
    await expect(tiers.locator('.meta')).toHaveText(['Còn 2 acc', 'Còn 1 acc', 'Còn 2 acc', 'Hết hàng']);

    await expect(tiers.nth(0).locator('.cta')).toHaveAttribute(
      'href',
      '/accounts?games=lien-quan-mobile&maxPrice=299999&inStock=1',
    );
    await expect(tiers.nth(1).locator('.cta')).toHaveAttribute(
      'href',
      '/accounts?games=lien-quan-mobile&minPrice=300000&maxPrice=999999&inStock=1',
    );
    await expect(tiers.nth(2).locator('.cta')).toHaveAttribute(
      'href',
      '/accounts?games=lien-quan-mobile&minPrice=1000000&maxPrice=5000000&inStock=1',
    );
    await expect(tiers.nth(3).locator('.cta')).toHaveAttribute(
      'href',
      '/accounts?games=lien-quan-mobile&minPrice=5000001&inStock=1',
    );

    // Số trên thẻ khớp số kết quả ở danh sách mở ra.
    await tiers.nth(0).locator('.cta').click();
    await expect(page).toHaveURL(/maxPrice=299999/);
    await expect(page.getByRole('status').filter({ hasText: 'Có 2 tài khoản phù hợp' })).toBeVisible();
  });

  test('trang chủ không còn thanh danh mục game phụ dưới header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#main-nav')).toHaveCount(0);
    // Nút "Xem tất cả acc" ở hero vẫn là lối vào xem toàn bộ tin, không lọc game.
    await expect(page.getByRole('link', { name: 'Xem tất cả acc', exact: true })).toHaveAttribute(
      'href',
      '/accounts',
    );
  });

  test('tìm kiếm, lọc, sắp xếp, phân trang và đồng bộ URL', async ({ page }) => {
    await page.goto('/accounts');
    await expect(accountCards(page)).toHaveCount(9);
    await expect(page.getByRole('status').filter({ hasText: 'Có 27 tài khoản phù hợp' })).toBeVisible();

    // Phân trang: sang trang 2 và giữ trên URL
    await page.getByRole('button', { name: 'Trang 2' }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(accountCards(page)).toHaveCount(9);

    // Tìm kiếm từ ô tìm kiếm ở header (bộ lọc trong trang không còn ô này), reset về trang 1
    await page.locator('#header-search').fill('genshin');
    await page.getByRole('button', { name: 'Tìm kiếm' }).click();
    await expect(page).toHaveURL(/search=genshin/);
    await expect(page).not.toHaveURL(/page=2/);
    await expect(accountCards(page)).toHaveCount(5);

    // Lọc theo game vẫn hoạt động qua link sâu (không còn ô chọn game trong bộ lọc trang)
    await page.goto('/accounts?games=valorant');
    await expect(accountCards(page)).toHaveCount(5);

    // Lọc thêm theo rank
    await page.getByRole('group', { name: 'Rank' }).getByLabel('Vàng').check();
    await expect(page).toHaveURL(/ranks=V/);
    await expect(accountCards(page)).toHaveCount(1);

    // Bỏ lọc rank, chỉ hiện còn hàng
    await page.getByRole('group', { name: 'Rank' }).getByLabel('Vàng').uncheck();
    await page.getByLabel('Chỉ hiện còn hàng').check();
    await expect(page).toHaveURL(/inStock=1/);
    await expect(accountCards(page)).toHaveCount(4);

    // Sắp xếp theo giá giảm dần: tin đắt nhất của Valorant lên đầu
    await page.getByLabel('Sắp xếp').selectOption('price-desc');
    await expect(page).toHaveURL(/sort=price-desc/);
    await expect(accountCards(page).first()).toContainText('Radiant');

    // Tải lại trang vẫn giữ nguyên bộ lọc từ URL
    await page.reload();
    await expect(page.getByLabel('Sắp xếp')).toHaveValue('price-desc');
    await expect(accountCards(page)).toHaveCount(4);
  });

  test('khoảng giá và trạng thái không có kết quả', async ({ page }) => {
    await page.goto('/accounts?minPrice=1000000&maxPrice=2000000');
    await expect(accountCards(page).first()).toBeVisible();
    const prices = (await accountCards(page).locator('.price').allTextContents()).map((text) =>
      Number(text.replace(/\D/g, '')),
    );
    expect(prices.length).toBeGreaterThan(0);
    for (const price of prices) {
      expect(price).toBeGreaterThanOrEqual(1_000_000);
      expect(price).toBeLessThanOrEqual(2_000_000);
    }

    await page.goto('/accounts?search=khongtontaixyz');
    await expect(page.getByRole('heading', { name: 'Không tìm thấy tài khoản phù hợp' })).toBeVisible();
    await page.getByRole('button', { name: 'Xóa toàn bộ bộ lọc' }).click();
    await expect(accountCards(page)).toHaveCount(9);
  });

  test('chi tiết tài khoản: giá, thông tin thêm, và tin liên quan', async ({ page }) => {
    await page.goto('/accounts/acc-lien-quan-full-tuong-cao-thu');
    await expect(page).toHaveTitle('Chi tiết tài khoản | DoroShop');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Acc Liên Quân full tướng - Rank Cao Thủ');
    await expect(page.locator('.price').first()).toContainText('1.590.000');
    await expect(page.getByRole('cell', { name: '6 bộ' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tài khoản liên quan' })).toBeVisible();
    await expect(accountCards(page)).toHaveCount(4);
  });

  test('tài khoản đã bán không mua được', async ({ page }) => {
    await page.goto('/accounts/acc-lien-quan-rank-kim-cuong-60-tuong');
    await expect(page.getByText('Đã bán').first()).toBeVisible();
    // Chỉ xét nút mua của tin đang xem; tin liên quan bên dưới cũng có thể có nút 'Đã bán'.
    await expect(page.locator('.buy-box').getByRole('button', { name: 'Đã bán' })).toBeDisabled();
  });

  test('đường dẫn sai hiện trang 404 và slug sai báo không tìm thấy', async ({ page }) => {
    await page.goto('/khong-co-trang-nay');
    await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
    await expect(page).toHaveTitle('Không tìm thấy trang | DoroShop');

    await page.goto('/accounts/slug-khong-ton-tai');
    await expect(page.getByRole('heading', { name: 'Không tìm thấy tài khoản' })).toBeVisible();
  });
});

test.describe('mua ngay, đăng ký và thanh toán', () => {
  test('luồng đầy đủ: Mua ngay, đăng ký, mã giảm giá, đặt hàng, xem bàn giao demo', async ({ page }) => {
    // Chọn acc ở trang chi tiết rồi bấm Mua ngay: chưa đăng nhập nên bị chuyển sang /login
    await page.goto('/accounts/acc-lien-quan-gia-re-rank-vang');
    await expect(page.getByRole('link', { name: /giỏ hàng/i })).toHaveCount(0);
    await page.locator('.buy-box').getByRole('link', { name: 'Mua ngay' }).click();
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fcheckout%3Faccount%3Dacc-lien-quan-gia-re-rank-vang/);

    // Đăng ký tài khoản mới, xác thực form
    await page.getByRole('link', { name: 'Đăng ký ngay' }).click();
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.getByText('Vui lòng nhập họ và tên')).toBeVisible();
    await page.getByLabel('Họ và tên').fill('Trần Thị Mai');
    await page.getByLabel('Email').fill('mai@example.com');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('matkhau1');
    await page.getByLabel('Nhập lại mật khẩu').fill('khacnhau');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.getByText('Mật khẩu nhập lại chưa khớp')).toBeVisible();
    await page.getByLabel('Nhập lại mật khẩu').fill('matkhau1');
    await page.getByRole('button', { name: 'Đăng ký' }).click();

    // Sau khi đăng ký quay lại đúng trang checkout, acc đã chọn vẫn được chọn sẵn
    await expect(page).toHaveURL(/\/checkout\?account=acc-lien-quan-gia-re-rank-vang$/);
    await expect(page.getByRole('heading', { name: 'Thanh toán', level: 1 })).toBeVisible();
    await expect(page.locator('.summary .item')).toContainText('Acc Liên Quân giá rẻ - Rank Bạch Kim, 50 tướng');

    // Mã giảm giá áp dụng ngay tại checkout: mã sai bị từ chối, mã đúng được áp dụng
    await page.getByLabel('Mã giảm giá').fill('SAIMA');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(page.getByText('Mã giảm giá không hợp lệ')).toBeVisible();
    await page.getByLabel('Mã giảm giá').fill('doro10');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(page.getByText('Giảm giá (DORO10)')).toBeVisible();
    await expect(page.locator('.totals .grand dd')).toContainText('180.000'); // 200.000 - 10%

    // Validate form nhận tài khoản
    await page.getByLabel('Email hoặc số điện thoại').fill('khong-hop-le');
    await page.getByRole('button', { name: 'Đặt hàng' }).click();
    await expect(page.getByText('Email hoặc số điện thoại không hợp lệ')).toBeVisible();

    await page.getByLabel('Email hoặc số điện thoại').fill('0987654321');
    await page.getByLabel(/Chuyển khoản ngân hàng/).check();
    await expect(page.getByText('Thông tin chuyển khoản (giả lập)')).toBeVisible();
    await page.getByRole('button', { name: 'Đặt hàng' }).click();

    // Trang thành công với mã đơn dạng DR-000007 (đã có 6 đơn mẫu)
    await expect(page).toHaveURL(/\/order-success\/DR-000007$/);
    await expect(page.getByRole('heading', { name: 'Đặt hàng thành công!' })).toBeVisible();
    await expect(page.locator('.code')).toHaveText('DR-000007');

    // Thông tin bàn giao demo hiển thị rõ ràng là dữ liệu demo
    await expect(page.getByText('Thông tin bàn giao (demo)')).toBeVisible();
    await expect(page.getByText('dữ liệu demo dựng sẵn')).toBeVisible();
    await expect(page.locator('.credential code').first()).toContainText('doro_');

    // Lịch sử đơn hàng của tôi chỉ có đơn vừa đặt (không lẫn đơn của khách demo)
    await page.getByRole('link', { name: 'Xem đơn hàng của tôi' }).first().click();
    await expect(page).toHaveURL(/\/account\/orders$/);
    await expect(page.locator('.order')).toHaveCount(1);
    await page.getByRole('button', { name: /DR-000007/ }).click();
    await expect(page.getByRole('cell', { name: 'Acc Liên Quân giá rẻ - Rank Bạch Kim, 50 tướng' })).toBeVisible();
    await expect(page.getByText('Chờ xác nhận').first()).toBeVisible();

    // Tài khoản vừa mua đổi sang trạng thái đã bán
    await page.goto('/accounts/acc-lien-quan-gia-re-rank-vang');
    await expect(page.getByText('Đã bán').first()).toBeVisible();
  });

  test('mua ngay từ thẻ ở danh sách đi thẳng tới checkout với đúng một tin', async ({ page }) => {
    await login(page, 'demo@doroshop.vn', 'demo123');
    await expect(page).toHaveURL('/');
    await page.goto('/accounts?search=gia%20re');
    await expect(accountCards(page)).toHaveCount(1);
    await accountCards(page).getByRole('link', { name: /Mua ngay/ }).click();

    await expect(page).toHaveURL(/\/checkout\?account=acc-lien-quan-gia-re-rank-vang$/);
    await expect(page.locator('.summary .item')).toHaveCount(1);
    await expect(page.locator('.totals .grand dd')).toContainText('200.000');
  });

  test('checkout không chọn acc thì báo chưa chọn, /cart không còn tồn tại', async ({ page }) => {
    await login(page, 'demo@doroshop.vn', 'demo123', '/checkout');
    await expect(page.getByRole('heading', { name: 'Bạn chưa chọn tài khoản nào để mua' })).toBeVisible();

    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
    await expect(page.getByRole('link', { name: /giỏ hàng/i })).toHaveCount(0);
  });

  test('checkout của tài khoản đã bán báo hết hàng', async ({ page }) => {
    await login(page, 'demo@doroshop.vn', 'demo123', '/checkout?account=acc-lien-quan-rank-kim-cuong-60-tuong');
    await expect(page.getByRole('heading', { name: 'Tài khoản này đã có người mua' })).toBeVisible();
  });

  test('sai mật khẩu báo lỗi rõ ràng, phiên đăng nhập giữ sau khi tải lại', async ({ page }) => {
    await login(page, 'demo@doroshop.vn', 'sai-mat-khau');
    await expect(page.getByRole('alert')).toHaveText('Email hoặc mật khẩu không đúng');

    await page.getByLabel('Mật khẩu').fill('demo123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL('/');
    await page.reload();
    await expect(page.getByRole('button', { name: /Khách hàng Demo/ })).toBeVisible();

    await page.getByRole('button', { name: /Khách hàng Demo/ }).click();
    await page.getByRole('menuitem', { name: 'Đăng xuất' }).click();
    await expect(page.getByRole('link', { name: 'Đăng nhập' }).first()).toBeVisible();
  });

  test('lịch sử đơn hàng của khách demo hiện thông tin bàn giao demo', async ({ page }) => {
    await login(page, 'demo@doroshop.vn', 'demo123', '/account/orders');
    await expect(page).toHaveURL(/\/account\/orders$/);
    await expect(page.locator('.order')).toHaveCount(6);

    // Đơn đã bị hủy thì không có thông tin bàn giao
    const cancelledRow = page.locator('.order', { hasText: 'Đã hủy' });
    await cancelledRow.getByRole('button').click();
    await expect(cancelledRow.getByText('Thông tin bàn giao (demo)')).toHaveCount(0);

    // Đơn đã bàn giao thì có thông tin demo
    const deliveredRow = page.locator('.order', { hasText: 'Đã bàn giao' }).first();
    await deliveredRow.getByRole('button').click();
    await expect(deliveredRow.getByText('Thông tin bàn giao (demo)')).toBeVisible();
  });
});

test.describe('khu vực admin', () => {
  test('khách thường không vào được /admin', async ({ page }) => {
    await login(page, 'demo@doroshop.vn', 'demo123');
    await expect(page).toHaveURL('/');
    await page.goto('/admin');
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Bạn không có quyền truy cập khu vực quản trị')).toBeVisible();
  });

  test('chưa đăng nhập vào /admin/orders thì về login rồi quay lại đúng trang sau khi đăng nhập', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fadmin%2Forders/);
    await page.getByLabel('Email').fill('admin@doroshop.vn');
    await page.getByLabel('Mật khẩu').fill('admin123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL(/\/admin\/orders$/);
    await expect(page.getByRole('heading', { name: 'Quản lý đơn hàng' })).toBeVisible();
  });

  test('dashboard hiện số liệu, biểu đồ và số tin theo game', async ({ page }) => {
    await login(page, 'admin@doroshop.vn', 'admin123', '/admin');
    await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible();
    await expect(page.getByText('Tổng doanh thu')).toBeVisible();
    await expect(page.locator('.stat').nth(2).locator('.stat-value')).toHaveText('21');
    await expect(page.locator('.stat').nth(3).locator('.stat-value')).toHaveText('6');
    await expect(page.locator('.bar-col')).toHaveCount(7);
    await expect(page.getByRole('heading', { name: 'Số tin theo từng game' })).toBeVisible();
    await expect(page.locator('.game-bars li')).toHaveCount(5);
  });

  test('lọc đơn theo trạng thái, xem chi tiết và đổi trạng thái', async ({ page }) => {
    await login(page, 'admin@doroshop.vn', 'admin123', '/admin/orders');
    const rows = page.locator('.table-wrap').first().locator('tbody tr');
    await expect(rows).toHaveCount(6);

    await page.getByRole('button', { name: /^Đã hủy/ }).click();
    await expect(rows).toHaveCount(1);

    await rows.first().getByRole('button', { name: 'Chi tiết' }).click();
    await expect(page.getByRole('region', { name: 'Chi tiết đơn hàng' })).toBeVisible();

    await page.getByRole('button', { name: /^Chờ xác nhận/ }).click();
    await expect(rows).toHaveCount(1);
    await rows.first().locator('select').selectOption('confirmed');
    await expect(page.getByText(/Đơn DR-\d+: Đã xác nhận/)).toBeVisible();
    await expect(rows).toHaveCount(0);
  });

  test('thêm, sửa và xóa tin rao (có hộp thoại xác nhận, thông tin thêm động)', async ({ page }) => {
    await login(page, 'admin@doroshop.vn', 'admin123', '/admin/accounts');
    await expect(page.getByRole('heading', { name: 'Quản lý tài khoản game' })).toBeVisible();

    // Form validate đầy đủ
    await page.getByRole('link', { name: '+ Thêm tin rao' }).click();
    await page.getByRole('button', { name: 'Thêm tin rao' }).click();
    await expect(page.getByText('Tiêu đề cần từ 6 đến 150 ký tự')).toBeVisible();
    await expect(page.getByText('Giá bán phải từ 1.000 ₫ trở lên')).toBeVisible();
    await expect(page.getByText('Cần ít nhất một dòng thông tin có đủ tên và giá trị')).toBeVisible();

    await page.locator('#af-title').fill('Acc Test E2E - Rank Kim Cương');
    await page.locator('#af-game').selectOption('valorant');
    await page.locator('#af-server').fill('Asia Pacific (AP)');
    await page.locator('#af-rank').fill('Kim Cương');
    await page.locator('#af-price').fill('500000');
    await page.locator('#af-old').fill('400000');
    await page.locator('#af-desc').fill('Tài khoản kiểm thử tự động dùng cho bài test end-to-end của DoroShop.');
    await page.locator('#extra-key-0').fill('Số agent mở khóa');
    await page.locator('#extra-value-0').fill('20/24');
    await page.getByRole('button', { name: '+ Thêm dòng thông tin' }).click();
    await page.locator('#extra-key-1').fill('Số súng skin');
    await page.locator('#extra-value-1').fill('10 bộ');
    await page.getByRole('button', { name: 'Thêm tin rao' }).click();
    await expect(page.getByText('Giá gốc phải lớn hơn giá bán')).toBeVisible();

    await page.locator('#af-old').fill('650000');
    await page.getByRole('button', { name: 'Thêm tin rao' }).click();
    await expect(page).toHaveURL(/\/admin\/accounts$/);
    await expect(page.getByText('Đã thêm "Acc Test E2E - Rank Kim Cương"')).toBeVisible();

    // Tin mới hiện ở cửa hàng với thông tin thêm và mức giảm 23%
    await page.goto('/accounts/acc-test-e2e-rank-kim-cuong');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Acc Test E2E - Rank Kim Cương');
    await expect(page.locator('.gallery-main .floating')).toHaveText('-23%');
    await expect(page.getByRole('cell', { name: '20/24' })).toBeVisible();

    // Sửa
    await page.goto('/admin/accounts');
    await page.getByLabel('Tìm tin rao').fill('Test E2E');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page.getByRole('link', { name: 'Sửa Acc Test E2E - Rank Kim Cương' }).click();
    await expect(page.locator('#af-title')).toHaveValue('Acc Test E2E - Rank Kim Cương');
    await page.locator('#af-title').fill('Acc Test E2E Bản Mới');
    await page.locator('#af-price').fill('480000');
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page).toHaveURL(/\/admin\/accounts$/);
    await page.getByLabel('Tìm tin rao').fill('Bản Mới');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr')).toContainText('480.000');

    // Xóa: hủy trước rồi mới xác nhận
    await page.getByRole('button', { name: 'Xóa Acc Test E2E Bản Mới' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Xóa tin rao?');
    await dialog.getByRole('button', { name: 'Hủy' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('tbody tr')).toHaveCount(1);

    await page.getByRole('button', { name: 'Xóa Acc Test E2E Bản Mới' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa tin' }).click();
    await expect(page.getByText('Không có tin nào phù hợp')).toBeVisible();
  });
});

test.describe('giao diện', () => {
  test('chế độ sáng/tối: theo hệ thống, chuyển đổi và nhớ lựa chọn', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('button', { name: 'Chuyển sang giao diện sáng' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('responsive: trên điện thoại không bị tràn ngang', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const url of ['/', '/accounts', '/accounts/acc-lien-quan-full-tuong-cao-thu', '/checkout', '/login']) {
      await page.goto(url);
      await expect(page.locator('main')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `tràn ngang ở ${url}`).toBeLessThanOrEqual(1);
    }
  });
});
