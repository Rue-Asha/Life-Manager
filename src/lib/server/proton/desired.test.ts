import type { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Id, IsoDate } from '$lib/types';
import { openDb } from '../db';
import { listSprintTodos } from '../sprints';
import { desiredState } from './desired';
import type { DesiredItem } from './types';

const TODAY: IsoDate = '2026-10-14';

let db: DatabaseSync;
let aspect: Id;

function insert(sql: string, ...params: (string | number | null)[]): Id {
	return Number(db.prepare(sql).run(...params).lastInsertRowid);
}

function sprint(state: 'planning' | 'active' | 'closed', weekStart: IsoDate | null): Id {
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
		notes?: string;
		classId?: Id | null;
	} = {}
): Id {
	return insert(
		`INSERT INTO todos (title, aspect_id, notes, due_date, sprint_id, status, day, start_time, end_time, recurring, rule_id, class_id, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '')`,
		title,
		aspect,
		opts.notes ?? '',
		opts.due ?? null,
		opts.sprintId ?? null,
		opts.status ?? 'todo',
		opts.day ?? null,
		opts.start ?? null,
		opts.end ?? null,
		opts.ruleId ? 1 : 0,
		opts.ruleId ?? null,
		opts.classId ?? null
	);
}

function rule(
	title: string,
	weekdays: string,
	start: string | null = null,
	end: string | null = null,
	classId: Id | null = null
): Id {
	return insert(
		`INSERT INTO recurring_rules (title, aspect_id, weekdays, notes, start_time, end_time, class_id, type, created_at)
		 VALUES (?, ?, ?, '', ?, ?, ?, ?, '')`,
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

function uniClass(semesterId: Id, name: string, opts: { room?: string | null; examAt?: string | null; examRoom?: string | null } = {}): Id {
	return insert(
		`INSERT INTO classes (semester_id, name, color, icon, room, exam_at, exam_room, created_at, updated_at)
		 VALUES (?, ?, 'sky', 'book', ?, ?, ?, '', '')`,
		semesterId,
		name,
		opts.room ?? null,
		opts.examAt ?? null,
		opts.examRoom ?? null
	);
}

function setUni(aspectId: Id): void {
	db.prepare("INSERT INTO settings (key, value) VALUES ('uni_aspect_id', ?)").run(String(aspectId));
}

function item(items: DesiredItem[], key: string): DesiredItem {
	const found = items.find((i) => i.key === key);
	if (!found) throw new Error(`no item ${key} in ${items.map((i) => i.key).join(', ')}`);
	return found;
}

beforeEach(() => {
	db = openDb(':memory:');
	aspect = insert("INSERT INTO aspects (name, color, icon, position, created_at) VALUES ('Health', 'sage', 'heart', 0, '')");
});

describe('desiredState: todos', () => {
	it('Scenario: Todo with a full slot becomes a timed event', () => {
		const id = todo('Dentist', { day: '2026-10-21', start: '18:00', end: '19:30' });
		const items = desiredState(db, TODAY);
		expect(items).toEqual([
			{
				key: `todo:${id}`,
				aspectId: aspect,
				label: 'Dentist',
				spec: {
					title: 'Dentist',
					description: '',
					location: '',
					date: '2026-10-21',
					start: '18:00',
					end: '19:30',
					durationMin: null,
					rrule: null,
					exdates: []
				}
			}
		]);
	});

	it('Scenario: Start-only slot becomes a 30-minute event', () => {
		const id = todo('Call', { day: '2026-10-21', start: '09:15' });
		expect(item(desiredState(db, TODAY), `todo:${id}`).spec).toMatchObject({ start: '09:15', end: null, durationMin: 30 });
	});

	it('Scenario: Todo without a slot becomes an all-day event', () => {
		const id = todo('Taxes', { day: '2026-10-21' });
		expect(item(desiredState(db, TODAY), `todo:${id}`).spec).toMatchObject({
			date: '2026-10-21',
			start: null,
			end: null,
			durationMin: null
		});
	});

	it('Scenario: Event carries notes and the class room', () => {
		const uni = insert("INSERT INTO aspects (name, color, icon, position, created_at) VALUES ('Uni', 'sky', 'book', 1, '')");
		setUni(uni);
		const cls = uniClass(semester('WS'), 'Algebra', { room: 'HS 3' });
		const plain = todo('Notes only', { day: '2026-10-21', notes: 'bring laptop' });
		const linked = todo('Exercise sheet', { day: '2026-10-22', classId: cls, notes: 'sheet 4' });
		const items = desiredState(db, TODAY);
		expect(item(items, `todo:${plain}`).spec).toMatchObject({ description: 'bring laptop', location: '' });
		expect(item(items, `todo:${linked}`).spec).toMatchObject({ description: 'sheet 4', location: 'HS 3' });
	});

	it('Scenario: Due date alone creates no event', () => {
		const active = sprint('active', '2026-10-12');
		const id = todo('Due only', { due: '2026-10-16', sprintId: active });
		expect(listSprintTodos(db, active).find((t) => t.id === id)?.dueDay).toBe('2026-10-16');
		expect(desiredState(db, TODAY).filter((i) => i.key === `todo:${id}`)).toEqual([]);
	});

	it('Scenario: Backlog and draft-sprint todos with a day get events', () => {
		const planning = sprint('planning', null);
		const backlog = todo('Backlog item', { day: '2026-10-25' });
		const draft = todo('Draft item', { day: '2026-10-26', sprintId: planning });
		const keys = desiredState(db, TODAY).map((i) => i.key);
		expect(keys).toContain(`todo:${backlog}`);
		expect(keys).toContain(`todo:${draft}`);
	});

	it('Scenario: Done todo is titled with a check mark', () => {
		const id = todo('Taxes', { day: '2026-10-21', status: 'done' });
		const done = item(desiredState(db, TODAY), `todo:${id}`);
		expect(done.spec.title).toBe('✓ Taxes');
		expect(done.label).toBe('Taxes');
	});
});
