import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('no old styling', () => {
	it('Scenario: Old style files are gone', () => {
		for (const path of [
			'src/lib/styles/tokens.css',
			'design',
			'src/lib/layout.ts',
			'src/lib/components/shell/Sidebar.svelte',
			'src/lib/components/shell/HomeList.svelte',
			'src/lib/components/shell/RailLayout.svelte',
			'scripts/slop-baseline.txt'
		]) {
			expect(existsSync(path), path).toBe(false);
		}
		const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
		expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })).not.toContain(
			'@fontsource-variable/bricolage-grotesque'
		);
	});

	it('Scenario: Mockup routes are gone after the final acceptance', () => {
		for (const path of ['src/routes/__mockups', 'e2e/redesign-shots.test.ts', 'fidelity']) {
			expect(existsSync(path), path).toBe(false);
		}
		const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
		expect(pkg.scripts).not.toHaveProperty('fidelity');
		const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
		expect(deps).not.toContain('pixelmatch');
		expect(deps).not.toContain('pngjs');
	});

	it('Scenario: Proof runs check-slop without a baseline', () => {
		const proof: string = JSON.parse(readFileSync('package.json', 'utf8')).scripts.proof;
		expect(proof).toMatch(/^node scripts\/fingerprint\/check-slop\.mjs && node scripts\/fingerprint\/check-drift\.mjs && /);
		expect(proof).not.toContain('--baseline');
	});
});
