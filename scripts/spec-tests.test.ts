import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const TITLE = /\btest(?:\.\w+)*\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`)/g;

function e2eTitles(): Set<string> {
	const titles = new Set<string>();
	for (const file of readdirSync('e2e').filter((f) => f.endsWith('.ts'))) {
		for (const m of readFileSync(`e2e/${file}`, 'utf8').matchAll(TITLE)) {
			titles.add((m[1] ?? m[2] ?? m[3]).replace(/\\(['"`\\])/g, '$1'));
		}
	}
	return titles;
}

describe('spec-named e2e tests', () => {
	it('Scenario: Every spec-named e2e test still exists', () => {
		const listed = readFileSync('scripts/spec-tests.txt', 'utf8').split('\n').filter(Boolean);
		expect(listed.length).toBeGreaterThan(0);
		const titles = e2eTitles();
		expect(listed.filter((title) => !titles.has(title))).toEqual([]);
	});
});
