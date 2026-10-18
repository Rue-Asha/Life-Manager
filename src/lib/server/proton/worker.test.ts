import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { createFake } from '../../../../scripts/fake-proton.mjs';
import { createAspect } from '../aspects';
import { setDay } from '../sprints';
import { createTodo } from '../todos';
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

	it('Scenario: Network failure backs off up to 30 minutes', async () => {
		const retry: PassOutcome = { kind: 'retry', error: 'Error: network down' };
		const pass = vi.fn<() => Promise<PassOutcome>>(async () => retry);
		configureWorker(CFG, { pass, db, debounceMs: 1000, tickMs: 60_000 });
		await vi.advanceTimersByTimeAsync(1000);
		expect(syncStatus()).toMatchObject({ state: 'error', lastError: 'Error: network down', nextRetryAt: '2026-10-18T10:01:01.000Z' });

		nudge();
		await vi.advanceTimersByTimeAsync(5000);
		expect(pass).toHaveBeenCalledTimes(1);

		const minutes = [1, 2, 4, 8, 16, 30, 30];
		let calls = 1;
		for (const [i, m] of minutes.entries()) {
			const next = i + 1 < minutes.length ? minutes[i + 1] : 30;
			await vi.advanceTimersByTimeAsync(m * 60_000 - (i === 0 ? 5000 : 0) - 1);
			expect(pass).toHaveBeenCalledTimes(calls);
			await vi.advanceTimersByTimeAsync(1);
			expect(pass).toHaveBeenCalledTimes(++calls);
			expect(syncStatus().nextRetryAt).toBe(new Date(Date.now() + next * 60_000).toISOString());
		}

		pass.mockResolvedValue(DONE);
		await vi.advanceTimersByTimeAsync(30 * 60_000);
		expect(syncStatus()).toMatchObject({ state: 'idle', lastError: null, nextRetryAt: null });
		pass.mockResolvedValueOnce(retry);
		await syncNow();
		expect(syncStatus().nextRetryAt).toBe(new Date(Date.now() + 60_000).toISOString());
	});

	it('Scenario: Auth failure pauses sync until Sync now', async () => {
		const pass = vi
			.fn<() => Promise<PassOutcome>>()
			.mockResolvedValueOnce({ kind: 'relogin', error: 'Error: session expired' })
			.mockResolvedValue(DONE);
		configureWorker(CFG, { pass, db, debounceMs: 1000, tickMs: 60_000 });
		await vi.advanceTimersByTimeAsync(1000);
		expect(syncStatus()).toMatchObject({ state: 'relogin', lastError: 'Error: session expired', nextRetryAt: '2026-10-18T10:30:01.000Z' });

		nudge();
		await vi.advanceTimersByTimeAsync(29 * 60_000);
		expect(pass).toHaveBeenCalledTimes(1);

		expect(await syncNow()).toEqual(DONE);
		expect(syncStatus()).toMatchObject({ state: 'idle', lastError: null, nextRetryAt: null });

		pass.mockResolvedValueOnce({ kind: 'relogin', error: 'again' });
		await syncNow();
		await vi.advanceTimersByTimeAsync(30 * 60_000);
		expect(pass).toHaveBeenCalledTimes(4);
		expect(syncStatus().state).toBe('idle');
	});

	it('Scenario: Missing binary sets state error', async () => {
		const pass = vi
			.fn<() => Promise<PassOutcome>>()
			.mockResolvedValueOnce({ kind: 'error', error: 'spawn /bin/proton ENOENT' })
			.mockResolvedValue(DONE);
		configureWorker(CFG, { pass, db, debounceMs: 1000, tickMs: 3_600_000 });
		await vi.advanceTimersByTimeAsync(1000);
		expect(syncStatus()).toMatchObject({ state: 'error', lastError: 'spawn /bin/proton ENOENT', nextRetryAt: null });

		nudge();
		await vi.advanceTimersByTimeAsync(1000);
		expect(pass).toHaveBeenCalledTimes(2);
		expect(syncStatus()).toMatchObject({ state: 'idle', lastError: null });
	});

	it('Scenario: A pass that throws ends in state error and the next pass runs', async () => {
		const pass = vi
			.fn<() => Promise<PassOutcome>>()
			.mockRejectedValueOnce(new Error('FOREIGN KEY constraint failed'))
			.mockResolvedValue(DONE);
		configureWorker(CFG, { pass, db, debounceMs: 3_600_000, tickMs: 3_600_000 });
		const first = syncNow();
		const queued = syncNow();
		expect(await first).toEqual({ kind: 'error', error: 'FOREIGN KEY constraint failed' });
		expect(await queued).toEqual(DONE);
		expect(pass).toHaveBeenCalledTimes(2);
		expect(syncStatus()).toMatchObject({ state: 'idle', lastError: null, passes: 2 });

		pass.mockRejectedValueOnce(new Error('again'));
		expect(await syncNow()).toEqual({ kind: 'error', error: 'again' });
		expect(syncStatus()).toMatchObject({ state: 'error', lastError: 'again' });
		expect(await syncNow()).toEqual(DONE);
	});

	it('Scenario: Mutations stay one gap apart across passes', async () => {
		vi.useRealTimers();
		const dir = mkdtempSync(join(tmpdir(), 'lm-worker-'));
		const fake = createFake(dir);
		const saved = process.env.FAKE_PROTON_DIR;
		process.env.FAKE_PROTON_DIR = dir;
		try {
			const aspectId = (createAspect(db, { name: 'Health', color: 'sage', icon: 'heart' }) as { ok: true; value: { id: number } }).value.id;
			const planned = (title: string) => {
				const t = createTodo(db, { title, aspectId }, '2099-01-01') as { ok: true; value: { id: number } };
				setDay(db, t.value.id, '2099-01-05', '2099-01-01');
			};
			planned('One');
			configureWorker({ cli: resolve('scripts/fake-proton.mjs'), profile: 'default' }, { db, gapMs: 400, debounceMs: 3_600_000, tickMs: 3_600_000 });
			const first = syncNow();
			const second = syncNow();
			planned('Two');
			await first;
			await second;
			const calls = fake.calls();
			expect(calls).toHaveLength(3);
			expect(calls[2].at - calls[1].end).toBeGreaterThanOrEqual(400);
		} finally {
			if (saved === undefined) delete process.env.FAKE_PROTON_DIR;
			else process.env.FAKE_PROTON_DIR = saved;
			rmSync(dir, { recursive: true, force: true });
		}
	}, 10_000);
});
