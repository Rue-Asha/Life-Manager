import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string) => JSON.parse(readFileSync(file, 'utf8'));

describe('release version', () => {
	it('Scenario: Package and lockfile carry 0.11.0', () => {
		const lock = read('package-lock.json');
		expect(read('package.json').version).toBe('0.11.0');
		expect(lock.version).toBe('0.11.0');
		expect(lock.packages[''].version).toBe('0.11.0');
	});
});
