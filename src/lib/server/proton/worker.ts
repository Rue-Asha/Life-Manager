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

const database = (): DatabaseSync => opts.db ?? getDb();

function stopTimers(): void {
	clearTimeout(debounceTimer);
	clearInterval(tickTimer);
	debounceTimer = tickTimer = undefined;
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
	if (!cfg) {
		state = 'off';
		return;
	}
	state = 'idle';
	debounceTimer = setTimeout(() => void request(false), o.debounceMs ?? 30_000);
	tickTimer = setInterval(() => void request(false), o.tickMs ?? 300_000);
}

function defaultPass(config: ProtonConfig): Pass {
	const run = createRunner(config, { gapMs: opts.gapMs });
	return (o) => runPass(database(), today(), run, o);
}

function request(retryFailed: boolean): Promise<PassOutcome | null> {
	if (!cfg) return Promise.resolve(null);
	if (!running) return start(retryFailed);
	if (!pending) {
		let resolve!: Pending['resolve'];
		const promise = new Promise<PassOutcome | null>((r) => (resolve = r));
		pending = { retryFailed, promise, resolve };
	} else pending.retryFailed ||= retryFailed;
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
		if (next) next.resolve(start(next.retryFailed));
		return outcome;
	});
	running = current;
	return current;
}

function finish(outcome: PassOutcome): void {
	state = 'idle';
	if (outcome.kind === 'done') {
		lastError = null;
		database()
			.prepare("INSERT INTO settings (key, value) VALUES ('proton_last_sync_at', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
			.run(new Date().toISOString());
	}
}

export function nudge(): void {
	if (!cfg) return;
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => void request(false), opts.debounceMs ?? 30_000);
}

export function syncNow(o: { retryFailed?: boolean } = {}): Promise<PassOutcome | null> {
	return request(o.retryFailed ?? true);
}

export async function resyncAll(): Promise<PassOutcome | null> {
	if (!cfg) return null;
	forgetHashes(database());
	return syncNow();
}

export function syncStatus(): SyncStatus {
	if (!cfg) return { state: 'off', profile: null, lastSyncAt: null, lastError: null, nextRetryAt: null, passes: 0 };
	const row = database().prepare("SELECT value FROM settings WHERE key = 'proton_last_sync_at'").get() as { value: string } | undefined;
	return { state, profile: cfg.profile, lastSyncAt: row?.value ?? null, lastError, nextRetryAt: null, passes };
}

export async function resetWorker(): Promise<void> {
	stopTimers();
	generation++;
	await running;
	configureWorker(readConfig(process.env));
}
