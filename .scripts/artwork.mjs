import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { Resvg } from '@resvg/resvg-js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const COLORS = { red: '#F60D10', ink: '#181A18', white: '#FFFFFF', paper: '#F4F6F4' };
export const read = (p) => fs.readFileSync(path.join(ROOT, p));
export const fmt = (n) => Number(n.toFixed(4)).toString();
export const polygon = (points) => `M${points.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L')}Z`;
export const pathTag = (d, fill) => `  <path fill="${fill}" d="${d}"/>`;
export const svg = (w, h, paths) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fmt(w)} ${fmt(h)}">\n${paths.join('\n')}\n</svg>\n`;
export const plate = (x, y, w, h, fill) => pathTag(polygon([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]), fill);

const fontBytes = read('source/fonts/Inter-Bold.ttf');
export const font = opentype.parse(fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength));

// The fixed Latin artwork needs direct glyph outlines and kerning, not complex-script shaping.
export function textPath(text, size, left, centerY, align = 'left') {
  const result = new opentype.Path();
  const glyphs = [...text].map((c) => font.charToGlyph(c));
  let cursor = 0;
  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];
    if (!glyph.index) throw new Error(`Missing glyph: ${text[i]}`);
    result.extend(glyph.getPath(cursor, 0, size));
    cursor += (glyph.advanceWidth + (glyphs[i + 1] ? font.getKerningValue(glyph, glyphs[i + 1]) : 0)) * size / font.unitsPerEm;
  }
  const box = result.getBoundingBox();
  const dx = left - box.x1 - (align === 'center' ? (box.x2 - box.x1) / 2 : 0);
  const dy = centerY - (box.y1 + box.y2) / 2;
  for (const c of result.commands) {
    for (const k of ['x', 'x1', 'x2']) if (k in c) c[k] += dx;
    for (const k of ['y', 'y1', 'y2']) if (k in c) c[k] += dy;
  }
  return result.toPathData({ decimalPlaces: 4, flipY: false });
}

// Restrict the editable master to three explicit polygons and two approved colors.
export function parseMaster(source) {
  const rows = source.trim().split('\n');
  if (rows[0] !== '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' || rows.at(-1) !== '</svg>' || rows.length !== 5) {
    throw new Error('MASTER_STRUCTURE: expected a 120-unit path-only master with three modules');
  }
  return rows.slice(1, -1).map((row, i) => {
    const m = row.match(/^  <path fill="(#[0-9A-F]{6})" d="(M[0-9. L]+Z)"\/>$/);
    if (!m) throw new Error('MASTER_STRUCTURE: only explicit polygon paths are allowed');
    if (m[1] !== (i === 0 ? COLORS.red : COLORS.ink)) throw new Error('MASTER_COLORS: red upper module, ink lower modules required');
    const pairs = m[2].slice(1, -1).split('L').map((s) => s.split(' ').map(Number));
    if (pairs.length !== (i === 0 ? 6 : 5) || pairs.some((p) => p.length !== 2 || p.some((n) => !Number.isFinite(n) || n < 0 || n > 120))) {
      throw new Error('MASTER_GEOMETRY: expected one six-vertex upper module and two five-vertex lower modules');
    }
    return pairs;
  });
}

export const modules = parseMaster(read('source/swarma-symbol.svg').toString());
export const schemes = {
  light: [COLORS.red, COLORS.ink],
  dark: [COLORS.red, COLORS.white],
  mono: [COLORS.ink, COLORS.ink],
  white: [COLORS.white, COLORS.white],
};
export const suffix = (theme) => theme === 'light' ? '' : `-${theme}`;
export function symbol(theme = 'light', x = 0, y = 0, scale = 1) {
  return modules.map((points, i) => pathTag(polygon(points.map(([px, py]) => [x + px * scale, y + py * scale])), schemes[theme][i === 0 ? 0 : 1]));
}
export function lockup(theme = 'light', x = 0, y = 0, scale = 1) {
  return [...symbol(theme, x, y, scale), pathTag(textPath('Swarma', 50 * scale, x + 132 * scale, y + 60 * scale), schemes[theme][1])];
}
export function render(source, width) {
  return new Resvg(source, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: false } }).render();
}

export function artwork() {
  const files = new Map();
  for (const theme of Object.keys(schemes)) {
    const s = suffix(theme);
    files.set(`assets/svg/swarma-symbol${s}.svg`, svg(120, 120, symbol(theme)));
    files.set(`assets/svg/swarma-lockup-horizontal${s}.svg`, svg(344, 120, lockup(theme)));
    files.set(`assets/svg/swarma-lockup-stacked${s}.svg`, svg(260, 220, [
      ...symbol(theme, 58, 0, 1.2), pathTag(textPath('Swarma', 50, 130, 170, 'center'), schemes[theme][1]),
    ]));
  }
  for (const theme of ['light', 'white']) {
    files.set(`assets/svg/swarma-wordmark${suffix(theme)}.svg`, svg(240, 80, [pathTag(textPath('Swarma', 50, 120, 40, 'center'), schemes[theme][1])]));
  }
  for (const theme of ['light', 'dark']) {
    files.set(`assets/svg/swarma-avatar-${theme}.svg`, svg(120, 120, [
      plate(0, 0, 120, 120, theme === 'light' ? COLORS.white : COLORS.ink), ...symbol(theme, 12, 12, 0.8),
    ]));
    files.set(`assets/icons/favicon${suffix(theme)}.svg`, svg(120, 120, symbol(theme)));
  }
  return files;
}
