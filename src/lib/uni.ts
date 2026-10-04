import type { ClassType, Grade, IsoDate } from './types';

export const CLASS_TYPES: ClassType[] = ['LEC', 'EXC', 'OTH'];

export const TYPE_LABELS: Record<ClassType, string> = {
	LEC: 'Lecture',
	EXC: 'Exercise',
	OTH: 'Other'
};

export const GRADES: Grade[] = ['1.0', '1.3', '1.7', '2.0', '2.3', '2.7', '3.0', '3.3', '3.7', '4.0', '5.0', 'passed'];

// Keyed by error code, or `code.field` where one code needs different copy per field.
export const UNI_MESSAGES: Record<string, string> = {
	required: 'Give it a name.',
	invalid: 'That value isn’t valid.',
	'invalid.color': 'Pick one of the colours.',
	'invalid.icon': 'Pick one of the icons.',
	'invalid.ects': 'Enter ECTS as a number of 0 or more, in steps of 0.5.',
	'invalid.links': 'Enter links starting with http:// or https://.',
	'invalid.examAt': 'Enter the exam as a date, optionally with a time.',
	'invalid.grade': 'Pick a grade from the list.',
	'not-found': 'That class no longer exists.',
	'not-found.aspectId': 'That aspect no longer exists.',
	archived: 'This semester is archived and read-only.'
};

export function uniMessage(error: string, field?: string): string {
	return UNI_MESSAGES[`${error}.${field}`] ?? UNI_MESSAGES[error] ?? error;
}

const DAY_MS = 86_400_000;

function daysFrom(today: IsoDate, date: IsoDate): number {
	return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS);
}

export function formatAverage(n: number | null): string {
	return n === null ? '—' : n.toFixed(2);
}

// Past exams have no countdown; examAt may carry a time, only its date counts.
export function examCountdown(examAt: string | null, today: IsoDate): string | null {
	if (!examAt) return null;
	const days = daysFrom(today, examAt.slice(0, 10));
	if (days < 0) return null;
	return days === 0 ? 'Exam today' : `Exam in ${days} d`;
}

export function revisedLabel(revisedAt: IsoDate | null, today: IsoDate): string {
	if (!revisedAt) return 'Not revised';
	const ago = daysFrom(revisedAt, today);
	if (ago <= 0) return 'Revised today';
	return ago === 1 ? 'Revised yesterday' : `Revised ${ago} days ago`;
}
