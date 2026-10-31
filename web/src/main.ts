import './styles.css';
import { rgbToHex } from './colour/conversion';
import type { ExtractionResponse } from './extraction/extraction.worker';
import { createSampleImage, loadImage, type LoadedImage } from './image/load-image';
import { formatColourValue, formatExtension, formatPalette, OUTPUT_FORMATS } from './output/formatters';
import { decodeSharedPalette, encodeSharedPalette, paletteTokenFromHash } from './output/sharing';
import {
  MODE_DEFINITIONS,
  type DisplayFormat,
  type ExtractionMode,
  type OutputFormat,
  type SharedPalette,
  type WeightedColour,
} from './types';

interface AppState {
  image: LoadedImage | null;
  colours: WeightedColour[];
  mode: ExtractionMode;
  count: number;
  minDistance: number;
  format: OutputFormat;
  displayFormat: DisplayFormat;
  codeOpen: boolean;
  busy: boolean;
  error: string;
  notice: string;
  requestId: number;
  sharedOnly: boolean;
}

const appElement = document.querySelector<HTMLDivElement>('#app');
if (!appElement) throw new Error('Application root was not found.');
const app: HTMLDivElement = appElement;

const sharedToken = paletteTokenFromHash(window.location.hash);
const shared = sharedToken ? decodeSharedPalette(sharedToken) : null;
const state: AppState = {
  image: null,
  colours: shared?.colours.map((colour) => ({ ...colour, weight: 0 })) ?? [],
  mode: shared?.mode ?? 'natural',
  count: shared?.count ?? 6,
  minDistance: shared?.minDistance ?? 18,
  format: shared?.format ?? 'javascript',
  displayFormat: shared?.displayFormat ?? 'hex',
  codeOpen: false,
  busy: false,
  error: sharedToken && !shared ? 'That shared palette link is invalid. Start with a new image instead.' : '',
  notice: shared ? 'Shared palette restored — the original image was not included.' : '',
  requestId: 0,
  sharedOnly: Boolean(shared),
};

const worker = new Worker(new URL('./extraction/extraction.worker.ts', import.meta.url), { type: 'module' });
worker.addEventListener('message', ({ data }: MessageEvent<ExtractionResponse>) => {
  if (data.id !== state.requestId) return;
  state.busy = false;
  state.error = data.error ?? '';
  state.colours = data.colours;
  state.sharedOnly = false;
  render();
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/gu, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] ?? character);
}

function outputOptions(): string {
  return OUTPUT_FORMATS.map(({ id, label }) =>
    `<option value="${id}"${state.format === id ? ' selected' : ''}>${label}</option>`,
  ).join('');
}

function modeOptions(): string {
  return MODE_DEFINITIONS.map(({ id, label }) =>
    `<option value="${id}"${state.mode === id ? ' selected' : ''}>${label}</option>`,
  ).join('');
}

function selectedModeDescription(): string {
  return MODE_DEFINITIONS.find(({ id }) => id === state.mode)?.description ?? '';
}

function paletteMarkup(): string {
  if (state.busy && state.colours.length === 0) {
    return `<section class="results-panel result-placeholder" aria-live="polite"><span class="spinner" aria-hidden="true"></span><p>Finding a useful palette…</p></section>`;
  }
  if (state.colours.length === 0) {
    return `
      <section class="results-panel empty-results" aria-label="Palette results">
        <div class="empty-palette-art" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <div><p class="eyebrow">Your palette</p><h2>Colours will appear here</h2><p>Choose an image or try the sample artwork to create a palette.</p></div>
      </section>
    `;
  }
  return `
    <section class="results results-panel" aria-labelledby="palette-heading">
      <div class="section-heading palette-heading">
        <div><p class="eyebrow">Your palette</p><h2 id="palette-heading">${state.colours.length} colours, ready to use</h2></div>
        <div class="palette-actions">
          <div class="format-toggle" role="group" aria-label="Colour value format">
            <button type="button" data-display-format="hex" aria-pressed="${state.displayFormat === 'hex'}">HEX</button>
            <button type="button" data-display-format="rgb" aria-pressed="${state.displayFormat === 'rgb'}">RGB</button>
          </div>
        </div>
      </div>
      <div class="swatches" role="list" aria-label="Extracted colours">
        ${state.colours.map((colour, index) => {
          const hex = rgbToHex(colour);
          const primaryValue = formatColourValue(colour, state.displayFormat);
          const secondaryValue = state.displayFormat === 'hex'
            ? formatColourValue(colour, 'rgb')
            : hex;
          const dark = colour.r * 0.299 + colour.g * 0.587 + colour.b * 0.114 < 145;
          return `<button class="swatch" type="button" role="listitem" data-copy="${primaryValue}" style="--swatch:${hex};--swatch-ink:${dark ? '#fffdf8' : '#24211f'}" aria-label="Copy colour ${index + 1}, ${primaryValue}">
            <span class="swatch-index">${String(index + 1).padStart(2, '0')}</span>
            <span><strong>${primaryValue}</strong><small>${secondaryValue}</small></span>
          </button>`;
        }).join('')}
      </div>
      <details class="code-disclosure"${state.codeOpen ? ' open' : ''}>
        <summary>
          <span><strong>Code output</strong><small>${OUTPUT_FORMATS.find(({ id }) => id === state.format)?.label ?? 'Code'} · ${state.displayFormat.toUpperCase()}</small></span>
          <span class="disclosure-action">Open</span>
        </summary>
        <div class="code-panel">
          <div class="code-toolbar">
            <label for="output-format">Code format · ${state.displayFormat.toUpperCase()}</label>
            <select id="output-format">${outputOptions()}</select>
            <button class="button button-small" id="copy-code" type="button">Copy snippet</button>
            <button class="icon-button" id="download-code" type="button" aria-label="Download palette code" title="Download palette code">↓</button>
          </div>
          <pre tabindex="0"><code>${escapeHtml(formatPalette(state.colours, state.format, state.displayFormat))}</code></pre>
          <div class="share-row">
            <p>Share the colours and settings — never the source image.</p>
            <button class="text-button" id="share-palette" type="button">Copy share link</button>
          </div>
        </div>
      </details>
    </section>
  `;
}

function uploadMarkup(compact = false): string {
  return `
    <div class="upload-zone${compact ? ' upload-zone-compact' : ''}" id="drop-zone">
      <input class="visually-hidden" id="image-input" type="file" accept="image/*" />
      <div class="upload-icon" aria-hidden="true"><span></span><span></span><span></span></div>
      <div>
        <h2>${compact ? 'Use a new image' : 'Drop an image here'}</h2>
        <p>or paste one from your clipboard</p>
      </div>
      <div class="upload-actions">
        <label class="button" for="image-input">Choose image</label>
        <button class="text-button" id="sample-image" type="button">Try sample artwork</button>
      </div>
      <small>PNG, JPEG, WebP and other browser-supported images</small>
    </div>
  `;
}

function sourceMarkup(): string {
  if (!state.image) return `<section class="source-panel">${uploadMarkup(state.sharedOnly)}</section>`;
  return `
    <section class="source-panel" aria-label="Source image and extraction controls">
      <div class="preview-panel">
        <div class="image-frame"><img src="${state.image.previewUrl}" alt="Preview of ${escapeHtml(state.image.name)}" /></div>
        <div class="image-meta">
          <div><strong>${escapeHtml(state.image.name)}</strong><small>${state.image.width} × ${state.image.height} processing preview</small></div>
          <label class="text-button" for="image-input">Replace</label>
          <button class="text-button" id="remove-image" type="button">Start over</button>
          <input class="visually-hidden" id="image-input" type="file" accept="image/*" />
        </div>
      </div>
      <div class="control-bar" aria-label="Extraction controls">
        <div class="compact-control count-stepper">
          <span class="control-label">Colours</span>
          <div><button type="button" data-count-step="-1" aria-label="Use one fewer colour"${state.count <= 2 ? ' disabled' : ''}>−</button><output aria-live="polite">${state.count}</output><button type="button" data-count-step="1" aria-label="Use one more colour"${state.count >= 12 ? ' disabled' : ''}>+</button></div>
        </div>
        <label class="compact-control style-control" for="mode-select"><span class="control-label">Style</span><select id="mode-select">${modeOptions()}</select></label>
        <details class="compact-advanced">
          <summary>Adjustments</summary>
          <div class="adjustment-popover">
            <label for="distance">Colour distinctness</label>
            <select id="distance">
              <option value="8"${state.minDistance === 8 ? ' selected' : ''}>Subtle — preserve close shades</option>
              <option value="18"${state.minDistance === 18 ? ' selected' : ''}>Balanced — noticeably different</option>
              <option value="30"${state.minDistance === 30 ? ' selected' : ''}>Bold — maximise contrast</option>
            </select>
            <p>Transparent pixels are ignored; translucent pixels are composited on white.</p>
          </div>
        </details>
      </div>
      <p class="mode-note"><strong>${MODE_DEFINITIONS.find(({ id }) => id === state.mode)?.label}:</strong> ${selectedModeDescription()}</p>
    </section>
  `;
}

function render(): void {
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="./" aria-label="Colour Palette Extractor home">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>Colour Palette Extractor</span>
      </a>
      <div class="header-actions">
        <button class="info-button" id="open-info" type="button"><span aria-hidden="true">i</span><strong>How it works</strong></button>
        <a class="source-link" href="https://github.com/anyalitica/color-palette-extractor">View source <span aria-hidden="true">↗</span></a>
      </div>
    </header>
    <main id="workspace" class="page-shell">
      <section class="intro" aria-labelledby="page-title">
        <h1 id="page-title">Find the colours worth keeping.</h1>
        <p class="lede">Build a colour palette from any image, then copy it straight into your sketch. Everything stays in your browser.</p>
      </section>
      <section class="workspace-card two-panel-workspace" aria-label="Palette extraction workspace">
        ${state.error ? `<div class="message error" role="alert">${escapeHtml(state.error)}</div>` : ''}
        ${state.sharedOnly && state.notice ? `<div class="message" role="status">${escapeHtml(state.notice)}</div>` : ''}
        ${sourceMarkup()}
        ${paletteMarkup()}
      </section>
    </main>
    <footer>
      <p>
        Designed for creative coding by
        <a
          href="https://github.com/anyalitica/color-palette-extractor"
          target="_blank"
          rel="noopener noreferrer"
        >@Anyalitica</a>
      </p>
      <p>Private by default · Open source</p>
    </footer>
    <dialog class="info-dialog" id="info-dialog" aria-labelledby="info-title">
      <div class="dialog-heading">
        <div><p class="eyebrow">Behind the palette</p><h2 id="info-title">How extraction works</h2></div>
        <button class="dialog-close" id="close-info" type="button" aria-label="Close information">×</button>
      </div>
      <section>
        <h3>Why 2–12 colours?</h3>
        <p>Two supports focused duotone work, while twelve keeps the swatches and code useful instead of filling them with tiny shade variations. This is a design choice rather than a technical limit; the engine itself supports up to sixteen colours.</p>
      </section>
      <section>
        <h3>Before extraction</h3>
        <ol>
          <li>The browser decodes and resizes the image to a maximum dimension of 800 pixels.</li>
          <li>Up to 50,000 pixels are sampled deterministically.</li>
          <li>Fully transparent pixels are ignored; translucent pixels are composited on white.</li>
          <li>The chosen method generates extra candidates so similar colours can be removed without shrinking the palette.</li>
        </ol>
      </section>
      <div class="algorithm-guide">
        <article><p class="guide-number">01</p><h3>Natural</h3><p>Deterministic K-means finds representative centres within continuous colour variation. It starts near the image average, adds frequent colours far from existing centres, then repeatedly assigns pixels and recalculates weighted centres until the result stabilises. Best for photographs.</p></article>
        <article><p class="guide-number">02</p><h3>Graphic</h3><p>A weighted histogram groups RGB values into 4,096 possible buckets, counts their pixels, and averages the real colours inside each bucket. The most populated groups become the candidates. Best for logos, posters, screenshots, and flat artwork.</p></article>
        <article><p class="guide-number">03</p><h3>Balanced</h3><p>Population-aware median cut repeatedly chooses the colour box with the strongest combination of range and population, then splits it along its widest channel at the weighted median. This spreads the palette across the image and works for any requested count.</p></article>
      </div>
      <section>
        <h3>After extraction</h3>
        <p>All candidates are compared in perceptual Lab space. Similar colours are skipped, then unused candidates are backfilled by distance when needed. This encourages clear separation without unnecessarily returning fewer colours than requested.</p>
      </section>
    </dialog>
    <div class="toast" role="status" aria-live="polite">${escapeHtml(state.notice)}</div>
  `;
  bindEvents();
}

function requestExtraction(): void {
  if (!state.image) return;
  state.busy = true;
  state.error = '';
  state.notice = '';
  state.requestId += 1;
  const transferable = state.image.pixels.slice();
  worker.postMessage({
    id: state.requestId,
    pixels: transferable,
    options: { mode: state.mode, count: state.count, minDistance: state.minDistance },
  }, [transferable.buffer]);
  render();
}

async function useImage(source: File | 'sample'): Promise<void> {
  state.busy = true;
  state.error = '';
  state.notice = '';
  state.colours = [];
  render();
  try {
    state.image = source === 'sample' ? await createSampleImage() : await loadImage(source);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    requestExtraction();
  } catch (error) {
    state.busy = false;
    state.error = error instanceof Error ? error.message : 'The image could not be opened.';
    render();
  }
}

async function copyText(value: string, message: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const area = document.createElement('textarea');
    area.value = value;
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  state.notice = message;
  render();
  window.setTimeout(() => {
    if (state.notice === message) {
      state.notice = '';
      render();
    }
  }, 1800);
}

function bindEvents(): void {
  const input = document.querySelector<HTMLInputElement>('#image-input');
  input?.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void useImage(file);
  });
  document.querySelector('#sample-image')?.addEventListener('click', () => void useImage('sample'));

  const dropZone = document.querySelector<HTMLElement>('#drop-zone');
  dropZone?.addEventListener('dragover', (event) => { event.preventDefault(); dropZone.classList.add('is-dragging'); });
  dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('is-dragging'));
  dropZone?.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) void useImage(file);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-count-step]').forEach((control) => control.addEventListener('click', () => {
    state.count = Math.max(2, Math.min(12, state.count + Number(control.dataset.countStep)));
    requestExtraction();
  }));
  document.querySelector<HTMLSelectElement>('#mode-select')?.addEventListener('change', (event) => {
    state.mode = (event.target as HTMLSelectElement).value as ExtractionMode;
    requestExtraction();
  });
  document.querySelector<HTMLSelectElement>('#distance')?.addEventListener('change', (event) => {
    state.minDistance = Number((event.target as HTMLSelectElement).value);
    requestExtraction();
  });
  document.querySelector<HTMLSelectElement>('#output-format')?.addEventListener('change', (event) => {
    state.format = (event.target as HTMLSelectElement).value as OutputFormat;
    state.codeOpen = true;
    render();
  });
  document.querySelectorAll<HTMLButtonElement>('[data-display-format]').forEach((control) => control.addEventListener('click', () => {
    state.displayFormat = control.dataset.displayFormat as DisplayFormat;
    render();
  }));
  const infoDialog = document.querySelector<HTMLDialogElement>('#info-dialog');
  document.querySelector('#open-info')?.addEventListener('click', () => infoDialog?.showModal());
  document.querySelector('#close-info')?.addEventListener('click', () => infoDialog?.close());
  infoDialog?.addEventListener('click', (event) => {
    if (event.target === infoDialog) infoDialog.close();
  });
  document.querySelector<HTMLDetailsElement>('.code-disclosure')?.addEventListener('toggle', (event) => {
    state.codeOpen = (event.currentTarget as HTMLDetailsElement).open;
  });
  document.querySelectorAll<HTMLElement>('[data-copy]').forEach((swatch) => swatch.addEventListener('click', () => {
    const value = swatch.dataset.copy;
    if (value) void copyText(value, `${value} copied`);
  }));
  document.querySelector('#copy-code')?.addEventListener('click', () =>
    void copyText(formatPalette(state.colours, state.format, state.displayFormat), 'Code snippet copied'),
  );
  document.querySelector('#download-code')?.addEventListener('click', () => {
    const blob = new Blob([formatPalette(state.colours, state.format, state.displayFormat)], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `colour-palette.${formatExtension(state.format)}`;
    link.click();
    URL.revokeObjectURL(link.href);
  });
  document.querySelector('#share-palette')?.addEventListener('click', () => {
    const payload: SharedPalette = {
      version: 1,
      colours: state.colours,
      mode: state.mode,
      count: state.count,
      minDistance: state.minDistance,
      format: state.format,
      displayFormat: state.displayFormat,
    };
    const url = new URL(window.location.href);
    url.hash = `palette=${encodeSharedPalette(payload)}`;
    window.history.replaceState(null, '', url);
    void copyText(url.toString(), 'Share link copied');
  });
  document.querySelector('#remove-image')?.addEventListener('click', () => {
    state.image = null;
    state.colours = [];
    state.error = '';
    state.notice = '';
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    render();
  });
}

window.addEventListener('paste', (event) => {
  const file = [...event.clipboardData?.files ?? []].find((candidate) => candidate.type.startsWith('image/'));
  if (file) void useImage(file);
});

render();
