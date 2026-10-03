import { describe, expect, it } from 'vitest';
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
});
