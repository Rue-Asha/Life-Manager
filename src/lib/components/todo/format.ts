import type { IsoDate } from '$lib/types';

const DAY_MS = 86_400_000;

// IsoDates are calendar days, so format them in UTC where nothing can shift them.
const weekdayShort = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });
const dayMonth = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

const utc = (d: IsoDate) => new Date(`${d}T00:00:00Z`);

export function daysFrom(today: IsoDate, d: IsoDate): number {
	return Math.round((utc(d).getTime() - utc(today).getTime()) / DAY_MS);
}

// "Mon 6"
export function dayLabel(d: IsoDate): string {
	return `${weekdayShort.format(utc(d))} ${utc(d).getUTCDate()}`;
}

// "Fri 9 Oct"
export function dateLabel(d: IsoDate): string {
	return dayMonth.format(utc(d));
}

// "Today", "Tomorrow", "4d left", "2d late"
export function dueLabel(due: IsoDate, today: IsoDate): string {
	const n = daysFrom(today, due);
	if (n === 0) return 'Today';
	if (n === 1) return 'Tomorrow';
	return n < 0 ? `${-n}d late` : `${n}d left`;
}
