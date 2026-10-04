import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ClassInput, Id } from '$lib/types';
import { setTestNow } from './clock';
import { openDb } from './db';
import {
	classWritable,
	countClassLinks,
	classCounts,
	countOpenClassTodos,
	createClass,
	createSemester,
	deleteClass,
	getClass,
	getUniAspectId,
	listClassRefs,
	listSemesters,
	renameSemester,
	setClassNotes,
	setUniAspectId,
	todoWritable,
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
