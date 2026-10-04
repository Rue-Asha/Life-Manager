import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ClassInput, Id } from '$lib/types';
import { setTestNow } from './clock';
import { openDb } from './db';
import { setRevisedAt } from './todos';
import {
	archiveSemester,
	classWritable,
	countClassLinks,
	classCounts,
	classRules,
	classTodos,
	countOpenClassTodos,
	createClass,
	createSemester,
	deleteClass,
	deleteSemester,
	getClass,
	getUniAspectId,
	gradeSummary,
	listClassRefs,
	listDeadlines,
	listSemesters,
	renameSemester,
	semesterCounts,
	setClassNotes,
	setUniAspectId,
	todoWritable,
	unarchiveSemester,
	updateClass
} from './uni';

let db: DatabaseSync;
let health: Id;
let uni: Id;

function insert(sql: string, ...params: (string | number | null)[]): Id {
	return Number(db.prepare(sql).run(...params).lastInsertRowid);
}

function semester(name: string, archivedAt: string | null = null): Id {
	return insert('INSERT INTO semesters (name, archived_at, created_at) VALUES (?, ?, ?)', name, archivedAt, '2026-10-01');
}

function uniClass(semesterId: Id, name: string): Id {
	return insert(
		`INSERT INTO classes (semester_id, name, color, icon, created_at, updated_at) VALUES (?, ?, 'sky', 'book', 'c', 'c')`,
		semesterId,
		name
	);
}

function todo(classId: Id | null, status = 'todo', type: string | null = null, revisedAt: string | null = null): Id {
	return insert(
		'INSERT INTO todos (title, aspect_id, status, class_id, type, revised_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
		'T',
		uni,
		status,
		classId,
		type,
		revisedAt,
		't'
	);
}

function value<T>(r: { ok: true; value: T } | { ok: false; error: string }): T {
	if (!r.ok) throw new Error(r.error);
	return r.value;
}

beforeEach(() => {
	process.env.LM_TEST = '1';
	db = openDb(':memory:');
	const aspect = db.prepare("INSERT INTO aspects (name, color, icon, position, created_at) VALUES (?, 'sage', 'heart', ?, '')");
	health = Number(aspect.run('Health', 0).lastInsertRowid);
	uni = Number(aspect.run('Uni', 1).lastInsertRowid);
});

afterEach(() => setTestNow(null));

describe('uni aspect setting', () => {
	it('Scenario: Changing the Uni aspect clears class, type and revised date', () => {
		expect(setUniAspectId(db, uni)).toEqual({ ok: true, value: { unlinked: 0 } });
		const cls = uniClass(semester('WS'), 'Analysis');
		const a = todo(cls, 'todo', 'LEC', '2026-10-01');
		const b = todo(cls, 'done', 'EXC', '2026-09-30');
		insert(
			"INSERT INTO recurring_rules (title, aspect_id, weekdays, class_id, type, created_at) VALUES ('R', ?, '1', ?, 'LEC', 'r')",
			uni,
			cls
		);
		expect(countClassLinks(db)).toBe(3);

		expect(setUniAspectId(db, health)).toEqual({ ok: true, value: { unlinked: 3 } });
		expect(getUniAspectId(db)).toBe(health);
		expect(db.prepare('SELECT id, class_id, type, revised_at FROM todos ORDER BY id').all()).toEqual([
			{ id: a, class_id: null, type: null, revised_at: null },
			{ id: b, class_id: null, type: null, revised_at: null }
		]);
		expect(db.prepare('SELECT class_id, type FROM recurring_rules').all()).toEqual([{ class_id: null, type: null }]);
		expect(countClassLinks(db)).toBe(0);
	});

	it('reads as unset until chosen and rejects an unknown aspect', () => {
		expect(getUniAspectId(db)).toBeNull();
		expect(setUniAspectId(db, 999)).toEqual({ ok: false, error: 'not-found', field: 'aspectId' });
		expect(getUniAspectId(db)).toBeNull();
		db.prepare("INSERT INTO settings (key, value) VALUES ('uni_aspect_id', '999')").run();
		expect(getUniAspectId(db)).toBeNull();
	});

	it('keeps links when the same aspect is chosen again', () => {
		setUniAspectId(db, uni);
		todo(uniClass(semester('WS'), 'Analysis'), 'todo', 'LEC');
		expect(setUniAspectId(db, uni)).toEqual({ ok: true, value: { unlinked: 0 } });
		expect(countClassLinks(db)).toBe(1);
	});
});

describe('class refs, counts and writability', () => {
	it('lists class refs with their archived state', () => {
		const active = semester('SS');
		const old = semester('WS', '2026-09-01');
		const b = uniClass(active, 'Algorithms');
		const a = uniClass(old, 'Physics');
		expect(listClassRefs(db)).toEqual([
			{ id: b, name: 'Algorithms', color: 'sky', icon: 'book', semesterId: active, archived: false },
			{ id: a, name: 'Physics', color: 'sky', icon: 'book', semesterId: old, archived: true }
		]);
	});

	it('counts open class todos in active semesters only', () => {
		const active = uniClass(semester('SS'), 'Analysis');
		const archived = uniClass(semester('WS', '2026-09-01'), 'Physics');
		todo(active);
		todo(active, 'doing');
		todo(active, 'done');
		todo(archived);
		todo(null);
		expect(countOpenClassTodos(db)).toBe(2);
	});

	it('refuses writes to classes and todos of archived semesters', () => {
		const active = uniClass(semester('SS'), 'Analysis');
		const archived = uniClass(semester('WS', '2026-09-01'), 'Physics');
		const ok = { ok: true, value: undefined };
		const refused = { ok: false, error: 'archived', field: 'classId' };
		expect(classWritable(db, active)).toEqual(ok);
		expect(classWritable(db, archived)).toEqual(refused);
		expect(classWritable(db, 999)).toEqual({ ok: false, error: 'not-found', field: 'classId' });
		expect(todoWritable(db, todo(active))).toEqual(ok);
		expect(todoWritable(db, todo(null))).toEqual(ok);
		expect(todoWritable(db, todo(archived))).toEqual({ ok: false, error: 'archived' });
	});
});

describe('semesters', () => {
	it('Scenario: Empty semester name is rejected', () => {
		expect(createSemester(db, '')).toEqual({ ok: false, error: 'required', field: 'name' });
		expect(createSemester(db, '   ')).toEqual({ ok: false, error: 'required', field: 'name' });
		expect(db.prepare('SELECT count(*) AS n FROM semesters').get()).toEqual({ n: 0 });

		const ws = value(createSemester(db, 'WS 26/27'));
		expect(renameSemester(db, ws.id, ' \t')).toEqual({ ok: false, error: 'required', field: 'name' });
		expect(listSemesters(db).active.map((s) => s.name)).toEqual(['WS 26/27']);
	});

	it('Scenario: Duplicate semester names are allowed', () => {
		const a = value(createSemester(db, 'SS 27'));
		const b = value(createSemester(db, 'SS 27'));
		expect(a.id).not.toBe(b.id);
		expect(db.prepare('SELECT name FROM semesters ORDER BY id').all()).toEqual([{ name: 'SS 27' }, { name: 'SS 27' }]);
	});

	it('creates with a trimmed name, renames, and lists newest first', () => {
		setTestNow(new Date('2026-04-01T10:00:00Z'));
		const ss = value(createSemester(db, '  SS 26 '));
		expect(ss).toEqual({ id: ss.id, name: 'SS 26', archivedAt: null, createdAt: '2026-04-01T10:00:00.000Z' });
		setTestNow(new Date('2026-10-01T10:00:00Z'));
		const ws = value(createSemester(db, 'WS 26/27'));
		const tie = value(createSemester(db, 'Same instant'));

		expect(renameSemester(db, ws.id, 'Winter 26/27')).toEqual({ ok: true, value: { ...ws, name: 'Winter 26/27' } });
		expect(renameSemester(db, 999, 'X')).toEqual({ ok: false, error: 'not-found' });
		const { active, archived } = listSemesters(db);
		expect(active.map((s) => s.name)).toEqual(['Same instant', 'Winter 26/27', 'SS 26']);
		expect(active[0]).toMatchObject({ id: tie.id, classes: [], grades: { average: null, earnedEcts: 0 } });
		expect(archived).toEqual([]);
	});
});

describe('classes', () => {
	const base: ClassInput = { name: 'Analysis II', color: 'sky', icon: 'book' };

	it('Scenario: Class fields round-trip', () => {
		setTestNow(new Date('2026-10-01T10:00:00Z'));
		const ws = value(createSemester(db, 'WS'));
		const input: ClassInput = {
			name: ' Analysis II ',
			color: 'lagoon',
			icon: 'pen',
			lecturer: 'Prof. Weber',
			room: 'H 0104',
			ects: '7.5',
			links: [
				{ label: 'Moodle', url: 'https://moodle.example/course/12' },
				{ label: '', url: 'http://scripts.example/ana2.pdf' }
			],
			examAt: '2027-02-09T10:00',
			examRoom: 'Audimax',
			grade: '1.7'
		};
		const cls = value(createClass(db, ws.id, input));
		const expected = {
			id: cls.id,
			semesterId: ws.id,
			name: 'Analysis II',
			color: 'lagoon',
			icon: 'pen',
			notes: '',
			lecturer: 'Prof. Weber',
			room: 'H 0104',
			ects: 7.5,
			links: input.links,
			examAt: '2027-02-09T10:00',
			examRoom: 'Audimax',
			grade: '1.7',
			createdAt: '2026-10-01T10:00:00.000Z',
			updatedAt: '2026-10-01T10:00:00.000Z'
		};
		expect(cls).toEqual(expected);
		expect(getClass(db, cls.id)).toEqual({ ...expected, semester: ws });
		expect(getClass(db, 999)).toBeNull();
	});

	it('stores blank optional fields as null, accepts a date-only exam, and edits keep notes', () => {
		const ws = value(createSemester(db, 'WS'));
		const cls = value(
			createClass(db, ws.id, { ...base, lecturer: ' ', room: '', ects: '', examAt: '2027-02-09', examRoom: '', grade: '' })
		);
		expect(cls).toMatchObject({ lecturer: null, room: null, ects: null, links: [], examAt: '2027-02-09', examRoom: null, grade: null });

		setTestNow(new Date('2026-10-02T09:00:00Z'));
		value(setClassNotes(db, cls.id, '## Topics'));
		setTestNow(new Date('2026-10-03T09:00:00Z'));
		const edited = value(updateClass(db, cls.id, { ...base, name: 'Analysis III', ects: '0', grade: 'passed' }));
		expect(edited).toMatchObject({
			name: 'Analysis III',
			notes: '## Topics',
			ects: 0,
			grade: 'passed',
			examAt: null,
			createdAt: cls.createdAt,
			updatedAt: '2026-10-03T09:00:00.000Z'
		});
		expect(updateClass(db, 999, base)).toEqual({ ok: false, error: 'not-found', field: 'classId' });
		expect(setClassNotes(db, 999, 'x')).toEqual({ ok: false, error: 'not-found', field: 'classId' });
		expect(createClass(db, 999, base)).toEqual({ ok: false, error: 'not-found', field: 'semesterId' });
	});

	it('Scenario: Invalid class input is rejected', () => {
		const ws = value(createSemester(db, 'WS'));
		const cls = value(createClass(db, ws.id, base));
		const cases: [Partial<ClassInput>, string, string][] = [
			[{ name: '  ' }, 'required', 'name'],
			[{ color: 'neon' }, 'invalid', 'color'],
			[{ icon: 'rocket-ship' }, 'invalid', 'icon'],
			[{ ects: '-1' }, 'invalid', 'ects'],
			[{ ects: 'abc' }, 'invalid', 'ects'],
			[{ ects: '2.3' }, 'invalid', 'ects'],
			[{ links: [{ label: 'Files', url: 'ftp://x' }] }, 'invalid', 'links'],
			[{ links: [{ label: 'No url', url: '' }] }, 'invalid', 'links'],
			[{ examAt: 'next week' }, 'invalid', 'examAt'],
			[{ examAt: '2027-02-30' }, 'invalid', 'examAt'],
			[{ examAt: '2027-02-32' }, 'invalid', 'examAt'],
			[{ examAt: '2027-02-09T24:00' }, 'invalid', 'examAt'],
			[{ grade: '2.5' }, 'invalid', 'grade']
		];
		for (const [patch, error, field] of cases) {
			expect(createClass(db, ws.id, { ...base, ...patch }), field).toEqual({ ok: false, error, field });
			expect(updateClass(db, cls.id, { ...base, ...patch }), field).toEqual({ ok: false, error, field });
		}
		expect(db.prepare('SELECT count(*) AS n FROM classes').get()).toEqual({ n: 1 });
		expect(getClass(db, cls.id)).toEqual({ ...cls, semester: ws });
	});

	it('Scenario: Empty link rows are dropped', () => {
		const ws = value(createSemester(db, 'WS'));
		const cls = value(
			createClass(db, ws.id, {
				...base,
				links: [
					{ label: 'Moodle', url: 'https://moodle.example' },
					{ label: ' ', url: '' }
				]
			})
		);
		expect(getClass(db, cls.id)!.links).toEqual([{ label: 'Moodle', url: 'https://moodle.example' }]);
	});

	it('Scenario: Deleting a class removes its todos and rules', () => {
		const ws = value(createSemester(db, 'WS'));
		const ana = value(createClass(db, ws.id, base)).id;
		const other = value(createClass(db, ws.id, { ...base, name: 'Physics' })).id;
		const open = todo(ana, 'todo', 'LEC');
		todo(ana, 'done', 'EXC');
		insert('INSERT INTO checklist_items (todo_id, text, position) VALUES (?, ?, 0)', open, 'Step');
		insert(
			"INSERT INTO recurring_rules (title, aspect_id, weekdays, class_id, type, created_at) VALUES ('R', ?, '1', ?, 'LEC', 'r')",
			uni,
			ana
		);
		const kept = todo(other, 'todo', 'OTH');
		todo(null);

		expect(classCounts(db, ana)).toEqual({ todos: 2 });
		expect(deleteClass(db, ana)).toEqual({ ok: true, value: { todos: 2 } });
		expect(getClass(db, ana)).toBeNull();
		expect(db.prepare('SELECT id, class_id AS classId FROM todos ORDER BY id').all()).toEqual([
			{ id: kept, classId: other },
			{ id: kept + 1, classId: null }
		]);
		expect(db.prepare('SELECT count(*) AS n FROM checklist_items').get()).toEqual({ n: 0 });
		expect(db.prepare('SELECT count(*) AS n FROM recurring_rules').get()).toEqual({ n: 0 });
		expect(deleteClass(db, ana)).toEqual({ ok: false, error: 'not-found' });
	});
});

describe('archive and delete', () => {
	const base: ClassInput = { name: 'Analysis II', color: 'sky', icon: 'book' };

	function sprint(state: string): Id {
		return insert('INSERT INTO sprints (week_start, state) VALUES (?, ?)', state === 'active' ? '2026-09-28' : null, state);
	}

	const row = (id: Id) =>
		db.prepare('SELECT status, completed_at AS completedAt FROM todos WHERE id = ?').get(id) as {
			status: string;
			completedAt: string | null;
		};

	it('Scenario: Archiving completes open todos', () => {
		const ws = value(createSemester(db, 'WS'));
		const cls = value(createClass(db, ws.id, base)).id;
		const inSprint = todo(cls, 'doing');
		db.prepare('UPDATE todos SET sprint_id = ? WHERE id = ?').run(sprint('active'), inSprint);
		const inBacklog = todo(cls);
		const done = todo(cls, 'done');
		db.prepare("UPDATE todos SET completed_at = '2026-09-01T08:00:00.000Z' WHERE id = ?").run(done);
		const unlinked = todo(null);

		expect(semesterCounts(db, ws.id)).toEqual({ classes: 1, todos: 3, openTodos: 2 });
		setTestNow(new Date('2026-10-04T12:00:00Z'));
		expect(archiveSemester(db, ws.id)).toEqual({ ok: true, value: { completed: 2 } });

		const at = '2026-10-04T12:00:00.000Z';
		expect(row(inSprint)).toEqual({ status: 'done', completedAt: at });
		expect(row(inBacklog)).toEqual({ status: 'done', completedAt: at });
		expect(row(done)).toEqual({ status: 'done', completedAt: '2026-09-01T08:00:00.000Z' });
		expect(row(unlinked)).toEqual({ status: 'todo', completedAt: null });
		expect(listSemesters(db).archived).toMatchObject([{ id: ws.id, archivedAt: at }]);
		expect(semesterCounts(db, ws.id)).toEqual({ classes: 1, todos: 3, openTodos: 0 });
		expect(archiveSemester(db, 999)).toEqual({ ok: false, error: 'not-found' });
	});

	it('Scenario: Archived semester refuses writes', () => {
		const ws = value(createSemester(db, 'WS'));
		const cls = value(createClass(db, ws.id, { ...base, lecturer: 'Weber' }));
		const t = todo(cls.id, 'todo', 'LEC');
		value(archiveSemester(db, ws.id));
		const archived = getSemester();

		expect(renameSemester(db, ws.id, 'Renamed')).toEqual({ ok: false, error: 'archived' });
		expect(createClass(db, ws.id, { ...base, name: 'New' })).toEqual({ ok: false, error: 'archived', field: 'semesterId' });
		expect(updateClass(db, cls.id, { ...base, name: 'Edited' })).toEqual({ ok: false, error: 'archived', field: 'classId' });
		expect(setClassNotes(db, cls.id, 'Notes')).toEqual({ ok: false, error: 'archived', field: 'classId' });
		expect(setRevisedAt(db, t, '2026-10-04')).toMatchObject({ ok: false, error: 'archived' });
		expect(todoWritable(db, t)).toEqual({ ok: false, error: 'archived' });

		expect(getSemester()).toEqual(archived);
		expect(getClass(db, cls.id)).toEqual({ ...cls, semester: archived });
		expect(db.prepare('SELECT count(*) AS n FROM classes').get()).toEqual({ n: 1 });
		expect(db.prepare('SELECT revised_at AS r FROM todos WHERE id = ?').get(t)).toEqual({ r: null });

		function getSemester() {
			return listSemesters(db).archived.map(({ classes: _c, grades: _g, ...s }) => s)[0];
		}
	});

	it('Scenario: Unarchive lifts read-only', () => {
		const ws = value(createSemester(db, 'WS'));
		const cls = value(createClass(db, ws.id, base)).id;
		const a = todo(cls);
		const b = todo(cls, 'doing');
		value(archiveSemester(db, ws.id));

		expect(unarchiveSemester(db, ws.id)).toEqual({ ok: true, value: { ...ws, archivedAt: null } });
		expect(listSemesters(db).active.map((s) => s.id)).toEqual([ws.id]);
		expect(updateClass(db, cls, { ...base, name: 'Analysis III' })).toMatchObject({ ok: true, value: { name: 'Analysis III' } });
		expect(renameSemester(db, ws.id, 'WS 26/27')).toMatchObject({ ok: true });
		expect([row(a).status, row(b).status]).toEqual(['done', 'done']);
		expect(unarchiveSemester(db, 999)).toEqual({ ok: false, error: 'not-found' });
	});

	it('Scenario: Deleting a semester removes everything belonging to it', () => {
		const ws = value(createSemester(db, 'WS'));
		const ana = value(createClass(db, ws.id, base)).id;
		const phy = value(createClass(db, ws.id, { ...base, name: 'Physics' })).id;
		const open = todo(ana, 'todo', 'LEC');
		const done = todo(phy, 'done', 'EXC');
		insert('INSERT INTO checklist_items (todo_id, text, position) VALUES (?, ?, 0)', open, 'Open step');
		insert('INSERT INTO checklist_items (todo_id, text, position) VALUES (?, ?, 0)', done, 'Done step');
		insert(
			"INSERT INTO recurring_rules (title, aspect_id, weekdays, class_id, type, created_at) VALUES ('R', ?, '1', ?, 'LEC', 'r')",
			uni,
			ana
		);
		const ss = value(createSemester(db, 'SS'));
		const keptClass = value(createClass(db, ss.id, base)).id;
		const kept = todo(keptClass);
		const keptItem = insert('INSERT INTO checklist_items (todo_id, text, position) VALUES (?, ?, 0)', kept, 'Kept');

		expect(semesterCounts(db, ws.id)).toEqual({ classes: 2, todos: 2, openTodos: 1 });
		expect(deleteSemester(db, ws.id)).toEqual({ ok: true, value: { classes: 2, todos: 2 } });

		expect(db.prepare('SELECT id FROM semesters').all()).toEqual([{ id: ss.id }]);
		expect(db.prepare('SELECT id FROM classes').all()).toEqual([{ id: keptClass }]);
		expect(db.prepare('SELECT id FROM todos').all()).toEqual([{ id: kept }]);
		expect(db.prepare('SELECT id FROM checklist_items').all()).toEqual([{ id: keptItem }]);
		expect(db.prepare('SELECT count(*) AS n FROM recurring_rules').get()).toEqual({ n: 0 });
		expect(deleteSemester(db, ws.id)).toEqual({ ok: false, error: 'not-found' });
		expect(semesterCounts(db, ws.id)).toEqual({ classes: 0, todos: 0, openTodos: 0 });
	});
});

describe('class summaries, todos and rules', () => {
	const base: ClassInput = { name: 'Analysis II', color: 'sky', icon: 'book' };

	function dated(classId: Id, status: string, due: string | null): Id {
		const id = todo(classId, status);
		db.prepare('UPDATE todos SET due_date = ? WHERE id = ?').run(due, id);
		return id;
	}

	it('Scenario: Card summary counts open todos and the next due date', () => {
		const ws = value(createSemester(db, 'WS'));
		const cls = value(createClass(db, ws.id, { ...base, lecturer: 'Weber', ects: '5' }));
		value(setClassNotes(db, cls.id, 'Long notes'));
		const empty = value(createClass(db, ws.id, { ...base, name: 'Physics' }));
		dated(cls.id, 'done', '2026-10-03');
		dated(cls.id, 'todo', null);
		dated(cls.id, 'doing', '2026-10-09');
		dated(cls.id, 'todo', '2026-10-07');

		const [view] = listSemesters(db).active;
		expect(view.classes.map((c) => c.id)).toEqual([cls.id, empty.id]);
		const { notes: _notes, semester: _semester, ...summary } = getClass(db, cls.id)!;
		expect(view.classes[0]).toEqual({ ...summary, openTodos: 3, nextDue: '2026-10-07' });
		expect(view.classes[0]).not.toHaveProperty('notes');
		expect(view.classes[1]).toMatchObject({ name: 'Physics', openTodos: 0, nextDue: null });
	});

	it('lists classes under their own semester, archived ones too', () => {
		const ws = value(createSemester(db, 'WS'));
		const ss = value(createSemester(db, 'SS'));
		const a = value(createClass(db, ws.id, base)).id;
		const b = value(createClass(db, ss.id, base)).id;
		value(archiveSemester(db, ws.id));
		const { active, archived } = listSemesters(db);
		expect(active.map((s) => s.classes.map((c) => c.id))).toEqual([[b]]);
		expect(archived.map((s) => s.classes.map((c) => c.id))).toEqual([[a]]);
	});

	it('Scenario: Class todos are grouped Open, Planned, Done', () => {
		const ws = value(createSemester(db, 'WS'));
		const cls = value(createClass(db, ws.id, base)).id;
		const active = insert("INSERT INTO sprints (week_start, state) VALUES ('2026-09-28', 'active')");
		const planning = insert("INSERT INTO sprints (week_start, state) VALUES (NULL, 'planning')");
		const backlog = todo(cls);
		const inActive = todo(cls, 'doing');
		const inPlanning = todo(cls);
		db.prepare('UPDATE todos SET sprint_id = ? WHERE id = ?').run(active, inActive);
		db.prepare('UPDATE todos SET sprint_id = ? WHERE id = ?').run(planning, inPlanning);
		const earlier = todo(cls, 'done');
		const later = todo(cls, 'done');
		db.prepare("UPDATE todos SET completed_at = '2026-10-01T08:00:00.000Z' WHERE id = ?").run(earlier);
		db.prepare("UPDATE todos SET completed_at = '2026-10-03T08:00:00.000Z' WHERE id = ?").run(later);
		todo(null);
		todo(value(createClass(db, ws.id, { ...base, name: 'Other' })).id);

		const groups = classTodos(db, cls);
		expect(groups.open.map((t) => t.id)).toEqual([backlog]);
		expect(groups.planned.map((t) => t.id).sort()).toEqual([inActive, inPlanning].sort());
		expect(groups.done.map((t) => t.id)).toEqual([later, earlier]);
		expect(groups.open[0]).toMatchObject({ classId: cls });
	});

	it('lists the rules of a class only', () => {
		const ws = value(createSemester(db, 'WS'));
		const cls = value(createClass(db, ws.id, base)).id;
		const other = value(createClass(db, ws.id, { ...base, name: 'Other' })).id;
		const rule = (title: string, classId: Id | null) =>
			insert(
				"INSERT INTO recurring_rules (title, aspect_id, weekdays, class_id, type, created_at) VALUES (?, ?, '1,3', ?, ?, 'r')",
				title,
				uni,
				classId,
				classId === null ? null : 'LEC'
			);
		const review = rule('Lecture review', cls);
		rule('Other rule', other);
		rule('Unlinked', null);
		expect(classRules(db, cls)).toMatchObject([{ id: review, title: 'Lecture review', classId: cls, type: 'LEC', weekdays: [1, 3] }]);
	});
});

describe('grades and deadlines', () => {
	const base: ClassInput = { name: 'Analysis II', color: 'sky', icon: 'book' };

	it('Scenario: Weighted average matches a hand calculation', () => {
		const ws = value(createSemester(db, 'WS'));
		for (const [grade, ects] of [
			['1.3', '5'],
			['2.7', '10'],
			['passed', '5'],
			['5.0', '5'],
			['1.0', '']
		]) {
			value(createClass(db, ws.id, { ...base, grade, ects }));
		}
		value(createClass(db, ws.id, { ...base, ects: '5' }));

		const { active, overall } = listSemesters(db);
		expect(active[0].grades.average).toBeCloseTo((1.3 * 5 + 2.7 * 10) / 15, 10);
		expect(active[0].grades.earnedEcts).toBe(20);
		expect(overall).toEqual(active[0].grades);
	});

	it('Scenario: Overall figures include archived semesters', () => {
		const ws = value(createSemester(db, 'WS'));
		const ss = value(createSemester(db, 'SS'));
		value(createClass(db, ss.id, { ...base, grade: '1.0', ects: '5' }));
		value(createClass(db, ws.id, { ...base, grade: '3.0', ects: '5' }));
		value(archiveSemester(db, ws.id));

		const { active, archived, overall } = listSemesters(db);
		expect(active[0].grades).toEqual({ average: 1, earnedEcts: 5 });
		expect(archived[0].grades).toEqual({ average: 3, earnedEcts: 5 });
		expect(overall).toEqual({ average: 2, earnedEcts: 10 });
	});

	it('has no average without a counting grade', () => {
		expect(gradeSummary([])).toEqual({ average: null, earnedEcts: 0 });
		expect(
			gradeSummary([
				{ grade: 'passed', ects: 5 },
				{ grade: '5.0', ects: 5 },
				{ grade: '2.0', ects: null },
				{ grade: null, ects: 5 }
			])
		).toEqual({ average: null, earnedEcts: 5 });
	});

	function dated(classId: Id | null, title: string, status: string, due: string | null, type = 'EXC'): Id {
		return insert(
			'INSERT INTO todos (title, aspect_id, status, class_id, type, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
			title,
			uni,
			status,
			classId,
			type,
			due,
			't'
		);
	}

	it('Scenario: Deadlines list todos and exams in date order', () => {
		const ws = value(createSemester(db, 'WS'));
		const ana = value(createClass(db, ws.id, { ...base, examAt: '2026-10-08T10:00' })).id;
		const overdue = dated(ana, 'Sheet 3', 'todo', '2026-10-03');
		const soon = dated(ana, 'Sheet 4', 'doing', '2026-10-06', 'LEC');
		dated(ana, 'Undated', 'todo', null);
		dated(ana, 'Done', 'done', '2026-10-05');
		dated(null, 'Unlinked', 'todo', '2026-10-05');
		const old = value(createSemester(db, 'SS'));
		dated(value(createClass(db, old.id, { ...base, examAt: '2026-10-05' })).id, 'Archived todo', 'todo', '2026-10-05');
		value(archiveSemester(db, old.id));

		expect(listDeadlines(db, '2026-10-04')).toEqual([
			{ kind: 'todo', date: '2026-10-03', title: 'Sheet 3', classId: ana, todoId: overdue, type: 'EXC', overdue: true },
			{ kind: 'todo', date: '2026-10-06', title: 'Sheet 4', classId: ana, todoId: soon, type: 'LEC', overdue: false },
			{ kind: 'exam', date: '2026-10-08', title: 'Exam', classId: ana, todoId: null, type: null, overdue: false }
		]);
	});

	it('lists exams from today on, after todos on the same date', () => {
		const ws = value(createSemester(db, 'WS'));
		const late = value(createClass(db, ws.id, { ...base, examAt: '2026-10-04T14:00' })).id;
		const early = value(createClass(db, ws.id, { ...base, examAt: '2026-10-04T09:00' })).id;
		value(createClass(db, ws.id, { ...base, examAt: '2026-10-03' }));
		const t = dated(late, 'Last revision', 'todo', '2026-10-04');

		expect(listDeadlines(db, '2026-10-04').map((d) => [d.kind, d.classId, d.todoId])).toEqual([
			['todo', late, t],
			['exam', early, null],
			['exam', late, null]
		]);
	});
});
