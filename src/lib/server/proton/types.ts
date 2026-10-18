import type { DatabaseSync } from 'node:sqlite';
import type { HhMm, Id, IsoDate } from '$lib/types';

export type ItemKey = `todo:${number}` | `rule:${number}` | `exam:${number}`;

// Field order is the hash order.
export interface EventSpec {
	title: string; // '✓ ' + title when done; 'Exam · <class name>'
	description: string; // notes; '' for exams
	location: string; // class room / exam room; '' when none
	date: IsoDate; // todo.day | series start | exam date
	start: HhMm | null; // null = all-day
	end: HhMm | null; // slot end; null for start-only, all-day, exams
	durationMin: number | null; // 30 for a start-only slot, 120 for a timed exam, else null
	rrule: string | null; // 'FREQ=WEEKLY;BYDAY=TU,TH' for a series, else null
	exdates: IsoDate[]; // series only, ascending: days with a real instance of the rule; [] otherwise
}

export interface DesiredItem {
	key: ItemKey;
	aspectId: Id;
	label: string;
	spec: EventSpec;
}

export type ProtonOp =
	| { kind: 'calendar.create'; name: string; color: string }
	| { kind: 'event.create'; calendarId: string; spec: EventSpec }
	| { kind: 'event.update'; ref: string; spec: EventSpec }
	| { kind: 'event.delete'; ref: string }
	| { kind: 'event.deleteOccurrence'; ref: string; occurrence: string }; // 'YYYY-MM-DD' (all-day) | 'YYYY-MM-DDTHH:MM'

export type CliResult =
	| { ok: true; ids: string[] }
	| { ok: false; code: number; error: string } // exit code ≠ 0; error = stderr's 'Error: …' line
	| { ok: false; code: 'spawn'; error: string }; // binary missing / not executable

export type Runner = (op: ProtonOp) => Promise<CliResult>;

export interface ProtonConfig {
	cli: string;
	profile: string;
}

export type PassOutcome =
	| { kind: 'done'; calls: number; failed: number }
	| { kind: 'retry'; error: string } // exit 5
	| { kind: 'relogin'; error: string } // exit 2
	| { kind: 'error'; error: string }; // spawn failure

export type SyncState = 'off' | 'idle' | 'syncing' | 'relogin' | 'error';

export interface SyncStatus {
	state: SyncState;
	profile: string | null; // null when off
	lastSyncAt: string | null; // settings 'proton_last_sync_at': end of the last pass that ended 'done'
	lastError: string | null;
	nextRetryAt: string | null; // backoff or re-login retry
	passes: number; // passes started since configureWorker
}

export interface WorkerOptions {
	debounceMs?: number; // 30_000
	tickMs?: number; // 300_000
	gapMs?: number; // 1_000
	pass?: (o: { retryFailed: boolean }) => Promise<PassOutcome>; // tests; default: runPass with createRunner
	db?: DatabaseSync; // tests; default getDb() — holds proton_last_sync_at
}

export interface FailedItem {
	key: ItemKey;
	label: string;
	error: string;
}
