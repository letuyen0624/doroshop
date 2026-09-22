import { formatCurrency, getCurrencySymbol } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

/** Định dạng số tiền theo kiểu Việt Nam: 1.290.000 ₫ */
@Pipe({ name: 'vnd' })
export class VndPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '';
    }
    return formatCurrency(value, 'vi', getCurrencySymbol('VND', 'narrow', 'vi'), 'VND', '1.0-0');
  }
}
