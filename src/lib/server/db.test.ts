import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDb } from './db';
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
		const strip = (rows: Record<string, unknown>[]) => rows.map(({ project_id, ...r }) => r);
		expect(db.prepare('SELECT * FROM aspects').all()).toEqual(before.aspects);
		expect(db.prepare('SELECT * FROM sprints').all()).toEqual(before.sprints);
		expect(db.prepare('SELECT * FROM recurring_rules').all()).toEqual(before.rules);
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
});
