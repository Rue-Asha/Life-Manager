import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { migrations } from './schema';

export function openDb(path: string): DatabaseSync {
	if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
	const db = new DatabaseSync(path);
	db.exec('PRAGMA foreign_keys = ON');
	db.exec('PRAGMA journal_mode = WAL');
	migrate(db);
	return db;
}

function migrate(db: DatabaseSync) {
	const { user_version } = db.prepare('PRAGMA user_version').get() as { user_version: number };
	for (let v = user_version; v < migrations.length; v++) {
		db.exec('BEGIN');
		try {
			db.exec(migrations[v]);
			db.exec(`PRAGMA user_version = ${v + 1}`);
			db.exec('COMMIT');
		} catch (err) {
			db.exec('ROLLBACK');
			throw err;
		}
	}
}

let instance: DatabaseSync | undefined;

export function getDb(): DatabaseSync {
	instance ??= openDb(process.env.DATABASE_PATH ?? './data/life-manager.db');
	return instance;
}

export function resetDb(): void {
	getDb().exec(`
		DELETE FROM checklist_items;
		DELETE FROM todos;
		DELETE FROM recurring_rules;
		DELETE FROM classes;
		DELETE FROM semesters;
		DELETE FROM settings;
		DELETE FROM it_projects;
		DELETE FROM sprints;
		DELETE FROM aspects;
	`);
}
