import type { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Id } from '$lib/types';
import { openDb } from './db';
import {
	classWritable,
	countClassLinks,
	countOpenClassTodos,
	getUniAspectId,
	listClassRefs,
	setUniAspectId,
	todoWritable
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

beforeEach(() => {
	db = openDb(':memory:');
	const aspect = db.prepare("INSERT INTO aspects (name, color, icon, position, created_at) VALUES (?, 'sage', 'heart', ?, '')");
	health = Number(aspect.run('Health', 0).lastInsertRowid);
	uni = Number(aspect.run('Uni', 1).lastInsertRowid);
});

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
