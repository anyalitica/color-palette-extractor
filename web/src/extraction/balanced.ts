import type { RGB, WeightedColour } from '../types';
import { countColours, type CountedColour, weightedMean } from './shared';

type Channel = 'r' | 'g' | 'b';

interface ColourBox {
  colours: CountedColour[];
  score: number;
}

function createBox(colours: CountedColour[]): ColourBox {
  const ranges = (['r', 'g', 'b'] as const).map((channel) => {
    const values = colours.map((colour) => colour[channel]);
    return Math.max(...values) - Math.min(...values);
  });
  const population = colours.reduce((sum, colour) => sum + colour.count, 0);
  return { colours, score: Math.max(...ranges) * population };
}

function widestChannel(colours: readonly CountedColour[]): Channel {
  return (['r', 'g', 'b'] as const).reduce((widest, channel) => {
    const range = Math.max(...colours.map((colour) => colour[channel]))
      - Math.min(...colours.map((colour) => colour[channel]));
    const widestRange = Math.max(...colours.map((colour) => colour[widest]))
      - Math.min(...colours.map((colour) => colour[widest]));
    return range > widestRange ? channel : widest;
  }, 'r' as Channel);
}

function splitBox(box: ColourBox): [ColourBox, ColourBox] | null {
  if (box.colours.length < 2) return null;
  const channel = widestChannel(box.colours);
  const ordered = [...box.colours].sort((a, b) => a[channel] - b[channel]);
  const total = ordered.reduce((sum, colour) => sum + colour.count, 0);
  let running = 0;
  let splitIndex = 1;
  for (let index = 0; index < ordered.length - 1; index += 1) {
    running += ordered[index]?.count ?? 0;
    splitIndex = index + 1;
    if (running >= total / 2) break;
  }
  return [createBox(ordered.slice(0, splitIndex)), createBox(ordered.slice(splitIndex))];
}

export function extractBalanced(pixels: readonly RGB[], count: number): WeightedColour[] {
  const unique = countColours(pixels);
  if (unique.length === 0) return [];
  const boxes = [createBox(unique)];

  while (boxes.length < Math.min(count, unique.length)) {
    boxes.sort((a, b) => b.score - a.score);
    const index = boxes.findIndex((box) => box.colours.length > 1);
    if (index < 0) break;
    const [box] = boxes.splice(index, 1);
    if (!box) break;
    const split = splitBox(box);
    if (!split) {
      boxes.push(box);
      break;
    }
    boxes.push(...split);
  }

  return boxes.map((box) => weightedMean(box.colours)).sort((a, b) => b.weight - a.weight);
}
