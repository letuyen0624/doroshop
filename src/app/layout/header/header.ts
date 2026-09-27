import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService, ThemeService, ToastService } from '../../core/services';

/** Thanh điều hướng trên cùng: logo, tìm kiếm, tài khoản và nút đổi giao diện. */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly toast = inject(ToastService);

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });

  protected readonly currentUser = this.auth.currentUser;
  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly resolvedTheme = this.theme.resolved;

  protected readonly userMenuOpen = signal(false);

  protected readonly themeLabel = computed(() =>
    this.resolvedTheme() === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối',
  );

  constructor() {
    // Đổi trang thì đóng menu tài khoản đang mở.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMenus());
  }

  protected submitSearch(event: Event): void {
    event.preventDefault();
    const term = this.searchControl.value.trim();
    this.closeMenus();
    void this.router.navigate(['/accounts'], {
      queryParams: { search: term || null, page: null },
      queryParamsHandling: 'merge',
    });
  }

  protected toggleTheme(): void {
    this.theme.toggle();
  }

  protected toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  protected closeMenus(): void {
    this.userMenuOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
    this.closeMenus();
    this.toast.info('Bạn đã đăng xuất');
    void this.router.navigate(['/']);
  }
}
