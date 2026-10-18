import { describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDb } from './db';
import {
	addChecklistItem,
	createTodo,
	deleteChecklistItem,
	deleteTodo,
	getTodo,
	listBacklog,
	listBacklogDueToday,
	listOverdue,
	renameChecklistItem,
	setRevisedAt,
	toggleChecklistItem,
	updateTodo
} from './todos';
import type { Id, Priority, Todo } from '$lib/types';
import { createProject, setItAspectId } from './projects';
import { listSprintTodos, listToday } from './sprints';
import { setUniAspectId } from './uni';

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

	it('Scenario: Both todo read models carry the slot', () => {
		const { db, aspect } = setup();
		const sprint = activeSprint(db);
		const insert = db.prepare(
			'INSERT INTO todos (title, aspect_id, sprint_id, day, start_time, end_time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
		);
		const backlog = Number(insert.run('Dinner', aspect, null, '2026-11-03', '18:00', '19:30', '').lastInsertRowid);
		const inSprint = Number(insert.run('Call', aspect, sprint, '2026-09-29', '09:15', null, '').lastInsertRowid);
		const plain = Number(insert.run('Plain', aspect, null, null, null, null, '').lastInsertRowid);

		expect(getTodo(db, backlog)).toMatchObject({ startTime: '18:00', endTime: '19:30' });
		expect(listBacklog(db).find((t) => t.id === backlog)).toMatchObject({ startTime: '18:00', endTime: '19:30' });
		expect(listBacklog(db).find((t) => t.id === plain)).toMatchObject({ startTime: null, endTime: null });
		expect(listSprintTodos(db, sprint).find((t) => t.id === inSprint)).toMatchObject({
			startTime: '09:15',
			endTime: null
		});
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
			startTime: null,
			endTime: null,
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
		const make = (day: string) => createTodo(db, { title: 'Run', aspectId: aspect, target: { kind: 'day', day } }, '2026-09-30');
		expect(value(make('2026-09-30'))).toMatchObject({ sprintId: sprint, day: '2026-09-30' });
		expect(value(make('2026-10-04')).day).toBe('2026-10-04');
		expect(value(make('2026-10-05'))).toMatchObject({ sprintId: null, day: '2026-10-05' });
		expect(make('2026-09-27')).toEqual({ ok: false, error: 'day-in-past', field: 'day' });
		expect(db.prepare('SELECT count(*) AS n FROM todos').get()).toEqual({ n: 3 });
	});

	it('keeps a day target in the backlog without an active sprint', () => {
		const { db, aspect } = setup();
		const t = value(
			createTodo(db, { title: 'Run', aspectId: aspect, target: { kind: 'day', day: '2026-10-21' } }, '2026-10-18')
		);
		expect(t).toMatchObject({ sprintId: null, day: '2026-10-21' });
		expect(
			createTodo(db, { title: 'Run', aspectId: aspect, target: { kind: 'day', day: '2026-10-17' } }, '2026-10-18')
		).toEqual({ ok: false, error: 'day-in-past', field: 'day' });
	});

	it('Scenario: Creating on a day follows the placement rule', () => {
		const { db, aspect } = setup();
		const sprint = activeSprint(db, '2026-10-12');
		const make = (target: NonNullable<Parameters<typeof createTodo>[1]['target']>) =>
			createTodo(db, { title: 'Run', aspectId: aspect, target }, '2026-10-19');
		expect(make({ kind: 'day', day: '2026-10-15' })).toEqual({ ok: false, error: 'review-required' });
		expect(todoCount(db)).toBe(0);
		expect(value(make({ kind: 'day', day: '2026-10-19' }))).toMatchObject({ sprintId: null, day: '2026-10-19' });
		expect(value(make({ kind: 'sprint' }))).toMatchObject({ sprintId: sprint, day: null, status: 'todo' });
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
		const t = value(createTodo(db, { title: 'Run', aspectId: aspect, target: { kind: 'day', day: '2026-09-29' } }, '2026-09-29'));
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

	it('refuses an unknown priority on create and update', () => {
		const { db, aspect } = setup();
		expect(createTodo(db, { title: 'Run', aspectId: aspect, priority: NaN as Priority })).toEqual({
			ok: false,
			error: 'required',
			field: 'priority'
		});
		expect(todoCount(db)).toBe(0);
		const t = value(createTodo(db, { title: 'Run', aspectId: aspect, priority: 2 }));
		expect(updateTodo(db, t.id, { priority: 4 as Priority })).toEqual({ ok: false, error: 'required', field: 'priority' });
		expect(getTodo(db, t.id)?.priority).toBe(2);
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

describe('lists', () => {
	function insert(
		db: DatabaseSync,
		title: string,
		fields: { aspect: Id; priority?: number; dueDate?: string | null; sprintId?: Id | null; status?: string; day?: string | null }
	) {
		db.prepare(
			"INSERT INTO todos (title, aspect_id, priority, due_date, sprint_id, status, day, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, '')"
		).run(
			title,
			fields.aspect,
			fields.priority ?? 0,
			fields.dueDate ?? null,
			fields.sprintId ?? null,
			fields.status ?? 'todo',
			fields.day ?? null
		);
	}

	it('Scenario: Backlog lists only todos not in a sprint, in order', () => {
		const { db, aspect } = setup();
		const sprint = activeSprint(db);
		insert(db, 'none-undated', { aspect });
		insert(db, 'p3-late', { aspect, priority: 3, dueDate: '2026-10-20' });
		insert(db, 'p1-undated', { aspect, priority: 1 });
		insert(db, 'p1-early', { aspect, priority: 1, dueDate: '2026-10-02' });
		insert(db, 'p2', { aspect, priority: 2, dueDate: '2026-10-01' });
		insert(db, 'none-dated', { aspect, dueDate: '2026-12-01' });
		insert(db, 'p1-in-sprint', { aspect, priority: 1, dueDate: '2026-09-01', sprintId: sprint });

		expect(listBacklog(db).map((t) => t.title)).toEqual([
			'p1-early',
			'p1-undated',
			'p2',
			'p3-late',
			'none-dated',
			'none-undated'
		]);
	});

	it('filters the backlog to one aspect', () => {
		const { db, aspect } = setup();
		const other = Number(
			db
				.prepare("INSERT INTO aspects (name, color, icon, position, created_at) VALUES ('Uni', 'sky', 'cap', 1, '')")
				.run().lastInsertRowid
		);
		insert(db, 'health', { aspect });
		insert(db, 'uni', { aspect: other });
		expect(listBacklog(db, other).map((t) => t.title)).toEqual(['uni']);
		expect(listBacklog(db)).toHaveLength(2);
	});

	it('Scenario: Overdue means due before today and not done', () => {
		const { db, aspect } = setup();
		const sprint = activeSprint(db);
		insert(db, 'backlog-overdue', { aspect, dueDate: '2026-09-20' });
		insert(db, 'sprint-overdue', { aspect, dueDate: '2026-09-29', sprintId: sprint, status: 'doing' });
		insert(db, 'done-overdue', { aspect, dueDate: '2026-09-21', sprintId: sprint, status: 'done' });
		insert(db, 'due-today', { aspect, dueDate: '2026-10-01' });
		insert(db, 'future', { aspect, dueDate: '2026-10-05' });
		insert(db, 'undated', { aspect });

		expect(listOverdue(db, '2026-10-01').map((t) => t.title)).toEqual(['backlog-overdue', 'sprint-overdue']);
	});

	it('Scenario: Backlog todos due today are listed apart from sprint todos', () => {
		const { db, aspect } = setup();
		const sprint = activeSprint(db);
		value(createTodo(db, { title: 'due-today', aspectId: aspect, dueDate: '2026-10-01' }));
		value(createTodo(db, { title: 'due-other-day', aspectId: aspect, dueDate: '2026-10-02' }));
		const done = value(createTodo(db, { title: 'done-today', aspectId: aspect, dueDate: '2026-10-01' }));
		db.prepare("UPDATE todos SET status = 'done' WHERE id = ?").run(done.id);
		insert(db, 'sprint-today', { aspect, dueDate: '2026-10-01', sprintId: sprint });

		expect(listBacklogDueToday(db, '2026-10-01').map((t) => t.title)).toEqual(['due-today']);
	});

	it('Scenario: Backlog todos planned for today are listed once', () => {
		const { db, aspect } = setup();
		const sprint = activeSprint(db);
		insert(db, 'planned-today', { aspect, day: '2026-10-01' });
		insert(db, 'due-and-planned', { aspect, day: '2026-10-01', dueDate: '2026-10-01' });
		insert(db, 'due-today', { aspect, dueDate: '2026-10-01' });
		insert(db, 'planned-tomorrow', { aspect, day: '2026-10-02' });
		insert(db, 'done-planned', { aspect, day: '2026-10-01', status: 'done' });
		insert(db, 'sprint-planned', { aspect, day: '2026-10-01', sprintId: sprint });

		expect(listBacklogDueToday(db, '2026-10-01').map((t) => t.title)).toEqual([
			'planned-today',
			'due-and-planned',
			'due-today'
		]);
	});

	it('Scenario: A fallback todo is overdue the next day', () => {
		const { db, aspect } = setup();
		value(createTodo(db, { title: 'fallback', aspectId: aspect, dueDate: '2026-10-01' }));

		expect(listBacklogDueToday(db, '2026-10-02')).toEqual([]);
		expect(listOverdue(db, '2026-10-02').map((t) => t.title)).toEqual(['fallback']);
	});
});

describe('project link', () => {
	function itSetup() {
		const { db, aspect } = setup();
		const other = Number(
			db
				.prepare("INSERT INTO aspects (name, color, icon, position, created_at) VALUES ('Uni', 'sage', 'heart', 1, '')")
				.run().lastInsertRowid
		);
		value(setItAspectId(db, aspect));
		const project = value(createProject(db, { name: 'P' })).id;
		return { db, it: aspect, other, project };
	}

	it('Scenario: Aspect change removes the project link', () => {
		const { db, it, other, project } = itSetup();
		const todo = value(createTodo(db, { title: 'x', aspectId: it, projectId: project }));
		expect(todo.projectId).toBe(project);

		const sprint = Number(
			db.prepare("INSERT INTO sprints (week_start, state, started_at) VALUES ('2026-09-28', 'active', '')").run()
				.lastInsertRowid
		);
		db.prepare("UPDATE todos SET sprint_id = ?, status = 'doing', day = '2026-09-29' WHERE id = ?").run(sprint, todo.id);
		const moved = value(updateTodo(db, todo.id, { aspectId: other }));
		expect(moved).toMatchObject({ projectId: null, sprintId: sprint, status: 'doing', day: '2026-09-29' });
		expect(value(updateTodo(db, todo.id, { aspectId: it })).projectId).toBeNull();

		value(updateTodo(db, todo.id, { projectId: project }));
		expect(value(updateTodo(db, todo.id, { title: 'y' })).projectId).toBe(project);
		expect(value(updateTodo(db, todo.id, { projectId: null })).projectId).toBeNull();
		expect(value(updateTodo(db, todo.id, { aspectId: other, projectId: project })).projectId).toBeNull();
		expect(value(updateTodo(db, todo.id, { aspectId: it, projectId: project })).projectId).toBe(project);
	});

	it('Scenario: Project link on a non-IT todo is not stored', () => {
		const { db, other, project } = itSetup();
		const viaCreate = value(createTodo(db, { title: 'x', aspectId: other, projectId: project }));
		expect(viaCreate.projectId).toBeNull();
		const viaUpdate = value(updateTodo(db, viaCreate.id, { projectId: project }));
		expect(viaUpdate.projectId).toBeNull();

		const { db: db2, aspect } = setup();
		const p2 = value(createProject(db2, { name: 'P' })).id;
		expect(value(createTodo(db2, { title: 'x', aspectId: aspect, projectId: p2 })).projectId).toBeNull();
	});

	it('Scenario: Unknown project id is rejected', () => {
		const { db, it, project } = itSetup();
		const expected = { ok: false, error: 'not-found', field: 'projectId' };
		expect(createTodo(db, { title: 'x', aspectId: it, projectId: project + 99 })).toEqual(expected);
		const todo = value(createTodo(db, { title: 'x', aspectId: it }));
		expect(updateTodo(db, todo.id, { projectId: project + 99 })).toEqual(expected);
		expect(todoCount(db)).toBe(1);
	});

	it('Scenario: Both todo read models carry the project link', () => {
		const { db, it, project } = itSetup();
		const sprint = activeSprint(db, '2026-10-05');
		const backlog = value(createTodo(db, { title: 'b', aspectId: it, projectId: project }));
		const planned = value(
			createTodo(db, { title: 's', aspectId: it, projectId: project, target: { kind: 'day', day: '2026-10-06' } }, '2026-10-06')
		);

		expect(getTodo(db, backlog.id)!.projectId).toBe(project);
		expect(listBacklog(db).map((t) => t.projectId)).toEqual([project]);
		expect(listSprintTodos(db, sprint).map((t) => t.projectId)).toEqual([project]);
		expect(listToday(db, '2026-10-06').map((t) => t.projectId)).toEqual([project]);
		expect(planned.projectId).toBe(project);
	});
});

describe('class link', () => {
	function uniSetup() {
		const { db, aspect } = setup();
		const uni = Number(
			db
				.prepare("INSERT INTO aspects (name, color, icon, position, created_at) VALUES ('Uni', 'sky', 'cap', 1, '')")
				.run().lastInsertRowid
		);
		value(setUniAspectId(db, uni));
		const insert = (sql: string, ...params: (string | number | null)[]) => Number(db.prepare(sql).run(...params).lastInsertRowid);
		const semester = insert("INSERT INTO semesters (name, created_at) VALUES ('WS', 'c')");
		const old = insert("INSERT INTO semesters (name, archived_at, created_at) VALUES ('SS', 'a', 'c')");
		const cls = (s: Id, name: string) =>
			insert("INSERT INTO classes (semester_id, name, color, icon, created_at, updated_at) VALUES (?, ?, 'sky', 'book', 'c', 'c')", s, name);
		return { db, other: aspect, uni, analysis: cls(semester, 'Analysis'), physics: cls(old, 'Physics') };
	}

	const classFields = (t: Todo) => ({ classId: t.classId, type: t.type, revisedAt: t.revisedAt });

	it('Scenario: Both todo read models carry the class fields', () => {
		const { db, uni, analysis } = uniSetup();
		const sprint = activeSprint(db, '2026-10-05');
		const backlog = value(createTodo(db, { title: 'b', aspectId: uni, classId: analysis, type: 'LEC' }));
		const planned = value(
			createTodo(db, { title: 's', aspectId: uni, classId: analysis, type: 'LEC', target: { kind: 'day', day: '2026-10-06' } }, '2026-10-06')
		);
		value(setRevisedAt(db, backlog.id, '2026-10-02'));
		value(setRevisedAt(db, planned.id, '2026-10-03'));

		expect(classFields(getTodo(db, backlog.id)!)).toEqual({ classId: analysis, type: 'LEC', revisedAt: '2026-10-02' });
		expect(listBacklog(db).map(classFields)).toEqual([{ classId: analysis, type: 'LEC', revisedAt: '2026-10-02' }]);
		const inSprint = { classId: analysis, type: 'LEC', revisedAt: '2026-10-03' };
		expect(listSprintTodos(db, sprint).map(classFields)).toEqual([inSprint]);
		expect(listToday(db, '2026-10-06').map(classFields)).toEqual([inSprint]);
	});

	it('Scenario: Aspect change removes class, type and revised date', () => {
		const { db, other, uni, analysis } = uniSetup();
		const sprint = activeSprint(db, '2026-09-28');
		const todo = value(
			createTodo(db, { title: 'x', aspectId: uni, classId: analysis, type: 'LEC', target: { kind: 'day', day: '2026-09-29' } }, '2026-09-29')
		);
		db.prepare("UPDATE todos SET status = 'doing' WHERE id = ?").run(todo.id);
		value(setRevisedAt(db, todo.id, '2026-09-30'));

		const moved = value(updateTodo(db, todo.id, { aspectId: other }));
		expect(moved).toMatchObject({ classId: null, type: null, revisedAt: null, sprintId: sprint, status: 'doing', day: '2026-09-29' });
		expect(classFields(value(updateTodo(db, todo.id, { aspectId: uni })))).toEqual({ classId: null, type: null, revisedAt: null });
		expect(classFields(value(updateTodo(db, todo.id, { aspectId: other, classId: analysis, type: 'LEC' })))).toEqual({
			classId: null,
			type: null,
			revisedAt: null
		});
	});

	it('keeps class fields across unrelated edits and clears them with the class', () => {
		const { db, uni, analysis } = uniSetup();
		const todo = value(createTodo(db, { title: 'x', aspectId: uni, classId: analysis, type: 'EXC' }));
		value(setRevisedAt(db, todo.id, '2026-09-30'));
		expect(classFields(value(updateTodo(db, todo.id, { title: 'y', aspectId: uni })))).toEqual({
			classId: analysis,
			type: 'EXC',
			revisedAt: '2026-09-30'
		});
		expect(value(updateTodo(db, todo.id, { type: 'LEC' })).type).toBe('LEC');
		expect(classFields(value(updateTodo(db, todo.id, { classId: null, type: 'LEC' })))).toEqual({
			classId: null,
			type: null,
			revisedAt: null
		});
	});

	it('Scenario: Class link on a non-Uni todo is not stored', () => {
		const { db, other, analysis } = uniSetup();
		const created = value(createTodo(db, { title: 'x', aspectId: other, classId: analysis, type: 'LEC' }));
		expect(classFields(created)).toEqual({ classId: null, type: null, revisedAt: null });
		const updated = value(updateTodo(db, created.id, { classId: analysis, type: 'LEC' }));
		expect(classFields(updated)).toEqual({ classId: null, type: null, revisedAt: null });
	});

	it('Scenario: Type needs a class', () => {
		const { db, uni, analysis } = uniSetup();
		expect(value(createTodo(db, { title: 'a', aspectId: uni, type: 'LEC' })).type).toBeNull();
		expect(value(createTodo(db, { title: 'b', aspectId: uni, classId: analysis })).type).toBe('OTH');
	});

	it('Scenario: Unknown or archived class id is rejected', () => {
		const { db, uni, analysis, physics } = uniSetup();
		const notFound = { ok: false, error: 'not-found', field: 'classId' };
		const archived = { ok: false, error: 'archived', field: 'classId' };
		expect(createTodo(db, { title: 'x', aspectId: uni, classId: analysis + 99 })).toEqual(notFound);
		expect(createTodo(db, { title: 'x', aspectId: uni, classId: physics })).toEqual(archived);
		expect(todoCount(db)).toBe(0);

		const todo = value(createTodo(db, { title: 'x', aspectId: uni, classId: analysis, type: 'LEC' }));
		expect(updateTodo(db, todo.id, { title: 'changed', classId: analysis + 99 })).toEqual(notFound);
		expect(updateTodo(db, todo.id, { title: 'changed', classId: physics })).toEqual(archived);
		expect(getTodo(db, todo.id)).toEqual(todo);
	});

	it('rejects a type outside LEC / EXC / OTH', () => {
		const { db, uni, analysis } = uniSetup();
		const invalid = { ok: false, error: 'invalid', field: 'type' };
		expect(createTodo(db, { title: 'x', aspectId: uni, classId: analysis, type: 'XYZ' as never })).toEqual(invalid);
		const todo = value(createTodo(db, { title: 'x', aspectId: uni, classId: analysis }));
		expect(updateTodo(db, todo.id, { type: 'XYZ' as never })).toEqual(invalid);
	});

	it('Scenario: Revised date is stored only on class todos', () => {
		const { db, uni, analysis } = uniSetup();
		const linked = value(createTodo(db, { title: 'a', aspectId: uni, classId: analysis }));
		const plain = value(createTodo(db, { title: 'b', aspectId: uni }));
		expect(value(setRevisedAt(db, linked.id, '2026-10-04')).revisedAt).toBe('2026-10-04');
		expect(setRevisedAt(db, plain.id, '2026-10-04')).toEqual({ ok: false, error: 'invalid', field: 'revisedAt' });
		expect(getTodo(db, plain.id)).toEqual(plain);
		expect(value(setRevisedAt(db, linked.id, null)).revisedAt).toBeNull();
	});

	it('refuses a revised date on an archived class and for a missing todo', () => {
		const { db, uni, physics } = uniSetup();
		const id = Number(
			db
				.prepare("INSERT INTO todos (title, aspect_id, class_id, type, created_at) VALUES ('p', ?, ?, 'OTH', 't')")
				.run(uni, physics).lastInsertRowid
		);
		expect(setRevisedAt(db, id, '2026-10-04')).toEqual({ ok: false, error: 'archived' });
		expect(getTodo(db, id)!.revisedAt).toBeNull();
		expect(setRevisedAt(db, 999, '2026-10-04')).toEqual({ ok: false, error: 'not-found' });
	});
});
