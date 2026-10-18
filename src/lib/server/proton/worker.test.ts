import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDb } from '../db';
import { configureWorker, nudge, syncNow, syncStatus } from './worker';
import type { PassOutcome } from './types';

const CFG = { cli: '/bin/proton', profile: 'default' };
const DONE: PassOutcome = { kind: 'done', calls: 0, failed: 0 };

let db: DatabaseSync;
beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-10-18T10:00:00Z'));
	db = openDb(':memory:');
});
afterEach(async () => {
	configureWorker(null);
	vi.useRealTimers();
});

const lastSync = () => db.prepare("SELECT value FROM settings WHERE key = 'proton_last_sync_at'").get() as { value: string } | undefined;

describe('proton worker', () => {
	it('Scenario: Writes nudge a pass after the debounce', async () => {
		const pass = vi.fn(async () => DONE);
		configureWorker(CFG, { pass, db, debounceMs: 1000, tickMs: 3_600_000 });
		await vi.advanceTimersByTimeAsync(1000);
		expect(pass).toHaveBeenCalledTimes(1);

		nudge();
		await vi.advanceTimersByTimeAsync(500);
		nudge();
		await vi.advanceTimersByTimeAsync(999);
		expect(pass).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1);
		expect(pass).toHaveBeenCalledTimes(2);
		expect(pass).toHaveBeenLastCalledWith({ retryFailed: false });
	});

	it('Scenario: Local tick runs every five minutes', async () => {
		const pass = vi.fn(async () => DONE);
		configureWorker(CFG, { pass, db, debounceMs: 1000, tickMs: 300_000 });
		await vi.advanceTimersByTimeAsync(299_999);
		expect(pass).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1);
		expect(pass).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(300_000);
		expect(pass).toHaveBeenCalledTimes(3);
	});

	it('Scenario: Passes never overlap', async () => {
		let active = 0;
		let overlap = 0;
		const release: (() => void)[] = [];
		const pass = vi.fn(async () => {
			overlap = Math.max(overlap, ++active);
			await new Promise<void>((r) => release.push(r));
			active--;
			return DONE;
		});
		configureWorker(CFG, { pass, db, debounceMs: 1000, tickMs: 3_600_000 });
		await vi.advanceTimersByTimeAsync(1000);
		expect(syncStatus().state).toBe('syncing');
		nudge();
		await vi.advanceTimersByTimeAsync(1000);
		nudge();
		await vi.advanceTimersByTimeAsync(1000);
		expect(pass).toHaveBeenCalledTimes(1);

		release[0]();
		await vi.advanceTimersByTimeAsync(0);
		expect(pass).toHaveBeenCalledTimes(2);
		release[1]();
		await vi.advanceTimersByTimeAsync(5000);
		expect(pass).toHaveBeenCalledTimes(2);
		expect(overlap).toBe(1);
		expect(syncStatus()).toMatchObject({ state: 'idle', passes: 2 });
	});

	it('Scenario: Sync now runs a pass at once', async () => {
		const pass = vi.fn(async () => DONE);
		configureWorker(CFG, { pass, db, debounceMs: 3_600_000, tickMs: 3_600_000 });
		expect(await syncNow()).toEqual(DONE);
		expect(pass).toHaveBeenCalledTimes(1);
		expect(pass).toHaveBeenLastCalledWith({ retryFailed: true });
		await syncNow({ retryFailed: false });
		expect(pass).toHaveBeenLastCalledWith({ retryFailed: false });
		expect(syncStatus().passes).toBe(2);
	});

	it('Scenario: Sync off runs no worker', async () => {
		const pass = vi.fn(async () => DONE);
		configureWorker(null, { pass, db, debounceMs: 1000, tickMs: 1000 });
		nudge();
		await vi.advanceTimersByTimeAsync(3_600_000);
		expect(pass).not.toHaveBeenCalled();
		expect(await syncNow()).toBeNull();
		expect(syncStatus()).toEqual({ state: 'off', profile: null, lastSyncAt: null, lastError: null, nextRetryAt: null, passes: 0 });
	});

	it('Scenario: Last sync time survives a restart', async () => {
		const pass = vi
			.fn<() => Promise<PassOutcome>>()
			.mockResolvedValueOnce(DONE)
			.mockResolvedValueOnce({ kind: 'error', error: 'spawn proton ENOENT' });
		configureWorker(CFG, { pass, db, debounceMs: 3_600_000, tickMs: 3_600_000 });
		expect(syncStatus().lastSyncAt).toBeNull();
		await syncNow();
		expect(lastSync()?.value).toBe('2026-10-18T10:00:00.000Z');

		vi.setSystemTime(new Date('2026-10-18T11:00:00Z'));
		await syncNow();
		expect(lastSync()?.value).toBe('2026-10-18T10:00:00.000Z');

		configureWorker(CFG, { pass, db, debounceMs: 3_600_000, tickMs: 3_600_000 });
		expect(syncStatus()).toMatchObject({ state: 'idle', lastSyncAt: '2026-10-18T10:00:00.000Z', passes: 0 });
	});
});
