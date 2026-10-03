import { describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDb } from './db';
import { createTodo, getTodo } from './todos';
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
