import type { RGB } from '../types';

export interface Lab {
  l: number;
  a: number;
  b: number;
}

export function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function normaliseRgb(colour: RGB): RGB {
  return {
    r: clampChannel(colour.r),
    g: clampChannel(colour.g),
    b: clampChannel(colour.b),
  };
}

export function rgbToHex(colour: RGB): string {
  const { r, g, b } = normaliseRgb(colour);
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function linearise(channel: number): number {
  const value = clampChannel(channel) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function rgbToLab(colour: RGB): Lab {
  const r = linearise(colour.r);
  const g = linearise(colour.g);
  const b = linearise(colour.b);

  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883;
  const transform = (value: number) =>
    value > 0.008856451679 ? Math.cbrt(value) : 7.787037037 * value + 16 / 116;
  const fx = transform(x);
  const fy = transform(y);
  const fz = transform(z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function colourDistance(first: RGB, second: RGB): number {
  const a = rgbToLab(first);
  const b = rgbToLab(second);
  return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b);
}

export function rgbDistanceSquared(first: RGB, second: RGB): number {
  return (first.r - second.r) ** 2 + (first.g - second.g) ** 2 + (first.b - second.b) ** 2;
}
