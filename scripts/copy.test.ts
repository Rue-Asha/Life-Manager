import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function walk(dir: string, out: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (path.includes('__mockups') || path.includes('__test')) continue;
		if (statSync(path).isDirectory()) walk(path, out);
		else if (path.endsWith('.svelte')) out.push(path);
	}
	return out;
}

// Quoted strings in code: the copy a script hands to the page. Comments go first, so an apostrophe in prose can't open a string.
function literals(code: string): string[] {
	const bare = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
	return [...bare.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)].map((m) => m[1] ?? m[2] ?? m[3]);
}

// What a visitor reads in a component: markup text, text attributes and the strings inside `{…}` and `<script>`.
function visibleCopy(source: string): string[] {
	const scripts = [...source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
	const markup = source.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '').replace(/<style[^>]*>[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
	const found: string[] = scripts.flatMap(literals);
	let text = '';
	let depth = 0;
	let expression = '';
	for (const ch of markup) {
		if (ch === '{') depth++;
		if (depth > 0) expression += ch;
		else text += ch;
		if (ch === '}' && depth > 0 && --depth === 0) {
			found.push(...literals(expression));
			expression = '';
			text += ' ';
		}
	}
	for (const m of text.matchAll(/(?:aria-label|title|placeholder|label|alt|message|confirmLabel|body|heading|hint)="([^"]*)"/g)) found.push(m[1]);
	for (const m of text.matchAll(/>([^<>]+)</g)) found.push(m[1]);
	return found;
}

const withBang = (strings: string[]) => strings.filter((s) => s.includes('!') && !/^\s*$/.test(s)).map((s) => s.trim());

describe('copy', () => {
	it('Scenario: Copy has no exclamation marks', () => {
		const offenders: string[] = [];
		for (const file of walk('src/routes').concat(walk('src/lib/components'))) {
			for (const s of withBang(visibleCopy(readFileSync(file, 'utf8')))) offenders.push(`${file}: ${s}`);
		}
		for (const s of withBang(literals(readFileSync('src/lib/copy.ts', 'utf8')))) offenders.push(`src/lib/copy.ts: ${s}`);
		expect(offenders).toEqual([]);
	});
});
