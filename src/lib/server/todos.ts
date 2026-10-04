import type { DatabaseSync } from 'node:sqlite';
import { isPriority } from '$lib/todo-utils';
import { CLASS_TYPES } from '$lib/uni';
import { getItAspectId } from './projects';
import { classWritable, getUniAspectId, todoWritable } from './uni';
import type { ChecklistItem, ClassType, Id, IsoDate, NewTodo, Result, Todo, TodoPatch } from '$lib/types';

type TodoRow = Omit<Todo, 'recurring' | 'checklist'> & { recurring: number };
type ItemRow = Omit<ChecklistItem, 'done'> & { done: number };

const todoColumns = `id, title, aspect_id AS aspectId, notes, priority, due_date AS dueDate,
	sprint_id AS sprintId, status, day, recurring, rule_id AS ruleId, project_id AS projectId, class_id AS classId, type,
	revised_at AS revisedAt, created_at AS createdAt, completed_at AS completedAt`;
const itemColumns = 'id, todo_id AS todoId, text, done, position';

function toItem(row: ItemRow): ChecklistItem {
	return { ...row, done: row.done === 1 };
}

function withChecklists(db: DatabaseSync, rows: TodoRow[]): Todo[] {
	if (rows.length === 0) return [];
	const items = db
		.prepare(
			`SELECT ${itemColumns} FROM checklist_items
			 WHERE todo_id IN (SELECT value FROM json_each(?)) ORDER BY position, id`
		)
		.all(JSON.stringify(rows.map((r) => r.id))) as unknown as ItemRow[];
	return rows.map((r) => ({
		...r,
		recurring: r.recurring === 1,
		checklist: items.filter((i) => i.todoId === r.id).map(toItem)
	}));
}

function aspectExists(db: DatabaseSync, id: Id): boolean {
	return db.prepare('SELECT 1 FROM aspects WHERE id = ?').get(id) !== undefined;
}

function projectExists(db: DatabaseSync, id: Id): boolean {
	return db.prepare('SELECT 1 FROM it_projects WHERE id = ?').get(id) !== undefined;
}

// Only todos of the IT aspect can carry a link; for any other aspect it is dropped, not an error.
function linkFor(db: DatabaseSync, projectId: Id | null | undefined, aspectId: Id): Id | null {
	return projectId != null && getItAspectId(db) === aspectId ? projectId : null;
}

type ClassLink = { classId: Id | null; type: ClassType | null; revisedAt: IsoDate | null };

// Like the project link, a class link only lives on todos of the Uni aspect; elsewhere it is dropped.
// A posted class must exist and be writable; a type needs a class and defaults to OTH.
function classLinkFor(
	db: DatabaseSync,
	aspectId: Id,
	classId: Id | null,
	type: ClassType | null | undefined,
	revisedAt: IsoDate | null
): Result<ClassLink> {
	if (type != null && !CLASS_TYPES.includes(type)) return { ok: false, error: 'invalid', field: 'type' };
	if (classId === null || getUniAspectId(db) !== aspectId) {
		return { ok: true, value: { classId: null, type: null, revisedAt: null } };
	}
	return { ok: true, value: { classId, type: type ?? 'OTH', revisedAt } };
}

export function createTodo(db: DatabaseSync, input: NewTodo): Result<Todo> {
	const title = input.title.trim();
	if (!title) return { ok: false, error: 'required', field: 'title' };
	if (!aspectExists(db, input.aspectId)) return { ok: false, error: 'no-aspect', field: 'aspectId' };
	if (input.priority !== undefined && !isPriority(input.priority)) return { ok: false, error: 'required', field: 'priority' };

	if (input.projectId != null && !projectExists(db, input.projectId)) {
		return { ok: false, error: 'not-found', field: 'projectId' };
	}
	const link = classLinkFor(db, input.aspectId, input.classId ?? null, input.type, null);
	if (!link.ok) return link;
	if (link.value.classId !== null) {
		const writable = classWritable(db, link.value.classId);
		if (!writable.ok) return writable;
	}

	const target = input.target ?? { kind: 'backlog' };
	let sprintId: Id | null = null;
	let day: IsoDate | null = null;
	if (target.kind !== 'backlog') {
		const sprint = db
			.prepare("SELECT id, week_start AS weekStart, date(week_start, '+6 days') AS weekEnd FROM sprints WHERE state = 'active'")
			.get() as { id: Id; weekStart: IsoDate; weekEnd: IsoDate } | undefined;
		if (!sprint) return { ok: false, error: 'no-active-sprint' };
		sprintId = sprint.id;
		if (target.kind === 'day') {
			if (target.day < sprint.weekStart || target.day > sprint.weekEnd) {
				return { ok: false, error: 'day-outside-sprint', field: 'day' };
			}
			day = target.day;
		}
	}

	db.exec('BEGIN');
	try {
		const { lastInsertRowid } = db
			.prepare(
				`INSERT INTO todos (title, aspect_id, notes, priority, due_date, sprint_id, day, project_id, class_id, type, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.run(
				title,
				input.aspectId,
				input.notes ?? '',
				input.priority ?? 0,
				input.dueDate ?? null,
				sprintId,
				day,
				linkFor(db, input.projectId, input.aspectId),
				link.value.classId,
				link.value.type,
				new Date().toISOString()
			);
		const insertItem = db.prepare('INSERT INTO checklist_items (todo_id, text, position) VALUES (?, ?, ?)');
		const texts = (input.checklist ?? []).map((t) => t.trim()).filter(Boolean);
		texts.forEach((text, i) => insertItem.run(lastInsertRowid, text, i));
		db.exec('COMMIT');
		return { ok: true, value: getTodo(db, Number(lastInsertRowid))! };
	} catch (err) {
		db.exec('ROLLBACK');
		throw err;
	}
}

export function getTodo(db: DatabaseSync, id: Id): Todo | null {
	const row = db.prepare(`SELECT ${todoColumns} FROM todos WHERE id = ?`).get(id) as TodoRow | undefined;
	return row ? withChecklists(db, [row])[0] : null;
}

export function updateTodo(db: DatabaseSync, id: Id, patch: TodoPatch): Result<Todo> {
	const current = getTodo(db, id);
	if (!current) return { ok: false, error: 'not-found' };
	if (patch.projectId != null && !projectExists(db, patch.projectId)) {
		return { ok: false, error: 'not-found', field: 'projectId' };
	}
	const sets: string[] = [];
	const values: (string | number | null)[] = [];
	if (patch.aspectId !== undefined || patch.classId !== undefined || patch.type !== undefined) {
		const classId = patch.classId !== undefined ? patch.classId : current.classId;
		const sameClass = classId === current.classId;
		const link = classLinkFor(
			db,
			patch.aspectId ?? current.aspectId,
			classId,
			patch.type !== undefined ? patch.type : sameClass ? current.type : null,
			sameClass ? current.revisedAt : null
		);
		if (!link.ok) return link;
		if (link.value.classId !== null && !sameClass) {
			const writable = classWritable(db, link.value.classId);
			if (!writable.ok) return writable;
		}
		sets.push('class_id = ?', 'type = ?', 'revised_at = ?');
		values.push(link.value.classId, link.value.type, link.value.revisedAt);
	}
	if (patch.title !== undefined) {
		const title = patch.title.trim();
		if (!title) return { ok: false, error: 'required', field: 'title' };
		sets.push('title = ?');
		values.push(title);
	}
	if (patch.aspectId !== undefined) {
		if (!aspectExists(db, patch.aspectId)) return { ok: false, error: 'no-aspect', field: 'aspectId' };
		sets.push('aspect_id = ?');
		values.push(patch.aspectId);
		if (patch.aspectId !== current.aspectId) sets.push('project_id = NULL');
	}
	if (patch.notes !== undefined) {
		sets.push('notes = ?');
		values.push(patch.notes);
	}
	if (patch.priority !== undefined) {
		if (!isPriority(patch.priority)) return { ok: false, error: 'required', field: 'priority' };
		sets.push('priority = ?');
		values.push(patch.priority);
	}
	if (patch.dueDate !== undefined) {
		sets.push('due_date = ?');
		values.push(patch.dueDate);
	}
	if (patch.projectId !== undefined) {
		const link = linkFor(db, patch.projectId, patch.aspectId ?? current.aspectId);
		sets.push('project_id = ?');
		values.push(link);
	}
	if (sets.length > 0) db.prepare(`UPDATE todos SET ${sets.join(', ')} WHERE id = ?`).run(...values, id);
	return { ok: true, value: getTodo(db, id)! };
}

export function setRevisedAt(db: DatabaseSync, todoId: Id, date: IsoDate | null): Result<Todo> {
	const todo = getTodo(db, todoId);
	if (!todo) return { ok: false, error: 'not-found' };
	if (todo.classId === null) return { ok: false, error: 'invalid', field: 'revisedAt' };
	if (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'invalid', field: 'revisedAt' };
	const writable = todoWritable(db, todoId);
	if (!writable.ok) return writable;
	db.prepare('UPDATE todos SET revised_at = ? WHERE id = ?').run(date, todoId);
	return { ok: true, value: getTodo(db, todoId)! };
}

export function deleteTodo(db: DatabaseSync, id: Id): Result<void> {
	const { changes } = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
	return changes ? { ok: true, value: undefined } : { ok: false, error: 'not-found' };
}

function getItem(db: DatabaseSync, id: Id): ChecklistItem | null {
	const row = db.prepare(`SELECT ${itemColumns} FROM checklist_items WHERE id = ?`).get(id) as ItemRow | undefined;
	return row ? toItem(row) : null;
}

export function addChecklistItem(db: DatabaseSync, todoId: Id, text: string): Result<ChecklistItem> {
	if (!db.prepare('SELECT 1 FROM todos WHERE id = ?').get(todoId)) return { ok: false, error: 'not-found' };
	const trimmed = text.trim();
	if (!trimmed) return { ok: false, error: 'required', field: 'text' };
	const { lastInsertRowid } = db
		.prepare(
			`INSERT INTO checklist_items (todo_id, text, position)
			 VALUES (?1, ?2, (SELECT coalesce(max(position) + 1, 0) FROM checklist_items WHERE todo_id = ?1))`
		)
		.run(todoId, trimmed);
	return { ok: true, value: getItem(db, Number(lastInsertRowid))! };
}

export function renameChecklistItem(db: DatabaseSync, itemId: Id, text: string): Result<ChecklistItem> {
	if (!getItem(db, itemId)) return { ok: false, error: 'not-found' };
	const trimmed = text.trim();
	if (!trimmed) return { ok: false, error: 'required', field: 'text' };
	db.prepare('UPDATE checklist_items SET text = ? WHERE id = ?').run(trimmed, itemId);
	return { ok: true, value: getItem(db, itemId)! };
}

export function toggleChecklistItem(db: DatabaseSync, itemId: Id, done: boolean): Result<ChecklistItem> {
	const { changes } = db.prepare('UPDATE checklist_items SET done = ? WHERE id = ?').run(done ? 1 : 0, itemId);
	return changes ? { ok: true, value: getItem(db, itemId)! } : { ok: false, error: 'not-found' };
}

export function deleteChecklistItem(db: DatabaseSync, itemId: Id): Result<void> {
	const { changes } = db.prepare('DELETE FROM checklist_items WHERE id = ?').run(itemId);
	return changes ? { ok: true, value: undefined } : { ok: false, error: 'not-found' };
}

export function listBacklog(db: DatabaseSync, aspectId?: Id): Todo[] {
	const rows = db
		.prepare(
			`SELECT ${todoColumns} FROM todos
			 WHERE sprint_id IS NULL AND (?1 IS NULL OR aspect_id = ?1)
			 ORDER BY priority = 0, priority, due_date IS NULL, due_date, id`
		)
		.all(aspectId ?? null) as unknown as TodoRow[];
	return withChecklists(db, rows);
}

export function backlogCounts(db: DatabaseSync): Record<Id, number> {
	const rows = db
		.prepare('SELECT aspect_id, COUNT(*) AS n FROM todos WHERE sprint_id IS NULL GROUP BY aspect_id')
		.all() as unknown as { aspect_id: number; n: number }[];
	return Object.fromEntries(rows.map((r) => [r.aspect_id, r.n]));
}

export function listOverdue(db: DatabaseSync, today: IsoDate): Todo[] {
	const rows = db
		.prepare(
			`SELECT ${todoColumns} FROM todos
			 WHERE due_date < ? AND status != 'done'
			 ORDER BY due_date, id`
		)
		.all(today) as unknown as TodoRow[];
	return withChecklists(db, rows);
}
