import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';

describe('harness', () => {
	it('Scenario: Package declares the Node engine', () => {
		expect(pkg.engines.node).toBe('>=22.5');
	});
});
