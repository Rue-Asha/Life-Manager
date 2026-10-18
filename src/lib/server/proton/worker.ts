import type { PassOutcome, ProtonConfig, SyncStatus, WorkerOptions } from './types';

export function configureWorker(cfg: ProtonConfig | null, o?: WorkerOptions): void {}

export function nudge(): void {}

export async function syncNow(o?: { retryFailed?: boolean }): Promise<PassOutcome | null> {
	return null;
}

export async function resyncAll(): Promise<PassOutcome | null> {
	return null;
}

export function syncStatus(): SyncStatus {
	return { state: 'off', profile: null, lastSyncAt: null, lastError: null, nextRetryAt: null, passes: 0 };
}

export async function resetWorker(): Promise<void> {}
