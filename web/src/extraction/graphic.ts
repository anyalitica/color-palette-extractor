import { normaliseRgb } from '../colour/conversion';
import type { RGB, WeightedColour } from '../types';

interface Bucket {
  r: number;
  g: number;
  b: number;
  count: number;
}

export function extractGraphic(pixels: readonly RGB[], count: number): WeightedColour[] {
  const buckets = new Map<number, Bucket>();
  for (const pixel of pixels) {
    const key = (pixel.r >> 4) << 8 | (pixel.g >> 4) << 4 | (pixel.b >> 4);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
    bucket.r += pixel.r;
    bucket.g += pixel.g;
    bucket.b += pixel.b;
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, count)
    .map((bucket) => ({
      ...normaliseRgb({
        r: bucket.r / bucket.count,
        g: bucket.g / bucket.count,
        b: bucket.b / bucket.count,
      }),
      weight: bucket.count,
    }));
}
