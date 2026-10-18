import { createHash } from 'node:crypto';
import type { EventSpec } from './types';

export function specHash(s: EventSpec): string {
	const ordered: EventSpec = {
		title: s.title,
		description: s.description,
		location: s.location,
		date: s.date,
		start: s.start,
		end: s.end,
		durationMin: s.durationMin,
		rrule: s.rrule,
		exdates: s.exdates
	};
	return createHash('sha256').update(JSON.stringify(ordered)).digest('hex');
}
