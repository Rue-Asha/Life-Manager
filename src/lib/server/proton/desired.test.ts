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

	it('Scenario: Due date alone creates no planned-todo event', () => {
		const active = sprint('active', '2026-10-12');
		const id = todo('Due only', { due: '2026-10-16', sprintId: active });
		expect(listSprintTodos(db, active).find((t) => t.id === id)?.dueDay).toBe('2026-10-16');
		const items = desiredState(db, TODAY);
		expect(items.filter((i) => i.key === `todo:${id}`)).toEqual([]);
		expect(item(items, `due:${aspect}:2026-10-16`).spec.title).toBe('Due: Due only');
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
		const open = todo('Rent', { day: '2026-10-21' });
		const items = desiredState(db, TODAY);
		expect(item(items, `todo:${id}`).spec.title).toBe('✓ Taxes');
		expect(item(items, `todo:${id}`).label).toBe('Taxes');
		expect(item(items, `todo:${open}`).spec.title).toBe('Rent');
	});
});

describe('desiredState: rule series', () => {
	it('Scenario: Rule series starts the week after the active sprint', () => {
		sprint('active', '2026-10-19');
		const gym = rule('Gym', '2,4', '07:00', '08:00');
		const items = desiredState(db, TODAY);
		expect(item(items, `rule:${gym}`)).toEqual({
			key: `rule:${gym}`,
			aspectId: aspect,
			label: 'Gym',
			spec: {
				title: 'Gym',
				description: '',
				location: '',
				date: '2026-10-27',
				start: '07:00',
				end: '08:00',
				durationMin: null,
				rrule: 'FREQ=WEEKLY;BYDAY=TU,TH',
				exdates: []
			}
		});
	});

	it('Scenario: Series start lands on a rule weekday', () => {
		const mon = rule('Standup', '1');
		const wed = rule('Midweek', '3');
		const items = desiredState(db, '2026-10-21');
		expect(item(items, `rule:${mon}`).spec).toMatchObject({ date: '2026-10-26', rrule: 'FREQ=WEEKLY;BYDAY=MO' });
		expect(item(items, `rule:${wed}`).spec).toMatchObject({ date: '2026-10-21', rrule: 'FREQ=WEEKLY;BYDAY=WE' });
	});

	it('Series with an active sprint start in the next week, weekdays in week order', () => {
		sprint('active', '2026-10-12');
		const tueThu = rule('Seminar', '4,2', '10:00');
		const sun = rule('Review', '7');
		const items = desiredState(db, TODAY);
		expect(item(items, `rule:${tueThu}`).spec).toMatchObject({ date: '2026-10-20', rrule: 'FREQ=WEEKLY;BYDAY=TU,TH', durationMin: 30 });
		expect(item(items, `rule:${sun}`).spec).toMatchObject({ date: '2026-10-25', rrule: 'FREQ=WEEKLY;BYDAY=SU' });
	});

	it('Scenario: Series start without an active sprint is the first rule weekday on or after today', () => {
		const wed = rule('Midweek', '3');
		const thu = rule('Later', '4');
		const items = desiredState(db, TODAY);
		expect(item(items, `rule:${wed}`).spec.date).toBe('2026-10-14');
		expect(item(items, `rule:${thu}`).spec.date).toBe('2026-10-15');
	});

	it('Scenario: Rule without a slot is an all-day series', () => {
		sprint('active', '2026-10-12');
		const id = rule('Water plants', '5');
		const startOnly = rule('Call home', '5', '19:00');
		const items = desiredState(db, TODAY);
		expect(item(items, `rule:${id}`).spec).toMatchObject({ start: null, end: null, durationMin: null });
		expect(item(items, `rule:${startOnly}`).spec).toMatchObject({ start: '19:00', end: null, durationMin: 30 });
	});

	it('Scenario: Rules of archived classes have no series', () => {
		const uni = insert("INSERT INTO aspects (name, color, icon, position, created_at) VALUES ('Uni', 'sky', 'book', 1, '')");
		setUni(uni);
		const cls = uniClass(semester('SS', '2026-09-30'), 'Old class', { room: 'HS 1' });
		const live = uniClass(semester('WS'), 'Live class', { room: 'HS 2' });
		const archived = rule('Old lecture', '2', '08:00', null, cls);
		const current = rule('Live lecture', '2', '08:00', null, live);
		const items = desiredState(db, TODAY);
		expect(items.map((i) => i.key)).not.toContain(`rule:${archived}`);
		expect(item(items, `rule:${current}`).spec.location).toBe('HS 2');
	});

	it('Scenario: Series excludes days with a real instance', () => {
		const active = sprint('active', '2026-10-12');
		const gym = rule('Gym', '1,4');
		const other = rule('Other', '1');
		const early = rule('Early', '1');
		todo('Early', { day: '2026-10-12', sprintId: active, ruleId: early });
		todo('Gym', { day: '2026-10-12', sprintId: active, ruleId: gym });
		todo('Gym', { day: '2026-10-22', sprintId: active, ruleId: gym });
		todo('Gym', { day: '2026-10-19', sprintId: active, ruleId: gym });
		todo('Gym off day', { day: '2026-10-20', sprintId: active, ruleId: gym });
		todo('Other', { day: '2026-10-26', ruleId: other });
		const items = desiredState(db, TODAY);
		expect(item(items, `rule:${gym}`).spec).toMatchObject({ date: '2026-10-19', exdates: ['2026-10-19', '2026-10-22'] });
		expect(item(items, `rule:${other}`).spec).toMatchObject({ date: '2026-10-19', exdates: ['2026-10-26'] });
		expect(item(items, `rule:${early}`).spec).toMatchObject({ date: '2026-10-19', exdates: [] });
	});
});

describe('desiredState: exams and window', () => {
	let uni: Id;

	beforeEach(() => {
		uni = insert("INSERT INTO aspects (name, color, icon, position, created_at) VALUES ('Uni', 'sky', 'book', 1, '')");
	});

	function synced(key: string): void {
		db.prepare("INSERT INTO proton_items (key, label, calendar_id, event_ref, hash, updated_at) VALUES (?, 'x', 'cal', 'cal/ev', 'h', '')").run(key);
	}

	it('Scenario: Exam with a time becomes a two-hour event', () => {
		setUni(uni);
		const cls = uniClass(semester('WS'), 'Algebra', { examAt: '2026-11-03T09:30', examRoom: 'HS 7' });
		expect(item(desiredState(db, TODAY), `exam:${cls}`)).toEqual({
			key: `exam:${cls}`,
			aspectId: uni,
			label: 'Exam · Algebra',
			spec: {
				title: 'Exam · Algebra',
				description: '',
				location: 'HS 7',
				date: '2026-11-03',
				start: '09:30',
				end: null,
				durationMin: 120,
				rrule: null,
				exdates: []
			}
		});
	});

	it('Scenario: Date-only exam becomes an all-day event', () => {
		setUni(uni);
		const cls = uniClass(semester('WS'), 'Logic', { examAt: '2026-11-04' });
		expect(item(desiredState(db, TODAY), `exam:${cls}`).spec).toMatchObject({
			date: '2026-11-04',
			start: null,
			end: null,
			durationMin: null,
			location: ''
		});
	});

	it('Scenario: Exams need a Uni aspect', () => {
		const cls = uniClass(semester('WS'), 'Logic', { examAt: '2026-11-04' });
		expect(desiredState(db, TODAY).map((i) => i.key)).not.toContain(`exam:${cls}`);
	});

	it('Scenario: Archived-semester exams are synced', () => {
		setUni(uni);
		const cls = uniClass(semester('SS', '2026-09-30'), 'Old', { examAt: '2026-11-05' });
		expect(desiredState(db, TODAY).map((i) => i.key)).toContain(`exam:${cls}`);
	});

	it('Scenario: Desired state starts today', () => {
		setUni(uni);
		const past = todo('Past', { day: '2026-10-13' });
		const now = todo('Today', { day: TODAY });
		const pastExam = uniClass(semester('WS'), 'Past exam', { examAt: '2026-10-13T10:00' });
		const todayExam = uniClass(semester('WS2'), 'Today exam', { examAt: '2026-10-14' });
		const keys = desiredState(db, TODAY).map((i) => i.key);
		expect(keys).toContain(`todo:${now}`);
		expect(keys).toContain(`exam:${todayExam}`);
		expect(keys).not.toContain(`todo:${past}`);
		expect(keys).not.toContain(`exam:${pastExam}`);
	});

	it('Scenario: Past synced items stay in the desired state', () => {
		setUni(uni);
		const doneBefore = todo('Done before', { day: '2026-10-10', status: 'done' });
		const neverSynced = todo('Never synced', { day: '2026-10-11' });
		const pendingRow = todo('Row without event', { day: '2026-10-12' });
		const exam = uniClass(semester('WS'), 'Past exam', { examAt: '2026-10-09' });
		synced(`todo:${doneBefore}`);
		synced(`exam:${exam}`);
		db.prepare("INSERT INTO proton_items (key, label, updated_at) VALUES (?, 'x', '')").run(`todo:${pendingRow}`);
		const items = desiredState(db, TODAY);
		expect(item(items, `todo:${doneBefore}`).spec.title).toBe('✓ Done before');
		expect(items.map((i) => i.key)).toContain(`exam:${exam}`);
		expect(items.map((i) => i.key)).not.toContain(`todo:${neverSynced}`);
		expect(items.map((i) => i.key)).not.toContain(`todo:${pendingRow}`);
	});
});

describe('desiredState: due bundles', () => {
	const allDay = { location: '', start: null, end: null, durationMin: null, rrule: null, exdates: [] };

	it('Scenario: Open due todos become one all-day bundle per aspect and day', () => {
		const other = insert("INSERT INTO aspects (name, color, icon, position, created_at) VALUES ('Work', 'sky', 'book', 1, '')");
		const active = sprint('active', '2026-10-12');
		todo('Backlog due', { due: '2026-10-16' });
		todo('Sprint due', { due: '2026-10-16', sprintId: active });
		const planned = todo('Planned due', { due: '2026-10-16', day: '2026-10-15', sprintId: active });
		todo('Done due', { due: '2026-10-16', status: 'done' });
		todo('Yesterday', { due: '2026-10-13' });
		db.prepare("INSERT INTO todos (title, aspect_id, due_date, status, created_at) VALUES ('Work due', ?, '2026-10-16', 'todo', '')").run(other);
		const items = desiredState(db, TODAY);
		expect(items.filter((i) => i.key.startsWith('due:')).map((i) => i.key)).toEqual([
			`due:${aspect}:2026-10-16`,
			`due:${other}:2026-10-16`
		]);
		const bundle = item(items, `due:${aspect}:2026-10-16`);
		expect(bundle).toMatchObject({ aspectId: aspect, label: 'Due: Backlog due · Planned due · Sprint due' });
		expect(bundle.spec).toMatchObject({ ...allDay, date: '2026-10-16' });
		expect(item(items, `due:${other}:2026-10-16`).spec.title).toBe('Due: Work due');
		expect(item(items, `todo:${planned}`).spec.date).toBe('2026-10-15');
	});

	it('Scenario: Bundle title and description', () => {
		const d = '2026-10-20';
		todo('only', { due: d });
		expect(item(desiredState(db, TODAY), `due:${aspect}:${d}`).spec).toMatchObject({ title: 'Due: only', description: 'only' });

		const e = '2026-10-21';
		todo('banana', { due: e });
		todo('Cherry', { due: e });
		todo('apple', { due: e });
		expect(item(desiredState(db, TODAY), `due:${aspect}:${e}`).spec.title).toBe('Due: apple · banana · Cherry');

		const f = '2026-10-22';
		const long = 'x'.repeat(200);
		for (const t of ['d4', 'a1', 'c3', long]) todo(t, { due: f });
		const spec = item(desiredState(db, TODAY), `due:${aspect}:${f}`).spec;
		expect(spec.title).toBe('Due (4): a1 · c3 · d4 …');
		expect(spec.description).toBe(['a1', 'c3', 'd4', long].join('\n'));
		expect(spec).toMatchObject({ ...allDay });

		const g = '2026-10-23';
		todo(long, { due: g });
		expect(item(desiredState(db, TODAY), `due:${aspect}:${g}`).spec.title).toBe(`Due: ${long}`);
	});
});
