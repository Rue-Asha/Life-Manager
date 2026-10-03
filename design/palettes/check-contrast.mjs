// WCAG AA check for every text/background pair the style tile uses, per palette file.
// Usage: node design/palettes/check-contrast.mjs   (exit 1 on any failure)
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const ASPECTS = ['sage', 'sky', 'lavender', 'ochre', 'berry', 'lagoon', 'tangerine', 'slate'];

const hex = (h) => {
	h = h.replace('#', '');
	if (h.length === 3) h = [...h].map((c) => c + c).join('');
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function rgbToOklab([r, g, b]) {
	[r, g, b] = [r, g, b].map(toLin);
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808376429 * s
	];
}
function oklabToRgb([L, a, b]) {
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
	].map((c) => Math.min(1, Math.max(0, fromLin(c))));
}
function mix(space, x, p, y) {
	const A = rgbToOklab(x), B = rgbToOklab(y);
	if (space === 'oklab') return oklabToRgb(A.map((v, i) => v * p + B[i] * (1 - p)));
	const lch = ([L, a, b]) => [L, Math.hypot(a, b), Math.atan2(b, a)];
	const [L1, C1, H1] = lch(A), [L2, C2, H2] = lch(B);
	const h1 = C1 < 1e-4 ? H2 : H1, h2 = C2 < 1e-4 ? h1 : H2;
	let d = h2 - h1;
	if (d > Math.PI) d -= 2 * Math.PI;
	if (d < -Math.PI) d += 2 * Math.PI;
	const L = L1 * p + L2 * (1 - p), C = C1 * p + C2 * (1 - p), H = h1 + d * (1 - p);
	return oklabToRgb([L, C * Math.cos(H), C * Math.sin(H)]);
}
const lum = (rgb) => {
	const [r, g, b] = rgb.map(toLin);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (x, y) => {
	const [a, b] = [lum(x), lum(y)].sort((m, n) => n - m);
	return (a + 0.05) / (b + 0.05);
};

function load(file) {
	const raw = {};
	for (const [, k, v] of readFileSync(file, 'utf8').matchAll(/--([\w-]+):\s*([^;]+);/g)) raw[k] = v.trim();
	const cache = {};
	const get = (k) => {
		if (cache[k]) return cache[k];
		const v = raw[k];
		if (!v) throw new Error(`${file}: missing --${k}`);
		if (v.startsWith('#')) return (cache[k] = hex(v));
		const m = v.match(/^color-mix\(in (oklch|oklab), var\(--([\w-]+)\) ([\d.]+)%, var\(--([\w-]+)\)\)$/);
		if (m) return (cache[k] = mix(m[1], get(m[2]), m[3] / 100, get(m[4])));
		const ref = v.match(/^var\(--([\w-]+)\)$/);
		if (ref) return (cache[k] = get(ref[1]));
		throw new Error(`${file}: cannot resolve --${k}: ${v}`);
	};
	return get;
}

const TEXT = 4.5, UI = 3;
function pairs() {
	const p = [];
	for (const fg of ['ink', 'ink-2', 'ink-3']) for (const bg of ['paper', 'paper-sunk', 'paper-hover']) p.push([fg, bg, TEXT]);
	p.push(['ink', 'line', TEXT], ['paper', 'ink', TEXT]);
	for (const bg of ['accent', 'accent-hover']) p.push(['ink-on-accent', bg, TEXT]);
	for (const bg of ['paper', 'paper-sunk', 'accent-soft']) p.push(['accent', bg, TEXT]);
	for (const bg of ['paper', 'paper-sunk', 'overdue-soft']) p.push(['overdue', bg, TEXT]);
	for (const a of ASPECTS) {
		const fg = `aspect-${a}`, tint = `${fg}-tint`;
		p.push(['ink', tint, TEXT], ['ink-2', tint, TEXT]);
		p.push([fg, 'paper', UI], [fg, 'paper-sunk', UI], [fg, tint, UI], ['ink-on-accent', fg, UI]);
	}
	return p;
}

let failed = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.css')).sort()) {
	const get = load(join(dir, f));
	const bad = [];
	let worst = Infinity;
	for (const [fg, bg, min] of pairs()) {
		const r = ratio(get(fg), get(bg));
		worst = Math.min(worst, r / min);
		if (r < min) bad.push(`  FAIL --${fg} on --${bg}: ${r.toFixed(2)} < ${min}`);
	}
	const cb = ratio(get('line-strong'), get('paper')).toFixed(2);
	console.log(`${f}: ${bad.length ? `${bad.length} failing` : 'all pass'} (${pairs().length} pairs; tightest at ${worst.toFixed(2)}× its minimum; unchecked-checkbox outline ${cb}:1)`);
	bad.forEach((l) => console.log(l));
	failed += bad.length;
}
process.exit(failed ? 1 : 0);
