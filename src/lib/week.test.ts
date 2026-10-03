import { describe, expect, it } from 'vitest';
import {
	addDays,
	berlinToday,
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
});
