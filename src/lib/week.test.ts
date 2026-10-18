import { describe, expect, it } from 'vitest';
import {
	addDays,
	berlinToday,
	monthGrid,
	parseMonth,
	reviewState,
	targetWeek,
	weekDays,
	weekdayOf,
	weekStartOf
} from './week';

describe('week', () => {
	it('Scenario: Sprint covers one ISO week in Europe/Berlin', () => {
		const today = berlinToday(new Date('2026-10-07T23:30:00Z'));
		expect(today).toBe('2026-10-08');
		expect(weekdayOf(today)).toBe(4);
		const start = weekStartOf(today);
		expect(start).toBe('2026-10-05');
		expect(weekDays(start)).toEqual([
			'2026-10-05',
			'2026-10-06',
			'2026-10-07',
			'2026-10-08',
			'2026-10-09',
			'2026-10-10',
			'2026-10-11'
		]);
	});

	it('Scenario: Week boundary across a DST change', () => {
		const before = berlinToday(new Date('2026-10-25T22:30:00Z'));
		const after = berlinToday(new Date('2026-10-25T23:30:00Z'));
		expect(before).toBe('2026-10-25');
		expect(weekStartOf(before)).toBe('2026-10-19');
		expect(after).toBe('2026-10-26');
		expect(weekdayOf(after)).toBe(1);
		expect(weekStartOf(after)).toBe('2026-10-26');

		const springBefore = berlinToday(new Date('2026-03-29T21:30:00Z'));
		const springAfter = berlinToday(new Date('2026-03-29T22:30:00Z'));
		expect(springBefore).toBe('2026-03-29');
		expect(weekStartOf(springBefore)).toBe('2026-03-23');
		expect(springAfter).toBe('2026-03-30');
		expect(weekStartOf(springAfter)).toBe('2026-03-30');
		expect(weekDays('2026-10-19').at(-1)).toBe('2026-10-25');
		expect(weekDays('2026-03-23').at(-1)).toBe('2026-03-29');
	});

	it('Scenario: Target week is the current week before Sunday', () => {
		for (const day of weekDays('2026-10-05').slice(0, 6)) {
			expect(targetWeek(day)).toBe('2026-10-05');
		}
	});

	it('Scenario: Target week on Sunday is next week', () => {
		expect(targetWeek('2026-10-11')).toBe('2026-10-12');
		expect(targetWeek('2026-10-25')).toBe('2026-10-26');
	});

	it('addDays crosses months and years', () => {
		expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
		expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
	});

	it('reviewState follows the sprint Sunday', () => {
		expect(reviewState('2026-10-05', '2026-10-10')).toBe('running');
		expect(reviewState('2026-10-05', '2026-10-11')).toBe('review-available');
		expect(reviewState('2026-10-05', '2026-10-12')).toBe('review-required');
	});

	it('Scenario: Month grid runs Monday to Sunday', () => {
		const feb = monthGrid('2026-02');
		expect(feb).toHaveLength(5);
		expect(feb[0][0]).toBe('2026-01-26');
		expect(feb[4][6]).toBe('2026-03-01');
		const mar = monthGrid('2026-03');
		expect(mar).toHaveLength(6);
		expect(mar[0][0]).toBe('2026-02-23');
		expect(mar[5][6]).toBe('2026-04-05');
		for (const row of [...feb, ...mar]) {
			expect(row).toHaveLength(7);
			expect(weekdayOf(row[0])).toBe(1);
		}
	});

	it('Scenario: Month parameter is parsed or falls back', () => {
		const today = '2026-10-14';
		expect(parseMonth('2027-02', today)).toBe('2027-02');
		for (const bad of ['2026-13', '2026-1', 'foo', null]) expect(parseMonth(bad, today)).toBe('2026-10');
	});
});
