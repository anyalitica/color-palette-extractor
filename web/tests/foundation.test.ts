import { describe, expect, it } from 'vitest';
import { getColourName } from '../src/colour/names';
import { loadImageFromUrl } from '../src/image/load-image';
import { isThemePreference, resolveTheme } from '../src/theme';
import { MODE_DEFINITIONS } from '../src/types';

describe('application foundation', () => {
  it('exposes the three user-facing extraction modes', () => {
    expect(MODE_DEFINITIONS.map(({ id }) => id)).toEqual(['natural', 'graphic', 'balanced']);
  });

  it('resolves system and explicit theme choices', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('sepia')).toBe(false);
  });

  it('uses perceptually matched standard colour names', () => {
    expect(getColourName({ r: 0, g: 100, b: 0 })).toBe('Dark green');
    expect(getColourName({ r: 255, g: 99, b: 71 })).toBe('Tomato');
  });

  it('rejects incomplete image links before requesting them', async () => {
    await expect(loadImageFromUrl('example.com/image.jpg')).rejects.toThrow('http:// or https://');
  });
});
