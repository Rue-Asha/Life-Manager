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

const LAST = 23 * 60 + 59;
const toMinutes = (t: HhMm) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const toHhMm = (m: number): HhMm => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export function slotLength(startTime: HhMm, endTime: HhMm): number | null {
	if (!HH_MM.test(startTime) || !HH_MM.test(endTime)) return null;
	const length = toMinutes(endTime) - toMinutes(startTime);
	return length > 0 ? length : null;
}

// The end `length` minutes after the start; null when that passes midnight.
export function endAfter(startTime: HhMm, length: number): HhMm | null {
	const end = toMinutes(startTime) + length;
	return end > LAST ? null : toHhMm(end);
}

// A moved start takes the end along, keeping the length; past midnight the end stops at 23:59.
export function shiftEnd(from: HhMm, to: HhMm, endTime: HhMm): HhMm | null {
	const length = slotLength(from, endTime);
	if (length === null) return endTime;
	const end = Math.min(toMinutes(to) + length, LAST);
	return end > toMinutes(to) ? toHhMm(end) : null;
}

// The next full hour, kept within 06:00–21:00 so a late or early click still lands on a usable slot.
export function nextHour(now: Date): HhMm {
	return toHhMm(Math.min(Math.max(now.getHours() + 1, 6), 21) * 60);
}

export function lengthLabel(length: number): string {
	const h = Math.floor(length / 60);
	const m = length % 60;
	if (h === 0) return `${m} min`;
	return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
