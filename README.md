# Colour Palette Extractor

A browser-based tool for turning an image into a useful colour palette and ready-to-copy creative code.

**[Try the browser app](https://anyalitica.github.io/color-palette-extractor/)**

The original Streamlit version remains available from the `streamlit-v1` tag and in the `streamlit/` directory.

## Why static v2

The original app proved the concept, but its seven algorithms, server-side session state, and large single-file interface made a simple creative workflow harder to understand and maintain.

Static v2 is designed around four steps:

1. Drop, choose, paste, or link to an image.
2. Choose how the palette should feel.
3. Adjust the number and distinctness of colours.
4. Copy the palette directly into a creative-coding project.

Image processing happens locally in the browser. Local image bytes are never uploaded or included in shared palette links; linked images are fetched directly by the browser when their host permits it.

## Features

- Three result-oriented extraction modes
- Deterministic browser-side image processing
- Perceptual colour filtering in Lab space
- Transparent-pixel handling and large-image downsampling
- Responsive, keyboard-accessible interface
- Automatic system theme with persistent Light and Dark overrides
- Local file, clipboard, drag-and-drop, and direct image-link input
- Click-to-copy colour swatches
- Live HEX/RGB swatch toggle without re-extraction
- HEX- or RGB-consistent snippets with systematic, perceptual colour-name annotations
- Built-in guide explaining preprocessing and each extraction method
- JavaScript, CSS, JSON, p5.js, Processing, and GLSL output
- Downloadable code snippets
- Shareable URL fragments containing palette data, not images
- Sample artwork for quick experimentation

## Extraction modes

| Mode | Method | Best for |
|:---|:---|:---|
| **Natural** | Deterministic K-means | Photographs and gradual colour variation |
| **Graphic** | Weighted quantised histogram | Logos, illustrations, and flat artwork |
| **Balanced** | Population-aware median cut | A broader range from across an image |

Every mode produces weighted candidates. A shared post-processing step filters perceptually similar colours, backfills from unused candidates when possible, and sorts the result consistently.

## Project structure

```text
.
├── web/                         # Static v2 Vite and TypeScript app
│   ├── src/
│   │   ├── colour/              # Colour conversion and Lab distance
│   │   ├── extraction/          # Three algorithms and Web Worker
│   │   ├── image/               # Browser decoding and pixel preparation
│   │   ├── output/              # Code formatters and URL sharing
│   │   ├── main.ts              # Application state and interface
│   │   └── styles.css
│   └── tests/
├── streamlit/                   # Original v1 implementation
└── .github/workflows/           # Tests, build, and Pages deployment
```

## Local development

Node.js 20 or newer is required.

```bash
git clone https://github.com/anyalitica/color-palette-extractor.git
cd color-palette-extractor/web
npm ci --legacy-peer-deps
npm run dev
```

The development server prints its local URL.

## Verification

Run the same checks used before each staged merge:

```bash
cd web
npm run typecheck
npm run test:run
npm run build
```

Tests cover deterministic extraction, non-power-of-two palette sizes, similarity backfilling, transparent pixels, colour conversion, code output, and shared-state validation.

## Deployment

The GitHub Actions workflow builds `web/` and publishes `web/dist/` to GitHub Pages after changes reach `main`. Vite uses relative asset paths so the app works at the repository URL:

`https://anyalitica.github.io/color-palette-extractor/`

GitHub Pages must use **GitHub Actions** as its build source in the repository settings before the first deployment.

## Original Streamlit app

The original application can still be run locally:

```bash
cd streamlit
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

The `streamlit-v1` Git tag preserves the exact pre-migration state.

## License

This project is licensed under the [MIT License](LICENSE).

## Author

Designed and developed by [Anya Prosvetova](https://anyalitica.dev).
