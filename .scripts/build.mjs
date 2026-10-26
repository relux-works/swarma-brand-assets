import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, read, svg, pathTag, plate, symbol, lockup, textPath, render, artwork, COLORS } from './artwork.mjs';

const files = artwork();
const add = (name, bytes) => files.set(name, typeof bytes === 'string' ? Buffer.from(bytes) : bytes);
const png = (name, source, width) => add(name, render(source, width).asPng());

for (const [name, source] of [...files]) {
  if (!name.startsWith('assets/svg/')) continue;
  const sizes = name.includes('avatar') ? [128, 256, 512, 1024] :
    name.includes('horizontal') ? [960, 1920] : name.includes('stacked') ? [640, 1280] :
    name.includes('wordmark') ? [800, 1600] : [256, 1024];
  for (const size of sizes) png(name.replace('assets/svg/', 'assets/png/').replace('.svg', `-${size}.png`), source, size);
}

const avatar = files.get('assets/svg/swarma-avatar-light.svg');
for (const size of [16, 24, 32, 48, 64]) png(`assets/icons/favicon-${size}.png`, avatar, size);
png('assets/icons/apple-touch-icon.png', avatar, 180);
png('assets/icons/icon-192.png', avatar, 192);
png('assets/icons/icon-512.png', avatar, 512);
// The maskable symbol fits inside the central 80%-diameter safe circle.
const maskable = svg(120, 120, [plate(0, 0, 120, 120, COLORS.white), ...symbol('light', 18, 18, 0.7)]);
png('assets/icons/icon-maskable-512.png', maskable, 512);

// ICO stores one PNG frame per size; offsets are explicit and no re-encoding is involved.
const frames = [16, 32, 48].map((size) => ({ size, data: files.get(`assets/icons/favicon-${size}.png`) }));
const directory = Buffer.alloc(6 + frames.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(frames.length, 4);
let offset = directory.length;
frames.forEach(({ size, data }, i) => {
  const at = 6 + i * 16;
  directory[at] = size; directory[at + 1] = size;
  directory.writeUInt16LE(1, at + 4); directory.writeUInt16LE(32, at + 6);
  directory.writeUInt32LE(data.length, at + 8); directory.writeUInt32LE(offset, at + 12);
  offset += data.length;
});
add('assets/icons/favicon.ico', Buffer.concat([directory, ...frames.map((f) => f.data)]));

// A single proof is composed from the exact export paths, including outlined labels.
const proof = [
  plate(0, 0, 1440, 1000, COLORS.paper),
  pathTag(textPath('Swarma / Quorum', 27, 60, 50), COLORS.ink),
  pathTag(textPath('Identity assets 1.0', 15, 1100, 50), COLORS.ink),
  plate(60, 88, 1320, 1, '#D9DDD9'),
  ...lockup('light', 65, 140, 2.3),
  ...symbol('light', 1100, 165, 1.6),
  pathTag(textPath('Primary lockup', 17, 65, 445), COLORS.ink),
  pathTag(textPath('Standalone symbol', 17, 1095, 445), COLORS.ink),
  plate(0, 500, 1440, 310, COLORS.ink),
  ...lockup('dark', 65, 545, 1.65),
  ...symbol('white', 800, 550, 1.5),
  plate(1100, 540, 210, 210, COLORS.paper),
  ...symbol('mono', 1115, 555, 1.5),
  pathTag(textPath('Dark surface', 17, 65, 770), COLORS.white),
  pathTag(textPath('One color', 17, 815, 770), COLORS.white),
  pathTag(textPath('Positive', 17, 1120, 770), COLORS.white),
  pathTag(textPath('Relux red', 17, 60, 880), COLORS.ink),
  pathTag(textPath('#F60D10', 22, 60, 920), COLORS.red),
  pathTag(textPath('Relux ink', 17, 350, 880), COLORS.ink),
  pathTag(textPath('#181A18', 22, 350, 920), COLORS.ink),
  pathTag(textPath('Outlined Inter Bold', 17, 660, 880), COLORS.ink),
  pathTag(textPath('Three independent modules. One shared result.', 16, 660, 920), COLORS.ink),
];
const proofSVG = svg(1440, 1000, proof);
add('docs/asset-preview.svg', proofSVG);
png('docs/asset-preview.png', proofSVG, 1440);

// Generate all bytes before writing: source errors cannot leave partial output.
const manifest = {
  version: '1.0.0',
  source: 'source/swarma-symbol.svg',
  sourceSha256: crypto.createHash('sha256').update(read('source/swarma-symbol.svg')).digest('hex'),
  font: 'Inter Bold 4.001',
  fontSha256: crypto.createHash('sha256').update(read('source/fonts/Inter-Bold.ttf')).digest('hex'),
  assets: [...files].map(([name, value]) => {
    const bytes = Buffer.from(value);
    const item = { path: name, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
    if (name.endsWith('.png')) { item.width = bytes.readUInt32BE(16); item.height = bytes.readUInt32BE(20); }
    return item;
  }).sort((a, b) => a.path.localeCompare(b.path, 'en')),
};
add('assets/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
for (const [name, data] of files) {
  const target = path.join(ROOT, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
}
console.log(`Built ${files.size} deterministic files from the Quorum master.`);
