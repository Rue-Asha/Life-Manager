import { describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDb } from './db';
import {
	addChecklistItem,
	createTodo,
	deleteChecklistItem,
	deleteTodo,
	getTodo,
	renameChecklistItem,
	toggleChecklistItem,
	updateTodo
} from './todos';
import type { Id, Todo } from '$lib/types';

function setup() {
	const db = openDb(':memory:');
	const aspect = Number(
		db
			.prepare("INSERT INTO aspects (name, color, icon, position, created_at) VALUES ('Health', 'sage', 'heart', 0, '')")
			.run().lastInsertRowid
	);
	return { db, aspect };
}

function activeSprint(db: DatabaseSync, weekStart = '2026-09-28'): Id {
	return Number(
		db.prepare("INSERT INTO sprints (week_start, state, started_at) VALUES (?, 'active', '')").run(weekStart)
			.lastInsertRowid
	);
}

function value<T>(r: { ok: true; value: T } | { ok: false; error: string }): T {
	if (!r.ok) throw new Error(r.error);
	return r.value;
}

function todoCount(db: DatabaseSync): number {
	return (db.prepare('SELECT count(*) AS n FROM todos').get() as { n: number }).n;
}

describe('createTodo', () => {
	it('Scenario: Todo without an existing aspect is rejected', () => {
		const db = openDb(':memory:');
		expect(createTodo(db, { title: 'Run', aspectId: 1 })).toEqual({
			ok: false,
			error: 'no-aspect',
			field: 'aspectId'
		});
		expect(todoCount(db)).toBe(0);
	});

	it('Scenario: Todo stores all optional fields', () => {
		const { db, aspect } = setup();
		const created = value(
			createTodo(db, {
				title: 'Thesis draft',
				aspectId: aspect,
				notes: 'Chapter 2',
				priority: 1,
				dueDate: '2026-10-09',
				checklist: ['Outline', 'Sources']
			})
		);
		const read = getTodo(db, created.id)!;
		expect(read).toEqual(created);
		expect(read).toMatchObject({
			title: 'Thesis draft',
			aspectId: aspect,
			notes: 'Chapter 2',
			priority: 1,
			dueDate: '2026-10-09',
			sprintId: null,
			status: 'todo',
			day: null,
			recurring: false,
			ruleId: null,
			completedAt: null
		});
		expect(read.checklist.map(({ text, done, position }) => ({ text, done, position }))).toEqual([
			{ text: 'Outline', done: false, position: 0 },
			{ text: 'Sources', done: false, position: 1 }
		]);
	});

	it('Scenario: Empty todo title is rejected', () => {
		const { db, aspect } = setup();
		for (const title of ['', '   ']) {
			expect(createTodo(db, { title, aspectId: aspect })).toEqual({
				ok: false,
				error: 'required',
				field: 'title'
			});
		}
		expect(todoCount(db)).toBe(0);
	});

	it('defaults to the backlog with no optional fields', () => {
		const { db, aspect } = setup();
		const t = value(createTodo(db, { title: ' Run ', aspectId: aspect, target: { kind: 'backlog' } }));
		expect(t).toMatchObject<Partial<Todo>>({
			title: 'Run',
			notes: '',
			priority: 0,
			dueDate: null,
			sprintId: null,
			checklist: []
		});
	});

	it('joins the active sprint with no day for target sprint', () => {
		const { db, aspect } = setup();
		expect(createTodo(db, { title: 'Run', aspectId: aspect, target: { kind: 'sprint' } })).toEqual({
			ok: false,
			error: 'no-active-sprint'
		});
		const sprint = activeSprint(db);
		const t = value(createTodo(db, { title: 'Run', aspectId: aspect, target: { kind: 'sprint' } }));
		expect(t).toMatchObject({ sprintId: sprint, status: 'todo', day: null });
	});

	it('lands on a day of the active sprint for target day', () => {
		const { db, aspect } = setup();
		const sprint = activeSprint(db, '2026-09-28');
		const t = value(createTodo(db, { title: 'Run', aspectId: aspect, target: { kind: 'day', day: '2026-09-30' } }));
		expect(t).toMatchObject({ sprintId: sprint, day: '2026-09-30' });
		expect(value(createTodo(db, { title: 'Run', aspectId: aspect, target: { kind: 'day', day: '2026-10-04' } })).day).toBe(
			'2026-10-04'
		);
		for (const day of ['2026-09-27', '2026-10-05']) {
			expect(createTodo(db, { title: 'Run', aspectId: aspect, target: { kind: 'day', day } })).toEqual({
				ok: false,
				error: 'day-outside-sprint',
				field: 'day'
			});
		}
	});

	it('returns null for a missing todo', () => {
		const { db } = setup();
		expect(getTodo(db, 42)).toBeNull();
	});
});

describe('updateTodo and deleteTodo', () => {
	it('Scenario: Changing the aspect keeps sprint, status and day', () => {
		const { db, aspect } = setup();
		const other = Number(
			db
				.prepare("INSERT INTO aspects (name, color, icon, position, created_at) VALUES ('Uni', 'sky', 'cap', 1, '')")
				.run().lastInsertRowid
		);
		const sprint = activeSprint(db, '2026-09-28');
		const t = value(createTodo(db, { title: 'Run', aspectId: aspect, target: { kind: 'day', day: '2026-09-29' } }));
		db.prepare("UPDATE todos SET status = 'doing' WHERE id = ?").run(t.id);

		const updated = value(updateTodo(db, t.id, { aspectId: other }));
		expect(updated).toMatchObject({ aspectId: other, sprintId: sprint, status: 'doing', day: '2026-09-29' });
		expect(getTodo(db, t.id)).toEqual(updated);
	});

	it('updates every editable field and leaves omitted ones alone', () => {
		const { db, aspect } = setup();
		const t = value(createTodo(db, { title: 'Run', aspectId: aspect, notes: 'easy', priority: 2, dueDate: '2026-10-01' }));
		expect(value(updateTodo(db, t.id, { title: ' Long run ', priority: 1 }))).toMatchObject({
			title: 'Long run',
			notes: 'easy',
			priority: 1,
			dueDate: '2026-10-01'
		});
		expect(value(updateTodo(db, t.id, { notes: '', priority: 0, dueDate: null }))).toMatchObject({
			title: 'Long run',
			notes: '',
			priority: 0,
			dueDate: null
		});
	});

	it('rejects an empty title, a missing aspect and a missing todo', () => {
		const { db, aspect } = setup();
		const t = value(createTodo(db, { title: 'Run', aspectId: aspect }));
		expect(updateTodo(db, t.id, { title: '  ' })).toEqual({ ok: false, error: 'required', field: 'title' });
		expect(updateTodo(db, t.id, { aspectId: aspect + 99 })).toEqual({ ok: false, error: 'no-aspect', field: 'aspectId' });
		expect(updateTodo(db, t.id + 99, { title: 'x' })).toEqual({ ok: false, error: 'not-found' });
		expect(getTodo(db, t.id)?.title).toBe('Run');
	});

	it('Scenario: Deleting a recurring instance keeps its rule', () => {
		const { db, aspect } = setup();
		const sprint = activeSprint(db);
		const rule = Number(
			db
				.prepare("INSERT INTO recurring_rules (title, aspect_id, weekdays, created_at) VALUES ('Gym', ?, '1,3', '')")
				.run(aspect).lastInsertRowid
		);
		const insert = db.prepare(
			"INSERT INTO todos (title, aspect_id, sprint_id, day, recurring, rule_id, created_at) VALUES ('Gym', ?, ?, ?, 1, ?, '')"
		);
		const monday = Number(insert.run(aspect, sprint, '2026-09-28', rule).lastInsertRowid);
		const wednesday = Number(insert.run(aspect, sprint, '2026-09-30', rule).lastInsertRowid);

		expect(deleteTodo(db, monday)).toEqual({ ok: true, value: undefined });

		expect(getTodo(db, monday)).toBeNull();
		expect(getTodo(db, wednesday)).toMatchObject({ recurring: true, ruleId: rule });
		expect(db.prepare('SELECT id FROM recurring_rules').all().map((r) => r.id)).toEqual([rule]);
	});

	it('deletes a todo with its checklist', () => {
		const { db, aspect } = setup();
		const t = value(createTodo(db, { title: 'Run', aspectId: aspect, checklist: ['Shoes'] }));
		expect(deleteTodo(db, t.id).ok).toBe(true);
		expect(db.prepare('SELECT count(*) AS n FROM checklist_items').get()).toEqual({ n: 0 });
		expect(deleteTodo(db, t.id)).toEqual({ ok: false, error: 'not-found' });
	});
});

describe('checklist', () => {
	it('adds, renames, toggles and deletes items', () => {
		const { db, aspect } = setup();
		const t = value(createTodo(db, { title: 'Pack', aspectId: aspect }));
		const first = value(addChecklistItem(db, t.id, ' Passport '));
		const second = value(addChecklistItem(db, t.id, 'Charger'));
		expect(first).toEqual({ id: first.id, todoId: t.id, text: 'Passport', done: false, position: 0 });
		expect(second.position).toBe(1);

		expect(value(renameChecklistItem(db, first.id, 'ID card')).text).toBe('ID card');
		expect(value(toggleChecklistItem(db, second.id, true)).done).toBe(true);
		expect(value(toggleChecklistItem(db, second.id, false)).done).toBe(false);
		expect(deleteChecklistItem(db, first.id)).toEqual({ ok: true, value: undefined });

		expect(getTodo(db, t.id)!.checklist).toEqual([{ ...second, done: false }]);
	});

	it('rejects empty text and missing items or todos', () => {
		const { db, aspect } = setup();
		const t = value(createTodo(db, { title: 'Pack', aspectId: aspect, checklist: ['Passport'] }));
		const item = t.checklist[0];
		expect(addChecklistItem(db, t.id, ' ')).toEqual({ ok: false, error: 'required', field: 'text' });
		expect(renameChecklistItem(db, item.id, '')).toEqual({ ok: false, error: 'required', field: 'text' });
		expect(addChecklistItem(db, t.id + 99, 'x')).toEqual({ ok: false, error: 'not-found' });
		expect(renameChecklistItem(db, item.id + 99, 'x')).toEqual({ ok: false, error: 'not-found' });
		expect(toggleChecklistItem(db, item.id + 99, true)).toEqual({ ok: false, error: 'not-found' });
		expect(deleteChecklistItem(db, item.id + 99)).toEqual({ ok: false, error: 'not-found' });
		expect(getTodo(db, t.id)!.checklist.map((i) => i.text)).toEqual(['Passport']);
	});
});
