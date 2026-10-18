import { describe, expect, it } from 'vitest';
import { specHash } from './hash';
import type { EventSpec } from './types';

const base: EventSpec = {
	title: 'Write report',
	description: 'notes',
	location: 'Room 1',
	date: '2026-10-20',
	start: '09:00',
	end: '10:00',
	durationMin: null,
	rrule: null,
	exdates: []
};

describe('specHash', () => {
	it('Scenario: Hash covers exactly the pushed event content', () => {
		expect(specHash({ ...base })).toBe(specHash({ ...base }));
		expect(specHash(base)).toMatch(/^[0-9a-f]{64}$/);

		const variants: Partial<EventSpec>[] = [
			{ title: 'Other' },
			{ description: 'other' },
			{ location: 'Room 2' },
			{ date: '2026-10-21' },
			{ start: '09:30' },
			{ end: '10:30' },
			{ durationMin: 30 },
			{ rrule: 'FREQ=WEEKLY;BYDAY=TU' },
			{ exdates: ['2026-10-27'] }
		];
		const hashes = new Set([specHash(base), ...variants.map((v) => specHash({ ...base, ...v }))]);
		expect(hashes.size).toBe(variants.length + 1);

		const reordered = Object.fromEntries(Object.entries(base).reverse()) as unknown as EventSpec;
		expect(specHash(reordered)).toBe(specHash(base));
	});
});
