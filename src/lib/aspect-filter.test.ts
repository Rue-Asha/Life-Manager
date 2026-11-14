import { describe, expect, it } from 'vitest';
import { parseAspectFilter } from './aspect-filter';

describe('parseAspectFilter', () => {
	it('treats null and empty as all', () => {
		expect(parseAspectFilter(null)).toEqual({ kind: 'all' });
		expect(parseAspectFilter('')).toEqual({ kind: 'all' });
	});

	it('parses whole numbers as an id', () => {
		expect(parseAspectFilter('3')).toEqual({ kind: 'id', id: 3 });
		expect(parseAspectFilter('007')).toEqual({ kind: 'id', id: 7 });
	});

	it('treats everything else as unknown', () => {
		for (const bad of ['abc', '1.5', '-1', ' 2', '2 ', '1e3', '0x10', '3abc', '99999999999999999999']) {
			expect(parseAspectFilter(bad), bad).toEqual({ kind: 'unknown' });
		}
	});
});
