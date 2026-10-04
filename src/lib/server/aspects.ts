import type { DatabaseSync } from 'node:sqlite';
import { ASPECT_COLORS, ASPECT_ICONS } from '$lib/aspect-style';
import type { Aspect, AspectInput, Id, Result } from '$lib/types';

const columns = 'id, name, color, icon, position';

export function listAspects(db: DatabaseSync): Aspect[] {
	return db.prepare(`SELECT ${columns} FROM aspects ORDER BY position, id`).all() as unknown as Aspect[];
}

export function countAspects(db: DatabaseSync): number {
	return (db.prepare('SELECT count(*) AS n FROM aspects').get() as { n: number }).n;
}

function getAspect(db: DatabaseSync, id: Id): Aspect | null {
	return (db.prepare(`SELECT ${columns} FROM aspects WHERE id = ?`).get(id) as Aspect | undefined) ?? null;
}

function validate(db: DatabaseSync, input: AspectInput, id: Id | null): Result<AspectInput> {
	const name = input.name.trim();
	if (!name) return { ok: false, error: 'required', field: 'name' };
	if (!Object.hasOwn(ASPECT_COLORS, input.color)) return { ok: false, error: 'required', field: 'color' };
	if (!Object.hasOwn(ASPECT_ICONS, input.icon)) return { ok: false, error: 'required', field: 'icon' };
	// SQLite's lower() (and so the unique index) folds ASCII only; "Ärzte" vs "ärzte" is caught here.
	const key = name.toLowerCase();
	const taken = listAspects(db).some((a) => a.id !== id && a.name.toLowerCase() === key);
	if (taken) return { ok: false, error: 'duplicate', field: 'name' };
	return { ok: true, value: { name, color: input.color, icon: input.icon } };
}

export function createAspect(db: DatabaseSync, input: AspectInput): Result<Aspect> {
	const v = validate(db, input, null);
	if (!v.ok) return v;
	const { lastInsertRowid } = db
		.prepare(
			`INSERT INTO aspects (name, color, icon, position, created_at)
			 VALUES (?, ?, ?, (SELECT coalesce(max(position) + 1, 0) FROM aspects), ?)`
		)
		.run(v.value.name, v.value.color, v.value.icon, new Date().toISOString());
	return { ok: true, value: getAspect(db, Number(lastInsertRowid))! };
}

export function updateAspect(db: DatabaseSync, id: Id, input: AspectInput): Result<Aspect> {
	if (!getAspect(db, id)) return { ok: false, error: 'not-found' };
	const v = validate(db, input, id);
	if (!v.ok) return v;
	db.prepare('UPDATE aspects SET name = ?, color = ?, icon = ? WHERE id = ?').run(
		v.value.name,
		v.value.color,
		v.value.icon,
		id
	);
	return { ok: true, value: getAspect(db, id)! };
}

export function aspectUsage(db: DatabaseSync, id: Id): { todos: number; rules: number } {
	return db
		.prepare(
			`SELECT (SELECT count(*) FROM todos WHERE aspect_id = ?1) AS todos,
			        (SELECT count(*) FROM recurring_rules WHERE aspect_id = ?1) AS rules`
		)
		.get(id) as { todos: number; rules: number };
}

export function deleteAspect(db: DatabaseSync, id: Id, targetId?: Id): Result<void> {
	if (!getAspect(db, id)) return { ok: false, error: 'not-found' };
	const usage = aspectUsage(db, id);
	const inUse = usage.todos + usage.rules > 0;
	if (inUse) {
		if (countAspects(db) === 1) return { ok: false, error: 'only-aspect-in-use' };
		if (targetId === undefined || targetId === id) return { ok: false, error: 'target-required', field: 'targetId' };
		if (!getAspect(db, targetId)) return { ok: false, error: 'not-found', field: 'targetId' };
	}
	db.exec('BEGIN');
	try {
		if (inUse) {
			db.prepare(
				'UPDATE todos SET aspect_id = ?, project_id = NULL, class_id = NULL, type = NULL, revised_at = NULL WHERE aspect_id = ?'
			).run(targetId!, id);
			db.prepare('UPDATE recurring_rules SET aspect_id = ?, class_id = NULL, type = NULL WHERE aspect_id = ?').run(
				targetId!,
				id
			);
		}
		// A bare id left in settings could be handed to a later aspect that reuses the rowid.
		db.prepare("DELETE FROM settings WHERE key IN ('it_aspect_id', 'uni_aspect_id') AND value = ?").run(String(id));
		db.prepare('DELETE FROM aspects WHERE id = ?').run(id);
		db.exec('COMMIT');
	} catch (err) {
		db.exec('ROLLBACK');
		throw err;
	}
	return { ok: true, value: undefined };
}
