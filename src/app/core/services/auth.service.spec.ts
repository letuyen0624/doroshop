import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { hashPassword, sha256Hex } from './sha256';

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    auth = TestBed.inject(AuthService);
  });

  it('ban đầu chưa đăng nhập', () => {
    expect(auth.currentUser()).toBeNull();
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.isAdmin()).toBe(false);
  });

  it('đăng nhập bằng tài khoản demo khách hàng', async () => {
    const user = await firstValueFrom(auth.login({ email: 'demo@doroshop.vn', password: 'demo123' }));

    expect(user.role).toBe('customer');
    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.isAdmin()).toBe(false);
  });

  it('đăng nhập bằng tài khoản admin, email không phân biệt hoa thường', async () => {
    await firstValueFrom(auth.login({ email: '  ADMIN@doroshop.vn ', password: 'admin123' }));

    expect(auth.isAdmin()).toBe(true);
  });

  it('không lộ mật khẩu băm trong currentUser', async () => {
    const user = await firstValueFrom(auth.login({ email: 'demo@doroshop.vn', password: 'demo123' }));

    expect('passwordHash' in user).toBe(false);
  });

  it('từ chối sai mật khẩu và email không tồn tại với cùng một thông báo', async () => {
    const wrongPassword = firstValueFrom(auth.login({ email: 'demo@doroshop.vn', password: 'sai' }));
    const unknownEmail = firstValueFrom(auth.login({ email: 'khong@co.vn', password: 'demo123' }));

    await expect(wrongPassword).rejects.toThrow('Email hoặc mật khẩu không đúng');
    await expect(unknownEmail).rejects.toThrow('Email hoặc mật khẩu không đúng');
    expect(auth.isLoggedIn()).toBe(false);
  });

  it('đăng ký tạo tài khoản khách hàng, đăng nhập luôn và chuẩn hóa email', async () => {
    const user = await firstValueFrom(
      auth.register({ name: '  Nguyễn Văn A ', email: 'A@Example.com', password: 'matkhau1' }),
    );

    expect(user.name).toBe('Nguyễn Văn A');
    expect(user.email).toBe('a@example.com');
    expect(user.role).toBe('customer');
    expect(auth.currentUser()?.id).toBe(user.id);
  });

  it('không lưu mật khẩu dạng chữ thường xuống localStorage', async () => {
    await firstValueFrom(auth.register({ name: 'B', email: 'b@example.com', password: 'bimat-123' }));

    const dump = Object.values(localStorage).join('|');
    expect(dump).not.toContain('bimat-123');
    expect(dump).toContain(await hashPassword('bimat-123'));
  });

  it('từ chối đăng ký trùng email', async () => {
    await expect(
      firstValueFrom(auth.register({ name: 'Trùng', email: 'demo@doroshop.vn', password: 'abcdef' })),
    ).rejects.toThrow('Email này đã được đăng ký');
  });

  it('tài khoản mới đăng ký đăng nhập lại được sau khi đăng xuất', async () => {
    await firstValueFrom(auth.register({ name: 'C', email: 'c@example.com', password: 'abcdef' }));
    auth.logout();
    expect(auth.isLoggedIn()).toBe(false);

    const user = await firstValueFrom(auth.login({ email: 'c@example.com', password: 'abcdef' }));
    expect(user.email).toBe('c@example.com');
  });

  it('giữ phiên đăng nhập sau khi tải lại trang', async () => {
    await firstValueFrom(auth.login({ email: 'admin@doroshop.vn', password: 'admin123' }));

    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(AuthService);

    expect(reloaded.currentUser()?.email).toBe('admin@doroshop.vn');
    expect(reloaded.isAdmin()).toBe(true);
  });

  it('đăng xuất xóa phiên đã lưu', async () => {
    await firstValueFrom(auth.login({ email: 'demo@doroshop.vn', password: 'demo123' }));
    auth.logout();

    TestBed.resetTestingModule();
    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(false);
  });
});

describe('sha256', () => {
  it('trùng với vector kiểm thử chuẩn', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('bản thuần TypeScript khớp với Web Crypto', async () => {
    const samples = ['admin123', 'demo123', 'Mật khẩu tiếng Việt 🔐', 'x'.repeat(200)];
    for (const sample of samples) {
      expect(sha256Hex(sample)).toBe(await hashPassword(sample));
    }
  });

  it('khớp với hash seed của tài khoản demo', () => {
    expect(sha256Hex('admin123')).toBe('240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9');
    expect(sha256Hex('demo123')).toBe('d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791');
  });
});
