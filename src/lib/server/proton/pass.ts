import type { DatabaseSync } from 'node:sqlite';
import type { IsoDate } from '$lib/types';
import { desiredState } from './desired';
import { reconcile } from './reconciler';
import type { PassOutcome, Runner } from './types';

export function runPass(
	db: DatabaseSync,
	today: IsoDate,
	run: Runner,
	o?: { retryFailed?: boolean }
): Promise<PassOutcome> {
	return reconcile(db, desiredState(db, today), run, { ...o, today });
}
