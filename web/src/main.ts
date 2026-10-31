import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Application root was not found.');
}

app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="./" aria-label="Colour Palette Extractor home">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
      <span>Colour Palette Extractor</span>
    </a>
    <a class="github-link" href="https://github.com/anyalitica/color-extractor-app">View source</a>
  </header>
  <main id="workspace" class="page-shell">
    <section class="intro" aria-labelledby="page-title">
      <p class="eyebrow">Image to creative code</p>
      <h1 id="page-title">Find the colours<br />worth keeping.</h1>
      <p class="lede">Build a thoughtful palette from any image, then copy it straight into your sketch. Everything stays in your browser.</p>
    </section>
    <section class="workspace-card" aria-label="Palette extraction workspace">
      <div class="empty-state">
        <div class="empty-art" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
        <p class="eyebrow">Workspace ready</p>
        <h2>Drop an image to begin</h2>
        <p>The extraction engine and interactive controls arrive in the next implementation stage.</p>
      </div>
    </section>
  </main>
  <footer>
    <p>Designed for creative coding. Processed locally.</p>
  </footer>
`;
