import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const contract = readFileSync('docs/functional-contract.md', 'utf8');

function section(heading: string): string {
	const start = contract.indexOf(`### ${heading}`);
	const next = contract.indexOf('\n### ', start + 1);
	return contract.slice(start, next === -1 ? undefined : next);
}

describe('functional contract', () => {
	it('Scenario: Contract allows the global quick add on phones', () => {
		const nav = section('Navigation between routes');
		expect(nav).not.toContain('No global `New todo` action on phones');
		expect(nav).toMatch(/pill bar/i);
		expect(nav).toContain('Today · Sprint · Backlog · Calendar · More');
		expect(nav).toMatch(/round `\+`[^.]*`New todo`[^.]*every screen/);
	});
});
