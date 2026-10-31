import { describe, expect, it } from 'vitest';
import { colourDistance, rgbToHex } from '../src/colour/conversion';
import { extractPalette } from '../src/extraction';
import { pixelsFromRgba } from '../src/image/pixels';
import type { RGB } from '../src/types';
import { formatPalette } from '../src/output/formatters';
import { decodeSharedPalette, encodeSharedPalette } from '../src/output/sharing';

function repeated(colour: RGB, count: number): RGB[] {
  return Array.from({ length: count }, () => ({ ...colour }));
}

const stripes = [
  ...repeated({ r: 240, g: 40, b: 30 }, 60),
  ...repeated({ r: 30, g: 180, b: 80 }, 30),
  ...repeated({ r: 35, g: 60, b: 220 }, 10),
];

describe('colour conversion', () => {
  it('formats clamped RGB channels as hex', () => {
    expect(rgbToHex({ r: 255.4, g: -2, b: 16 })).toBe('#ff0010');
  });

  it('uses perceptual Lab distance', () => {
    expect(colourDistance({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeGreaterThan(99);
  });
});

describe('extraction modes', () => {
  it('returns graphic colours in prevalence order', () => {
    const palette = extractPalette(stripes, { mode: 'graphic', count: 3, minDistance: 0 });
    expect(palette.map(rgbToHex)).toEqual(['#f0281e', '#1eb450', '#233cdc']);
  });

  it('produces an exact balanced count for a non-power-of-two request', () => {
    const gradient = Array.from({ length: 64 }, (_, value) => ({
      r: value * 4,
      g: 255 - value * 4,
      b: (value * 11) % 256,
    }));
    expect(extractPalette(gradient, { mode: 'balanced', count: 5, minDistance: 10 })).toHaveLength(5);
  });

  it('produces deterministic natural palettes', () => {
    const options = { mode: 'natural' as const, count: 3, minDistance: 8 };
    expect(extractPalette(stripes, options)).toEqual(extractPalette(stripes, options));
  });

  it('backfills candidates when the distinctness threshold is too strong', () => {
    const closeColours = Array.from({ length: 12 }, (_, value) => ({ r: 100 + value, g: 100, b: 100 }));
    expect(extractPalette(closeColours, { mode: 'graphic', count: 4, minDistance: 100 })).toHaveLength(4);
  });
});

describe('RGBA preprocessing', () => {
  it('ignores transparent pixels and composites translucent pixels', () => {
    const data = new Uint8ClampedArray([
      255, 0, 0, 0,
      0, 0, 0, 128,
      20, 40, 60, 255,
    ]);
    expect(pixelsFromRgba(data)).toEqual([
      { r: 127, g: 127, b: 127 },
      { r: 20, g: 40, b: 60 },
    ]);
  });
});

describe('creative coding output', () => {
  const palette = [{ r: 255, g: 0, b: 16 }, { r: 0, g: 128, b: 255 }];

  it('produces valid CSS values regardless of display format', () => {
    expect(formatPalette(palette, 'css')).toContain('--colour-1: #ff0010;');
  });

  it('produces normalised GLSL vectors', () => {
    expect(formatPalette(palette, 'glsl')).toContain('vec3(1.000, 0.000, 0.063)');
  });

  it('round-trips validated shared palette state', () => {
    const shared = {
      version: 1 as const,
      colours: palette,
      mode: 'natural' as const,
      count: 2,
      minDistance: 18,
      format: 'p5js' as const,
    };
    expect(decodeSharedPalette(encodeSharedPalette(shared))).toEqual(shared);
    expect(decodeSharedPalette('not-valid')).toBeNull();
  });
});
