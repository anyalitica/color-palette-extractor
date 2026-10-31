export type ExtractionMode = 'natural' | 'graphic' | 'balanced';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface WeightedColour extends RGB {
  weight: number;
}

export interface ExtractionOptions {
  mode: ExtractionMode;
  count: number;
  minDistance: number;
}

export type OutputFormat = 'javascript' | 'css' | 'json' | 'p5js' | 'processing' | 'glsl';

export interface SharedPalette {
  version: 1;
  colours: RGB[];
  mode: ExtractionMode;
  count: number;
  minDistance: number;
  format: OutputFormat;
}

export interface ModeDefinition {
  id: ExtractionMode;
  label: string;
  description: string;
}

export const MODE_DEFINITIONS: readonly ModeDefinition[] = [
  { id: 'natural', label: 'Natural', description: 'Faithful colours for photographs' },
  { id: 'graphic', label: 'Graphic', description: 'Dominant colours from flat artwork' },
  { id: 'balanced', label: 'Balanced', description: 'A wider range from across the image' },
];
