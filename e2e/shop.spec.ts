import { Page, expect, test } from '@playwright/test';

const login = async (page: Page, email: string, password: string, returnTo = '/'): Promise<void> => {
  await page.goto(`/login?returnUrl=${encodeURIComponent(returnTo)}`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
};

const accountCards = (page: Page) => page.locator('app-account-card');

test.describe('duyệt và lọc tài khoản', () => {
  test('trang chủ hiện banner, danh mục game và tin', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Trang chủ | DoroShop');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tìm acc không khó, đã có Doro');
    await expect(page.getByRole('heading', { name: 'Chọn theo tựa game' })).toBeVisible();
    await expect(accountCards(page).first()).toBeVisible();
    // 4 tin nổi bật + 4 tin giảm giá
    await expect(accountCards(page)).toHaveCount(8);
  });

  test('tìm kiếm, lọc, sắp xếp, phân trang và đồng bộ URL', async ({ page }) => {
    await page.goto('/accounts');
    await expect(accountCards(page)).toHaveCount(9);
    await expect(page.getByRole('status').filter({ hasText: 'Hiển thị 1-9 trong 27' })).toBeVisible();

    // Phân trang: sang trang 2 và giữ trên URL
    await page.getByRole('button', { name: 'Trang 2' }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(accountCards(page)).toHaveCount(9);

    // Tìm kiếm có debounce, không dấu vẫn ra kết quả, và reset về trang 1
    await page.locator('#filter-search').fill('genshin');
    await expect(page).toHaveURL(/search=genshin/);
    await expect(page).not.toHaveURL(/page=2/);
    await expect(accountCards(page)).toHaveCount(5);

    // Xóa tìm kiếm bằng nút xóa lọc, rồi lọc theo game
    await page.getByRole('button', { name: /Xóa lọc/ }).click();
    await expect(accountCards(page)).toHaveCount(9);
    await page.getByRole('group', { name: 'Game' }).getByLabel('Valorant').check();
    await expect(page).toHaveURL(/games=valorant/);
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

  test('tài khoản đã bán không thêm được vào giỏ', async ({ page }) => {
    await page.goto('/accounts/acc-lien-quan-rank-kim-cuong-60-tuong');
    await expect(page.getByText('Đã bán').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đã bán' })).toBeDisabled();
  });

  test('đường dẫn sai hiện trang 404 và slug sai báo không tìm thấy', async ({ page }) => {
    await page.goto('/khong-co-trang-nay');
    await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
    await expect(page).toHaveTitle('Không tìm thấy trang | DoroShop');

    await page.goto('/accounts/slug-khong-ton-tai');
    await expect(page.getByRole('heading', { name: 'Không tìm thấy tài khoản' })).toBeVisible();
  });
});

test.describe('giỏ hàng, đăng ký và thanh toán', () => {
  test('luồng đầy đủ: thêm giỏ, mã giảm giá, đăng ký, đặt hàng, xem bàn giao demo', async ({ page }) => {
    // Thêm vào giỏ từ trang chi tiết
    await page.goto('/accounts/acc-lien-quan-gia-re-rank-vang');
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click();
    await expect(page.getByRole('status').getByText(/Đã thêm .* vào giỏ hàng/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Giỏ hàng, 1 tài khoản' })).toBeVisible();

    // Không cho thêm trùng
    await page.reload();
    await expect(page.getByRole('button', { name: 'Đã có trong giỏ' })).toBeDisabled();

    // Giỏ hàng: mã sai bị từ chối, mã đúng được áp dụng
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Giỏ hàng', level: 1 })).toBeVisible();

    await page.getByLabel('Mã giảm giá').fill('SAIMA');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(page.getByText('Mã giảm giá không hợp lệ')).toBeVisible();

    await page.getByLabel('Mã giảm giá').fill('doro10');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(page.getByText('Giảm giá', { exact: true })).toBeVisible();
    await expect(page.locator('.totals .grand dd')).toContainText('80.100'); // 89.000 - 10%

    // Chưa đăng nhập: bị chuyển sang /login và nhớ trang đích
    await page.getByRole('link', { name: 'Tiến hành thanh toán' }).click();
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fcheckout/);

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

    // Sau khi đăng ký quay lại đúng trang checkout, giỏ hàng vẫn còn
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole('heading', { name: 'Thanh toán', level: 1 })).toBeVisible();

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
    await expect(page.getByRole('cell', { name: 'Acc Liên Quân giá rẻ - Rank Vàng, 30 tướng' })).toBeVisible();
    await expect(page.getByText('Chờ xác nhận').first()).toBeVisible();

    // Tài khoản vừa mua đổi sang trạng thái đã bán
    await page.goto('/accounts/acc-lien-quan-gia-re-rank-vang');
    await expect(page.getByText('Đã bán').first()).toBeVisible();
  });

  test('giỏ trống có giao diện riêng và checkout đưa về giỏ hàng', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Giỏ hàng của bạn đang trống' })).toBeVisible();

    await login(page, 'demo@doroshop.vn', 'demo123', '/checkout');
    await expect(page).toHaveURL(/\/cart$/);
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
    await expect(page.locator('.game-bars li')).toHaveCount(6);
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
    await expect(page.locator('.floating')).toHaveText('-23%');
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
    for (const url of ['/', '/accounts', '/accounts/acc-lien-quan-full-tuong-cao-thu', '/cart', '/login']) {
      await page.goto(url);
      await expect(page.locator('main')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `tràn ngang ở ${url}`).toBeLessThanOrEqual(1);
    }
  });
});
