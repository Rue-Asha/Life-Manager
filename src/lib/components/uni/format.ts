import type { IsoDate } from '$lib/types';
import { dateLabel, daysFrom } from '../todo/format';

// A class row's next due date: "Next due tomorrow", "Next due Thu 8 Oct", "Overdue since Mon 5 Oct".
export function nextDueText(date: IsoDate, today: IsoDate): { text: string; late: boolean } {
	const n = daysFrom(today, date);
	if (n < 0) return { text: `Overdue since ${dateLabel(date)}`, late: true };
	if (n === 0) return { text: 'Next due today', late: false };
	return { text: `Next due ${n === 1 ? 'tomorrow' : dateLabel(date)}`, late: false };
}

// A row of "This week": "Due Thu 8 Oct", or "Overdue · Mon 5 Oct" once it has passed.
export function weekDueText(date: IsoDate, today: IsoDate): { text: string; late: boolean } {
	const late = date < today;
	return { text: `${late ? 'Overdue · ' : 'Due '}${dateLabel(date)}`, late };
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : word.endsWith('s') ? 'es' : 's'}`;
