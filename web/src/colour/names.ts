import { colourDistance } from './conversion';
import type { RGB } from '../types';

interface NamedColour extends RGB {
  name: string;
}

const NAMED_COLOURS: readonly NamedColour[] = [
  { name: 'Black', r: 0, g: 0, b: 0 },
  { name: 'Charcoal', r: 54, g: 69, b: 79 },
  { name: 'Slate', r: 112, g: 128, b: 144 },
  { name: 'Grey', r: 128, g: 128, b: 128 },
  { name: 'Silver', r: 192, g: 192, b: 192 },
  { name: 'White', r: 255, g: 255, b: 255 },
  { name: 'Cream', r: 255, g: 253, b: 208 },
  { name: 'Beige', r: 222, g: 205, b: 164 },
  { name: 'Sand', r: 194, g: 178, b: 128 },
  { name: 'Brown', r: 139, g: 69, b: 19 },
  { name: 'Chocolate', r: 123, g: 63, b: 0 },
  { name: 'Maroon', r: 128, g: 0, b: 0 },
  { name: 'Red', r: 220, g: 20, b: 60 },
  { name: 'Coral', r: 255, g: 127, b: 80 },
  { name: 'Salmon', r: 250, g: 128, b: 114 },
  { name: 'Orange', r: 255, g: 128, b: 0 },
  { name: 'Amber', r: 255, g: 191, b: 0 },
  { name: 'Gold', r: 212, g: 175, b: 55 },
  { name: 'Yellow', r: 255, g: 235, b: 59 },
  { name: 'Lime', r: 160, g: 220, b: 60 },
  { name: 'Olive', r: 128, g: 128, b: 0 },
  { name: 'Green', r: 34, g: 139, b: 34 },
  { name: 'Forest', r: 22, g: 92, b: 61 },
  { name: 'Mint', r: 152, g: 255, b: 152 },
  { name: 'Teal', r: 0, g: 128, b: 128 },
  { name: 'Cyan', r: 0, g: 200, b: 210 },
  { name: 'Sky blue', r: 135, g: 206, b: 235 },
  { name: 'Blue', r: 30, g: 100, b: 220 },
  { name: 'Navy', r: 0, g: 0, b: 128 },
  { name: 'Indigo', r: 75, g: 0, b: 130 },
  { name: 'Purple', r: 128, g: 0, b: 128 },
  { name: 'Violet', r: 138, g: 43, b: 226 },
  { name: 'Lavender', r: 190, g: 170, b: 230 },
  { name: 'Magenta', r: 220, g: 30, b: 180 },
  { name: 'Pink', r: 255, g: 160, b: 190 },
  { name: 'Rose', r: 194, g: 30, b: 86 },
];

export function getColourName(colour: RGB): string {
  return NAMED_COLOURS.reduce((closest, candidate) =>
    colourDistance(colour, candidate) < colourDistance(colour, closest) ? candidate : closest,
  ).name;
}
