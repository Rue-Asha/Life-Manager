import type { DatabaseSync } from 'node:sqlite';
import { today } from '../clock';
import { getDb } from '../db';
import { readConfig } from './config';
import { createRunner } from './cli';
import { runPass } from './pass';
import { forgetHashes } from './reconciler';
import type { PassOutcome, ProtonConfig, SyncState, WorkerOptions } from './types';
import type { SyncStatus } from './types';

type Pass = NonNullable<WorkerOptions['pass']>;
interface Pending {
	retryFailed: boolean;
	explicit: boolean;
	promise: Promise<PassOutcome | null>;
	resolve: (outcome: PassOutcome | null | Promise<PassOutcome | null>) => void;
}

let cfg: ProtonConfig | null = null;
let opts: WorkerOptions = {};
let generation = 0;
let state: SyncState = 'off';
let lastError: string | null = null;
let passes = 0;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let tickTimer: ReturnType<typeof setInterval> | undefined;
let running: Promise<PassOutcome | null> | null = null;
let pending: Pending | null = null;
let blockedUntil: number | null = null;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let backoffStep = 0;

const database = (): DatabaseSync => opts.db ?? getDb();

function stopTimers(): void {
	clearTimeout(debounceTimer);
	clearInterval(tickTimer);
	clearTimeout(retryTimer);
	debounceTimer = tickTimer = retryTimer = undefined;
}

export function configureWorker(next: ProtonConfig | null, o: WorkerOptions = {}): void {
	stopTimers();
	generation++;
	pending?.resolve(null);
	pending = null;
	running = null;
	cfg = next;
	opts = o;
	passes = 0;
	lastError = null;
	blockedUntil = null;
	backoffStep = 0;
	if (!cfg) {
		state = 'off';
		return;
	}
	state = 'idle';
	debounceTimer = setTimeout(scheduled, o.debounceMs ?? 30_000);
	tickTimer = setInterval(scheduled, o.tickMs ?? 300_000);
}

function scheduled(): void {
	if (blockedUntil === null) void request(false, false);
}

function block(ms: number): void {
	blockedUntil = Date.now() + ms;
	clearTimeout(retryTimer);
	retryTimer = setTimeout(() => {
		blockedUntil = null;
		void request(false, true);
	}, ms);
}

function unblock(): void {
	blockedUntil = null;
	clearTimeout(retryTimer);
}

function defaultPass(config: ProtonConfig): Pass {
	const run = createRunner(config, { gapMs: opts.gapMs });
	return (o) => runPass(database(), today(), run, o);
}

function request(retryFailed: boolean, explicit: boolean): Promise<PassOutcome | null> {
	if (!cfg) return Promise.resolve(null);
	if (!running) return start(retryFailed);
	if (!pending) {
		let resolve!: Pending['resolve'];
		const promise = new Promise<PassOutcome | null>((r) => (resolve = r));
		pending = { retryFailed, explicit, promise, resolve };
	} else {
		pending.retryFailed ||= retryFailed;
		pending.explicit ||= explicit;
	}
	return pending.promise;
}

function start(retryFailed: boolean): Promise<PassOutcome | null> {
	const gen = generation;
	const pass = opts.pass ?? defaultPass(cfg as ProtonConfig);
	state = 'syncing';
	passes++;
	const current = pass({ retryFailed }).then((outcome) => {
		if (gen !== generation) return null;
		finish(outcome);
		running = null;
		const next = pending;
		pending = null;
		if (next) next.resolve(next.explicit || blockedUntil === null ? start(next.retryFailed) : null);
		return outcome;
	});
	running = current;
	return current;
}

function finish(outcome: PassOutcome): void {
	if (outcome.kind === 'done') {
		state = 'idle';
		lastError = null;
		backoffStep = 0;
		unblock();
		database()
			.prepare("INSERT INTO settings (key, value) VALUES ('proton_last_sync_at', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
			.run(new Date().toISOString());
		return;
	}
	lastError = outcome.error;
	if (outcome.kind === 'retry') {
		state = 'error';
		block(Math.min(2 ** backoffStep++, 30) * 60_000);
	} else if (outcome.kind === 'relogin') {
		state = 'relogin';
		block(30 * 60_000);
	} else state = 'error';
}

export function nudge(): void {
	if (!cfg || blockedUntil !== null) return;
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(scheduled, opts.debounceMs ?? 30_000);
}

export function syncNow(o: { retryFailed?: boolean } = {}): Promise<PassOutcome | null> {
	unblock();
	return request(o.retryFailed ?? true, true);
}

export async function resyncAll(): Promise<PassOutcome | null> {
	if (!cfg) return null;
	forgetHashes(database());
	return syncNow();
}

export function syncStatus(): SyncStatus {
	if (!cfg) return { state: 'off', profile: null, lastSyncAt: null, lastError: null, nextRetryAt: null, passes: 0 };
	const row = database().prepare("SELECT value FROM settings WHERE key = 'proton_last_sync_at'").get() as { value: string } | undefined;
	return { state, profile: cfg.profile, lastSyncAt: row?.value ?? null, lastError, nextRetryAt: blockedUntil === null ? null : new Date(blockedUntil).toISOString(), passes };
}

export async function resetWorker(): Promise<void> {
	stopTimers();
	generation++;
	await running;
	configureWorker(readConfig(process.env));
}
