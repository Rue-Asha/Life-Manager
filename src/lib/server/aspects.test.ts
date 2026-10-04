import { describe, expect, it } from 'vitest';
import { openDb } from './db';
import {
	aspectUsage,
	countAspects,
	createAspect,
	deleteAspect,
	listAspects,
	updateAspect
} from './aspects';
import type { AspectInput, Id } from '$lib/types';
import { getItAspectId, setItAspectId } from './projects';
import { getUniAspectId, setUniAspectId } from './uni';

const health: AspectInput = { name: 'Health', color: 'sage', icon: 'heart' };
const uni: AspectInput = { name: 'Uni', color: 'lavender', icon: 'cap' };

function create(db: ReturnType<typeof openDb>, input: AspectInput): Id {
	const r = createAspect(db, input);
	if (!r.ok) throw new Error(r.error);
	return r.value.id;
}

describe('aspects', () => {
	it('Scenario: Duplicate aspect name is rejected', () => {
		const db = openDb(':memory:');
		create(db, health);
		const uniId = create(db, uni);

		expect(createAspect(db, { ...uni, name: 'health' })).toEqual({
			ok: false,
			error: 'duplicate',
			field: 'name'
		});
		expect(updateAspect(db, uniId, { ...uni, name: 'health' })).toEqual({
			ok: false,
			error: 'duplicate',
			field: 'name'
		});
		expect(listAspects(db).map((a) => a.name)).toEqual(['Health', 'Uni']);
	});

	it('treats names differing only in non-ASCII case as duplicates', () => {
		const db = openDb(':memory:');
		const id = create(db, { ...health, name: 'Ärzte' });
		expect(createAspect(db, { ...uni, name: 'ärzte' })).toEqual({ ok: false, error: 'duplicate', field: 'name' });
		expect(updateAspect(db, create(db, uni), { ...uni, name: 'ÄRZTE' })).toEqual({
			ok: false,
			error: 'duplicate',
			field: 'name'
		});
		expect(updateAspect(db, id, { ...health, name: 'ärzte' })).toMatchObject({ ok: true, value: { name: 'ärzte' } });
	});

	it('creates aspects in order with trimmed names', () => {
		const db = openDb(':memory:');
		const r = createAspect(db, { ...health, name: '  Health ' });
		expect(r).toEqual({ ok: true, value: { id: expect.any(Number), ...health, position: 0 } });
		create(db, uni);
		expect(listAspects(db).map((a) => [a.name, a.position])).toEqual([
			['Health', 0],
			['Uni', 1]
		]);
		expect(countAspects(db)).toBe(2);
	});

	it('rejects empty names and unknown colours or icons', () => {
		const db = openDb(':memory:');
		expect(createAspect(db, { ...health, name: '   ' })).toEqual({ ok: false, error: 'required', field: 'name' });
		expect(createAspect(db, { ...health, color: 'neon' as never })).toEqual({
			ok: false,
			error: 'required',
			field: 'color'
		});
		expect(createAspect(db, { ...health, icon: 'rocket' as never })).toEqual({
			ok: false,
			error: 'required',
			field: 'icon'
		});
		expect(countAspects(db)).toBe(0);
	});

	it('updates name, colour and icon; keeping its own name is not a duplicate', () => {
		const db = openDb(':memory:');
		const id = create(db, health);
		expect(updateAspect(db, id, { name: 'HEALTH', color: 'sky', icon: 'leaf' })).toEqual({
			ok: true,
			value: { id, name: 'HEALTH', color: 'sky', icon: 'leaf', position: 0 }
		});
		expect(updateAspect(db, id + 99, health)).toEqual({ ok: false, error: 'not-found' });
	});

	it('counts todos and rules using an aspect', () => {
		const db = openDb(':memory:');
		const id = create(db, health);
		const now = new Date().toISOString();
		db.prepare('INSERT INTO todos (title, aspect_id, created_at) VALUES (?, ?, ?)').run('Run', id, now);
		db.prepare('INSERT INTO todos (title, aspect_id, created_at) VALUES (?, ?, ?)').run('Stretch', id, now);
		db.prepare(
			'INSERT INTO recurring_rules (title, aspect_id, weekdays, created_at) VALUES (?, ?, ?, ?)'
		).run('Gym', id, '1,3', now);
		expect(aspectUsage(db, id)).toEqual({ todos: 2, rules: 1 });
	});

	describe('delete', () => {
		const now = new Date().toISOString();

		function insertTodo(db: ReturnType<typeof openDb>, aspectId: Id, sprintId: Id | null, status: string, day: string | null) {
			const { lastInsertRowid } = db
				.prepare('INSERT INTO todos (title, aspect_id, sprint_id, status, day, created_at) VALUES (?, ?, ?, ?, ?, ?)')
				.run('t', aspectId, sprintId, status, day, now);
			return Number(lastInsertRowid);
		}

		function insertRule(db: ReturnType<typeof openDb>, aspectId: Id) {
			const { lastInsertRowid } = db
				.prepare('INSERT INTO recurring_rules (title, aspect_id, weekdays, created_at) VALUES (?, ?, ?, ?)')
				.run('Gym', aspectId, '1,3', now);
			return Number(lastInsertRowid);
		}

		it('Scenario: Deleting an aspect moves its todos and rules', () => {
			const db = openDb(':memory:');
			const a = create(db, health);
			const b = create(db, uni);
			const sprint = Number(
				db.prepare("INSERT INTO sprints (week_start, state) VALUES ('2026-09-28', 'active')").run().lastInsertRowid
			);
			const t1 = insertTodo(db, a, sprint, 'doing', '2026-09-29');
			const t2 = insertTodo(db, a, null, 'todo', null);
			const rule = insertRule(db, a);

			expect(deleteAspect(db, a, b)).toEqual({ ok: true, value: undefined });

			expect(listAspects(db).map((x) => x.id)).toEqual([b]);
			const todos = db.prepare('SELECT id, aspect_id, sprint_id, status, day FROM todos ORDER BY id').all();
			expect(todos.map((t) => ({ ...t }))).toEqual([
				{ id: t1, aspect_id: b, sprint_id: sprint, status: 'doing', day: '2026-09-29' },
				{ id: t2, aspect_id: b, sprint_id: null, status: 'todo', day: null }
			]);
			expect({ ...db.prepare('SELECT aspect_id FROM recurring_rules WHERE id = ?').get(rule) }).toEqual({
				aspect_id: b
			});
		});

		it('Scenario: Deleting the IT aspect unsets the setting', () => {
			const db = openDb(':memory:');
			const a = create(db, health);
			const b = create(db, uni);
			setItAspectId(db, a);
			const project = Number(
				db
					.prepare("INSERT INTO it_projects (name, created_at, updated_at) VALUES ('P', '', '')")
					.run().lastInsertRowid
			);
			const t = insertTodo(db, a, null, 'todo', null);
			db.prepare('UPDATE todos SET project_id = ? WHERE id = ?').run(project, t);

			expect(deleteAspect(db, a, b).ok).toBe(true);

			expect(getItAspectId(db)).toBeNull();
			expect(db.prepare('SELECT count(*) AS n FROM settings').get()).toEqual({ n: 0 });
			expect({ ...db.prepare('SELECT project_id FROM todos WHERE id = ?').get(t) }).toEqual({ project_id: null });
			const reused = create(db, { ...health, name: 'Later' });
			expect(getItAspectId(db)).toBeNull();
			expect(reused).not.toBe(a);
		});

		it('Scenario: Deleting the Uni aspect unsets the setting', () => {
			const db = openDb(':memory:');
			const a = create(db, health);
			const b = create(db, uni);
			setUniAspectId(db, b);
			const semester = Number(db.prepare("INSERT INTO semesters (name, created_at) VALUES ('WS', '')").run().lastInsertRowid);
			const cls = Number(
				db
					.prepare("INSERT INTO classes (semester_id, name, color, icon, created_at, updated_at) VALUES (?, 'Analysis', 'sky', 'book', '', '')")
					.run(semester).lastInsertRowid
			);
			const t = insertTodo(db, b, null, 'todo', null);
			db.prepare("UPDATE todos SET class_id = ?, type = 'LEC', revised_at = '2026-10-01' WHERE id = ?").run(cls, t);
			const rule = insertRule(db, b);
			db.prepare("UPDATE recurring_rules SET class_id = ?, type = 'EXC' WHERE id = ?").run(cls, rule);

			expect(deleteAspect(db, b, a).ok).toBe(true);

			expect(getUniAspectId(db)).toBeNull();
			expect(db.prepare("SELECT count(*) AS n FROM settings WHERE key = 'uni_aspect_id'").get()).toEqual({ n: 0 });
			expect({ ...db.prepare('SELECT aspect_id, class_id, type, revised_at FROM todos WHERE id = ?').get(t) }).toEqual({
				aspect_id: a,
				class_id: null,
				type: null,
				revised_at: null
			});
			expect({ ...db.prepare('SELECT aspect_id, class_id, type FROM recurring_rules WHERE id = ?').get(rule) }).toEqual({
				aspect_id: a,
				class_id: null,
				type: null
			});
			create(db, { ...health, name: 'Later' });
			expect(getUniAspectId(db)).toBeNull();
		});

		it('Scenario: Rule follows its deleted aspect', () => {
			const db = openDb(':memory:');
			const a = create(db, health);
			const b = create(db, uni);
			const rule = insertRule(db, a);

			expect(deleteAspect(db, a, b).ok).toBe(true);
			expect({ ...db.prepare('SELECT aspect_id FROM recurring_rules WHERE id = ?').get(rule) }).toEqual({
				aspect_id: b
			});
		});

		it('deletes an unused aspect without a target', () => {
			const db = openDb(':memory:');
			const a = create(db, health);
			expect(deleteAspect(db, a)).toEqual({ ok: true, value: undefined });
			expect(countAspects(db)).toBe(0);
		});

		it('requires a valid target when the aspect is in use', () => {
			const db = openDb(':memory:');
			const a = create(db, health);
			create(db, uni);
			insertTodo(db, a, null, 'todo', null);
			expect(deleteAspect(db, a)).toEqual({ ok: false, error: 'target-required', field: 'targetId' });
			expect(deleteAspect(db, a, a)).toEqual({ ok: false, error: 'target-required', field: 'targetId' });
			expect(deleteAspect(db, a, a + 99)).toEqual({ ok: false, error: 'not-found', field: 'targetId' });
			expect(countAspects(db)).toBe(2);
		});

		it('refuses to delete the only aspect while it is in use', () => {
			const db = openDb(':memory:');
			const a = create(db, health);
			insertRule(db, a);
			expect(deleteAspect(db, a)).toEqual({ ok: false, error: 'only-aspect-in-use' });
			expect(countAspects(db)).toBe(1);
		});

		it('reports a missing aspect', () => {
			const db = openDb(':memory:');
			expect(deleteAspect(db, 1)).toEqual({ ok: false, error: 'not-found' });
		});
	});
});
