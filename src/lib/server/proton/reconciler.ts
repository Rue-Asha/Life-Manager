import type { DatabaseSync } from 'node:sqlite';
import type { AspectColor } from '$lib/aspect-style';
import type { Id } from '$lib/types';
import { now } from '../clock';
import { PROTON_COLORS } from './colors';
import { specHash } from './hash';
import type { DesiredItem, FailedItem, PassOutcome, ProtonOp, Runner } from './types';

interface Row {
	key: string;
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

	async function calendarFor(aspectId: Id): Promise<string | null> {
		const stored = db.prepare('SELECT calendar_id FROM proton_calendars WHERE aspect_id = ?').get(aspectId) as
			| { calendar_id: string }
			| undefined;
		if (stored) return stored.calendar_id;
		const aspect = db.prepare('SELECT name, color FROM aspects WHERE id = ?').get(aspectId) as
			| { name: string; color: AspectColor }
			| undefined;
		if (!aspect) return null;
		const r = await call({ kind: 'calendar.create', name: aspect.name, color: PROTON_COLORS[aspect.color] });
		if (!r.ok) return null;
		db.prepare('INSERT INTO proton_calendars (aspect_id, calendar_id) VALUES (?, ?)').run(aspectId, r.ids[0]);
		return r.ids[0];
	}

	for (const d of desired) {
		const hash = specHash(d.spec);
		const calendarId = await calendarFor(d.aspectId);
		if (!calendarId) continue;
		const r = await call({ kind: 'event.create', calendarId, spec: d.spec });
		if (!r.ok) continue;
		writeRow(db, { key: d.key, label: d.label, calendar_id: calendarId, event_ref: r.ids[0], hash, error: null, error_hash: null });
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
