import { colourDistance, normaliseRgb } from '../colour/conversion';
import type { RGB, WeightedColour } from '../types';

export interface CountedColour extends RGB {
  count: number;
}

export function countColours(pixels: readonly RGB[]): CountedColour[] {
  const counts = new Map<string, CountedColour>();
  for (const pixel of pixels) {
    const key = `${pixel.r},${pixel.g},${pixel.b}`;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { ...pixel, count: 1 });
  }
  return [...counts.values()];
}

export function weightedMean(colours: readonly CountedColour[]): WeightedColour {
  let total = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  for (const colour of colours) {
    total += colour.count;
    r += colour.r * colour.count;
    g += colour.g * colour.count;
    b += colour.b * colour.count;
  }
  const divisor = total || 1;
  return { ...normaliseRgb({ r: r / divisor, g: g / divisor, b: b / divisor }), weight: total };
}

export function selectDistinctColours(
  candidates: readonly WeightedColour[],
  count: number,
  minDistance: number,
): WeightedColour[] {
  const ordered = [...candidates].sort((a, b) => b.weight - a.weight);
  const selected: WeightedColour[] = [];
  const unused: WeightedColour[] = [];

  for (const candidate of ordered) {
    if (selected.length < count && selected.every((colour) => colourDistance(colour, candidate) >= minDistance)) {
      selected.push(candidate);
    } else {
      unused.push(candidate);
    }
  }

  while (selected.length < count && unused.length > 0) {
    let bestIndex = 0;
    let bestDistance = -1;
    for (let index = 0; index < unused.length; index += 1) {
      const candidate = unused[index];
      if (!candidate) continue;
      const distance = selected.length === 0
        ? Number.POSITIVE_INFINITY
        : Math.min(...selected.map((colour) => colourDistance(colour, candidate)));
      if (distance > bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }
    const [next] = unused.splice(bestIndex, 1);
    if (next) selected.push(next);
  }

  return selected.slice(0, count);
}
