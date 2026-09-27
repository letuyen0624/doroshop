import { firstValueFrom } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { GAMES } from '../models';
import { GameAccountService } from './game-account.service';

describe('GameAccountService.featuredByGame (khối "theo tựa game" ở trang chủ)', () => {
  let service: GameAccountService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    service = TestBed.inject(GameAccountService);
  });

  it('chỉ trả về các game đang thực sự có tin còn hàng, không có khối rỗng', async () => {
    const sections = await firstValueFrom(service.featuredByGame(4));

    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      expect(section.accounts.length).toBeGreaterThan(0);
      expect(section.accounts.every((account) => account.status === 'con_hang')).toBe(true);
      expect(section.accounts.every((account) => account.game === section.game)).toBe(true);
    }

    // "Khác" chưa có tin rao nào trong dữ liệu mẫu nên không xuất hiện.
    expect(sections.some((section) => section.game === 'khac')).toBe(false);
  });

  it('giữ đúng thứ tự khai báo trong GAMES', async () => {
    const sections = await firstValueFrom(service.featuredByGame(4));
    const order = sections.map((section) => section.game);
    const expectedOrder = GAMES.map((game) => game.id).filter((id) => order.includes(id));

    expect(order).toEqual(expectedOrder);
  });

  it('giới hạn đúng số tin mỗi khối và ưu tiên đánh giá cao nhất', async () => {
    const sections = await firstValueFrom(service.featuredByGame(2));
    const lienQuan = sections.find((section) => section.game === 'lien-quan-mobile');

    expect(lienQuan?.accounts.length).toBeLessThanOrEqual(2);
    if (lienQuan && lienQuan.accounts.length === 2) {
      const [first, second] = lienQuan.accounts;
      const firstScore = first.rating * 1000 + first.reviewCount;
      const secondScore = second.rating * 1000 + second.reviewCount;
      expect(firstScore).toBeGreaterThanOrEqual(secondScore);
    }
  });
});
