import type { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Id, IsoDate, ReviewDecision, Sprint, Status } from '$lib/types';
import { openDb } from './db';
import {
	addToActiveSprint,
	aspectProgress,
	closeReview,
	getActiveSprint,
	listPlannedForWeek,
	listSprintTodos,
	listToday,
	moveToBacklog,
	openPlanning,
	pullTodo,
	removeFromSprint,
	reviewSummary,
	setDay,
	setStatus,
	sprintPhase,
	startSprint,
	suggestedTodos,
	toggleDone,
	unpullTodo
} from './sprints';
import { backlogCounts } from './todos';
import { listRules } from './recurring';
import { shownDay } from '$lib/todo-utils';

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
	fields: {
		sprintId?: Id | null;
		status?: Status;
		day?: IsoDate | null;
		dueDate?: IsoDate | null;
		recurring?: boolean;
		startTime?: string | null;
		endTime?: string | null;
	} = {}
): Id {
	return Number(
		db
			.prepare(
				`INSERT INTO todos (title, aspect_id, sprint_id, status, day, due_date, recurring, start_time, end_time, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '')`
			)
			.run(
				title,
				aspect,
				fields.sprintId ?? null,
				fields.status ?? 'todo',
				fields.day ?? null,
				fields.dueDate ?? null,
				fields.recurring ? 1 : 0,
				fields.startTime ?? null,
				fields.endTime ?? null
			).lastInsertRowid
	);
}

function row(id: Id) {
	return db.prepare('SELECT sprint_id, status, day, start_time, end_time, completed_at FROM todos WHERE id = ?').get(id);
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

	it("Scenario: Starting a sprint pulls the week's planned todos", () => {
		const dentist = todo('Dentist', { day: '2026-10-20', startTime: '18:00', endTime: '19:30' });
		const tax = todo('Tax return', { day: '2026-11-03' });
		const done = todo('Pay rent', { status: 'done', day: '2026-10-21' });
		const started = startSprint(db, '2026-10-18', []);
		expect(started.ok && started.value.weekStart).toBe('2026-10-19');
		const sprintId = started.ok ? started.value.id : 0;
		expect(row(dentist)).toMatchObject({ sprint_id: sprintId, day: '2026-10-20', start_time: '18:00', end_time: '19:30' });
		expect(row(tax)).toMatchObject({ sprint_id: null, day: '2026-11-03' });
		expect(row(done)).toMatchObject({ sprint_id: null, day: '2026-10-21' });
	});

	it('Scenario: Due and planned todo keeps its day', () => {
		const id = todo('Dentist', { dueDate: '2026-10-22', day: '2026-10-20', startTime: '18:00' });
		const suggested = suggestedTodos(db, '2026-10-18').map((t) => t.id);
		expect(suggested).not.toContain(id);
		const started = startSprint(db, '2026-10-18', [...suggested, id]);
		expect(row(id)).toMatchObject({
			sprint_id: started.ok && started.value.id,
			day: '2026-10-20',
			start_time: '18:00'
		});
	});

	it('Scenario: Todo planned for a later week is not suggested', () => {
		const id = todo('Tax return', { dueDate: '2026-10-22', day: '2026-11-03', startTime: '10:00' });
		const suggested = suggestedTodos(db, '2026-10-18').map((t) => t.id);
		expect(suggested).not.toContain(id);
		startSprint(db, '2026-10-18', suggested);
		expect(row(id)).toMatchObject({ sprint_id: null, day: '2026-11-03', start_time: '10:00' });
	});

	it('Scenario: Missed planned todo joins the next sprint unscheduled', () => {
		const id = todo('Dentist', { day: '2026-10-14', startTime: '18:00' });
		const started = startSprint(db, '2026-10-18', []);
		expect(row(id)).toMatchObject({
			sprint_id: started.ok && started.value.id,
			day: null,
			start_time: null,
			end_time: null
		});
	});

	it('Scenario: Archived class todos are not pulled', () => {
		const semester = Number(
			db.prepare("INSERT INTO semesters (name, archived_at, created_at) VALUES ('SS', 'a', 'c')").run().lastInsertRowid
		);
		const klass = Number(
			db
				.prepare(
					"INSERT INTO classes (semester_id, name, color, icon, created_at, updated_at) VALUES (?, 'OS', 'sky', 'book', 'c', 'c')"
				)
				.run(semester).lastInsertRowid
		);
		const id = todo('Lab report', { day: '2026-10-14', startTime: '18:00' });
		db.prepare('UPDATE todos SET class_id = ? WHERE id = ?').run(klass, id);
		startSprint(db, '2026-10-18', []);
		expect(row(id)).toMatchObject({ sprint_id: null, day: '2026-10-14', start_time: '18:00' });
	});

	it('Scenario: Archived class todo planned in the week is neither listed nor pulled', () => {
		const semester = Number(
			db.prepare("INSERT INTO semesters (name, archived_at, created_at) VALUES ('SS', 'a', 'c')").run().lastInsertRowid
		);
		const klass = Number(
			db
				.prepare(
					"INSERT INTO classes (semester_id, name, color, icon, created_at, updated_at) VALUES (?, 'OS', 'sky', 'book', 'c', 'c')"
				)
				.run(semester).lastInsertRowid
		);
		const archived = todo('Lab report', { day: '2026-10-20', startTime: '18:00' });
		db.prepare('UPDATE todos SET class_id = ? WHERE id = ?').run(klass, archived);
		const open = todo('Dentist', { day: '2026-10-21' });
		expect(listPlannedForWeek(db, '2026-10-19').map((t) => t.id)).toEqual([open]);
		startSprint(db, '2026-10-18', []);
		expect(row(archived)).toMatchObject({ sprint_id: null, day: '2026-10-20', start_time: '18:00' });
		expect(row(open)?.sprint_id).not.toBeNull();
	});

	it('listPlannedForWeek lists open backlog todos of the week by day and start time', () => {
		const late = todo('Late', { day: '2026-10-20', startTime: '18:00' });
		const allDay = todo('All day', { day: '2026-10-20' });
		const early = todo('Early', { day: '2026-10-20', startTime: '07:00' });
		const sunday = todo('Sunday', { day: '2026-10-25' });
		todo('Next week', { day: '2026-10-26' });
		todo('Done', { status: 'done', day: '2026-10-21' });
		todo('Unplanned');
		expect(listPlannedForWeek(db, '2026-10-19').map((t) => t.id)).toEqual([allDay, early, late, sunday]);
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

	it('Scenario: Pulling a planned todo by hand clears its date', () => {
		const id = todo('Dentist', { day: '2026-11-04', startTime: '10:00' });
		expect(pullTodo(db, id)).toMatchObject({ ok: true, value: { day: null, startTime: null, endTime: null } });
		expect(row(id)).toMatchObject({ day: null, start_time: null, end_time: null });
	});

	it('only backlog or draft todos can be pulled', () => {
		const closed = sprint('closed', '2026-09-28');
		const done = todo('Done last week', { sprintId: closed, status: 'done', day: '2026-09-30' });
		expect(pullTodo(db, done)).toEqual({ ok: false, error: 'not-found' });
		expect(row(done)).toMatchObject({ sprint_id: closed, status: 'done', day: '2026-09-30' });
		const a = todo('A');
		expect(pullTodo(db, a).ok).toBe(true);
		expect(pullTodo(db, a).ok).toBe(true);
	});
});

describe('mid-sprint changes', () => {
	it('Scenario: Moving back to the backlog clears day, slot and status', () => {
		const id = todo('Write essay', {
			sprintId: sprint('active', '2026-10-05'),
			status: 'doing',
			day: '2026-10-07',
			startTime: '18:00',
			endTime: '19:30'
		});
		expect(moveToBacklog(db, id)).toMatchObject({
			ok: true,
			value: { sprintId: null, day: null, startTime: null, endTime: null, status: 'todo' }
		});
		expect(row(id)).toMatchObject({ sprint_id: null, day: null, start_time: null, end_time: null, status: 'todo' });
	});

	it('Scenario: Add to sprint without a day drops a planned date', () => {
		const s = sprint('active', '2026-10-05');
		const first = todo('Dentist', { day: '2026-10-28', startTime: '18:00' });
		const second = todo('Tax return', { day: '2026-10-28', startTime: '09:00' });
		expect(addToActiveSprint(db, first, '2026-10-07')).toMatchObject({
			ok: true,
			value: { sprintId: s, day: null, startTime: null, endTime: null }
		});
		expect(addToActiveSprint(db, second, '2026-10-07', { day: '2026-10-08' })).toMatchObject({
			ok: true,
			value: { sprintId: s, day: '2026-10-08', startTime: '09:00' }
		});
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
		expect(addToActiveSprint(db, id, '2026-10-07')).toEqual({ ok: false, error: 'no-active-sprint' });
		const s = sprint('active', '2026-10-05');
		expect(addToActiveSprint(db, id, '2026-10-07')).toMatchObject({ ok: true, value: { sprintId: s, status: 'todo', day: null } });
		expect(moveToBacklog(db, todo('Backlog'))).toEqual({ ok: false, error: 'not-found' });
	});

	it('a done backlog todo joins the active sprint as To do', () => {
		const s = sprint('active', '2026-10-05');
		const id = todo('Call bank', { status: 'done' });
		expect(addToActiveSprint(db, id, '2026-10-07')).toMatchObject({ ok: true, value: { sprintId: s, status: 'todo', completedAt: null } });
	});

	it('only backlog todos join the active sprint', () => {
		const closed = sprint('closed', '2026-09-28');
		const s = sprint('active', '2026-10-05');
		const done = todo('Done last week', { sprintId: closed, status: 'done', day: '2026-09-30' });
		const doing = todo('Write essay', { sprintId: s, status: 'doing', day: '2026-10-07' });
		expect(addToActiveSprint(db, done, '2026-10-07')).toEqual({ ok: false, error: 'not-found' });
		expect(addToActiveSprint(db, doing, '2026-10-07')).toEqual({ ok: false, error: 'not-found' });
		expect(row(done)).toMatchObject({ sprint_id: closed, status: 'done', day: '2026-09-30' });
		expect(row(doing)).toMatchObject({ sprint_id: s, status: 'doing', day: '2026-10-07' });
	});

	it('Scenario: Add to the sprint with a day or a status', () => {
		const s = sprint('active', '2026-10-05');
		const thursday = todo('Call bank');
		const done = todo('Pay rent');
		const outside = todo('Book trip');
		expect(addToActiveSprint(db, thursday, '2026-10-07', { day: '2026-10-08' })).toMatchObject({
			ok: true,
			value: { sprintId: s, day: '2026-10-08', status: 'todo' }
		});
		const added = addToActiveSprint(db, done, '2026-10-07', { status: 'done' });
		expect(added).toMatchObject({ ok: true, value: { sprintId: s, status: 'done' } });
		expect(added.ok && added.value.completedAt).toBeTruthy();
		expect(addToActiveSprint(db, outside, '2026-10-07', { day: '2026-10-12' })).toEqual({
			ok: false,
			error: 'day-outside-sprint',
			field: 'day'
		});
		expect(row(outside)).toMatchObject({ sprint_id: null, day: null, status: 'todo' });
	});

	it('Scenario: Adding a todo that is no longer in the backlog is refused', () => {
		const s = sprint('active', '2026-10-05');
		const id = todo('Write essay', { sprintId: s, status: 'doing', day: '2026-10-07' });
		expect(addToActiveSprint(db, id, '2026-10-07', { day: '2026-10-09', status: 'done' })).toEqual({
			ok: false,
			error: 'not-found'
		});
		expect(row(id)).toMatchObject({ sprint_id: s, status: 'doing', day: '2026-10-07', completed_at: null });
	});

	it('Scenario: Adding to the sprint is refused while the review is required', () => {
		const s = sprint('active', '2026-10-05');
		const id = todo('Call bank');
		expect(addToActiveSprint(db, id, '2026-10-12')).toEqual({ ok: false, error: 'review-required' });
		expect(row(id)).toMatchObject({ sprint_id: null, status: 'todo', day: null, completed_at: null });
		expect(addToActiveSprint(db, id, '2026-10-11')).toMatchObject({ ok: true, value: { sprintId: s } });
	});

	it('Scenario: Removing a recurring instance deletes only that instance', () => {
		const s = sprint('active', '2026-10-05');
		const rule = Number(
			db
				.prepare(
					"INSERT INTO recurring_rules (title, aspect_id, weekdays, created_at) VALUES ('Gym', ?, '[1,4]', '')"
				)
				.run(aspect).lastInsertRowid
		);
		const monday = todo('Gym', { sprintId: s, day: '2026-10-05', recurring: true });
		const thursday = todo('Gym', { sprintId: s, day: '2026-10-08', recurring: true });
		db.prepare('UPDATE todos SET rule_id = ? WHERE id IN (?, ?)').run(rule, monday, thursday);
		const essay = todo('Write essay', { sprintId: s, status: 'doing', day: '2026-10-07', startTime: '18:00' });

		expect(removeFromSprint(db, monday)).toMatchObject({ ok: true, value: { deleted: true, todo: { id: monday } } });
		expect(row(monday)).toBeUndefined();
		expect(row(thursday)).toMatchObject({ sprint_id: s, day: '2026-10-08' });
		expect(db.prepare('SELECT id FROM recurring_rules WHERE id = ?').get(rule)).toBeDefined();

		expect(removeFromSprint(db, essay)).toMatchObject({
			ok: true,
			value: { deleted: false, todo: { sprintId: null, day: null, startTime: null, status: 'todo' } }
		});
		expect(row(essay)).toMatchObject({ sprint_id: null, day: null, start_time: null, status: 'todo' });
		expect(removeFromSprint(db, essay)).toEqual({ ok: false, error: 'not-found' });
	});

	it('setStatus refuses an unknown status', () => {
		const id = todo('Run', { sprintId: sprint('active', '2026-10-05') });
		expect(setStatus(db, id, 'later' as Status)).toEqual({ ok: false, error: 'required', field: 'status' });
		expect(row(id)).toMatchObject({ status: 'todo' });
	});

	it('setDay places the todo by its date', () => {
		const s = sprint('active', '2026-10-05');
		const id = todo('Run', { sprintId: s });
		expect(setDay(db, id, '2026-10-11', '2026-10-07')).toMatchObject({ ok: true, value: { day: '2026-10-11' } });
		expect(setDay(db, id, '2026-10-04', '2026-10-07')).toEqual({ ok: false, error: 'day-in-past', field: 'day' });
		expect(setDay(db, id, null, '2026-10-07')).toMatchObject({ ok: true, value: { day: null } });
		expect(setDay(db, id, '2026-10-12', '2026-10-07')).toMatchObject({
			ok: true,
			value: { sprintId: null, day: '2026-10-12' }
		});
		expect(setDay(db, todo('Backlog'), '2026-10-06', '2026-10-07')).toMatchObject({
			ok: true,
			value: { sprintId: s, day: '2026-10-06' }
		});
		expect(setDay(db, 999, null, '2026-10-07')).toEqual({ ok: false, error: 'not-found' });
	});

	describe('planned date', () => {
		const TODAY = '2026-10-14';

		it('Scenario: Planned date and slot are stored', () => {
			sprint('active', '2026-10-12');
			const id = todo('Dentist');
			const planned = setDay(db, id, '2026-10-28', TODAY, { startTime: '18:00', endTime: '19:30' });
			expect(planned).toMatchObject({ ok: true, value: { day: '2026-10-28', startTime: '18:00', endTime: '19:30' } });
			expect(row(id)).toMatchObject({ sprint_id: null, day: '2026-10-28', start_time: '18:00', end_time: '19:30' });
		});

		it('Scenario: Clearing the date clears the times', () => {
			const id = todo('Dentist', { day: '2026-10-28', startTime: '18:00', endTime: '19:30' });
			expect(setDay(db, id, null, TODAY)).toMatchObject({
				ok: true,
				value: { day: null, startTime: null, endTime: null }
			});
			expect(row(id)).toMatchObject({ day: null, start_time: null, end_time: null });
		});

		it('Scenario: Past date outside the active sprint week is refused', () => {
			sprint('active', '2026-10-12');
			const id = todo('Dentist');
			const refused = { ok: false, error: 'day-in-past', field: 'day' };
			expect(setDay(db, id, '2026-10-11', TODAY)).toEqual(refused);
			expect(row(id)).toMatchObject({ sprint_id: null, day: null });
			expect(setDay(db, id, '2026-10-12', TODAY)).toMatchObject({ ok: true, value: { day: '2026-10-12' } });

			db.prepare("UPDATE sprints SET state = 'closed'").run();
			const other = todo('Tax return');
			expect(setDay(db, other, '2026-10-13', TODAY)).toEqual(refused);
			expect(row(other)).toMatchObject({ sprint_id: null, day: null });
		});

		it('Scenario: Done todo is planned like any todo', () => {
			const s = sprint('active', '2026-10-12');
			const id = todo('Pay rent', { sprintId: s, status: 'done', day: '2026-10-12' });
			db.prepare("UPDATE todos SET completed_at = 'x' WHERE id = ?").run(id);
			expect(setDay(db, id, '2026-10-16', TODAY, { startTime: '09:00', endTime: null })).toMatchObject({
				ok: true,
				value: { sprintId: s, day: '2026-10-16', startTime: '09:00', status: 'done' }
			});
		});

		it('Scenario: Invalid slot is refused on save', () => {
			const s = sprint('active', '2026-10-12');
			const id = todo('Run', { sprintId: s, day: '2026-10-15', startTime: '10:00' });
			expect(setDay(db, id, '2026-10-15', TODAY, { startTime: null, endTime: '19:30' })).toEqual({
				ok: false,
				error: 'end-without-start',
				field: 'endTime'
			});
			expect(setDay(db, id, '2026-10-15', TODAY, { startTime: '18:00', endTime: '17:00' })).toEqual({
				ok: false,
				error: 'end-before-start',
				field: 'endTime'
			});
			expect(row(id)).toMatchObject({ day: '2026-10-15', start_time: '10:00', end_time: null });
		});

		it('Scenario: Sprint todo planned outside the week moves to the backlog', () => {
			const s = sprint('active', '2026-10-12');
			const id = todo('Run', { sprintId: s, status: 'doing', day: '2026-10-15' });
			expect(setDay(db, id, '2026-10-27', TODAY, { startTime: '18:00', endTime: '19:30' })).toMatchObject({
				ok: true,
				value: { sprintId: null, status: 'todo', day: '2026-10-27', startTime: '18:00', endTime: '19:30' }
			});
			expect(row(id)).toMatchObject({ sprint_id: null, status: 'todo', day: '2026-10-27', completed_at: null });
		});

		it('Scenario: Backlog todo planned inside the week joins the sprint', () => {
			const s = sprint('active', '2026-10-12');
			const id = todo('Dentist');
			expect(setDay(db, id, '2026-10-16', TODAY, { startTime: '07:30', endTime: null })).toMatchObject({
				ok: true,
				value: { sprintId: s, status: 'todo', day: '2026-10-16', startTime: '07:30' }
			});
		});

		it('Scenario: Without an active sprint a planned todo stays in the backlog', () => {
			const id = todo('Dentist');
			expect(setDay(db, id, '2026-10-21', TODAY)).toMatchObject({ ok: true, value: { sprintId: null, day: '2026-10-21' } });
			expect(row(id)).toMatchObject({ sprint_id: null, day: '2026-10-21' });
		});

		it("Scenario: Day in the planning draft's target week stays in the backlog", () => {
			sprint('closed', '2026-10-12');
			const draft = sprint('planning', null);
			const backlog = todo('Dentist');
			const drafted = todo('Tax return', { sprintId: draft, status: 'doing' });
			expect(setDay(db, backlog, '2026-10-21', '2026-10-18')).toMatchObject({ ok: true });
			expect(setDay(db, drafted, '2026-10-22', '2026-10-18')).toMatchObject({ ok: true });
			expect(row(backlog)).toMatchObject({ sprint_id: null, day: '2026-10-21' });
			expect(row(drafted)).toMatchObject({ sprint_id: null, day: '2026-10-22' });
		});

		it('Scenario: Planning into the week is refused while the review is required', () => {
			sprint('active', '2026-10-05');
			const id = todo('Dentist');
			expect(setDay(db, id, '2026-10-08', '2026-10-12')).toEqual({ ok: false, error: 'review-required' });
			expect(row(id)).toMatchObject({ sprint_id: null, day: null });
			expect(setDay(db, id, '2026-10-12', '2026-10-12')).toMatchObject({ ok: true, value: { sprintId: null, day: '2026-10-12' } });
		});

		it('Scenario: Closed-sprint todo keeps its sprint', () => {
			const closed = sprint('closed', '2026-09-28');
			sprint('active', '2026-10-12');
			const id = todo('Pay rent', { sprintId: closed, status: 'done', day: '2026-09-29' });
			expect(setDay(db, id, '2026-10-02', TODAY)).toMatchObject({ ok: true, value: { sprintId: closed, day: '2026-10-02' } });
			expect(setDay(db, id, '2026-11-10', TODAY)).toEqual({ ok: false, error: 'day-outside-sprint', field: 'day' });
			expect(row(id)).toMatchObject({ sprint_id: closed, status: 'done', day: '2026-10-02' });
		});

		it('Scenario: Moving a todo to another day keeps its slot', () => {
			const s = sprint('active', '2026-10-12');
			const id = todo('Run', { sprintId: s, day: '2026-10-13', startTime: '18:00', endTime: '19:30' });
			expect(setDay(db, id, '2026-10-16', TODAY)).toMatchObject({
				ok: true,
				value: { day: '2026-10-16', startTime: '18:00', endTime: '19:30' }
			});
			expect(setDay(db, id, null, TODAY)).toMatchObject({ ok: true, value: { day: null, startTime: null, endTime: null } });
		});

		it('Scenario: Recurring instance cannot be planned outside its week', () => {
			const s = sprint('active', '2026-10-12');
			const instance = todo('Gym', { sprintId: s, day: '2026-10-15', recurring: true, startTime: '18:00' });
			const refused = { ok: false, error: 'recurring-outside-week', field: 'day' };
			expect(setDay(db, instance, '2026-10-21', TODAY, { startTime: '07:00', endTime: null })).toEqual(refused);
			expect(setDay(db, instance, '2026-10-22', TODAY)).toEqual(refused);
			expect(row(instance)).toMatchObject({ sprint_id: s, day: '2026-10-15', start_time: '18:00' });
			expect(setDay(db, instance, '2026-10-17', TODAY, { startTime: '07:00', endTime: null })).toMatchObject({
				ok: true,
				value: { sprintId: s, day: '2026-10-17', startTime: '07:00' }
			});

			db.prepare("UPDATE sprints SET state = 'closed'").run();
			const draft = sprint('planning', null);
			const carried = todo('Gym', { sprintId: draft, recurring: true });
			expect(setDay(db, carried, '2026-10-22', '2026-10-18')).toEqual(refused);
			expect(row(carried)).toMatchObject({ sprint_id: draft, day: null });
		});

		it('Scenario: Instance slot is edited like any todo', () => {
			const s = sprint('active', '2026-10-12');
			const rule = Number(
				db
					.prepare(
						"INSERT INTO recurring_rules (title, aspect_id, weekdays, start_time, end_time, created_at) VALUES ('Gym', ?, '2', '18:00', '19:30', '')"
					)
					.run(aspect).lastInsertRowid
			);
			const id = todo('Gym', { sprintId: s, day: '2026-10-13', recurring: true, startTime: '18:00', endTime: '19:30' });
			db.prepare('UPDATE todos SET rule_id = ? WHERE id = ?').run(rule, id);
			expect(setDay(db, id, '2026-10-13', TODAY, { startTime: '19:00', endTime: '20:00' })).toMatchObject({
				ok: true,
				value: { sprintId: s, recurring: true, ruleId: rule, day: '2026-10-13', startTime: '19:00', endTime: '20:00' }
			});
			expect(listRules(db).find((r) => r.id === rule)).toMatchObject({ startTime: '18:00', endTime: '19:30' });
		});
	});

	it('lists today\'s todos of the active sprint', () => {
		const s = sprint('active', '2026-10-05');
		const mine = todo('Today', { sprintId: s, day: '2026-10-07' });
		todo('Tomorrow', { sprintId: s, day: '2026-10-08' });
		todo('Unscheduled', { sprintId: s });
		todo('Old sprint', { sprintId: sprint('closed', '2026-10-05'), day: '2026-10-07' });
		expect(listToday(db, '2026-10-07').map((t) => t.id)).toEqual([mine]);
	});

	it('Regression: sprint todos dated today without a day are missing from Today', () => {
		const s = sprint('active', '2026-10-05');
		const dated = todo('Dated today', { sprintId: s, dueDate: '2026-10-06', status: 'doing' });
		todo('Dated tomorrow', { sprintId: s, dueDate: '2026-10-07' });
		todo('Placed tomorrow, due today', { sprintId: s, day: '2026-10-07', dueDate: '2026-10-06' });
		todo('Backlog dated today', { dueDate: '2026-10-06' });
		expect(listToday(db, '2026-10-06').map((t) => [t.id, shownDay(t)])).toEqual([[dated, '2026-10-06']]);
	});

	it('Regression: dated sprint todos are missing from their day in the week view', () => {
		const s = sprint('active', '2026-10-05');
		const dated = todo('Dated Tuesday', { sprintId: s, dueDate: '2026-10-06' });
		const placed = todo('Placed Monday, due Tuesday', { sprintId: s, day: '2026-10-05', dueDate: '2026-10-06' });
		const later = todo('Due next week', { sprintId: s, dueDate: '2026-10-13' });
		const days = Object.fromEntries(listSprintTodos(db, s).map((t) => [t.id, shownDay(t)]));
		expect(days).toEqual({ [dated]: '2026-10-06', [placed]: '2026-10-05', [later]: null });
	});

	it('Regression: a due date shown as the day reads back as a planned day', () => {
		const s = sprint('active', '2026-10-12');
		const dated = todo('Due Friday', { sprintId: s, dueDate: '2026-10-16' });
		const placed = todo('Placed Tuesday', { sprintId: s, day: '2026-10-13', dueDate: '2026-10-16' });
		const sprintTodos = listSprintTodos(db, s);
		expect(sprintTodos.find((t) => t.id === dated)).toMatchObject({ day: null, dueDay: '2026-10-16' });
		expect(sprintTodos.find((t) => t.id === placed)).toMatchObject({ day: '2026-10-13' });
		expect(sprintTodos.find((t) => t.id === placed)).not.toHaveProperty('dueDay');
		expect(listToday(db, '2026-10-16').map((t) => [t.id, t.day, t.dueDay])).toEqual([[dated, null, '2026-10-16']]);
	});
});

describe('sprint review', () => {
	it('Scenario: Carried and returned todos lose their slot', () => {
		const s = sprint('active', '2026-10-05');
		const carried = todo('Run', { sprintId: s, day: '2026-10-06', startTime: '18:00', endTime: '19:30' });
		const back = todo('Read', { sprintId: s, day: '2026-10-07', startTime: '09:00' });
		const result = closeReview(db, '2026-10-12', { [carried]: 'carry', [back]: 'backlog' });
		expect(result.ok).toBe(true);
		expect(row(carried)).toMatchObject({ sprint_id: result.ok && result.value.id, day: null, start_time: null, end_time: null });
		expect(row(back)).toMatchObject({ sprint_id: null, day: null, start_time: null, end_time: null });
	});

	it('Scenario: Open recurring instance is carried or dropped', () => {
		const s = sprint('active', '2026-10-05');
		const dropped = todo('Gym Mon', { sprintId: s, day: '2026-10-05', recurring: true });
		const carried = todo('Gym Thu', { sprintId: s, status: 'doing', day: '2026-10-08', recurring: true });
		const normal = todo('Essay', { sprintId: s, day: '2026-10-06' });

		expect(closeReview(db, '2026-10-12', { [carried]: 'backlog' })).toEqual({
			ok: false,
			error: 'recurring-no-backlog',
			field: `decision-${carried}`
		});
		expect(closeReview(db, '2026-10-12', { [normal]: 'drop' })).toEqual({
			ok: false,
			error: 'not-recurring',
			field: `decision-${normal}`
		});
		expect(getActiveSprint(db)?.id).toBe(s);

		const result = closeReview(db, '2026-10-12', { [dropped]: 'drop', [carried]: 'carry' });
		expect(result.ok).toBe(true);
		const draft = result.ok ? result.value : null;
		expect(draft).toMatchObject({ state: 'planning', weekStart: null });
		expect(row(dropped)).toBeUndefined();
		expect(row(carried)).toMatchObject({ sprint_id: draft!.id, status: 'doing', day: null });
		expect(row(normal)).toMatchObject({ sprint_id: draft!.id, day: null });
	});

	it('Scenario: Done todos stay with the closed sprint', () => {
		const s = sprint('active', '2026-10-05');
		const done = todo('Done', { sprintId: s, status: 'done', day: '2026-10-06' });
		const back = todo('Back', { sprintId: s, status: 'doing', day: '2026-10-07' });
		const summary = reviewSummary(db);
		expect(summary?.sprint.id).toBe(s);
		expect(summary?.done.map((t) => t.id)).toEqual([done]);
		expect(summary?.open.map((t) => t.id)).toEqual([back]);

		const result = closeReview(db, '2026-10-11', { [back]: 'backlog', [done]: 'drop' });
		expect(result.ok).toBe(true);
		const draft = result.ok ? result.value.id : 0;
		expect(row(done)).toMatchObject({ sprint_id: s, status: 'done', day: '2026-10-06' });
		expect(row(back)).toMatchObject({ sprint_id: null, status: 'todo', day: null });
		expect(listSprintTodos(db, draft)).toEqual([]);
		expect(db.prepare('SELECT state, closed_at FROM sprints WHERE id = ?').get(s)).toMatchObject({
			state: 'closed',
			closed_at: expect.any(String)
		});
		expect(reviewSummary(db)).toBeNull();
	});

	it('Scenario: Weeks away review only the last sprint', () => {
		const s = sprint('active', '2026-09-14');
		todo('Open', { sprintId: s });
		const result = closeReview(db, '2026-10-07', {});
		expect(result.ok).toBe(true);
		expect(db.prepare('SELECT id, state, week_start FROM sprints ORDER BY id').all()).toEqual([
			{ id: s, state: 'closed', week_start: '2026-09-14' },
			{ id: result.ok ? result.value.id : 0, state: 'planning', week_start: null }
		]);
		expect(sprintPhase(db, '2026-10-07').phase).toBe('planning');
		const planning = openPlanning(db, '2026-10-07');
		expect(planning.ok && planning.value.weekStart).toBe('2026-10-05');
	});

	it('an unknown decision is refused, not treated as backlog', () => {
		const s = sprint('active', '2026-10-05');
		const gym = todo('Gym Mon', { sprintId: s, day: '2026-10-05', recurring: true });
		expect(closeReview(db, '2026-10-12', { [gym]: 'foo' as ReviewDecision })).toEqual({
			ok: false,
			error: 'required',
			field: `decision-${gym}`
		});
		expect(row(gym)).toMatchObject({ sprint_id: s });
		expect(getActiveSprint(db)?.id).toBe(s);
	});

	it('review cannot close before the sprint\'s Sunday', () => {
		expect(closeReview(db, '2026-10-07', {})).toEqual({ ok: false, error: 'no-active-sprint' });
		sprint('active', '2026-10-05');
		expect(closeReview(db, '2026-10-10', {})).toEqual({ ok: false, error: 'sprint-active' });
	});

	it('carried todos start in the next sprint', () => {
		const s = sprint('active', '2026-10-05');
		const carried = todo('Carry', { sprintId: s, status: 'doing', day: '2026-10-06' });
		const draft = closeReview(db, '2026-10-11', {});
		const next = startSprint(db, '2026-10-11', []);
		expect(next.ok && next.value).toMatchObject({ id: draft.ok ? draft.value.id : 0, weekStart: '2026-10-12' });
		expect(row(carried)).toMatchObject({ status: 'doing', day: null });
	});
});

describe('progress', () => {
	it('Scenario: Progress and backlog counts per aspect', () => {
		const s = sprint('active', '2026-10-05');
		todo('Run', { sprintId: s, status: 'done' });
		todo('Swim', { sprintId: s, status: 'doing' });
		todo('Stretch', { sprintId: s });
		todo('Yoga');
		todo('Climb');
		const a = aspect;
		aspect = Number(
			db
				.prepare("INSERT INTO aspects (name, color, icon, position, created_at) VALUES ('Home', 'clay', 'home', 1, '')")
				.run().lastInsertRowid
		);
		todo('Fix shelf');
		todo('Old', { sprintId: sprint('closed', '2026-09-28'), status: 'done' });

		expect(aspectProgress(db, s)).toEqual({ [a]: { done: 1, total: 3 } });
		expect(backlogCounts(db)).toEqual({ [a]: 2, [aspect]: 1 });
	});
});
