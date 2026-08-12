import { pickLocalizedText } from '../textFallback';

describe('pickLocalizedText', () => {
  test('prefers Arabic content in Arabic', () => {
    expect(pickLocalizedText(true, 'مطعم الدوحة', 'Doha Restaurant')).toBe('مطعم الدوحة');
  });

  test('uses English only when Arabic content is unavailable', () => {
    expect(pickLocalizedText(true, '   ', 'Doha Restaurant')).toBe('Doha Restaurant');
  });

  test('prefers English content in English and preserves the supplied fallback', () => {
    expect(pickLocalizedText(false, 'مطعم الدوحة', 'Doha Restaurant')).toBe('Doha Restaurant');
    expect(pickLocalizedText(true, undefined, undefined, 'غير متاح')).toBe('غير متاح');
  });
});
