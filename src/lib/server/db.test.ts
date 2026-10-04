import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { getDb, openDb, resetDb } from './db';
import { migrations } from './schema';

describe('db', () => {
	it('Scenario: Fresh database is migrated', () => {
		const db = openDb(':memory:');
		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
			.all()
			.map((r) => r.name);
		expect(tables).toEqual(
			expect.arrayContaining(['aspects', 'todos', 'checklist_items', 'sprints', 'recurring_rules'])
		);
		expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: migrations.length });
		db.close();
	});

	it('Scenario: Migration 2 adds projects without touching existing data', () => {
		const dir = mkdtempSync(join(tmpdir(), 'lm-db-'));
		const path = join(dir, 'v1.db');
		const old = new DatabaseSync(path);
		old.exec('PRAGMA foreign_keys = ON');
		old.exec(migrations[0]);
		old.exec(`
			INSERT INTO aspects (id, name, color, icon, position, created_at) VALUES (1, 'IT', 'sage', 'heart', 0, 'a');
			INSERT INTO sprints (id, week_start, state, started_at) VALUES (1, '2026-09-28', 'active', 's');
			INSERT INTO recurring_rules (id, title, aspect_id, weekdays, created_at) VALUES (1, 'Rule', 1, 'mon', 'r');
			INSERT INTO todos (id, title, aspect_id, sprint_id, rule_id, created_at) VALUES (1, 'A', 1, 1, 1, 't'), (2, 'B', 1, NULL, NULL, 't');
			INSERT INTO checklist_items (id, todo_id, text, position) VALUES (1, 1, 'item', 0);
			PRAGMA user_version = 1;
		`);
		const before = {
			aspects: old.prepare('SELECT * FROM aspects').all(),
			sprints: old.prepare('SELECT * FROM sprints').all(),
			rules: old.prepare('SELECT * FROM recurring_rules').all(),
			todos: old.prepare('SELECT * FROM todos ORDER BY id').all(),
			items: old.prepare('SELECT * FROM checklist_items').all()
		};
		old.close();

		const db = openDb(path);
		expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: migrations.length });
		const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name);
		expect(tables).toEqual(expect.arrayContaining(['it_projects', 'settings']));
		expect(db.prepare('SELECT count(*) AS n FROM todos WHERE project_id IS NULL').get()).toEqual({ n: 2 });
		// Columns added by later migrations aren't part of the v1 rows.
		const strip = (rows: Record<string, unknown>[]) =>
			rows.map(({ project_id, class_id, type, revised_at, ...r }) => r);
		expect(db.prepare('SELECT * FROM aspects').all()).toEqual(before.aspects);
		expect(db.prepare('SELECT * FROM sprints').all()).toEqual(before.sprints);
		expect(strip(db.prepare('SELECT * FROM recurring_rules').all())).toEqual(before.rules);
		expect(strip(db.prepare('SELECT * FROM todos ORDER BY id').all())).toEqual(before.todos);
		expect(db.prepare('SELECT * FROM checklist_items').all()).toEqual(before.items);
		db.close();
		rmSync(dir, { recursive: true, force: true });
	});

	it('Scenario: Migration 3 adds in_progress and keeps todo links', () => {
		const dir = mkdtempSync(join(tmpdir(), 'lm-db-'));
		const path = join(dir, 'v2.db');
		const old = new DatabaseSync(path);
		old.exec('PRAGMA foreign_keys = ON');
		old.exec(migrations[0]);
		old.exec(migrations[1]);
		old.exec(`
			INSERT INTO aspects (id, name, color, icon, position, created_at) VALUES (1, 'IT', 'sage', 'heart', 0, 'a');
			INSERT INTO it_projects (id, name, status, created_at, updated_at) VALUES (1, 'P', 'active', 'c', 'u'), (2, 'Q', 'paused', 'c', 'u');
			INSERT INTO todos (id, title, aspect_id, project_id, created_at) VALUES (1, 'A', 1, 2, 't'), (2, 'B', 1, NULL, 't');
			PRAGMA user_version = 2;
		`);
		old.close();

		const db = openDb(path);
		expect(db.prepare('SELECT id, status FROM it_projects ORDER BY id').all()).toEqual([
			{ id: 1, status: 'active' },
			{ id: 2, status: 'paused' }
		]);
		expect(db.prepare('SELECT id, project_id FROM todos ORDER BY id').all()).toEqual([
			{ id: 1, project_id: 2 },
			{ id: 2, project_id: null }
		]);
		db.prepare("UPDATE it_projects SET status = 'in_progress' WHERE id = 1").run();
		expect(() => db.prepare("UPDATE it_projects SET status = 'bogus' WHERE id = 1").run()).toThrow();
		db.prepare('DELETE FROM it_projects WHERE id = 2').run();
		expect(db.prepare('SELECT project_id FROM todos WHERE id = 1').get()).toEqual({ project_id: null });
		db.close();
		rmSync(dir, { recursive: true, force: true });
	});

	it('Scenario: Migration 4 adds the Uni tables without touching existing data', () => {
		const dir = mkdtempSync(join(tmpdir(), 'lm-db-'));
		const path = join(dir, 'v3.db');
		const old = new DatabaseSync(path);
		old.exec('PRAGMA foreign_keys = ON');
		old.exec(migrations[0]);
		old.exec(migrations[1]);
		old.exec(migrations[2]);
		old.exec(`
			INSERT INTO aspects (id, name, color, icon, position, created_at) VALUES (1, 'IT', 'sage', 'heart', 0, 'a'), (2, 'Uni', 'lavender', 'cap', 1, 'a');
			INSERT INTO sprints (id, week_start, state, started_at) VALUES (1, '2026-09-28', 'active', 's');
			INSERT INTO recurring_rules (id, title, aspect_id, weekdays, created_at) VALUES (1, 'Rule', 2, '1', 'r');
			INSERT INTO it_projects (id, name, status, created_at, updated_at) VALUES (1, 'P', 'in_progress', 'c', 'u');
			INSERT INTO settings (key, value) VALUES ('it_aspect_id', '1');
			INSERT INTO todos (id, title, aspect_id, sprint_id, rule_id, project_id, created_at) VALUES
				(1, 'A', 2, 1, 1, NULL, 't'), (2, 'B', 2, NULL, NULL, NULL, 't'), (3, 'C', 1, NULL, NULL, 1, 't');
			INSERT INTO checklist_items (id, todo_id, text, position) VALUES (1, 1, 'item', 0);
			PRAGMA user_version = 3;
		`);
		const read = (d: DatabaseSync) => ({
			aspects: d.prepare('SELECT * FROM aspects ORDER BY id').all(),
			sprints: d.prepare('SELECT * FROM sprints').all(),
			projects: d.prepare('SELECT * FROM it_projects').all(),
			settings: d.prepare('SELECT * FROM settings').all(),
			items: d.prepare('SELECT * FROM checklist_items').all()
		});
		const before = {
			...read(old),
			rules: old.prepare('SELECT * FROM recurring_rules').all(),
			todos: old.prepare('SELECT * FROM todos ORDER BY id').all()
		};
		old.close();

		const db = openDb(path);
		expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 4 });
		const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name);
		expect(tables).toEqual(expect.arrayContaining(['semesters', 'classes']));
		expect(db.prepare('SELECT count(*) AS n FROM todos WHERE class_id IS NULL AND type IS NULL AND revised_at IS NULL').get()).toEqual({ n: 3 });
		expect(db.prepare('SELECT count(*) AS n FROM recurring_rules WHERE class_id IS NULL AND type IS NULL').get()).toEqual({ n: 1 });
		const { rules, todos, ...rest } = before;
		expect(read(db)).toEqual(rest);
		expect(db.prepare('SELECT id, title, aspect_id, weekdays, notes, priority, checklist, created_at FROM recurring_rules').all()).toEqual(rules);
		expect(db.prepare('SELECT * FROM todos ORDER BY id').all().map(({ class_id, type, revised_at, ...r }) => r)).toEqual(todos);
		db.close();
		rmSync(dir, { recursive: true, force: true });
	});

	it('Scenario: Reset clears the Uni tables', () => {
		const dir = mkdtempSync(join(tmpdir(), 'lm-db-'));
		process.env.DATABASE_PATH = join(dir, 'reset.db');
		const db = getDb();
		db.exec(`
			INSERT INTO aspects (id, name, color, icon, position, created_at) VALUES (1, 'Uni', 'sage', 'heart', 0, 'a');
			INSERT INTO settings (key, value) VALUES ('uni_aspect_id', '1');
			INSERT INTO semesters (id, name, created_at) VALUES (1, 'WS', 'c');
			INSERT INTO classes (id, semester_id, name, color, icon, created_at, updated_at) VALUES (1, 1, 'Analysis', 'sage', 'heart', 'c', 'u');
			INSERT INTO recurring_rules (id, title, aspect_id, weekdays, class_id, type, created_at) VALUES (1, 'Rule', 1, '1', 1, 'LEC', 'r');
			INSERT INTO todos (id, title, aspect_id, rule_id, class_id, type, revised_at, created_at) VALUES (1, 'A', 1, 1, 1, 'EXC', '2026-10-01', 't');
			INSERT INTO checklist_items (id, todo_id, text, position) VALUES (1, 1, 'item', 0);
		`);
		expect(() => resetDb()).not.toThrow();
		for (const table of ['semesters', 'classes', 'todos', 'recurring_rules', 'settings']) {
			expect(db.prepare(`SELECT count(*) AS n FROM ${table}`).get()).toEqual({ n: 0 });
		}
		db.close();
		rmSync(dir, { recursive: true, force: true });
	});
});
