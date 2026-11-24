import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function buildUI() {
  console.log('[NgLens] Building Visual UI bundle...');

  const distDir = path.join(rootDir, 'dist', 'ui');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 1. Bundle TypeScript + Cytoscape + Dagre into a single IIFE JS string
  const buildResult = await esbuild.build({
    entryPoints: [path.join(rootDir, 'src', 'ui', 'app.ts')],
    bundle: true,
    format: 'iife',
    globalName: 'NgLensApp',
    write: false,
    minify: true,
    target: ['es2020']
  });

  const bundledJs = buildResult.outputFiles[0].text;
  const cssContent = fs.readFileSync(path.join(rootDir, 'src', 'ui', 'app.css'), 'utf-8');
  const templateHtml = fs.readFileSync(path.join(rootDir, 'src', 'ui', 'index.html'), 'utf-8');

  // 2. Generate template with inlined CSS & JS (with placeholder for data)
  const finalHtmlTemplate = templateHtml
    .replace('/* INJECTED_CSS */', cssContent)
    .replace('/* INJECTED_BUNDLE */', bundledJs);

  const outputPath = path.join(distDir, 'index.html');
  fs.writeFileSync(outputPath, finalHtmlTemplate, 'utf-8');

  console.log(`[NgLens] Visual UI bundle successfully generated at: ${outputPath}`);
}

buildUI().catch((err) => {
  console.error('[NgLens] Build failed:', err);
  process.exit(1);
});
