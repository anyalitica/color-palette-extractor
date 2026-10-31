import { normaliseRgb, rgbToLab } from './conversion';
import type { RGB } from '../types';

interface Hsl {
  hue: number;
  saturation: number;
}

const HUE_NAMES: ReadonlyArray<{ end: number; name: string }> = [
  { end: 9, name: 'Red' },
  { end: 20, name: 'Red orange' },
  { end: 36, name: 'Orange' },
  { end: 49, name: 'Amber' },
  { end: 65, name: 'Yellow' },
  { end: 88, name: 'Yellow green' },
  { end: 155, name: 'Green' },
  { end: 180, name: 'Turquoise' },
  { end: 205, name: 'Cyan' },
  { end: 255, name: 'Blue' },
  { end: 285, name: 'Violet' },
  { end: 325, name: 'Purple' },
  { end: 345, name: 'Magenta' },
  { end: 360, name: 'Red' },
];

function rgbToHsl(colour: RGB): Hsl {
  const { r, g, b } = normaliseRgb(colour);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;

  if (delta === 0) return { hue: 0, saturation: 0 };

  let hue: number;
  if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
  else if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
  else hue = 60 * ((red - green) / delta + 4);

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation: delta / (1 - Math.abs(2 * lightness - 1)),
  };
}

function neutralName(perceptualLightness: number): string {
  if (perceptualLightness < 8) return 'Black';
  if (perceptualLightness < 25) return 'Charcoal';
  if (perceptualLightness < 45) return 'Dark grey';
  if (perceptualLightness < 68) return 'Grey';
  if (perceptualLightness < 86) return 'Light grey';
  if (perceptualLightness < 97) return 'Off white';
  return 'White';
}

function lightnessPrefix(perceptualLightness: number): string {
  if (perceptualLightness < 8) return 'Near-black';
  if (perceptualLightness < 24) return 'Very dark';
  if (perceptualLightness < 43) return 'Dark';
  if (perceptualLightness > 88) return 'Very light';
  if (perceptualLightness > 72) return 'Light';
  return '';
}

/**
 * Produces stable, descriptive labels rather than choosing a potentially
 * misleading decorative keyword from a sparse named-colour table.
 */
export function getColourName(colour: RGB): string {
  const { hue, saturation } = rgbToHsl(colour);
  const perceptualLightness = rgbToLab(colour).l;
  if (saturation < 0.12) return neutralName(perceptualLightness);

  const baseName = HUE_NAMES.find(({ end }) => hue < end)?.name ?? 'Red';
  const prefix = lightnessPrefix(perceptualLightness);
  if (prefix) return `${prefix} ${baseName.toLowerCase()}`;
  if (saturation < 0.35) return `Muted ${baseName.toLowerCase()}`;
  return baseName;
}
