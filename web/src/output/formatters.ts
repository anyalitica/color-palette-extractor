import { normaliseRgb, rgbToHex } from '../colour/conversion';
import type { DisplayFormat, OutputFormat, RGB } from '../types';

export const OUTPUT_FORMATS: ReadonlyArray<{ id: OutputFormat; label: string; extension: string }> = [
  { id: 'javascript', label: 'JavaScript', extension: 'js' },
  { id: 'css', label: 'CSS variables', extension: 'css' },
  { id: 'json', label: 'JSON', extension: 'json' },
  { id: 'p5js', label: 'p5.js', extension: 'js' },
  { id: 'processing', label: 'Processing', extension: 'pde' },
  { id: 'glsl', label: 'GLSL', extension: 'glsl' },
];

const quotedHex = (colours: readonly RGB[]) => colours.map((colour) => `'${rgbToHex(colour)}'`).join(', ');

export function formatColourValue(colour: RGB, format: DisplayFormat): string {
  if (format === 'hex') return rgbToHex(colour);
  const { r, g, b } = normaliseRgb(colour);
  return `rgb(${r}, ${g}, ${b})`;
}

export function formatPalette(colours: readonly RGB[], format: OutputFormat): string {
  switch (format) {
    case 'javascript':
      return `export const palette = [${quotedHex(colours)}];`;
    case 'p5js':
      return `const palette = [${quotedHex(colours)}];\n\n// Example: fill(random(palette));`;
    case 'css':
      return `:root {\n${colours.map((colour, index) => `  --colour-${index + 1}: ${rgbToHex(colour)};`).join('\n')}\n}`;
    case 'json':
      return JSON.stringify(colours.map((colour) => {
        const rgb = normaliseRgb(colour);
        return { hex: rgbToHex(rgb), rgb: [rgb.r, rgb.g, rgb.b] };
      }), null, 2);
    case 'processing':
      return `color[] palette = { ${colours.map(rgbToHex).join(', ')} };`;
    case 'glsl':
      return `const vec3 palette[${colours.length}] = vec3[](\n${colours.map((colour) => {
        const { r, g, b } = normaliseRgb(colour);
        return `  vec3(${(r / 255).toFixed(3)}, ${(g / 255).toFixed(3)}, ${(b / 255).toFixed(3)})`;
      }).join(',\n')}\n);`;
  }
}

export function formatExtension(format: OutputFormat): string {
  return OUTPUT_FORMATS.find((option) => option.id === format)?.extension ?? 'txt';
}
