import { normaliseRgb, rgbDistanceSquared } from '../colour/conversion';
import type { RGB, WeightedColour } from '../types';
import { countColours } from './shared';

interface Centroid extends RGB {
  weight: number;
}

export function extractNatural(pixels: readonly RGB[], count: number): WeightedColour[] {
  const unique = countColours(pixels);
  if (unique.length <= count) {
    return unique
      .map(({ count: weight, ...colour }) => ({ ...colour, weight }))
      .sort((a, b) => b.weight - a.weight);
  }

  const mean = unique.reduce(
    (sum, colour) => ({
      r: sum.r + colour.r * colour.count,
      g: sum.g + colour.g * colour.count,
      b: sum.b + colour.b * colour.count,
    }),
    { r: 0, g: 0, b: 0 },
  );
  const total = pixels.length || 1;
  const average = { r: mean.r / total, g: mean.g / total, b: mean.b / total };
  const first = unique.reduce((best, colour) =>
    rgbDistanceSquared(colour, average) < rgbDistanceSquared(best, average) ? colour : best,
  );
  let centroids: Centroid[] = [{ r: first.r, g: first.g, b: first.b, weight: first.count }];

  while (centroids.length < Math.min(count, unique.length)) {
    const next = unique.reduce((best, colour) => {
      const score = Math.min(...centroids.map((centroid) => rgbDistanceSquared(colour, centroid))) * colour.count;
      const bestScore = Math.min(...centroids.map((centroid) => rgbDistanceSquared(best, centroid))) * best.count;
      return score > bestScore ? colour : best;
    });
    centroids.push({ r: next.r, g: next.g, b: next.b, weight: next.count });
  }

  for (let iteration = 0; iteration < 16; iteration += 1) {
    const groups = centroids.map(() => ({ r: 0, g: 0, b: 0, weight: 0 }));
    for (const colour of unique) {
      let nearest = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      centroids.forEach((centroid, index) => {
        const distance = rgbDistanceSquared(colour, centroid);
        if (distance < nearestDistance) {
          nearest = index;
          nearestDistance = distance;
        }
      });
      const group = groups[nearest];
      if (!group) continue;
      group.r += colour.r * colour.count;
      group.g += colour.g * colour.count;
      group.b += colour.b * colour.count;
      group.weight += colour.count;
    }

    const nextCentroids = groups.map((group, index) => {
      if (group.weight === 0) return centroids[index] as Centroid;
      return {
        ...normaliseRgb({
          r: group.r / group.weight,
          g: group.g / group.weight,
          b: group.b / group.weight,
        }),
        weight: group.weight,
      };
    });
    const stable = nextCentroids.every((centroid, index) =>
      rgbDistanceSquared(centroid, centroids[index] as Centroid) < 1,
    );
    centroids = nextCentroids;
    if (stable) break;
  }

  return centroids.sort((a, b) => b.weight - a.weight);
}
