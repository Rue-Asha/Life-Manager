import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type { Id, IsoDate, Priority, RecurringRule, Result, RuleInput, Sprint, Todo, Weekday } from '$lib/types';
import { isPriority } from '$lib/todo-utils';
import { addDays } from '$lib/week';
import { now } from './clock';
import { getActiveSprint, selectTodos, transaction } from './sprints';

type Row = Record<string, SQLInputValue>;

function toRule(r: Row): RecurringRule {
	return {
		id: Number(r.id),
		title: r.title as string,
		aspectId: Number(r.aspect_id),
		weekdays: (r.weekdays as string).split(',').map(Number) as Weekday[],
		notes: r.notes as string,
		priority: Number(r.priority) as Priority,
		checklist: JSON.parse(r.checklist as string)
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
	return null;
}

function columns(input: RuleInput): SQLInputValue[] {
	return [
		input.title.trim(),
		input.aspectId,
		[...new Set(input.weekdays)].sort().join(','),
		input.notes ?? '',
		input.priority ?? 0,
		JSON.stringify(input.checklist ?? [])
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
				`INSERT INTO recurring_rules (title, aspect_id, weekdays, notes, priority, checklist, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?)`
			)
			.run(...columns(input), now().toISOString());
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
		`UPDATE recurring_rules SET title = ?, aspect_id = ?, weekdays = ?, notes = ?, priority = ?, checklist = ?
		 WHERE id = ?`
	).run(...columns(input), id);
	return { ok: true, value: getRule(db, id)! };
}

export function deleteRule(db: DatabaseSync, id: Id): Result<void> {
	const { changes } = db.prepare('DELETE FROM recurring_rules WHERE id = ?').run(id);
	return changes ? { ok: true, value: undefined } : { ok: false, error: 'not-found' };
}

export function generateInstances(db: DatabaseSync, sprint: Sprint, fromDay: IsoDate, ruleId?: Id): Todo[] {
	const rules = ruleId === undefined ? listRules(db) : [getRule(db, ruleId)!];
	const insertTodo = db.prepare(
		`INSERT INTO todos (title, aspect_id, notes, priority, sprint_id, day, recurring, rule_id, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
	);
	const insertItem = db.prepare('INSERT INTO checklist_items (todo_id, text, position) VALUES (?, ?, ?)');
	const createdAt = now().toISOString();
	const ids: Id[] = [];
	for (const rule of rules) {
		for (const weekday of rule.weekdays) {
			const day = addDays(sprint.weekStart!, weekday - 1);
			if (day < fromDay) continue;
			const id = Number(
				insertTodo.run(rule.title, rule.aspectId, rule.notes, rule.priority, sprint.id, day, rule.id, createdAt)
					.lastInsertRowid
			);
			rule.checklist.forEach((text, i) => insertItem.run(id, text, i));
			ids.push(id);
		}
	}
	return ids.flatMap((id) => selectTodos(db, 'id = ?', id));
}
