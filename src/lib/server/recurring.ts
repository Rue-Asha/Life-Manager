import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type { ClassType, Id, IsoDate, Priority, RecurringRule, Result, RuleInput, Sprint, Todo, Weekday } from '$lib/types';
import { isPriority } from '$lib/todo-utils';
import { CLASS_TYPES } from '$lib/uni';
import { addDays } from '$lib/week';
import { now } from './clock';
import { getActiveSprint, selectTodos, transaction } from './sprints';
import { classWritable, getUniAspectId } from './uni';

type Row = Record<string, SQLInputValue>;

function toRule(r: Row): RecurringRule {
	return {
		id: Number(r.id),
		title: r.title as string,
		aspectId: Number(r.aspect_id),
		weekdays: (r.weekdays as string).split(',').map(Number) as Weekday[],
		notes: r.notes as string,
		priority: Number(r.priority) as Priority,
		checklist: JSON.parse(r.checklist as string),
		classId: r.class_id === null ? null : Number(r.class_id),
		type: r.type as ClassType | null
	};
}

function getRule(db: DatabaseSync, id: Id): RecurringRule | null {
	const r = db.prepare('SELECT * FROM recurring_rules WHERE id = ?').get(id) as Row | undefined;
	return r ? toRule(r) : null;
}

function validate(db: DatabaseSync, input: RuleInput): { ok: false; error: string; field: string } | null {
	if (!input.title.trim()) return { ok: false, error: 'required', field: 'title' };
	if (!db.prepare('SELECT 1 FROM aspects WHERE id = ?').get(input.aspectId)) {
		return { ok: false, error: 'no-aspect', field: 'aspectId' };
	}
	if (input.weekdays.length === 0 || !input.weekdays.every((d) => Number.isInteger(d) && d >= 1 && d <= 7)) {
		return { ok: false, error: 'weekdays-required', field: 'weekdays' };
	}
	if (input.priority !== undefined && !isPriority(input.priority)) return { ok: false, error: 'required', field: 'priority' };
	if (input.type != null && !CLASS_TYPES.includes(input.type)) return { ok: false, error: 'invalid', field: 'type' };
	const classId = classFor(db, input);
	if (classId !== null) {
		const writable = classWritable(db, classId);
		if (!writable.ok) return { ok: false, error: writable.error, field: 'classId' };
	}
	return null;
}

// As on todos, the class link is kept only on rules of the Uni aspect.
function classFor(db: DatabaseSync, input: RuleInput): Id | null {
	return input.classId != null && getUniAspectId(db) === input.aspectId ? input.classId : null;
}

function columns(db: DatabaseSync, input: RuleInput): SQLInputValue[] {
	const classId = classFor(db, input);
	return [
		input.title.trim(),
		input.aspectId,
		[...new Set(input.weekdays)].sort().join(','),
		input.notes ?? '',
		input.priority ?? 0,
		JSON.stringify(input.checklist ?? []),
		classId,
		classId === null ? null : (input.type ?? 'OTH')
	];
}

export function listRules(db: DatabaseSync): RecurringRule[] {
	return (db.prepare('SELECT * FROM recurring_rules ORDER BY id').all() as Row[]).map(toRule);
}

export function createRule(db: DatabaseSync, input: RuleInput, today: IsoDate): Result<RecurringRule> {
	const invalid = validate(db, input);
	if (invalid) return invalid;
	return transaction(db, () => {
		const { lastInsertRowid } = db
			.prepare(
				`INSERT INTO recurring_rules (title, aspect_id, weekdays, notes, priority, checklist, class_id, type, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.run(...columns(db, input), now().toISOString());
		const active = getActiveSprint(db);
		if (active) generateInstances(db, active, today, Number(lastInsertRowid));
		return { ok: true, value: getRule(db, Number(lastInsertRowid))! };
	});
}

export function updateRule(db: DatabaseSync, id: Id, input: RuleInput): Result<RecurringRule> {
	const invalid = validate(db, input);
	if (invalid) return invalid;
	if (!getRule(db, id)) return { ok: false, error: 'not-found' };
	db.prepare(
		`UPDATE recurring_rules SET title = ?, aspect_id = ?, weekdays = ?, notes = ?, priority = ?, checklist = ?,
		 class_id = ?, type = ? WHERE id = ?`
	).run(...columns(db, input), id);
	return { ok: true, value: getRule(db, id)! };
}

export function deleteRule(db: DatabaseSync, id: Id): Result<void> {
	const { changes } = db.prepare('DELETE FROM recurring_rules WHERE id = ?').run(id);
	return changes ? { ok: true, value: undefined } : { ok: false, error: 'not-found' };
}

export function generateInstances(db: DatabaseSync, sprint: Sprint, fromDay: IsoDate, ruleId?: Id): Todo[] {
	// Rules of an archived semester's classes are read-only and generate nothing; their carried
	// instances were completed by the archive, so none is placed either.
	const archived = new Set(
		(
			db
				.prepare(
					`SELECT r.id FROM recurring_rules r JOIN classes c ON c.id = r.class_id
					 JOIN semesters s ON s.id = c.semester_id WHERE s.archived_at IS NOT NULL`
				)
				.all() as Row[]
		).map((r) => Number(r.id))
	);
	const rules = (ruleId === undefined ? listRules(db) : [getRule(db, ruleId)!]).filter((r) => !archived.has(r.id));
	const insertTodo = db.prepare(
		`INSERT INTO todos (title, aspect_id, notes, priority, sprint_id, day, recurring, rule_id, class_id, type, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`
	);
	const insertItem = db.prepare('INSERT INTO checklist_items (todo_id, text, position) VALUES (?, ?, ?)');
	const carried = db.prepare("SELECT id FROM todos WHERE sprint_id = ? AND rule_id = ? AND status != 'done' ORDER BY id");
	const placeCarried = db.prepare('UPDATE todos SET day = ? WHERE id = ?');
	const createdAt = now().toISOString();
	const ids: Id[] = [];
	for (const rule of rules) {
		// Instances carried over by the review take the rule's slots first, so the rule isn't doubled.
		const open = (carried.all(sprint.id, rule.id) as Row[]).map((r) => Number(r.id));
		for (const weekday of rule.weekdays) {
			const day = addDays(sprint.weekStart!, weekday - 1);
			if (day < fromDay) continue;
			const carriedId = open.shift();
			if (carriedId !== undefined) {
				placeCarried.run(day, carriedId);
				continue;
			}
			const id = Number(
				insertTodo.run(
					rule.title,
					rule.aspectId,
					rule.notes,
					rule.priority,
					sprint.id,
					day,
					rule.id,
					rule.classId,
					rule.type,
					createdAt
				)
					.lastInsertRowid
			);
			rule.checklist.forEach((text, i) => insertItem.run(id, text, i));
			ids.push(id);
		}
	}
	return ids.flatMap((id) => selectTodos(db, 'id = ?', id));
}
