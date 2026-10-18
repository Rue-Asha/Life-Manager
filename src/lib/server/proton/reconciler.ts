import type { DatabaseSync } from 'node:sqlite';
import type { AspectColor } from '$lib/aspect-style';
import type { Id } from '$lib/types';
import { now } from '../clock';
import { PROTON_COLORS } from './colors';
import { specHash } from './hash';
import type { CliResult, DesiredItem, FailedItem, ItemKey, PassOutcome, ProtonOp, Runner } from './types';

interface Row {
	key: ItemKey;
	label: string;
	calendar_id: string | null;
	event_ref: string | null;
	hash: string | null;
	error: string | null;
	error_hash: string | null;
}

const selectRows = 'SELECT key, label, calendar_id, event_ref, hash, error, error_hash FROM proton_items';

function readRow(db: DatabaseSync, key: ItemKey): Row | undefined {
	return db.prepare(`${selectRows} WHERE key = ?`).get(key) as unknown as Row | undefined;
}

function readRows(db: DatabaseSync): Map<string, Row> {
	return new Map((db.prepare(selectRows).all() as unknown as Row[]).map((r) => [r.key, r]));
}

function writeRow(db: DatabaseSync, r: Row): void {
	db.prepare(
		`INSERT INTO proton_items (key, label, calendar_id, event_ref, hash, error, error_hash, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT (key) DO UPDATE SET label = excluded.label, calendar_id = excluded.calendar_id,
			event_ref = excluded.event_ref, hash = excluded.hash, error = excluded.error,
			error_hash = excluded.error_hash, updated_at = excluded.updated_at`
	).run(r.key, r.label, r.calendar_id, r.event_ref, r.hash, r.error, r.error_hash, now().toISOString());
}

class Abort {
	constructor(readonly outcome: PassOutcome) {}
}

// The item's aspect vanished mid-pass; its next pass finds it under the new aspect.
class Skip {}

class Failure {
	constructor(readonly error: string) {}
}

function expectOk(res: CliResult): asserts res is Extract<CliResult, { ok: true }> {
	if (!res.ok) throw new Failure(res.error);
}

export async function reconcile(
	db: DatabaseSync,
	desired: DesiredItem[],
	run: Runner,
	o?: { retryFailed?: boolean }
): Promise<PassOutcome> {
	let calls = 0;
	let failed = 0;
	const call = async (op: ProtonOp): Promise<CliResult> => {
		calls++;
		const res = await run(op);
		if (!res.ok) {
			if (res.code === 'spawn') throw new Abort({ kind: 'error', error: res.error });
			if (res.code === 2) throw new Abort({ kind: 'relogin', error: res.error });
			if (res.code === 5) throw new Abort({ kind: 'retry', error: res.error });
		}
		return res;
	};

	const storedCalendar = (aspectId: Id): string | null =>
		(
			db.prepare('SELECT calendar_id FROM proton_calendars WHERE aspect_id = ?').get(aspectId) as
				| { calendar_id: string }
				| undefined
		)?.calendar_id ?? null;

	async function calendarFor(aspectId: Id): Promise<string> {
		const stored = storedCalendar(aspectId);
		if (stored) return stored;
		const aspect = db.prepare('SELECT name, color FROM aspects WHERE id = ?').get(aspectId) as
			| { name: string; color: AspectColor }
			| undefined;
		if (!aspect) throw new Skip();
		const r = await call({ kind: 'calendar.create', name: aspect.name, color: PROTON_COLORS[aspect.color] });
		expectOk(r);
		if (!db.prepare('SELECT 1 FROM aspects WHERE id = ?').get(aspectId)) throw new Skip();
		db.prepare('INSERT INTO proton_calendars (aspect_id, calendar_id) VALUES (?, ?)').run(aspectId, r.ids[0]);
		return r.ids[0];
	}

	function recordFailure(key: ItemKey, label: string, error: string, errorHash: string): void {
		failed++;
		const prev = readRow(db, key);
		writeRow(db, {
			key,
			label,
			calendar_id: prev?.calendar_id ?? null,
			event_ref: prev?.event_ref ?? null,
			hash: prev?.hash ?? null,
			error,
			error_hash: errorHash
		});
	}

	try {
		const rows = readRows(db);
		const wanted = new Set(desired.map((d) => d.key));
		for (const r of rows.values()) {
			if (wanted.has(r.key)) continue;
			if (r.error_hash === 'delete' && !o?.retryFailed) continue;
			try {
				if (r.event_ref) {
					const res = await call({ kind: 'event.delete', ref: r.event_ref });
					if (!res.ok && res.code !== 3) expectOk(res);
				}
				db.prepare('DELETE FROM proton_items WHERE key = ?').run(r.key);
			} catch (e) {
				if (!(e instanceof Failure)) throw e;
				recordFailure(r.key, r.label, e.error, 'delete');
			}
		}

		for (const d of desired) {
			const hash = specHash(d.spec);
			const row = rows.get(d.key);
			if (row?.error_hash === hash && !o?.retryFailed) continue;
			const target = storedCalendar(d.aspectId);
			if (row?.event_ref && row.hash === hash && target && row.calendar_id === target) {
				if (row.error !== null) writeRow(db, { ...row, label: d.label, error: null, error_hash: null });
				continue;
			}
			try {
				let calendarId = await calendarFor(d.aspectId);
				const base = { key: d.key, label: d.label, error: null, error_hash: null };
				let ref = row?.event_ref ?? null;
				if (ref && row?.calendar_id !== calendarId) {
					const res = await call({ kind: 'event.delete', ref });
					if (!res.ok && res.code !== 3) expectOk(res);
					ref = null;
					writeRow(db, { ...base, calendar_id: null, event_ref: null, hash: null });
				}
				if (ref) {
					const res = await call({ kind: 'event.update', ref, spec: d.spec });
					if (res.ok) writeRow(db, { ...base, calendar_id: calendarId, event_ref: ref, hash: null });
					else if (res.code === 3) ref = null;
					else expectOk(res);
				}
				if (!ref) {
					let res = await call({ kind: 'event.create', calendarId, spec: d.spec });
					if (!res.ok && res.code === 3) {
						db.prepare('DELETE FROM proton_calendars WHERE aspect_id = ?').run(d.aspectId);
						calendarId = await calendarFor(d.aspectId);
						res = await call({ kind: 'event.create', calendarId, spec: d.spec });
					}
					expectOk(res);
					ref = res.ids[0];
					writeRow(db, { ...base, calendar_id: calendarId, event_ref: ref, hash: null });
				}

				for (const day of d.spec.exdates) {
					const occurrence = d.spec.start ? `${day}T${d.spec.start}` : day;
					const res = await call({ kind: 'event.deleteOccurrence', ref, occurrence });
					if (!res.ok && res.code !== 3) expectOk(res);
				}
				writeRow(db, { ...base, calendar_id: calendarId, event_ref: ref, hash });
			} catch (e) {
				if (e instanceof Skip) continue;
				if (!(e instanceof Failure)) throw e;
				recordFailure(d.key, d.label, e.error, hash);
			}
		}
	} catch (e) {
		if (e instanceof Abort) return e.outcome;
		throw e;
	}
	return { kind: 'done', calls, failed };
}

export function pendingCount(db: DatabaseSync, desired: DesiredItem[]): number {
	const rows = readRows(db);
	const wanted = new Set(desired.map((d) => d.key));
	const calendars = new Map(
		(db.prepare('SELECT aspect_id, calendar_id FROM proton_calendars').all() as { aspect_id: Id; calendar_id: string }[]).map(
			(c) => [c.aspect_id, c.calendar_id]
		)
	);
	let n = 0;
	for (const r of rows.values()) if (!wanted.has(r.key) && r.event_ref && r.error_hash !== 'delete') n++;
	for (const d of desired) {
		const hash = specHash(d.spec);
		const row = rows.get(d.key);
		if (row?.error_hash === hash) continue;
		const target = calendars.get(d.aspectId) ?? null;
		if (row?.event_ref && row.hash === hash && target && row.calendar_id === target) continue;
		n += row?.event_ref && row.calendar_id !== target ? 2 : 1;
		n += d.spec.exdates.length;
	}
	return n;
}

export function failedItems(db: DatabaseSync): FailedItem[] {
	return (
		db.prepare('SELECT key, label, error FROM proton_items WHERE error IS NOT NULL ORDER BY key').all() as unknown as FailedItem[]
	);
}

export function forgetHashes(db: DatabaseSync): void {
	db.exec('UPDATE proton_items SET hash = NULL, error = NULL, error_hash = NULL');
}
