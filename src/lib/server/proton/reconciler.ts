import type { DatabaseSync } from 'node:sqlite';
import type { DesiredItem, FailedItem, PassOutcome, Runner } from './types';

export async function reconcile(
	db: DatabaseSync,
	desired: DesiredItem[],
	run: Runner,
	o?: { retryFailed?: boolean }
): Promise<PassOutcome> {
	return { kind: 'done', calls: 0, failed: 0 };
}

export function pendingCount(db: DatabaseSync, desired: DesiredItem[]): number {
	return 0;
}

export function failedItems(db: DatabaseSync): FailedItem[] {
	return [];
}

export function forgetHashes(db: DatabaseSync): void {}
