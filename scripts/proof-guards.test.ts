import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('proof guards', () => {
	it('Scenario: Unit tests under scripts run in proof', async () => {
		const include: string[] = (await import('../vite.config')).default.test?.include ?? [];
		expect(include).toContain('scripts/**/*.test.ts');
		expect(JSON.parse(read('package.json')).scripts['test:unit']).toMatch(/vitest/);
	});

	it('Scenario: Proof runs the fingerprint guards', () => {
		const proof: string = JSON.parse(read('package.json')).scripts.proof;
		const slop = proof.indexOf('check-slop.mjs');
		const drift = proof.indexOf('check-drift.mjs');
		const unit = proof.indexOf('test:unit');
		expect(slop).toBeGreaterThan(-1);
		expect(drift).toBeGreaterThan(-1);
		expect(unit).toBeGreaterThan(drift);
		expect(unit).toBeGreaterThan(slop);
	});

	it('Scenario: Vendored files match the lock', () => {
		expect(JSON.parse(read('fingerprint.lock')).version).toBe('2.1.0');
		const run = spawnSync('node', ['scripts/fingerprint/check-drift.mjs'], { encoding: 'utf8' });
		expect(run.status).toBe(0);
	});

	it('Scenario: Lock hashes do not trip the secret scan', () => {
		const toml = read('.gitleaks.toml');
		expect(toml).toMatch(/\[extend\][\s\S]*useDefault\s*=\s*true/);
		expect(toml).toMatch(/\[\[allowlists\]\][\s\S]*paths\s*=\s*\[[^\]]*fingerprint\\\.lock/);
	});
});
