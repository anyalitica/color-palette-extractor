import type { ExtractionOptions, RGB, WeightedColour } from '../types';
import { extractBalanced } from './balanced';
import { extractGraphic } from './graphic';
import { extractNatural } from './natural';
import { countColours, selectDistinctColours } from './shared';

export function extractPalette(pixels: readonly RGB[], options: ExtractionOptions): WeightedColour[] {
  if (pixels.length === 0) return [];
  const count = Math.max(1, Math.min(16, Math.round(options.count)));
  const candidateCount = Math.min(48, Math.max(count, count * 3));
  let candidates: WeightedColour[];

  switch (options.mode) {
    case 'natural':
      candidates = extractNatural(pixels, candidateCount);
      break;
    case 'graphic':
      candidates = extractGraphic(pixels, candidateCount);
      break;
    case 'balanced':
      candidates = extractBalanced(pixels, candidateCount);
      break;
  }

  if (candidates.length < count) {
    const existing = new Set(candidates.map(({ r, g, b }) => `${r},${g},${b}`));
    const sourceColours = countColours(pixels)
      .sort((a, b) => b.count - a.count)
      .map(({ count: weight, ...colour }) => ({ ...colour, weight }));
    for (const colour of sourceColours) {
      const key = `${colour.r},${colour.g},${colour.b}`;
      if (!existing.has(key)) {
        candidates.push(colour);
        existing.add(key);
      }
      if (candidates.length >= candidateCount) break;
    }
  }

  return selectDistinctColours(candidates, count, Math.max(0, options.minDistance));
}
