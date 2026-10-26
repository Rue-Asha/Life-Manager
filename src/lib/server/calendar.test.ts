import type { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Id, IsoDate } from '$lib/types';
import { calendarMonth, type CalendarEntry } from './calendar';
import { openDb } from './db';

let db: DatabaseSync;
let aspect: Id;

function insert(sql: string, ...params: (string | number | null)[]): Id {
	return Number(db.prepare(sql).run(...params).lastInsertRowid);
}

function sprint(state: 'active' | 'closed', weekStart: IsoDate): Id {
	return insert('INSERT INTO sprints (week_start, state, started_at, closed_at) VALUES (?, ?, ?, ?)', weekStart, state, '', null);
}

function todo(
	title: string,
	opts: {
		day?: IsoDate | null;
		start?: string | null;
		end?: string | null;
		due?: IsoDate | null;
		sprintId?: Id | null;
		status?: string;
		ruleId?: Id | null;
	} = {}
): Id {
	return insert(
		`INSERT INTO todos (title, aspect_id, due_date, sprint_id, status, day, start_time, end_time, recurring, rule_id, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '')`,
		title,
		aspect,
		opts.due ?? null,
		opts.sprintId ?? null,
		opts.status ?? 'todo',
		opts.day ?? null,
		opts.start ?? null,
		opts.end ?? null,
		opts.ruleId ? 1 : 0,
		opts.ruleId ?? null
	);
}

function rule(title: string, weekdays: string, start: string | null = null, end: string | null = null, classId: Id | null = null): Id {
	return insert(
		`INSERT INTO recurring_rules (title, aspect_id, weekdays, start_time, end_time, class_id, type, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, '')`,
		title,
		aspect,
		weekdays,
		start,
		end,
		classId,
		classId === null ? null : 'LEC'
	);
}

function semester(name: string, archivedAt: string | null = null): Id {
	return insert('INSERT INTO semesters (name, archived_at, created_at) VALUES (?, ?, ?)', name, archivedAt, '');
}

function uniClass(semesterId: Id, name: string, examAt: string | null = null, room: string | null = null): Id {
	return insert(
		`INSERT INTO classes (semester_id, name, color, icon, exam_at, exam_room, created_at, updated_at)
		 VALUES (?, ?, 'sky', 'book', ?, ?, '', '')`,
		semesterId,
		name,
		examAt,
		room
	);
}

function titles(entries: CalendarEntry[]): string[] {
	return entries.map((e) => e.title);
}

function projectionDays(entries: Record<IsoDate, CalendarEntry[]>, title: string): IsoDate[] {
	return Object.keys(entries)
		.filter((d) => entries[d].some((e) => e.kind === 'projection' && e.title === title))
		.sort();
}

beforeEach(() => {
	db = openDb(':memory:');
	aspect = insert("INSERT INTO aspects (name, color, icon, position, created_at) VALUES ('Health', 'sage', 'heart', 0, '')");
});

describe('calendarMonth', () => {
	it('Scenario: Planned todos are entries, due dates are a separate list', () => {
		const active = sprint('active', '2026-10-12');
		const closed = sprint('closed', '2026-09-28');
		todo('Dentist', { day: '2026-10-21', start: '18:00', end: '19:30' });
		todo('Sprint item', { day: '2026-10-15', sprintId: active });
		todo('Old done', { day: '2026-10-02', sprintId: closed, status: 'done' });
		todo('Due in sprint', { due: '2026-10-16', sprintId: active });
		todo('Due backlog', { due: '2026-10-22' });

		const { entries, due } = calendarMonth(db, '2026-10', '2026-10-14');
		expect(entries['2026-10-21']).toMatchObject([{ kind: 'todo', title: 'Dentist', startTime: '18:00', endTime: '19:30', done: false }]);
		expect(entries['2026-10-15']).toMatchObject([{ kind: 'todo', title: 'Sprint item', startTime: null, endTime: null }]);
		expect(entries['2026-10-02']).toMatchObject([{ kind: 'todo', title: 'Old done', done: true }]);
		expect(entries['2026-10-16'] ?? []).toEqual([]);
		expect(entries['2026-10-22'] ?? []).toEqual([]);
		expect(due['2026-10-16']).toMatchObject([{ title: 'Due in sprint', aspectId: aspect }]);
		expect(due['2026-10-22']).toMatchObject([{ title: 'Due backlog', aspectId: aspect }]);
	});

	it('Scenario: Due lists open todos per day including past days', () => {
		const active = sprint('active', '2026-10-12');
		const a = todo('banana', { due: '2026-10-16' });
		const b = todo('Apple', { due: '2026-10-16', sprintId: active });
		todo('Elsewhere', { due: '2026-10-16', day: '2026-10-20', sprintId: active });
		todo('Done one', { due: '2026-10-16', status: 'done' });
		const past = todo('Overdue', { due: '2026-10-03' });
		todo('Next month', { due: '2026-11-03' });

		const { entries, due } = calendarMonth(db, '2026-10', '2026-10-14');
		expect(due['2026-10-16'].map((d) => d.title)).toEqual(['Apple', 'banana', 'Elsewhere']);
		expect(due['2026-10-16'].slice(0, 2).map((d) => d.id)).toEqual([b, a]);
		expect(due['2026-10-03']).toEqual([{ id: past, title: 'Overdue', aspectId: aspect }]);
		expect(due['2026-11-03']).toBeUndefined();
		expect(Object.values(due).flat().map((d) => d.title)).not.toContain('Done one');
		expect(entries['2026-10-16'] ?? []).toEqual([]);
		expect(entries['2026-10-03'] ?? []).toEqual([]);
		expect(entries['2026-10-20']).toHaveLength(1);
	});

	it('Scenario: Rules are projected after the active sprint week', () => {
		const active = sprint('active', '2026-10-12');
		const gym = rule('Gym', '1,4', '18:00');
		todo('Gym', { day: '2026-10-12', sprintId: active, ruleId: gym, start: '18:00' });
		todo('Gym', { day: '2026-10-15', sprintId: active, ruleId: gym, start: '18:00' });

		const { entries } = calendarMonth(db, '2026-10', '2026-10-14');
		for (const day of ['2026-10-12', '2026-10-15']) {
			expect(entries[day]).toHaveLength(1);
			expect(entries[day][0].kind).toBe('todo');
		}
		expect(projectionDays(entries, 'Gym')).toEqual(['2026-10-19', '2026-10-22', '2026-10-26', '2026-10-29']);
		expect(entries['2026-10-19']).toMatchObject([{ kind: 'projection', ruleId: gym, startTime: '18:00', endTime: null, aspectId: aspect }]);
	});

	it('Scenario: Without an active sprint projection starts today', () => {
		rule('Gym', '1,4');
		const { entries } = calendarMonth(db, '2026-10', '2026-10-14');
		expect(projectionDays(entries, 'Gym')).toEqual(['2026-10-15', '2026-10-19', '2026-10-22', '2026-10-26', '2026-10-29']);
		expect(entries['2026-10-12'] ?? []).toEqual([]);
	});

	it('Scenario: Sunday after the review closes does not show an instance twice', () => {
		const closed = sprint('closed', '2026-10-12');
		const sun = rule('Walk', '7');
		todo('Walk', { day: '2026-10-18', sprintId: closed, ruleId: sun, status: 'done' });
		const { entries } = calendarMonth(db, '2026-10', '2026-10-18');
		expect(entries['2026-10-18']).toMatchObject([{ kind: 'todo', title: 'Walk', done: true }]);
		expect(entries['2026-10-18']).toHaveLength(1);
		expect(projectionDays(entries, 'Walk')).toEqual(['2026-10-25']);
	});

	it('Scenario: Past months show only real todos', () => {
		const closed = sprint('closed', '2026-09-28');
		rule('Gym', '1,4');
		todo('Done thing', { day: '2026-09-30', sprintId: closed, status: 'done' });

		const { entries } = calendarMonth(db, '2026-09', '2026-10-14');
		expect(entries['2026-09-30']).toMatchObject([{ kind: 'todo', title: 'Done thing' }]);
		expect(projectionDays(entries, 'Gym')).toEqual([]);
	});

	it('Scenario: Rules of archived classes are not projected', () => {
		const old = semester('SS 26', '2026-09-01');
		const cls = uniClass(old, 'Analysis');
		rule('Lecture', '4', null, null, cls);
		rule('Plain', '4');

		const { entries } = calendarMonth(db, '2026-10', '2026-10-14');
		for (const day of ['2026-10-15', '2026-10-22', '2026-10-29']) expect(titles(entries[day])).toEqual(['Plain']);
	});

	it('Scenario: Exams appear at their time with room', () => {
		const current = semester('WS 26/27');
		const old = semester('SS 26', '2026-09-01');
		uniClass(current, 'Analysis', '2026-10-20T10:00', 'H1');
		uniClass(current, 'Algorithms', '2026-10-23');
		uniClass(old, 'Physics', '2026-10-27T09:00');

		const { entries } = calendarMonth(db, '2026-10', '2026-10-14');
		expect(entries['2026-10-20']).toMatchObject([{ kind: 'exam', title: 'Analysis', startTime: '10:00', endTime: null, room: 'H1', color: 'sky' }]);
		expect(entries['2026-10-23']).toMatchObject([{ kind: 'exam', title: 'Algorithms', startTime: null, room: null }]);
		expect(entries['2026-10-27']).toMatchObject([{ kind: 'exam', title: 'Physics', startTime: '09:00' }]);
	});

	it('Scenario: Entries within a day are ordered', () => {
		const current = semester('WS 26/27');
		todo('Evening', { day: '2026-10-20', start: '18:00' });
		uniClass(current, 'Exam class', '2026-10-20T10:00');
		todo('Submit essay', { day: '2026-10-20' });
		todo('Buy stamps', { day: '2026-10-20' });
		rule('Run', '2', '07:00');

		const { entries } = calendarMonth(db, '2026-10', '2026-10-14');
		expect(titles(entries['2026-10-20'])).toEqual(['Buy stamps', 'Submit essay', 'Run', 'Exam class', 'Evening']);
	});

	it('mutes days outside the month', () => {
		todo('Edge', { day: '2026-11-01' });
		todo('Edge before', { day: '2026-09-30' });
		rule('Gym', '1,4');
		const { entries, weeks } = calendarMonth(db, '2026-10', '2026-10-14');
		expect(weeks[0][0]).toBe('2026-09-28');
		expect(entries['2026-11-01'] ?? []).toEqual([]);
		expect(entries['2026-09-30'] ?? []).toEqual([]);
		expect(Object.keys(entries).every((d) => d.startsWith('2026-10'))).toBe(true);
	});
});
