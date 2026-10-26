import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, read, artwork, modules, parseMaster, render, COLORS } from './artwork.mjs';

const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const fail = (code, message) => { throw new Error(`${code}: ${message}`); };

// This strict grammar rejects active content, live fonts, embedded images and references.
function safeSVG(source) {
  const rows = source.trim().split('\n');
  if (!/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 [0-9.]+ [0-9.]+">$/.test(rows[0]) || rows.at(-1) !== '</svg>') {
    fail('SVG_STRUCTURE', 'only a viewBox and namespace are allowed on the root');
  }
  if (rows.length < 3) fail('SVG_STRUCTURE', 'empty artwork');
  for (const line of rows.slice(1, -1)) {
    const match = line.match(/^  <path fill="(#[0-9A-F]{6})" d="[MLHVCSQTAZmlhvcsqtaz0-9., -]+"\/>$/);
    if (!match) fail('SVG_STRUCTURE', 'only explicit filled paths are allowed');
    if (![COLORS.red, COLORS.ink, COLORS.white].includes(match[1])) fail('SVG_COLOR', match[1]);
  }
}

function inventory(base) {
  return fs.readdirSync(path.join(ROOT, base), { withFileTypes: true }).flatMap((e) => {
    const name = `${base}/${e.name}`;
    return e.isDirectory() ? inventory(name) : [name];
  });
}

function checkCatalog(manifest, get = read) {
  const names = new Set();
  for (const entry of manifest.assets) {
    if (!/^(assets\/|docs\/asset-preview\.)/.test(entry.path) || entry.path.includes('..') || names.has(entry.path)) fail('CATALOG_PATH', entry.path);
    names.add(entry.path);
    let bytes;
    try { bytes = get(entry.path); } catch { fail('MISSING_EXPORT', entry.path); }
    if (bytes.length !== entry.bytes || hash(bytes) !== entry.sha256) fail('STALE_EXPORT', entry.path);
    if (entry.path.endsWith('.png')) {
      assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', entry.path);
      assert.equal(bytes.readUInt32BE(16), entry.width, entry.path);
      assert.equal(bytes.readUInt32BE(20), entry.height, entry.path);
      assert.ok(entry.width > 0 && entry.height > 0, entry.path);
    }
  }
  return names;
}

function components(image) {
  const { width, height, pixels } = image;
  const seen = new Uint8Array(width * height), counts = [];
  for (let i = 0; i < seen.length; i++) {
    if (seen[i] || pixels[i * 4 + 3] < 128) continue;
    const queue = [i]; seen[i] = 1; let count = 0;
    while (queue.length) {
      const at = queue.pop(); count++;
      const x = at % width, y = Math.floor(at / width);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, next = ny * width + nx;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || seen[next] || pixels[next * 4 + 3] < 128) continue;
        seen[next] = 1; queue.push(next);
      }
    }
    counts.push(count);
  }
  return counts;
}

const expected = artwork();
for (const [name, source] of expected) {
  const actual = read(name).toString();
  safeSVG(actual);
  assert.equal(actual, source, `STALE_SVG: ${name}`);
  // Transparent exports must retain a clear margin and visible content.
  if (!name.includes('avatar')) {
    const rendered = render(actual, 344), { pixels, width, height } = rendered;
    assert.ok(pixels.some((v, i) => i % 4 === 3 && v > 0), `EMPTY: ${name}`);
    for (let x = 0; x < width; x++) {
      assert.equal(pixels[x * 4 + 3], 0, `TOP_CLIP: ${name}`);
      assert.equal(pixels[((height - 1) * width + x) * 4 + 3], 0, `BOTTOM_CLIP: ${name}`);
    }
    for (let y = 0; y < height; y++) {
      assert.equal(pixels[(y * width) * 4 + 3], 0, `LEFT_CLIP: ${name}`);
      assert.equal(pixels[(y * width + width - 1) * 4 + 3], 0, `RIGHT_CLIP: ${name}`);
    }
  }
}

const area = (p) => Math.abs(p.reduce((sum, [x, y], i) => sum + x * p[(i + 1) % p.length][1] - y * p[(i + 1) % p.length][0], 0)) / 2;
const areas = modules.map(area);
assert.ok(Math.max(...areas) / Math.min(...areas) < 1.2, 'MODULE_AREA: components must have comparable visual weight');
assert.ok(modules[0].every(([, y]) => y < 56), 'UPPER_MODULE: red must remain above the shared aperture');
const master = expected.get('assets/svg/swarma-symbol.svg');
const high = render(master, 120);
assert.equal(high.pixels[(68 * 120 + 60) * 4 + 3], 0, 'APERTURE: the center must remain transparent');

// At these exact raster sizes, 50%-alpha 4-connected components remain separate.
// This is a geometric check, not a claim about every browser or display's perception.
const sizeEvidence = [];
for (const size of [16, 24, 32, 48, 120, 512]) {
  const counts = components(render(master, size));
  assert.equal(counts.length, 3, `MODULE_GAPS: ${size}px has ${counts.length} components`);
  assert.ok(counts.every((n) => n >= 8), `MODULE_VISIBILITY: ${size}px`);
  sizeEvidence.push(`${size}px:${counts.join('/')}`);
}

const manifest = JSON.parse(read('assets/manifest.json'));
assert.equal(manifest.sourceSha256, hash(read('source/swarma-symbol.svg')), 'MASTER_HASH');
assert.equal(manifest.fontSha256, hash(read('source/fonts/Inter-Bold.ttf')), 'FONT_HASH');
const catalog = checkCatalog(manifest);
assert.deepEqual([...catalog].filter((n) => n.startsWith('assets/')).sort(), inventory('assets').filter((n) => n !== 'assets/manifest.json').sort(), 'CATALOG_COMPLETENESS');

// Independent filename-to-master mapping catches a PNG accidentally rendered from another logo.
for (const entry of manifest.assets.filter((a) => a.path.startsWith('assets/png/'))) {
  const match = entry.path.match(/^assets\/png\/(.+)-(\d+)\.png$/);
  assert.ok(match, `PNG_NAME: ${entry.path}`);
  const source = read(`assets/svg/${match[1]}.svg`).toString();
  assert.deepEqual(read(entry.path), render(source, Number(match[2])).asPng(), `PNG_SOURCE: ${entry.path}`);
}
const avatarSource = read('assets/svg/swarma-avatar-light.svg').toString();
for (const size of [16, 24, 32, 48, 64]) {
  assert.deepEqual(read(`assets/icons/favicon-${size}.png`), render(avatarSource, size).asPng(), `FAVICON_SOURCE: ${size}`);
}
// Removing only the solid plate lets the same connectivity check inspect the favicon foreground.
const avatarForeground = avatarSource.split('\n').filter((_, i) => i !== 1).join('\n');
for (const size of [16, 32, 48]) assert.equal(components(render(avatarForeground, size)).length, 3, `FAVICON_GAPS: ${size}px`);

// ICO must preserve every intended size and point to exactly the exported PNG frames.
const ico = read('assets/icons/favicon.ico');
assert.equal(ico.readUInt16LE(0), 0); assert.equal(ico.readUInt16LE(2), 1); assert.equal(ico.readUInt16LE(4), 3);
for (const [i, size] of [16, 32, 48].entries()) {
  const at = 6 + i * 16, length = ico.readUInt32LE(at + 8), offset = ico.readUInt32LE(at + 12);
  assert.equal(ico[at], size); assert.equal(ico[at + 1], size);
  assert.deepEqual(ico.subarray(offset, offset + length), read(`assets/icons/favicon-${size}.png`));
}

// Bounded negative controls prove the validator catches the forbidden outcomes.
// All controls operate in memory; checked-in source and exports remain untouched.
safeSVG(master);
assert.throws(() => safeSVG(master.replace('</svg>', '<script>alert(1)</script>\n</svg>')), /SVG_STRUCTURE/);
assert.throws(() => safeSVG(master.replace('</svg>', '<text>Swarma</text>\n</svg>')), /SVG_STRUCTURE/);
assert.throws(() => safeSVG(master.replace('#F60D10', '#FF0000')), /SVG_COLOR/);
assert.throws(() => parseMaster(read('source/swarma-symbol.svg').toString().replace('#F60D10', '#181A18')), /MASTER_COLORS/);
assert.throws(() => checkCatalog(manifest, (p) => { if (p === 'assets/icons/favicon.ico') throw new Error('missing'); return read(p); }), /MISSING_EXPORT/);
assert.throws(() => checkCatalog(manifest, (p) => p === 'assets/icons/favicon.ico' ? Buffer.from('stale') : read(p)), /STALE_EXPORT/);
const joined = master.replace('</svg>', '  <path fill="#181A18" d="M54 88L66 88L66 102L54 102Z"/>\n</svg>');
assert.equal(components(render(joined, 120)).length, 2, 'GAP_CONTROL: the deliberately joined lower modules must be detected');

console.log(`PASS: ${expected.size} path-only SVGs; ${manifest.assets.length} cataloged files; hashes, transparency, clipping, balanced modules, ICO frames and 7 negative controls.`);
console.log(`Separate components: ${sizeEvidence.join(', ')}`);
