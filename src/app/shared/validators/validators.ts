import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Số điện thoại di động Việt Nam: 0xxxxxxxxx hoặc +84xxxxxxxxx (đầu số 3, 5, 7, 8, 9). */
const VN_PHONE = /^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/;

export function vnPhone(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').replace(/[\s.-]/g, '');
    if (!value) {
      return null;
    }
    return VN_PHONE.test(value) ? null : { vnPhone: true };
  };
}

/**
 * Chấp nhận email HOẶC số điện thoại Việt Nam, dùng cho ô "thông tin liên hệ"
 * khi nhận bàn giao tài khoản.
 */
export function emailOrVnPhone(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) {
      return null;
    }
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isPhone = VN_PHONE.test(value.replace(/[\s.-]/g, ''));
    return isEmail || isPhone ? null : { emailOrVnPhone: true };
  };
}

/** Kiểm tra hai control cùng tên trong nhóm có giá trị giống nhau (mật khẩu nhập lại). */
export function matchFields(field: string, confirmField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(field)?.value;
    const b = group.get(confirmField)?.value;
    return a === b ? null : { mismatch: true };
  };
}

/** Không chấp nhận chuỗi chỉ toàn khoảng trắng. */
export function notBlank(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    return typeof value === 'string' && value.length > 0 && value.trim().length === 0
      ? { blank: true }
      : null;
  };
}
