import colourNames from 'color-name';
import { colourDistance } from './conversion';
import type { RGB } from '../types';

interface NamedColour extends RGB {
  name: string;
}

const WORDS = [
  'aquamarine', 'goldenrod', 'cornflower', 'chartreuse', 'blanched', 'lavender', 'turquoise',
  'chocolate', 'firebrick', 'honeydew', 'moccasin', 'papaya', 'seashell', 'burlywood',
  'medium', 'antique', 'midnight', 'spring', 'slate', 'smoke', 'whip', 'almond', 'peach',
  'powder', 'rebecca', 'saddle', 'salmon', 'sandy', 'alice', 'cadet', 'dodger', 'floral',
  'forest', 'fuchsia', 'gainsboro', 'ghost', 'indian', 'ivory', 'khaki', 'lemon', 'linen',
  'magenta', 'misty', 'navajo', 'orchid', 'peru', 'plum', 'rosy', 'royal', 'sienna',
  'thistle', 'tomato', 'wheat', 'azure', 'bisque', 'coral', 'crimson', 'indigo', 'maroon',
  'silver', 'violet', 'yellow', 'purple', 'orange', 'white', 'black', 'brown', 'green',
  'blue', 'cyan', 'gray', 'grey', 'olive', 'pink', 'red', 'aqua', 'beige', 'gold', 'lime',
  'navy', 'teal', 'dark', 'deep', 'dim', 'hot', 'light', 'old', 'pale', 'sea', 'sky', 'steel',
].sort((first, second) => second.length - first.length);

function readableName(value: string): string {
  const parts: string[] = [];
  let remainder = value;
  while (remainder) {
    const word = WORDS.find((candidate) => remainder.startsWith(candidate));
    if (!word) {
      parts.push(remainder);
      break;
    }
    parts.push(word);
    remainder = remainder.slice(word.length);
  }
  const label = parts.join(' ');
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

const NAMED_COLOURS: readonly NamedColour[] = Object.entries(colourNames).map(([name, [r, g, b]]) => ({
  name: readableName(name),
  r,
  g,
  b,
}));

export function getColourName(colour: RGB): string {
  return NAMED_COLOURS.reduce((closest, candidate) =>
    colourDistance(colour, candidate) < colourDistance(colour, closest) ? candidate : closest,
  ).name;
}
