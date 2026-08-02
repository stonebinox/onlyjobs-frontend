// Regression guard: fails if the old google-font loader or any CDN font URL is
// reintroduced anywhere under src/ (excluding __tests__ and __mocks__).
// Scans for the next/font loader package, the googleapis CDN host, and the
// gstatic CDN host. Any match in production source is BLOCKING.
import fs from 'fs';
import path from 'path';

const SRC_ROOT = path.resolve(__dirname, '..');
const NEXT_ROOT = path.resolve(__dirname, '..', '..', '.next');
const FORBIDDEN = [
  /next\/font\/google/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
];

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.json']);
const IGNORED_SEGMENTS = new Set(['__tests__', '__mocks__', 'node_modules']);

// Walk dir recursively and return absolute paths for files matching ext.
// Uses fs.readdirSync with recursive:true (Node 20+).
function findFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { recursive: true }) as string[];
  return entries
    .filter(rel => rel.endsWith(ext))
    .map(rel => path.join(dir, rel));
}

function findSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { recursive: true }) as string[];
  return entries
    .filter(rel => {
      if (!SOURCE_EXTENSIONS.has(path.extname(rel))) return false;
      return !rel.split(path.sep).some(seg => IGNORED_SEGMENTS.has(seg));
    })
    .map(rel => path.join(dir, rel));
}

function scanFiles(): { file: string; line: number; text: string; pattern: string }[] {
  const hits: { file: string; line: number; text: string; pattern: string }[] = [];

  const files = findSourceFiles(SRC_ROOT);

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of FORBIDDEN) {
        if (pattern.test(lines[i])) {
          hits.push({
            file: path.relative(SRC_ROOT, filePath),
            line: i + 1,
            text: lines[i].trim(),
            pattern: pattern.source,
          });
        }
      }
    }
  }

  return hits;
}

describe('no-google-fonts regression guard — source', () => {
  it('contains no banned google-font loader or CDN font URL anywhere in src/', () => {
    const hits = scanFiles();
    if (hits.length > 0) {
      const report = hits
        .map(h => `  ${h.file}:${h.line}  [/${h.pattern}/]  ${h.text}`)
        .join('\n');
      throw new Error(
        `Banned font reference(s) found — revert before merging:\n${report}`
      );
    }
    expect(hits).toHaveLength(0);
  });
});

// Guard against Google font CDN references appearing in built HTML output.
//
// SCOPE RATIONALE: We scan ONLY .next/server/pages/*.html here.
// We deliberately do NOT scan .next/static/chunks or .next/server/chunks.
// Next 14 embeds a hard-coded lookup table of known font providers in its own
// framework bundles (e.g. em="https://fonts.googleapis.com/" in main-*.js and
// chunk 209.js). That table is present in every Next 14 build, regardless of
// app code, and it is never fetched — it is a static registry. Scanning those
// directories would produce a permanently red test that no app change can fix.
// What matters is whether a browser loading the page WILL contact Google.
// Only the emitted HTML files reveal that: if fonts.googleapis.com appears in
// an HTML file, the browser makes a real request; if it appears only in a JS
// chunk constant, it does not.
describe('no-google-fonts regression guard — built output', () => {
  const SERVER_PAGES = path.join(NEXT_ROOT, 'server', 'pages');
  const STATIC_MEDIA = path.join(NEXT_ROOT, 'static', 'media');
  const BANNED_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

  it('built HTML pages contain no Google font CDN requests', () => {
    if (!fs.existsSync(SERVER_PAGES)) {
      console.log('SKIP built-output font guard: .next/server/pages not found — run "npm run build" first');
      return;
    }
    const htmlFiles = findFiles(SERVER_PAGES, '.html');
    if (htmlFiles.length === 0) {
      console.log('SKIP built-output font guard: no *.html files in .next/server/pages — run "npm run build" first');
      return;
    }

    const hits: { file: string; host: string }[] = [];
    for (const htmlFile of htmlFiles) {
      const content = fs.readFileSync(htmlFile, 'utf8');
      for (const host of BANNED_HOSTS) {
        if (content.includes(host)) {
          hits.push({ file: path.relative(NEXT_ROOT, htmlFile), host });
        }
      }
    }

    if (hits.length > 0) {
      const report = hits.map(h => `  ${h.file}: ${h.host}`).join('\n');
      throw new Error(
        `App-emitted HTML requests Google font CDN — a browser loading these pages WILL contact Google:\n${report}\nRevert before merging.`
      );
    }
    expect(hits).toHaveLength(0);
  });

  it('self-hosted woff2 files are emitted for all three font families at the agreed weights', () => {
    if (!fs.existsSync(STATIC_MEDIA)) {
      console.log('SKIP woff2 presence check: .next/static/media not found — run "npm run build" first');
      return;
    }
    const woff2Files = (fs.readdirSync(STATIC_MEDIA) as string[]).filter(f => f.endsWith('.woff2'));
    if (woff2Files.length === 0) {
      console.log('SKIP woff2 presence check: no woff2 files in .next/static/media — run "npm run build" first');
      return;
    }

    // Agreed weights: PJS 400/500/600/700/800, Inter 400/500/600/700, JBM 400/500/700 = 12 files.
    // A missing weight causes silent browser synthesis and global typography regression.
    const EXPECTED: { family: string; prefix: string; weights: number[] }[] = [
      { family: 'Plus Jakarta Sans', prefix: 'plus-jakarta-sans-latin', weights: [400, 500, 600, 700, 800] },
      { family: 'Inter',             prefix: 'inter-latin',             weights: [400, 500, 600, 700] },
      { family: 'JetBrains Mono',    prefix: 'jetbrains-mono-latin',    weights: [400, 500, 700] },
    ];

    const missing: string[] = [];
    for (const { family, prefix, weights } of EXPECTED) {
      for (const weight of weights) {
        const pattern = new RegExp(`^${prefix}-${weight}-normal\\.`);
        if (!woff2Files.some(f => pattern.test(f))) {
          missing.push(`${family} weight ${weight}`);
        }
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing woff2 files — browsers will synthesise these weights, causing silent typography regression:\n` +
        missing.map(m => `  ${m}`).join('\n')
      );
    }
    expect(missing).toHaveLength(0);
  });
});
