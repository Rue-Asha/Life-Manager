import { describe, expect, it } from 'vitest';
import { clampPage, pageCount } from './uni';

describe('sprint list paging', () => {
	it('Scenario: Page clamps into range', () => {
		expect(clampPage(2, 6)).toBe(1);
		expect(clampPage(2, 0)).toBe(1);
		expect(clampPage(5, 13)).toBe(3);
		expect(clampPage(0, 13)).toBe(1);
		expect(clampPage(2, 7)).toBe(2);
		expect([pageCount(0), pageCount(6), pageCount(7)]).toEqual([1, 1, 2]);
	});
});
