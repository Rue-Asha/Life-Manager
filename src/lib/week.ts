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

export function addDays(d: IsoDate, n: number): IsoDate {
	throw new Error('not implemented');
}

export function weekStartOf(d: IsoDate): IsoDate {
	throw new Error('not implemented');
}

export function weekDays(weekStart: IsoDate): IsoDate[] {
	throw new Error('not implemented');
}

export function weekdayOf(d: IsoDate): Weekday {
	throw new Error('not implemented');
}

export function targetWeek(today: IsoDate): IsoDate {
	throw new Error('not implemented');
}

export function reviewState(weekStart: IsoDate, today: IsoDate): ReviewState {
	throw new Error('not implemented');
}
