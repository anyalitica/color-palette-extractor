import type { ExtractionMode, OutputFormat, RGB, SharedPalette } from '../types';

const modes: ExtractionMode[] = ['natural', 'graphic', 'balanced'];
const formats: OutputFormat[] = ['javascript', 'css', 'json', 'p5js', 'processing', 'glsl'];

function toBase64Url(value: string): string {
  return btoa(value).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function fromBase64Url(value: string): string {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  return atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
}

export function encodeSharedPalette(payload: SharedPalette): string {
  const compact = {
    v: payload.version,
    c: payload.colours.map(({ r, g, b }) => [r, g, b]),
    m: payload.mode,
    n: payload.count,
    d: payload.minDistance,
    f: payload.format,
  };
  return toBase64Url(JSON.stringify(compact));
}

export function decodeSharedPalette(token: string): SharedPalette | null {
  try {
    const value = JSON.parse(fromBase64Url(token)) as Record<string, unknown>;
    if (value.v !== 1 || !modes.includes(value.m as ExtractionMode) || !formats.includes(value.f as OutputFormat)) return null;
    if (!Number.isInteger(value.n) || Number(value.n) < 1 || Number(value.n) > 16) return null;
    if (typeof value.d !== 'number' || value.d < 0 || value.d > 100 || !Array.isArray(value.c)) return null;
    const colours: RGB[] = [];
    for (const candidate of value.c) {
      if (!Array.isArray(candidate) || candidate.length !== 3) return null;
      const [r, g, b] = candidate;
      if (![r, g, b].every((channel) => Number.isInteger(channel) && Number(channel) >= 0 && Number(channel) <= 255)) return null;
      colours.push({ r: Number(r), g: Number(g), b: Number(b) });
    }
    if (colours.length === 0 || colours.length > 16) return null;
    return {
      version: 1,
      colours,
      mode: value.m as ExtractionMode,
      count: Number(value.n),
      minDistance: value.d,
      format: value.f as OutputFormat,
    };
  } catch {
    return null;
  }
}

export function paletteTokenFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/u, ''));
  return params.get('palette');
}
