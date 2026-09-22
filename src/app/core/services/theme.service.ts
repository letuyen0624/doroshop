import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { STORAGE_KEYS, StorageService } from './storage.service';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/**
 * Quản lý chế độ sáng/tối. Mặc định đi theo hệ thống, người dùng đổi thì nhớ lựa chọn.
 * Kết quả được ghi vào thuộc tính data-theme trên thẻ html.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);
  private readonly document = inject(DOCUMENT);

  private readonly systemDark = signal(this.readSystemPreference());
  private readonly preferenceSignal = signal<ThemePreference>(this.readStoredPreference());

  readonly preference = this.preferenceSignal.asReadonly();
  readonly resolved = computed<ResolvedTheme>(() => {
    const preference = this.preferenceSignal();
    if (preference === 'system') {
      return this.systemDark() ? 'dark' : 'light';
    }
    return preference;
  });

  constructor() {
    this.watchSystemPreference();
    effect(() => {
      this.document.documentElement.setAttribute('data-theme', this.resolved());
    });
  }

  /** Đổi qua lại giữa sáng và tối, bỏ chế độ theo hệ thống. */
  toggle(): void {
    this.set(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  set(preference: ThemePreference): void {
    this.preferenceSignal.set(preference);
    this.storage.write(STORAGE_KEYS.theme, preference);
  }

  private readStoredPreference(): ThemePreference {
    const stored = this.storage.read<ThemePreference>(STORAGE_KEYS.theme);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  }

  private readSystemPreference(): boolean {
    const view = this.document.defaultView;
    return view?.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private watchSystemPreference(): void {
    const media = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener?.('change', (event) => this.systemDark.set(event.matches));
  }
}
