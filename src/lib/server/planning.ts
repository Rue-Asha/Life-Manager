import type { DatabaseSync } from 'node:sqlite';
import type { Id, IsoDate, Result } from '$lib/types';
import { addDays, reviewState } from '$lib/week';

type SprintRow = { id: Id; state: string; weekStart: IsoDate | null };

// Where a todo with a planned day lives; raw SQL because sprints.ts and todos.ts both import this.
export type Landing = { sprintId: Id | null; resetStatus: boolean };

function sprintOf(db: DatabaseSync, id: Id): SprintRow {
	return db.prepare('SELECT id, state, week_start AS weekStart FROM sprints WHERE id = ?').get(id) as SprintRow;
}

const inWeek = (day: IsoDate, weekStart: IsoDate) => day >= weekStart && day <= addDays(weekStart, 6);

export function landing(db: DatabaseSync, currentSprintId: Id | null, day: IsoDate, today: IsoDate): Result<Landing> {
	const current = currentSprintId === null ? null : sprintOf(db, currentSprintId);
	if (current?.state === 'closed') {
		if (!inWeek(day, current.weekStart!)) return { ok: false, error: 'day-outside-sprint', field: 'day' };
		return { ok: true, value: { sprintId: current.id, resetStatus: false } };
	}
	const active = db
		.prepare("SELECT id, state, week_start AS weekStart FROM sprints WHERE state = 'active'")
		.get() as SprintRow | undefined;
	const inActive = active !== undefined && inWeek(day, active.weekStart!);
	if (day < today && !inActive) return { ok: false, error: 'day-in-past', field: 'day' };
	if (inActive) {
		if (current?.id === active.id) return { ok: true, value: { sprintId: active.id, resetStatus: false } };
		if (reviewState(active.weekStart!, today) === 'review-required') return { ok: false, error: 'review-required' };
		return { ok: true, value: { sprintId: active.id, resetStatus: true } };
	}
	return { ok: true, value: { sprintId: null, resetStatus: current !== null } };
}
