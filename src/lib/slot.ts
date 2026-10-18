import { dateLabel } from '$lib/components/todo/format';
import type { HhMm, IsoDate } from '$lib/types';

export type SlotError = 'invalid' | 'end-without-start' | 'end-before-start';

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateSlot(
	startTime: HhMm | null,
	endTime: HhMm | null
): { error: SlotError; field: 'startTime' | 'endTime' } | null {
	if (startTime !== null && !HH_MM.test(startTime)) return { error: 'invalid', field: 'startTime' };
	if (endTime !== null && !HH_MM.test(endTime)) return { error: 'invalid', field: 'endTime' };
	if (endTime !== null && startTime === null) return { error: 'end-without-start', field: 'endTime' };
	// Same-day HH:MM strings compare correctly as text.
	if (endTime !== null && startTime !== null && endTime <= startTime) return { error: 'end-before-start', field: 'endTime' };
	return null;
}

export function slotLabel(startTime: HhMm | null, endTime: HhMm | null): string {
	if (startTime === null) return 'all day';
	return endTime === null ? startTime : `${startTime}–${endTime}`;
}

export function plannedLabel(day: IsoDate, startTime: HhMm | null, endTime: HhMm | null, withDate = true): string {
	const slot = startTime === null ? '' : slotLabel(startTime, endTime);
	if (!withDate) return slot;
	return slot === '' ? dateLabel(day) : `${dateLabel(day)} · ${slot}`;
}
