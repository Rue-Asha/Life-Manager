import type { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Id, IsoDate, Sprint, Status } from '$lib/types';
import { openDb } from './db';
import {
	addToActiveSprint,
	getActiveSprint,
	listSprintTodos,
	listToday,
	moveToBacklog,
	openPlanning,
	pullTodo,
	setDay,
	setStatus,
	sprintPhase,
	startSprint,
	suggestedTodos,
	toggleDone,
	unpullTodo
} from './sprints';

let db: DatabaseSync;
let aspect: Id;

beforeEach(() => {
	db = openDb(':memory:');
	aspect = Number(
		db
			.prepare(
				"INSERT INTO aspects (name, color, icon, position, created_at) VALUES ('Health', 'sage', 'heart', 0, '')"
			)
			.run().lastInsertRowid
	);
});

function sprint(state: Sprint['state'], weekStart: IsoDate | null): Id {
	return Number(
		db.prepare('INSERT INTO sprints (week_start, state) VALUES (?, ?)').run(weekStart, state).lastInsertRowid
	);
}

function todo(
	title: string,
	fields: { sprintId?: Id | null; status?: Status; day?: IsoDate | null; dueDate?: IsoDate | null; recurring?: boolean } = {}
): Id {
	return Number(
		db
			.prepare(
				`INSERT INTO todos (title, aspect_id, sprint_id, status, day, due_date, recurring, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, '')`
			)
			.run(
				title,
				aspect,
				fields.sprintId ?? null,
				fields.status ?? 'todo',
				fields.day ?? null,
				fields.dueDate ?? null,
				fields.recurring ? 1 : 0
			).lastInsertRowid
	);
}

function row(id: Id) {
	return db.prepare('SELECT sprint_id, status, day, completed_at FROM todos WHERE id = ?').get(id);
}

describe('sprint planning', () => {
	it('Scenario: Start a sprint with zero todos', () => {
		const result = startSprint(db, '2026-10-07', []);
		expect(result.ok).toBe(true);
		const active = getActiveSprint(db);
		expect(active).toMatchObject({ state: 'active', weekStart: '2026-10-05' });
		expect(active?.startedAt).not.toBeNull();
		expect(listSprintTodos(db, active!.id)).toEqual([]);
	});

	it('Scenario: Only one sprint can be active', () => {
		const first = startSprint(db, '2026-10-05', []);
		const before = getActiveSprint(db);
		const second = startSprint(db, '2026-10-07', []);
		expect(second).toEqual({ ok: false, error: 'sprint-active' });
		expect(getActiveSprint(db)).toEqual(before);
		expect(first.ok && first.value.id).toBe(before?.id);
		expect(openPlanning(db, '2026-10-07')).toEqual({ ok: false, error: 'sprint-active' });
	});

	it('Scenario: Planning is blocked while a review is pending', () => {
		sprint('active', '2026-09-28');
		expect(openPlanning(db, '2026-10-05')).toEqual({ ok: false, error: 'review-pending' });
		expect(startSprint(db, '2026-10-05', [])).toEqual({ ok: false, error: 'review-pending' });
		expect(db.prepare('SELECT count(*) AS n FROM sprints').get()).toEqual({ n: 1 });
	});

	it('Scenario: Review is available from the sprint\'s Sunday', () => {
		sprint('active', '2026-10-05');
		expect(sprintPhase(db, '2026-10-05').phase).toBe('running');
		expect(sprintPhase(db, '2026-10-10').phase).toBe('running');
		expect(sprintPhase(db, '2026-10-11')).toMatchObject({
			phase: 'review-available',
			sprint: { state: 'active', weekStart: '2026-10-05' }
		});
	});

	it('Scenario: Review is required from the Monday after', () => {
		sprint('active', '2026-10-05');
		expect(sprintPhase(db, '2026-10-12').phase).toBe('review-required');
		expect(sprintPhase(db, '2026-11-02').phase).toBe('review-required');
	});

	it('phase is none without sprints and planning with a draft', () => {
		expect(sprintPhase(db, '2026-10-05')).toEqual({ phase: 'none', sprint: null });
		const planning = openPlanning(db, '2026-10-11');
		expect(planning.ok && planning.value.weekStart).toBe('2026-10-12');
		expect(sprintPhase(db, '2026-10-11')).toMatchObject({ phase: 'planning', sprint: { state: 'planning' } });
		const again = openPlanning(db, '2026-10-11');
		expect(again.ok && again.value.sprint.id).toBe(planning.ok && planning.value.sprint.id);
	});

	it('suggests backlog todos due in the target week and starts with the checked ones', () => {
		const thursday = todo('Due Thursday', { dueDate: '2026-10-15' });
		const sunday = todo('Due Sunday', { dueDate: '2026-10-18' });
		todo('Due this week', { dueDate: '2026-10-09' });
		todo('Due later', { dueDate: '2026-10-19' });
		todo('No date');
		expect(suggestedTodos(db, '2026-10-11').map((t) => t.id)).toEqual([thursday, sunday]);

		const started = startSprint(db, '2026-10-11', [thursday]);
		expect(started.ok && started.value.weekStart).toBe('2026-10-12');
		const id = started.ok ? started.value.id : 0;
		expect(listSprintTodos(db, id).map((t) => t.id)).toEqual([thursday]);
		expect(row(sunday)).toMatchObject({ sprint_id: null });
	});

	it('pulled todos sit in the draft until the sprint starts, unpull returns them', () => {
		const a = todo('A');
		const b = todo('B');
		const pulled = pullTodo(db, a);
		expect(pullTodo(db, b).ok).toBe(true);
		expect(pulled.ok && pulled.value.sprintId).not.toBeNull();
		const draft = sprintPhase(db, '2026-10-07').sprint!;
		expect(draft.state).toBe('planning');

		expect(unpullTodo(db, b)).toMatchObject({ ok: true, value: { sprintId: null, status: 'todo' } });
		const started = startSprint(db, '2026-10-07', []);
		expect(started.ok && started.value.id).toBe(draft.id);
		expect(listSprintTodos(db, draft.id).map((t) => t.id)).toEqual([a]);
		expect(pullTodo(db, b)).toEqual({ ok: false, error: 'sprint-active' });
		expect(unpullTodo(db, a)).toEqual({ ok: false, error: 'not-found' });
		expect(pullTodo(db, 999)).toEqual({ ok: false, error: 'not-found' });
	});
});

describe('mid-sprint changes', () => {
	it('Scenario: Moving back to the backlog clears day and status', () => {
		const id = todo('Write essay', { sprintId: sprint('active', '2026-10-05'), status: 'doing', day: '2026-10-07' });
		expect(moveToBacklog(db, id)).toMatchObject({ ok: true, value: { sprintId: null, day: null, status: 'todo' } });
		expect(row(id)).toMatchObject({ sprint_id: null, day: null, status: 'todo' });
	});

	it('Scenario: Unchecking done returns to To do', () => {
		const id = todo('Run', { sprintId: sprint('active', '2026-10-05') });
		const done = toggleDone(db, id);
		expect(done).toMatchObject({ ok: true, value: { status: 'done' } });
		expect(done.ok && done.value.completedAt).toBeTruthy();
		expect(toggleDone(db, id)).toMatchObject({ ok: true, value: { status: 'todo', completedAt: null } });
		expect(row(id)).toMatchObject({ status: 'todo', completed_at: null });
	});

	it('setStatus records completion only for done', () => {
		const id = todo('Run', { sprintId: sprint('active', '2026-10-05') });
		expect(setStatus(db, id, 'doing')).toMatchObject({ ok: true, value: { status: 'doing', completedAt: null } });
		const done = setStatus(db, id, 'done');
		expect(done.ok && done.value.completedAt).toBeTruthy();
		expect(setStatus(db, id, 'doing')).toMatchObject({ ok: true, value: { completedAt: null } });
		expect(setStatus(db, 999, 'done')).toEqual({ ok: false, error: 'not-found' });
	});

	it('adds a backlog todo to the active sprint as To do', () => {
		const id = todo('Call bank');
		expect(addToActiveSprint(db, id)).toEqual({ ok: false, error: 'no-active-sprint' });
		const s = sprint('active', '2026-10-05');
		expect(addToActiveSprint(db, id)).toMatchObject({ ok: true, value: { sprintId: s, status: 'todo', day: null } });
		expect(moveToBacklog(db, todo('Backlog'))).toEqual({ ok: false, error: 'not-found' });
	});

	it('setDay accepts only days of the todo\'s sprint', () => {
		const id = todo('Run', { sprintId: sprint('active', '2026-10-05') });
		expect(setDay(db, id, '2026-10-11')).toMatchObject({ ok: true, value: { day: '2026-10-11' } });
		expect(setDay(db, id, '2026-10-12')).toEqual({ ok: false, error: 'day-outside-sprint', field: 'day' });
		expect(setDay(db, id, '2026-10-04')).toEqual({ ok: false, error: 'day-outside-sprint', field: 'day' });
		expect(setDay(db, todo('Backlog'), '2026-10-06')).toEqual({ ok: false, error: 'day-outside-sprint', field: 'day' });
		expect(setDay(db, id, null)).toMatchObject({ ok: true, value: { day: null } });
		expect(setDay(db, 999, null)).toEqual({ ok: false, error: 'not-found' });
	});

	it('lists today\'s todos of the active sprint', () => {
		const s = sprint('active', '2026-10-05');
		const mine = todo('Today', { sprintId: s, day: '2026-10-07' });
		todo('Tomorrow', { sprintId: s, day: '2026-10-08' });
		todo('Unscheduled', { sprintId: s });
		todo('Old sprint', { sprintId: sprint('closed', '2026-10-05'), day: '2026-10-07' });
		expect(listToday(db, '2026-10-07').map((t) => t.id)).toEqual([mine]);
	});
});
