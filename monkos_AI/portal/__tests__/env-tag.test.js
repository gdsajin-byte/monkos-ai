/**
 * dev 텔레그램 태그 — K_SERVICE dev / prod / 미설정 (ORDER_20261103 dev알림태그)
 */
import { isDevService, withEnvTag } from '../lib/shared/env-tag.js';

const saved = process.env.K_SERVICE;
afterAll(() => {
  if (saved === undefined) delete process.env.K_SERVICE; else process.env.K_SERVICE = saved;
});

describe('withEnvTag', () => {
  test('dev 서비스 → [dev] 태그', () => {
    process.env.K_SERVICE = 'monkos-portal-dev';
    expect(isDevService()).toBe(true);
    expect(withEnvTag('🚨 결제 실패')).toBe('[dev] 🚨 결제 실패');
  });

  test('이미 태그가 있으면 중복하지 않는다', () => {
    process.env.K_SERVICE = 'monkos-portal-dev';
    expect(withEnvTag('[dev] 알림')).toBe('[dev] 알림');
  });

  test('prod 서비스 → 그대로', () => {
    process.env.K_SERVICE = 'monkos-portal';
    expect(isDevService()).toBe(false);
    expect(withEnvTag('🚨 결제 실패')).toBe('🚨 결제 실패');
  });

  test('미설정 → 그대로', () => {
    delete process.env.K_SERVICE;
    expect(isDevService()).toBe(false);
    expect(withEnvTag('알림')).toBe('알림');
  });

  test('이름 중간의 dev는 dev 서비스가 아니다', () => {
    process.env.K_SERVICE = 'monkos-dev-portal';
    expect(isDevService()).toBe(false);
  });
});
