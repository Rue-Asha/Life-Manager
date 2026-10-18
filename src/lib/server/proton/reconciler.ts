import type { DatabaseSync } from 'node:sqlite';
import type { AspectColor } from '$lib/aspect-style';
import type { Id } from '$lib/types';
import { now } from '../clock';
import { PROTON_COLORS } from './colors';
import { specHash } from './hash';
import type { DesiredItem, FailedItem, ItemKey, PassOutcome, ProtonOp, Runner } from './types';

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

export async function reconcile(
	db: DatabaseSync,
	desired: DesiredItem[],
	run: Runner,
	o?: { retryFailed?: boolean }
): Promise<PassOutcome> {
	let calls = 0;
	const call = (op: ProtonOp) => {
		calls++;
		return run(op);
	};

	const storedCalendar = (aspectId: Id): string | null =>
		(
			db.prepare('SELECT calendar_id FROM proton_calendars WHERE aspect_id = ?').get(aspectId) as
				| { calendar_id: string }
				| undefined
		)?.calendar_id ?? null;

	async function calendarFor(aspectId: Id): Promise<string | null> {
		const stored = storedCalendar(aspectId);
		if (stored) return stored;
		const aspect = db.prepare('SELECT name, color FROM aspects WHERE id = ?').get(aspectId) as
			| { name: string; color: AspectColor }
			| undefined;
		if (!aspect) return null;
		const r = await call({ kind: 'calendar.create', name: aspect.name, color: PROTON_COLORS[aspect.color] });
		if (!r.ok) return null;
		db.prepare('INSERT INTO proton_calendars (aspect_id, calendar_id) VALUES (?, ?)').run(aspectId, r.ids[0]);
		return r.ids[0];
	}

	const rows = readRows(db);
	const wanted = new Set(desired.map((d) => d.key));
	for (const r of rows.values()) {
		if (wanted.has(r.key)) continue;
		if (r.event_ref) {
			const res = await call({ kind: 'event.delete', ref: r.event_ref });
			if (!res.ok && res.code !== 3) continue;
		}
		db.prepare('DELETE FROM proton_items WHERE key = ?').run(r.key);
	}

	for (const d of desired) {
		const hash = specHash(d.spec);
		const row = rows.get(d.key);
		const target = storedCalendar(d.aspectId);
		if (row?.event_ref && row.hash === hash && target && row.calendar_id === target) continue;

		let calendarId = await calendarFor(d.aspectId);
		if (!calendarId) continue;
		const base = { key: d.key, label: d.label, error: null, error_hash: null };
		let ref = row?.event_ref ?? null;
		if (ref && row?.calendar_id !== calendarId) {
			const res = await call({ kind: 'event.delete', ref });
			if (!res.ok && res.code !== 3) continue;
			ref = null;
		}
		if (ref) {
			const res = await call({ kind: 'event.update', ref, spec: d.spec });
			if (res.ok) {
				writeRow(db, { ...base, calendar_id: calendarId, event_ref: ref, hash: null });
			} else if (res.code === 3) ref = null;
			else continue;
		}
		if (!ref) {
			let res = await call({ kind: 'event.create', calendarId, spec: d.spec });
			if (!res.ok && res.code === 3) {
				db.prepare('DELETE FROM proton_calendars WHERE aspect_id = ?').run(d.aspectId);
				calendarId = await calendarFor(d.aspectId);
				if (!calendarId) continue;
				res = await call({ kind: 'event.create', calendarId, spec: d.spec });
			}
			if (!res.ok) continue;
			ref = res.ids[0];
			writeRow(db, { ...base, calendar_id: calendarId, event_ref: ref, hash: null });
		}

		let complete = true;
		for (const day of d.spec.exdates) {
			const occurrence = d.spec.start ? `${day}T${d.spec.start}` : day;
			const res = await call({ kind: 'event.deleteOccurrence', ref, occurrence });
			if (!res.ok && res.code !== 3) {
				complete = false;
				break;
			}
		}
		if (complete) writeRow(db, { ...base, calendar_id: calendarId, event_ref: ref, hash });
	}
	return { kind: 'done', calls, failed: 0 };
}

export function pendingCount(db: DatabaseSync, desired: DesiredItem[]): number {
	return 0;
}

export function failedItems(db: DatabaseSync): FailedItem[] {
	return [];
}

export function forgetHashes(db: DatabaseSync): void {}
