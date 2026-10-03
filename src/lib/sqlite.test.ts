import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';

describe('harness', () => {
	it('Scenario: Unit suite opens node:sqlite', () => {
		const db = new DatabaseSync(':memory:');
		db.exec('CREATE TABLE t (v TEXT)');
		db.prepare('INSERT INTO t (v) VALUES (?)').run('hello');
		expect(db.prepare('SELECT v FROM t').get()).toEqual({ v: 'hello' });
		db.close();
	});
});
