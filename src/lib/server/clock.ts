import { berlinToday } from '$lib/week';
import type { IsoDate } from '$lib/types';

let testNow: Date | null = null;

export function now(): Date {
	return process.env.LM_TEST === '1' && testNow ? testNow : new Date();
}

export function today(): IsoDate {
	return berlinToday(now());
}

export function setTestNow(d: Date | null): void {
	testNow = d;
}
