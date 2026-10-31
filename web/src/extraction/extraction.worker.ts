import { extractPalette } from './index';
import type { ExtractionOptions, RGB, WeightedColour } from '../types';

interface ExtractionRequest {
  id: number;
  pixels: Uint8Array;
  options: ExtractionOptions;
}

export interface ExtractionResponse {
  id: number;
  colours: WeightedColour[];
  error?: string;
}

const workerScope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<ExtractionRequest>) => void) | null;
  postMessage: (response: ExtractionResponse) => void;
};

workerScope.onmessage = ({ data }: MessageEvent<ExtractionRequest>) => {
  try {
    const pixels: RGB[] = [];
    for (let index = 0; index + 2 < data.pixels.length; index += 3) {
      pixels.push({
        r: data.pixels[index] ?? 0,
        g: data.pixels[index + 1] ?? 0,
        b: data.pixels[index + 2] ?? 0,
      });
    }
    workerScope.postMessage({ id: data.id, colours: extractPalette(pixels, data.options) });
  } catch (error) {
    workerScope.postMessage({
      id: data.id,
      colours: [],
      error: error instanceof Error ? error.message : 'Palette extraction failed.',
    });
  }
};
