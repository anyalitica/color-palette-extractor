import { clampChannel } from '../colour/conversion';
import type { RGB } from '../types';

export interface PixelOptions {
  alphaThreshold?: number;
  background?: RGB;
  maxSamples?: number;
}

export function pixelsFromRgba(data: Uint8ClampedArray, options: PixelOptions = {}): RGB[] {
  const alphaThreshold = options.alphaThreshold ?? 8;
  const background = options.background ?? { r: 255, g: 255, b: 255 };
  const available = Math.floor(data.length / 4);
  const maxSamples = Math.max(1, options.maxSamples ?? 50_000);
  const stride = Math.max(1, Math.ceil(available / maxSamples));
  const pixels: RGB[] = [];

  for (let pixelIndex = 0; pixelIndex < available; pixelIndex += stride) {
    const offset = pixelIndex * 4;
    const alphaByte = data[offset + 3] ?? 0;
    if (alphaByte < alphaThreshold) continue;

    const alpha = alphaByte / 255;
    const r = data[offset] ?? 0;
    const g = data[offset + 1] ?? 0;
    const b = data[offset + 2] ?? 0;
    pixels.push({
      r: clampChannel(r * alpha + background.r * (1 - alpha)),
      g: clampChannel(g * alpha + background.g * (1 - alpha)),
      b: clampChannel(b * alpha + background.b * (1 - alpha)),
    });
  }

  return pixels;
}
