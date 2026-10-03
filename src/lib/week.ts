import type { IsoDate, ReviewState, Weekday } from '$lib/types';

const berlinDate = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Europe/Berlin',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

export function berlinToday(now: Date): IsoDate {
	return berlinDate.format(now);
}

const DAY_MS = 86_400_000;

// Calendar arithmetic on UTC midnights: no time zone in play, so DST cannot move a boundary.
function toUtc(d: IsoDate): number {
	return Date.parse(`${d}T00:00:00Z`);
}

export function addDays(d: IsoDate, n: number): IsoDate {
	return new Date(toUtc(d) + n * DAY_MS).toISOString().slice(0, 10);
}

export function weekdayOf(d: IsoDate): Weekday {
	return (new Date(toUtc(d)).getUTCDay() || 7) as Weekday;
}

export function weekStartOf(d: IsoDate): IsoDate {
	return addDays(d, 1 - weekdayOf(d));
}

export function weekDays(weekStart: IsoDate): IsoDate[] {
	return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function targetWeek(today: IsoDate): IsoDate {
	return weekdayOf(today) === 7 ? addDays(today, 1) : weekStartOf(today);
}

export function reviewState(weekStart: IsoDate, today: IsoDate): ReviewState {
	const sunday = addDays(weekStart, 6);
	if (today < sunday) return 'running';
	return today === sunday ? 'review-available' : 'review-required';
}
