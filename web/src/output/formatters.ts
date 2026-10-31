import { normaliseRgb, rgbToHex } from '../colour/conversion';
import { getColourName } from '../colour/names';
import type { DisplayFormat, OutputFormat, RGB } from '../types';

export const OUTPUT_FORMATS: ReadonlyArray<{ id: OutputFormat; label: string; extension: string }> = [
  { id: 'javascript', label: 'JavaScript', extension: 'js' },
  { id: 'css', label: 'CSS variables', extension: 'css' },
  { id: 'json', label: 'JSON', extension: 'json' },
  { id: 'p5js', label: 'p5.js', extension: 'js' },
  { id: 'processing', label: 'Processing', extension: 'pde' },
  { id: 'glsl', label: 'GLSL', extension: 'glsl' },
];

export function formatColourValue(colour: RGB, format: DisplayFormat): string {
  if (format === 'hex') return rgbToHex(colour);
  const { r, g, b } = normaliseRgb(colour);
  return `rgb(${r}, ${g}, ${b})`;
}

function comment(colour: RGB, index: number): string {
  return `Colour ${index + 1}: ${getColourName(colour)}`;
}

function comma(index: number, length: number): string {
  return index < length - 1 ? ',' : '';
}

function javascriptPalette(colours: readonly RGB[], displayFormat: DisplayFormat, prefix = ''): string {
  const values = colours.map((colour, index) =>
    `  '${formatColourValue(colour, displayFormat)}'${comma(index, colours.length)} // ${comment(colour, index)}`,
  );
  return `${prefix}const palette = [\n${values.join('\n')}\n];`;
}

function glslPalette(colours: readonly RGB[], displayFormat: DisplayFormat): string {
  if (displayFormat === 'hex') {
    const values = colours.map((colour, index) =>
      `  ${rgbToHex(colour).replace('#', '0x')}u${comma(index, colours.length)} // ${comment(colour, index)}`,
    );
    return `const uint palette[${colours.length}] = uint[](\n${values.join('\n')}\n);\n\nvec3 colourFromHex(uint hexValue) {\n  return vec3(\n    float((hexValue >> 16) & 0xffu),\n    float((hexValue >> 8) & 0xffu),\n    float(hexValue & 0xffu)\n  ) / 255.0;\n}`;
  }
  const values = colours.map((colour, index) => {
    const { r, g, b } = normaliseRgb(colour);
    return `  vec3(${(r / 255).toFixed(3)}, ${(g / 255).toFixed(3)}, ${(b / 255).toFixed(3)})${comma(index, colours.length)} // ${comment(colour, index)}`;
  });
  return `const vec3 palette[${colours.length}] = vec3[](\n${values.join('\n')}\n);`;
}

export function formatPalette(
  colours: readonly RGB[],
  format: OutputFormat,
  displayFormat: DisplayFormat = 'hex',
): string {
  switch (format) {
    case 'javascript':
      return javascriptPalette(colours, displayFormat, 'export ');
    case 'p5js':
      return `${javascriptPalette(colours, displayFormat)}\n\n// Example: fill(random(palette));`;
    case 'css':
      return `:root {\n${colours.map((colour, index) =>
        `  --colour-${index + 1}: ${formatColourValue(colour, displayFormat)}; /* ${comment(colour, index)} */`,
      ).join('\n')}\n}`;
    case 'json':
      return JSON.stringify(colours.map((colour, index) => ({
        name: getColourName(colour),
        value: formatColourValue(colour, displayFormat),
        index: index + 1,
      })), null, 2);
    case 'processing':
      return `color[] palette = {\n${colours.map((colour, index) => {
        const value = displayFormat === 'hex'
          ? rgbToHex(colour)
          : `color(${normaliseRgb(colour).r}, ${normaliseRgb(colour).g}, ${normaliseRgb(colour).b})`;
        return `  ${value}${comma(index, colours.length)} // ${comment(colour, index)}`;
      }).join('\n')}\n};`;
    case 'glsl':
      return glslPalette(colours, displayFormat);
  }
}

export function formatExtension(format: OutputFormat): string {
  return OUTPUT_FORMATS.find((option) => option.id === format)?.extension ?? 'txt';
}
