import { isSafeReturnTo } from '@/utils/safe-return-to';

const ORIGIN = 'https://onlyjobs.app';

describe('isSafeReturnTo', () => {
  it('/tracker → true (valid same-origin path)', () => {
    expect(isSafeReturnTo('/tracker', ORIGIN)).toBe(true);
  });

  it('/dashboard?tab=applied&followup=true → true (query string preserved)', () => {
    expect(isSafeReturnTo('/dashboard?tab=applied&followup=true', ORIGIN)).toBe(true);
  });

  it('//evil.com → false (protocol-relative, off-site)', () => {
    expect(isSafeReturnTo('//evil.com', ORIGIN)).toBe(false);
  });

  it('/\\evil.com → false (backslash normalises to //evil.com in browsers)', () => {
    expect(isSafeReturnTo('/\\evil.com', ORIGIN)).toBe(false);
  });

  it('/\\/evil.com → false (slash+backslash+slash normalises to //evil.com)', () => {
    expect(isSafeReturnTo('/\\/evil.com', ORIGIN)).toBe(false);
  });

  it('https://evil.com → false (absolute URL, different origin)', () => {
    expect(isSafeReturnTo('https://evil.com', ORIGIN)).toBe(false);
  });

  it('empty string → false', () => {
    expect(isSafeReturnTo('', ORIGIN)).toBe(false);
  });

  it('null → false', () => {
    expect(isSafeReturnTo(null, ORIGIN)).toBe(false);
  });

  it('undefined → false', () => {
    expect(isSafeReturnTo(undefined, ORIGIN)).toBe(false);
  });
});
